// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IPillarDAO {
    event DepositEvent(
        address indexed depositAddress,
        uint256 indexed membershipId
    );

    event WithdrawEvent(
        address indexed withdrawAddress,
        uint256 indexed membershipId
    );

    function deposit(uint256 _amount) external;

    function withdraw() external;
}
