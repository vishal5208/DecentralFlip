import { Header, Bet } from "../componenets";
const LandingPage = () => {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />

			<div className="pt-28 flex-grow bg-gradient-to-r from-orange-800 to-black p-10">
				<Bet />
			</div>
		</div>
	);
};

export default LandingPage;
