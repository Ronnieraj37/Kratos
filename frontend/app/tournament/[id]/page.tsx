"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Trophy,
  Users,
  Calendar,
  DollarSign,
  Info,
  Award,
  CheckCircle,
  Lock,
  Heart,
  RotateCcw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import SpinGame from "@/components/SpinGame";
import {
  useTournamentDetails,
  usePlayerJoinedTournament,
  useTournamentWinners,
  usePlayerScore,
  useTournamentParticipants,
} from "../../contract/getters/Getter";
import { useAccount, useToken, useWriteContract } from "wagmi";
import { TOURNAMENT_MANAGER_ADDRESS } from "@/app/constants";
import { TournamentManagerABI } from "@/app/contract/abi/TournamentManager";
import { baseSepolia } from "viem/chains";
// Define player type
interface Player {
  id: string;
  name: string;
  avatar: string;
  position?: number;
  score?: number;
}

// Define tournament type
interface TournamentDetails {
  id: string;
  name: string;
  game: string;
  description: string;
  prizePool: number;
  entryFee: number;
  playerCount: number;
  maxPlayers: number;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "ongoing" | "completed";
  image: string;
  organizer: {
    name: string;
    avatar: string;
  };
  tokenAddress: `0x${string}`;
  rules: string[];
  players: Player[];
  winners?: Player[];
}

