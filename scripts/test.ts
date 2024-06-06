//-----------------------New MarketPlace---------------------------//



// import { ethers } from "hardhat";
// const { getSelectors, functionName } = require('./libraries/diamond.js')

// async function main() {
//   const [deployer, tester1, tester2, tester3] = await ethers.getSigners();


//     /*****************Deploy English Auction************************** */
//     const OffersLogic = await ethers.getContractFactory("OffersLogic");
//     const offersLogic = await OffersLogic.deploy();
   
//     await offersLogic.deployed();
  
//     console.log(`OffersLogic contract is deployed to ${offersLogic.address}`);





//     // Initialize the extensions array
//     let extensions = [];

//     // Mock address generation for OffersLogic (in a real scenario, you would deploy the contract and get the address)
//     let offers = offersLogic.address;
//     console.log(`Label: Offers_Extension, Address: ${offers}`);

//     // Create the metadata object for OffersLogic
//     let extensionOffers = {
//         metadata: {
//             name: "OffersLogic",
//             metadataURI: "ipfs://Offers",
//             implementation: offers
//         },
//         functions: []
//     };

//     // Define the functions for the OffersLogic extension
//     extensionOffers.functions.push({ selector: "totalOffersSelector", signature: "totalOffers()" });
//     extensionOffers.functions.push({ selector: "makeOfferSelector", signature: "makeOffer((address,uint256,uint256,address,uint256,uint256))" });
//     extensionOffers.functions.push({ selector: "cancelOfferSelector", signature: "cancelOffer(uint256)" });
//     extensionOffers.functions.push({ selector: "acceptOfferSelector", signature: "acceptOffer(uint256)" });
//     extensionOffers.functions.push({ selector: "getAllValidOffersSelector", signature: "getAllValidOffers(uint256,uint256)" });
//     extensionOffers.functions.push({ selector: "getAllOffersSelector", signature: "getAllOffers(uint256,uint256)" });
//     extensionOffers.functions.push({ selector: "getOfferSelector", signature: "getOffer(uint256)" });

//     // Add the OffersLogic extension to the extensions array
//     extensions.push(extensionOffers);

// // Example usage
// console.log(extensions);
  

    

// }


// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
