// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./IPillarDAO.sol";
import "./MembershipNFT.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PillarDAO is IPillarDAO, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address private immutable stakingToken;
    uint256 private immutable stakingTerm = 52 weeks;
    uint256 private immutable stakeAmount;
    MembershipNFT private membershipNFT;

    struct Deposit {
        uint256 depositAmount;
        uint256 depositTime;
    }

    mapping(address => Deposit) private balances;
    mapping(address => uint256) private memberships;

    constructor(
        address _stakingToken,
        uint256 _stakeAmount,
        address _membershipNft,
        address[9] memory _preExistingMembers
    ) {
        require(
            _stakingToken != address(0),
            "PillarDAO:: invalid staking contract"
        );
        require(_stakeAmount > 0, "PillarDAO:: invalid staking amount");
        stakingToken = _stakingToken;
        stakeAmount = _stakeAmount;
        membershipNFT = MembershipNFT(_membershipNft);
        _addExistingMembers(_preExistingMembers);
    }

    function deposit(uint256 _amount) external override nonReentrant {
        require(_amount == stakeAmount, "PillarDAO:: invalid staked amount");
        require(
            memberships[msg.sender] == 0,
            "PillarDAO:: user is already a member"
        );

        IERC20 token = IERC20(stakingToken);
        require(
            token.allowance(msg.sender, address(this)) >= _amount,
            "PillarDAO:: not enough allowance"
        );

        token.safeTransferFrom(msg.sender, address(this), _amount);
        memberships[msg.sender] = membershipNFT.mint(msg.sender);

        emit DepositEvent(msg.sender, memberships[msg.sender]);
        balances[msg.sender] = Deposit({
            depositAmount: _amount,
            depositTime: block.timestamp
        });
    }

    function withdraw() external override nonReentrant {
        require(
            balances[msg.sender].depositAmount > 0,
            "PillarDAO:: insufficient balance to withdraw"
        );
        require(
            (block.timestamp - balances[msg.sender].depositTime) > stakingTerm,
            "PillarDAO:: too early to withdraw"
        );
        require(
            memberships[msg.sender] > 0,
            "PillarDAO:: membership does not exists!"
        );

        IERC20 token = IERC20(stakingToken);
        token.safeTransfer(msg.sender, stakeAmount);
        membershipNFT.burn(memberships[msg.sender]);
        emit WithdrawEvent(msg.sender, memberships[msg.sender]);

        memberships[msg.sender] = 0;
        balances[msg.sender] = Deposit({depositAmount: 0, depositTime: 0});
    }

    function balanceOf(address _to) external view returns (uint256) {
        return balances[_to].depositAmount;
    }

    function membershipId(address _to) external view returns (uint256) {
        return memberships[_to];
    }

    function canUnstake(address _to) external view returns (bool) {
        if ((block.timestamp - balances[_to].depositTime) >= stakingTerm) {
            return true;
        }
        return false;
    }

    function stakingAmount() external view returns (uint256) {
        return stakeAmount;
    }

    function setMembershipURI(string memory _baseURI) external onlyOwner {
        membershipNFT.setBaseURI(_baseURI);
    }

    function withdrawTokenToOwner(address _token) external onlyOwner {
        require(_token != address(0), "PillarDAO:: invalid token address");
        require(
            _token != stakingToken,
            "PillarDAO:: cannot withdraw staking token"
        );

        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));

        if (balance > 0) {
            token.safeTransfer(msg.sender, balance);
        }
    }

    function setMembershipNFT(address _newAddr) external onlyOwner {
        membershipNFT = MembershipNFT(_newAddr);
    }

    function _addExistingMembers(address[9] memory _members) internal {
        // pre-add existing DAO members [9]
        memberships[_members[0]] = 1;
        balances[_members[0]] = Deposit({
            depositAmount: 10000 ether,
            depositTime: block.timestamp
        });
        memberships[_members[1]] = 2;
        balances[_members[1]] = Deposit({
            depositAmount: 10000 ether,
            depositTime: block.timestamp
        });
        memberships[_members[2]] = 3;
        balances[_members[2]] = Deposit({
            depositAmount: 10000 ether,
            depositTime: block.timestamp
        });
        memberships[_members[3]] = 4;
        balances[_members[3]] = Deposit({
            depositAmount: 10000 ether,
            depositTime: block.timestamp
        });
        memberships[_members[4]] = 5;
        balances[_members[4]] = Deposit({
            depositAmount: 10000 ether,
            depositTime: block.timestamp
        });
        memberships[_members[5]] = 6;
        balances[_members[5]] = Deposit({
            depositAmount: 10000 ether,
            depositTime: block.timestamp
        });
        memberships[_members[6]] = 7;
        balances[_members[6]] = Deposit({
            depositAmount: 10000 ether,
            depositTime: block.timestamp
        });
        memberships[_members[7]] = 8;
        balances[_members[7]] = Deposit({
            depositAmount: 10000 ether,
            depositTime: block.timestamp
        });
        memberships[_members[8]] = 9;
        balances[_members[8]] = Deposit({
            depositAmount: 10000 ether,
            depositTime: block.timestamp
        });
    }
}
