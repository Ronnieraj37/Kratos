// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ReentrancyGuard
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * This implementation uses a custom storage slot, using assembly to access it more efficiently.
 */
abstract contract ReentrancyGuard {
    // Slot is unlikely to be used by anything else
    bytes32 private constant _REENTRANCY_GUARD_SLOT = bytes32(uint256(keccak256("reentracyguard.storage.slot")) - 1);

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        bool _status;
        
        // Get status from slot
        assembly {
            _status := sload(_REENTRANCY_GUARD_SLOT)
        }

        // On the first call to nonReentrant, status will be 0
        require(_status == false, "ReentrancyGuard: reentrant call");

        // After this point, we're updating to locked status (1)
        assembly {
            sstore(_REENTRANCY_GUARD_SLOT, true)
        }

        _;

        // Store 0 to release the lock
        assembly {
            sstore(_REENTRANCY_GUARD_SLOT, false)
        }
    }
}
