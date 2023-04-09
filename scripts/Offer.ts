import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { getSelectors, functionName } = require('./libraries/diamond.js')

async function main() {
  const [deployer, tester1, tester2, tester3, tester4] = await ethers.getSigners()
  
    /*********************Deploy Forwarder*************************** */
    const Forwarder = await ethers.getContractFactory("Forwarder");
    const forwarder = await Forwarder.deploy();
   
     await forwarder.deployed();
   
     console.log(`Forwarder contract is deployed to ${forwarder.address}`);

   // /*********************Deploy WETH*************************** */
  const WETH = await ethers.getContractFactory("WETH");
  const wETH = await WETH.deploy();
  
  await wETH.deployed();

  console.log(` WETH contract is deployed to ${wETH.address}`);

  /*****************Deploy English Auction************************** */
  const OffersLogic = await ethers.getContractFactory("OffersLogic");
  const offersLogic = await OffersLogic.deploy();
 
  await offersLogic.deployed();

  console.log(`OffersLogic contract is deployed to ${offersLogic.address}`);
  
    
  /*****************************8 */
  let plugin = [];

  console.log('Deploying facets')
  const FacetNames = [
    'OffersLogic'
  ]

  for (const FacetName of FacetNames) {

    const funcName = functionName(OffersLogic);

    for (let i = 0; i < funcName[0].length; i++) {
  
    plugin.push([
     getSelectors(OffersLogic)[i],
     funcName[0][i],
     offersLogic.address  
    ])
  }
  }



  const PluginMap = await ethers.getContractFactory("PluginMap");
  //@ts-ignore
  const pluginMap = await PluginMap.deploy(plugin);
 
  await pluginMap.deployed();

  console.log(`PluginMap contract is deployed to ${pluginMap.address}`);

  /*********************Deploy Marketplace*************************** */
  const MarketplaceV3 = await ethers.getContractFactory("MarketplaceV3");
  const marketplaceV3 = await MarketplaceV3.deploy(pluginMap.address);
  
  await marketplaceV3.deployed();

  console.log(`Marketplace contract is deployed to ${marketplaceV3.address}`);

  /*********************Deploy ByteGetter*************** */

    /*********************Deploy byteGetter*************************** */
    const byteGetter = await ethers.getContractFactory("byteGenerator");
    const ByteGetter = await byteGetter.deploy();
    
    await ByteGetter.deployed();
    console.log(`ByteGetter contract is deployed to ${ByteGetter.address}`);
  

    const contractURi = "ipfs://QmSSQxQQGynYeYiWVvmz7Nq9VnazX9uHbeQBiwjtMiguSF/04";
    const platformFee = 500; //5%
     /*************INTeract*********** */
    const ByteGetterInteract = byteGetter.attach(ByteGetter.address);
    const getBytes = await ByteGetterInteract.callStatic.getBytes("Marketplace");
  
    const getEncodeData = await ByteGetterInteract.callStatic.getEncodeCall(deployer.address, contractURi, [forwarder.address], deployer.address, platformFee)

    /*********************Deploy tWProxy*************************** */
    const TWProxy = await ethers.getContractFactory("TWProxy");
    const tWProxy = await TWProxy.deploy(marketplaceV3.address, getEncodeData);
    
    await tWProxy.deployed();
  
    console.log(`Marketplace contract is deployed to ${tWProxy.address}`);

    /****************marketple interact************** */
    const nftMarketplace = MarketplaceV3.attach(tWProxy.address)

    const platformfe = await nftMarketplace.callStatic.getPlatformFeeInfo()
    console.log("contract platform fee: ", platformfe)

    const uri = await nftMarketplace.callStatic.contractURI()
    console.log("contract uri: ", uri)
    const marketplaceAddress = tWProxy.address;





    /*####################################################*/
    /************************** CreateDummy NFT and TestToken******************************** */
const TestNft = await ethers.getContractFactory("TestNft");
const testNft = await TestNft.deploy();

await testNft.deployed();

console.log(`NFT contract is deployed to ${testNft.address}`);

/*********************************** */
const TestToken = await ethers.getContractFactory("TestToken");
const testToken = await TestToken.deploy();

await testToken.deployed();

console.log(`TESTToken contract is deployed to ${testToken.address}`);


/************************Minting and approval************* */
const TestNftInteract = TestNft.attach(testNft.address)

const mint =  await TestNftInteract.safeMint(tester1.address)
const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)


console.log("approval succesfull ", nftApproval)

/******************** */
const amt = ethers.utils.parseEther("40")
const TestTokenInteract = TestToken.attach(testToken.address)

const mintToken = await TestTokenInteract.mint(tester2.address, amt)

const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

console.log("token approval ", tokenApproval)

   /*****************************************************************************/
/********************create Offder ****************/
const OffersLogicInteract = OffersLogic.attach(marketplaceAddress);

/********** */
const currentTime = (await ethers.provider.getBlock("latest")).timestamp
console.log("latest ", currentTime)

const OfferParam = {
  assetContract: testNft.address,
  tokenId: 0,
  quantity: 1,
  currency: testToken.address,
  totalPrice: ethers.utils.parseEther("15"), // offer price
  expirationTimestamp : currentTime + 432000, // end time of offer 5 days
}
const c8list = await OffersLogicInteract.connect(tester2).makeOffer(OfferParam)
console.log("create Auction successfull", c8list )
const txreceipt =  await c8list.wait()
console.log("tx receipt", txreceipt)
//@ts-ignore
const txargs = txreceipt.events[0].args;
console.log("tx txargs", txargs)
//@ts-ignore
const offerId = await txargs.offerId


//verify Offer created
const totalOffers = await OffersLogicInteract.totalOffers();
console.log("total offer", totalOffers)


//getting auction parameter
const offerDetails = await OffersLogicInteract.getOffer(offerId);
console.log("Offer Details ", offerDetails)


const offerid = offerDetails.offerId;
console.log("auction id ", offerid)


const acceptOffer = await OffersLogicInteract.connect(tester1).acceptOffer(offerid)
console.log("accept Offer successfully ", acceptOffer)


/*******************GetAllOffers within a specified range**************/
const getAllOffers = await OffersLogicInteract.getAllOffers(offerid, 0);
console.log("getAllOffers ", getAllOffers);



/**************Balance Check*********************** */
console.log("all adrresses ", deployer.address, " tester1",  tester1.address, "tester2", tester2.address)

const tester1bal = await TestTokenInteract.connect(tester1).callStatic.balanceOf(tester1.address)

console.log("token balance of nft owner ", tester1bal)
//should get the money 

/*********** */
const platformFeeRecipientbal = await TestTokenInteract.connect(deployer).callStatic.balanceOf(deployer.address)
const nftbal = await TestNftInteract.connect(tester2).callStatic.balanceOf(tester2.address)
const nftowner = await TestNftInteract.connect(tester2).callStatic.ownerOf(0)
//balance should increase by 1 and nftowner should be tester4 addr

console.log("Platfrom Fee Recipient Balance ", platformFeeRecipientbal)
console.log("balance of bidder: ", nftbal)
console.log("nft owner of token id 1: ", nftowner)


}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
