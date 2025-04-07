// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {TournamentManager} from "../src/TournamentManager.sol";
import {PlayerBadge} from "../src/TournamentManager.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock token for testing
contract MockToken is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TournamentManagerScript is Script {
    TournamentManager public tournamentManager;
    PlayerBadge public playerBadge;
    MockToken public mockToken;

    function run() public {
        // Start broadcast as deployer
        vm.startBroadcast();

        // Deploy contracts
        playerBadge = new PlayerBadge("Kratos", "KTS", "www.example.com", 20);
        tournamentManager = new TournamentManager(address(playerBadge));
        mockToken = new MockToken();

        // Mint tokens for players
        mockToken.mint(msg.sender, 1000 * 10 ** 18);

        // Create tournaments
        // ETH Tournament
        tournamentManager.createTournament(
            "ETH Tournament #1", 0.01 ether, address(0), 4, block.timestamp + 1 hours, block.timestamp + 2 hours
        );

        // Token Tournament
        tournamentManager.createTournament(
            "Token Tournament #1",
            100 * 10 ** 18,
            address(mockToken),
            6,
            block.timestamp + 2 hours,
            block.timestamp + 3 hours
        );

        // Register and join tournaments as deployer
        tournamentManager.registerPlayer();
        tournamentManager.joinTournament{value: 0.01 ether}(1);
        mockToken.approve(address(tournamentManager), 100 * 10 ** 18);
        tournamentManager.joinTournament(2);

        vm.stopBroadcast();

        // Log contract addresses
        console.log("Tournament Manager Address:", address(tournamentManager));
        console.log("Player Badge Address:", address(playerBadge));
        console.log("Mock Token Address:", address(mockToken));
    }
}

//forge script TournamentManagerScript --rpc-url https://base-sepolia.g.alchemy.com/v2/{api-key-here} --private-key {private-key} --verify --etherscan-api-key [etherscan-key] --broadcast
