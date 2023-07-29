const hre = require("hardhat");
const networkConfig = require("../helper");
const fs = require("fs");
const { json } = require("hardhat/internal/core/params/argumentTypes");

async function main() {
	const mumbaiData = networkConfig.networkConfig[80001];

	// // usdcToken
	const USDCToken = await ethers.deployContract("USDCToken", [
		"9999999999999999000000",
	]);

	// await USDCToken.waitForDeployment();

	const OddEvenGame = await ethers.deployContract("OddEvenGame", [
		mumbaiData.vrfCoordinatorV2,
		mumbaiData.gasLane,
		mumbaiData.subscriptionId,
		mumbaiData.callbackGasLimit,
		mumbaiData.interval,
		mumbaiData.usdcAddr,
	]);
	await OddEvenGame.waitForDeployment();
	console.log("contract is deployed at : ", OddEvenGame.target);
	// 0x4CD402132aD32a5fE83341fE18fc9FA9b9dDa46A

	const oddEvenGameContractAbi = OddEvenGame.interface.format("json");
	const oddEvenGameContractAddr = OddEvenGame.target;

	const usdcTokenContractAbi = USDCToken.interface.format("json");
	const usdcTokenContractAddr = mumbaiData.usdcAddr;

	const contracts = {
		OddEvenGame: [oddEvenGameContractAbi, oddEvenGameContractAddr],
		USDCToken: [usdcTokenContractAbi, usdcTokenContractAddr],
	};

	fs.writeFileSync(
		"../frontend/src/constants/contracts.json",
		JSON.stringify(contracts, null, 2)
	);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
