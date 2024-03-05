const hre = require('hardhat');
const { ethers } = require('hardhat');

async function main() {
  // Values to be changed
  const pillarDAO = '0xc380f15Db7be87441d0723F19fBb440AEaa734aB';
  const stakingToken = '0xa6b37fC85d870711C56FbcB8afe2f8dB049AE774'; // PLR Token Polygon
  const stakingAmount = ethers.utils.parseEther('10000');
  const membershipNFT = '0xFa2d028Ba398C20eE0A7483c00218F91FFEe47c6';
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

  // PillarDAO constructor arguments
  const values = [
    stakingToken,
    stakingAmount,
    membershipNFT,
    preExistingMembers,
  ];

  console.log('Starting verification...');

  await hre.run('verify:verify', {
    address: pillarDAO,
    contract: 'contracts/PillarDAO.sol:PillarDAO',
    constructorArguments: [...values],
  });

  console.log('Verification completed!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
