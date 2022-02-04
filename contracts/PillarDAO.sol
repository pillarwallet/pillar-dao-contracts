pragma solidity ^0.8.0;

import "./IPillarDAO.sol";
import "./MembershipNFT.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PillarDAO is IPillarDAO, Ownable {
    using SafeMath for uint;
    using SafeERC20 for IERC20;

    address private stakingToken;
    uint private constant stakingTerm = 52 weeks;
    uint private stakeAmount;
    MembershipNFT private membershipNFT;
    string private baseURI = "ipfs://QmPSdB5ieVnPdmsj68ksAWV3ZmrLjr8ESLNVq6NpG8MsYg/";

    struct Deposit {
        uint256 depositAmount;
        uint256 depositTime;
    }

    mapping (address => Deposit) private balances;
    mapping (address => uint256) private memberships;

    constructor(
        address _stakingToken,
        uint _stakeAmount
    ) public {
        require(_stakingToken != address(0), "Invalid staking contract");
        require(_stakeAmount > 0, "Invalid staking amount");
        stakingToken = _stakingToken;
        stakeAmount = _stakeAmount;
        membershipNFT = new MembershipNFT("PillarDAO Membership","PillarDAO",address(this));
        membershipNFT.setBaseURI(baseURI);
    }

    function deposit(uint _amount) override external {
        require(_amount==stakeAmount, "Invalid staked amount");
        require(memberships[msg.sender] == 0,"User is already a member");
        
        IERC20 token = IERC20(stakingToken);
        require(token.allowance(msg.sender, address(this)) >= _amount, "Not enough allowance");
        
        token.safeTransferFrom(msg.sender, address(this), _amount);
        memberships[msg.sender] = membershipNFT.mint(msg.sender);

        emit DepositEvent(msg.sender,memberships[msg.sender]);
        balances[msg.sender] = Deposit({depositAmount: _amount, depositTime: block.timestamp});
    }

    function withdraw() override external {
        require(balances[msg.sender].depositAmount > 0, "Insufficient balance to withdraw");
        require((block.timestamp - balances[msg.sender].depositTime) > 52 weeks, "Too early to withdraw");
        require(memberships[msg.sender] > 0, "Membership does not exists!");

        IERC20 token = IERC20(stakingToken);
        token.safeTransfer(msg.sender,stakeAmount);
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
        if((block.timestamp - balances[_to].depositTime) >= 52 weeks) {
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

    function withdrawToOwner() external onlyOwner {
        uint256 contractBalance = address(this).balance;
        payable(msg.sender).transfer(contractBalance);
    }

    function withdrawTokenToOwner(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_token != stakingToken, "Cannot withdraw staking token");

        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));

        if(balance > 0) {
            token.safeTransfer(msg.sender,balance);
        }
    }    
}