const { ethers, run } = require("hardhat");

const main = async () => {
  await run("compile");

  const stakingToken = "0x267c85113BAfbBe829918fB4c23135af72c9C472"; // add staking token address here (PLR - Goerli)
  const rewardToken = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"; // add reward token address here (WETH - Goerli)
  const stakeToken = ""; // add stkPLR token address here
  const maxTotalStake = 0; // will default to 7.2m PLR

  const values = [stakingToken, rewardToken, stakeToken, maxTotalStake];

  // Deploy Pillar Staking contract
  const PillarStaking = await ethers.getContractFactory("PillarStaking");
  const pillarStaking = await PillarStaking.deploy(...values);
  await pillarStaking.deployed();

  console.log(
    "Deployed to address with values: ",
    pillarStaking.address,
    ...values
  );

  // Wait for 5 block transactions to ensure deployment before verifying
  await pillarStaking.deployTransaction.wait(5);

  // Verify contract on Etherscan
  await hre.run("verify:verify", {
    address: pillarStaking.address,
    contract: "contracts/PillarStaking.sol:PillarStaking",
    constructorArguments: [stakingToken, rewardToken, maxTotalStake],
  });
};

// Hardhat recommends this pattern to be able to use async/await everywhere and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
