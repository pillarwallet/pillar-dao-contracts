const { ethers, run } = require('hardhat');

const secondsInMinute = 60;
const minutesInHour = 60;
const hoursInDay = 24;
const daysInYear = 365;
const daysInMonthAverage = 30.44;
const secondsInMonth =
  secondsInMinute * minutesInHour * hoursInDay * daysInMonthAverage;
const secondsInYear = secondsInMinute * minutesInHour * hoursInDay * daysInYear;

const main = async () => {
  await run('compile');

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

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

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  const stakingToken = '0x515D2A390C24dB531e209701d907FC0Ee1C7c224'; // add staking token address here (Dummy PLR - Mumbai)
  const rewardToken = '0xA0b3fb93a85A3024130556fA7a685E254744373a'; // add reward token address here (Dummy wETH - Mumbai)
  const minUserStake = ethers.utils.parseEther('10000');
  const maxUserStake = ethers.utils.parseEther('250000');
  const maxTotalStake = 0; // will default to 7.2m PLR
  const stakeablePeriod = secondsInMonth;
  const tokenLockupDuration = secondsInYear;

  const values = [
    stakingToken,
    rewardToken,
    minUserStake,
    maxUserStake,
    maxTotalStake,
    stakeablePeriod,
    tokenLockupDuration,
  ];

  // Deploy Pillar Staking contract
  const PillarStaking = await ethers.getContractFactory('PillarStaking');
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
    contract: 'contracts/PillarStaking.sol:PillarStaking',
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