export default function TournamentDetailsPage() {
  const params = useParams();

  const tournamentId = params.id as string;
  const { address } = useAccount();
  const {
    tournamentDetails,
    isLoading: isTournamentLoading,
    error: tournamentError,
  } = useTournamentDetails(tournamentId);
  const { writeContractAsync } = useWriteContract();

  // Fetch tournament participants
  const { participants } = useTournamentParticipants(tournamentId);
  // Check if player has joined
  const { hasJoined } = usePlayerJoinedTournament(tournamentId, address!);
  const { winners } = useTournamentWinners(tournamentId);
  const { score: playerScore } = usePlayerScore(tournamentId, address!);
  // State management
  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [isSpinGameOpen, setIsSpinGameOpen] = useState(false);
  const [userScore, setUserScore] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const tournamentDataLoaded = useRef(false);

  // Create participants list with basic information
  const participantsList = useMemo(() => {
    return (participants || []).map((address, index) => ({
      id: address,
      name: `Player ${index + 1}`,
      avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${address}`,
      // Add more details if available from contract
    }));
  }, [participants]);

  // Fetch user score from contract
  const userScoreFromContract = useMemo(() => {
    return playerScore ? Number(playerScore) : null;
  }, [playerScore]);

  // Determine if the player has already played (has a score)
  const hasPlayed = useMemo(() => {
    return userScoreFromContract !== null && userScoreFromContract > 0;
  }, [userScoreFromContract]);

  // Sort participants (currently just a placeholder sorting)
  const sortedPlayers = useMemo(() => {
    return [...participantsList];
  }, [participantsList]);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) {
      return "now";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `in ${days}d ${hours}h`;
    } else if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else {
      return `in ${minutes}m`;
    }
  };

  const isRegistrationOpen = () => {
    // Get current time
    const now = new Date();

    // Check if tournament is full
    const isTournamentFull = tournament.playerCount >= tournament.maxPlayers;

    // Registration is open if:
    // 1. Current time is before tournament start time AND
    // 2. Tournament is not full
    return now < tournament.startDate && !isTournamentFull;
  };

  const joinTournament = async () => {
    try {
      const hash = await writeContractAsync({
        address: TOURNAMENT_MANAGER_ADDRESS,
        abi: TournamentManagerABI,
        functionName: "joinTournament",
        chain: baseSepolia,
        account: address,
        args: [BigInt(tournamentId)],
        value: BigInt(tournament.entryFee * 1e18),
      });
      console.log("Transaction hash:", hash);
    } catch (error) {
      console.log("Error", error);
    }
  };

  const isTournamentPlayable = useMemo(() => {
    if (!tournament) return false;

    // Check if tournament has enough players to be playable
    return tournament.playerCount >= tournament.maxPlayers;
  }, [tournament]);

  // Handle spin game completion
  const handleSpinComplete = (score: number) => {
    console.log("Spin completed with score:", score);
    setUserScore(score);
  };

  useEffect(() => {
    // Only set tournament data once
    if (!tournamentDetails || tournamentDataLoaded.current) return;

    // Set the flag to true to prevent future updates
    tournamentDataLoaded.current = true;

    // Set the tournament data once
    setTournament({
      id: tournamentDetails.id,
      name: tournamentDetails.name,
      game: tournamentDetails.gameType,
      description: "Tournament description",
      tokenAddress: tournamentDetails.tokenAddress,
      prizePool: tournamentDetails.entryFee * tournamentDetails.maxPlayers,
      entryFee: tournamentDetails.entryFee,
      playerCount: tournamentDetails.playerCount,
      maxPlayers: tournamentDetails.maxPlayers,
      startDate: tournamentDetails.startTime,
      endDate: new Date(
        tournamentDetails.startTime.getTime() + 5 * 60 * 60 * 1000
      ),
      status: tournamentDetails.status,
      image: tournamentDetails.image,
      organizer: {
        name: "Kratos GG",
        avatar: "https://api.dicebear.com/6.x/initials/svg?seed=ORG",
      },
      rules: [
        "Follow tournament rules",
        "No cheating allowed",
        "Respect other players",
      ],
      players: [],
      winners:
        winners?.map((winner, index) => ({
          id: winner,
          name: `Winner ${index + 1}`,
          avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${index}`,
          position: index + 1,
        })) || [],
    });
  }, [tournamentDetails, winners]);

  // Update the registration state management
  useEffect(() => {
    if (hasPlayed && userScoreFromContract !== null) {
      // If player has played, set their score from the contract
      setUserScore(userScoreFromContract);
    }
  }, [hasPlayed, userScoreFromContract]);

  // Get token symbol from token data or use ETH as default
  const { data: tokenData } = useToken({
    address: tournament?.tokenAddress,
  });

  const tokenSymbol = useMemo(() => {
    return tokenData?.symbol || "ETH";
  }, [tokenData]);

  const hasTournamentStarted = useMemo(() => {
    if (!tournament) return false;
    const now = new Date();
    return now >= tournament.startDate;
  }, [tournament]);

  // Check if the tournament is active (started but not completed)
  const isTournamentActive = useMemo(() => {
    if (!tournament) return false;
    const now = new Date();
    return now >= tournament.startDate && now <= tournament.endDate;
  }, [tournament]);

  // Loading state
  if (isTournamentLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Trophy className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }
  // Error state
  if (tournamentError || !tournament) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Failed to load tournament details
      </div>
    );
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px]">
        <div className="absolute inset-0">
          <img
            src={tournament.image}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
          {/* Darker overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative h-full flex flex-col justify-between py-6">
          <div className="flex justify-between items-start">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>

            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-white"
                }`}
              />
            </Button>
          </div>

          <div className="mt-auto">
            <Badge
              variant="outline"
              className={`mb-2 font-medium ${
                tournament.status === "upcoming"
                  ? "border-blue-500 text-blue-500 bg-blue-500/10"
                  : tournament.status === "ongoing"
                  ? "border-green-500 text-green-500 bg-green-500/10"
                  : "border-gray-500 text-gray-500 bg-gray-500/10"
              }`}
            >
              {tournament.status === "upcoming" && (
                <>
                  <Clock className="mr-1 h-3 w-3" /> Starts{" "}
                  {formatRelativeTime(tournament.startDate)}
                </>
              )}
              {tournament.status === "ongoing" && (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>{" "}
                  Live Now
                </>
              )}
              {tournament.status === "completed" && (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" /> Completed
                </>
              )}
            </Badge>
            {/* Larger, more prominent title with text shadow */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {tournament.name}
            </h1>
            {/* Increased contrast for details text */}
            <div className="flex flex-wrap gap-4 text-white">
              <div className="flex items-center">
                <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                <span>
                  {tokenSymbol} {tournament.prizePool.toLocaleString()} Prize
                  Pool
                </span>
              </div>
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4 text-blue-400" />
                <span>
                  {tournament.playerCount}/{tournament.maxPlayers} Players
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4 text-purple-400" />
                <span>{formatDate(tournament.startDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Column */}
          <div className="flex-1 order-2 lg:order-1">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="players">
                  <Users className="mr-1 h-4 w-4" /> Players
                </TabsTrigger>
                <TabsTrigger value="rules">
                  <Info className="mr-1 h-4 w-4" /> Rules
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="overview" className="space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">
                          Tournament Details
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          {tournament.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                Game
                              </h4>
                              <p className="font-medium">{tournament.game}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                Format
                              </h4>
                              <p className="font-medium">Battle Royale</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                Start Date
                              </h4>
                              <p className="font-medium">
                                {formatDate(tournament.startDate)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                Entry Fee
                              </h4>
                              <p className="font-medium">
                                {tournament.entryFee} {tokenSymbol}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                Prize Pool
                              </h4>
                              <p className="font-medium">
                                {tournament.prizePool.toLocaleString()}{" "}
                                {tokenSymbol}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                End Date
                              </h4>
                              <p className="font-medium">
                                {formatDate(tournament.endDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Prizes</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 text-center"
                          >
                            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <h4 className="font-bold">1st Place</h4>
                            <p className="text-xl font-semibold">
                              {(tournament.prizePool * 0.5).toLocaleString()}{" "}
                              {tokenSymbol}
                            </p>
                          </motion.div>
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-gray-500/10 to-gray-500/5 border border-gray-500/20 rounded-lg p-4 text-center"
                          >
                            <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <h4 className="font-bold">2nd Place</h4>
                            <p className="text-xl font-semibold">
                              {(tournament.prizePool * 0.3).toLocaleString()}{" "}
                              {tokenSymbol}
                            </p>
                          </motion.div>
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-4 text-center"
                          >
                            <Award className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                            <h4 className="font-bold">3rd Place</h4>
                            <p className="text-xl font-semibold">
                              {(tournament.prizePool * 0.2).toLocaleString()}{" "}
                              {tokenSymbol}
                            </p>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">
                          Organizer
                        </h3>
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-4">
                            <AvatarImage src={tournament.organizer.avatar} />
                            <AvatarFallback>ORG</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {tournament.organizer.name}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="players" className="space-y-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-semibold">
                            Players ({tournament.playerCount}/
                            {tournament.maxPlayers})
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            {tournament.status === "completed"
                              ? "Final Results"
                              : tournament.status === "ongoing"
                              ? "Live Standings"
                              : "Registered Players"}
                          </div>
                        </div>

                        <Progress
                          value={
                            (tournament.playerCount / tournament.maxPlayers) *
                            100
                          }
                          className="h-2 mb-6"
                        />

                        <div className="space-y-2">
                          {sortedPlayers.slice(0, 20).map(
                            (
                              player: {
                                id: `0x${string}`;
                                name: string;
                                avatar: string;
                              },
                              index: number
                            ) => (
                              <motion.div
                                key={player.id} // Using player.id as key which should be unique
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={`flex items-center p-3 rounded-lg ${
                                  player.id === address
                                    ? "bg-primary/10 border border-primary/20"
                                    : "bg-muted/60"
                                } ${
                                  index < 3 ? "border border-yellow-500/20" : ""
                                }`}
                              >
                                <div className="w-8 text-center font-medium">
                                  {index + 1}
                                </div>
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarImage src={player.avatar} />
                                  <AvatarFallback>
                                    {player.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {player.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {truncateAddress(player.id)}
                                  </div>
                                  {player.id === address && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      You
                                    </Badge>
                                  )}
                                </div>
                                {index < 3 && (
                                  <Trophy
                                    className={`h-4 w-4 ml-2 ${
                                      index === 0
                                        ? "text-yellow-500"
                                        : index === 1
                                        ? "text-gray-400"
                                        : "text-amber-600"
                                    }`}
                                  />
                                )}
                              </motion.div>
                            )
                          )}
                        </div>

                        {tournament.playerCount > 20 && (
                          <Button variant="ghost" className="w-full mt-4">
                            View All Players
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="rules" className="space-y-4">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">
                          Tournament Rules
                        </h3>
                        <div className="space-y-4">
                          {tournament.rules.map((rule, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start"
                            >
                              <div className="rounded-full bg-primary/10 p-1 mr-3 mt-0.5">
                                <CheckCircle className="h-4 w-4 text-primary" />
                              </div>
                              <p>{rule}</p>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">
                          Additional Information
                        </h3>
                        <div className="space-y-4 text-muted-foreground">
                          <p>
                            All participants are expected to follow the code of
                            conduct and demonstrate good sportsmanship
                            throughout the tournament.
                          </p>
                          <p>
                            Tournament officials will have the final say in all
                            disputes and may disqualify players for rule
                            violations or inappropriate behavior.
                          </p>
                          <p>
                            By participating in this tournament, you agree to
                            allow your gameplay to be streamed and/or recorded
                            for promotional purposes.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[350px] order-1 lg:order-2">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-b from-background to-muted/50">
                  <CardContent className="p-6">
                    {tournament.status === "upcoming" && !hasJoined && (
                      <>
                        <h3 className="text-xl font-semibold mb-2">
                          Join Tournament
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {tournament.playerCount >= tournament.maxPlayers
                            ? "This tournament is full. No more players can join."
                            : "Register now to secure your spot in this exciting tournament!"}
                        </p>

                        <div className="space-y-4">
                          <div className="bg-muted p-3 rounded-lg flex justify-between items-center">
                            <span className="text-muted-foreground">
                              Entry Fee
                            </span>
                            <span className="font-bold text-lg">
                              {tournament.entryFee} {tokenSymbol}
                            </span>
                          </div>

                          {tournament.playerCount >= tournament.maxPlayers ? (
                            <Button className="w-full" size="lg" disabled>
                              <Lock className="mr-2 h-4 w-4" />
                              Tournament Full
                            </Button>
                          ) : isRegistrationOpen() ? (
                            <Button
                              className="w-full"
                              size="lg"
                              onClick={joinTournament}
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Join Tournament
                            </Button>
                          ) : (
                            <Button className="w-full" size="lg" disabled>
                              <Lock className="mr-2 h-4 w-4" />
                              Registration Closed
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                    {hasJoined && !hasTournamentStarted && (
                      <>
                        <h3 className="text-xl font-semibold mb-2">
                          You are Registered!
                        </h3>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                          <div className="text-center mb-2">
                            <Trophy className="h-8 w-8 text-primary mx-auto mb-1" />
                            <h4 className="font-semibold text-lg">
                              Tournament Status
                            </h4>
                            <p className="text-lg font-medium">
                              Waiting to Start
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                Tournament Starts
                              </span>
                              <span className="font-medium">
                                {formatDate(tournament.startDate)}
                              </span>
                            </div>
                          </div>

                          <div className="text-center text-sm text-muted-foreground">
                            The spin game will be available once the tournament
                            starts
                          </div>
                        </div>
                      </>
                    )}
                    {/* Joined and already played (or got score from contract) */}
                    {hasJoined && (hasPlayed || userScore !== null) && (
                      <>
                        <h3 className="text-xl font-semibold mb-2">
                          Your Tournament Entry
                        </h3>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                          <div className="text-center mb-2">
                            <Trophy className="h-8 w-8 text-primary mx-auto mb-1" />
                            <h4 className="font-semibold text-lg">
                              Your Score
                            </h4>
                            <p className="text-3xl font-bold">
                              {userScore || userScoreFromContract || 0}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                Tournament{" "}
                                {tournament.status === "completed"
                                  ? "Ended"
                                  : "Ends"}
                              </span>
                              <span className="font-medium">
                                {formatDate(tournament.endDate)}
                              </span>
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            variant="outline"
                            disabled={tournament.status !== "completed"}
                          >
                            {tournament.status === "completed"
                              ? "View Results"
                              : "Results Available After Tournament"}
                          </Button>
                        </div>
                      </>
                    )}

                    {hasJoined &&
                      hasTournamentStarted &&
                      !hasPlayed &&
                      isTournamentActive && (
                        <>
                          <h3 className="text-xl font-semibold mb-2">
                            {isTournamentPlayable
                              ? "Time to Play!"
                              : "Waiting for Players"}
                          </h3>

                          {isTournamentPlayable ? (
                            <>
                              <p className="text-muted-foreground mb-4">
                                Spin the wheel to determine your score and
                                compete in the tournament.
                              </p>

                              <Button
                                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600"
                                size="lg"
                                onClick={() => setIsSpinGameOpen(true)}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Spin The Wheel
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
                                <div className="text-center">
                                  <Users className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">
                                    {tournament.playerCount}/
                                    {tournament.maxPlayers} players joined
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    This tournament requires all slots to be
                                    filled before it can begin.
                                  </p>
                                </div>
                              </div>

                              <Button
                                className="w-full"
                                variant="outline"
                                disabled
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Waiting for More Players
                              </Button>
                            </>
                          )}
                        </>
                      )}

                    {tournament.status === "ongoing" && !hasJoined && (
                      <>
                        <h3 className="text-xl font-semibold mb-2">
                          Tournament In Progress
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          This tournament has already started. You can no longer
                          join.
                        </p>

                        <div className="bg-muted p-4 rounded-lg text-center">
                          <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Registration closed
                          </p>
                        </div>
                      </>
                    )}

                    {tournament.status === "completed" && (
                      <>
                        <h3 className="text-xl font-semibold mb-2">
                          Tournament Completed
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          This tournament has ended. View the final results and
                          winners.
                        </p>

                        <div className="space-y-3 mb-4">
                          {[1, 2, 3].map((position) => (
                            <div
                              key={`winner-position-${position}`}
                              className="flex items-center p-3 bg-muted rounded-lg"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                  position === 1
                                    ? "bg-yellow-500"
                                    : position === 2
                                    ? "bg-gray-400"
                                    : "bg-amber-600"
                                }`}
                              >
                                <Trophy className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">
                                  {sortedPlayers[position - 1]?.name ||
                                    `Player ${position}`}
                                </p>
                                {sortedPlayers[position - 1]?.id && (
                                  <p className="text-xs text-muted-foreground">
                                    {truncateAddress(
                                      sortedPlayers[position - 1]?.id
                                    )}
                                  </p>
                                )}
                              </div>
                              <div className="font-bold">
                                {position === 1
                                  ? (
                                      tournament.prizePool * 0.5
                                    ).toLocaleString()
                                  : position === 2
                                  ? (
                                      tournament.prizePool * 0.3
                                    ).toLocaleString()
                                  : (
                                      tournament.prizePool * 0.2
                                    ).toLocaleString()}{" "}
                                {tokenSymbol}
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveTab("players")}
                        >
                          View All Results
                        </Button>
                      </>
                    )}

                    <div className="border-t mt-6 pt-6">
                      <h4 className="font-medium mb-2">Share Tournament</h4>
                      <div className="flex gap-2">
                        {/* Unique buttons with icons for each platform */}
                        <Button
                          key="twitter-share"
                          variant="outline"
                          size="icon"
                          className="flex-1"
                          onClick={() =>
                            window.open(
                              `https://twitter.com/intent/tweet?text=Join ${tournament.name}&url=${window.location.href}`,
                              "_blank"
                            )
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-twitter"
                          >
                            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                          </svg>
                        </Button>

                        <Button
                          key="discord-share"
                          variant="outline"
                          size="icon"
                          className="flex-1"
                          onClick={() =>
                            window.open(`https://discord.com/`, "_blank")
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-message-square"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </Button>

                        <Button
                          key="copy-link"
                          variant="outline"
                          size="icon"
                          className="flex-1"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            // You could add a toast notification here
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-copy"
                          >
                            <rect
                              width="14"
                              height="14"
                              x="8"
                              y="8"
                              rx="2"
                              ry="2"
                            ></rect>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Tournament Timeline</h3>
                    <div className="space-y-4">
                      <div className="flex">
                        <div className="relative mr-4 flex flex-col items-center">
                          <div
                            className={`h-4 w-4 rounded-full ${
                              tournament.status !== "upcoming"
                                ? "bg-green-500"
                                : "bg-muted"
                            }`}
                          ></div>
                          <div className="h-full w-px bg-muted"></div>
                        </div>
                        <div className="pb-6">
                          <p className="font-medium">Registration</p>
                          <p className="text-sm text-muted-foreground">
                            Closes{" "}
                            {new Date(
                              tournament.startDate.getTime() - 3600000
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="relative mr-4 flex flex-col items-center">
                          <div
                            className={`h-4 w-4 rounded-full ${
                              tournament.status === "ongoing" ||
                              tournament.status === "completed"
                                ? "bg-green-500"
                                : "bg-muted"
                            }`}
                          ></div>
                          <div className="h-full w-px bg-muted"></div>
                        </div>
                        <div className="pb-6">
                          <p className="font-medium">Tournament Begins</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(tournament.startDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="relative mr-4 flex flex-col items-center">
                          <div
                            className={`h-4 w-4 rounded-full ${
                              tournament.status === "completed"
                                ? "bg-green-500"
                                : "bg-muted"
                            }`}
                          ></div>
                        </div>
                        <div>
                          <p className="font-medium">Tournament Ends</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(tournament.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Spin Game Popup - Make sure it's rendered regardless of isSpinGameOpen */}
      <SpinGame
        isOpen={isSpinGameOpen}
        onClose={() => {
          console.log("Closing spin game");
          setIsSpinGameOpen(false);
        }}
        onComplete={(score: number) => {
          console.log("Spin complete with score:", score);
          handleSpinComplete(score);
        }}
        tournamentName={tournament.name}
        tournamentEndTime={tournament.endDate.toISOString()}
        canSpin={hasTournamentStarted && isTournamentPlayable} // Only allow spin if tournament has started AND has enough players
        tournamentId={tournamentId}
        playerCount={tournament.playerCount}
        maxPlayers={tournament.maxPlayers}
      />
    </div>
  );
}
