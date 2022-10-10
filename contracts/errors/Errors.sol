// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

error InvalidStakingToken();
error InvalidMinimumStake(uint256 minimumStakeAmount);
error InvalidMaximumStake(uint256 maximumStakeAmount);
error InsufficientBalance();
error MaximumTotalStakeReached(
    uint256 totalMaxStake,
    uint256 currentStakedAmount,
    uint256 remainingStakeableAmount,
    uint256 stakerAmount
);
error StakeWouldBeGreaterThanMax();
error InvalidUnstakeAmount(uint256 amount);
error ProposedMaxStakeTooLow(uint256 currentMin, uint256 proposedMax);
error ProposedMinStakeTooHigh(uint256 currentMax, uint256 proposedMin);
error OnlyWhenInitialized();
error OnlyWhenStakeable();
error OnlyWhenStaked();
error OnlyWhenReadyForUnstake();
