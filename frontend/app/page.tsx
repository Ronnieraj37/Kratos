"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  CalendarClock,
  TrendingUp,
  CheckCircle,
  Menu,
  UserPlus,
  Trophy,
  Users,
  DollarSign,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import TournamentCard from "../components/TournamentCard";

// Import all the tournament-related hooks
import {
  useOpenTournamentIds,
  useInProgressTournamentIds,
  useCompletedTournamentIds,
  useGetOwner,
  useIsPlayerRegistered,
} from "./contract/getters/useTournament";
import { useAccount, useWriteContract } from "wagmi";
import { TOURNAMENT_MANAGER_ADDRESS } from "./constants";
import { TournamentManagerABI } from "./contract/abi/TournamentManager";
import { baseSepolia } from "viem/chains";

// Define Tournament interface to match contract data
export interface Tournament {
  id: string;
  name: string;
  gameType: string;
  prizePool: number;
  entryFee: number;
  playerCount: number;
  maxPlayers: number;
  startTime: Date;
  status: "upcoming" | "ongoing" | "completed";
  image: string;
}

// Navigation items
const navItems = [
  { id: "home", href: "/", label: "Home", active: true },
  {
    id: "tournaments",
    href: "/tournaments",
    label: "Tournaments",
    active: false,
  },
  {
    id: "leaderboards",
    href: "/leaderboards",
    label: "Leaderboards",
    active: false,
  },
  { id: "about", href: "/about", label: "About", active: false },
];

// Framer Motion Variants
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
    transition: { duration: 0.5 },
  },
};

const tabVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
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
      delay: 1.2,
    },
  },
  hover: {
    scale: 1.1,
    boxShadow: "0px 10px 15px rgba(59, 130, 246, 0.3)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
};

