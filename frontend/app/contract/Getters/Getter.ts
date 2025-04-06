// hooks/useTournament.ts
import { useReadContract } from "wagmi";
import { baseSepolia } from "viem/chains";
import { Address, erc20Abi, formatEther } from "viem";

// Import ABIs - replace with your actual ABI imports
import { TournamentManagerABI } from "../abi/TournamentManager";
import { PlayerBadgeABI } from "../abi/PlayerBadge";

// Import constants - replace with your actual addresses
import {
  TOURNAMENT_MANAGER_ADDRESS,
  PLAYER_BADGE_ADDRESS,
} from "../../constants";

// Define types for tournament data
export interface TournamentData {
  id: string;
  name: string;
  entryFee: number;
  tokenAddress: Address;
  playerCount: number;
  maxPlayers: number;
  startTime: Date;
  endTime: Date;
  prizePool: number;
  status: "upcoming" | "ongoing" | "completed";
  gameType: string;
  image: string;
}

// Map contract status to UI status
function mapStatus(status: number): "upcoming" | "ongoing" | "completed" {
  switch (status) {
    case 0:
      return "upcoming"; // Open
    case 1:
      return "ongoing"; // InProgress
    case 2:
      return "completed"; // Completed
    default:
      return "upcoming";
  }
}

/**
 * Hook to get all open tournaments IDs
 */
export const useOpenTournamentIds = () => {
  const { data, isLoading, error, refetch } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "getOpenTournaments",
  });

  return {
    tournamentIds: data as readonly bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
};

export const useGetTokenSymbol = ({
  tokenAddress,
}: {
  tokenAddress: `0x{string}`;
}) => {
  const { data, isLoading, error } = useReadContract({
    chainId: baseSepolia.id,
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "symbol",
  });

  return {
    tokenSymbol: data as string,
    isLoading,
    error,
  };
};

/**
 * Hook to get all in-progress tournaments IDs
 */
export const useInProgressTournamentIds = () => {
  const { data, isLoading, error, refetch } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "getInProgressTournaments",
  });

  return {
    tournamentIds: data as readonly bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to get all completed tournaments IDs
 */
export const useCompletedTournamentIds = () => {
  const { data, isLoading, error, refetch } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "getCompletedTournaments",
  });

  return {
    tournamentIds: data as readonly bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to get owner
 */
export const useGetOwner = () => {
  const { data, isLoading, error } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "owner",
  });

  return {
    owner: data as `0x${string}`,
    isLoading,
    error,
  };
};

/**
 * Hook to get tournament details for a single tournament
 */
export const useTournamentDetails = (tournamentId: string) => {
  // Only call when tournamentId is available
  const args = [BigInt(tournamentId)];

  const { data, isLoading, error, refetch } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "getExtendedTournamentDetails",
    args,
  });

  // Type for the data returned from the contract
  type TournamentDetailsTuple = [
    string, // name
    bigint, // entryFee
    Address, // tokenAddress
    bigint, // activePlayers
    bigint, // maxPlayers
    bigint, // startTime
    bigint, // endTime
    bigint, // amountInTournament
    bigint, // status
    string, // gameType
    string // imageURI
  ];

  // Process the data if available
  let tournamentDetails: TournamentData | null = null;

  if (data && tournamentId) {
    const [
      name,
      entryFee,
      tokenAddress,
      activePlayers,
      maxPlayers,
      startTime,
      endTime,
      amountInTournament,
      status,
      gameType,
      imageURI,
    ] = data as TournamentDetailsTuple;

    tournamentDetails = {
      id: tournamentId,
      name,
      entryFee: Number(formatEther(entryFee)),
      tokenAddress,
      playerCount: Number(activePlayers),
      maxPlayers: Number(maxPlayers),
      startTime: new Date(Number(startTime) * 1000),
      endTime: new Date(Number(endTime) * 1000),
      prizePool: Number(formatEther(amountInTournament)),
      status: mapStatus(Number(status)),
      gameType: gameType || "Unknown",
      image:
        imageURI ||
        "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
    };
  }

  return {
    tournamentDetails,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to check if a player has joined a tournament
 */
export const usePlayerJoinedTournament = (
  tournamentId: string,
  playerAddress: Address
) => {
  // Only call when both parameters are available
  const args =
    tournamentId && playerAddress
      ? [BigInt(tournamentId), playerAddress]
      : undefined;

  const { data, isLoading, error } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "hasPlayerJoined",
    args,
  });

  return { hasJoined: data as boolean | undefined, isLoading, error };
};

