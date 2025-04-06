// // app/api/submit-score/route.ts
// import { NextResponse } from "next/server";
// import { createWalletClient, http } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { baseSepolia } from "viem/chains";
// import { TournamentManagerABI } from "@/app/contract/abi/TournamentManager";
// import { TOURNAMENT_MANAGER_ADDRESS } from "@/app/constants";

// // Get admin private key from environment variables
// const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
// if (!ADMIN_PRIVATE_KEY) {
//   console.error("ADMIN_PRIVATE_KEY is not defined in environment variables");
// }

// export async function POST(request: Request) {
//   try {
//     // Parse request body
//     const body = await request.json();
//     const { tournamentId, playerAddress, score } = body;

//     // Validate input
//     if (!tournamentId || !playerAddress || score === undefined) {
//       return NextResponse.json(
//         { error: "Missing required parameters" },
//         { status: 400 }
//       );
//     }

//     // Convert to appropriate BigInt values
//     const tournamentIdBigInt = BigInt(tournamentId);
//     const scoreBigInt = BigInt(score);
//     const playerAddressFormatted = playerAddress as `0x${string}`;

//     console.log("tournamentIdBigInt", tournamentIdBigInt);
//     console.log("playerAddressFormatted", playerAddressFormatted);
//     console.log("scoreBigInt", scoreBigInt);
//     if (!ADMIN_PRIVATE_KEY) {
//       return NextResponse.json(
//         { error: "Server configuration error" },
//         { status: 500 }
//       );
//     }

//     // Create account from private key
//     const account = privateKeyToAccount(`0x${ADMIN_PRIVATE_KEY}`);

//     // Create wallet client
//     const walletClient = createWalletClient({
//       account,
//       chain: baseSepolia,
//       transport: http(
//         process.env.NEXT_PUBLIC_INFURA_URL || "https://sepolia.base.org"
//       ),
//     });

//     // Call the contract function to submit score
//     const hash = await walletClient.writeContract({
//       address: TOURNAMENT_MANAGER_ADDRESS,
//       abi: TournamentManagerABI,
//       functionName: "submitScore",
//       args: [tournamentIdBigInt, playerAddressFormatted, scoreBigInt],
//       chain: undefined,
//       account: account.address,
//     });

//     return NextResponse.json({
//       success: true,
//       transactionHash: hash,
//     });
//   } catch (error: unknown) {
//     console.error("Error submitting score:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to submit score",
//         message: error,
//       },
//       { status: 500 }
//     );
//   }
// }

// app/api/submit/route.ts
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { TournamentManagerABI } from "@/app/contract/abi/TournamentManager";
import { TOURNAMENT_MANAGER_ADDRESS } from "@/app/constants";
// Get admin private key from environment variables
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || "";
const NEXT_PUBLIC_INFURA_URL = process.env.NEXT_PUBLIC_INFURA_URL;
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { tournamentId, playerAddress, score } = body;

    // Validate input
    if (!tournamentId || !playerAddress || score === undefined) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create wallet and connect to provider
    const provider = new ethers.JsonRpcProvider(NEXT_PUBLIC_INFURA_URL);
    const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contractInterface = new ethers.Interface(TournamentManagerABI as any);

    // Create contract instance
    const contract = new ethers.Contract(
      TOURNAMENT_MANAGER_ADDRESS,
      contractInterface,
      wallet
    );

    // Submit score
    const tx = await contract.submitScore(tournamentId, playerAddress, score);

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    return NextResponse.json(
      {
        error: "Failed to submit score",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
