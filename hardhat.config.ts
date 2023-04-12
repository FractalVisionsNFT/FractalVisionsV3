import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config({ path: ".env" });

const ALCHEMY_mumbai_API_KEY_URL = process.env.ALCHEMY_mumbai_API_KEY_URL;
const ALCHEMY_OPtimism_API_KEY_URL = process.env.ALCHEMY_OPtimism_API_KEY_URL
//contract address key
const ACCOUNT_PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY;


const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 300,
      },
    },
  },
  networks: {
    optimism: {
      url: ALCHEMY_OPtimism_API_KEY_URL,
      //@ts-ignore
      accounts: [ACCOUNT_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};

export default config;
