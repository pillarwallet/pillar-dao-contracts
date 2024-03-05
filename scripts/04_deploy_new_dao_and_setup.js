const hre = require('hardhat');

async function main() {
  const NFT_IMAGE_LINK = ''; // Set NFT image link
  const [deployer] = await ethers.getSigners();
  const stakingToken = '0xa6b37fC85d870711C56FbcB8afe2f8dB049AE774'; // PLR Token Polygon
  const preExistingMembers = [
    '0x2b9e8c8d9bfB803Fd0E663D6573086Ab8C435098',
    '0xe55b958B9416adB29909d52D3969F519160e63D8',
    '0x4414348B92Af7784394fb12F030DF7e8Fd6A2755',
    '0x65447bC1716b2C8176B9B65FFBc8d882dB6c9766',
    '0xe9EE49F67eD851e80f1f50D0AF850b37B3D198A6',
    '0xfF1ED0c529c3a61f6ef61847Cb4331f42e303696',
    '0xAD1CBFcF53d1F7213D2B6359e8468244e3DE27b2',
    '0xbe5951e8ab38fe6c0fa6fF1fB44ca3059Ee437Fe',
    '0x763AAD3f4C936D94D794451dE89D8e3297091205',
    '0x17D740E35aef96820a232111b0c47430b49bc4A6',
    '0xd91dD0Ac7aBd3d7B0c2594ad3f00999aBA77D73A',
  ];
  const memberDepositTimes = [
    1691684454, 1692039593, 1696258495, 1696338126, 1696355349, 1696544327,
    1698407526, 1706461032, 1707760153, 1709335933, 1709390895,
  ];

  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // Set values for PillarDAO deployment
  const deployedMembershipNFT = '0xFa2d028Ba398C20eE0A7483c00218F91FFEe47c6'; // MembershipNFT Polygon
  const stakingAmount = ethers.utils.parseEther('10000');
  const values = [
    stakingToken,
    stakingAmount,
    deployedMembershipNFT,
    preExistingMembers,
  ];

  // PillarDAO deployment
  const PillarDAOFactory = await ethers.getContractFactory('PillarDAO');
  const pillarDaoContract = await PillarDAOFactory.deploy(...values);
  await pillarDaoContract.deployed();

  console.log(
    'Deployed to address with values: ',
    pillarDaoContract.address,
    ...values
  );

  // connect to MembershipNFT and set vault to owner
  const MembershipNFT = await ethers.getContractFactory('MembershipNFT');
  const membershipNFT = MembershipNFT.attach(deployedMembershipNFT);
  await membershipNFT.connect(deployer).setVaultAddress(deployer.address);

  // mint MembershipNFT to existing members without NFT and swap vault to DAO
  await membershipNFT.mint(preExistingMembers[7]);
  await membershipNFT.mint(preExistingMembers[8]);
  await membershipNFT.mint(preExistingMembers[9]);
  await membershipNFT.mint(preExistingMembers[10]);

  // check minted NFTs
  console.log(
    `${await membershipNFT.ownerOf(8)} should equal ${preExistingMembers[7]}`
  );
  console.log(
    `${await membershipNFT.ownerOf(9)} should equal ${preExistingMembers[8]}`
  );
  console.log(
    `${await membershipNFT.ownerOf(10)} should equal ${preExistingMembers[9]}`
  );
  console.log(
    `${await membershipNFT.ownerOf(11)} should equal ${preExistingMembers[10]}`
  );

  // Set vault address back to DAO contract
  await membershipNFT
    .connect(deployer)
    .setVaultAddress(pillarDaoContract.address);
  console.log(`Vault Address set to: ${pillarDaoContract.address}`);

  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[0], memberDepositTimes[0]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[1], memberDepositTimes[1]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[2], memberDepositTimes[2]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[3], memberDepositTimes[3]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[4], memberDepositTimes[4]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[5], memberDepositTimes[5]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[6], memberDepositTimes[6]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[7], memberDepositTimes[7]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[8], memberDepositTimes[8]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[9], memberDepositTimes[9]);
  await pillarDaoContract
    .connect(deployer)
    .setDepositTimestamp(preExistingMembers[10], memberDepositTimes[10]);

  console.log('Starting verification...');

  // Wait for 5 block transactions to ensure deployment before verifying
  await pillarDaoContract.deployTransaction.wait(15);

  // Verify PillarDAO contract on Etherscan
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
