// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MembershipNFT is ERC721Enumerable, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    string public baseURI;

    address private vaultAddress = address(0);

    uint256 private _tokenIds = 1;

    modifier onlyVault() {
        require(msg.sender == vaultAddress, "MembershipNFT:: not the vault");
        _;
    }

    event Minted(address indexed owner, uint256 indexed tokenId);

    event Burned(address indexed owner, uint256 indexed tokenId);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        vaultAddress = msg.sender;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override onlyVault {
        //disable transfers
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function mint(
        address _to
    ) external onlyVault nonReentrant returns (uint256) {
        uint256 mintIndex = _tokenIds;
        _safeMint(_to, mintIndex);
        ++_tokenIds;
        emit Minted(_to, mintIndex);
        return mintIndex;
    }

    function burn(uint256 _tokenId) external onlyVault {
        address owner = ownerOf(_tokenId);
        _burn(_tokenId);
        emit Burned(owner, _tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory _newBaseURI) external onlyVault {
        baseURI = _newBaseURI;
    }

    function withdrawToVault() external onlyVault {
        require(
            vaultAddress != address(0),
            "MembershipNFT:: vault address not set"
        );

        uint256 contractBalance = address(this).balance;
        payable(vaultAddress).transfer(contractBalance);
    }

    function withdrawTokenToVault(address _token) external onlyVault {
        require(_token != address(0), "MembershipNFT:: invalid token address");

        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));

        if (balance > 0) {
            token.safeTransfer(vaultAddress, balance);
        }
    }

    function setVaultAddress(address _newVaultAddress) external onlyOwner {
        vaultAddress = _newVaultAddress;
    }

    function getVaultAddress() external view returns (address) {
        return vaultAddress;
    }
}
