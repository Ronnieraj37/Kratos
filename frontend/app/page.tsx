'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  CalendarClock, 
  TrendingUp,
  CheckCircle,
  Menu,
  LogIn,
  UserPlus,
  Trophy,
  Users,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import TournamentCard from "../components/TournamentCard";
import Web3Connect from "./helpers/Web3Connect";

interface Tournament {
  id: string;
  name: string;
  game: string;
  prizePool: number;
  entryFee: number;
  playerCount: number;
  maxPlayers: number;
  startDate: string;
  status: "upcoming" | "ongoing" | "completed";
  image: string;
}

// Mock data for tournaments
const mockTournaments: Tournament[] = [
  {
    id: "1",
    name: "Summer Championship",
    game: "Fortnite",
    prizePool: 10000,
    entryFee: 25,
    playerCount: 42,
    maxPlayers: 64,
    startDate: "2023-07-15",
    status: "upcoming",
    image:
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
  },
  {
    id: "2",
    name: "Pro League Season 5",
    game: "League of Legends",
    prizePool: 25000,
    entryFee: 50,
    playerCount: 16,
    maxPlayers: 16,
    startDate: "2023-06-30",
    status: "ongoing",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
  },
  {
    id: "3",
    name: "Battle Royale Cup",
    game: "PUBG",
    prizePool: 5000,
    entryFee: 15,
    playerCount: 86,
    maxPlayers: 100,
    startDate: "2023-08-05",
    status: "upcoming",
    image:
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80",
  },
  {
    id: "4",
    name: "Ultimate Gaming Challenge",
    game: "Call of Duty",
    prizePool: 15000,
    entryFee: 30,
    playerCount: 24,
    maxPlayers: 32,
    startDate: "2023-08-15",
    status: "upcoming",
    image:
      "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&q=80",
  },
  {
    id: "5",
    name: "Apex Masters",
    game: "Apex Legends",
    prizePool: 7500,
    entryFee: 20,
    playerCount: 45,
    maxPlayers: 60,
    startDate: "2023-07-20",
    status: "upcoming",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  },
  {
    id: "6",
    name: "Valorant Showdown",
    game: "Valorant",
    prizePool: 12000,
    entryFee: 35,
    playerCount: 8,
    maxPlayers: 16,
    startDate: "2023-06-25",
    status: "ongoing",
    image:
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
  },
];

