// hooks/useTournament.js
import { TournamentManager } from "@/abi/artifacts/TournamentManager";
import { PlayerBadge } from "@/abi/artifacts/PlayerBadge";
import { TOURNAMENT_MANAGER_ADDRESS, PLAYER_BADGE_ADDRESS } from "../../constants";
import { sepolia } from "viem/chains";
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useState, useEffect } from "react";

// Read Functions

export const useTournamentDetails = (tournamentId) => {
  const { data, isLoading, error } = useReadContract({
    chainId: sepolia.id,
    abi: TournamentManager,
    address: TOURNAMENT_MANAGER_ADDRESS,
    functionName: "getTournamentDetails",
    args: [tournamentId],
  });

  // Transform the contract data into a more frontend-friendly format
  const tournamentDetails = data ? {
    name: data[0],
    entryFee: data[1],
    tokenAddress: data[2],
    activePlayers: data[3],
    maxPlayers: data[4],
    startTime: new Date(Number(data[5]) * 1000),
    endTime: new Date(Number(data[6]) * 1000),
    joinDeadline: new Date(Number(data[7]) * 1000),
    scoreSubmissionDeadline: new Date(Number(data[8]) * 1000),
    amountInTournament: data[9],
    status: getTournamentStatus(data[10]), // Convert from enum to string
    prizesDistributed: data[11]
  } : null;

  return { tournamentDetails, isLoading, error };
};

export const useTournamentParticipants = (tournamentId) => {
  const { data: participants, isLoading, error } = useReadContract({
    chainId: sepolia.id,
    abi: TournamentManager,
    address: TOURNAMENT_MANAGER_ADDRESS,
    functionName: "getTournamentParticipants",
    args: [tournamentId],
  });

  return { participants, isLoading, error };
};

export const useTournamentWinners = (tournamentId) => {
  const { data: winners, isLoading, error } = useReadContract({
    chainId: sepolia.id,
    abi: TournamentManager,
    address: TOURNAMENT_MANAGER_ADDRESS,
    functionName: "getTournamentWinners",
    args: [tournamentId],
  });

  return { winners, isLoading, error };
};

export const usePlayerScore = (tournamentId, playerAddress) => {
  const { data: score, isLoading, error } = useReadContract({
    chainId: sepolia.id,
    abi: TournamentManager,
    address: TOURNAMENT_MANAGER_ADDRESS,
    functionName: "getPlayerScore",
    args: [tournamentId, playerAddress],
    enabled: !!playerAddress
  });

  return { score, isLoading, error };
};

export const usePlayerTournaments = (playerAddress) => {
  const { data: tournamentIds, isLoading, error } = useReadContract({
    chainId: sepolia.id,
    abi: TournamentManager,
    address: TOURNAMENT_MANAGER_ADDRESS,
    functionName: "getPlayerTournaments",
    args: [playerAddress],
    enabled: !!playerAddress
  });

  return { tournamentIds, isLoading, error };
};

export const usePlayerJoinedTournament = (tournamentId, playerAddress) => {
  const { data: hasJoined, isLoading, error } = useReadContract({
    chainId: sepolia.id,
    abi: TournamentManager,
    address: TOURNAMENT_MANAGER_ADDRESS,
    functionName: "hasPlayerJoined",
    args: [tournamentId, playerAddress],
    enabled: !!playerAddress
  });

  return { hasJoined, isLoading, error };
};

export const usePlayerDiscount = (playerAddress) => {
  // First check if player has a badge
  const { data: badgeBalance, isLoading: balanceLoading } = useReadContract({
    chainId: sepolia.id,
    abi: PlayerBadge,
    address: PLAYER_BADGE_ADDRESS,
    functionName: "balanceOf",
    args: [playerAddress],
    enabled: !!playerAddress
  });

  // Then get the discount percentage if they have a badge
  const { data: discountPercentage, isLoading: discountLoading } = useReadContract({
    chainId: sepolia.id,
    abi: PlayerBadge,
    address: PLAYER_BADGE_ADDRESS,
    functionName: "discountPercentage",
    enabled: !!badgeBalance && badgeBalance > 0
  });

  const hasBadge = badgeBalance && badgeBalance > 0;
  const discount = hasBadge ? discountPercentage || 0 : 0;
  const isLoading = balanceLoading || discountLoading;

  return { hasBadge, discount, isLoading };
};

// Write Functions

export const useRegisterPlayer = () => {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { address } = useAccount();

  const registerPlayer = async () => {
    if (!address) throw new Error("Wallet not connected");
    
    try {
      const hash = await writeContractAsync({
        abi: TournamentManager,
        address: TOURNAMENT_MANAGER_ADDRESS,
        functionName: 'registerPlayer',
      });
      
      return hash;
    } catch (err) {
      console.error("Error registering player:", err);
      throw err;
    }
  };

  return { registerPlayer, isPending, error };
};

export const useJoinTournament = (tournamentId) => {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { address } = useAccount();
  const { tournamentDetails } = useTournamentDetails(tournamentId);
  const { discount } = usePlayerDiscount(address);

  const joinTournament = async () => {
    if (!address) throw new Error("Wallet not connected");
    if (!tournamentDetails) throw new Error("Tournament details not loaded");
    
    try {
      // Calculate entry fee with discount if applicable
      let entryFeeValue = tournamentDetails.entryFee;
      if (discount > 0) {
        entryFeeValue = entryFeeValue * (100 - discount) / 100;
      }
      
      // For ETH tournaments
      if (tournamentDetails.tokenAddress === "0x0000000000000000000000000000000000000000") {
        const hash = await writeContractAsync({
          abi: TournamentManager,
          address: TOURNAMENT_MANAGER_ADDRESS,
          functionName: 'joinTournament',
          args: [tournamentId],
          value: entryFeeValue
        });
        return hash;
      } else {
        // For ERC20 token tournaments, first need to approve tokens
        // This is a simplified example - in practice you'd want to:
        // 1. First check allowance
        // 2. If allowance insufficient, approve tokens
        // 3. Then join tournament
        const hash = await writeContractAsync({
          abi: TournamentManager,
          address: TOURNAMENT_MANAGER_ADDRESS,
          functionName: 'joinTournament',
          args: [tournamentId]
        });
        return hash;
      }
    } catch (err) {
      console.error("Error joining tournament:", err);
      throw err;
    }
  };

  return { joinTournament, isPending, error };
};

// Helper Functions 
function getTournamentStatus(statusEnum) {
  const statuses = ["Open", "InProgress", "Completed", "Cancelled"];
  return statuses[statusEnum] || "Unknown";
}

// Hook to get all active tournaments
export const useActiveTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // This is a placeholder - in a real implementation you would:
  // 1. Have a function in your contract to get all active tournaments or indices
  // 2. Use that to fetch the tournaments
  
  useEffect(() => {
    // Simulate fetching tournaments
    // In reality you would need to:
    // - Get the tournament count from contract
    // - Fetch each tournament's details in a loop or batch
    const fetchTournaments = async () => {
      try {
        setIsLoading(true);
        // Placeholder - replace with actual contract calls
        const mockTournaments = Array(5).fill().map((_, i) => ({
          id: String(i + 1),
          // ... fetch each tournament from contract
        }));
        
        setTournaments(mockTournaments);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTournaments();
  }, []);
  
  return { tournaments, isLoading, error };
};