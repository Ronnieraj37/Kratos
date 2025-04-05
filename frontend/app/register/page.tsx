'use client';

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Lock,
  CheckCircle,
  ChevronLeft,
  Trophy,
  Eye,
  EyeOff,
  Gamepad2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        setRegistrationComplete(true);
      }, 1500);
    }
  };

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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center">
            <Trophy size={24} className="text-primary mr-2" />
            <span className="text-xl font-bold">TournamentHub</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Left column - promotional content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:w-1/2 text-center lg:text-left"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl font-bold mb-4"
              >
                Join the Ultimate <span className="text-primary">Gaming Community</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-foreground mb-8"
              >
                Create an account to join tournaments, track your progress, and win amazing prizes!
              </motion.p>
              
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {[
                  {
                    icon: <Trophy className="h-8 w-8 text-primary" />,
                    title: "Compete in Tournaments",
                    description: "Join competitive tournaments for all your favorite games."
                  },
                  {
                    icon: <Gamepad2 className="h-8 w-8 text-primary" />,
                    title: "Play with Friends",
                    description: "Create or join teams with your friends and compete together."
                  },
                  {
                    icon: <CheckCircle className="h-8 w-8 text-primary" />,
                    title: "Win Prizes",
                    description: "Climb the leaderboards and win cash prizes and rewards."
                  }
                ].map((feature, index) => (
                  <motion.div 
                    key={index} 
                    variants={itemVariants}
                    className="flex items-start gap-4"
                  >
                    <div className="rounded-full bg-primary/10 p-2">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            
            {/* Right column - registration form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:w-1/2 w-full max-w-md"
            >
              {registrationComplete ? (
                <Card className="w-full border-primary/20 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="w-full flex justify-center mb-4">
                      <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <CardTitle className="text-center text-2xl">Registration Complete!</CardTitle>
                    <CardDescription className="text-center pt-2">
                      Welcome to TournamentHub, {username}!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Your account has been successfully created. You can now log in and start competing in tournaments.
                    </p>
                    <p className="font-medium">
                      A confirmation email has been sent to {email}.
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Link href="/login" className="w-full">
                      <Button className="w-full">
                        Log In to Your Account
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
              ) : (
                <Card className="w-full border-primary/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">Create an Account</CardTitle>
                    <CardDescription>
                      Register to join tournaments and track your progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="email" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="email">Email</TabsTrigger>
                        <TabsTrigger value="social">Social Login</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="email">
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`pl-10 ${errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                              />
                            </div>
                            {errors.username && (
                              <p className="text-red-500 text-xs flex items-center mt-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {errors.username}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`pl-10 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                              />
                            </div>
                            {errors.email && (
                              <p className="text-red-500 text-xs flex items-center mt-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {errors.email}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`pl-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            {errors.password && (
                              <p className="text-red-500 text-xs flex items-center mt-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {errors.password}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Password must be at least 8 characters long
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-4">
                            <Checkbox id="terms" />
                            <Label htmlFor="terms" className="text-sm leading-none">
                              I agree to the{" "}
                              <Link href="/terms" className="text-primary hover:underline">
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                              </Link>
                            </Label>
                          </div>
                          
                          <Button type="submit" className="w-full mt-6" disabled={loading}>
                            {loading ? (
                              <>
                                <motion.div 
                                  animate={{ rotate: 360 }} 
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                                />
                                Creating Account...
                              </>
                            ) : (
                              "Create Account"
                            )}
                          </Button>
                        </form>
                      </TabsContent>
                      
                      <TabsContent value="social">
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground text-center mb-4">
                            Sign up with your social media account
                          </p>
                          
                          {["google", "discord", "twitch", "apple"].map((provider) => (
                            <Button
                              key={provider}
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <div className="bg-muted rounded-full p-1 mr-2">
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/>
                                </svg>
                              </div>
                              Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-center border-t pt-6">
                    <div className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link href="/login" className="text-primary font-medium hover:underline">
                        Log In
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Trophy size={20} className="text-primary" />
            <span className="font-semibold">TournamentHub</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}