const hre = require('hardhat');

async function main() {
  const NFT_IMAGE_LINK = ''; // Set NFT image link
  const [deployer] = await ethers.getSigners();
  const stakingToken = '0xa6b37fC85d870711C56FbcB8afe2f8dB049AE774'; // PLR Token Polygon

  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // // Deploy Pillar Token (ONLY FOR TESTING!)
  // const PillarToken = await ethers.getContractFactory('TestToken');
  // const pillarToken = await PillarToken.deploy();
  // await pillarToken.deployed();
  // console.log('PillarToken address:', pillarToken.address);

  // // Wait for 5 block transactions to ensure deployment before verifying
  // await pillarToken.deployTransaction.wait(10);

  // // Verify contract on Etherscan
  // await hre.run('verify:verify', {
  //   address: pillarToken.address,
  //   contract: 'contracts/helpers/TestToken.sol:TestToken',
  // });

  // Deploy PillarDAO contract
  // const stakingToken = pillarToken.address;

  // Deploy Membership NFT contract
  // const name = 'Pillar DAA';
  // const symbol = 'DAA';

  // const MembershipNFT = await ethers.getContractFactory('MembershipNFT');
  // const membershipNFT = await MembershipNFT.deploy(name, symbol);
  // await membershipNFT.deployed();
  // console.log('MembershipNFT address:', membershipNFT.address);

  const stakingAmount = ethers.utils.parseEther('10000');
  // const values = [stakingToken, stakingAmount, membershipNFT.address];
  const values = [
    stakingToken,
    stakingAmount,
    '0xdf092214989eD7f73bAEf99D651E5e721e0e7F11',
  ];

  const PillarDAOFactory = await ethers.getContractFactory('PillarDAO');
  const pillarDaoContract = await PillarDAOFactory.deploy(...values);
  await pillarDaoContract.deployed();

  console.log(
    'Deployed to address with values: ',
    pillarDaoContract.address,
    ...values
  );

  // Set vault address to DAO contract
  await membershipNFT
    .connect(deployer)
    .setVaultAddress(pillarDaoContract.address);
  console.log(`Vault Address set to: ${pillarDaoContract.address}`);

  // // Set MembershipNFT baseURI (has to be from vault address)
  // await pillarDaoContract.connect(deployer).setMembershipURI(NFT_IMAGE_LINK);

  // // Sanity check on MembershipNFT to check baseURI
  // const baseURI = await membershipNFT.baseURI();
  // console.log(`baseURI set to: ${baseURI}`);

  console.log('Starting verification...');
  // Wait for 5 block transactions to ensure deployment before verifying
  await pillarDaoContract.deployTransaction.wait(15);

  // Verify contract on Etherscan
  await hre.run('verify:verify', {
    address: membershipNFT.address,
    contract: 'contracts/MembershipNFT.sol:MembershipNFT',
    constructorArguments: [name, symbol],
  });

  // Verify contract on Etherscan
  await hre.run('verify:verify', {
    address: pillarDaoContract.address,
    contract: 'contracts/PillarDAO.sol:PillarDAO',
    constructorArguments: [...values],
  });

  console.log('Completed verification...');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
