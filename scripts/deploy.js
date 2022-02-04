const { ethers, run } = require('hardhat')

const stakingToken = '0xdd3122831728404a7234e5981677a5fd0a9727fe'; //rinkeby PLR token
const stakingAmount = ethers.utils.parseEther("10000")
const main = async () => {
  await run('compile');

  const values = [
    stakingToken,
    stakingAmount,
  ];

  const PillarDAOFactory = await ethers.getContractFactory('PillarDAO');
  const pillarDaoContract = await PillarDAOFactory.deploy(...values);
  await pillarDaoContract.deployed();

  console.log('Deployed to address with values: ', pillarDaoContract.address, ...values);
}

// Hardhat recommends this pattern to be able to use async/await everywhere and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });