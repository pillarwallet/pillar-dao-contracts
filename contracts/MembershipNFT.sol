// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MembershipNFT is ERC721Enumerable, Ownable, ReentrancyGuard {
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
    event UpdatedVaultAddress(
        address indexed oldVaultAddress,
        address indexed newVaultAddress
    );

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        vaultAddress = msg.sender;
    }

    // External/Public

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

    function setBaseURI(string memory _newBaseURI) external onlyVault {
        baseURI = _newBaseURI;
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
        require(
            _newVaultAddress != address(0),
            "MembershipNFT:: invalid vault address"
        );
        emit UpdatedVaultAddress(vaultAddress, _newVaultAddress);
        vaultAddress = _newVaultAddress;
    }

    function getVaultAddress() external view returns (address) {
        return vaultAddress;
    }

    // Internal

    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal virtual override onlyVault {
        //disable transfers
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
