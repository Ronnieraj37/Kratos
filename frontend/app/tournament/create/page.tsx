'use client';

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  CalendarIcon, 
  Clock, 
  DollarSign, 
  Users, 
  ChevronLeft, 
  Trophy, 
  Wallet,
  Info,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateTournamentPage() {
  const [formData, setFormData] = useState({
    name: "",
    entryFee: "",
    tokenAddress: "0x0000000000000000000000000000000000000000", // Default for ETH
    maxPlayers: "",
    startDate: "",
    startTime: "",
    duration: "2", // Default 2 hours
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [tokenType, setTokenType] = useState("eth");
  
  const durationOptions = [
    { value: "1", label: "1 hour" },
    { value: "2", label: "2 hours" },
    { value: "3", label: "3 hours" },
    { value: "4", label: "4 hours" },
    { value: "6", label: "6 hours" },
    { value: "12", label: "12 hours" },
    { value: "24", label: "24 hours" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTokenTypeChange = (type: string) => {
    setTokenType(type);
    setFormData((prev) => ({
      ...prev,
      tokenAddress: type === "eth" ? "0x0000000000000000000000000000000000000000" : "",
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = "Tournament name is required";
    
    if (!formData.entryFee) {
      newErrors.entryFee = "Entry fee is required";
    } else if (isNaN(Number(formData.entryFee)) || Number(formData.entryFee) < 0) {
      newErrors.entryFee = "Entry fee must be a valid number";
    }
    
    if (!formData.maxPlayers) {
      newErrors.maxPlayers = "Maximum players is required";
    } else if (isNaN(Number(formData.maxPlayers)) || Number(formData.maxPlayers) < 2 || !Number.isInteger(Number(formData.maxPlayers))) {
      newErrors.maxPlayers = "Maximum players must be an integer greater than 1";
    }
    
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    
    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }
    
    if (tokenType === "token" && !formData.tokenAddress) {
      newErrors.tokenAddress = "Token address is required for ERC20 tokens";
    } else if (tokenType === "token" && !/^0x[a-fA-F0-9]{40}$/.test(formData.tokenAddress)) {
      newErrors.tokenAddress = "Invalid ERC20 token address format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Prepare startTime as a Unix timestamp
      const dateObj = new Date(formData.startDate);
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      dateObj.setHours(hours, minutes);
      const startTimestamp = Math.floor(dateObj.getTime() / 1000);
      
      // Prepare data for blockchain
      const tournamentData = {
        name: formData.name,
        entryFee: formData.entryFee,
        tokenAddress: formData.tokenAddress,
        maxPlayers: formData.maxPlayers,
        startTime: startTimestamp,
        duration: parseInt(formData.duration) * 3600, // Convert hours to seconds
      };
      
      console.log("Creating tournament:", tournamentData);
      
      // Simulate API call to blockchain
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
      }, 1500);
    } else {
      console.log("Validation failed", errors);
    }
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-background w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md mx-auto mt-10"
          >
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-3">
                <div className="w-full flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">Tournament Created!</CardTitle>
                <CardDescription className="text-center pt-2">
                  Your tournament has been successfully created and is now live.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">{formData.name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4 text-purple-500" />
                      <span>
                        {new Date(formData.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>{formData.startTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span>{formData.entryFee}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>0/{formData.maxPlayers}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-muted-foreground">
                  Share this tournament with your friends and start accepting registrations!
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Link href={`/tournament/1`} className="w-full">
                  <Button className="w-full">
                    View Tournament
                  </Button>
                </Link>
                <Link href="/" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <header className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center">
          <Link href="/" className="flex items-center">
            <Trophy size={24} className="text-primary mr-2" />
            <span className="text-xl font-bold">TournamentHub</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to home
        </Link>
        
        <div className="flex justify-between items-center mb-6">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold"
          >
            Create Tournament
          </motion.h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Information</CardTitle>
                  <CardDescription>
                    Enter the basic details of your tournament
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="name">
                      Tournament Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter tournament name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxPlayers">
                        Maximum Players <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="maxPlayers"
                          name="maxPlayers"
                          type="number"
                          placeholder="16"
                          min="2"
                          value={formData.maxPlayers}
                          onChange={handleInputChange}
                          className={`pl-10 ${errors.maxPlayers ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.maxPlayers && (
                        <p className="text-red-500 text-xs flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.maxPlayers}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Payment Token</Label>
                      <Select
                        onValueChange={handleTokenTypeChange}
                        defaultValue="eth"
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select token type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eth">ETH</SelectItem>
                          <SelectItem value="usdt">USDT</SelectItem>
                          <SelectItem value="dai">DAI</SelectItem>
                          <SelectItem value="btc">WBTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entryFee">
                        Entry Fee <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="entryFee"
                          name="entryFee"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="25.00"
                          value={formData.entryFee}
                          onChange={handleInputChange}
                          className={`pl-10 ${errors.entryFee ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.entryFee && (
                        <p className="text-red-500 text-xs flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.entryFee}
                        </p>
                      )}
                    </div>
                    
                    {tokenType === "token" && (
                      <div className="space-y-2">
                        <Label htmlFor="tokenAddress">
                          Token Address <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="tokenAddress"
                            name="tokenAddress"
                            placeholder="0x..."
                            value={formData.tokenAddress}
                            onChange={handleInputChange}
                            className={`pl-10 ${errors.tokenAddress ? "border-red-500" : ""}`}
                          />
                        </div>
                        {errors.tokenAddress && (
                          <p className="text-red-500 text-xs flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.tokenAddress}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>
                    Set the date, time, and duration of your tournament
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className={errors.startDate ? "border-red-500" : ""}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-xs flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.startDate}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="startTime">
                        Start Time <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startTime"
                          name="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className={`pl-10 ${errors.startTime ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.startTime && (
                        <p className="text-red-500 text-xs flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.startTime}
                        </p>
                      )}
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="duration">
                      Tournament Duration <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("duration", value)}
                      defaultValue={formData.duration}
                    >
                      <SelectTrigger id="duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                </CardContent>
              </Card>
              
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-end gap-4"
              >
                <Link href="/">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Tournament
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle>Tournament Guidelines</CardTitle>
                <CardDescription>
                  Tips for creating a successful tournament
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "Choose the right player cap",
                    description: "Consider your game and tournament format. 8, 16, 32, or 64 are common sizes for brackets.",
                    icon: <Users className="h-5 w-5 text-blue-500" />,
                  },
                  {
                    title: "Set an appropriate entry fee",
                    description: "Balance accessibility with prize pool. Lower fees attract more participants.",
                    icon: <DollarSign className="h-5 w-5 text-green-500" />,
                  },
                  {
                    title: "Schedule strategically",
                    description: "Choose dates/times when your target players are likely to be available.",
                    icon: <Clock className="h-5 w-5 text-purple-500" />,
                  },
                  {
                    title: "Provide clear information",
                    description: "Players need to know what to expect regarding format, rules, and prize distribution.",
                    icon: <Info className="h-5 w-5 text-orange-500" />,
                  },
                ].map((tip, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="flex items-start gap-3"
                  >
                    <div className="bg-muted rounded-full p-2 mt-0.5">
                      {tip.icon}
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tip.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6"
              >
                <h3 className="font-semibold mb-3 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-primary" />
                  Prize Pool Distribution
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Default prize distribution for your tournament:
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 p-1 rounded-full mr-2">
                        <Trophy className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span className="text-sm font-medium">1st Place</span>
                    </div>
                    <span className="font-semibold">50%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-1 rounded-full mr-2">
                        <Trophy className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">2nd Place</span>
                    </div>
                    <span className="font-semibold">30%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-amber-100 p-1 rounded-full mr-2">
                        <Trophy className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium">3rd Place</span>
                    </div>
                    <span className="font-semibold">20%</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-4">
                  Prize distribution is based on the smart contract default settings.
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}