import { Header, Bet } from "../componenets";
const LandingPage = () => {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />

			<div className="flex-grow">
				<Bet />
			</div>
		</div>
	);
};

export default LandingPage;
