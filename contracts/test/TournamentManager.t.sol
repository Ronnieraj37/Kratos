// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../src/TournamentManager.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing
contract MockToken is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TournamentManagerTest is Test {
    TournamentManager public tournamentManager;
    PlayerBadge public playerBadge;
    MockToken public mockToken;

    address public owner;
    address public player1;
    address public player2;
    address public player3;
    address public player4;

    uint256 constant ENTRY_FEE = 0.1 ether;
    uint256 constant TOKEN_ENTRY_FEE = 100 * 10 ** 18; // 100 tokens

    // Events to test
    event PlayerRegistered(uint256 playerId, address playerAddress);
    event TournamentCreated(uint256 tournamentId, string name, uint256 entryFee, uint256 maxPlayers, uint256 startTime);
    event PlayerJoinedTournament(uint256 tournamentId, address playerAddress, uint256 entryFee);
    event TournamentStatusChanged(uint256 tournamentId, TournamentManager.TournamentStatus status);
    event ScoreSubmitted(uint256 tournamentId, address playerAddress, uint256 score);
    event BatchScoresSubmitted(uint256 tournamentId, address[] playerAddresses, uint256[] scores);
    event TournamentCompleted(uint256 tournamentId, address[] winners, uint256[] prizes);
    event TournamentCancelled(uint256 tournamentId, string reason);
    event PrizesDistributed(uint256 tournamentId, address[] winners, uint256[] amounts);
    event RefundsProcessed(uint256 tournamentId);

    function setUp() public {
        owner = address(this);
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");
        player3 = makeAddr("player3");
        player4 = makeAddr("player4");

        // Fund the test accounts
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);
        vm.deal(player4, 10 ether);

        // Create badge contract
        playerBadge = new PlayerBadge("Player Badge", "PBADGE", "https://example.com/badge/", 20);

        // Create tournament manager
        tournamentManager = new TournamentManager(address(playerBadge));

        // Create mock token
        mockToken = new MockToken();
        mockToken.mint(player1, 1000 * 10 ** 18);
        mockToken.mint(player2, 1000 * 10 ** 18);
        mockToken.mint(player3, 1000 * 10 ** 18);
        mockToken.mint(player4, 1000 * 10 ** 18);
    }

    /* ========== PLAYER REGISTRATION TESTS ========== */

    function testPlayerRegistration() public {
        vm.startPrank(player1);
        vm.expectEmit(true, true, false, true);
        emit PlayerRegistered(1, player1);
        tournamentManager.registerPlayer();
        vm.stopPrank();

        // Verify player was registered
        // Adapt this to match your actual struct layout
        (uint256 playerId, address playerAddress, uint256 totalWinnings) = getPlayerData(player1);
        assertEq(playerId, 1);
        assertEq(playerAddress, player1);
        assertEq(totalWinnings, 0);
    }

    function testCannotRegisterTwice() public {
        vm.startPrank(player1);
        tournamentManager.registerPlayer();

        vm.expectRevert();
        tournamentManager.registerPlayer();
        vm.stopPrank();
    }

    /* ========== TOURNAMENT CREATION TESTS ========== */

    function testCreateTournament() public {
        // Tournament with ETH entry fee
        string memory tournamentName = "Test Tournament";
        uint256 startTime = block.timestamp + 1 hours;
        uint256 maxPlayers = 4;

        vm.expectEmit(true, true, true, true);
        emit TournamentCreated(1, tournamentName, ENTRY_FEE, maxPlayers, startTime);

        tournamentManager.createTournament(
            tournamentName,
            ENTRY_FEE,
            address(0), // ETH
            maxPlayers,
            startTime,
            2 hours
        );

        // Verify tournament details
        // Adapt this to match your actual return values from getTournamentDetails
        (
            string memory name,
            uint256 entryFee,
            address tokenAddress,
            uint256 activePlayers,
            uint256 maxPlayersStored,
            uint256 startTimeStored,
            uint256 endTime,
            uint256 joinDeadline,
            uint256 scoreSubmissionDeadline,
            uint256 amountInTournament,
            TournamentManager.TournamentStatus status,
            bool prizesDistributed
        ) = tournamentManager.getTournamentDetails(1);

        assertEq(name, tournamentName);
        assertEq(entryFee, ENTRY_FEE);
        assertEq(tokenAddress, address(0));
        assertEq(activePlayers, 0);
        assertEq(maxPlayersStored, maxPlayers);
        assertEq(startTimeStored, startTime);
        assertEq(endTime, startTime + 2 hours);
        assertEq(scoreSubmissionDeadline, endTime + 30 minutes);
        assertEq(amountInTournament, 0);
        assertEq(uint256(status), uint256(TournamentManager.TournamentStatus.Open));
        assertEq(prizesDistributed, false);
    }

    function testCreateTournamentWithToken() public {
        string memory tournamentName = "Token Tournament";
        uint256 startTime = block.timestamp + 1 hours;
        uint256 maxPlayers = 4;

        tournamentManager.createTournament(
            tournamentName, TOKEN_ENTRY_FEE, address(mockToken), maxPlayers, startTime, 2 hours
        );

        // Verify token address in tournament
        (,, address tokenAddress,,,,,,,,,) = tournamentManager.getTournamentDetails(1);
        assertEq(tokenAddress, address(mockToken));
    }

    function testCannotCreateTournamentWithPastStartTime() public {
        vm.expectRevert();
        tournamentManager.createTournament(
            "Invalid Tournament",
            ENTRY_FEE,
            address(0),
            4,
            block.timestamp - 1, // Past time
            2 hours
        );
    }

    function testCannotCreateTournamentWithZeroPlayers() public {
        vm.expectRevert();
        tournamentManager.createTournament(
            "Invalid Tournament",
            ENTRY_FEE,
            address(0),
            0, // Invalid player count
            block.timestamp + 1 hours,
            2 hours
        );
    }

    /* ========== TOURNAMENT JOINING TESTS ========== */

    function testJoinTournament() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("ETH Tournament", ENTRY_FEE, address(0), 4, startTime, 2 hours);

        // Register player
        vm.startPrank(player1);
        tournamentManager.registerPlayer();

        // Join tournament
        vm.expectEmit(true, true, true, true);
        emit PlayerJoinedTournament(1, player1, ENTRY_FEE);

        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Verify player joined
        bool hasJoined = tournamentManager.hasPlayerJoined(1, player1);
        assertEq(hasJoined, true);

        // Verify tournament active player count and prize pool
        (,,, uint256 activePlayers,,,,,, uint256 amountInTournament,,) = tournamentManager.getTournamentDetails(1);
        assertEq(activePlayers, 1);
        assertEq(amountInTournament, ENTRY_FEE);
    }

    function testJoinTournamentWithDiscount() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("Discount Tournament", ENTRY_FEE, address(0), 4, startTime, 2 hours);

        // Register player and mint badge
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        vm.stopPrank();

        // Mint badge for player (20% discount)
        playerBadge.mintBadge(player1);

        // Calculate discounted fee
        uint256 discountedFee = ENTRY_FEE * 80 / 100; // 20% off

        // Join tournament with discount
        vm.startPrank(player1);
        vm.expectEmit(true, true, true, true);
        emit PlayerJoinedTournament(1, player1, discountedFee);

        tournamentManager.joinTournament{value: discountedFee}(1);
        vm.stopPrank();

        // Verify player joined
        bool hasJoined = tournamentManager.hasPlayerJoined(1, player1);
        assertEq(hasJoined, true);

        // Verify tournament prize pool reflects the discounted amount
        (,,,,,,,,, uint256 amountInTournament,,) = tournamentManager.getTournamentDetails(1);
        assertEq(amountInTournament, discountedFee);
    }

    function testJoinTournamentWithToken() public {
        // Create token tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament(
            "Token Tournament", TOKEN_ENTRY_FEE, address(mockToken), 4, startTime, 2 hours
        );

        // Register player
        vm.startPrank(player1);
        tournamentManager.registerPlayer();

        // Approve token spending
        mockToken.approve(address(tournamentManager), TOKEN_ENTRY_FEE);

        // Join tournament with token
        tournamentManager.joinTournament(1);
        vm.stopPrank();

        // Verify player joined
        bool hasJoined = tournamentManager.hasPlayerJoined(1, player1);
        assertEq(hasJoined, true);

        // Verify token transfer and tournament prize pool
        assertEq(mockToken.balanceOf(address(tournamentManager)), TOKEN_ENTRY_FEE);
        (,,,,,,,,, uint256 amountInTournament,,) = tournamentManager.getTournamentDetails(1);
        assertEq(amountInTournament, TOKEN_ENTRY_FEE);
    }

    function testCannotJoinWithoutRegistration() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("ETH Tournament", ENTRY_FEE, address(0), 4, startTime, 2 hours);

        // Try to join without registering
        vm.startPrank(player1);
        vm.expectRevert();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();
    }

    function testCannotJoinTwice() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("ETH Tournament", ENTRY_FEE, address(0), 4, startTime, 2 hours);

        // Register and join
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);

        // Try to join again
        vm.expectRevert();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();
    }

    function testCannotJoinAfterStart() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("ETH Tournament", ENTRY_FEE, address(0), 4, startTime, 2 hours);

        // Register player
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        vm.stopPrank();

        // Skip to after start time
        vm.warp(startTime + 1);

        // Try to join after start
        vm.startPrank(player1);
        vm.expectRevert();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();
    }

    function testTournamentStartsWhenFull() public {
        // Create tournament for 2 players
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("Small Tournament", ENTRY_FEE, address(0), 2, startTime, 2 hours);

        // Register and join with player1
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Register and join with player2
        vm.startPrank(player2);
        tournamentManager.registerPlayer();

        // Expect status change on joining
        vm.expectEmit(true, true, true, true);
        emit TournamentStatusChanged(1, TournamentManager.TournamentStatus.InProgress);

        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Verify tournament status
        (,,,,,,,,,, TournamentManager.TournamentStatus status,) = tournamentManager.getTournamentDetails(1);
        assertEq(uint256(status), uint256(TournamentManager.TournamentStatus.InProgress));
    }

    /* ========== SCORE SUBMISSION TESTS ========== */

    function testSubmitScore() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("Score Tournament", ENTRY_FEE, address(0), 2, startTime, 2 hours);

        // Register and join with player1 and player2
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player2);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Tournament should now be in progress

        // Submit score for player1
        vm.expectEmit(true, true, true, true);
        emit ScoreSubmitted(1, player1, 100);

        tournamentManager.submitScore(1, player1, 100);

        // Verify score
        uint256 score = tournamentManager.getPlayerScore(1, player1);
        assertEq(score, 100);
    }

    function testSubmitScoresBatch() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("Batch Score Tournament", ENTRY_FEE, address(0), 3, startTime, 2 hours);

        // Register and join with multiple players
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player2);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player3);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Prepare batch submission
        address[] memory players = new address[](3);
        players[0] = player1;
        players[1] = player2;
        players[2] = player3;

        uint256[] memory scores = new uint256[](3);
        scores[0] = 100;
        scores[1] = 200;
        scores[2] = 150;

        // Submit scores in batch
        vm.expectEmit(true, true, true, true);
        emit BatchScoresSubmitted(1, players, scores);

        tournamentManager.submitScoresBatch(1, players, scores);

        // Verify scores
        assertEq(tournamentManager.getPlayerScore(1, player1), 100);
        assertEq(tournamentManager.getPlayerScore(1, player2), 200);
        assertEq(tournamentManager.getPlayerScore(1, player3), 150);
    }

    function testCannotSubmitScoreForNonParticipant() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("Score Tournament", ENTRY_FEE, address(0), 2, startTime, 2 hours);

        // Register and join with player1
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player2);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Try to submit score for player3 who didn't join
        vm.expectRevert();
        tournamentManager.submitScore(1, player3, 100);
    }

    function testCannotSubmitScoreAfterDeadline() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("Score Tournament", ENTRY_FEE, address(0), 2, startTime, 2 hours);

        // Register and join with player1 and player2
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player2);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Tournament should now be in progress

        // Skip to after score submission deadline
        vm.warp(startTime + 2 hours + 30 minutes + 1);

        // Try to submit score after deadline
        vm.expectRevert();
        tournamentManager.submitScore(1, player1, 100);
    }

    /* ========== TOURNAMENT ENDING AND PRIZE TESTS ========== */

    function testEndTournament() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("End Tournament", ENTRY_FEE, address(0), 3, startTime, 2 hours);

        // Register and join with players
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player2);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player3);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Submit scores
        tournamentManager.submitScore(1, player1, 150);
        tournamentManager.submitScore(1, player2, 200);
        tournamentManager.submitScore(1, player3, 100);

        // Skip to after tournament end
        vm.warp(startTime + 2 hours + 1);

        // End tournament
        tournamentManager.endTournament(1);

        // Verify tournament status
        (,,,,,,,,,, TournamentManager.TournamentStatus status,) = tournamentManager.getTournamentDetails(1);
        assertEq(uint256(status), uint256(TournamentManager.TournamentStatus.Completed));

        // Verify winners order (should be sorted by score: player2, player1, player3)
        address[] memory winners = tournamentManager.getTournamentWinners(1);
        assertEq(winners.length, 3);
        assertEq(winners[0], player2); // 1st place
        assertEq(winners[1], player1); // 2nd place
        assertEq(winners[2], player3); // 3rd place
    }

    function testEndTournamentWithTiedScores() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("Tie Tournament", ENTRY_FEE, address(0), 3, startTime, 2 hours);

        // Register and join
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player2);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player3);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Submit tied scores for player1 and player2
        tournamentManager.submitScore(1, player1, 100);
        tournamentManager.submitScore(1, player2, 100); // Same score
        tournamentManager.submitScore(1, player3, 50);

        // Skip to after tournament end
        vm.warp(startTime + 2 hours + 1);

        // End tournament
        tournamentManager.endTournament(1);

        // Verify winners (with ties)
        // In case of ties, the sorting should maintain original order
        address[] memory winners = tournamentManager.getTournamentWinners(1);
        assertEq(winners.length, 3);

        // The last position should always be player3
        assertEq(winners[2], player3);

        // Check that both player1 and player2 are in the top positions
        bool player1InTop2 = (winners[0] == player1 || winners[1] == player1);
        bool player2InTop2 = (winners[0] == player2 || winners[1] == player2);

        assertTrue(player1InTop2);
        assertTrue(player2InTop2);
    }

    function testDistributePrizes() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("Prize Tournament", ENTRY_FEE, address(0), 3, startTime, 2 hours);

        // Register and join with players
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player2);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player3);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Submit scores
        tournamentManager.submitScore(1, player1, 150);
        tournamentManager.submitScore(1, player2, 200);
        tournamentManager.submitScore(1, player3, 100);

        // Skip to after tournament end
        vm.warp(startTime + 2 hours + 1);

        // End tournament
        tournamentManager.endTournament(1);

        // Record balances before prize distribution
        uint256 player1BalanceBefore = player1.balance;
        uint256 player2BalanceBefore = player2.balance;
        uint256 player3BalanceBefore = player3.balance;

        // Distribute prizes
        tournamentManager.distributePrizes(1);

        // Verify prize distribution
        uint256 totalPrize = ENTRY_FEE * 3;

        // 1st place (player2) gets 50%
        assertEq(player2.balance - player2BalanceBefore, totalPrize * 50 / 100);

        // 2nd place (player1) gets 30%
        assertEq(player1.balance - player1BalanceBefore, totalPrize * 30 / 100);

        // 3rd place (player3) gets 20%
        assertEq(player3.balance - player3BalanceBefore, totalPrize * 20 / 100);

        // Verify prizes distributed flag
        (,,,,,,,,,,, bool prizesDistributed) = tournamentManager.getTournamentDetails(1);
        assertEq(prizesDistributed, true);
    }

    function testCancelTournament() public {
        // Create tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament("Cancel Tournament", ENTRY_FEE, address(0), 4, startTime, 2 hours);

        // Register and join with players
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        vm.startPrank(player2);
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Record balances before cancellation
        uint256 player1BalanceBefore = player1.balance;
        uint256 player2BalanceBefore = player2.balance;

        // Cancel tournament
        tournamentManager.cancelTournament(1, "Testing cancellation");

        // Verify tournament status
        (,,,,,,,,,, TournamentManager.TournamentStatus status,) = tournamentManager.getTournamentDetails(1);
        assertEq(uint256(status), uint256(TournamentManager.TournamentStatus.Cancelled));

        // Verify refunds
        assertEq(player1.balance, player1BalanceBefore + ENTRY_FEE);
        assertEq(player2.balance, player2BalanceBefore + ENTRY_FEE);
    }

    function testCancelTokenTournament() public {
        // Create token tournament
        uint256 startTime = block.timestamp + 1 hours;
        tournamentManager.createTournament(
            "Token Cancel Tournament", TOKEN_ENTRY_FEE, address(mockToken), 2, startTime, 2 hours
        );

        // Register and join with players
        vm.startPrank(player1);
        tournamentManager.registerPlayer();
        mockToken.approve(address(tournamentManager), TOKEN_ENTRY_FEE);
        tournamentManager.joinTournament(1);
        vm.stopPrank();

        vm.startPrank(player2);
        tournamentManager.registerPlayer();
        mockToken.approve(address(tournamentManager), TOKEN_ENTRY_FEE);
        tournamentManager.joinTournament(1);
        vm.stopPrank();

        // Record token balances before cancellation
        uint256 player1TokensBefore = mockToken.balanceOf(player1);
        uint256 player2TokensBefore = mockToken.balanceOf(player2);

        // Cancel tournament
        tournamentManager.cancelTournament(1, "Testing token cancellation");

        // Verify tournament status
        (,,,,,,,,,, TournamentManager.TournamentStatus status,) = tournamentManager.getTournamentDetails(1);
        assertEq(uint256(status), uint256(TournamentManager.TournamentStatus.Cancelled));

        // Verify token refunds
        assertEq(mockToken.balanceOf(player1), player1TokensBefore + TOKEN_ENTRY_FEE);
        assertEq(mockToken.balanceOf(player2), player2TokensBefore + TOKEN_ENTRY_FEE);
    }

    //helpers:
    function getPlayerData(address playerAddress)
        internal
        view
        returns (uint256 playerId, address addr, uint256 totalWinnings)
    {
        (playerId, addr, totalWinnings) = tournamentManager.players(playerAddress);
    }
}
