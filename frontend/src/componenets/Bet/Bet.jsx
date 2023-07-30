import { useState, useEffect } from "react";
import {
	enterToOddEvenGame,
	getOddEvenGameState,
	getInterval,
	getLatestTimeStamp,
} from "../backendConnectors/oddEvenGameConnector";
import { useConnectWallet } from "../Wallet/useConnectWallet";
import { ethers } from "ethers";

const contracts = require("../../constants/contracts.json");
const oddEvenGameContractAddr = contracts.OddEvenGame[1];
const oddEvenGameContractAbi = contracts.OddEvenGame[0];
let oddEvenGameContract;

const Bet = () => {
	const [bet, setBet] = useState("");
	const [amount, setAmount] = useState("0");
	const [gameStatus, setGameStatus] = useState(0);
	const [winners, setWinners] = useState([]);
	const [remainingTime, setRemainingTime] = useState(null);
	const [firstPlayerEntered, setFirstPlayerEntered] = useState(null);

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

	// listnes for winners declared and game stataus
	useEffect(() => {
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
					setGameStatus(gameStatus);
				});

				// listen for winners
				oddEvenGameContract.on("WinnersDeclared", (winnersArray) => {
					console.log("winnersArray:", winnersArray);
					setWinners(winnersArray); // Use setWinners to update the state
				});

				// Listen for the "FirstPlayerEntered" event
				oddEvenGameContract.on(
					"FirstPlayerEntered",
					(firstPlayerEnteredTime) => {
						setFirstPlayerEntered(firstPlayerEnteredTime);
					}
				);
			} catch (error) {
				console.error("Error while setting up event listener:", error);
			}
		};

		fetchEvent();

		// Clean up the event listener when the component is unmounted
		return () => {
			if (oddEvenGameContract) {
				oddEvenGameContract.removeAllListeners("OddEvenGameEnter");
				oddEvenGameContract.removeAllListeners("WinnersDeclared");
				oddEvenGameContract.removeAllListeners("FirstPlayerEntered");
			}
		};
	}, [provider]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (!provider) {
					console.error("Ethereum provider not available.");
					return;
				}

				// if game is open then listen first player's entrance
				if (gameStatus === 0 && firstPlayerEntered) {
					// Get interval
					const intervalResponse = await getInterval();
					if (!intervalResponse.success) {
						console.error("Failed to get interval:", intervalResponse.msg);
						return;
					}

					const interval = intervalResponse.data;
					const currentTimeStamp = Math.floor(Date.now() / 1000);
					const timeElapsed = currentTimeStamp - firstPlayerEntered - 13;
					const timeRemaining = Math.max(0, interval - timeElapsed);
					setRemainingTime(timeRemaining);
				} else if (gameStatus === 1) {
					// Reset winners and remainingTime if the game is not open
					setWinners([]);
					setRemainingTime(null);
					setFirstPlayerEntered(null);
				}
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};

		fetchData();

		const interval = setInterval(() => {
			// Decrement the remaining time every second
			setRemainingTime((prevRemainingTime) =>
				prevRemainingTime !== null ? Math.max(0, prevRemainingTime - 1) : null
			);
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, [provider, gameStatus, firstPlayerEntered]);

	const formatTime = (timeInSeconds) => {
		const hours = Math.floor(timeInSeconds / 3600);
		const minutes = Math.floor((timeInSeconds % 3600) / 60);
		const seconds = timeInSeconds % 60;

		return `${hours.toString().padStart(2, "0")}:${minutes
			.toString()
			.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	};

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
				<p className="font-bold text-3xl">
					Congratulations to the winners of the last game!
				</p>

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

			<div>
				{gameStatus === 0 ? (
					remainingTime !== null ? (
						<p>Remaining Time: {formatTime(remainingTime)}</p>
					) : (
						<p>
							Currently awaiting the first player's entry to initiate the game
							and start the timer.
						</p>
					)
				) : remainingTime === 0 ? (
					<p>The results will be announced shortly!</p>
				) : (
					<p>The game is currently not open for betting.</p>
				)}
			</div>
		</div>
	);
};

export default Bet;
