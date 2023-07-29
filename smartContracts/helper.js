const { ethers } = require("hardhat");

const networkConfig = {
	31337: {
		gasLane:
			"0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
		callbackGasLimit: "500000",
		interval: "5", // 5 seconds
	},
	// Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
	80001: {
		vrfCoordinatorV2: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
		gasLane:
			"0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
		subscriptionId: "5483", // vrf.chain.link
		callbackGasLimit: "2500000",
		interval: "300", // 300 seconds
		usdcAddr: "0x7f02FC8B9818332c9bF9168720818aE5638b3D50",
	},
};
const localChains = ["hardhat"];

module.exports = {
	networkConfig,
};
