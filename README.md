# Kratos

# TournamentHub - Web3 Tournament Platform

## Introduction

TournamentHub is a decentralized tournament platform built on the Base Sepolia blockchain. The platform allows users to create and participate in online tournaments where all tournament data, player registrations, and scores are recorded on the blockchain through smart contracts. The application features an intuitive UI with interactive elements like a score-determining spin wheel and real-time tournament tracking.

## Project Architecture

### Smart Contracts

The platform is powered by three main smart contracts deployed on the Base Sepolia network:

- **Tournament Manager (0xFaA5fc4267A3aeb83357bcedfE6ED38401f69ed1)**: Manages tournament creation, player registrations, score submission, and prize distribution logic. It handles the core tournament lifecycle including registrations, tracking player scores, and distributing prizes to winners.

- **Player Badge (0x27dcB4B68490822Bf0DEf1E45F7C5eE7Ada33C11)**: Implements an NFT-based badge system for players, which can provide benefits like discounted entry fees to tournaments.

- **Mock Token (0x35B4D13e7e33eeeE6AC7054DbDe3597bd4d2b9bb)**: A test ERC-20 token used for entry fees and prize pools, allowing the platform to test token-based tournaments rather than just native ETH.

### Frontend Implementation

The frontend is built with Next.js and features various sections:

1. **Home Page**: Displays upcoming, ongoing, and completed tournaments with filtering options.

2. **Tournament Details Page**: Shows comprehensive information about a specific tournament including:

   - Tournament status (upcoming, ongoing, completed)
   - Prize pool and entry fee information with the correct token symbol
   - Current player count and maximum capacity
   - Start/end times
   - Tournament rules
   - Player leaderboard

3. **Tournament Creation**: Allows authorized users to create new tournaments with customizable parameters.

4. **Interactive Gameplay**:
   - A spin wheel mechanism determines player scores
   - Scores are recorded on-chain through a secure server-side API
   - Tournament winners are automatically determined based on the highest scores

### Key Technical Components

1. **Blockchain Integration**:

   - Uses wagmi and viem libraries for Web3 interactions
   - Implements a secure server-side API for admin functions like score submission
   - Handles wallet connections via RainbowKit

2. **UI/UX Features**:

   - Responsive design with Tailwind CSS and shadcn/ui components
   - Smooth animations with Framer Motion
   - State management for tracking tournament and player status
   - Real-time validation of tournament registration conditions

3. **Security Considerations**:
   - Score submission through authenticated admin API endpoints
   - Client-side validation to prevent unnecessary transactions
   - Proper error handling for blockchain interactions

## Implementation Details

### Tournament Flow

1. **Creation**: Tournaments are created with parameters including entry fee, maximum players, and start time.
2. **Registration**: Players can join tournaments by paying the entry fee before the start time.
3. **Playing**: Once the tournament starts and all slots are filled, players can spin the wheel to determine their score.
4. **Resolution**: After the tournament ends, winners are determined and prizes are distributed automatically.

### Score Submission System

The platform implements a server-side API endpoint that uses an admin wallet to submit player scores to the blockchain. This approach was chosen because:

1. Only the tournament admin should have authority to submit official scores
2. It provides better security than letting players submit their own scores
3. It allows for complex score validation before committing to the blockchain

### Tournament Status Management

The system carefully tracks different tournament states:

- **Upcoming**: Registration is open until the start time or maximum player count is reached
- **Ongoing**: Tournament has started but not yet ended
- **Completed**: Tournament has ended and results are finalized

For each state, the UI displays different options to players: join tournament, play (spin the wheel), or view results.

## Technical Challenges and Solutions

### Challenge: Handling Transaction States

**Solution**: Implemented comprehensive state management for transaction flow, with proper loading, success, and error states to provide feedback to users.

### Challenge: Preventing Infinite Render Loops with Wagmi Hooks

**Solution**: Used refs to control data loading and prevent circular dependencies in state updates. Added proper dependency arrays to useEffect hooks and implemented memoization with useMemo for derived values.

### Challenge: Token Symbol Display

**Solution**: Integrated the useToken hook to fetch token symbols dynamically based on the tournament's token address, with a fallback to "ETH" for native currency tournaments.

### Challenge: Spin Game Score Submission

**Solution**: Created a server-side API endpoint that uses the admin private key to submit scores, avoiding exposure of sensitive keys on the client side while still enabling gameplay.

### Challenge: Tournament Eligibility Validation

**Solution**: Implemented multi-layered validation that checks tournament status, player count, and registration deadlines before allowing certain actions like joining or playing.

## Contract Integration

The frontend interacts with the smart contracts through custom hooks that abstract the complexity of blockchain calls:

- `useTournamentDetails`: Fetches comprehensive details about a specific tournament
- `usePlayerJoinedTournament`: Checks if a player has already joined a tournament
- `useTournamentWinners`: Retrieves the winners of a completed tournament
- `useTournamentParticipants`: Gets the list of participants in a tournament
- `usePlayerScore`: Retrieves a player's score in a specific tournament

These hooks leverage Wagmi's `useReadContract` and `useWriteContract` functions to interact with the blockchain in a React-friendly way.

## User Experience Considerations

1. **Responsive Design**: The interface adapts seamlessly to different screen sizes
2. **Visual Feedback**: Loading states, success animations, and error messages guide users through the tournament journey
3. **Intuitive Navigation**: Clear information architecture helps users find tournaments and understand their status
4. **Interactive Elements**: The spin wheel game provides an engaging way to determine tournament scores
5. **Real-time Updates**: Tournament statuses and player counts update in real-time

## Deployment Information

The application is deployed on Vercel and interacts with contracts on the Base Sepolia testnet. The smart contracts are verified and can be viewed on the Base Sepolia block explorer.

Tournament Manager Address: 0xFaA5fc4267A3aeb83357bcedfE6ED38401f69ed1
Player Badge Address: 0x27dcB4B68490822Bf0DEf1E45F7C5eE7Ada33C11
Mock Token Address: 0x35B4D13e7e33eeeE6AC7054DbDe3597bd4d2b9bb
