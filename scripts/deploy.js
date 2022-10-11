const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy Membership NFT contract
  const name = "Pillar DAO NFT";
  const symbol = "PLR DAO";

  const MembershipNFT = await ethers.getContractFactory("MembershipNFT");
  const membershipNFT = await MembershipNFT.deploy(name, symbol);
  await membershipNFT.deployed();
  console.log("MembershipNFT address:", membershipNFT.address);

  // Wait for 5 block transactions to ensure deployment before verifying
  await membershipNFT.deployTransaction.wait(5);

  // Verify contract on Etherscan
  await hre.run("verify:verify", {
    address: membershipNFT.address,
    contract: "contracts/MembershipNFT.sol:MembershipNFT",
    constructorArguments: [name, symbol],
  });

  // Deploy PillarDAO contract
  const stakingToken = "0x267c85113BAfbBe829918fB4c23135af72c9C472"; // Goerli PLR token
  const stakingAmount = ethers.utils.parseEther("10000");

  const values = [stakingToken, stakingAmount, membershipNFT.address];

  const PillarDAOFactory = await ethers.getContractFactory("PillarDAO");
  const pillarDaoContract = await PillarDAOFactory.deploy(...values);
  await pillarDaoContract.deployed();

  console.log(
    "Deployed to address with values: ",
    pillarDaoContract.address,
    ...values
  );

  // Wait for 5 block transactions to ensure deployment before verifying
  await pillarDaoContract.deployTransaction.wait(5);

  // Verify contract on Etherscan
  await hre.run("verify:verify", {
    address: pillarDaoContract.address,
    contract: "contracts/PillarDAO.sol:PillarDAO",
    constructorArguments: [...values],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
