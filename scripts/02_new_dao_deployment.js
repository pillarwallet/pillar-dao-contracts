const hre = require('hardhat');
const { ethers, upgrades } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  // // Deploy DummyToken contract
  // const DummyToken = await ethers.getContractFactory('DummyToken');
  // const dummyToken = await upgrades.deployProxy(DummyToken);
  // await dummyToken.waitForDeployment();
  // const dummyTokenAddress = await dummyToken.getAddress();

  // console.log(
  //   'DummyToken - deployed to address with values: ',
  //   dummyTokenAddress
  // );

  // // Verify contract on Etherscan
  // await hre.run('verify:verify', {
  //   address: dummyTokenAddress,
  //   contract: 'contracts/testing_utils/DummyPillarToken.sol:DummyToken',
  //   constructorArguments: [],
  // });

  // Deploy Membership NFT contract
  // const name = 'DummyNFT';
  // const symbol = 'dNFT';

  // const MembershipNFT = await ethers.getContractFactory('MembershipNFT');
  // const membershipNFT = await MembershipNFT.deploy(name, symbol);
  // await membershipNFT.waitForDeployment();
  const memNFTAddr = '0x701971cF9e6abdEc02feC91CAcc49524a77C9c3E';
  // console.log('MembershipNFT address:', memNFTAddr);

  // // Verify contract on Etherscan
  // await hre.run('verify:verify', {
  //   address: memNFTAddr,
  //   contract: 'contracts/MembershipNFT.sol:MembershipNFT',
  //   constructorArguments: [name, symbol],
  // });

  // Deploy PillarDAO contract
  const stakingToken = '0x27e391cC117BC04F0Cc893187DdCc32f96A51970'; //proxy token address
  const stakingAmount = ethers.parseEther('100');

  const values = [stakingToken, stakingAmount, memNFTAddr];

  // const PillarDAOFactory = await ethers.getContractFactory('PillarDAO');
  // const pillarDaoContract = await PillarDAOFactory.deploy(...values);
  // await pillarDaoContract.waitForDeployment();
  const plrDaoAddr = '0x3BdD8170d7E835fC220922e9D348Ba9676dD562F';

  // console.log('Deployed to address with values: ', plrDaoAddr, ...values);

  // // Verify contract on Etherscan
  // await hre.run('verify:verify', {
  //   address: plrDaoAddr,
  //   contract: 'contracts/PillarDAO.sol:PillarDAO',
  //   constructorArguments: [...values],
  // });

  await membershipNFT.setVaultAddress(plrDaoAddr);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
