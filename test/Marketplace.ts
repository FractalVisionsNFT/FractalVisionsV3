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
 const TestNftInteract = TestNft.attach(testNft.address)
               await TestNftInteract.safeMint(tester1.address)
 const mint = await TestNftInteract.safeMint(tester3.address)
 
                     await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
 const nftApproval = await TestNftInteract.connect(tester3).setApprovalForAll(marketplaceAddress, true)
 
 
 //console.log("approval succesfull ", nftApproval)
 
 /******************** */
 const amt = ethers.utils.parseEther("40")
 const TestTokenInteract = TestToken.attach(testToken.address)
 
 const mintToken = await TestTokenInteract.mint(tester2.address, amt)
 const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)
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
    expect(listing.status).to.eq(1);
  });


  it("should cancel a direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace, DirectListingsLogicInteract} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: price,
        listingType: 0,
      }


    const tx = await DirectListingsLogicInteract.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

    // try to cancel the listing from an address that's not the creator of the listing
    await expect(DirectListingsLogicInteract.connect(tester2).cancelDirectListing(listingId)).to.be.revertedWith("!OWNER");

    await nftMarketplace.connect(tester1).cancelDirectListing(listingId);

    const listing = await nftMarketplace.listings(listingId);
    expect(listing.assetContract).to.eq("0x0000000000000000000000000000000000000000");
  });


  /// @dev Lets an account buy a given quantity of tokens from a listing.
  it("should buy a direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: price,
        listingType: 0,
      }


    const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
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


    await nftMarketplace.connect(tester2).buy(listingId, buyFor,quantityToBuy, currency, totalPrice);

   
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

    const listing = await nftMarketplace.listings(listingId);

    //check that the listing isn't available again
    expect(listing.quantity).to.eq(0);
  });

  it("should make an offer for a direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: ethers.utils.parseEther("10"),
        listingType: 0,
      }


    const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

      const listing = await nftMarketplace.listings(listingId);
      const amounttopay = ethers.utils.parseEther("5");
      /*********************************** */
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken2 = await TestToken.deploy();
        await testToken2.deployed()
        const testToken2Interact = testToken2.attach(testToken2.address)

    const mintToken = await testToken2Interact.mint(tester2.address, amounttopay)
    const tokenApproval = await testToken2Interact.connect(tester2).approve(marketplaceAddress, amounttopay)


      // const offerParams
       const quantityWanted = 1;
       const currency = testToken2.address;
       const pricePerToken = amounttopay;
       const expirationTimestamp = listing.endTime;
  
      
    await nftMarketplace.connect(tester2).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);

    const offer = await nftMarketplace.offers(listingId, tester2.address);
    expect(offer.pricePerToken).to.eq(pricePerToken);
    expect(offer.offeror).to.eq(tester2.address);
    expect(offer.currency).to.eq(currency);
    expect(offer.quantityWanted).to.eq(quantityWanted);
    expect(offer.expirationTimestamp).to.eq(expirationTimestamp);
  });


  it("should accept an offer for a direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: ethers.utils.parseEther("10"),
        listingType: 0,
      }


    const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

      const amounttopay = ethers.utils.parseEther("5");
      /*********************************** */
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken2 = await TestToken.deploy();
        await testToken2.deployed()
        const testToken2Interact = testToken2.attach(testToken2.address)

    const mintToken = await testToken2Interact.mint(tester2.address, amounttopay)
    const tokenApproval = await testToken2Interact.connect(tester2).approve(marketplaceAddress, amounttopay)

      // const offerParams
       const quantityWanted = 1;
       const currency = testToken2.address;
       const pricePerToken = amounttopay;
       const expirationTimestamp = currentTime + 1 * 24 * 60 * 60;
  
      
    await nftMarketplace.connect(tester2).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);

    const offer = await nftMarketplace.offers(listingId, tester2.address);

    // try to accept the offfer from an address that's not the creator of the listing
    await expect(nftMarketplace.connect(deployer).acceptOffer(listingId, offer.offeror, offer.currency, offer.pricePerToken)).to.be.reverted;

    await nftMarketplace.connect(tester1).acceptOffer(listingId, offer.offeror, offer.currency, offer.pricePerToken);
    
    const listing = await nftMarketplace.listings(listingId);

    expect(listing.quantity).to.eq(0);

    // 5% - platfrm fee. =  5% of 5 * 1e18 = 2.5 * 1e17
   //5*1e18 - 0.25 *1e17
   // lister get = 4.75*10^18
    //expext that the seller gets it's money
    const listerget =  ethers.utils.parseEther("4.75")
    expect(await testToken2Interact.balanceOf(tester1.address)).to.be.equal(listerget)

    //check that the admin get it's own commision
    const platformget =  ethers.utils.parseEther("0.25")
    expect(await testToken2Interact.balanceOf(deployer.address)).to.be.equal(platformget)

    //expect that the buyer get the nft
   expect(await TestNftInteract.ownerOf(0)).to.be.equal(tester2.address)
  });





