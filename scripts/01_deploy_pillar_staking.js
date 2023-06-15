const { ethers, run } = require('hardhat');

const main = async () => {
  await run('compile');

  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // /* FOR TESTING PURPOSES */
  // // Deploy DummyPillarToken contract
  // const DummyPillar = await ethers.getContractFactory("DummyPillarToken");
  // const dummyPillar = await DummyPillar.deploy();
  // await dummyPillar.deployed();
  // const dummyPillarAddress = await dummyPillar.address;

  // console.log(
  //   "DummyPillarToken - deployed to address with values: ",
  //   dummyPillar.address
  // );

  // // Wait for 5 block transactions to ensure deployment before verifying
  // await dummyPillar.deployTransaction.wait(5);

  // // Verify contract on Etherscan
  // await hre.run("verify:verify", {
  //   address: dummyPillar.address,
  //   contract: "contracts/testing_utils/DummyPillarToken.sol:DummyPillarToken",
  //   constructorArguments: [],
  // });

  // // Deploy DummyWETHToken contract
  // const DummyWETH = await ethers.getContractFactory("DummyWETHToken");
  // const dummyWETH = await DummyWETH.deploy();
  // await dummyWETH.deployed();
  // const dummyWETHAddress = await dummyWETH.address;

  // console.log(
  //   "DummyWETHToken - deployed to address with values: ",
  //   dummyWETH.address
  // );

  // // Wait for 5 block transactions to ensure deployment before verifying
  // await dummyWETH.deployTransaction.wait(5);

  // // Verify contract on Etherscan
  // await hre.run("verify:verify", {
  //   address: dummyWETH.address,
  //   contract: "contracts/testing_utils/DummyWETHToken.sol:DummyWETHToken",
  //   constructorArguments: [],
  // });
  // //////////////////////////

  // const stakingToken = "0xb7c5A2edC0c2e13104f0eDc5F237Df766ff134A8"; // add staking token address here (dPLR - Goerli)
  // const rewardToken = "0x18D30e7a8e46C33BDb97E749b82130EBB7967C56"; // add reward token address here (dWETH - Goerli)
  const stakingToken = '0xe3818504c1B32bF1557b16C238B2E01Fd3149C17'; // PLR token mainnet address
  const rewardToken = '0x0DC0f405Fb0a716E9C5A412cD2b6f0698Dc87210'; // FakePLR token mainnet address
  const maxTotalStake = 0; // will default to 7.2m PLR

  const values = [stakingToken, rewardToken, maxTotalStake];

  // Deploy Pillar Staking contract
  const PillarStaking = await ethers.getContractFactory('PStaking');
  const pillarStaking = await PillarStaking.deploy(...values);
  await pillarStaking.deployed();

  console.log(
    'Deployed to address with values: ',
    pillarStaking.address,
    ...values
  );

  // Wait for 5 block transactions to ensure deployment before verifying
  await pillarStaking.deployTransaction.wait(6);

  // Verify contract on Etherscan
  await hre.run('verify:verify', {
    address: pillarStaking.address,
    contract: 'contracts/PillarStaking.sol:PStaking',
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
