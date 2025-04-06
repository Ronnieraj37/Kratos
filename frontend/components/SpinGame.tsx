"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Star,
  X,
  Clock,
  Award,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";

interface SpinGameProps {
  onComplete?: (score: number) => void;
  onClose?: () => void;
  isOpen?: boolean;
  tournamentName?: string;
  tournamentEndTime?: string;
  canSpin?: boolean;
  tournamentId: string;
  playerCount?: number;
  maxPlayers?: number;
}

type Symbol = {
  value: number;
  name: string;
  color: string;
  icon?: React.ReactNode;
};

const symbols: Symbol[] = [
  {
    value: 0,
    name: "0",
    color: "text-gray-500 bg-gray-200",
    icon: <Star className="h-6 w-6 text-gray-500" />,
  },
  {
    value: 1,
    name: "1",
    color: "text-blue-500 bg-blue-100",
    icon: <Star className="h-6 w-6 text-blue-500" />,
  },
  {
    value: 2,
    name: "2",
    color: "text-green-500 bg-green-100",
    icon: <Star className="h-6 w-6 text-green-500" />,
  },
  {
    value: 3,
    name: "3",
    color: "text-yellow-500 bg-yellow-100",
    icon: <Star className="h-6 w-6 text-yellow-500" />,
  },
  {
    value: 4,
    name: "4",
    color: "text-orange-500 bg-orange-100",
    icon: <Star className="h-6 w-6 text-orange-500" />,
  },
  {
    value: 5,
    name: "5",
    color: "text-red-500 bg-red-100",
    icon: <Star className="h-6 w-6 text-red-500" />,
  },
  {
    value: 6,
    name: "6",
    color: "text-purple-500 bg-purple-100",
    icon: <Star className="h-6 w-6 text-purple-500" />,
  },
  {
    value: 7,
    name: "7",
    color: "text-pink-500 bg-pink-100",
    icon: <Star className="h-6 w-6 text-pink-500" />,
  },
  {
    value: 8,
    name: "8",
    color: "text-indigo-500 bg-indigo-100",
    icon: <Star className="h-6 w-6 text-indigo-500" />,
  },
  {
    value: 9,
    name: "9",
    color: "text-teal-500 bg-teal-100",
    icon: <Star className="h-6 w-6 text-teal-500" />,
  },
];

const jackpotSymbol: Symbol = {
  value: 7,
  name: "7",
  color: "text-yellow-600 bg-yellow-100",
  icon: <Trophy className="h-6 w-6 text-yellow-600" />,
};