//----------------------------------Auction Test--------------------------------------//

//      // auction listingtype is 1 by default
//     // Direct listingtype is 0 by default
it("should create a Auction listing", async () => {
  const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

  /************************Minting and approval************* */
  const TestNft =  await ethers.getContractFactory("TestNft")
  const TestNftInteract = TestNft.attach(testNft.address)

  const mint =  await TestNftInteract.safeMint(tester1.address)
  const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
  const price = ethers.utils.parseEther("10");

  const listingParams = {
      assetContract: testNft.address,
      tokenId: 0,
      startTime: currentTime,
      secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
      quantityToList: 1,
      currencyToAccept: testToken.address,
      reservePricePerToken: 0,
      buyoutPricePerToken: price,
      listingType: 1,
    }


  const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
  const txreceipt =  await tx.wait()
  //@ts-ignore
  const txargs = txreceipt.events[1].args;
  //@ts-ignore
  const listingId = await txargs.listingId

  const listing = await nftMarketplace.listings(listingId);
  expect(listing.tokenOwner).to.eq(tester1.address);
  expect(listing.assetContract).to.eq(testNft.address);
  expect(listing.quantity).to.eq(1);
  expect(listing.buyoutPricePerToken).to.eq(price);
  expect(listing.startTime).to.be.within(currentTime, currentTime +10);
  expect(listing.endTime).to.be.within(currentTime + (1 * 24 * 60 * 60), currentTime + (1 * 24 * 60 * 60) + 10);
  expect(listing.listingType).to.equal(1);
});

