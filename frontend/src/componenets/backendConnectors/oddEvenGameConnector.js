import { requestAccount } from "./commonConnectors";
const { ethers } = require("ethers");
const contracts = require("../../constants/contracts.json");
const oddEvenGameContractAddr = contracts.OddEvenGame[1];
const oddEvenGameContractAbi = contracts.OddEvenGame[0];

const usdcContractAddr = contracts.USDCToken[1];
const usdcContractAbi = contracts.USDCToken[0];
const sixDecimals = 6;

export const enterToOddEvenGame = async (betDecision, amount) => {
	try {
		if (typeof window.ethereum !== "undefined") {
			await requestAccount();
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			// usdc contract
			const contract = new ethers.Contract(
				oddEvenGameContractAddr,
				oddEvenGameContractAbi,
				signer
			);

			const approvTx = await approve(oddEvenGameContractAddr, amount);

			if (approvTx.success) {
				const tx = await contract.enterToOddEvenGame(betDecision, amount);

				const txREc = await tx.wait();

				return {
					success: true,
					msg: "Congratulations on successfully entering the game!",
				};
			} else {
				return {
					success: false,
					msg: approvTx.msg,
				};
			}
		} else {
			return {
				success: false,
				msg: "Please connect your wallet!",
			};
		}
	} catch (error) {
		return {
			success: false,
			msg: error.message,
		};
	}
};

export const getWalletBal = async (address) => {
	try {
		if (typeof window.ethereum !== "undefined") {
			await requestAccount();
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			const contract = new ethers.Contract(
				oddEvenGameContractAddr,
				oddEvenGameContractAbi,
				signer
			);

			const bal = await contract.balanceOf(
				address ? address : await signer.getAddress()
			);

			return {
				balance: ethers.utils.formatUnits(bal, sixDecimals),
				success: true,
			};
		} else {
			return {
				success: false,
				msg: "Please connect your wallet!",
			};
		}
	} catch (error) {
		return {
			success: false,
			msg: error.message,
		};
	}
};

export const approve = async (to, amount) => {
	try {
		if (typeof window.ethereum !== "undefined") {
			await requestAccount();
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();
			console.log({ signer });

			// usdc contract
			const contract = new ethers.Contract(
				usdcContractAddr,
				usdcContractAbi,
				signer
			);

			const tx = await contract.approve(to, amount);
			const txRec = await tx.wait();
			const { args } = txRec.events.find((event) => event.event === "Approval");

			return {
				data: args,
				success: true,
			};
		} else {
			return {
				success: false,
				msg: "Please connect your wallet!",
			};
		}
	} catch (error) {
		return {
			success: false,
			msg: error.message,
		};
	}
};

export const getOddEvenGameState = async () => {
	try {
		if (typeof window.ethereum !== "undefined") {
			await requestAccount();
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();
			// usdc contract
			const contract = new ethers.Contract(
				oddEvenGameContractAddr,
				oddEvenGameContractAbi,
				signer
			);

			console.log("called me");
			const result = await contract.getOddEvenGameState();

			console.log("result : ", result);
			return {
				data: result,
				success: true,
			};
		} else {
			return {
				success: false,
				msg: "Please connect your wallet!",
			};
		}
	} catch (error) {
		return {
			success: false,
			msg: error.message,
		};
	}
};