const SpinGame = ({
  onComplete = () => {},
  onClose = () => {},
  isOpen = true,
  tournamentName = "Tournament",
  tournamentEndTime = "2023-12-17T18:00:00",
  canSpin = true,
  tournamentId,
  playerCount,
  maxPlayers,
}: SpinGameProps) => {
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState<Symbol[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [remainingTime, setRemainingTime] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { address } = useAccount();

  const isFullyBooked = playerCount === maxPlayers;

  // Calculate remaining time until tournament ends
  useEffect(() => {
    const calculateRemainingTime = () => {
      const now = new Date();
      const endTime = new Date(tournamentEndTime);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setRemainingTime("Tournament has ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setRemainingTime(`${days}d ${hours}h ${minutes}m remaining`);
      } else if (hours > 0) {
        setRemainingTime(`${hours}h ${minutes}m remaining`);
      } else {
        setRemainingTime(`${minutes}m remaining`);
      }
    };

    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 60000);

    return () => clearInterval(interval);
  }, [tournamentEndTime]);

  // Function to submit score to blockchain via API
  const submitScoreToBlockchain = async (scoreValue: number) => {
    console.log("Submitting score to blockchain:", scoreValue);
    setIsSubmitting(true);

    try {
      // Call the API endpoint
      console.log("Started here?");
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId,
          playerAddress: address,
          score: scoreValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit score");
      }

      console.log("Score submitted successfully:", data);
      setIsSubmitted(true);

      // Call onComplete callback with the score
      onComplete(scoreValue);
    } catch (error) {
      console.error("Error submitting score:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const spinReels = () => {
    if (spinning || !canSpin) return;

    console.log("Spinning reels...");
    setSpinning(true);
    setResults([]);
    setScore(null);
    setShowCelebration(false);
    setIsSubmitted(false);
    setSpinCount((prev) => prev + 1);

    // Generate random results for each reel with staggered timing
    const newResults: Symbol[] = [];

    setTimeout(() => {
      // First reel stops
      const jackpotChance1 = Math.random() < 0.1; // 10% chance for jackpot symbol
      newResults[0] = jackpotChance1
        ? jackpotSymbol
        : symbols[Math.floor(Math.random() * symbols.length)];
      setResults([newResults[0]]);

      setTimeout(() => {
        // Second reel stops
        const jackpotChance2 = Math.random() < 0.1;
        newResults[1] = jackpotChance2
          ? jackpotSymbol
          : symbols[Math.floor(Math.random() * symbols.length)];
        setResults([newResults[0], newResults[1]]);

        setTimeout(() => {
          // Third reel stops
          // If the first two are jackpot, increase chance of third jackpot (but not guaranteed)
          const isFirstTwoJackpot =
            newResults[0].value === 7 && newResults[1].value === 7;
          const jackpotChance3 = isFirstTwoJackpot ? 0.4 : 0.1;
          newResults[2] =
            Math.random() < jackpotChance3
              ? jackpotSymbol
              : symbols[Math.floor(Math.random() * symbols.length)];
          setResults([newResults[0], newResults[1], newResults[2]]);

          // Calculate score as the concatenated digits (e.g., 7,8,4 becomes 784)
          const calculatedScore = parseInt(
            `${newResults[0].value}${newResults[1].value}${newResults[2].value}`
          );
          submitScoreToBlockchain(calculatedScore);
          setScore(calculatedScore);
          setSpinning(false);

          // Check if it's a special combination for celebration
          if (
            (newResults[0].value === 7 &&
              newResults[1].value === 7 &&
              newResults[2].value === 7) ||
            calculatedScore > 800
          ) {
            setShowCelebration(true);
          }
        }, 1000);
      }, 800);
    }, 600);
  };

  // Calculate score color based on value
  const getScoreColor = () => {
    if (!score) return "text-white";

    if (score >= 900) return "text-yellow-500";
    if (score >= 700) return "text-green-500";
    if (score >= 500) return "text-blue-500";
    return "text-white";
  };

  if (!isOpen) return null;

  console.log("Rendering SpinGame with isOpen:", isOpen, "canSpin:", canSpin);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-[650px] max-w-[95vw]"
      >
        <Card className="bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-yellow-500 rounded-xl shadow-2xl overflow-hidden">
          <div className="relative">
            {/* Animated background pattern */}
            <div className="absolute inset-0 z-0 opacity-20">
              <svg width="100%" height="100%" className="absolute">
                <defs>
                  <pattern
                    id="dice-pattern"
                    x="0"
                    y="0"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M0 0h10v10H0zm20 0h10v10H20zM10 10h10v10H10zm20 10h10v10H20zM0 20h10v10H0zm10 20h10v10H10zm20 0h10v10H20z"
                      fill="currentColor"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dice-pattern)" />
              </svg>
            </div>

            {/* Header */}
            <div className="relative p-6 z-10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {tournamentName}
                  </h2>
                  <div className="flex items-center text-yellow-300 mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">{remainingTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowHelp(!showHelp)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full p-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full p-1"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              <div className="text-gray-300 text-sm mb-4">
                Spin to determine your tournament score
              </div>

              {/* Help tooltip */}
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute right-6 top-16 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-30 text-sm text-gray-300 w-64"
                  >
                    <h3 className="font-semibold text-white mb-2">
                      How It Works
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="bg-yellow-100 rounded-full p-1 mt-0.5">
                          <Trophy className="h-3 w-3 text-yellow-600" />
                        </div>
                        <span>
                          Your score is determined by the three digits!
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="bg-pink-100 rounded-full p-1 mt-0.5">
                          <Star className="h-3 w-3 text-pink-500" />
                        </div>
                        <span>
                          Triple 7s give you the highest score of 777!
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                          <Award className="h-3 w-3 text-blue-500" />
                        </div>
                        <span>
                          Your score is automatically recorded on the blockchain
                        </span>
                      </li>
                    </ul>
                    <ChevronDown className="absolute -top-4 right-4 h-4 w-4 text-gray-800" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <CardContent className="p-6 pt-0 relative z-10">
              {/* Reels container */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center gap-4 mb-6"
              >
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 400,
                      damping: 20,
                    }}
                    className="relative w-24 h-32 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg border-2 border-yellow-400 overflow-hidden shadow-inner"
                  >
                    {/* Shiny effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"
                        animate={{
                          left: ["100%", "-100%"],
                          top: ["100%", "-100%"],
                        }}
                        transition={{
                          repeat: Infinity,
                          repeatType: "loop",
                          duration: 3,
                          ease: "linear",
                        }}
                      />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none z-10"></div>

                    <AnimatePresence>
                      {spinning && !results[index] ? (
                        <motion.div
                          className="absolute inset-0 flex flex-col items-center justify-start"
                          initial={{ y: 0 }}
                          animate={{
                            y: [0, -500, -1000, -1500],
                            transition: {
                              repeat: Infinity,
                              duration: 0.5,
                              ease: "linear",
                            },
                          }}
                          key={`spinning-${spinCount}-${index}`}
                        >
                          {Array(20)
                            .fill(0)
                            .map((_, i) => {
                              const symbol =
                                i % 10 === 7
                                  ? jackpotSymbol
                                  : symbols[i % symbols.length];
                              return (
                                <div
                                  key={i}
                                  className={`flex flex-col items-center justify-center h-32 w-full ${
                                    i % 2 === 0
                                      ? "bg-gray-800/50"
                                      : "bg-gray-700/50"
                                  }`}
                                >
                                  <div
                                    className={`flex flex-col items-center justify-center rounded-full w-12 h-12 ${symbol.color} mb-1`}
                                  >
                                    {symbol.icon}
                                  </div>
                                  <span
                                    className={`text-lg font-bold ${
                                      symbol.color.split(" ")[0]
                                    }`}
                                  >
                                    {symbol.name}
                                  </span>
                                </div>
                              );
                            })}
                        </motion.div>
                      ) : (
                        results[index] && (
                          <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 15,
                            }}
                            className="flex flex-col items-center justify-center h-full"
                          >
                            {/* Apply a separate pop animation after the symbol appears */}
                            <motion.div
                              initial={{ scale: 1 }}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                duration: 0.3,
                                times: [0, 0.5, 1],
                                ease: "easeInOut",
                                delay: 0.1,
                              }}
                              className={`flex items-center justify-center rounded-full w-14 h-14 ${results[index].color} mb-1`}
                            >
                              {results[index].icon}
                            </motion.div>
                            <span
                              className={`text-xl font-bold ${
                                results[index].color.split(" ")[0]
                              }`}
                            >
                              {results[index].name}
                            </span>
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>

              {/* Score display */}
              <AnimatePresence>
                {!spinning && score !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="text-center mb-8"
                  >
                    <div className="bg-gray-800/80 rounded-lg p-6 border border-gray-700">
                      <h3 className="text-lg text-gray-300 mb-2">
                        Your Tournament Score
                      </h3>
                      <div
                        className={`text-6xl font-bold ${getScoreColor()} mb-2`}
                      >
                        {score}
                      </div>

                      {isSubmitting && (
                        <div className="flex items-center justify-center mt-4">
                          <motion.div
                            className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          <span className="text-blue-400">
                            Recording score on blockchain...
                          </span>
                        </div>
                      )}

                      {isSubmitted && (
                        <div className="text-green-400 flex items-center justify-center mt-4">
                          <svg
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Score successfully recorded!
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spin button */}
              <div className="flex justify-center mb-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={spinReels}
                    disabled={
                      spinning ||
                      !canSpin ||
                      isSubmitting ||
                      isSubmitted ||
                      !isFullyBooked
                    }
                    size="lg"
                    className={cn(
                      "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-200 min-w-[180px]",
                      spinning && "animate-pulse",
                      !isFullyBooked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {spinning ? (
                      <div className="flex items-center justify-center">
                        <motion.div
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Spinning...
                      </div>
                    ) : isSubmitting ? (
                      "Processing..."
                    ) : isSubmitted ? (
                      "Score Submitted"
                    ) : (
                      <div className="flex items-center justify-center">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        SPIN!
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Hint text */}
              {canSpin && !spinning && !isSubmitted && !isSubmitting && (
                <div className="text-center text-gray-400 text-xs animate-pulse">
                  Click to spin and get your tournament score
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Celebration effects */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {/* Fireworks */}
            {Array(20)
              .fill(0)
              .map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [
                      window.innerWidth / 2,
                      Math.random() * window.innerWidth,
                    ],
                    y: [
                      window.innerHeight / 2,
                      Math.random() * window.innerHeight,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 1,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2,
                  }}
                >
                  <span className="text-4xl">
                    {
                      ["🎉", "🎊", "✨", "💰", "🏆"][
                        Math.floor(Math.random() * 5)
                      ]
                    }
                  </span>
                </motion.div>
              ))}

            {/* Glowing halo around the card */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-pink-500/20 to-purple-500/20 blur-2xl"
              animate={{
                opacity: [0.5, 0.8, 0.5],
                rotate: [0, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />

            {/* Confetti */}
            {Array(30)
              .fill(0)
              .map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute top-0 left-0 w-3 h-3"
                  style={{
                    backgroundColor: [
                      "#ff0",
                      "#f0f",
                      "#0ff",
                      "#f00",
                      "#0f0",
                      "#00f",
                    ][Math.floor(Math.random() * 6)],
                  }}
                  initial={{
                    x: window.innerWidth / 2,
                    y: -20,
                  }}
                  animate={{
                    x: [
                      window.innerWidth / 2,
                      window.innerWidth / 2 + (Math.random() * 200 - 100),
                    ],
                    y: [0, window.innerHeight + 20],
                    rotate: [0, Math.random() * 360],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpinGame;
