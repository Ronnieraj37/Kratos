import { Abi } from "viem";

export const TournamentManagerABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_playerBadgeAddress", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "receive", stateMutability: "payable" },
  {
    type: "function",
    name: "FIRST_PLACE_PERCENTAGE",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "LOBBY_TIMEOUT",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "SCORE_SUBMISSION_BUFFER",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "SECOND_PLACE_PERCENTAGE",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "THIRD_PLACE_PERCENTAGE",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "TOURNAMENT_DURATION",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "cancelTournament",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
      { name: "reason", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "checkAndCancelIncompleteTournaments",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createTournament",
    inputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "entryFee", type: "uint256", internalType: "uint256" },
      { name: "tokenAddress", type: "address", internalType: "address" },
      { name: "maxPlayers", type: "uint256", internalType: "uint256" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
      { name: "duration", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "distributePrizes",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "emergencyWithdraw",
    inputs: [
      { name: "tokenAddress", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "endTournament",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCompletedTournaments",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDiscountedEntryFee",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
      { name: "playerAddress", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getExtendedTournamentDetails",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "entryFee", type: "uint256", internalType: "uint256" },
      { name: "tokenAddress", type: "address", internalType: "address" },
      { name: "activePlayers", type: "uint256", internalType: "uint256" },
      { name: "maxPlayers", type: "uint256", internalType: "uint256" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
      { name: "endTime", type: "uint256", internalType: "uint256" },
      { name: "amountInTournament", type: "uint256", internalType: "uint256" },
      {
        name: "status",
        type: "uint8",
        internalType: "enum TournamentManager.TournamentStatus",
      },
      { name: "prizesDistributed", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInProgressTournaments",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOpenTournaments",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPlayerDetails",
    inputs: [
      { name: "playerAddress", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "playerId", type: "uint256", internalType: "uint256" },
      { name: "totalWinnings", type: "uint256", internalType: "uint256" },
      { name: "tournamentCount", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPlayerScore",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
      { name: "playerAddress", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPlayerTournaments",
    inputs: [
      { name: "playerAddress", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTournamentCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTournamentDetails",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "entryFee", type: "uint256", internalType: "uint256" },
      { name: "tokenAddress", type: "address", internalType: "address" },
      { name: "activePlayers", type: "uint256", internalType: "uint256" },
      { name: "maxPlayers", type: "uint256", internalType: "uint256" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
      { name: "endTime", type: "uint256", internalType: "uint256" },
      { name: "joinDeadline", type: "uint256", internalType: "uint256" },
      {
        name: "scoreSubmissionDeadline",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "amountInTournament", type: "uint256", internalType: "uint256" },
      {
        name: "status",
        type: "uint8",
        internalType: "enum TournamentManager.TournamentStatus",
      },
      { name: "prizesDistributed", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTournamentParticipants",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTournamentWinners",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasPlayerJoined",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
      { name: "playerAddress", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isPlayerRegistered",
    inputs: [
      { name: "playerAddress", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "joinTournament",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "playerBadgeContract",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract PlayerBadge" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "playerIdToAddress",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "players",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [
      { name: "playerId", type: "uint256", internalType: "uint256" },
      { name: "playerAddress", type: "address", internalType: "address" },
      { name: "totalWinnings", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerPlayer",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setPlayerBadgeContract",
    inputs: [
      { name: "_playerBadgeAddress", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitScore",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
      { name: "playerAddress", type: "address", internalType: "address" },
      { name: "score", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitScoresBatch",
    inputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
      { name: "playerAddresses", type: "address[]", internalType: "address[]" },
      { name: "scores", type: "uint256[]", internalType: "uint256[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "tournaments",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "tournamentId", type: "uint256", internalType: "uint256" },
      { name: "name", type: "string", internalType: "string" },
      { name: "entryFee", type: "uint256", internalType: "uint256" },
      { name: "tokenAddress", type: "address", internalType: "address" },
      { name: "activePlayers", type: "uint256", internalType: "uint256" },
      { name: "maxPlayers", type: "uint256", internalType: "uint256" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
      { name: "endTime", type: "uint256", internalType: "uint256" },
      { name: "joinDeadline", type: "uint256", internalType: "uint256" },
      {
        name: "scoreSubmissionDeadline",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "amountInTournament", type: "uint256", internalType: "uint256" },
      {
        name: "status",
        type: "uint8",
        internalType: "enum TournamentManager.TournamentStatus",
      },
      { name: "prizesDistributed", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "BatchScoresSubmitted",
    inputs: [
      {
        name: "tournamentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "playerAddresses",
        type: "address[]",
        indexed: false,
        internalType: "address[]",
      },
      {
        name: "scores",
        type: "uint256[]",
        indexed: false,
        internalType: "uint256[]",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlayerJoinedTournament",
    inputs: [
      {
        name: "tournamentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "playerAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "entryFee",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlayerRegistered",
    inputs: [
      {
        name: "playerId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "playerAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PrizesDistributed",
    inputs: [
      {
        name: "tournamentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "winners",
        type: "address[]",
        indexed: false,
        internalType: "address[]",
      },
      {
        name: "amounts",
        type: "uint256[]",
        indexed: false,
        internalType: "uint256[]",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RefundsProcessed",
    inputs: [
      {
        name: "tournamentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ScoreSubmitted",
    inputs: [
      {
        name: "tournamentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "playerAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "score",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TournamentCancelled",
    inputs: [
      {
        name: "tournamentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "reason",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TournamentCompleted",
    inputs: [
      {
        name: "tournamentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "winners",
        type: "address[]",
        indexed: false,
        internalType: "address[]",
      },
      {
        name: "prizes",
        type: "uint256[]",
        indexed: false,
        internalType: "uint256[]",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TournamentCreated",
    inputs: [
      {
        name: "tournamentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      { name: "name", type: "string", indexed: false, internalType: "string" },
      {
        name: "entryFee",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "maxPlayers",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "startTime",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TournamentStatusChanged",
    inputs: [
      {
        name: "tournamentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "status",
        type: "uint8",
        indexed: false,
        internalType: "enum TournamentManager.TournamentStatus",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
  },
] as Abi;
