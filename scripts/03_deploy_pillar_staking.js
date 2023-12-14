const { ethers, run } = require('hardhat');

const main = async () => {
  await run('compile');

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  // /* FOR TESTING PURPOSES */

  // Deploy DummyPillarToken contract
  // const DummyPillar = await ethers.getContractFactory('DummyPillarToken');
  // const dummyPillar = await DummyPillar.deploy();
  // await dummyPillar.deployed();
  // const dummyPillarTokenAddress = await dummyPillar.address;

  // console.log(
  //   'DummyPillarToken - deployed to address with values: ',
  //   dummyPillar.address
  // );

  // // Wait for 5 block transactions to ensure deployment before verifying
  // await dummyPillar.deployTransaction.wait(5);

  // // Verify contract on Etherscan
  // await hre.run('verify:verify', {
  //   address: dummyPillar.address,
  //   contract: 'contracts/testing_utils/DummyPillarToken.sol:DummyPillarToken',
  //   constructorArguments: [],
  // });

  // // Deploy DummyWETHToken contract
  // const DummyWETH = await ethers.getContractFactory('DummyWETHToken');
  // const dummyWETH = await DummyWETH.deploy();
  // await dummyWETH.deployed();
  // const dummyWETHTokenAddress = await dummyWETH.address;

  // console.log(
  //   'DummyWETHToken - deployed to address with values: ',
  //   dummyWETH.address
  // );

  // // Wait for 5 block transactions to ensure deployment before verifying
  // await dummyWETH.deployTransaction.wait(5);

  // // Verify contract on Etherscan
  // await hre.run('verify:verify', {
  //   address: dummyWETH.address,
  //   contract: 'contracts/testing_utils/DummyWETHToken.sol:DummyWETHToken',
  //   constructorArguments: [],
  // });

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  const stakingToken = '0xa6b37fC85d870711C56FbcB8afe2f8dB049AE774'; // add staking token address here (PLR - Polygon)
  const rewardToken = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; // add reward token address here (wETH - Polygon)
  const maxTotalStake = 0; // will default to 7.2m PLR

  const values = [stakingToken, rewardToken, maxTotalStake];

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
