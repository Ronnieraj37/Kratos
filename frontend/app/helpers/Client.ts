"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient } from "@tanstack/react-query";
import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Agora-Blockchain",
  projectId: "8501447cf73c4e68061f7ed912d6a8ee",
  chains: [baseSepolia],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
});

export const queryClient = new QueryClient();
