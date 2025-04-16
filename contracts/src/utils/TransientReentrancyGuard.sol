// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TransientReentrancyGuard
 * @dev Contract module that helps prevent reentrant calls to a function without using storage
 *
 * Inheriting from `TransientReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * This implementation uses assembly and transient storage (memory) for maximum gas efficiency,
 * with no permanent storage costs.
 */
abstract contract TransientReentrancyGuard {
    error ReentrantCall();

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Uses Yul assembly to manage the lock status in transient storage.
     */
    modifier nonReentrant() {
        assembly {
            // Check if the lock is acquired
            if tload(0) {
                // Revert with ReentrantCall error signature
                mstore(0, 0x9e87fac8) // bytes4(keccak256("ReentrantCall()"))
                revert(0, 4)
            }
            
            // Set the lock
            tstore(0, 1)
        }
        
        _;
        
        assembly {
            // Release the lock
            tstore(0, 0)
        }
    }
}
