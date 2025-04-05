// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ReentrancyGuardTransient {
    bool transient locked;

    modifier nonReentrant {
        require(!locked, "Reentrancy attempt");

        locked = true;

        _;

        locked = false;
    }
}