// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {InvalidStakingToken, MaximumTotalStakeReached, InvalidMinimumStake, InvalidMaximumStake, InsufficientBalance, StakeWouldBeGreaterThanMax, InvalidUnstakeAmount, ProposedMaxStakeTooLow, ProposedMinStakeTooHigh, OnlyWhenInitialized, OnlyWhenStakeable, OnlyWhenStaked, OnlyWhenReadyForUnstake} from "./errors/Errors.sol";

contract PillarStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardsToken;
    address[] private _stakeholders;
    mapping(address => uint256) private _stakingBalances;
    mapping(address => uint256) private _rewardBalances;
    uint256 public minStake = 10000e18;
    uint256 public maxStake = 250000e18;
    uint256 public maxTotalStake = 7200000e18;
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

    constructor(address _stakingToken, address _rewardsToken) {
        if (_stakingToken == address(0)) revert InvalidStakingToken();
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
        setStateInitialized();
    }

    function stake(uint256 _amount) external nonReentrant whenStakeable {
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
        if (_amount > maxStake - _stakingBalances[msg.sender])
            revert StakeWouldBeGreaterThanMax();
        IERC20 token = IERC20(stakingToken);
        if (token.balanceOf(msg.sender) < _amount) revert InsufficientBalance();
        totalStaked = totalStaked + _amount;
        _stakingBalances[msg.sender] = _stakingBalances[msg.sender] + _amount;
        token.safeTransferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _amount);
    }

    function unstake() external nonReentrant whenReadyForUnstake {
        IERC20 token = IERC20(stakingToken);
        uint256 stakedBalance = _stakingBalances[msg.sender];
        totalStaked = totalStaked - stakedBalance;
        _stakingBalances[msg.sender] = 0;
        token.safeTransfer(msg.sender, stakedBalance);
        emit Unstaked(msg.sender, stakedBalance);
    }

    function getStakedAmountForAccount(address account)
        external
        view
        returns (uint256 amount)
    {
        return _stakingBalances[account];
    }

    function updateMinStakeLimit(uint256 _amount)
        external
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
        external
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

    function getContractState() public view returns (StakingState) {
        return state;
    }
}