it("multiple bid should be make(test for bid)", async () => {
  const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace, tester3} = await loadFixture(deployMarketplace);

  /************************Minting and approval************* */
  const TestNft =  await ethers.getContractFactory("TestNft")
  const TestNftInteract = TestNft.attach(testNft.address)

  const mint =  await TestNftInteract.safeMint(tester1.address)
  const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
 
  /*************** */
      /******************** */
      const amt = ethers.utils.parseEther("40")
      const TestToken = await ethers.getContractFactory("TestToken");
      const TestTokenInteract = TestToken.attach(testToken.address)


      await TestTokenInteract.mint(tester3.address, amt)
      const mintToken = await TestTokenInteract.mint(tester2.address, amt)

      await TestTokenInteract.connect(tester3).approve(marketplaceAddress, amt)
      const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

  const listingParams = {
      assetContract: testNft.address,
      tokenId: 0,
      startTime: currentTime,
      secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
      quantityToList: 1,
      currencyToAccept: testToken.address,
      reservePricePerToken: ethers.utils.parseEther("0.5"),
      buyoutPricePerToken: ethers.utils.parseEther("20"),
      listingType: 1,
    }


  const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
  const txreceipt =  await tx.wait()
  //@ts-ignore
  const txargs = txreceipt.events[1].args;
  //@ts-ignore
  const listingId = await txargs.listingId

  const listing = await nftMarketplace.listings(listingId);
  expect(listing.tokenOwner).to.eq(tester1.address);
  expect(listing.assetContract).to.eq(testNft.address);
  expect(listing.quantity).to.eq(1);
  expect(listing.buyoutPricePerToken).to.eq(ethers.utils.parseEther("20"));
  expect(listing.startTime).to.be.within(currentTime, currentTime +10);
  expect(listing.endTime).to.be.within(currentTime + (1 * 24 * 60 * 60), currentTime + (1 * 24 * 60 * 60) + 10);
  expect(listing.listingType).to.equal(1);


        // const offerParams
        const quantityWanted = listing.quantity;
        const currency = listing.currency;
        const pricePerToken = ethers.utils.parseEther("0.5");
        const expirationTimestamp = listing.endTime;

      //bid by tester 2 
     await nftMarketplace.connect(tester2).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);
 
     const bid1 = await nftMarketplace.callStatic.winningBid(listingId);
     expect(bid1.pricePerToken).to.eq(pricePerToken);
     expect(bid1.offeror).to.eq(tester2.address);
     expect(bid1.currency).to.eq(currency);
     expect(bid1.quantityWanted).to.eq(quantityWanted);
     expect(bid1.expirationTimestamp).to.eq(expirationTimestamp);
    

     //bal after listing(40 - 0.5)
     const bal=  ethers.utils.parseEther("39.5")
     expect(await TestTokenInteract.balanceOf(tester2.address)).to.eq(bal);

     //new bid by tester 3
     await nftMarketplace.connect(tester3).offer(listingId, quantityWanted, currency, ethers.utils.parseEther("1"), expirationTimestamp);

     //bal when another user makes a bid(gets initial bid back)(39.5 + 0.5)
     const newBal = ethers.utils.parseEther("40")
     expect(await TestTokenInteract.balanceOf(tester2.address)).to.eq(newBal);


     const bid2 = await nftMarketplace.callStatic.winningBid(listingId);
     expect(bid2.pricePerToken).to.eq(ethers.utils.parseEther("1"));
     expect(bid2.offeror).to.eq(tester3.address);
     expect(bid2.currency).to.eq(currency);
     expect(bid2.quantityWanted).to.eq(quantityWanted);
     expect(bid2.expirationTimestamp).to.eq(expirationTimestamp);

     await helpers.time.increase(532000);

     const winnerDetails = await nftMarketplace.winningBid(listingId);
     await nftMarketplace.connect(tester3).closeAuction(listingId, winnerDetails.offeror)

     expect(await TestNftInteract.callStatic.balanceOf(tester3.address)).to.eq(1);
     expect(await TestNftInteract.callStatic.ownerOf(0)).to.be.equal(tester3.address)
    
     await nftMarketplace.connect(tester3).closeAuction(listingId, listing.tokenOwner)

     //get 5% of the sales price(5% 0f 1 ether) platform fee bal
     const deployerbal = ethers.utils.parseEther("0.05")
     expect(await TestTokenInteract.connect(deployer).balanceOf(deployer.address)).to.be.equal(deployerbal)

     //get the money paid(1 - 5% of 1) lister bal
     const listerbal = ethers.utils.parseEther("0.95")
     expect(await TestTokenInteract.connect(deployer).balanceOf(tester1.address)).to.be.equal(listerbal)

});


