import { ethers } from "hardhat";
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

        /*********************Deploy DirectListingsLogic*************************** */
  const DirectListingsLogic = await ethers.getContractFactory("DirectListingsLogic");
  const directListingsLogic = await DirectListingsLogic.deploy(wETH.address);
 
  await directListingsLogic.deployed();

  console.log(`DirectListing contract is deployed to ${directListingsLogic.address}`);

  
  /*****************************8 */
  let plugin = [];

  console.log('Deploying facets')
  const FacetNames = [
    'DirectListingsLogic'
  ]

  for (const FacetName of FacetNames) {

    const funcName = functionName(DirectListingsLogic);

    for (let i = 0; i < funcName[0].length; i++) {
  
    plugin.push([
     getSelectors(directListingsLogic)[i],
     funcName[0][i],
     directListingsLogic.address  
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
    const DirectListingsLogicInteract = DirectListingsLogic.attach(marketplaceAddress)

    /************************** CreateDummy NFT and TestToken******************************** */
const TestNft = await ethers.getContractFactory("TestNft");
const testNft = await TestNft.deploy();

await testNft.deployed();

console.log(`testNft contract is deployed to ${testNft.address}`);

/*********************************** */
const TestToken = await ethers.getContractFactory("TestToken");
const testToken = await TestToken.deploy();

await testToken.deployed();

console.log(`testToken contract is deployed to ${testToken.address}`);


/************************Minting and approval************* */
const TestNftInteract = TestNft.attach(testNft.address)
              await TestNftInteract.safeMint(tester1.address)
const mint = await TestNftInteract.safeMint(tester3.address)

                    await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
const nftApproval = await TestNftInteract.connect(tester3).setApprovalForAll(marketplaceAddress, true)


console.log("approval succesfull ", nftApproval)

/******************** */
const amt = ethers.utils.parseEther("40")
const TestTokenInteract = TestToken.attach(testToken.address)

const mintToken = await TestTokenInteract.mint(tester2.address, amt)

const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

console.log("token approval ", tokenApproval)



/*********************Create Listing************************* */
const currentTime = (await ethers.provider.getBlock("latest")).timestamp
console.log("latest ", currentTime)

const listingParams = {
  assetContract: testNft.address,
  tokenId: 0,
  quantity: 1,
  currency: testToken.address,
  pricePerToken: ethers.utils.parseEther("10"),
  startTimestamp: currentTime,
  endTimestamp: currentTime + (1 * 24 * 60 * 60), //1 day
  reserved: false
}

const c8list = await DirectListingsLogicInteract.connect(tester1).createListing(listingParams)
console.log("create listen successfull ", c8list)

/************get total Listing************ */
const totalListing = await DirectListingsLogicInteract.totalListings()
console.log("total listing ", totalListing)


/***********************  Get Listing************************************* */
const listingres = await DirectListingsLogicInteract.getListing(0)
// const getListing = await listingres.wait()

console.log("get listing ", listingres)



/***********************Buy************************ */
        // define the parameters for buying the listing
        const listingId = 0;
        const buyFor = tester2.address;
        const quantityToBuy = 1;
        const currency = testToken.address;
        const totalPrice = ethers.utils.parseEther("10"); 

const buyNft = await DirectListingsLogicInteract.connect(tester2).buyFromListing(listingId, buyFor,quantityToBuy, currency, totalPrice)

console.log("buy successful ", buyNft)


/**************************Check balance********************/
console.log("all adrresses ", deployer.address, " tester1",  tester1.address, "tester2", tester2.address)

const tester1bal = await TestTokenInteract.connect(tester1).callStatic.balanceOf(tester1.address)

console.log("balace of Lister", tester1bal)
//should get the money 

/*********** */
const platformFeeRecipientbal = await TestTokenInteract.connect(deployer).callStatic.balanceOf(deployer.address)
const nftbal = await TestNftInteract.connect(tester2).callStatic.balanceOf(tester2.address)
const nftowner = await TestNftInteract.connect(tester2).callStatic.ownerOf(0)
//balance should increase by 1 and nftowner should be testr2 addr

console.log("Platfrom Fee Recipient Balance ", platformFeeRecipientbal)
console.log("NFT balance of tester 2: ", nftbal)
console.log("nft owner of token id 0: ", nftowner)

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
