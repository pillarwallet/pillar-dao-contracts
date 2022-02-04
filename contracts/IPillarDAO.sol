pragma solidity ^0.8.0;

interface IPillarDAO {
    event DepositEvent (
        address indexed depositAddress,
        uint indexed membershipId
    );

    event WithdrawEvent (
        address indexed withdrawAddress,
        uint indexed membershipId
    );

    function deposit(uint amount) external;

    function withdraw() external;
}