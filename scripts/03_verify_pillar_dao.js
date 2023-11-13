const hre = require('hardhat');
const { ethers } = require('hardhat');

async function main() {
  const pillarDAO = '0x7D8107C5000aefaa73b4A31e7B9bDC58D3fdE24b';
  const stakingToken = '0xa6b37fC85d870711C56FbcB8afe2f8dB049AE774'; // PLR Token Polygon
  const stakingAmount = ethers.utils.parseEther('10000');
  const membershipNFT = '0xdf092214989eD7f73bAEf99D651E5e721e0e7F11';
  const values = [stakingToken, stakingAmount, membershipNFT];

  await hre.run('verify:verify', {
    address: pillarDAO,
    contract: 'contracts/PillarDAO.sol:PillarDAO',
    constructorArguments: [...values],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