export default function HomePage() {
  // Fetch tournament IDs
  const { tournamentIds: upcomingIds } = useOpenTournamentIds();
  const { tournamentIds: ongoingIds } = useInProgressTournamentIds();
  const { tournamentIds: completedIds } = useCompletedTournamentIds();
  const { owner } = useGetOwner();
  const { address, isConnected } = useAccount();
  const { isRegistered } = useIsPlayerRegistered(address);
  const isOwner = owner === address;
  const { writeContractAsync } = useWriteContract();
  // Combine tournament IDs
  const allTournamentIds = useMemo(() => {
    return [
      ...(upcomingIds || []),
      ...(ongoingIds || []),
      ...(completedIds || []),
    ];
  }, [upcomingIds, ongoingIds, completedIds]);

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);
  const [filteredTournamentIds, setFilteredTournamentIds] = useState<string[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter tournament IDs
  useEffect(() => {
    // Reset loading state when tournament IDs change
    setIsLoading(allTournamentIds.length === 0);

    // Convert BigInt IDs to strings for consistent handling
    const tournamentStringIds = allTournamentIds.map((id) => id.toString());

    // If no filters are applied, show all tournaments
    if (statusFilter === "all" && activeTab === "all" && !searchQuery) {
      setFilteredTournamentIds(tournamentStringIds);
      return;
    }

    // Placeholder for filtering logic (you'll need to implement status and search filtering)
    const filtered = tournamentStringIds.filter((id) => {
      console.log("Filtering for ID:", id);
      return true;
    });

    setFilteredTournamentIds(filtered);
    setIsLoading(false);
  }, [allTournamentIds, searchQuery, statusFilter, activeTab]);

  // Render tournaments
  const renderTournaments = () => {
    if (isLoading) {
      return (
        <motion.div
          className="col-span-full flex justify-center items-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-col items-center">
            <Trophy className="h-12 w-12 text-primary animate-pulse" />
            <p className="mt-4 text-muted-foreground">Loading tournaments...</p>
          </div>
        </motion.div>
      );
    }

    if (filteredTournamentIds.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full text-center py-12"
        >
          <div className="flex flex-col items-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tournaments found</h3>
            <p className="text-muted-foreground max-w-md">
              We could not find any tournaments matching your filters. Try
              adjusting your search criteria.
            </p>
          </div>
        </motion.div>
      );
    }

    return filteredTournamentIds.map((id) => (
      <motion.div key={id} variants={itemVariants}>
        <TournamentCard id={id} />
      </motion.div>
    ));
  };

  const registerUser = async () => {
    try {
      const hash = await writeContractAsync({
        address: TOURNAMENT_MANAGER_ADDRESS,
        abi: TournamentManagerABI,
        functionName: "registerPlayer",
        chain: baseSepolia,
        account: address,
      });
      console.log("Transaction hash:", hash);
    } catch (error) {
      console.log("Error", error);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <header
        className={`sticky top-0 z-10 border-b px-3 backdrop-blur transition-all duration-300 ${
          isScrolled ? "bg-background/95 shadow-sm" : "bg-background"
        }`}
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
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
              {navItems.map((item) => (
                <motion.div
                  key={item.id} // Use item.id as a unique key
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.1 * navItems.indexOf(item),
                  }}
                >
                  <Link
                    href={item.href}
                    className={`text-sm font-medium relative ${
                      item.active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="flex gap-4 flex-wrap justify-center"
              >
                {isOwner && (
                  <Link href="/tournament/create">
                    <Button variant="outline" size="lg" className="gap-1">
                      <Plus size={18} />
                      Create Tournament
                    </Button>
                  </Link>
                )}
                {isConnected &&
                  (isRegistered ? (
                    <Button variant="outline" size="lg" className="gap-1">
                      Registered!
                    </Button>
                  ) : (
                    <Button
                      onClick={registerUser}
                      variant="outline"
                      size="lg"
                      className="gap-1"
                    >
                      <UserPlus size={18} />
                      Register
                    </Button>
                  ))}
              </motion.div>
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
                        key={item.id} // Use item.id as a unique key
                        href={item.href}
                        className={`block py-2 text-base ${
                          item.active
                            ? "text-primary font-medium"
                            : "text-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="mt-auto space-y-2 pt-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="flex gap-4 flex-wrap justify-center"
                    >
                      {isOwner && (
                        <Link href="/tournament/create">
                          <Button variant="outline" size="lg" className="gap-1">
                            <Plus size={18} />
                            Create Tournament
                          </Button>
                        </Link>
                      )}
                      {isConnected &&
                        (isRegistered ? (
                          <Button variant="outline" size="lg" className="gap-1">
                            Registered!
                          </Button>
                        ) : (
                          <Button
                            onClick={registerUser}
                            variant="outline"
                            size="lg"
                            className="gap-1"
                          >
                            <UserPlus size={18} />
                            Register
                          </Button>
                        ))}
                    </motion.div>
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
                <pattern
                  id="pattern-circles"
                  x="0"
                  y="0"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                  patternContentUnits="userSpaceOnUse"
                >
                  <circle
                    id="pattern-circle"
                    cx="10"
                    cy="10"
                    r="1.6257413380501518"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  ></circle>
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="url(#pattern-circles)"
              ></rect>
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
              Join competitive tournaments, showcase your skills, and win
              amazing prizes in your favorite games.
            </motion.p>
          </div>
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
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-background data-[state=active]:shadow"
              >
                All Tournaments
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-background data-[state=active]:shadow"
              >
                <CalendarClock className="h-4 w-4 mr-1" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger
                value="ongoing"
                className="data-[state=active]:bg-background data-[state=active]:shadow"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Live Now
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-background data-[state=active]:shadow"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Tournaments Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + statusFilter + searchQuery}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {renderTournaments()}
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
                delay: 0,
              },
              {
                icon: <Users className="h-10 w-10 text-blue-500" />,
                title: "500,000+",
                desc: "Active Players",
                delay: 0.1,
              },
              {
                icon: <DollarSign className="h-10 w-10 text-green-500" />,
                title: "$2.5M+",
                desc: "Prize Money Awarded",
                delay: 0.2,
              },
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
              <h2 className="text-3xl font-bold mb-4">
                Ready to Show Your Skills?
              </h2>
              <p className="text-muted-foreground mb-6">
                Create your own tournament or join existing ones. Compete with
                players from around the world and win amazing prizes.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button onClick={registerUser} size="lg" className="gap-2">
                    <UserPlus size={18} />
                    Sign Up Now
                  </Button>
                </Link>
                <Link href="/">
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
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary"
                  >
                    Tournament
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    16/16 Players
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block text-sm text-muted-foreground">
                      Prize Pool
                    </span>
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
                TournamentHub is the premier platform for gamers to compete,
                challenge, and conquer. Join our community today!
              </p>
              <div className="flex gap-4">
                {[
                  {
                    id: "twitter",
                    name: "Twitter",
                    url: "https://twitter.com",
                  },
                  {
                    id: "discord",
                    name: "Discord",
                    url: "https://discord.com",
                  },
                  { id: "twitch", name: "Twitch", url: "https://twitch.tv" },
                  {
                    id: "youtube",
                    name: "YouTube",
                    url: "https://youtube.com",
                  },
                ].map((platform) => (
                  <a
                    key={platform.id}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <span className="sr-only">{platform.name}</span>
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {[
                  { id: "home", label: "Home", href: "/" },
                  {
                    id: "tournaments",
                    label: "Tournaments",
                    href: "/tournaments",
                  },
                  {
                    id: "leaderboards",
                    label: "Leaderboards",
                    href: "/leaderboards",
                  },
                  { id: "about", label: "About Us", href: "/about" },
                ].map((link) => (
                  <li key={link.id}>
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
                  { id: "help", label: "Help Center", href: "/help" },
                  {
                    id: "rules",
                    label: "Rules & Guidelines",
                    href: "/rules",
                  },
                  { id: "contact", label: "Contact Us", href: "/contact" },
                  {
                    id: "privacy",
                    label: "Privacy Policy",
                    href: "/privacy",
                  },
                ].map((link) => (
                  <li key={link.id}>
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
                  { label: "Help Center", href: "/help" },
                  { label: "Rules & Guidelines", href: "/rules" },
                  { label: "Contact Us", href: "/contact" },
                  { label: "Privacy Policy", href: "/privacy" },
                ].map((link) => (
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
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
