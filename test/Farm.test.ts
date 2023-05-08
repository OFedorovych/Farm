import { expect, util } from "chai";
import { Wallet, Provider, Contract, utils } from "zksync-web3";
import * as hre from "hardhat";
import * as ethers from "ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Address } from "zksync-web3/build/src/types"

import * as TokenAArtifact from "../artifacts-zk/contracts/mock/TokenA.sol/TokenA.json";
import * as TokenBArtifact from "../artifacts-zk/contracts/mock/TokenB.sol/TokenB.json";
import * as EthArtifact from "../artifacts-zk/openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

const TOKENA_ADDRESS = "0x28fBca1C1DD73404177D3C04453c730b2d2dD103";
const TOKENB_ADDRESS = "0x3C7De729e2703De90793dE883c68B03415896c44";

const ALICE_PK = process.env.ALICE_PK!;
const BOB_PK = process.env.BOB_PK!;

let alice: Wallet;
let bob: Wallet; 

let aliceAddress: Address;
let bobAddress: Address;

let tokenA: Contract;
let tokenB: Contract;
let eth: Contract;
let farm: Contract;

let zkSyncProvider: Provider;

let bobTokenBBalanceBeforeDeposit: ethers.ethers.BigNumber;

const BN = ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("Farm", function () {
    it("Preparations and deployment of farm contract", async function () {
        zkSyncProvider = new Provider("https://testnet.era.zksync.dev");

        alice = new Wallet(ALICE_PK.toString(), zkSyncProvider);
        bob = new Wallet(BOB_PK, zkSyncProvider);

        aliceAddress = alice.address;
        bobAddress = bob.address;

        tokenA = new Contract(
            TOKENA_ADDRESS,
            TokenAArtifact.abi,
            alice
        );

        tokenB = new Contract(
            TOKENB_ADDRESS,
            TokenBArtifact.abi,
            alice
        );

        eth = new Contract(
            utils.ETH_ADDRESS,
            EthArtifact.abi,
            alice
        );
        
        /*---------------- Mint tokens A & B ----------------*/
        const mintAmount = toBN(100).mul(toBN(10).pow(toBN(18)));

        const tokenABalanceAliceBefore = await alice.getBalance(TOKENA_ADDRESS);
        await tokenA.connect(alice).mint(mintAmount);
        const tokenABalanceAliceAfter = await alice.getBalance(TOKENA_ADDRESS);

        const tokenBBalanceBobBefore = await bob.getBalance(TOKENB_ADDRESS);
        await tokenB.connect(bob).mint(mintAmount);
        const tokenBBalanceBobAfter = await bob.getBalance(TOKENB_ADDRESS);

        expect(tokenABalanceAliceAfter).to.be.eq(tokenABalanceAliceBefore.add(mintAmount));
        expect(tokenBBalanceBobAfter).to.be.eq(tokenBBalanceBobBefore.add(mintAmount));

        /*---------------- Deploy farm contract ----------------*/
        const deployer = new Deployer(hre, alice);
        farm = await deployFarmContract(deployer);
        console.log("Farm contract address: ", farm.address);

        const adminRole = await farm.DEFAULT_ADMIN_ROLE();
        const aliceIsAdmin = await farm.hasRole(adminRole, aliceAddress);

        expect(aliceIsAdmin).to.be.eq(true);
    })

    it("Alice sets reward percent", async function () {
        farm = farm.connect(alice);

        const rewardPercent = toBN(20);
        await farm.setRewardPercent(rewardPercent);

        const rewardPercentAfter = await farm.rewardPercentPerSecond();
        expect(rewardPercentAfter).to.be.eq(rewardPercent);
    })

    it("Bob deposits 100 token B to Farm contract", async function() {
        farm = farm.connect(bob);

        bobTokenBBalanceBeforeDeposit = await bob.getBalance(TOKENB_ADDRESS);
        const farmTotalDepositTokenBBefore = await farm.totalDepositTokenB();

        const depositAmount = toBN(10).mul(toBN(10).pow(toBN(18)));
        await tokenB.connect(bob).approve(farm.address, depositAmount)

        await farm.depositTokenB(depositAmount);

        const bobTokenBBalanceAfterDeposit = await bob.getBalance(TOKENB_ADDRESS);
        const farmTotalDepositTokenBAfter = await farm.totalDepositTokenB();

        expect(bobTokenBBalanceAfterDeposit).to.be.eq(bobTokenBBalanceBeforeDeposit.sub(depositAmount));
        expect(farmTotalDepositTokenBAfter).to.be.eq(farmTotalDepositTokenBBefore.add(depositAmount));
    })

    it("Bob withdraws 100 B tokens and 1 reward token", async function () {
        farm = farm.connect(bob);

        const farmTotalBalanceTokenABefore = await farm.totalBalanceTokenA();

        await farm.withdrawAll();

        const bobTokenBBalanceAfterWithdraw = await bob.getBalance(TOKENB_ADDRESS);
        const bobTokenABalanceAfterWithdraw = await bob.getBalance(TOKENA_ADDRESS);
        const farmTotalBalanceTokenAAfter = await farm.totalBalanceTokenA();

        expect(bobTokenBBalanceAfterWithdraw).to.be.eq(bobTokenBBalanceBeforeDeposit);
        expect(bobTokenABalanceAfterWithdraw).to.be.gt(0);
        expect(farmTotalBalanceTokenAAfter).to.be.eq(farmTotalBalanceTokenABefore.sub(bobTokenABalanceAfterWithdraw));
    })
})

async function deployFarmContract(deployer: Deployer): Promise<Contract> {
    const artifact = await deployer.loadArtifact("Farm");
    return await deployer.deploy(artifact, [TOKENA_ADDRESS, TOKENB_ADDRESS, aliceAddress]);
}

