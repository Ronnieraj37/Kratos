// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../src/TournamentManager.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Simplified test token for invariant testing
contract TestToken is ERC20 {
    constructor() ERC20("Test Token", "TEST") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TournamentManagerInvariantTest is Test {
    TournamentManager public tournamentManager;
    PlayerBadge public playerBadge;
    TestToken public testToken;

    // Actor contracts to interact with the protocol
    TournamentHandler public handler;
    address payable[] public users;

    function setUp() public {
        // Create badge contract
        playerBadge = new PlayerBadge("Player Badge", "PBADGE", "https://example.com/badge/", 20);

        // Create tournament manager
        tournamentManager = new TournamentManager(address(playerBadge));

        // Create test token
        testToken = new TestToken();

        // Generate actor addresses
        for (uint256 i = 0; i < 10; i++) {
            address payable user = payable(makeAddr(string(abi.encodePacked("user", vm.toString(i)))));
            vm.deal(user, 100 ether);
            testToken.mint(user, 10000 * 10 ** 18);
            users.push(user);
        }

        // Setup handler
        handler = new TournamentHandler(tournamentManager, playerBadge, testToken, users);

        // Fund handler
        testToken.transfer(address(handler), 100000 * 10 ** 18);
        vm.deal(address(handler), 100 ether);

        // Mint badges for some users
        for (uint256 i = 0; i < 5; i++) {
            playerBadge.mintBadge(users[i]);
        }

        // Label contracts for better trace output
        vm.label(address(tournamentManager), "TournamentManager");
        vm.label(address(playerBadge), "PlayerBadge");
        vm.label(address(testToken), "TestToken");
        vm.label(address(handler), "Handler");
    }

    function invariant_moneyConservation() public {
        // Sum all ETH in the system
        uint256 totalETHInSystem = address(tournamentManager).balance;

        // This invariant checks that the total ETH in the tournament manager
        // never exceeds what was paid in by users minus what was paid out
        if (handler.totalETHDeposited() > handler.totalETHWithdrawn()) {
            assertLe(
                totalETHInSystem,
                handler.totalETHDeposited() - handler.totalETHWithdrawn(),
                "More ETH in system than accounted for"
            );
        }
    }

    function invariant_tokenConservation() public {
        // Sum all tokens in the system
        uint256 totalTokensInSystem = testToken.balanceOf(address(tournamentManager));

        // This invariant checks that the total tokens in the tournament manager
        // never exceeds what was paid in by users minus what was paid out
        if (handler.totalTokensDeposited() > handler.totalTokensWithdrawn()) {
            assertLe(
                totalTokensInSystem,
                handler.totalTokensDeposited() - handler.totalTokensWithdrawn(),
                "More tokens in system than accounted for"
            );
        }
    }

    function invariant_tournamentConsistency() public {
        // Get all tournaments that were ever created
        uint256[] memory tournamentIds = handler.getTournamentIds();

        for (uint256 i = 0; i < tournamentIds.length; i++) {
            uint256 tid = tournamentIds[i];

            // Get tournament details
            (
                ,
                ,
                address tokenAddress,
                uint256 activePlayers,
                uint256 maxPlayers,
                ,
                ,
                ,
                ,
                uint256 amountInTournament,
                TournamentManager.TournamentStatus status,
                bool prizesDistributed
            ) = tournamentManager.getTournamentDetails(tid);

            // Get actual participants
            address[] memory participants = tournamentManager.getTournamentParticipants(tid);

            // Invariant: activePlayers should match actual participant count
            assertEq(activePlayers, participants.length, "Active players count mismatch");

            // Invariant: activePlayers should never exceed maxPlayers
            assertLe(activePlayers, maxPlayers, "Active players exceeds max players");

            // Invariant: If tournament is InProgress, it should be full
            if (status == TournamentManager.TournamentStatus.InProgress) {
                assertEq(activePlayers, maxPlayers, "InProgress tournament not full");
            }

            // Invariant: If tournament is Completed, prizes should be distributed
            if (
                status == TournamentManager.TournamentStatus.Completed && handler.hasTournamentEnded(tid)
                    && participants.length > 0
            ) {
                address[] memory winners = tournamentManager.getTournamentWinners(tid);
                assertGt(winners.length, 0, "Completed tournament has no winners");

                // If prizes are distributed, winners should have received their winnings
                if (prizesDistributed) {
                    // Check that prize distribution follows percentage rules
                    if (winners.length == 1) {
                        // With 1 winner, they should get 100%
                        assertEq(
                            handler.getWinnerPrize(tid, 0), amountInTournament, "Single winner didn't get full prize"
                        );
                    } else if (winners.length == 2) {
                        // With 2 winners, they should get 50% and 30%
                        assertEq(
                            handler.getWinnerPrize(tid, 0), amountInTournament * 50 / 100, "First winner didn't get 50%"
                        );
                        assertEq(
                            handler.getWinnerPrize(tid, 1),
                            amountInTournament * 30 / 100,
                            "Second winner didn't get 30%"
                        );
                    } else if (winners.length >= 3) {
                        // With 3+ winners, they should get 50%, 30%, and 20%
                        assertEq(
                            handler.getWinnerPrize(tid, 0), amountInTournament * 50 / 100, "First winner didn't get 50%"
                        );
                        assertEq(
                            handler.getWinnerPrize(tid, 1),
                            amountInTournament * 30 / 100,
                            "Second winner didn't get 30%"
                        );
                        assertEq(
                            handler.getWinnerPrize(tid, 2), amountInTournament * 20 / 100, "Third winner didn't get 20%"
                        );
                    }
                }
            }

            // Invariant: If tournament uses tokens, check token balances
            if (tokenAddress != address(0) && status != TournamentManager.TournamentStatus.Cancelled) {
                // The tournament manager should hold at least the tournament's prize pool in tokens
                // unless prizes have been distributed
                if (!prizesDistributed) {
                    assertGe(
                        IERC20(tokenAddress).balanceOf(address(tournamentManager)),
                        amountInTournament,
                        "Token balance less than prize pool"
                    );
                }
            }
        }
    }

    function invariant_playerConsistency() public {
        // Check consistency for all players
        address[] memory registeredPlayers = handler.getRegisteredPlayers();

        for (uint256 i = 0; i < registeredPlayers.length; i++) {
            address player = registeredPlayers[i];

            // Get player data and tournament history
            (uint256 playerId, address playerAddress, uint256 totalWinnings) = handler.getPlayerData(player);

            // Player might not have tournaments yet, wrap this in try-catch
            uint256[] memory playerTournaments;
            try tournamentManager.getPlayerTournaments(player) returns (uint256[] memory tournaments) {
                playerTournaments = tournaments;
            } catch {
                // If function reverts, player might not be properly registered. Skip further checks.
                continue;
            }

            // Invariant: Player ID should be non-zero for registered players
            assertGt(playerId, 0, "Player ID is zero for registered player");

            // Invariant: Player address should match
            assertEq(playerAddress, player, "Player address mismatch");

            // Check each tournament the player participated in
            for (uint256 j = 0; j < playerTournaments.length; j++) {
                uint256 tid = playerTournaments[j];

                // Invariant: Player should be marked as joined for their tournaments
                bool hasJoined = tournamentManager.hasPlayerJoined(tid, player);
                assertTrue(hasJoined, "Player not marked as joined for their tournament");

                // Get tournament participants and check player is included
                address[] memory participants = tournamentManager.getTournamentParticipants(tid);
                bool found = false;
                for (uint256 k = 0; k < participants.length; k++) {
                    if (participants[k] == player) {
                        found = true;
                        break;
                    }
                }
                assertTrue(found, "Player not found in tournament participants");
            }

            // Track winnings for completed tournaments
            uint256 calculatedWinnings = 0;
            for (uint256 j = 0; j < playerTournaments.length; j++) {
                uint256 tid = playerTournaments[j];

                // Get tournament details
                (
                    string memory name,
                    uint256 entryFee,
                    address tokenAddress,
                    uint256 activePlayers,
                    uint256 maxPlayers,
                    uint256 startTime,
                    uint256 endTime,
                    uint256 joinDeadline,
                    uint256 scoreSubmissionDeadline,
                    uint256 amountInTournament,
                    TournamentManager.TournamentStatus status,
                    bool prizesDistributed
                ) = tournamentManager.getTournamentDetails(tid);

                if (status == TournamentManager.TournamentStatus.Completed && prizesDistributed) {
                    address[] memory winners = tournamentManager.getTournamentWinners(tid);

                    // Check if player is a winner
                    for (uint256 k = 0; k < winners.length; k++) {
                        if (winners[k] == player) {
                            calculatedWinnings += handler.getWinnerPrize(tid, k);
                            break;
                        }
                    }
                }
            }

            // Invariant: Player's total winnings should match calculated winnings
            assertEq(totalWinnings, calculatedWinnings, "Player total winnings mismatch");
        }
    }

    function invariant_callSummary() public view {
        handler.callSummary();
    }
}

contract TournamentHandler is Test {
    TournamentManager public tournamentManager;
    PlayerBadge public playerBadge;
    TestToken public testToken;
    address payable[] public users;

    // Track tournament data
    uint256[] public tournamentIds;
    mapping(uint256 => bool) public tournamentEnded;
    mapping(uint256 => mapping(uint256 => uint256)) public winnerPrizes; // tournament -> winner index -> prize

    // Track registered players
    address[] public registeredPlayers;

    // Track balances
    uint256 public initialETHBalance;
    uint256 public initialTokenBalance;
    uint256 public totalETHDeposited;
    uint256 public totalETHWithdrawn;
    uint256 public totalTokensDeposited;
    uint256 public totalTokensWithdrawn;

    // Track call counts for debugging
    uint256 public registerPlayerCalls;
    uint256 public createTournamentCalls;
    uint256 public joinTournamentCalls;
    uint256 public submitScoreCalls;
    uint256 public endTournamentCalls;
    uint256 public distributePrizesCalls;
    uint256 public cancelTournamentCalls;

    constructor(
        TournamentManager _tournamentManager,
        PlayerBadge _playerBadge,
        TestToken _testToken,
        address payable[] memory _users
    ) {
        tournamentManager = _tournamentManager;
        playerBadge = _playerBadge;
        testToken = _testToken;
        users = _users;
        initialETHBalance = address(this).balance;
        initialTokenBalance = testToken.balanceOf(address(this));

        // Initialize balance tracking to match initial balances
        totalETHDeposited = 0;
        totalETHWithdrawn = 0;
        totalTokensDeposited = 0;
        totalTokensWithdrawn = 0;
    }

    // Helper functions to get data for invariants
    function getTournamentIds() external view returns (uint256[] memory) {
        return tournamentIds;
    }

    function getRegisteredPlayers() external view returns (address[] memory) {
        return registeredPlayers;
    }

    function hasTournamentEnded(uint256 tournamentId) external view returns (bool) {
        return tournamentEnded[tournamentId];
    }

    function getWinnerPrize(uint256 tournamentId, uint256 winnerIndex) external view returns (uint256) {
        return winnerPrizes[tournamentId][winnerIndex];
    }

    function getPlayerData(address player) external view returns (uint256, address, uint256) {
        (uint256 playerId, address playerAddress, uint256 totalWinnings) = tournamentManager.players(player);
        return (playerId, playerAddress, totalWinnings);
    }

    // Register a player
    function registerPlayer(uint256 userIndex) public {
        userIndex = bound(userIndex, 0, users.length - 1);
        address user = users[userIndex];

        // Only register if not already registered
        try tournamentManager.players(user) returns (uint256 playerId, address playerAddress, uint256 totalWinnings) {
            if (playerId == 0) {
                vm.prank(user);
                tournamentManager.registerPlayer();
                registeredPlayers.push(user);
            }
        } catch {
            // If call fails, register the player
            vm.prank(user);
            tournamentManager.registerPlayer();
            registeredPlayers.push(user);
        }

        registerPlayerCalls++;
    }

    // Create a tournament
    function createTournament(
        string memory name,
        uint256 entryFee,
        bool useTokens,
        uint256 maxPlayers,
        uint256 startTime,
        uint256 duration
    ) public {
        // Bound parameters to reasonable values
        entryFee = bound(entryFee, 0, 10 ether);
        maxPlayers = bound(maxPlayers, 2, 10);
        startTime = bound(startTime, block.timestamp + 1 hours, block.timestamp + 30 days);
        duration = bound(duration, 1 hours, 7 days);

        address tokenAddress = useTokens ? address(testToken) : address(0);

        // Create tournament
        uint256 tournamentId = tournamentManager.getTournamentWinners.selector.length + tournamentIds.length + 1;
        tournamentManager.createTournament(name, entryFee, tokenAddress, maxPlayers, startTime, duration);

        tournamentIds.push(tournamentId);
        createTournamentCalls++;
    }

    // Join a tournament
    function joinTournament(uint256 userIndex, uint256 tournamentIndex) public {
        if (tournamentIds.length == 0 || registeredPlayers.length == 0) return;

        userIndex = bound(userIndex, 0, registeredPlayers.length - 1);
        tournamentIndex = bound(tournamentIndex, 0, tournamentIds.length - 1);

        address user = registeredPlayers[userIndex];
        uint256 tournamentId = tournamentIds[tournamentIndex];

        // Get tournament details
        try tournamentManager.getTournamentDetails(tournamentId) returns (
            string memory name,
            uint256 entryFee,
            address tokenAddress,
            uint256 activePlayers,
            uint256 maxPlayers,
            uint256 startTime,
            uint256 endTime,
            uint256 joinDeadline,
            uint256 scoreSubmissionDeadline,
            uint256 amountInTournament,
            TournamentManager.TournamentStatus status,
            bool prizesDistributed
        ) {
            // Only join if tournament is open, not full, and not started
            if (
                status != TournamentManager.TournamentStatus.Open || activePlayers >= maxPlayers
                    || block.timestamp >= startTime
            ) {
                return;
            }

            // Check if player already joined
            if (tournamentManager.hasPlayerJoined(tournamentId, user)) {
                return;
            }

            // Calculate fee with potential discount
            uint256 feeToPayPlayer = entryFee;
            if (address(playerBadge) != address(0) && playerBadge.balanceOf(user) > 0) {
                uint8 discount = playerBadge.discountPercentage();
                feeToPayPlayer = entryFee * (100 - discount) / 100;
            }

            if (tokenAddress == address(0)) {
                // ETH tournament
                if (user.balance < feeToPayPlayer) return;

                vm.startPrank(user);
                try tournamentManager.joinTournament{value: feeToPayPlayer}(tournamentId) {
                    totalETHDeposited += feeToPayPlayer;
                } catch {
                    // Ignore failures
                }
                vm.stopPrank();
            } else {
                // Token tournament
                if (IERC20(tokenAddress).balanceOf(user) < feeToPayPlayer) return;

                vm.startPrank(user);
                IERC20(tokenAddress).approve(address(tournamentManager), feeToPayPlayer);
                try tournamentManager.joinTournament(tournamentId) {
                    totalTokensDeposited += feeToPayPlayer;
                } catch {
                    // Ignore failures
                }
                vm.stopPrank();
            }
        } catch {
            // Ignore failures
        }

        joinTournamentCalls++;
    }

    // Submit scores for players in a tournament
    function submitScores(uint256 tournamentIndex) public {
        if (tournamentIds.length == 0) return;

        tournamentIndex = bound(tournamentIndex, 0, tournamentIds.length - 1);
        uint256 tournamentId = tournamentIds[tournamentIndex];

        // Get tournament details
        try tournamentManager.getTournamentDetails(tournamentId) returns (
            string memory name,
            uint256 entryFee,
            address tokenAddress,
            uint256 activePlayers,
            uint256 maxPlayers,
            uint256 startTime,
            uint256 endTime,
            uint256 joinDeadline,
            uint256 scoreSubmissionDeadline,
            uint256 amountInTournament,
            TournamentManager.TournamentStatus status,
            bool prizesDistributed
        ) {
            // Only submit scores if tournament is in progress and before deadline
            if (
                status != TournamentManager.TournamentStatus.InProgress || block.timestamp > scoreSubmissionDeadline
                    || activePlayers == 0
            ) {
                return;
            }

            // Get participants
            address[] memory participants;
            try tournamentManager.getTournamentParticipants(tournamentId) returns (address[] memory p) {
                participants = p;
            } catch {
                return;
            }

            if (participants.length == 0) return;

            // Create random scores for all participants
            address[] memory playerAddresses = new address[](participants.length);
            uint256[] memory scores = new uint256[](participants.length);

            for (uint256 i = 0; i < participants.length; i++) {
                playerAddresses[i] = participants[i];
                scores[i] = uint256(keccak256(abi.encodePacked(block.timestamp, participants[i], i))) % 1000;
            }

            // Submit scores in batch
            try tournamentManager.submitScoresBatch(tournamentId, playerAddresses, scores) {
                // Success
            } catch {
                // Try individual score submissions if batch fails
                for (uint256 i = 0; i < participants.length; i++) {
                    try tournamentManager.submitScore(tournamentId, participants[i], scores[i]) {
                        // Success
                    } catch {
                        // Ignore failures
                    }
                }
            }
        } catch {
            // Ignore failures
        }

        submitScoreCalls++;
    }

    // End a tournament
    function endTournament(uint256 tournamentIndex) public {
        if (tournamentIds.length == 0) return;

        tournamentIndex = bound(tournamentIndex, 0, tournamentIds.length - 1);
        uint256 tournamentId = tournamentIds[tournamentIndex];

        // Check if tournament can be ended
        try tournamentManager.getTournamentDetails(tournamentId) returns (
            string memory name,
            uint256 entryFee,
            address tokenAddress,
            uint256 activePlayers,
            uint256 maxPlayers,
            uint256 startTime,
            uint256 endTime,
            uint256 joinDeadline,
            uint256 scoreSubmissionDeadline,
            uint256 amountInTournament,
            TournamentManager.TournamentStatus status,
            bool prizesDistributed
        ) {
            // Only end if tournament is in progress and end time has passed
            if (status != TournamentManager.TournamentStatus.InProgress || block.timestamp < endTime) {
                return;
            }

            // Try to end tournament
            try tournamentManager.endTournament(tournamentId) {
                tournamentEnded[tournamentId] = true;
            } catch {
                // Ignore failures
            }
        } catch {
            // Ignore failures
        }

        endTournamentCalls++;
    }

    // Distribute prizes for a tournament
    function distributePrizes(uint256 tournamentIndex) public {
        if (tournamentIds.length == 0) return;

        tournamentIndex = bound(tournamentIndex, 0, tournamentIds.length - 1);
        uint256 tournamentId = tournamentIds[tournamentIndex];

        // Check if prizes can be distributed
        try tournamentManager.getTournamentDetails(tournamentId) returns (
            string memory name,
            uint256 entryFee,
            address tokenAddress,
            uint256 activePlayers,
            uint256 maxPlayers,
            uint256 startTime,
            uint256 endTime,
            uint256 joinDeadline,
            uint256 scoreSubmissionDeadline,
            uint256 amountInTournament,
            TournamentManager.TournamentStatus status,
            bool prizesDistributed
        ) {
            // Only distribute if tournament is completed and prizes not distributed
            if (status != TournamentManager.TournamentStatus.Completed || prizesDistributed) {
                return;
            }

            // Get winners and their balances before distribution
            address[] memory winners;
            uint256[] memory balancesBefore = new uint256[](0);

            try tournamentManager.getTournamentWinners(tournamentId) returns (address[] memory w) {
                winners = w;
                balancesBefore = new uint256[](winners.length);

                for (uint256 i = 0; i < winners.length; i++) {
                    if (tokenAddress == address(0)) {
                        balancesBefore[i] = winners[i].balance;
                    } else {
                        balancesBefore[i] = IERC20(tokenAddress).balanceOf(winners[i]);
                    }
                }
            } catch {
                return;
            }

            // Try to distribute prizes
            try tournamentManager.distributePrizes(tournamentId) {
                // Calculate and store prize amounts
                for (uint256 i = 0; i < winners.length; i++) {
                    uint256 balanceAfter;
                    if (tokenAddress == address(0)) {
                        balanceAfter = winners[i].balance;
                        uint256 prize = balanceAfter - balancesBefore[i];
                        winnerPrizes[tournamentId][i] = prize;
                        totalETHWithdrawn += prize;
                    } else {
                        balanceAfter = IERC20(tokenAddress).balanceOf(winners[i]);
                        uint256 prize = balanceAfter - balancesBefore[i];
                        winnerPrizes[tournamentId][i] = prize;
                        totalTokensWithdrawn += prize;
                    }
                }
            } catch {
                // Ignore failures
            }
        } catch {
            // Ignore failures
        }

        distributePrizesCalls++;
    }

    // Cancel a tournament
    function cancelTournament(uint256 tournamentIndex, string memory reason) public {
        if (tournamentIds.length == 0) return;

        tournamentIndex = bound(tournamentIndex, 0, tournamentIds.length - 1);
        uint256 tournamentId = tournamentIds[tournamentIndex];

        // Check if tournament can be cancelled
        try tournamentManager.getTournamentDetails(tournamentId) returns (
            string memory name,
            uint256 entryFee,
            address tokenAddress,
            uint256 activePlayers,
            uint256 maxPlayers,
            uint256 startTime,
            uint256 endTime,
            uint256 joinDeadline,
            uint256 scoreSubmissionDeadline,
            uint256 amountInTournament,
            TournamentManager.TournamentStatus status,
            bool prizesDistributed
        ) {
            // Only cancel if tournament is open or in progress and prizes not distributed
            if (
                (
                    status != TournamentManager.TournamentStatus.Open
                        && status != TournamentManager.TournamentStatus.InProgress
                ) || prizesDistributed
            ) {
                return;
            }

            // Get participants and their balances before cancellation
            address[] memory participants;
            uint256[] memory balancesBefore = new uint256[](0);

            try tournamentManager.getTournamentParticipants(tournamentId) returns (address[] memory p) {
                participants = p;
                balancesBefore = new uint256[](participants.length);

                for (uint256 i = 0; i < participants.length; i++) {
                    if (tokenAddress == address(0)) {
                        balancesBefore[i] = participants[i].balance;
                    } else {
                        balancesBefore[i] = IERC20(tokenAddress).balanceOf(participants[i]);
                    }
                }
            } catch {
                return;
            }

            // Try to cancel tournament
            try tournamentManager.cancelTournament(tournamentId, reason) {
                // Calculate total refunds
                for (uint256 i = 0; i < participants.length; i++) {
                    uint256 balanceAfter;
                    if (tokenAddress == address(0)) {
                        balanceAfter = participants[i].balance;
                        totalETHWithdrawn += (balanceAfter - balancesBefore[i]);
                    } else {
                        balanceAfter = IERC20(tokenAddress).balanceOf(participants[i]);
                        totalTokensWithdrawn += (balanceAfter - balancesBefore[i]);
                    }
                }
            } catch {
                // Ignore failures
            }
        } catch {
            // Ignore failures
        }

        cancelTournamentCalls++;
    }

    // For targeted fuzz testing
    function registerAndJoin(uint256 userIndex, uint256 tournamentIndex) public {
        // Bound the user index explicitly
        userIndex = bound(userIndex, 0, users.length - 1);
        console.log("Bound result", userIndex);

        // First register player
        registerPlayer(userIndex);

        // Make sure we have at least one tournament to join
        if (tournamentIds.length == 0) {
            createTournament("Test Tournament", 0.1 ether, false, 2, block.timestamp + 1 hours, 2 hours);
        }

        // Now bound the tournament index
        tournamentIndex = bound(tournamentIndex, 0, tournamentIds.length - 1);

        // Then join tournament
        joinTournament(userIndex, tournamentIndex);
    }

    function completeLifecycle(uint256 tournamentIndex) public {
        submitScores(tournamentIndex);
        endTournament(tournamentIndex);
        distributePrizes(tournamentIndex);
    }

    function complexScenario(uint256 userIndex1, uint256 userIndex2, uint256 tournamentIndex, bool shouldCancel)
        public
    {
        // Register two users
        registerPlayer(userIndex1);
        registerPlayer(userIndex2);

        // Create tournament if necessary
        if (tournamentIds.length == 0) {
            createTournament("Test", 0.1 ether, false, 2, block.timestamp + 1 hours, 2 hours);
        }

        // Join tournament
        joinTournament(userIndex1, tournamentIndex);
        joinTournament(userIndex2, tournamentIndex);

        // Either complete tournament or cancel it
        if (shouldCancel) {
            cancelTournament(tournamentIndex, "Testing cancellation");
        } else {
            // Fast forward to submission time
            try tournamentManager.getTournamentDetails(tournamentIds[tournamentIndex]) returns (
                string memory name,
                uint256 entryFee,
                address tokenAddress,
                uint256 activePlayers,
                uint256 maxPlayers,
                uint256 startTime,
                uint256 endTime,
                uint256 joinDeadline,
                uint256 scoreSubmissionDeadline,
                uint256 amountInTournament,
                TournamentManager.TournamentStatus status,
                bool prizesDistributed
            ) {
                // Move time forward if tournament has a future start time
                if (startTime > block.timestamp) {
                    vm.warp(startTime + 1);
                }
            } catch {
                // Ignore if tournament doesn't exist
            }

            submitScores(tournamentIndex);

            // Fast forward to end time
            try tournamentManager.getTournamentDetails(tournamentIds[tournamentIndex]) returns (
                string memory name,
                uint256 entryFee,
                address tokenAddress,
                uint256 activePlayers,
                uint256 maxPlayers,
                uint256 startTime,
                uint256 endTime,
                uint256 joinDeadline,
                uint256 scoreSubmissionDeadline,
                uint256 amountInTournament,
                TournamentManager.TournamentStatus status,
                bool prizesDistributed
            ) {
                // Move time forward if tournament has a future end time
                if (endTime > block.timestamp) {
                    vm.warp(endTime + 1);
                }
            } catch {
                // Ignore if tournament doesn't exist
            }

            endTournament(tournamentIndex);
            distributePrizes(tournamentIndex);
        }
    }

    // Function to handle calls from invariant_callSummary
    function callSummary() external view {
        console.log("---Call Summary---");
        console.log("Register Player:", registerPlayerCalls);
        console.log("Create Tournament:", createTournamentCalls);
        console.log("Join Tournament:", joinTournamentCalls);
        console.log("Submit Scores:", submitScoreCalls);
        console.log("End Tournament:", endTournamentCalls);
        console.log("Distribute Prizes:", distributePrizesCalls);
        console.log("Cancel Tournament:", cancelTournamentCalls);
        console.log("------------------");
        console.log("Total ETH Deposited:", totalETHDeposited);
        console.log("Total ETH Withdrawn:", totalETHWithdrawn);
        console.log("Total Tokens Deposited:", totalTokensDeposited);
        console.log("Total Tokens Withdrawn:", totalTokensWithdrawn);
    }

    // Allow receiving ETH
    receive() external payable {}
}
