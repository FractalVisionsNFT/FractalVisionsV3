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
  const EnglishAuctionsLogic = await ethers.getContractFactory("EnglishAuctionsLogic");
  const englishAuctionsLogic = await EnglishAuctionsLogic.deploy(wETH.address);
 
  await englishAuctionsLogic.deployed();

  console.log(`englishAuctionsLogic contract is deployed to ${englishAuctionsLogic.address}`);
  
    
  /*****************************8 */
  let plugin = [];

  console.log('Deploying facets')
  const FacetNames = [
    'EnglishAuctionsLogic'
  ]

  for (const FacetName of FacetNames) {

    const funcName = functionName(EnglishAuctionsLogic);

    for (let i = 0; i < funcName[0].length; i++) {
  
    plugin.push([
     getSelectors(EnglishAuctionsLogic)[i],
     funcName[0][i],
     englishAuctionsLogic.address  
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
/********************create Auction and Bid Auction method****************/
const EnglishAuctionsLogicInteract = EnglishAuctionsLogic.attach(marketplaceAddress);

/********** */
const currentTime = (await ethers.provider.getBlock("latest")).timestamp
console.log("latest ", currentTime)

const AuctionParam = {
  assetContract: testNft.address,
  tokenId: 0,
  quantity: 1,
  currency: testToken.address,
  minimumBidAmount: ethers.utils.parseEther("1"), // starting bidding price
  buyoutBidAmount: ethers.utils.parseEther("20"), // buyout price //the auction will end immediately if a user pays this price.
  timeBufferInSeconds : 60, // time buffer in seconds
  bidBufferBps: 1000, // bid buffer in basis points
  startTimestamp: currentTime, // start time of the auction
  endTimestamp : currentTime + 1000, // end time of the auction
}
const c8list = await EnglishAuctionsLogicInteract.connect(tester1).createAuction(AuctionParam)
console.log("create Auction successfull", c8list )
const txreceipt =  await c8list.wait()
console.log("tx receipt", txreceipt)
//@ts-ignore
const txargs = txreceipt.events[1].args;
console.log("tx txargs", txargs)
//@ts-ignore
const auctionId = await txargs.auctionId

//verify transfer of nft to the marketplace
const ownerofNFT = await TestNftInteract.ownerOf(0)
console.log("owner of nft ", ownerofNFT)

//verify Auction listing
const totalAuction = await EnglishAuctionsLogicInteract.totalAuctions();
console.log("total auction ", totalAuction)


/*****************Create Bids***************** */
// bids are created in the currency accepted by the lister
// Bids cannot be canceled once they've been made.


/*************Bids******* */
//Bid params

//getting auction parameter
const auctionDetails = await EnglishAuctionsLogicInteract.getAuction(auctionId);
console.log("Auction Details ", auctionDetails)


const auctionid = auctionDetails.auctionId ;
const bidamount = ethers.utils.parseEther("5");


const createBid = await EnglishAuctionsLogicInteract.connect(tester2).bidInAuction(auctionid, bidamount)
console.log("bids created successfully ", createBid)


/*******************Get current winning bid************* */
const winningBid = await EnglishAuctionsLogicInteract.getWinningBid(auctionId);
console.log("winning bid ", winningBid);


//note if the auction time has not ended and there is a bid. the auction cannot be closed
// /**********************Close Auction****************** */
// the winner and the auctionier needs to close auction for payout.

// When the auction has ended and the Auction creator clicks on collectAuctionPayout. the token(amount) is sent to him/her and the platform fee is sent to the platform address, the royalty payment is made also.;
//when the auction has ended and the winner clicks on close collectAuctionTokens.. the nft is sent.

        //advance time to end the auction
       await helpers.time.increase(auctionDetails.endTimestamp);

         /***************Check if Auction closed succesfully********************* */
  const isAuctionExpired = await EnglishAuctionsLogicInteract.isAuctionExpired(auctionid);
  console.log("isAuctionExpired ", isAuctionExpired)


 const collectAuctionPayout = await EnglishAuctionsLogicInteract.connect(tester1).collectAuctionPayout(auctionid)
  console.log("Auction closed successfully for auctionier ", collectAuctionPayout)


  const collectAuctionTokens = await EnglishAuctionsLogicInteract.connect(tester3).collectAuctionTokens(auctionid)
  console.log("Auction closed successfully for bidder", collectAuctionTokens)


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
