const hre = require('hardhat');

async function main() {
  const NFT_IMAGE_LINK = ''; // Set NFT image link
  const [deployer] = await ethers.getSigners();
  const stakingToken = '0xa6b37fC85d870711C56FbcB8afe2f8dB049AE774'; // PLR Token Polygon
  const preExistingMembers = process.env.PRE_EXISTING_MEMBERS;

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

  // check minted NFTs
  console.log(
    `${await membershipNFT.ownerOf(8)} should equal ${preExistingMembers[7]}`
  );
  console.log(
    `${await membershipNFT.ownerOf(9)} should equal ${preExistingMembers[8]}`
  );

  // Set vault address back to DAO contract
  await membershipNFT
    .connect(deployer)
    .setVaultAddress(pillarDaoContract.address);
  console.log(`Vault Address set to: ${pillarDaoContract.address}`);

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
