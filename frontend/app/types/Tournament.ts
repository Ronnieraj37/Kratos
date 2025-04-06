// types/tournament.ts
import { Address } from "viem";

// Enum for tournament status matching the contract
export enum TournamentStatus {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
}

// Convert numeric status to string for UI display
export function getTournamentStatusText(
  status: TournamentStatus
): "upcoming" | "ongoing" | "completed" | "cancelled" {
  switch (status) {
    case TournamentStatus.Open:
      return "upcoming";
    case TournamentStatus.InProgress:
      return "ongoing";
    case TournamentStatus.Completed:
      return "completed";
    case TournamentStatus.Cancelled:
      return "cancelled";
    default:
      return "upcoming";
  }
}

// Structure for extended tournament details from contract
export interface ExtendedTournamentDetails {
  name: string;
  entryFee: bigint;
  tokenAddress: Address;
  activePlayers: bigint;
  maxPlayers: bigint;
  startTime: bigint;
  endTime: bigint;
  amountInTournament: bigint;
  status: bigint;
  gameType: string;
  imageURI: string;
}

// Tournament data structure for the UI
export interface TournamentUI {
  id: string;
  name: string;
  game: string;
  description?: string;
  prizePool: number;
  entryFee: number;
  playerCount: number;
  maxPlayers: number;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  image: string;
  tokenAddress?: Address;
  organizer?: {
    name: string;
    avatar: string;
  };
  rules?: string[];
  players?: PlayerUI[];
  winners?: Address[];
}

// Player data structure for contract
export interface PlayerData {
  playerId: bigint;
  totalWinnings: bigint;
  tournamentCount: bigint;
}

// Player data structure for UI
export interface PlayerUI {
  id: string;
  name: string;
  avatar: string;
  address: Address;
  position?: number;
  score?: number | bigint;
}

// Function to convert raw contract data to UI format
export function mapTournamentToUI(
  id: string,
  tournamentData: readonly [
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
  ],
  participants?: Address[],
  winners?: Address[]
): TournamentUI {
  if (!tournamentData || tournamentData.length < 11) {
    throw new Error("Invalid tournament data");
  }

  // Extract data from the result array
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
  ] = tournamentData;

  // Convert timestamps to Date objects
  const startDate = new Date(Number(startTime) * 1000);
  const endDate = new Date(Number(endTime) * 1000);

  // Generate placeholder description if none provided
  const description = `Compete in our ${name} tournament for a chance to win big prizes!`;

  // Map participants to PlayerUI array if available
  const players = participants?.map((address, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
    avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${address}`,
    address,
    position: index + 1,
  }));

  return {
    id,
    name,
    game: gameType || "Unknown",
    description,
    prizePool: Number(formatEther(amountInTournament)),
    entryFee: Number(formatEther(entryFee)),
    playerCount: Number(activePlayers),
    maxPlayers: Number(maxPlayers),
    startDate,
    endDate,
    status: getTournamentStatusText(Number(status) as TournamentStatus),
    image:
      imageURI ||
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
    tokenAddress,
    players,
    winners,
  };
}

// Helper function to format bigint to ether
function formatEther(wei: bigint): string {
  return (Number(wei) / 1e18).toString();
}