/**
 * Hook to get tournament participants
 */
export const useTournamentParticipants = (tournamentId: string) => {
  // Only call when tournamentId is available
  const args = tournamentId ? [BigInt(tournamentId)] : undefined;

  const { data, isLoading, error } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "getTournamentParticipants",
    args,
  });

  return { participants: data as Address[] | undefined, isLoading, error };
};

/**
 * Hook to get tournament winners
 */
export const useTournamentWinners = (tournamentId: string) => {
  // Only call when tournamentId is available
  const args = tournamentId ? [BigInt(tournamentId)] : undefined;

  const { data, isLoading, error } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "getTournamentWinners",
    args,
  });

  return { winners: data as Address[] | undefined, isLoading, error };
};

/**
 * Hook to get player score in a tournament
 */
export const usePlayerScore = (
  tournamentId: string,
  playerAddress: Address
) => {
  // Only call when both parameters are available
  const args =
    tournamentId && playerAddress
      ? [BigInt(tournamentId), playerAddress]
      : undefined;

  const { data, isLoading, error } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "getPlayerScore",
    args,
  });

  return { score: data as bigint | undefined, isLoading, error };
};

/**
 * Hook to get player details
 */
export const usePlayerDetails = (playerAddress: Address) => {
  // Only call when playerAddress is available
  const args = playerAddress ? [playerAddress] : undefined;

  const { data, isLoading, error } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "getPlayerDetails",
    args,
  });

  // Type for player details
  type PlayerDetailsTuple = [
    bigint, // playerId
    bigint, // totalWinnings
    bigint // tournamentCount
  ];

  // Parse player details if available
  let playerDetails = null;
  if (data) {
    const [playerId, totalWinnings, tournamentCount] =
      data as PlayerDetailsTuple;
    playerDetails = {
      playerId: Number(playerId),
      totalWinnings: Number(formatEther(totalWinnings)),
      tournamentCount: Number(tournamentCount),
    };
  }

  return {
    playerDetails,
    isLoading,
    error,
  };
};

/**
 * Hook to check if a player is registered
 */
export const useIsPlayerRegistered = (playerAddress: Address) => {
  // Only call when playerAddress is available
  const args = playerAddress ? [playerAddress] : undefined;

  const { data, isLoading, error } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "isPlayerRegistered",
    args,
  });

  return { isRegistered: data as boolean | undefined, isLoading, error };
};

/**
 * Hook to get discounted entry fee for a player
 */
export const useDiscountedEntryFee = (
  tournamentId: string,
  playerAddress: Address
) => {
  // Only call when both parameters are available
  const args =
    tournamentId && playerAddress
      ? [BigInt(tournamentId), playerAddress]
      : undefined;

  const { data, isLoading, error } = useReadContract({
    chainId: baseSepolia.id,
    address: TOURNAMENT_MANAGER_ADDRESS,
    abi: TournamentManagerABI,
    functionName: "getDiscountedEntryFee",
    args,
  });

  return { discountedFee: data as bigint | undefined, isLoading, error };
};

/**
 * Hook to get badge discount for a player
 */
export const usePlayerBadgeDiscount = (playerAddress: Address) => {
  // Only call balanceOf when playerAddress is available
  const balanceArgs = playerAddress ? [playerAddress] : undefined;

  const { data: badgeBalance, isLoading: balanceLoading } = useReadContract({
    chainId: baseSepolia.id,
    address: PLAYER_BADGE_ADDRESS,
    abi: PlayerBadgeABI,
    functionName: "balanceOf",
    args: balanceArgs,
  });

  const hasBadge = !!(badgeBalance && Number(badgeBalance) > 0);

  // Only call discountPercentage if the player has a badge
  const { data: discountPercentage, isLoading: discountLoading } =
    useReadContract({
      chainId: baseSepolia.id,
      address: PLAYER_BADGE_ADDRESS,
      abi: PlayerBadgeABI,
      functionName: "discountPercentage",
    });

  return {
    hasBadge,
    discountPercentage: discountPercentage as number | undefined,
    isLoading: balanceLoading || discountLoading,
  };
};
