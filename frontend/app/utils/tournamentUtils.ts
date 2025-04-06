// utils/tournamentUtils.ts
import { formatEther, Address } from "viem";

// Map blockchain status to UI status
export function mapTournamentStatus(
  status: number
): "upcoming" | "ongoing" | "completed" {
  switch (status) {
    case 0: // Open
      return "upcoming";
    case 1: // InProgress
      return "ongoing";
    case 2: // Completed
      return "completed";
    default:
      return "upcoming";
  }
}

// Convert blockchain tournament data to UI format
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
  ]
) {
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

  return {
    id,
    name,
    game: gameType,
    prizePool: Number(formatEther(amountInTournament)),
    entryFee: Number(formatEther(entryFee)),
    token: tokenAddress,
    playerCount: Number(activePlayers),
    maxPlayers: Number(maxPlayers),
    startDate: new Date(Number(startTime) * 1000).toISOString().split("T")[0], // Format as YYYY-MM-DD
    endDate: new Date(Number(endTime) * 1000).toISOString().split("T")[0], // Format as YYYY-MM-DD
    status: mapTournamentStatus(Number(status)),
    image:
      imageURI ||
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80", // Default image if none provided
  };
}
