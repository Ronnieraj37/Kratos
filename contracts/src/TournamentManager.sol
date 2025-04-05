// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./utils/ReentrancyGuardTransient.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PlayerBadge
 * @dev ERC721 token for player badges that provide tournament fee discounts
 */
contract PlayerBadge is ERC721Enumerable, Ownable {
    // Manual token ID tracker
    uint256 private _nextTokenId = 1;

    // Badge metadata URI
    string private _baseTokenURI;

    // Discount percentage for badge holders (e.g., 20 = 20% discount)
    uint8 public discountPercentage;

    constructor(string memory name, string memory symbol, string memory baseTokenURI, uint8 _discountPercentage)
        ERC721(name, symbol)
        Ownable(msg.sender)
    {
        _baseTokenURI = baseTokenURI;
        discountPercentage = _discountPercentage;
    }

    function mintBadge(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    //TODO: transfer this to facotry contract
    function setDiscountPercentage(uint8 _discountPercentage) external onlyOwner {
        require(_discountPercentage <= 100, "Discount percentage cannot exceed 100");
        discountPercentage = _discountPercentage;
    }
}

/**
 * @title TournamentManager
 * @dev Main contract for tournament management and gameplay
 */
contract TournamentManager is Ownable, ReentrancyGuardTransient {
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
        uint256 joinDeadline; // TODO: Remove this
        uint256 scoreSubmissionDeadline; // Time after which scores can't be submitted
        uint256 amountInTournament;
        TournamentStatus status;
        bool prizesDistributed; // TOOO: Remove this
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
        if (_playerBadgeAddress != address(0)) {
            playerBadgeContract = PlayerBadge(_playerBadgeAddress);
        }
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
        require(players[msg.sender].playerId != 0, "Player not registered");
        _;
    }

    modifier tournamentExists(uint256 tournamentId) {
        require(tournamentId < _nextTournamentId, "Tournament does not exist");
        _;
    }

    modifier tournamentOpen(uint256 tournamentId) {
        require(tournaments[tournamentId].status == TournamentStatus.Open, "Tournament is not open for joining");
        _;
    }

    modifier tournamentInProgress(uint256 tournamentId) {
        require(tournaments[tournamentId].status == TournamentStatus.InProgress, "Tournament is not in progress");
        _;
    }

    /**
     * @dev Set the player badge contract address
     * @param _playerBadgeAddress Address of the PlayerBadge contract
     */
    function setPlayerBadgeContract(address _playerBadgeAddress) external onlyOwner {
        require(_playerBadgeAddress != address(0), "Invalid address");
        playerBadgeContract = PlayerBadge(_playerBadgeAddress);
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
     * @dev Register a new player
     */
    function registerPlayer() external {
        require(players[msg.sender].playerId == 0, "Player already registered");

        uint256 playerId = _nextPlayerId;
        _nextPlayerId++;

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
        require(maxPlayers > 1, "Max players must be greater than 1");
        require(startTime > block.timestamp, "Start time must be in the future");

        uint256 tournamentId = _nextTournamentId;
        _nextTournamentId++;

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
    {
        Tournament storage tournament = tournaments[tournamentId];

        require(!tournament.hasJoined[msg.sender], "Already joined this tournament");
        require(tournament.activePlayers < tournament.maxPlayers, "Tournament is full");
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
            require(token.transferFrom(msg.sender, address(this), feeToPayPlayer), "Token transfer failed");
            //  TODO: multiple tokens might not reuturn true here so use safeTransfer
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
    {
        Tournament storage tournament = tournaments[tournamentId];
        require(block.timestamp <= tournament.scoreSubmissionDeadline, "Score submission deadline passed");
        require(tournament.hasJoined[playerAddress], "Player not in this tournament");

        tournament.playerScores[playerAddress] = score;

        emit ScoreSubmitted(tournamentId, playerAddress, score);
    }

    /**
     * @dev Submit scores in batch (admin only)
     */
    function submitScoresBatch(uint256 tournamentId, address[] calldata playerAddresses, uint256[] calldata scores)
        external
        onlyOwner
        tournamentExists(tournamentId)
        tournamentInProgress(tournamentId)
    {
        require(playerAddresses.length == scores.length, "Arrays length mismatch");
        require(playerAddresses.length > 0, "Empty arrays");

        Tournament storage tournament = tournaments[tournamentId];
        require(block.timestamp <= tournament.scoreSubmissionDeadline, "Score submission deadline passed");

        for (uint256 i = 0; i < playerAddresses.length;) {
            require(tournament.hasJoined[playerAddresses[i]], "Player not in this tournament");
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
    function endTournament(uint256 tournamentId) external onlyOwner tournamentExists(tournamentId) {
        Tournament storage tournament = tournaments[tournamentId];

        require(tournament.status == TournamentStatus.InProgress, "Tournament not in progress");
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
        for (uint256 i = 0; i < playerlength; i++) {
            for (uint256 j = i + 1; j < playerlength; j++) {
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
            prizeAmounts[0] = totalPrizePool * FIRST_PLACE_PERCENTAGE / 100;
            prizeAmounts[1] = totalPrizePool * SECOND_PLACE_PERCENTAGE / 100;
        } else if (winners.length >= 3) {
            prizeAmounts[0] = totalPrizePool * FIRST_PLACE_PERCENTAGE / 100;
            prizeAmounts[1] = totalPrizePool * SECOND_PLACE_PERCENTAGE / 100;
            prizeAmounts[2] = totalPrizePool * THIRD_PLACE_PERCENTAGE / 100;
        }

        // Send prizes
        for (uint256 i = 0; i < winners.length; i++) {
            if (prizeAmounts[i] > 0) {
                if (tournament.tokenAddress == address(0)) {
                    // Send ETH
                    (bool success,) = payable(winners[i]).call{value: prizeAmounts[i]}("");
                    require(success, "ETH transfer failed");
                } else {
                    // Send ERC20 tokens
                    IERC20 token = IERC20(tournament.tokenAddress);
                    // require(token.transfer(winners[i], prizeAmounts[i]), "Token transfer failed");
                    token.safeTransfer(winners[i], prizeAmounts[i]);
                }

                // Update player's total winnings
                players[winners[i]].totalWinnings += prizeAmounts[i];
            }
        }

        tournament.prizesDistributed = true;

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
        //TODO: Check require statements for refunding eth and token
        require(!tournament.prizesDistributed, "Cannot cancel after prizes distributed");

        // Update status before processing refunds to prevent reentrancy
        tournament.status = TournamentStatus.Cancelled;

        // Process refunds
        uint256 activePlayers = tournament.activePlayers;
        uint256[] memory refundAmounts = new uint256[](activePlayers);

        // Calculate refund amounts first
        for (uint256 i = 0; i < activePlayers; i++) {
            address participant = tournament.participants[i];
            uint256 refundAmount = tournament.entryFee;
            if (address(playerBadgeContract) != address(0) && playerBadgeContract.balanceOf(participant) > 0) {
                uint8 discount = playerBadgeContract.discountPercentage();

                refundAmount = tournament.entryFee * (100 - discount) / 100;
            }
            refundAmounts[i] = refundAmount;
        }

        // Process refunds after all calculations
        for (uint256 i = 0; i < activePlayers; i++) {
            if (tournament.tokenAddress == address(0)) {
                //TODO: Useless if check evry time keep above the loop
                // Refund ETH
                (bool success,) = payable(tournament.participants[i]).call{value: refundAmounts[i]}("");
                require(success, "ETH refund failed");
            } else {
                // Refund ERC20 tokens
                IERC20 token = IERC20(tournament.tokenAddress);
                require(token.transfer(tournament.participants[i], refundAmounts[i]), "Token refund failed");
            }
        }
        // dont call tournament.participants twice caches it instead

        emit TournamentCancelled(tournamentId, reason);
        emit RefundsProcessed(tournamentId);
    }

    /**
     * @dev Auto-cancel tournaments with insufficient players
     */
    function checkAndCancelIncompleteTournaments(uint256 tournamentId)
        external
        onlyOwner
        tournamentExists(tournamentId)
    {
        Tournament storage tournament = tournaments[tournamentId];

        require(tournament.status == TournamentStatus.Open, "Tournament not open");
        require(block.timestamp >= tournament.startTime, "Tournament has not reached start time");
        require(tournament.activePlayers < tournament.maxPlayers, "Tournament is full");

        // If current time exceeds start time + lobby timeout and lobby not filled, cancel
        if (block.timestamp >= tournament.startTime + LOBBY_TIMEOUT) {
            this.cancelTournament(tournamentId, "Insufficient players in lobby");
        }
    }

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
        address[] memory participants = new address[](tournament.activePlayers);

        for (uint256 i = 0; i < tournament.activePlayers;) {
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
        returns (uint256)
    {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.hasJoined[playerAddress], "Player not in this tournament");
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
     * @dev Emergency withdrawal function for contract owner
     */
    function emergencyWithdraw(address tokenAddress) external onlyOwner {
        if (tokenAddress == address(0)) {
            uint256 balance = address(this).balance;
            require(balance > 0, "No ETH to withdraw");
            (bool success,) = payable(owner()).call{value: balance}("");
            require(success, "ETH withdrawal failed");
        } else {
            IERC20 token = IERC20(tokenAddress);
            uint256 balance = token.balanceOf(address(this));
            require(balance > 0, "No tokens to withdraw");
            require(token.transfer(owner(), balance), "Token withdrawal failed");
        }
    }

    /**
     * @dev Function to receive ETH
     */
    receive() external payable {}
}
