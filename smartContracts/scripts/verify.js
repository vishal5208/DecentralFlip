const hre = require("hardhat");
const networkConfig = require("../helper");
const mumbaiData = networkConfig.networkConfig[80001];

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
		address: "0x26CfF986b52a386AD43a66bfba17a051265DBEC0",
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
