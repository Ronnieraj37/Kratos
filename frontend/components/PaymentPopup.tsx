'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, CheckCircle2, Shield, AlertCircle, DollarSign, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PaymentPopupProps {
  isOpen?: boolean;
  onClose?: () => void;
  onPaymentSuccess?: () => void;
  tournamentName?: string;
  entryFee?: number;
  discount?: number;
  tournamentImage?: string;
  startDate?: Date;
}

const PaymentPopup = ({
  isOpen = true,
  onClose = () => {},
  onPaymentSuccess = () => {},
  tournamentName = "Pro Gaming Championship",
  entryFee = 25.0,
  discount = 0,
  tournamentImage = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
  startDate = new Date(),
}: PaymentPopupProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [cvv, setCvv] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Calculate discounted fee
  const discountedFee = discount > 0 ? entryFee * (1 - discount / 100) : entryFee;
  const saving = entryFee - discountedFee;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!cardNumber.trim() || cardNumber.replace(/\s/g, "").length !== 16) {
      newErrors.cardNumber = "Please enter a valid 16-digit card number";
    }

    if (!cardName.trim()) {
      newErrors.cardName = "Please enter the name on card";
    }

    if (!expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)";
    }

    if (!cvv.trim() || !/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = "Please enter a valid CVV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsProcessing(true);

      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);

        // Trigger success callback after showing success state
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }, 1500);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    setExpiryDate(value);
  };

  const nextStep = () => {
    setCurrentStep(2);
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  // Format start date for display
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Animation variants
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
      opacity: 1
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background rounded-lg">
        <div className="bg-primary text-primary-foreground p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="pattern-hex" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                  <rect width="1" height="1" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pattern-hex)" />
            </svg>
          </div>
          
          <div className="relative">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-bold">
                Tournament Registration
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-primary-foreground/90 mt-2">
              Join <span className="font-medium">{tournamentName}</span> and compete for glory!
            </DialogDescription>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="p-8 flex flex-col items-center justify-center text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </motion.div>
              
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h3 variants={itemVariants} className="text-xl font-semibold mb-2">
                  Payment Successful!
                </motion.h3>
                
                <motion.p variants={itemVariants} className="text-muted-foreground mb-6">
                  You are now registered for the tournament.
                </motion.p>
                
                <motion.div variants={itemVariants} className="bg-muted p-4 rounded-lg mb-6">
                  <p className="text-sm font-medium mb-1">Transaction Details</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tournament: {tournamentName}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Amount: ${discountedFee.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date().toLocaleString()}
                  </p>
                </motion.div>
                
                <motion.p variants={itemVariants} className="text-sm text-muted-foreground animate-pulse">
                  Preparing your tournament experience...
                </motion.p>
              </motion.div>
            </motion.div>
          ) : (
            currentStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6"
              >
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img 
                    src={tournamentImage} 
                    alt={tournamentName}
                    className="w-full h-32 object-cover"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{tournamentName}</h3>
                      <p className="text-muted-foreground text-sm flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> {formattedDate}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary">
                      Spots Available
                    </Badge>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Entry Fee</span>
                      <span className="font-medium">${entryFee.toFixed(2)}</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between items-center mb-2 text-green-600">
                        <span className="text-sm flex items-center">
                          <Badge variant="outline" className="mr-2 text-green-600 border-green-600">
                            {discount}% Off
                          </Badge>
                          Discount
                        </span>
                        <span className="font-medium">-${saving.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span>${discountedFee.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Secure payment processing</span>
                  </div>
                  
                  <Button onClick={nextStep} className="w-full">
                    Continue to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-semibold">Payment Details</h3>
                    <p className="text-muted-foreground text-sm">
                      Tournament: {tournamentName}
                    </p>
                  </div>
                  <div className="text-xl font-bold">${discountedFee.toFixed(2)}</div>
                </div>

                <Separator className="mb-6" />

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                        className="flex flex-col space-y-2"
                      >
                        <motion.div 
                          whileHover={{ y: -2 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          className="flex items-center space-x-2 border rounded-md p-3 hover:border-primary cursor-pointer"
                        >
                          <RadioGroupItem value="credit-card" id="credit-card" />
                          <Label
                            htmlFor="credit-card"
                            className="flex items-center cursor-pointer w-full"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Credit / Debit Card
                          </Label>
                        </motion.div>
                      </RadioGroup>
                    </div>

                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="card-number">Card Number</Label>
                        <div className="relative">
                          <Input
                            id="card-number"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength={19}
                            className={`pl-10 ${errors.cardNumber ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          />
                          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        {errors.cardNumber && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.cardNumber}
                          </p>
                        )}
                      </motion.div>

                      <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="card-name">Name on Card</Label>
                        <Input
                          id="card-name"
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className={errors.cardName ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.cardName && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.cardName}
                          </p>
                        )}
                      </motion.div>

                      <div className="grid grid-cols-2 gap-4">
                        <motion.div variants={itemVariants} className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={handleExpiryDateChange}
                            maxLength={5}
                            className={errors.expiryDate ? "border-red-500 focus-visible:ring-red-500" : ""}
                          />
                          {errors.expiryDate && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.expiryDate}
                            </p>
                          )}
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            type="password"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            maxLength={4}
                            className={errors.cvv ? "border-red-500 focus-visible:ring-red-500" : ""}
                          />
                          {errors.cvv && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.cvv}
                            </p>
                          )}
                        </motion.div>
                      </div>

                      <div className="flex flex-col space-y-2 mt-2">
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={prevStep}
                            className="flex-1"
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 relative overflow-hidden group"
                            disabled={isProcessing}
                          >
                            <span className="relative z-10 flex items-center">
                              {isProcessing ? (
                                <>
                                  <motion.div 
                                    animate={{ rotate: 360 }} 
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                                  />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Pay ${discountedFee.toFixed(2)}
                                </>
                              )}
                            </span>
                            <span className="absolute inset-0 bg-primary-foreground opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                          </Button>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                          <Shield className="h-3 w-3" />
                          <span>Secure payment powered by Stripe</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </form>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

// Add a calendar icon component for the date display
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export default PaymentPopup;