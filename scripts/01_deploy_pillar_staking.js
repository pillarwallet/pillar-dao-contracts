const { ethers, hre, run } = require("hardhat");

const main = async () => {
  await run("compile");

  const chainId = hre.network.config.chainId;

  if (chainId == 1) {
    // Constructor parameters
    const stakingToken = "0xe3818504c1B32bF1557b16C238B2E01Fd3149C17"; // (PLR - ethereum mainnet)
    const rewardToken = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // (Wrapped ETH - ethereum mainnet)
    const maxTotalStake = 0; // will default to 7.2m PLR
    const values = [stakingToken, rewardToken, maxTotalStake];
  } else {
    const stakingToken = ""; // add staking token address here
    const rewardToken = ""; // add reward token address here
    const maxTotalStake = 0; // will default to 7.2m PLR
    const values = [stakingToken, rewardToken, maxTotalStake];
  }

  const values = [stakingToken, rewardToken, maxTotalStake];

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
