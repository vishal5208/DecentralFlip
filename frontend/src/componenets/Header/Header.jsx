import { Wallet } from "../Wallet/Wallet";

const Header = () => {
	try {
		if (typeof window.ethereum !== "undefined") {
			// reload when chain is changed
			window.ethereum.on("chainChanged", (_chainId) => {
				window.location.reload();
			});
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

	return (
		<header className="bg-gray-900 text-lg">
			<div className="flex  justify-evenly items-center px-4">
				<a href="/" className="text-white text-2xl font-bold cursor-pointer">
					OddEvenBet
				</a>

				<div className="pr-9 py-2">
					<Wallet />
				</div>
			</div>
		</header>
	);
};

export default Header;