const featuredGames = [
  {
    name: "Fortnite", 
    image: "https://images.unsplash.com/photo-1519669556878-63bdad8a1a49?w=800&q=80",
    players: "2.3M+"
  },
  {
    name: "League of Legends", 
    image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&q=80",
    players: "4.1M+"
  },
  {
    name: "Call of Duty", 
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
    players: "1.8M+"
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredTournaments, setFilteredTournaments] = useState(mockTournaments);
  const [activeTab, setActiveTab] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for the header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter tournaments based on search, game, and status
  useEffect(() => {
    let filtered = mockTournaments;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (tournament) =>
          tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tournament.game.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply game filter
    if (gameFilter !== "all") {
      filtered = filtered.filter(
        (tournament) => tournament.game.toLowerCase() === gameFilter.toLowerCase()
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (tournament) => tournament.status === statusFilter
      );
    }

    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(
        (tournament) => tournament.status === activeTab
      );
    }

    setFilteredTournaments(filtered);
  }, [searchQuery, gameFilter, statusFilter, activeTab]);

  const navItems = [
    { href: "/", label: "Home", active: true },
    { href: "/tournaments", label: "Tournaments", active: false },
    { href: "/leaderboards", label: "Leaderboards", active: false },
    { href: "/about", label: "About", active: false },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
  };

  const floatingButtonVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 1.2 
      } 
    },
    hover: { 
      scale: 1.1,
      boxShadow: "0px 10px 15px rgba(59, 130, 246, 0.3)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    }
  };

  return (
    <div className="min-h-screen bg-background w-full ">
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b px-3 backdrop-blur transition-all duration-300 ${isScrolled ? 'bg-background/95 shadow-sm' : 'bg-background'}`}>
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                <Trophy size={24} className="text-primary mr-2" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
              >
                TournamentHub
              </motion.h1>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <Link 
                    href={item.href} 
                    className={`text-sm font-medium relative ${item.active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {item.label}
                    {item.active && (
                      <motion.span 
                        layoutId="navIndicator" 
                        className="absolute bottom-[-14px] left-0 right-0 h-[2px] bg-primary"
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Web3Connect />
            </div>
            
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Menu</h2>
                  </div>
                  
                  <nav className="space-y-4">
                    {navItems.map((item) => (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        className={`block py-2 text-base ${item.active ? 'text-primary font-medium' : 'text-foreground'}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="mt-auto space-y-2 pt-6">
                    <Web3Connect />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-30">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="pattern-circles" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                  <circle id="pattern-circle" cx="10" cy="10" r="1.6257413380501518" fill="none" stroke="currentColor" strokeWidth="1"></circle>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pattern-circles)"></rect>
            </svg>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center text-center space-y-6 py-20">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-3xl leading-tight"
            >
              Compete, Challenge, <span className="text-primary">Conquer</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="max-w-[700px] text-lg text-muted-foreground"
            >
              Join competitive tournaments, showcase your skills, and win amazing
              prizes in your favorite games.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex gap-4 flex-wrap justify-center"
            >
              <Link href="/tournaments">
                <Button size="lg" className="mt-4">
                  Find Tournaments
                </Button>
              </Link>
              <Link href="/tournament/create">
                <Button variant="outline" size="lg" className="mt-4 gap-1">
                  <Plus size={18} />
                  Create Tournament
                </Button>
              </Link>
            </motion.div>
          </div>
          
          {/* Featured Games */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            {featuredGames.map((game, index) => (
              <motion.div 
                key={game.name}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative overflow-hidden rounded-lg w-full sm:w-[calc(33.33%-1rem)] shadow-lg"
              >
                <div className="relative h-32">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10"></div>
                  <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-3 z-20">
                    <h3 className="text-white font-bold">{game.name}</h3>
                    <p className="text-white/80 text-sm">{game.players} Players</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="flex-1 relative">
            <Input
              placeholder="Search tournaments..."
              className="w-full pl-10 pr-4 h-10"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex gap-4 flex-col sm:flex-row">
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                <SelectItem value="fortnite">Fortnite</SelectItem>
                <SelectItem value="league of legends">League of Legends</SelectItem>
                <SelectItem value="pubg">PUBG</SelectItem>
                <SelectItem value="call of duty">Call of Duty</SelectItem>
                <SelectItem value="apex legends">Apex Legends</SelectItem>
                <SelectItem value="valorant">Valorant</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start mb-2 overflow-x-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow">
                All Tournaments
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-background data-[state=active]:shadow">
                <CalendarClock className="h-4 w-4 mr-1" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="data-[state=active]:bg-background data-[state=active]:shadow">
                <TrendingUp className="h-4 w-4 mr-1" />
                Live Now
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-background data-[state=active]:shadow">
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Tournaments Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + gameFilter + statusFilter + searchQuery}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTournaments.length > 0 ? (
              filteredTournaments.map((tournament) => (
                <motion.div key={tournament.id} variants={itemVariants}>
                  <TournamentCard
                    id={tournament.id}
                    name={tournament.name}
                    gameType={tournament.game}
                    prizePool={tournament.prizePool}
                    entryFee={tournament.entryFee}
                    playerCount={tournament.playerCount}
                    maxPlayers={tournament.maxPlayers}
                    startDate={new Date(tournament.startDate)}
                    status={tournament.status}
                    image={tournament.image}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <div className="flex flex-col items-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No tournaments found</h3>
                  <p className="text-muted-foreground max-w-md">
                    We could not find any tournaments matching your filters. Try adjusting your search criteria.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Floating Create Button (Mobile) */}
      <motion.div
        className="fixed right-4 bottom-4 md:hidden z-40"
        variants={floatingButtonVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Link href="/create-tournament">
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
            <Plus size={24} />
          </Button>
        </Link>
      </motion.div>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-2">Why Players Love Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of gamers competing in tournaments across the globe
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Trophy className="h-10 w-10 text-yellow-500" />, 
                title: "10,000+",
                desc: "Tournaments Completed",
                delay: 0
              },
              { 
                icon: <Users className="h-10 w-10 text-blue-500" />, 
                title: "500,000+",
                desc: "Active Players",
                delay: 0.1
              },
              { 
                icon: <DollarSign className="h-10 w-10 text-green-500" />, 
                title: "$2.5M+",
                desc: "Prize Money Awarded",
                delay: 0.2
              }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: stat.delay }}
                viewport={{ once: true }}
                className="flex flex-col items-center p-6 rounded-lg bg-background border shadow-sm"
              >
                <div className="mb-4 p-3 rounded-full bg-primary/10">
                  {stat.icon}
                </div>
                <h3 className="text-2xl font-bold mb-1">{stat.title}</h3>
                <p className="text-muted-foreground">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="max-w-xl"
            >
              <h2 className="text-3xl font-bold mb-4">Ready to Show Your Skills?</h2>
              <p className="text-muted-foreground mb-6">
                Create your own tournament or join existing ones. Compete with players 
                from around the world and win amazing prizes.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    <UserPlus size={18} />
                    Sign Up Now
                  </Button>
                </Link>
                <Link href="/tournaments">
                  <Button variant="outline" size="lg">
                    Browse Tournaments
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="relative w-full max-w-md"
            >
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary to-primary-foreground/20 opacity-75 blur"></div>
              <div className="relative p-6 bg-background rounded-lg shadow-xl">
                <h3 className="text-xl font-bold mb-2">Featured Tournament</h3>
                <div className="mb-4 rounded-md overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80" 
                    alt="Featured Tournament" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <h4 className="font-medium mb-1">Pro League Season 5</h4>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    League of Legends
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    16/16 Players
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block text-sm text-muted-foreground">Prize Pool</span>
                    <span className="font-bold text-lg">$25,000</span>
                  </div>
                  <Link href="/tournament/2">
                    <Button>View Details</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={20} className="text-primary" />
                <h2 className="text-xl font-bold">TournamentHub</h2>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                TournamentHub is the premier platform for gamers to compete, challenge, and conquer 
                in their favorite games. Join our community today!
              </p>
              <div className="flex gap-4">
                {['twitter', 'discord', 'twitch', 'youtube'].map(platform => (
                  <a 
                    key={platform} 
                    href={`https://${platform}.com`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <span className="sr-only">{platform}</span>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Tournaments', href: '/tournaments' },
                  { label: 'Leaderboards', href: '/leaderboards' },
                  { label: 'About Us', href: '/about' }
                ].map(link => (
                  <li key={link.label}>
                    <Link 
                      href={link.href} 
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                {[
                  { label: 'Help Center', href: '/help' },
                  { label: 'Rules & Guidelines', href: '/rules' },
                  { label: 'Contact Us', href: '/contact' },
                  { label: 'Privacy Policy', href: '/privacy' }
                ].map(link => (
                  <li key={link.label}>
                    <Link 
                      href={link.href} 
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TournamentHub. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}