it("multiple bid shouldn't be made(test for buyout)", async () => {
  const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace, tester3} = await loadFixture(deployMarketplace);

  /************************Minting and approval************* */
  const TestNft =  await ethers.getContractFactory("TestNft")
  const TestNftInteract = TestNft.attach(testNft.address)

  const mint =  await TestNftInteract.safeMint(tester1.address)
  const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
 
  /*************** */
      /******************** */
      const amt = ethers.utils.parseEther("40")
      const TestToken = await ethers.getContractFactory("TestToken");
      const TestTokenInteract = TestToken.attach(testToken.address)

    //mimt
      await TestTokenInteract.mint(tester3.address, amt)
      const mintToken = await TestTokenInteract.mint(tester2.address, amt)

      //Approve
      await TestTokenInteract.connect(tester3).approve(marketplaceAddress, amt)
      const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

  const listingParams = {
      assetContract: testNft.address,
      tokenId: 0,
      startTime: currentTime,
      secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
      quantityToList: 1,
      currencyToAccept: testToken.address,
      reservePricePerToken: ethers.utils.parseEther("0.5"),
      buyoutPricePerToken: ethers.utils.parseEther("20"),
      listingType: 1,
    }


  const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
  const txreceipt =  await tx.wait()
  //@ts-ignore
  const txargs = txreceipt.events[1].args;
  //@ts-ignore
  const listingId = await txargs.listingId

  const listing = await nftMarketplace.listings(listingId);
  expect(listing.tokenOwner).to.eq(tester1.address);
  expect(listing.assetContract).to.eq(testNft.address);
  expect(listing.quantity).to.eq(1);
  expect(listing.buyoutPricePerToken).to.eq(ethers.utils.parseEther("20"));
  expect(listing.startTime).to.be.within(currentTime, currentTime +15);
  expect(listing.endTime).to.be.within(currentTime + (1 * 24 * 60 * 60), currentTime + (1 * 24 * 60 * 60) + 15);
  expect(listing.listingType).to.equal(1);


    // const offerParams
    const quantityWanted = listing.quantity;
    const currency = listing.currency;
    const pricePerToken = ethers.utils.parseEther("20");
    const expirationTimestamp = listing.endTime;

  //bid by tester 2 
  await nftMarketplace.connect(tester2).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);

  const offer = await nftMarketplace.winningBid(listingId);
  expect(offer.pricePerToken).to.eq(pricePerToken);
  expect(offer.offeror).to.eq(tester2.address);
  expect(offer.currency).to.eq(currency);
  //the offer has been make since it is the buyout price, the nft is tranfered and the quantitywanted is set to 0
  expect(offer.quantityWanted).to.eq(0);
  //the time is reset to
  expect(offer.expirationTimestamp).to.eq(expirationTimestamp);


  //bal after listing(40 - 20)
  const bal=  ethers.utils.parseEther("20")
  expect(await TestTokenInteract.balanceOf(tester2.address)).to.eq(bal);

  //it should revert because the nft has been bought with the buyoutprice
  await expect(nftMarketplace.connect(tester3).offer(listingId, quantityWanted, currency, ethers.utils.parseEther("1"), expirationTimestamp)).to.be.revertedWith("inactive listing.");

  expect(await TestNftInteract.callStatic.balanceOf(tester2.address)).to.eq(1);
  expect(await TestNftInteract.callStatic.ownerOf(0)).to.be.equal(tester2.address)

  await nftMarketplace.connect(tester1).closeAuction(listingId, listing.tokenOwner)

  //get 5% of the sales price(5% 0f 20 ether) platform fee bal
  const deployerbal = ethers.utils.parseEther("1")
  expect(await TestTokenInteract.connect(deployer).balanceOf(deployer.address)).to.be.equal(deployerbal)

  //get the money paid(20 - 5% of 20) lister bal
  const listerbal = ethers.utils.parseEther("19")
  expect(await TestTokenInteract.connect(deployer).balanceOf(tester1.address)).to.be.equal(listerbal)


});



