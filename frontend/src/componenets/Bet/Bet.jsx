import { useState, useEffect } from "react";
import {
	enterToOddEvenGame,
	getOddEvenGameState,
	getInterval,
	getUsdc,
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
	const [gameInterval, setGameInterval] = useState(null);
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

		const fetchGameInterval = async () => {
			// Get interval
			const intervalResponse = await getInterval();
			if (!intervalResponse.success) {
				console.error("Failed to get interval:", intervalResponse.msg);
				return;
			}

			const interval = intervalResponse.data;
			setGameInterval(interval.toNumber());
		};

		fetchEvent();
		fetchGameInterval();

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
					const currentTimeStamp = Math.floor(Date.now() / 1000);
					const timeElapsed = currentTimeStamp - firstPlayerEntered - 13;
					const timeRemaining = Math.max(0, gameInterval - timeElapsed);
					setRemainingTime(timeRemaining);
				} else {
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
	}, [provider, gameStatus, firstPlayerEntered, gameInterval]);

	const formatTime = (timeInSeconds) => {
		if (timeInSeconds === 0) {
			setRemainingTime(null);
		}

		const hours = Math.floor(timeInSeconds / 3600);
		const minutes = Math.floor((timeInSeconds % 3600) / 60);
		const seconds = timeInSeconds % 60;

		return `${hours.toString().padStart(2, "0")}:${minutes
			.toString()
			.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	};

	const handleGetToken = async () => {
		const tx = await getUsdc();

		if (tx.success) {
			alert("1000 USDC tokens are sent successfully.");
		} else {
			console.log(tx.msg);
		}
	};

	return (
		<div className="">
			<div className="flex flex-col items-center justify-center space-y-20">
				<div className="w-1/3 border-2 border-solid border-blue-600 px-4 py-8">
					<p className="font-bold text-white text-center text-3xl mb-6">
						Place Your Bet Now
					</p>
					<form onSubmit={handleSubmit} className="grid grid-cols-4 gap-3">
						{/* Region */}
						<div className="col-span-full flex flex-col space-y-2 justify-center">
							<label htmlFor="bet" className="font-semibold text-white text-xl">
								Bet
							</label>
							<select
								id="bet"
								className="bg-[#1A0142] text-white uppercase border border-solid border-[#B1B1B1] rounded-lg text-lg p-2"
								value={bet}
								onChange={(event) => setBet(event.target.value)}
							>
								<option value="">Select a bet</option>
								<option value={true}>Heads</option>
								<option value={false}>Tails</option>
							</select>
						</div>

						{/* amount */}
						<div className="col-span-full flex flex-col space-y-2 justify-center">
							<label
								htmlFor="amount"
								className="font-semibold text-white text-xl"
							>
								Amount
							</label>
							<input
								id="amount"
								type="number"
								pattern="\d*"
								onInput={(event) => {
									event.target.value = event.target.value.replace(/\D/g, "");
								}}
								className="bg-[#1A0142] text-white border border-solid border-[#B1B1B1] rounded-lg text-lg p-2"
								placeholder="Amount in $"
								value={amount}
								onChange={(event) => setAmount(event.target.value)}
							/>
						</div>

						<div className="col-start-2 col-span-2 flex justify-center items-center">
							<button
								type="submit"
								className="text-white font-semibold text-2xl py-2 px-4 rounded-lg bg-gradient-to-l from-black to-purple-800"
							>
								Approve and Confirm
							</button>
						</div>
					</form>
				</div>
				{/* last winners */}
				<div className="flex flex-col  space-y-3">
					<p className="font-bold text-white text-3xl">
						Congratulations to the Winners of the Last Game!
					</p>

					{/* Show winners here */}
					<div className="mt-4">
						{winners.length > 0 ? (
							<ul className="list-disc list-inside">
								{winners.map((winner, index) => (
									<li key={index} className="text-lg text-white">
										{winner}
									</li>
								))}
							</ul>
						) : (
							<p className="text-xl  font-semibol  text-green-400">
								No winners yet.
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="bg-blue-500 uppercase text-white px-4 py-2 rounded-lg  font-bold absolute text-2xl top-40 right-0">
				{/* Regarding time */}
				<div className="text-white mt-4">
					{gameStatus === 0 ? (
						remainingTime !== null ? (
							<p className="text-2xl">
								Remaining Time: {formatTime(remainingTime)}
							</p>
						) : (
							<p className="font-bold text-2x">
								Waiting for the First Player to Enter...
							</p>
						)
					) : remainingTime === 0 ? (
						<p className="font-bold text-2xl">
							Results will be announced shortly!
						</p>
					) : (
						<p className="font-bold text-2xl">
							The game is currently not open for betting.
						</p>
					)}
				</div>
			</div>

			<div className="flex  space-y-10 absolute top-36 flex-col left-2 border-2 border-solid border-red-600">
				{/* get token */}
				<div className="text-white shadow-md rounded-lg px-8 py-6 max-w-lg mx-auto mt-10 border-2 border-solid border-red-600">
					<h2 className="text-2xl font-bold mb-4">Get 1000 usdc token here</h2>
					<button
						onClick={handleGetToken}
						className="text-white sm:text-2xl text-base font-semibold p-3 mt-2 rounded shadow bg-gradient-to-l  from-black to-purple-800 sm:py-2 sm:w-full"
					>
						Get Token
					</button>
				</div>

				{/* steps and instrucitons	 */}
				<div className=" text-white shadow-md rounded-lg px-8 py-6 max-w-lg font-semibold text-xl">
					<h2 className="text-2xl font-bold mb-4">Steps to Enter the Game:</h2>
					<ol className="list-decimal ml-6 space-y-3">
						<li>Fill out the bet form and click "Approve and Confirm".</li>
						<li>
							The game starts after the first player enters and runs for a fixed
							interval of time.
						</li>
					</ol>
					<p className="mt-4">Enjoy and win big rewards! Good luck!</p>
				</div>
			</div>
			<div className="bg-blue-500 uppercase text-white px-4 py-2 mt-4 rounded-lg absolute right-2 top-16 m-2  font-semibold">
				Game Status: {gameStatus === 0 ? "OPEN" : "CALCULATING"}
			</div>

			<div className="bg-blue-500 uppercase text-white px-4 py-2 mt-4 rounded-lg absolute left-2 top-16 m-2 font-semibold">
				Game Interval: {formatTime(gameInterval)}
			</div>
		</div>
	);
};

export default Bet;
