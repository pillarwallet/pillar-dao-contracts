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

    event DepositTimestampSet(address member, uint256 timestamp);


    function deposit(uint256 _amount) external;

    function withdraw() external;

    function setDepositTimestamp(address _member, uint256 _timestamp) external;
}
