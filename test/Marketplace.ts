import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const Wallet =  require("@ethersproject/contracts");
import { ethers } from "hardhat";
const { getSelectors, functionName } = require('../scripts/libraries/diamond.js')
import { hours } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration";


describe("Marketplace", () => {

  async function deployMarketplace() {
    const [deployer, tester1, tester2, tester3] = await ethers.getSigners()
  
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

  /*****************Deploy English Auction************************** */
  const EnglishAuctionsLogic = await ethers.getContractFactory("EnglishAuctionsLogic");
  const englishAuctionsLogic = await EnglishAuctionsLogic.deploy(wETH.address);
 
  await englishAuctionsLogic.deployed();

  console.log(`englishAuctionsLogic contract is deployed to ${englishAuctionsLogic.address}`);

  /*****************Deploy Offers************************** */
  const OffersLogic = await ethers.getContractFactory("OffersLogic");
  const offersLogic = await OffersLogic.deploy();
  
  await offersLogic.deployed();

  console.log(`offersLogic contract is deployed to ${offersLogic.address}`);


  let plugin = [];

const FacetNames = [  'DirectListingsLogic',  'EnglishAuctionsLogic',  'OffersLogic']

for (const FacetName of FacetNames) {
  const funcName = functionName(eval(FacetName));

  for (let i = 0; i < funcName[0].length; i++) {
    let deployedFacet = FacetName.charAt(0).toLowerCase() + FacetName.slice(1);
    //console.log("facet name: ", FacetName, eval(deployedFacet).address , funcName[0][i] );
    plugin.push([
      getSelectors(eval(FacetName))[i],
      funcName[0][i],
      eval(deployedFacet).address  
    ])
  }
}

//console.log("plugin: ", plugin)

function removeDuplicateRows(plugin: any[]) {
  const uniqueValues: any = {};
  for (let i = 0; i < plugin.length; i++) {
    const value = plugin[i][1];
    if (uniqueValues[value]) {
      plugin.splice(i, 1);
      i--;
    } else {
      uniqueValues[value] = true;
    }
  }
  return plugin;
}

console.log("new plugin", removeDuplicateRows(plugin));
 

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

    const marketplaceAddress = tWProxy.address;

     /*####################################################*/
     const DirectListingsLogicInteract = DirectListingsLogic.attach(marketplaceAddress)
     const EnglishAuctionsLogicInteract = EnglishAuctionsLogic.attach(marketplaceAddress)
     const OffersLogicInteract = OffersLogic.attach(marketplaceAddress)
     const nftMarketplace = MarketplaceV3.attach(marketplaceAddress)


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
 /******************** */
 const amt = ethers.utils.parseEther("40")
 const TestTokenInteract = TestToken.attach(testToken.address)
 
 const mintToken = await TestTokenInteract.mint(tester2.address, amt)
 const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)
await TestTokenInteract.connect(tester3).approve(marketplaceAddress, amt)

 //console.log("token approval ", tokenApproval)


  return {marketplaceAddress, DirectListingsLogic, nftMarketplace, EnglishAuctionsLogic,  OffersLogic, contractURi, platformFee, deployer, tester1, tester2, tester3, testNft, testToken, DirectListingsLogicInteract,EnglishAuctionsLogicInteract,OffersLogicInteract };

  };



  it("should assert that the contract was deployed properly", async () => {

    const { marketplaceAddress, contractURi, platformFee, deployer, nftMarketplace} = await loadFixture(deployMarketplace);
    const default_admin_role = "0x0000000000000000000000000000000000000000000000000000000000000000";

  // Assert the values of the contract state
  expect(await nftMarketplace.contractURI()).to.equal(contractURi);
  expect(await nftMarketplace.callStatic.getPlatformFeeInfo()).to.deep.equal([deployer.address, platformFee]);
  expect(await nftMarketplace.hasRole(default_admin_role, deployer.address)).to.eq(true);
  // expect(await nftMarketplace.timeBuffer()).to.equal(900);
  // expect(await nftMarketplace.bidBufferBps()).to.equal(500);

  });




  it("should create a Direct listing", async () => {
    const { marketplaceAddress, testNft, testToken, tester1, DirectListingsLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");


    /********** */
    const currentTime = (await ethers.provider.getBlock("latest")).timestamp
    console.log("latest ", currentTime)

    const listingParams = {
      assetContract: testNft.address,
      tokenId: 0,
      quantity: 1,
      currency: testToken.address,
      pricePerToken: price,
      startTimestamp: currentTime,
      endTimestamp: currentTime + (1 * 24 * 60 * 60), //1 day
      reserved: false
    }
    

    const tx = await DirectListingsLogicInteract.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId
    

    const listing = await DirectListingsLogicInteract.getListing(listingId);
    expect(listing.listingId).to.eq(0);
    expect(listing.listingCreator).to.eq(tester1.address);
    expect(listing.assetContract).to.eq(testNft.address);
    expect(listing.quantity).to.eq(1);
    expect(listing.currency).to.eq(testToken.address);
    expect(listing.pricePerToken).to.eq(price);
    expect(listing.quantity).to.eq(1);
    expect(listing.startTimestamp).to.be.within(currentTime, currentTime +10);
    expect(listing.endTimestamp).to.be.within(currentTime + (1 * 24 * 60 * 60), currentTime + (1 * 24 * 60 * 60) + 10);
    //status 1 is CREATED
    expect(listing.status).to.eq(1);
  });

  it("should update a listing", async () => {
    const {marketplaceAddress, testNft, testToken, tester1, DirectListingsLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");

    /********** */
    const currentTime = (await ethers.provider.getBlock("latest")).timestamp
    console.log("latest ", currentTime)

    const listingParams = {
      assetContract: testNft.address,
      tokenId: 0,
      quantity: 1,
      currency: testToken.address,
      pricePerToken: price,
      startTimestamp: currentTime + (1 * 24 * 60 * 60), //1 day
      endTimestamp: currentTime + (5 * 24 * 60 * 60), //5 day
      reserved: false
    }
    

    const tx = await DirectListingsLogicInteract.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

        
        const newprice = ethers.utils.parseEther("50");
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken2 = await TestToken.deploy();

        await testToken2.deployed();


        const updatePrams = {
          assetContract: testNft.address,
          tokenId: 0,
          quantity: 1,
          currency: testToken2.address,
          pricePerToken: newprice,
          startTimestamp: currentTime,
          endTimestamp: currentTime + (1 * 24 * 60 * 60), //1 day
          reserved: false
        }


    await DirectListingsLogicInteract.connect(tester1).updateListing(listingId ,updatePrams);

    const listing = await DirectListingsLogicInteract.getListing(listingId);
    expect(listing.listingId).to.eq(0);
    expect(listing.listingCreator).to.eq(tester1.address);
    expect(listing.assetContract).to.eq(testNft.address);
    expect(listing.quantity).to.eq(1);
    expect(listing.currency).to.eq(testToken2.address);
    expect(listing.pricePerToken).to.eq(newprice);
    expect(listing.quantity).to.eq(1);
    expect(listing.startTimestamp).to.be.within(currentTime, currentTime +10);
    expect(listing.endTimestamp).to.be.within(currentTime + (1 * 24 * 60 * 60), currentTime + (1 * 24 * 60 * 60) + 10);
    //status 1 is CREATED
    expect(listing.status).to.eq(1);
  });


  it("should cancel a direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2, DirectListingsLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");


    /********** */
    const currentTime = (await ethers.provider.getBlock("latest")).timestamp
    console.log("latest ", currentTime)

    const listingParams = {
      assetContract: testNft.address,
      tokenId: 0,
      quantity: 1,
      currency: testToken.address,
      pricePerToken: price,
      startTimestamp: currentTime,
      endTimestamp: currentTime + (1 * 24 * 60 * 60), //1 day
      reserved: false
    }
    

    const tx = await DirectListingsLogicInteract.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

    // try to cancel the listing from an address that's not the creator of the listing
    await expect(DirectListingsLogicInteract.connect(tester2).cancelListing(listingId)).to.be.revertedWith("Marketplace: not listing creator.");

    await DirectListingsLogicInteract.connect(tester1).cancelListing(listingId);

    const listing = await DirectListingsLogicInteract.getListing(listingId);
    //sttatus 3 is cancelled
    expect(listing.status).to.eq(3);
  });


  /// @dev Lets an account buy a given quantity of tokens from a listing.
  it("should buy a direct listing", async () => {
    const {marketplaceAddress, deployer, testNft, testToken, tester1, tester2, DirectListingsLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");

    /********** */
    const currentTime = (await ethers.provider.getBlock("latest")).timestamp
    console.log("latest ", currentTime)

    const listingParams = {
      assetContract: testNft.address,
      tokenId: 0,
      quantity: 1,
      currency: testToken.address,
      pricePerToken: price,
      startTimestamp: currentTime,
      endTimestamp: currentTime + (1 * 24 * 60 * 60), //1 day
      reserved: false
    }
    

    const tx = await DirectListingsLogicInteract.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

    /*************************** */
    /******************** */
    const amt = ethers.utils.parseEther("40")
    const TestToken = await ethers.getContractFactory("TestToken");
    const TestTokenInteract = TestToken.attach(testToken.address)

    const mintToken = await TestTokenInteract.mint(tester2.address, amt)
    const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

    // define the parameters for buying the listing
      const buyFor = tester2.address;
      const quantityToBuy = 1;
      const currency = testToken.address;
      const totalPrice = price; 


    await DirectListingsLogicInteract.connect(tester2).buyFromListing(listingId, buyFor,quantityToBuy, currency, totalPrice);

   
      //expect that the buyer get the nft
    expect(await TestNftInteract.ownerOf(0)).to.be.equal(tester2.address)

   // 5% - platfrm fee. =  5% of 10 * 1e18 = 5 * 1e17
   //1000 - 50
   // lister get = 9.5*10^18
    //expext that the seller gets it's money
    const listerget =  ethers.utils.parseEther("9.5")
    expect(await TestTokenInteract.balanceOf(tester1.address)).to.be.equal(listerget)

    //check that the admin get it's own commision
    const platformget =  ethers.utils.parseEther("0.5")
    expect(await TestTokenInteract.balanceOf(deployer.address)).to.be.equal(platformget)

    const listing = await DirectListingsLogicInteract.getListing(listingId);

    //check that the listing isn't available again
    expect(listing.quantity).to.eq(0);
        //sttatus 3 is cancelled
        expect(listing.status).to.eq(2);
  });





//----------------------------------OFFER Test--------------------------------------//

  it("Offer", async () => {
    const { marketplaceAddress, testNft, testToken, tester1, tester2, OffersLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

    const amounttopay = ethers.utils.parseEther("5");
        /********** */
        const currentTime = (await ethers.provider.getBlock("latest")).timestamp
       // console.log("latest ", currentTime)

    const OfferParams = {
        assetContract : testNft.address,
        tokenId : 0,
        quantity : 1,
        currency : testToken.address,
        totalPrice : amounttopay,
        expirationTimestamp : currentTime + (1 * 24 * 60 * 60), //1 day;
    }

   const tx = await OffersLogicInteract.connect(tester2).makeOffer(OfferParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const offerId = await txargs.offerId

    expect(await OffersLogicInteract.totalOffers()).to.eq(1);

    const offer = await OffersLogicInteract.getOffer(offerId);


    expect(offer.offerId).to.eq(offerId);
    expect(offer.offeror).to.eq(tester2.address);
    expect(offer.assetContract).to.eq(testNft.address);
    expect(offer.offeror).to.eq(tester2.address);
    expect(offer.tokenId).to.eq(0);
    expect(offer.quantity).to.eq(1);
    expect(offer.totalPrice).to.eq(amounttopay);
    expect(offer.tokenType).to.eq(0);
    expect(offer.currency).to.eq(testToken.address);
    expect(offer.status).to.eq(1);
    expect(offer.expirationTimestamp).to.be.within(currentTime + (1 * 24 * 60 * 60), currentTime + (1 * 24 * 60 * 60) + 10);
  });


  it("accept an OFFER", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2, OffersLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

    const TestToken = await ethers.getContractFactory("TestToken");
    const TestTokenInteract = TestToken.attach(testToken.address)


    const amounttopay = ethers.utils.parseEther("5");
        /********** */
        const currentTime = (await ethers.provider.getBlock("latest")).timestamp
       // console.log("latest ", currentTime)

    const OfferParams = {
        assetContract : testNft.address,
        tokenId : 0,
        quantity : 1,
        currency : testToken.address,
        totalPrice : amounttopay,
        expirationTimestamp : currentTime + (1 * 24 * 60 * 60), //1 day;
    }

   const tx = await OffersLogicInteract.connect(tester2).makeOffer(OfferParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const offerId = await txargs.offerId

    expect(await OffersLogicInteract.totalOffers()).to.eq(1);

    const offer = await OffersLogicInteract.getOffer(offerId);

    // try to accept the offfer from an address that's not the owner of the nft
    await expect(OffersLogicInteract.connect(deployer).acceptOffer(offerId)).to.be.reverted;

    await OffersLogicInteract.connect(tester1).acceptOffer(offerId);
    
    const offerDetails = await OffersLogicInteract.getOffer(offerId);


    expect(offerDetails.status).to.eq(2);


    // 5% - platfrm fee. =  5% of 5 * 1e18 = 2.5 * 1e17
   //5*1e18 - 0.25 *1e17
   // lister get = 4.75*10^18
    //expext that the seller gets it's money
    const listerget =  ethers.utils.parseEther("4.75")
    expect(await TestTokenInteract.balanceOf(tester1.address)).to.be.equal(listerget)

    //check that the admin get it's own commision
    const platformget =  ethers.utils.parseEther("0.25")
    expect(await TestTokenInteract.balanceOf(deployer.address)).to.be.equal(platformget)

    //expect that the buyer get the nft
   expect(await TestNftInteract.ownerOf(0)).to.be.equal(tester2.address)
  });


  it("cancel an OFFER", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2, OffersLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

    const TestToken = await ethers.getContractFactory("TestToken");
    const TestTokenInteract = TestToken.attach(testToken.address)


    const amounttopay = ethers.utils.parseEther("5");
        /********** */
        const currentTime = (await ethers.provider.getBlock("latest")).timestamp
       // console.log("latest ", currentTime)

    const OfferParams = {
        assetContract : testNft.address,
        tokenId : 0,
        quantity : 1,
        currency : testToken.address,
        totalPrice : amounttopay,
        expirationTimestamp : currentTime + (1 * 24 * 60 * 60), //1 day;
    }

   const tx = await OffersLogicInteract.connect(tester2).makeOffer(OfferParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const offerId = await txargs.offerId

    expect(await OffersLogicInteract.totalOffers()).to.eq(1);

    const offer = await OffersLogicInteract.getOffer(offerId);

    expect(offer.status).to.eq(1);

    // try to accept the offfer from an address that's not the owner of the nft
    await expect(OffersLogicInteract.connect(deployer).cancelOffer(offerId)).to.be.reverted;

    await OffersLogicInteract.connect(tester2).cancelOffer(offerId);
    
    const offerDetails = await OffersLogicInteract.getOffer(offerId);

    expect(offerDetails.status).to.eq(3);
  });





//----------------------------------Auction Test--------------------------------------//


it("should create an Auction", async () => {
  const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2, EnglishAuctionsLogicInteract} = await loadFixture(deployMarketplace);

  /************************Minting and approval************* */
  const TestNft =  await ethers.getContractFactory("TestNft")
  const TestNftInteract = TestNft.attach(testNft.address)

  const mint =  await TestNftInteract.safeMint(tester1.address)
  const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
  const price = ethers.utils.parseEther("10");

  const currentTime = (await ethers.provider.getBlock("latest")).timestamp
  const minbid =  ethers.utils.parseEther("1")
  const buyoutbid =  ethers.utils.parseEther("20")
  // console.log("latest ", currentTime)


const AuctionParameters = {
  assetContract : testNft.address,
  tokenId : 0,
  quantity : 1,
  currency : testToken.address,
  minimumBidAmount : minbid,
  buyoutBidAmount : buyoutbid,
  timeBufferInSeconds : currentTime + (15 * 60), //15 minute
  bidBufferBps : 500, //5% increase to previous bids
  startTimestamp : currentTime,
  endTimestamp : currentTime + (5 * 24 * 60 * 60), //1 day;
}

await expect( EnglishAuctionsLogicInteract.connect(tester2).createAuction(AuctionParameters)).to.be.revertedWith("ERC721: transfer from incorrect owner")
const tx = await EnglishAuctionsLogicInteract.connect(tester1).createAuction(AuctionParameters);
const txreceipt =  await tx.wait()
//@ts-ignore
const txargs = txreceipt.events[1].args;
//console.log("tx args", txargs)
//@ts-ignore
const auctionId = await txargs.auctionId
//console.log("auctionid", auctionId)

  expect(await EnglishAuctionsLogicInteract.totalAuctions()).to.eq(1)

  const auction = await EnglishAuctionsLogicInteract.getAuction(auctionId);
  expect(auction.auctionId).to.eq(auctionId);
  expect(auction.auctionCreator).to.eq(tester1.address);
  expect(auction.assetContract).to.eq(testNft.address);
  expect(auction.tokenId).to.eq(0);
  expect(auction.quantity).to.eq(1);
  expect(auction.currency).to.eq(testToken.address);
  expect(auction.minimumBidAmount).to.eq(minbid);
  expect(auction.buyoutBidAmount).to.eq(buyoutbid);
  expect(auction.timeBufferInSeconds).to.eq(currentTime + (15 * 60));
  expect(auction.bidBufferBps).to.eq(500);
  expect(auction.startTimestamp).to.eq(currentTime);
  expect(auction.endTimestamp).to.eq(currentTime + (5 * 24 * 60 * 60));
  
  expect(auction.tokenType).to.eq(0);
  expect(auction.status).to.eq(1);
});


it("multiple bid should be make(test for bid)", async () => {
  const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2, nftMarketplace, tester3, EnglishAuctionsLogicInteract} = await loadFixture(deployMarketplace);

 /************************Minting and approval************* */
 const TestNft =  await ethers.getContractFactory("TestNft")
 const TestNftInteract = TestNft.attach(testNft.address)

 const TestToken = await ethers.getContractFactory("TestToken");
 const TestTokenInteract = TestToken.attach(testToken.address)
 const amt = ethers.utils.parseEther("40");
 const mintToken2 = await TestTokenInteract.mint(tester3.address, amt)

 const mint =  await TestNftInteract.safeMint(tester1.address)
 const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
 const price = ethers.utils.parseEther("10");

 const currentTime = (await ethers.provider.getBlock("latest")).timestamp
 const minbid =  ethers.utils.parseEther("1")
 const buyoutbid =  ethers.utils.parseEther("20")
 // console.log("latest ", currentTime)


const AuctionParameters = {
 assetContract : testNft.address,
 tokenId : 0,
 quantity : 1,
 currency : testToken.address,
 minimumBidAmount : minbid,
 buyoutBidAmount : buyoutbid,
 timeBufferInSeconds : currentTime + (15 * 60), //15 minute
 bidBufferBps : 500, //5% increase to previous bids
 startTimestamp : currentTime,
 endTimestamp : currentTime + (5 * 24 * 60 * 60), //5 day;
}
console.log("current time ", currentTime + (5 * 24 * 60 * 60)) 
const tx = await EnglishAuctionsLogicInteract.connect(tester1).createAuction(AuctionParameters);
const txreceipt =  await tx.wait()
//@ts-ignore
const txargs = txreceipt.events[1].args;
//console.log("tx args", txargs)
//@ts-ignore
const auctionId = await txargs.auctionId
//console.log("auctionid", auctionId)

 expect(await EnglishAuctionsLogicInteract.totalAuctions()).to.eq(1)

 const auction = await EnglishAuctionsLogicInteract.getAuction(auctionId);

      //bid by tester 2 
     await EnglishAuctionsLogicInteract.connect(tester2).bidInAuction(auctionId, minbid);
 
     const bid1 = await EnglishAuctionsLogicInteract.callStatic.getWinningBid(auctionId);
     expect(bid1._bidder).to.eq(tester2.address);
     expect(bid1._currency).to.eq(testToken.address);
     expect(bid1._bidAmount).to.eq(minbid);
    
    
     //bal after listing(40 - 1)
     const bal=  ethers.utils.parseEther("39")
     expect(await TestTokenInteract.balanceOf(tester2.address)).to.eq(bal);


     //New BID MUST BE 5% Ggreater than previous bid
     //bid expected shoulr be 1.05
     await expect( EnglishAuctionsLogicInteract.connect(tester3).bidInAuction(auctionId, ethers.utils.parseEther("1.02"))).to.be.revertedWith("Marketplace: not winning bid.")

     const newbidamt = ethers.utils.parseEther("2")
     //new bid by tester 3
     await EnglishAuctionsLogicInteract.connect(tester3).bidInAuction(auctionId, newbidamt);

     //bal when another user makes a bid(gets initial bid back)(39.5 + 0.5)
     const newBal = ethers.utils.parseEther("40")
     expect(await TestTokenInteract.balanceOf(tester2.address)).to.eq(newBal);


     const bid2 = await EnglishAuctionsLogicInteract.callStatic.getWinningBid(auctionId);
     expect(bid2._bidder).to.eq(tester3.address);
     expect(bid2._currency).to.eq(testToken.address);
     expect(bid2._bidAmount).to.eq(newbidamt);

      //warp time to the end of auction
     await helpers.time.increase((currentTime + (5 * 24 * 60 * 60) + 902));

     console.log("end time", auction.endTimestamp, ((currentTime + 5 * 24 * 60 * 60) + 900))

     expect(await EnglishAuctionsLogicInteract.isAuctionExpired(auctionId)).to.eq(false);
     expect(await EnglishAuctionsLogicInteract.callStatic.totalAuctions()).to.eq(1)


     const winnerDetails = await EnglishAuctionsLogicInteract.getWinningBid(auctionId);
      expect(winnerDetails._bidder).to.eq(tester3.address);
      expect(winnerDetails._currency).to.eq(testToken.address);
      expect(winnerDetails._bidAmount).to.eq(newbidamt);
     
      
     //Transfer of the nft to the highest bidder
     await EnglishAuctionsLogicInteract.connect(tester1).collectAuctionTokens(auctionId)
     expect(await TestNftInteract.callStatic.balanceOf(tester3.address)).to.eq(1);
     expect(await TestNftInteract.callStatic.ownerOf(0)).to.be.equal(tester3.address)


     //auction creator collects it's payout from the contract and platform fee is paid also
     await EnglishAuctionsLogicInteract.connect(tester1).collectAuctionPayout(auctionId)

     //get 5% of the sales price(5% 0f 2 ether) platform fee bal
     const deployerbal = ethers.utils.parseEther("0.1")
     expect(await TestTokenInteract.connect(deployer).balanceOf(deployer.address)).to.be.equal(deployerbal)

     //get the money paid(2 -(5% of 2)) lister bal
     const listerbal = ethers.utils.parseEther("1.9")
     expect(await TestTokenInteract.connect(deployer).balanceOf(tester1.address)).to.be.equal(listerbal)


});


it("multiple bid shouldn't be made(test for buyout)", async () => {
      const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2, tester3, EnglishAuctionsLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const TestToken = await ethers.getContractFactory("TestToken");
    const TestTokenInteract = TestToken.attach(testToken.address)
    const amt = ethers.utils.parseEther("40");
    const mintToken2 = await TestTokenInteract.mint(tester3.address, amt)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");

    const currentTime = (await ethers.provider.getBlock("latest")).timestamp
    const minbid =  ethers.utils.parseEther("1")
    const buyoutbid =  ethers.utils.parseEther("20")
    // console.log("latest ", currentTime)


    const AuctionParameters = {
    assetContract : testNft.address,
    tokenId : 0,
    quantity : 1,
    currency : testToken.address,
    minimumBidAmount : minbid,
    buyoutBidAmount : buyoutbid,
    timeBufferInSeconds : currentTime + (15 * 60), //15 minute
    bidBufferBps : 500, //5% increase to previous bids
    startTimestamp : currentTime,
    endTimestamp : currentTime + (5 * 24 * 60 * 60), //5 day;
    }
    const tx = await EnglishAuctionsLogicInteract.connect(tester1).createAuction(AuctionParameters);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[1].args;
    //console.log("tx args", txargs)
    //@ts-ignore
    const auctionId = await txargs.auctionId
    //console.log("auctionid", auctionId)

    expect(await EnglishAuctionsLogicInteract.totalAuctions()).to.eq(1)

    const auction = await EnglishAuctionsLogicInteract.getAuction(auctionId);

      //bid by tester 2 .. the auction shouldn't accept any bid again cos the bid made is the buyout bid
      //the collectAuctionTokens is automatically called by the contract when the buyout bid is made
      //so the nft is transferred automatically
     await EnglishAuctionsLogicInteract.connect(tester2).bidInAuction(auctionId, buyoutbid);

     expect(await TestNftInteract.callStatic.balanceOf(tester2.address)).to.eq(1);
     expect(await TestNftInteract.callStatic.ownerOf(0)).to.be.equal(tester2.address)
 
     const bid1 = await EnglishAuctionsLogicInteract.callStatic.getWinningBid(auctionId);
     expect(bid1._bidder).to.eq(tester2.address);
     expect(bid1._currency).to.eq(testToken.address);
     expect(bid1._bidAmount).to.eq(buyoutbid);
    
    
     //bal after listing(40 - 20)
     const bal=  ethers.utils.parseEther("20")
     expect(await TestTokenInteract.balanceOf(tester2.address)).to.eq(bal);


     const newbidamt = ethers.utils.parseEther("30")
     //new bid by tester 3
     //should revert cos a buyout bid was made and the auction is expired by 
     await expect(EnglishAuctionsLogicInteract.connect(tester3).bidInAuction(auctionId, newbidamt)).to.be.revertedWith("Marketplace: inactive auction.");
     expect(await EnglishAuctionsLogicInteract.callStatic.totalAuctions()).to.eq(1)


     const winnerDetails = await EnglishAuctionsLogicInteract.getWinningBid(auctionId);
      expect(winnerDetails._bidder).to.eq(tester2.address);
      expect(winnerDetails._currency).to.eq(testToken.address);
      expect(winnerDetails._bidAmount).to.eq(buyoutbid);

  
     //auction creator collects it's payout from the contract and platform fee is paid also
     await EnglishAuctionsLogicInteract.connect(tester1).collectAuctionPayout(auctionId)

     //get 5% of the sales price(5% 0f 20 ether) platform fee bal
     const deployerbal = ethers.utils.parseEther("1")
     expect(await TestTokenInteract.connect(deployer).balanceOf(deployer.address)).to.be.equal(deployerbal)

     //get the money paid(20 -(5% of 20)) lister bal
     const listerbal = ethers.utils.parseEther("19")
     expect(await TestTokenInteract.connect(deployer).balanceOf(tester1.address)).to.be.equal(listerbal)

     //auction has been closed so no biddind is allowed
     await expect(EnglishAuctionsLogicInteract.connect(tester3).bidInAuction(auctionId, newbidamt)).to.be.reverted;

});



it("should close an auction listing(if auction has not started and revert all bids afterward)", async () => {
  const { marketplaceAddress, testNft, testToken, tester1, tester2, tester3, EnglishAuctionsLogicInteract} = await loadFixture(deployMarketplace);

  /************************Minting and approval************* */
  const TestNft =  await ethers.getContractFactory("TestNft")
  const TestNftInteract = TestNft.attach(testNft.address)

  const TestToken = await ethers.getContractFactory("TestToken");
  const TestTokenInteract = TestToken.attach(testToken.address)
  const amt = ethers.utils.parseEther("40");
  const mintToken2 = await TestTokenInteract.mint(tester3.address, amt)

  const mint =  await TestNftInteract.safeMint(tester1.address)
  const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
  const price = ethers.utils.parseEther("10");

  const currentTime = (await ethers.provider.getBlock("latest")).timestamp

  const minbid =  ethers.utils.parseEther("1")
  const buyoutbid =  ethers.utils.parseEther("20")
  // console.log("latest ", currentTime)


  const AuctionParameters = {
  assetContract : testNft.address,
  tokenId : 0,
  quantity : 1,
  currency : testToken.address,
  minimumBidAmount : minbid,
  buyoutBidAmount : buyoutbid,
  timeBufferInSeconds : currentTime + (15 * 60), //15 minute
  bidBufferBps : 500, //5% increase to previous bids
  startTimestamp : currentTime + (45 * 60), //auction start in 45 minute
  endTimestamp : currentTime + (5 * 24 * 60 * 60), //5 day;
  }
  const tx = await EnglishAuctionsLogicInteract.connect(tester1).createAuction(AuctionParameters);
  const txreceipt =  await tx.wait()
  //@ts-ignore
  const txargs = txreceipt.events[1].args;
  //console.log("tx args", txargs)
  //@ts-ignore
  const auctionId = await txargs.auctionId
  //console.log("auctionid", auctionId)

  expect(await EnglishAuctionsLogicInteract.totalAuctions()).to.eq(1)

  //it should revert cos the auction tester2 is not the auction creator
  await expect( EnglishAuctionsLogicInteract.connect(tester2).cancelAuction(auctionId)).to.be.reverted;

  const cancelAuction = await EnglishAuctionsLogicInteract.connect(tester1).cancelAuction(auctionId);

  //should revert cos auction has been cancelled so no bidding is allowed
  await expect(EnglishAuctionsLogicInteract.connect(tester3).bidInAuction(auctionId, minbid)).to.be.revertedWith("Marketplace: invalid auction.");

  //nft is sent back to the auction creator
  expect(await TestNftInteract.callStatic.balanceOf(tester1.address)).to.eq(1);
  expect(await TestNftInteract.callStatic.ownerOf(0)).to.be.equal(tester1.address)


  const auction = await EnglishAuctionsLogicInteract.getAuction(auctionId);
  //status 3 means cancelled
  expect(auction.status).to.eq(3);

  });

  it("should close an auction listing(if auction has started and has no bids while reverting all bids afterward)", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2, tester3, EnglishAuctionsLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)
  
    const TestToken = await ethers.getContractFactory("TestToken");
    const TestTokenInteract = TestToken.attach(testToken.address)
    const amt = ethers.utils.parseEther("40");
    const mintToken2 = await TestTokenInteract.mint(tester3.address, amt)
  
    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");
  
    const currentTime = (await ethers.provider.getBlock("latest")).timestamp
  
    const minbid =  ethers.utils.parseEther("1")
    const buyoutbid =  ethers.utils.parseEther("20")
    // console.log("latest ", currentTime)
  
  
    const AuctionParameters = {
    assetContract : testNft.address,
    tokenId : 0,
    quantity : 1,
    currency : testToken.address,
    minimumBidAmount : minbid,
    buyoutBidAmount : buyoutbid,
    timeBufferInSeconds : currentTime + (15 * 60), //15 minute
    bidBufferBps : 500, //5% increase to previous bids
    startTimestamp : currentTime, 
    endTimestamp : currentTime + (5 * 24 * 60 * 60), //5 day;
    }
    const tx = await EnglishAuctionsLogicInteract.connect(tester1).createAuction(AuctionParameters);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[1].args;
    //console.log("tx args", txargs)
    //@ts-ignore
    const auctionId = await txargs.auctionId
    //console.log("auctionid", auctionId)
  
    expect(await EnglishAuctionsLogicInteract.totalAuctions()).to.eq(1)

    //warp time so auction has started
    await helpers.time.increase(currentTime + (45 * 60 ));

    //it should revert cos the auction tester2 is not the auction creator
    await expect( EnglishAuctionsLogicInteract.connect(tester2).cancelAuction(auctionId)).to.be.reverted;

    const cancelAuction = await EnglishAuctionsLogicInteract.connect(tester1).cancelAuction(auctionId);
  
    //should revert cos auction has been cancelled so no bidding is allowed
    await expect(EnglishAuctionsLogicInteract.connect(tester3).bidInAuction(auctionId, minbid)).to.be.revertedWith("Marketplace: invalid auction.");
  
    //nft is sent back to the auction creator
    expect(await TestNftInteract.callStatic.balanceOf(tester1.address)).to.eq(1);
    expect(await TestNftInteract.callStatic.ownerOf(0)).to.be.equal(tester1.address)
  
  
    const auction = await EnglishAuctionsLogicInteract.getAuction(auctionId);
    //status 3 means cancelled
    expect(auction.status).to.eq(3);
      
  
  });
});
