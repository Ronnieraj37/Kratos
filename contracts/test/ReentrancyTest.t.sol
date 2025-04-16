// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/utils/TransientReentrancyGuard.sol";
import "../src/utils/ReentrancyGuard.sol";

contract TestReentrancyAttacker {
    TestReentrancyImplementation public target;
    bool public attackActive;
    uint256 public attackCount;

    constructor(TestReentrancyImplementation _target) {
        target = _target;
    }

    function attack() external payable {
        attackActive = true;
        attackCount = 0;
        target.protectedFunction();
    }

    receive() external payable {
        if (attackActive && attackCount < 3) {
            attackCount++;
            target.protectedFunction();
        }
    }
}

contract TestReentrancyImplementation is TransientReentrancyGuard {
    uint256 public counter;

    function protectedFunction() external nonReentrant {
        counter += 1;
        
        (bool success,) = msg.sender.call{value: 0}("");
        require(success, "Call failed");
    }

    function normalFunction() external {
        counter += 1;
    }
}

contract StandardReentrancyImplementation is ReentrancyGuard {
    uint256 public counter;

    function protectedFunction() external nonReentrant {
        counter += 1;
        
        (bool success,) = msg.sender.call{value: 0}("");
        require(success, "Call failed");
    }

    function normalFunction() external {
        counter += 1;
    }
}

contract ReentrancyTest is Test {
    TestReentrancyImplementation public testContract;
    StandardReentrancyImplementation public standardContract;
    TestReentrancyAttacker public attacker;
    TestReentrancyAttacker public standardAttacker;

    function setUp() public {
        testContract = new TestReentrancyImplementation();
        standardContract = new StandardReentrancyImplementation();
        attacker = new TestReentrancyAttacker(testContract);
        standardAttacker = new TestReentrancyAttacker(testContract);
    }

    function testNonReentrant() public {
        testContract.protectedFunction();
        assertEq(testContract.counter(), 1);
    }

    function testReentrancyAttack() public {
        vm.expectRevert(TransientReentrancyGuard.ReentrantCall.selector);
        attacker.attack();
    }

    function testGasComparison() public {
        uint256 transientGas = gasleft();
        testContract.protectedFunction();
        uint256 transientGasUsed = transientGas - gasleft();

        uint256 standardGas = gasleft();
        standardContract.protectedFunction();
        uint256 standardGasUsed = standardGas - gasleft();

        console.log("Transient Reentrancy Guard Gas Used:", transientGasUsed);
        console.log("Standard Reentrancy Guard Gas Used:", standardGasUsed);
        console.log("Gas Savings:", standardGasUsed - transientGasUsed);

        assertLt(transientGasUsed, standardGasUsed, "Transient implementation should use less gas");
    }
}