it("should close an auction listing(if auction has not started and revert all bids afterward)", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,tester3,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

 /************************Minting and approval************* */
 const TestNft =  await ethers.getContractFactory("TestNft")
 const TestNftInteract = TestNft.attach(testNft.address)

 const mint =  await TestNftInteract.safeMint(tester1.address)
 const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

 /*************** */
     /******************** */
     const amt = ethers.utils.parseEther("40")
     const TestToken = await ethers.getContractFactory("TestToken");
     const TestTokenInteract = TestToken.attach(testToken.address)

   //mimt
     await TestTokenInteract.mint(tester3.address, amt)
     const mintToken = await TestTokenInteract.mint(tester2.address, amt)

     //Approve
     await TestTokenInteract.connect(tester3).approve(marketplaceAddress, amt)
     const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

 const listingParams = {
     assetContract: testNft.address,
     tokenId: 0,
     //start in the future
     startTime: currentTime + (5  * 40 * 60 * 60),
     secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
     quantityToList: 1,
     currencyToAccept: testToken.address,
     reservePricePerToken: ethers.utils.parseEther("0.5"),
     buyoutPricePerToken: ethers.utils.parseEther("20"),
     listingType: 1,
   }


    const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[1].args;
    //@ts-ignore
    const listingId = await txargs.listingId


    const listing = await nftMarketplace.listings(listingId);

    expect(listing.tokenOwner).to.eq(tester1.address);
    expect(listing.assetContract).to.eq(testNft.address);
    expect(listing.quantity).to.eq(1);
    expect(listing.buyoutPricePerToken).to.eq(ethers.utils.parseEther("20"));
    expect(listing.startTime).to.be.eq(currentTime + (5  * 40 * 60 * 60));
    expect(listing.endTime).to.be.eq(currentTime + (5  * 40 * 60 * 60) + (1 * 24 * 60 * 60));
    expect(listing.listingType).to.equal(1);

   //It should not revert if the auction has not started

   //should revert cos tester2 is not the lister
   await expect(nftMarketplace.connect(tester2).closeAuction(listingId, listing.tokenOwner)).to.be.revertedWith("caller is not the listing creator.");

   //shouldn't revert cos this is the lister
   expect(await nftMarketplace.connect(tester1).closeAuction(listingId, listing.tokenOwner)).not.to.be.reverted;

   // advance time by one hour and mine a new block
   await helpers.time.increase(3600);


    // const offerParams
    const quantityWanted = listing.quantity;
    const currency = listing.currency;
    const pricePerToken = ethers.utils.parseEther("20");
    const expirationTimestamp = listing.endTime;

  //revert all bid
  await expect(nftMarketplace.connect(tester2).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp)).to.be.revertedWith("DNE");

  const listingafter = await nftMarketplace.listings(listingId);
  //asset is null
  expect(listingafter.assetContract).to.eq(ethers.constants.AddressZero);
  expect(listingafter.quantity).to.eq(0);

  const offer = await nftMarketplace.winningBid(listingId);
  expect(offer.offeror).to.eq(ethers.constants.AddressZero);

  });

  it("should close an auction listing(if auction has started and has no bids while reverting all bids afterward)", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,tester3,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

 /************************Minting and approval************* */
 const TestNft =  await ethers.getContractFactory("TestNft")
 const TestNftInteract = TestNft.attach(testNft.address)

 const mint =  await TestNftInteract.safeMint(tester1.address)
 const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

 /*************** */
     /******************** */
     const amt = ethers.utils.parseEther("40")
     const TestToken = await ethers.getContractFactory("TestToken");
     const TestTokenInteract = TestToken.attach(testToken.address)

   //mimt
     await TestTokenInteract.mint(tester3.address, amt)
     const mintToken = await TestTokenInteract.mint(tester2.address, amt)

     //Approve
     await TestTokenInteract.connect(tester3).approve(marketplaceAddress, amt)
     const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

 const listingParams = {
     assetContract: testNft.address,
     tokenId: 0,
     //start in the future
     startTime: currentTime,
     secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
     quantityToList: 1,
     currencyToAccept: testToken.address,
     reservePricePerToken: ethers.utils.parseEther("0.5"),
     buyoutPricePerToken: ethers.utils.parseEther("20"),
     listingType: 1,
   }


 const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
 const txreceipt =  await tx.wait()
 //@ts-ignore
 const txargs = txreceipt.events[1].args;
 //@ts-ignore
 const listingId = await txargs.listingId


 const listing = await nftMarketplace.listings(listingId);

    // advance time by one hour and mine a new block
    await helpers.time.increase(3600);

   //*************It should not revert if the auction has not started*********//
   //should revert cos tester2 is not the lister
   await expect(nftMarketplace.connect(tester2).closeAuction(listingId, listing.tokenOwner)).to.be.revertedWith("caller is not the listing creator.");

   //shouldn't revert cos this is the lister
   expect(await nftMarketplace.connect(tester1).closeAuction(listingId, listing.tokenOwner)).not.to.be.reverted;


    // const offerParams
    const quantityWanted = listing.quantity;
    const currency = listing.currency;
    const pricePerToken = ethers.utils.parseEther("20");
    const expirationTimestamp = listing.endTime;

  //revert all bid
  await expect(nftMarketplace.connect(tester2).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp)).to.be.revertedWith("DNE");

  const listingafter = await nftMarketplace.listings(listingId);
  //asset is null
  expect(listingafter.assetContract).to.eq(ethers.constants.AddressZero);
  expect(listingafter.quantity).to.eq(0);

  const offer = await nftMarketplace.winningBid(listingId);
  expect(offer.offeror).to.eq(ethers.constants.AddressZero);
  
  });
});
