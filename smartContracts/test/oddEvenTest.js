const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const baseFee = "250000000000000000"; // 0.25 is this the premium in LINK?
const gasPriceLink = 1e9; // link per gas, is this the gas lane? // 0.000000001 LINK per gas
const vrfSubFundAmount = ethers.parseEther("1");
const entranceFee = ethers.parseEther("1");

const gasLane =
	"0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
const interval = 5;
const callBackGasLimit = "500000";

describe("OddEvenGame", function () {
	let oddEvenGame, usdcToken, accounts;
	beforeEach(async () => {
		accounts = await ethers.getSigners();

		// deploy VRFCoordinatorV2Mock
		vrfCoordinatorV2Mock = await ethers.deployContract("VRFCoordinatorV2Mock", [
			baseFee,
			gasPriceLink,
		]);
		await vrfCoordinatorV2Mock.waitForDeployment();

		// usdc token
		usdcToken = await ethers.deployContract("USDCToken", [
			"9999999999999999000000",
		]);

		await usdcToken.waitForDeployment();

		// for subscritpion id
		const tx = await vrfCoordinatorV2Mock.createSubscription();
		const txRec = await tx.wait();

		const subscriptionId = txRec.logs[0].args[0].toString();

		// we have the subscription, now fund the subscription
		await vrfCoordinatorV2Mock.fundSubscription(
			subscriptionId,
			vrfSubFundAmount
		);

		// deploy usdcToken contract
		oddEvenGame = await ethers.deployContract("OddEvenGame", [
			vrfCoordinatorV2Mock.target,
			gasLane,
			subscriptionId,
			callBackGasLimit,
			interval,
			usdcToken.target,
		]);

		await oddEvenGame.waitForDeployment();

		// add customer to vrf
		await vrfCoordinatorV2Mock.addConsumer(subscriptionId, oddEvenGame.target);

		console.log("oddEven contract at  : ", oddEvenGame.target);
	});

	it("integrated test", async () => {
		// give contract approval first
		await usdcToken.approve(oddEvenGame.target, "999000000");
		// first player enters
		const enterTx = await oddEvenGame.enterToOddEvenGame(true, "2000000");

		// expect to emit FirstPlayerEntered event
		await expect(enterTx).to.emit(oddEvenGame, "FirstPlayerEntered");
	});
});
