// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

error OddEvenGame__NotEnoughEthEntered();
error OddEvenGame__TransferFailed();
error OddEvenGame__NotOpen();
error OddEvenGame__UpKeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 raffleState
);

contract OddEvenGame is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Types declarations */
    enum OddEvenGameState {
        OPEN,
        CALCULATING
    }

    /* State variables */

    Player[] private s_players; // dynamic array to store players and their bet
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    struct Player {
        address player;
        uint256 amount;
        bool bet;
    }

    /* OddEvenGame variables */
    address private s_recentWinner;
    OddEvenGameState private s_lotteryState;
    uint256 private s_lastTimeStamp;
    uint256 private s_interval;
    address[] private winners;

    IERC20 public usdc;
    address public owner;

    /* Events */
    event OddEvenGameEnter(address indexed player, uint256 amount, bool bet);
    event RequestedOddEvenGameWinner(uint256 indexed requestID);
    event WinningAmountTranfered(uint256 winningAmount);
    event WinnersDeclared(address[] winners);
    event GameStatusChanged(OddEvenGameState gameStatus);

    constructor(
        address vrfCoordinatorV2,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval,
        address _usdcTokenAddress
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        owner = msg.sender;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotteryState = OddEvenGameState.OPEN;
        s_lastTimeStamp = block.timestamp;
        s_interval = interval;
        usdc = IERC20(_usdcTokenAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can perform this action");
        _;
    }

    function setInterval(uint256 interval) external onlyOwner {
        s_interval = interval;
    }

    // odd -> false, even -> true
    function enterToOddEvenGame(bool bet, uint256 amount) external {
        if (amount <= 0) revert OddEvenGame__NotEnoughEthEntered();

        if (s_lotteryState != OddEvenGameState.OPEN) {
            revert OddEvenGame__NotOpen();
        }

        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );

        s_players.push(Player(msg.sender, amount, bet));
        emit OddEvenGameEnter(msg.sender, amount, bet);
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        // returns requestID which contrains who's in it and other information
        (bool upkeepNeeded, ) = checkUpkeep("");

        if (!upkeepNeeded) {
            revert OddEvenGame__UpKeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_lotteryState)
            );
        }

        s_lotteryState = OddEvenGameState.CALCULATING;

        emit GameStatusChanged(s_lotteryState);

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestedOddEvenGameWinner(requestId);
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upKeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = (OddEvenGameState.OPEN == s_lotteryState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > s_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = (usdc.balanceOf(address(this)) > 0);

        upKeepNeeded = (isOpen && timePassed && hasBalance && hasPlayers);
        return (upKeepNeeded, "0x0");
    }

    function distributeWinnings(bool bet) private {
        uint256 totalPot = usdc.balanceOf(address(this));
        uint256 totalWinningBets = 0;

        // Calculate the total bets for the winning outcome
        for (uint256 i = 0; i < s_players.length; i++) {
            Player memory player = s_players[i];
            if (player.bet == bet) {
                totalWinningBets += player.amount;
            }
        }

        if (totalWinningBets == 0) {
            // No winners, no need to distribute
            return;
        }

        uint256 winnerIndex = 0;

        // Distribute winnings to each winner proportionally based on their bets
        for (uint256 i = 0; i < s_players.length; i++) {
            Player memory player = s_players[i];

            if (player.bet == bet) {
                uint256 winnings = (player.amount * totalPot) /
                    totalWinningBets;

                bool success = usdc.transfer(player.player, winnings);

                if (!success) {
                    revert OddEvenGame__TransferFailed();
                }

                winners.push(player.player);
                winnerIndex++;
            }
        }
    }

    function getWinners() public view returns (address[] memory) {
        return winners;
    }

    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 val = randomWords[0] % 2;

        if (val == 0) {
            distributeWinnings(false);
        } else {
            distributeWinnings(true);
        }

        // Emit event with winners
        emit WinnersDeclared(winners);

        // reset s_players, winners and reset states
        delete s_players;
        delete winners;
        s_lotteryState = OddEvenGameState.OPEN;

        emit GameStatusChanged(s_lotteryState);
    }

    /* View/Pure functions*/

    function getPlayer(uint256 index) public view returns (address) {
        Player memory player = s_players[index];
        return player.player;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getOddEvenGameState() public view returns (OddEvenGameState) {
        return s_lotteryState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return s_interval;
    }
}
