// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @title PlayerBadge
 * @dev ERC721 token for player badges that provide tournament fee discounts
 */
contract PlayerBadge is ERC721Enumerable, Ownable {
    // Manual token ID tracker
    uint256 private _nextTokenId = 1;

    // Badge metadata URI
    string private _baseTokenURI;

    // Discount percentage for badge holders (e.g., 20 = 20% discount)
    uint8 public discountPercentage;

    constructor(string memory name, string memory symbol, string memory baseTokenURI, uint8 _discountPercentage)
        ERC721(name, symbol)
        Ownable(msg.sender)
    {
        _baseTokenURI = baseTokenURI;
        discountPercentage = _discountPercentage;
    }

    function mintBadge(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    //TODO: transfer this to facotry contract
    function setDiscountPercentage(uint8 _discountPercentage) external onlyOwner {
        require(_discountPercentage <= 100, "Discount percentage cannot exceed 100");
        discountPercentage = _discountPercentage;
    }
}
