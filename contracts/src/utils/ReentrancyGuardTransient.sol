// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ReentrancyGuardTransient {
    bool transient locked;
    error ReentrancyAttempt();

    modifier nonReentrant {
        if(locked) revert ReentrancyAttempt(); 

        locked = true;

        _;

        locked = false;
    }
}