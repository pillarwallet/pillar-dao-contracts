// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {InvalidTokenAddress, MaximumTotalStakeReached, InvalidMinimumStake, InvalidMaximumStake, InsufficientBalance, StakeWouldBeGreaterThanMax, InvalidUnstakeAmount, ProposedMaxStakeTooLow, ProposedMinStakeTooHigh, OnlyWhenInitialized, OnlyWhenStakeable, OnlyWhenStaked, OnlyWhenReadyForUnstake} from "./errors/Errors.sol";

contract PillarStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    address public tokenAddress;
    address public rewardsToken;
    address[] private _stakeholders;
    mapping(address => uint256) private _balances;
    // mapping(address => uint256) private _rewards;

    uint256 public minStake = 10000;
    uint256 public maxStake = 250000;
    uint256 public maxTotalStake = 7200000;
    uint256 public totalStaked;

    enum StakingState {
        INITIALIZED,
        STAKEABLE,
        STAKED,
        READY_FOR_UNSTAKE
    }
    StakingState state;

    // EVENTS //
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    // event RewardPaid(address indexed user, uint256 reward);

    // MODIFIERS //

    modifier whenInitialized() {
        if (state != StakingState.INITIALIZED) revert OnlyWhenInitialized();
        _;
    }

    modifier whenStakeable() {
        if (state != StakingState.STAKEABLE) revert OnlyWhenStakeable();
        _;
    }

    modifier whenStaked() {
        if (state != StakingState.STAKED) revert OnlyWhenStaked();
        _;
    }

    modifier whenReadyForUnstake() {
        if (state != StakingState.READY_FOR_UNSTAKE)
            revert OnlyWhenReadyForUnstake();
        _;
    }

    constructor(address _tokenAddress) {
        if (_tokenAddress == address(0)) revert InvalidTokenAddress();
        tokenAddress = _tokenAddress;
        setStateInitialized();
    }

    function stake(uint256 _amount) external nonReentrant whenStakeable {
        // check amount is within range of min and max stake
        // check amount is within total max stake of contract
        // check amount is within total personal stake limit
        if ((totalStaked + _amount) > maxTotalStake)
            revert MaximumTotalStakeReached({
                totalMaxStake: maxTotalStake,
                currentStakedAmount: totalStaked,
                remainingStakeableAmount: (maxTotalStake - totalStaked),
                stakerAmount: _amount
            });
        if (_amount < minStake)
            revert InvalidMinimumStake({minimumStakeAmount: minStake});
        if (_amount > maxStake)
            revert InvalidMaximumStake({maximumStakeAmount: maxStake});
        if (_amount > maxStake - _balances[msg.sender])
            revert StakeWouldBeGreaterThanMax();

        // check staker has enough tokens
        IERC20 token = IERC20(tokenAddress);
        if (token.balanceOf(msg.sender) < _amount) revert InsufficientBalance();

        // add staked amount to total stake
        totalStaked = totalStaked + _amount;

        // add staked amount to staker balance
        _balances[msg.sender] = _balances[msg.sender] + _amount;

        // transfer tokens to staking contract
        token.safeTransferFrom(msg.sender, address(this), _amount);

        // emit event
        emit Staked(msg.sender, _amount);
    }

    function unstake() external nonReentrant whenReadyForUnstake {
        IERC20 token = IERC20(tokenAddress);
        uint256 stakedBalance = _balances[msg.sender];

        // deduct amount from total staked
        totalStaked = totalStaked - stakedBalance;

        //deduct from stakers staked balance
        _balances[msg.sender] = 0;

        // transfer tokens from contract to staker
        token.safeTransfer(msg.sender, stakedBalance);

        //emit event
        emit Unstaked(msg.sender, stakedBalance);
    }

    function getStakedAmountForAccount(address account)
        external
        view
        returns (uint256 amount)
    {
        return _balances[account];
    }

    function updateMinStakeLimit(uint256 _amount)
        public
        onlyOwner
        whenStakeable
    {
        if (maxStake < _amount)
            revert ProposedMinStakeTooHigh({
                currentMax: maxStake,
                proposedMin: _amount
            });

        minStake = _amount;
    }

    function updateMaxStakeLimit(uint256 _amount)
        public
        onlyOwner
        whenStakeable
    {
        if (minStake > _amount)
            revert ProposedMaxStakeTooLow({
                currentMin: minStake,
                proposedMax: _amount
            });
        maxStake = _amount;
    }

    // STAKING STATES //

    function setStateInitialized() public onlyOwner {
        state = StakingState.INITIALIZED;
    }

    function setStateStakeable() public onlyOwner {
        state = StakingState.STAKEABLE;
    }

    function setStateStaked() public onlyOwner {
        state = StakingState.STAKED;
    }

    function setStateReadyForUnstake() public onlyOwner {
        state = StakingState.READY_FOR_UNSTAKE;
    }

    function getStakingState() public view returns (StakingState) {
        return state;
    }
}
