const hre = require("hardhat");
const networkConfig = require("../helper");
const mumbaiData = networkConfig.networkConfig[80001];
const contracts = require("../../frontend/src/constants/contracts.json");

async function verifyContracts(contractInfo) {
	for (const info of contractInfo) {
		await hre.run("verify:verify", {
			address: info.address,
			constructorArguments: info.args || [],
		});
	}
}

const contractsToVerify = [
	{
		address: contracts.OddEvenGame[1],
		args: [
			mumbaiData.vrfCoordinatorV2,

			mumbaiData.gasLane,
			mumbaiData.subscriptionId,
			mumbaiData.callbackGasLimit,
			mumbaiData.interval,
			mumbaiData.usdcAddr,
		],
	},
];

verifyContracts(contractsToVerify);
