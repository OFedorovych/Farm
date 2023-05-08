import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-chai-matchers";
import "@nomicfoundation/hardhat-chai-matchers";
import dotenv from "dotenv";

dotenv.config();

const GOERLI_INFURA = process.env.GOERLI_INFURA;

module.exports = {
  zksolc: {
    version: "1.3.9",
    compilerSource: "binary",
    settings: {},
  },
  defaultNetwork: "zkSyncTestnet",

  networks: {
    zkSyncTestnet: {
      url: "https://testnet.era.zksync.dev",
      ethNetwork: GOERLI_INFURA,
      zksync: true,
      gas: 2100000,
      gasPrice: 8000000000,
    },
  },
  solidity: {
    version: "0.8.8",
  },
};