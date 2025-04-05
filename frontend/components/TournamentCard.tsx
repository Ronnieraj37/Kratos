'use client';

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Trophy, Users, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TournamentCardProps {
  id: string;
  name: string;
  gameType: string;
  prizePool: number;
  entryFee: number;
  playerCount: number;
  maxPlayers: number;
  startDate: Date;
  status: "upcoming" | "ongoing" | "completed";
  image?: string;
}

const TournamentCard = ({
  id,
  name,
  gameType,
  prizePool,
  entryFee,
  playerCount,
  maxPlayers,
  startDate,
  status,
  image = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
}: TournamentCardProps) => {
  const statusConfig = {
    upcoming: {
      color: "bg-blue-500",
      text: "Upcoming",
      icon: <Clock className="h-3 w-3 mr-1" />
    },
    ongoing: {
      color: "bg-green-500",
      text: "Live Now",
      icon: <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-1" />
    },
    completed: {
      color: "bg-gray-500",
      text: "Completed",
      icon: <span className="h-3 w-3 mr-1" />
    },
  };

  const formattedDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Calculate the fill percentage for the player count
  const fillPercentage = (playerCount / maxPlayers) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2 }
      }}
      className="w-full"
    >
      <Link href={`/tournament/${id}`} className="block h-full">
        <Card className="overflow-hidden h-full border hover:border-primary transition-all duration-300 hover:shadow-lg relative bg-gradient-to-b from-background to-background/95">
          <div className="relative h-40 overflow-hidden">
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute top-3 right-3">
              <Badge
                variant="secondary"
                className={`${statusConfig[status].color} text-white font-semibold flex items-center`}
              >
                {statusConfig[status].icon}
                {statusConfig[status].text}
              </Badge>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-bold text-lg text-white drop-shadow-md line-clamp-1">{name}</h3>
              <Badge variant="outline" className="mt-1 bg-black/30 text-white border-none">
                {gameType}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center justify-center p-2 rounded-md bg-yellow-500/10 border border-yellow-500/30"
              >
                <Trophy size={18} className="text-yellow-500 mb-1" />
                <span className="text-sm font-medium">${prizePool.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Prize Pool</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center justify-center p-2 rounded-md bg-green-500/10 border border-green-500/30"
              >
                <DollarSign size={18} className="text-green-500 mb-1" />
                <span className="text-sm font-medium">${entryFee}</span>
                <span className="text-xs text-muted-foreground">Entry Fee</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center justify-center p-2 rounded-md bg-blue-500/10 border border-blue-500/30"
              >
                <div className="flex items-center mb-1">
                  <Users size={18} className="text-blue-500" />
                </div>
                <span className="text-sm font-medium">{playerCount}/{maxPlayers}</span>
                <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${fillPercentage}%` }}
                  ></div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center justify-center p-2 rounded-md bg-purple-500/10 border border-purple-500/30"
              >
                <CalendarIcon size={18} className="text-purple-500 mb-1" />
                <span className="text-sm font-medium">{formattedDate}</span>
                <span className="text-xs text-muted-foreground">Start Date</span>
              </motion.div>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-2">
            <Button 
              variant="default" 
              className="w-full group relative overflow-hidden"
            >
              <span className="relative z-10">View Tournament</span>
              <span className="absolute inset-0 bg-primary-foreground opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
};

export default TournamentCard;