import { Wallet, utils, Provider } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

const ALICE_PK = process.env.ALICE_PK!;

async function main() {
    console.log(`Running deploy script for the Greeter contract`);

    const zkSyncProvider = new Provider("https://testnet.era.zksync.dev");
    const alice = new Wallet(ALICE_PK, zkSyncProvider);

    const deployer = new Deployer(hre, alice);

    const artifactA = await deployer.loadArtifact("TokenA");
    const tokenA = await deployer.deploy(artifactA, [18]);
    console.log("TokenA contract address: ", tokenA.address);

    const artifactB = await deployer.loadArtifact("TokenB");
    const tokenB = await deployer.deploy(artifactB, [18]);
    console.log("TokenB contract address: ", tokenB.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });