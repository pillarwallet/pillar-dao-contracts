// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPillarStakingToken {
    function mint(address to, uint256 amount) external;

    function burnFrom(address from, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}
