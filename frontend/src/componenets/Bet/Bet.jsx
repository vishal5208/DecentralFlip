import { useState, useEffect } from "react";
import {
	enterToOddEvenGame,
	getOddEvenGameState,
} from "../backendConnectors/oddEvenGameConnector";
import { useConnectWallet } from "../Wallet/useConnectWallet";
import { ethers } from "ethers";

const contracts = require("../../constants/contracts.json");
const oddEvenGameContractAddr = contracts.OddEvenGame[1];
const oddEvenGameContractAbi = contracts.OddEvenGame[0];

const Bet = () => {
	const [bet, setBet] = useState("");
	const [amount, setAmount] = useState("0");
	const [gameStatus, setGameStatus] = useState(0);
	const [winners, setWinners] = useState([]);

	const { provider } = useConnectWallet();

	const handleSubmit = async (event) => {
		event.preventDefault();

		const result = await enterToOddEvenGame(bet, amount * 10 ** 6);

		if (result.success) {
			console.log(result.msg);
		} else {
			console.log(result.msg);
		}
	};

	useEffect(() => {
		let oddEvenGameContract; // Declare contract variable outside the fetchEvent function

		const fetchEvent = async () => {
			if (!provider) {
				console.error("Ethereum provider not available.");
				return;
			}

			try {
				// Load the contract instance only once
				if (!oddEvenGameContract) {
					oddEvenGameContract = new ethers.Contract(
						oddEvenGameContractAddr,
						oddEvenGameContractAbi,
						provider
					);
				}

				// Listen for the "OddEvenGameEnter" event
				oddEvenGameContract.on("GameStatusChanged", (gameStatus) => {
					console.log("gameStatus:", gameStatus);
					setGameStatus(gameStatus);
				});

				oddEvenGameContract.on("WinnersDeclared", (winnersArray) => {
					console.log("winnersArray:", winnersArray);
					setWinners(winnersArray); // Use setWinners to update the state
				});
			} catch (error) {
				console.error("Error while setting up event listener:", error);
			}
		};

		fetchEvent();

		// Clean up the event listener when the component is unmounted
		return () => {
			if (oddEvenGameContract) {
				oddEvenGameContract.removeAllListeners("OddEvenGameEnter");
			}
		};
	}, [provider]);

	// to keep track of game status every 10 seconds
	useEffect(() => {
		const fetchGameStatus = async () => {
			const result = await getOddEvenGameState();

			if (result.success) {
				console.log("gameStatus fetched after 10 seconds:", result.data);
				setGameStatus(result.data); // The result.data should be a uint8 value representing the game state
			}
		};

		const interval = setInterval(fetchGameStatus, 10000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<div className="">
			<div>
				<div className="w-1/3 mx-auto">
					<p className="font-bold text-center text-3xl">
						You can place a bet here
					</p>
					<form onSubmit={handleSubmit}>
						<div className="grid sm:grid-cols-4 sm:gap-6 gap-3">
							{/* Region */}
							<div className="col-span-full flex flex-col space-y-2 justify-center">
								<label
									htmlFor="bet"
									className="font-semibold sm:text-xl font-spaceGrotesk"
								>
									Bet
								</label>
								<select
									id="bet"
									className="bg-[#1A0142] text-white  uppercase border border-solid border-[#B1B1B1] rounded-lg sm:text-lg sm:p-4 p-2 sm:w-full"
									value={bet}
									onChange={(event) => setBet(event.target.value)}
								>
									<option value="">Select a bet</option>
									<option value={true}>Heads</option>
									<option value={false}>Tails</option>
								</select>
							</div>

							{/* amount */}
							<div className="col-span-full flex flex-col space-y-2  justify-center">
								<label htmlFor="amount" className="font-semibold sm:text-xl">
									Amount
								</label>
								<input
									id="amount"
									type="text"
									pattern="\d*"
									onInput={(event) => {
										event.target.value = event.target.value.replace(/\D/g, "");
									}}
									className="bg-[#1A0142] text-white border border-solid border-[#B1B1B1] rounded-lg sm:text-lg sm:p-4 p-2 sm:w-full"
									placeholder="Amount in $"
									value={amount}
									onChange={(event) => setAmount(event.target.value)}
								></input>
							</div>

							<div className="sm:col-start-2 sm:col-span-2 ">
								<button
									type="submit"
									className="text-white sm:text-2xl text-base font-semibold p-3 mt-2 rounded shadow bg-gradient-to-l  from-black to-purple-800 sm:py-2 sm:w-full"
								>
									Approve and Confirm
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>

			<div className="mt-8 flex flex-col w-1/2 mx-auto">
				<p className="font-bold text-3xl">Winners</p>

				{/* Show winners here */}
				<div className="mt-4">
					{winners.length > 0 ? (
						<ul className="list-disc list-inside">
							{winners.map((winner, index) => (
								<li key={index} className="text-lg">
									{winner}
								</li>
							))}
						</ul>
					) : (
						<p className="text-lg">No winners yet.</p>
					)}
				</div>
			</div>
			<div className="bg-blue-500 text-white px-4 py-2 mt-4 rounded-lg absolute top-16 right-2 m-2">
				Game Status: {gameStatus === 0 ? "OPEN" : "CALCULATING"}
			</div>
		</div>
	);
};

export default Bet;
