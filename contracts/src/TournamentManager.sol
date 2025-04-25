// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./utils/ReentrancyGuardTransient.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./PlayerBadge.sol";

/**
 * @title TournamentManager
 * @dev Main contract for tournament management and gameplay
 */
contract TournamentManager is Ownable, ReentrancyGuardTransient {
    error ZeroAddress();
    error InvalidMaxPlayers();
    error PlayerAlreadyRegistered();
    error PlayerNotRegistered();
    error InvalidStartTime();
    error TournamentDoesNotExist();
    error TournamentNotOpen();
    error TournamentNotInProgress();
    error TournamentFull();
    error PlayerNotInTournament();  

    using SafeERC20 for IERC20;
    // Manual ID trackers

    uint256 private _nextPlayerId = 1;
    uint256 private _nextTournamentId = 1;

    // Player badge contract
    PlayerBadge public playerBadgeContract;

    // Enums
    enum TournamentStatus {
        Open,
        InProgress,
        Completed,
        Cancelled
    }

    // Structs
    struct Player {
        uint256 playerId;
        address playerAddress;
        uint256 totalWinnings;
        uint256[] tournamentIds;
    }

    struct Tournament {
        uint256 tournamentId;
        string name;
        uint256 entryFee;
        address tokenAddress; // address(0) means ETH, otherwise ERC20 token
        uint256 activePlayers; //players joined
        uint256 maxPlayers;
        uint256 startTime;
        uint256 endTime;
        uint256 joinDeadline;
        uint256 scoreSubmissionDeadline; // Time after which scores can't be submitted
        uint256 amountInTournament;
        TournamentStatus status;
        bool prizesDistributed;
        mapping(uint256 id => address playerAddress) participants;
        mapping(address => bool) hasJoined;
        mapping(address => uint256) playerScores;
        address[] winners;
    }

    // Mappings
    mapping(address => Player) public players;
    mapping(uint256 => address) public playerIdToAddress;
    mapping(uint256 => Tournament) public tournaments;

    // Constructor
    constructor(address _playerBadgeAddress) Ownable(msg.sender) {
        if (_playerBadgeAddress == address(0)) revert ZeroAddress();
        playerBadgeContract = PlayerBadge(_playerBadgeAddress);
    }

    // Events
    event PlayerRegistered(uint256 playerId, address playerAddress);
    event TournamentCreated(uint256 tournamentId, string name, uint256 entryFee, uint256 maxPlayers, uint256 startTime);
    event PlayerJoinedTournament(uint256 tournamentId, address playerAddress, uint256 entryFee);
    event TournamentStatusChanged(uint256 tournamentId, TournamentStatus status);
    event ScoreSubmitted(uint256 tournamentId, address playerAddress, uint256 score);
    event BatchScoresSubmitted(uint256 tournamentId, address[] playerAddresses, uint256[] scores);
    event TournamentCompleted(uint256 tournamentId, address[] winners, uint256[] prizes);
    event TournamentCancelled(uint256 tournamentId, string reason);
    event PrizesDistributed(uint256 tournamentId, address[] winners, uint256[] amounts);
    event RefundsProcessed(uint256 tournamentId);

    // Constants
    uint256 public constant LOBBY_TIMEOUT = 1 hours; // Time to fill the lobby before auto-cancel
    uint256 public constant TOURNAMENT_DURATION = 2 hours; // Default tournament duration
    uint256 public constant SCORE_SUBMISSION_BUFFER = 30 minutes; // Buffer time after tournament end for score submission
    uint8 public constant FIRST_PLACE_PERCENTAGE = 50;
    uint8 public constant SECOND_PLACE_PERCENTAGE = 30;
    uint8 public constant THIRD_PLACE_PERCENTAGE = 20;

    // Modifiers
    modifier onlyRegisteredPlayer() {
        if (players[msg.sender].playerId == 0) revert PlayerNotRegistered();
        _;
    }

    modifier tournamentExists(uint256 tournamentId) {
        if (tournamentId >= _nextTournamentId) revert TournamentDoesNotExist();
        _;
    }

    modifier tournamentOpen(uint256 tournamentId) {
        if (tournaments[tournamentId].status != TournamentStatus.Open) revert TournamentNotOpen();
        _;
    }

    modifier tournamentInProgress(uint256 tournamentId) {
        if (tournaments[tournamentId].status != TournamentStatus.InProgress) revert TournamentNotInProgress();
        _;
    }

    modifier tournamentNotFull(uint256 tournamentId) {
        if (tournaments[tournamentId].activePlayers == tournaments[tournamentId].maxPlayers) revert TournamentFull();
        _;
    }

    modifier playerInTournament(uint256 tournamentId , address playerAddress) {
        if (!tournaments[tournamentId].hasJoined[playerAddress]) revert PlayerNotInTournament();
        _;
    }

    /**
     * @dev Set the player badge contract address
     * @param _playerBadgeAddress Address of the PlayerBadge contract
     */
    function setPlayerBadgeContract(address _playerBadgeAddress) external onlyOwner {
        if (_playerBadgeAddress == address(0)) revert ZeroAddress();
        playerBadgeContract = PlayerBadge(_playerBadgeAddress);
    }

    /**
     * @dev Register a new player
     */
    function registerPlayer() external {
        if (players[msg.sender].playerId != 0) revert PlayerAlreadyRegistered();

        uint256 playerId = _nextPlayerId;
        ++_nextPlayerId;

        players[msg.sender] =
            Player({playerId: playerId, playerAddress: msg.sender, totalWinnings: 0, tournamentIds: new uint256[](0)});

        playerIdToAddress[playerId] = msg.sender;

        emit PlayerRegistered(playerId, msg.sender);
    }

    /**
     * @dev Create a new tournament (admin only)
     */
    function createTournament(
        string memory name,
        uint256 entryFee,
        address tokenAddress,
        uint256 maxPlayers,
        uint256 startTime,
        uint256 duration
    ) external onlyOwner {
        if (maxPlayers < 2) revert InvalidMaxPlayers();
        if (startTime <= block.timestamp) revert InvalidStartTime();
        // Validate the token address if it's not ETH (address(0))
        uint256 tournamentId = _nextTournamentId;
        ++_nextTournamentId;

        Tournament storage newTournament = tournaments[tournamentId];
        newTournament.tournamentId = tournamentId;
        newTournament.name = name;
        newTournament.entryFee = entryFee;
        newTournament.tokenAddress = tokenAddress;
        newTournament.maxPlayers = maxPlayers;
        newTournament.startTime = startTime;
        newTournament.endTime = startTime + (duration > 0 ? duration : TOURNAMENT_DURATION);
        newTournament.scoreSubmissionDeadline = newTournament.endTime + SCORE_SUBMISSION_BUFFER;
        newTournament.status = TournamentStatus.Open;
        newTournament.prizesDistributed = false;

        emit TournamentCreated(tournamentId, name, entryFee, maxPlayers, startTime);
    }

    /**
     * @dev Join a tournament
     */
    function joinTournament(uint256 tournamentId)
        external
        payable
        nonReentrant
        onlyRegisteredPlayer
        tournamentExists(tournamentId)
        tournamentOpen(tournamentId)
        tournamentNotFull(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];

        require(!tournament.hasJoined[msg.sender], "Already joined this tournament");
        require(block.timestamp < tournament.startTime, "Join deadline has passed");

        uint256 feeToPayPlayer = tournament.entryFee;

        // Check if player has a badge for discount
        if (address(playerBadgeContract) != address(0) && playerBadgeContract.balanceOf(msg.sender) > 0) {
            uint8 discount = playerBadgeContract.discountPercentage();

            feeToPayPlayer = tournament.entryFee * (100 - discount);
            feeToPayPlayer = feeToPayPlayer / 100;
        }

        // Update state before external interactions
        tournament.hasJoined[msg.sender] = true;
        tournament.participants[tournament.activePlayers++] = msg.sender;
        tournament.amountInTournament += feeToPayPlayer;
        players[msg.sender].tournamentIds.push(tournamentId);

        // Check if tournament should start
        if (tournament.activePlayers == tournament.maxPlayers) {
            tournament.status = TournamentStatus.InProgress;
            emit TournamentStatusChanged(tournamentId, TournamentStatus.InProgress);
        }

        // Handle payment
        if (tournament.tokenAddress == address(0)) {
            // ETH payment
            require(msg.value == feeToPayPlayer, "Incorrect ETH amount sent");
        } else {
            // ERC20 token payment
            require(msg.value == 0, "ETH not accepted for this tournament");
            IERC20 token = IERC20(tournament.tokenAddress);
            // add a check to see if a token exists at this point.
            require(token.allowance(msg.sender, address(this)) >= feeToPayPlayer, "Token allowance too low");
            token.safeTransferFrom(msg.sender, address(this), feeToPayPlayer);
        }

        emit PlayerJoinedTournament(tournamentId, msg.sender, feeToPayPlayer);
    }

    /**
     * @dev Submit score for a player (admin only)
     */
    function submitScore(uint256 tournamentId, address playerAddress, uint256 score)
        external
        onlyOwner
        tournamentExists(tournamentId)
        tournamentInProgress(tournamentId)
        playerInTournament(tournamentId, playerAddress)
    {
        Tournament storage tournament = tournaments[tournamentId];
        require(block.timestamp <= tournament.scoreSubmissionDeadline, "Score submission deadline passed");

        tournament.playerScores[playerAddress] = score;

        emit ScoreSubmitted(tournamentId, playerAddress, score);
    }

    /**
     * @dev Submit scores in batch (admin only)
     */
    function submitScoresBatch(
        uint256 tournamentId,
        address[] calldata playerAddresses,
        uint256[] calldata scores
    )
        external
        onlyOwner
        tournamentExists(tournamentId)
        tournamentInProgress(tournamentId)
    {
        require(
            playerAddresses.length == scores.length,
            "Arrays length mismatch"
        );
        require(playerAddresses.length > 0, "Empty arrays");

        Tournament storage tournament = tournaments[tournamentId];
        require(
            block.timestamp <= tournament.scoreSubmissionDeadline,
            "Score submission deadline passed"
        );

        for (uint256 i = 0; i < playerAddresses.length; ) {
            require(
                tournament.hasJoined[playerAddresses[i]],
                "Player not in this tournament"
            );
            tournament.playerScores[playerAddresses[i]] = scores[i];
            unchecked {
                i++;
            }
        }

        emit BatchScoresSubmitted(tournamentId, playerAddresses, scores);
    }


    /**
     * @dev End tournament and calculate winners (admin only)
     */
    function endTournament(uint256 tournamentId)
        external
        onlyOwner
        tournamentExists(tournamentId)
        tournamentInProgress(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];

        require(block.timestamp >= tournament.endTime, "Tournament not yet ended");

        // Get participants and their scores
        // address[] memory participantAddresses = tournament.participants;
        uint256 playerlength = tournament.activePlayers;
        uint256[] memory participantScores = new uint256[](playerlength);

        for (uint256 i = 0; i < playerlength;) {
            participantScores[i] = tournament.playerScores[tournament.participants[i]];
            unchecked {
                i++;
            }
        }

        //TODO: Use better sorting techinque or not as there will be only 3 winners, also what if 2 people have same position
        // Sort participants by score (descending)
        for (uint256 i = 0; i < playerlength;) {
            for (uint256 j = i + 1; j < playerlength;) {
                if (participantScores[i] < participantScores[j]) {
                    // Swap scores
                    uint256 tempScore = participantScores[i];
                    participantScores[i] = participantScores[j];
                    participantScores[j] = tempScore;

                    // Swap addresses
                    address tempAddr = tournament.participants[i];
                    tournament.participants[i] = tournament.participants[j];
                    tournament.participants[j] = tempAddr;
                }
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }

        // Calculate winners (up to top 3, but may be fewer if not enough participants)
        uint256 winnerCount = playerlength >= 3 ? 3 : playerlength;

        address[] memory winners = new address[](winnerCount);
        for (uint256 i = 0; i < winnerCount;) {
            winners[i] = tournament.participants[i];
            unchecked {
                i++;
            }
        }

        tournament.winners = winners;
        tournament.status = TournamentStatus.Completed;

        emit TournamentStatusChanged(tournamentId, TournamentStatus.Completed);
        emit TournamentCompleted(tournamentId, winners, participantScores);
    }

    /**
     * @dev Distribute prizes to winners
     */
    function distributePrizes(uint256 tournamentId) external onlyOwner nonReentrant tournamentExists(tournamentId) {
        Tournament storage tournament = tournaments[tournamentId];

        require(tournament.status == TournamentStatus.Completed, "Tournament not completed");
        require(!tournament.prizesDistributed, "Prizes already distributed");

        uint256 totalPrizePool = tournament.amountInTournament;

        address[] memory winners = tournament.winners;
        uint256[] memory prizeAmounts = new uint256[](winners.length);

        if (winners.length == 2) {
            prizeAmounts[0] = (totalPrizePool * FIRST_PLACE_PERCENTAGE) / 100;
            prizeAmounts[1] = (totalPrizePool * SECOND_PLACE_PERCENTAGE) / 100;
        } else if (winners.length >= 3) {
            prizeAmounts[0] = (totalPrizePool * FIRST_PLACE_PERCENTAGE) / 100;
            prizeAmounts[1] = (totalPrizePool * SECOND_PLACE_PERCENTAGE) / 100;
            prizeAmounts[2] = (totalPrizePool * THIRD_PLACE_PERCENTAGE) / 100;
        }

        tournament.prizesDistributed = true;
        // Send prizes
        for (uint256 i = 0; i < winners.length;) {
            if (prizeAmounts[i] > 0) {
                if (tournament.tokenAddress == address(0)) {
                    // Send ETH
                    (bool success,) = payable(winners[i]).call{value: prizeAmounts[i]}("");
                    require(success, "ETH transfer failed");
                } else {
                    // Send ERC20 tokens
                    IERC20 token = IERC20(tournament.tokenAddress);
                    token.safeTransfer(winners[i], prizeAmounts[i]);
                }

                // Update player's total winnings
                players[winners[i]].totalWinnings += prizeAmounts[i];
            }
            unchecked {
                i++;
            }
        }

        emit PrizesDistributed(tournamentId, winners, prizeAmounts);
    }

    /**
     * @dev Cancel tournament and refund entry fees
     */
    function cancelTournament(uint256 tournamentId, string memory reason)
        external
        onlyOwner
        nonReentrant
        tournamentExists(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];

        require(
            tournament.status == TournamentStatus.Open || tournament.status == TournamentStatus.InProgress,
            "Tournament cannot be cancelled"
        );

        require(!tournament.prizesDistributed, "Cannot cancel after prizes distributed");

        // Update status before processing refunds to prevent reentrancy
        tournament.status = TournamentStatus.Cancelled;

        // Process refunds
        uint256 activePlayers = tournament.activePlayers;
        uint256 entryFees = tournament.entryFee;
        // Process refunds after all calculations
        if (tournament.tokenAddress == address(0)) {
            // Refund ETH
            for (uint256 i = 0; i < activePlayers;) {
                address participant = tournament.participants[i];
                uint256 refundAmount = getRefundAmountTournament(participant, entryFees);
                (bool success,) = payable(participant).call{value: refundAmount}("");
                require(success, "ETH refund failed");
                unchecked {
                    i++;
                }
            }
        } else {
            // Refund ERC20 tokens
            for (uint256 i = 0; i < activePlayers;) {
                address participant = tournament.participants[i];
                uint256 refundAmount = getRefundAmountTournament(participant, entryFees);
                IERC20 token = IERC20(tournament.tokenAddress);
                token.safeTransfer(participant, refundAmount);
                unchecked {
                    i++;
                }
            }
        }

        emit TournamentCancelled(tournamentId, reason);
        emit RefundsProcessed(tournamentId);
    }

    /**
     * @dev Auto-cancel tournaments with insufficient players
     */
    function checkAndCancelIncompleteTournaments(uint256 tournamentId)
        external
        onlyOwner
        tournamentOpen(tournamentId)
        tournamentExists(tournamentId)
        tournamentNotFull(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];

        require(block.timestamp >= tournament.startTime, "Tournament has not reached start time");

        // If current time exceeds start time + lobby timeout and lobby not filled, cancel
        if (block.timestamp >= tournament.startTime + LOBBY_TIMEOUT) {
            this.cancelTournament(tournamentId, "Insufficient players in lobby");
        }
    }

    function getRefundAmountTournament(address participant, uint256 entryFees)
        internal
        view
        returns (uint256 refundAmount)
    {
        if (address(playerBadgeContract) != address(0) && playerBadgeContract.balanceOf(participant) > 0) {
            uint8 discount = playerBadgeContract.discountPercentage();

            refundAmount = (entryFees * (100 - discount)) / 100;
        } else {
            refundAmount = entryFees;
        }
    }

    // View Functions

    /**
     * @dev Get tournament winners
     */
    function getTournamentWinners(uint256 tournamentId)
        external
        view
        tournamentExists(tournamentId)
        returns (address[] memory)
    {
        return tournaments[tournamentId].winners;
    }

    /**
     * @dev Get tournament participants
     */
    function getTournamentParticipants(uint256 tournamentId)
        external
        view
        tournamentExists(tournamentId)
        returns (address[] memory)
    {
        Tournament storage tournament = tournaments[tournamentId];
        uint256 activePlayers = tournament.activePlayers;
        address[] memory participants = new address[](activePlayers);

        for (uint256 i = 0; i < activePlayers;) {
            participants[i] = tournament.participants[i];
            unchecked {
                i++;
            }
        }

        return participants;
    }

    /**
     * @dev Get player score in tournament
     */
    function getPlayerScore(uint256 tournamentId, address playerAddress)
        external
        view
        tournamentExists(tournamentId)
        playerInTournament(tournamentId, playerAddress)
        returns (uint256)
    {
        Tournament storage tournament = tournaments[tournamentId];
        return tournament.playerScores[playerAddress];
    }

    /**
     * @dev Get player's tournament history
     */
    function getPlayerTournaments(address playerAddress)
        external
        view
        onlyRegisteredPlayer
        returns (uint256[] memory)
    {
        return players[playerAddress].tournamentIds;
    }

    /**
     * @dev Check if player has joined a tournament
     */
    function hasPlayerJoined(uint256 tournamentId, address playerAddress)
        external
        view
        tournamentExists(tournamentId)
        returns (bool)
    {
        return tournaments[tournamentId].hasJoined[playerAddress];
    }

    /**
     * @dev Get all open tournaments
     */
    function getOpenTournaments() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < _nextTournamentId; ) {
            if (tournaments[i].status == TournamentStatus.Open) {
                unchecked {
                    count++;
                    i++;
                }
            }
        }

        uint256[] memory openIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < _nextTournamentId; ) {
            if (tournaments[i].status == TournamentStatus.Open) {
                openIds[index] = i;
                unchecked {
                    index++;
                    i++;
                }
            }
        }

        return openIds;
    }

    /**
     * @dev Get all in-progress tournaments
     */
    function getInProgressTournaments() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < _nextTournamentId; ) {
            if (tournaments[i].status == TournamentStatus.InProgress) {
                unchecked {
                    count++;
                    i++;
                }
            }
        }

        uint256[] memory inProgressIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < _nextTournamentId; ) {
            if (tournaments[i].status == TournamentStatus.InProgress) {
                inProgressIds[index] = i;
                unchecked {
                    index++;
                    i++;
                }
            }
        }

        return inProgressIds;
    }

    /**
     * @dev Get all completed tournaments
     */
    function getCompletedTournaments() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < _nextTournamentId;) {
            if (tournaments[i].status == TournamentStatus.Completed) {
                unchecked {
                    count++;
                    i++;
                }
            }
        }

        uint256[] memory completedIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < _nextTournamentId;) {
            if (tournaments[i].status == TournamentStatus.Completed) {
                completedIds[index] = i;
                unchecked {
                    index++;
                    i++;
                }
            }
        }

        return completedIds;
    }

    /**
     * @dev Get extended tournament details including game type and image
     * This is a new getter that includes game type and image URI
     */
    function getExtendedTournamentDetails(uint256 tournamentId)
        external
        view
        tournamentExists(tournamentId)
        returns (
            string memory name,
            uint256 entryFee,
            address tokenAddress,
            uint256 activePlayers,
            uint256 maxPlayers,
            uint256 startTime,
            uint256 endTime,
            uint256 amountInTournament,
            TournamentStatus status,
            bool prizesDistributed
        )
    {
        Tournament storage tournament = tournaments[tournamentId];
        return (
            tournament.name,
            tournament.entryFee,
            tournament.tokenAddress,
            tournament.activePlayers,
            tournament.maxPlayers,
            tournament.startTime,
            tournament.endTime,
            tournament.amountInTournament,
            tournament.status,
            tournament.prizesDistributed
        );
    }

    /**
     * @dev Get player details
     */
    function getPlayerDetails(address playerAddress)
        external
        view
        returns (uint256 playerId, uint256 totalWinnings, uint256 tournamentCount)
    {
        Player storage player = players[playerAddress];
        require(player.playerId != 0, "Player not registered");

        return (player.playerId, player.totalWinnings, player.tournamentIds.length);
    }

    /**
     * @dev Get total number of tournaments
     */
    function getTournamentCount() external view returns (uint256) {
        return _nextTournamentId - 1;
    }

    /**
     * @dev Check if player is registered
     */
    function isPlayerRegistered(address playerAddress) external view returns (bool) {
        return players[playerAddress].playerId != 0;
    }

    /**
     * @dev Calculate discounted entry fee for a player
     */
    function getDiscountedEntryFee(uint256 tournamentId, address playerAddress)
        external
        view
        tournamentExists(tournamentId)
        returns (uint256)
    {
        Tournament storage tournament = tournaments[tournamentId];
        uint256 entryFee = tournament.entryFee;

        // Check if player has a badge for discount
        if (
            address(playerBadgeContract) != address(0) && playerAddress != address(0)
                && playerBadgeContract.balanceOf(playerAddress) > 0
        ) {
            uint8 discount = playerBadgeContract.discountPercentage();
            return (entryFee * (100 - discount)) / 100;
        }

        return entryFee;
    }

    // Getter function for tournament details to help with testing
    function getTournamentDetails(uint256 tournamentId)
        external
        view
        returns (
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
            TournamentStatus status,
            bool prizesDistributed
        )
    {
        Tournament storage tournament = tournaments[tournamentId];
        return (
            tournament.name,
            tournament.entryFee,
            tournament.tokenAddress,
            tournament.activePlayers,
            tournament.maxPlayers,
            tournament.startTime,
            tournament.endTime,
            tournament.joinDeadline,
            tournament.scoreSubmissionDeadline,
            tournament.amountInTournament,
            tournament.status,
            tournament.prizesDistributed
        );
    }

    /**
     * @dev Function to receive ETH
     */
    receive() external payable {}
}
