import { ethers } from "hardhat";
const { getSelectors, functionName } = require('./libraries/diamond.js')

async function main() {
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

        /*********************Deploy Marketplace*************************** */
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
  

/********************************** */

//const funcName = functionName(DirectListing);

  // // console.log(funcName[0])

/*************************8 */
 
/************cut ****************8 */
  //  const cut = [];

  // cut.push({
  //   facetAddress: DirectListing.address,
  //   functionSelectors: getSelectors(DirectListing),
  //   functionSignature: getSignature(DirectListing)
  // })

  // console.log("cut ", cut)

  /*****************************8 */
  // let plugin = [];

  // console.log('Deploying facets')
  // const FacetNames = [
  //   'DirectListingsLogic'
  // ]

  // for (const FacetName of FacetNames) {
  //   // console.log("facet name: ", FacetName);

  //   // const funcName = functionName(FacetName);
  //   // console.log("facet name: ", funcName);

  //   for (let i = 0; i < funcName[0].length; i++) {
  //   plugin.push([
  //    getSelectors(DirectListing)[i],
  //    funcName[0][i],
  //    DirectListing.address  
  //   ])
  // }
  // }

  let plugin = [];

const FacetNames = [  'DirectListingsLogic',  'EnglishAuctionsLogic',  'OffersLogic']

for (const FacetName of FacetNames) {
  const funcName = functionName(eval(FacetName));

  for (let i = 0; i < funcName[0].length; i++) {
    let deployedFacet = FacetName.charAt(0).toLowerCase() + FacetName.slice(1);
    console.log("facet name: ", FacetName, eval(deployedFacet).address , funcName[0][i] );
    plugin.push([
      getSelectors(eval(FacetName))[i],
      funcName[0][i],
      eval(deployedFacet).address  
    ])
  }
}

console.log("plugin: ", plugin)

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

 


  console.log("plugin", plugin)


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

    const getAllPlugins = await nftMarketplace.callStatic.getAllPlugins()
    console.log("contract getAllPlugins: ", getAllPlugins)

    

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
