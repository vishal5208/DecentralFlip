require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: "0.8.4",

	networks: {
		polygonMumbai: {
			url: process.env.POLYGON_TESTNET_URL,
			accounts: [process.env.PRIVATE_KEY],
		},

		// hardhat: {
		// 	chainId: 31337,
		// 	forking: {
		// 		url: process.env.POLYGON_MAINNETFORK_URL,
		// 	},
		// },
	},
	etherscan: {
		apiKey: {
			polygonMumbai: process.env.POLYGONSCAN_API_KEY,
		},
	},
};
