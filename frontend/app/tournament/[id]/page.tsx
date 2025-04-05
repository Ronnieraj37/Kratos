'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Trophy,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Info,
  Share2,
  Award,
  CheckCircle,
  Lock,
  ArrowRight,
  Heart,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import PaymentPopup from "@/components/PaymentPopup";
import SpinGame from "@/components/SpinGame";

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
  rules: string[];
  players: Player[];
  winners?: Player[];
}

// Mock data for tournament details
const mockTournamentDetails: TournamentDetails = {
  id: "1",
  name: "Summer Championship",
  game: "Fortnite",
  description:
    "Compete in our Summer Championship for a chance to win big prizes! This tournament follows a battle royale format where the last player standing wins. Prove your skills and climb to the top of the leaderboard!",
  prizePool: 10000,
  entryFee: 25,
  playerCount: 42,
  maxPlayers: 64,
  startDate: new Date("2023-07-15T18:00:00"),
  endDate: new Date("2023-07-15T23:00:00"),
  status: "upcoming",
  image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
  organizer: {
    name: "GameMasters Inc.",
    avatar: "https://api.dicebear.com/6.x/initials/svg?seed=GM",
  },
  rules: [
    "Players must be at least 16 years old",
    "Must own a copy of the game",
    "All participants must join the Discord server",
    "No cheating or exploitation of game bugs",
    "Players must be available for the entire duration of the tournament",
  ],
  players: Array(42)
    .fill(0)
    .map((_, i) => ({
      id: `player-${i + 1}`,
      name: `Player ${i + 1}`,
      avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${i}`,
      position: i + 1,
      score: Math.floor(Math.random() * 800 + 200),
    })),
};

export default function TournamentDetailsPage({ params }: { params: { id: string } }) {
  const [tournament, setTournament] = useState<TournamentDetails>(mockTournamentDetails);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSpinGameOpen, setIsSpinGameOpen] = useState(false);
  // Start with hasJoined as true so we can play directly
  const [hasJoined, setHasJoined] = useState(true);
  const [hasSpun, setHasSpun] = useState(false);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const diff = tournament.startDate.getTime() - now.getTime();

      if (diff <= 0 && tournament.status === "upcoming") {
        // If start time has passed but status is still upcoming, update it
        setTournament((prev) => ({
          ...prev,
          status: "ongoing",
        }));
        setTimeRemaining("Tournament has started");
        return;
      }

      if (diff <= 0) {
        setTimeRemaining("Tournament has started");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [tournament.startDate, tournament.status]);

  // Handle payment successful
  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    setHasJoined(true);
    // Update player count in tournament
    setTournament((prev) => ({
      ...prev,
      playerCount: prev.playerCount + 1,
      players: [
        {
          id: "current-user",
          name: "You",
          avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=you",
        },
        ...prev.players,
      ],
    }));

    // Open spin game after a short delay
    setTimeout(() => {
      setIsSpinGameOpen(true);
    }, 1000);
  };

  // Handle spin game completion
  const handleSpinComplete = (score: number, position: number) => {
    console.log("Spin completed with score:", score, "position:", position);
    setUserScore(score);
    setUserPosition(position);
    setHasSpun(true);
    
    // Update player score and position after spinning
    setTimeout(() => {
      setTournament((prev) => ({
        ...prev,
        players: prev.players.map((player) =>
          player.id === "current-user"
            ? { ...player, score, position }
            : player
        ),
      }));
    }, 2000);
  };

  // Sort players by position or score
  const sortedPlayers = [...tournament.players].sort((a, b) => {
    if (a.position && b.position) {
      return a.position - b.position;
    }
    if (a.score && b.score) {
      return b.score - a.score;
    }
    return 0;
  });

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

  // Debug function to force open spin game
  const forceOpenSpinGame = () => {
    console.log("Forcing open spin game");
    setIsSpinGameOpen(true);
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
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
                  ? "border-blue-500 text-blue-500"
                  : tournament.status === "ongoing"
                  ? "border-green-500 text-green-500"
                  : "border-gray-500 text-gray-500"
              }`}
            >
              {tournament.status === "upcoming" && (
                <>
                  <Clock className="mr-1 h-3 w-3" /> Starts in {timeRemaining}
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {tournament.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-white/80">
              <div className="flex items-center">
                <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                <span>${tournament.prizePool.toLocaleString()} Prize Pool</span>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                        <h3 className="text-xl font-semibold mb-4">Tournament Details</h3>
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
                              <p className="font-medium">${tournament.entryFee}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                Prize Pool
                              </h4>
                              <p className="font-medium">
                                ${tournament.prizePool.toLocaleString()}
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
                              ${(tournament.prizePool * 0.5).toLocaleString()}
                            </p>
                          </motion.div>
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-gray-500/10 to-gray-500/5 border border-gray-500/20 rounded-lg p-4 text-center"
                          >
                            <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <h4 className="font-bold">2nd Place</h4>
                            <p className="text-xl font-semibold">
                              ${(tournament.prizePool * 0.3).toLocaleString()}
                            </p>
                          </motion.div>
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-4 text-center"
                          >
                            <Award className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                            <h4 className="font-bold">3rd Place</h4>
                            <p className="text-xl font-semibold">
                              ${(tournament.prizePool * 0.2).toLocaleString()}
                            </p>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Organizer</h3>
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-4">
                            <AvatarImage src={tournament.organizer.avatar} />
                            <AvatarFallback>ORG</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{tournament.organizer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Verified Tournament Organizer
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
                            Players ({tournament.playerCount}/{tournament.maxPlayers})
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
                          value={(tournament.playerCount / tournament.maxPlayers) * 100}
                          className="h-2 mb-6"
                        />

                        <div className="space-y-2">
                          {sortedPlayers.slice(0, 20).map((player, index) => (
                            <motion.div
                              key={player.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`flex items-center p-3 rounded-lg ${
                                player.id === "current-user"
                                  ? "bg-primary/10 border border-primary/20"
                                  : "bg-muted/60"
                              } ${index < 3 ? "border border-yellow-500/20" : ""}`}
                            >
                              <div className="w-8 text-center font-medium">
                                {player.position ? `#${player.position}` : index + 1}
                              </div>
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={player.avatar} />
                                <AvatarFallback>
                                  {player.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 font-medium">
                                {player.name}
                                {player.id === "current-user" && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                              {player.score && (
                                <div className="font-bold text-right">
                                  {player.score}
                                </div>
                              )}
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
                          ))}
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
                        <h3 className="text-xl font-semibold mb-4">Tournament Rules</h3>
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
                            All participants are expected to follow the code of conduct
                            and demonstrate good sportsmanship throughout the tournament.
                          </p>
                          <p>
                            Tournament officials will have the final say in all disputes
                            and may disqualify players for rule violations or
                            inappropriate behavior.
                          </p>
                          <p>
                            By participating in this tournament, you agree to allow your
                            gameplay to be streamed and/or recorded for promotional
                            purposes.
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
                        <h3 className="text-xl font-semibold mb-2">Join Tournament</h3>
                        <p className="text-muted-foreground mb-4">
                          Register now to secure your spot in this exciting tournament!
                        </p>

                        <div className="space-y-4">
                          <div className="bg-muted p-3 rounded-lg flex justify-between items-center">
                            <span className="text-muted-foreground">Entry Fee</span>
                            <span className="font-bold text-lg">
                              ${tournament.entryFee}
                            </span>
                          </div>

                          <Button
                            className="w-full"
                            size="lg"
                            onClick={() => setIsPaymentOpen(true)}
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pay & Register
                          </Button>
                        </div>
                      </>
                    )}

                    {hasJoined && hasSpun && (
                      <>
                        <h3 className="text-xl font-semibold mb-2">
                          You are Registered!
                        </h3>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                          <div className="text-center mb-2">
                            <Trophy className="h-8 w-8 text-primary mx-auto mb-1" />
                            <h4 className="font-semibold text-lg">Your Score</h4>
                            <p className="text-3xl font-bold">{userScore || 0}</p>
                          </div>
                          <div className="text-center">
                            <h4 className="font-semibold">Your Position</h4>
                            <p className="text-2xl font-bold">#{userPosition || 0}</p>
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

                          <Button className="w-full" variant="outline">
                            View Your Dashboard
                          </Button>
                        </div>
                      </>
                    )}

                    {hasJoined && !hasSpun && (
                      <>
                        <h3 className="text-xl font-semibold mb-2">
                          Registration Complete!
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Spin the wheel to determine your starting position.
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
                    )}

                    {tournament.status === "ongoing" && !hasJoined && (
                      <>
                        <h3 className="text-xl font-semibold mb-2">
                          Tournament In Progress
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          This tournament has already started. You can no longer join.
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
                          This tournament has ended. View the final results and winners.
                        </p>

                        <div className="space-y-3 mb-4">
                          {[1, 2, 3].map((position) => (
                            <div
                              key={position}
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
                                  {sortedPlayers[position - 1]?.name || `Player ${position}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Score: {sortedPlayers[position - 1]?.score || "N/A"}
                                </p>
                              </div>
                              <div className="font-bold">
                                ${position === 1 
                                  ? (tournament.prizePool * 0.5).toLocaleString() 
                                  : position === 2 
                                    ? (tournament.prizePool * 0.3).toLocaleString() 
                                    : (tournament.prizePool * 0.2).toLocaleString()}
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

                    {/* Add a debug button to force open the spin game */}
                    <Button
                      variant="outline"
                      className="w-full mt-6"
                      onClick={forceOpenSpinGame}
                    >
                      Force Open Spin Game (Debug)
                    </Button>

                    <div className="border-t mt-6 pt-6">
                      <h4 className="font-medium mb-2">Share Tournament</h4>
                      <div className="flex gap-2">
                        {["twitter", "facebook", "discord", "copy"].map((platform) => (
                          <Button
                            key={platform}
                            variant="outline"
                            size="icon"
                            className="flex-1"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        ))}
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
                          <div className={`h-4 w-4 rounded-full ${tournament.status !== "upcoming" ? "bg-green-500" : "bg-muted"}`}></div>
                          <div className="h-full w-px bg-muted"></div>
                        </div>
                        <div className="pb-6">
                          <p className="font-medium">Registration</p>
                          <p className="text-sm text-muted-foreground">
                            Closes {new Date(tournament.startDate.getTime() - 3600000).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="relative mr-4 flex flex-col items-center">
                          <div className={`h-4 w-4 rounded-full ${tournament.status === "ongoing" || tournament.status === "completed" ? "bg-green-500" : "bg-muted"}`}></div>
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
                          <div className={`h-4 w-4 rounded-full ${tournament.status === "completed" ? "bg-green-500" : "bg-muted"}`}></div>
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

              <motion.div variants={itemVariants} className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Related Tournaments</h3>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                        >
                          <img
                            src={`https://images.unsplash.com/photo-154275111${i}-adc38448a05e?w=200&q=80`}
                            alt={`Tournament ${i}`}
                            className="w-12 h-12 rounded-md object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {["Winter Championship", "Pro League Finals", "Battle Royale Masters"][i-1]}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {["Fortnite", "League of Legends", "PUBG"][i-1]}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment Popup */}
      <PaymentPopup
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        tournamentName={tournament.name}
        entryFee={tournament.entryFee}
        discount={10}
        tournamentImage={tournament.image}
        startDate={tournament.startDate}
      />

      {/* Spin Game Popup - Make sure it's rendered regardless of isSpinGameOpen */}
      <SpinGame
        isOpen={isSpinGameOpen}
        onClose={() => {
          console.log("Closing spin game");
          setIsSpinGameOpen(false);
        }}
        onComplete={(score, position) => {
          console.log("Spin complete with score:", score, "position:", position);
          handleSpinComplete(score, position);
        }}
        tournamentName={tournament.name}
        tournamentEndTime={tournament.endDate.toISOString()}
        canSpin={true} // Always allow spinning for debug purposes
        playerCount={tournament.maxPlayers}
      />
    </div>
  );
}