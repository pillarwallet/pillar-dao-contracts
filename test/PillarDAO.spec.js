const { ethers, network } = require('hardhat');
const { expect } = require('chai');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

const stakingAmount = ethers.utils.parseEther('10000');
const weeks = 53;
const secondsInWeek = 7 * 24 * 60 * 60; // Number of seconds in a week
const secondsIn53Weeks = weeks * secondsInWeek;

describe('PillarDAO', () => {
  let pillarDAO;
  let membershipNFT;
  let pillarToken;

  let owner, vault, addr1, addr2, pm1, pm2, pm3, pm4, pm5, pm6, pm7, pm8, pm9;
  let members;
  /* create named accounts for contract roles */

  beforeEach(async () => {
    /* before tests */
    [owner, vault, addr1, addr2, pm1, pm2, pm3, pm4, pm5, pm6, pm7, pm8, pm9] =
      await ethers.getSigners();
    members = [
      pm1.address,
      pm2.address,
      pm3.address,
      pm4.address,
      pm5.address,
      pm6.address,
      pm7.address,
      pm8.address,
      pm9.address,
    ];

    // Deploy and setup contracts
    const PillarToken = await ethers.getContractFactory('DummyPillarToken');
    pillarToken = await PillarToken.deploy();
    await pillarToken.deployed();

    const MembershipNFTFactory = await ethers.getContractFactory(
      'MembershipNFT'
    );
    membershipNFT = await MembershipNFTFactory.deploy(
      'PillarDAO Membership',
      'PillarDAO'
    );
    await membershipNFT.deployed();

    const DAOFactory = await ethers.getContractFactory('PillarDAO');
    pillarDAO = await DAOFactory.deploy(
      pillarToken.address,
      stakingAmount,
      membershipNFT.address,
      members
    );
    await pillarDAO.deployed();
    await membershipNFT.setVaultAddress(pillarDAO.address);
    await pillarDAO.setMembershipURI(
      'ipfs://QmPSdB5ieVnPdmsj68ksAWV3ZmrLjr8ESLNVq6NpG8MsYg/'
    );
  });

  describe('Deployment', async () => {
    it('Deploys without errors', async () => {
      const stakeAmt = await pillarDAO.stakingAmount();
      expect(stakeAmt).to.equal(stakingAmount);
    });
  });

  describe('Depositing', async () => {
    it('deposit() with incorrect amount not allowed', async () => {
      const stakeAmt = ethers.utils.parseEther('10');
      const tran = pillarDAO.connect(addr1).deposit(stakeAmt);
      await expect(tran).to.revertedWith('PillarDAO:: invalid staked amount');
    });

    it('deposit()', async () => {
      await pillarToken
        .connect(owner)
        .approve(pillarDAO.address, stakingAmount);
      const tran = await pillarDAO.deposit(stakingAmount);
      const ret = await tran.wait();
      expect(ret.events.length).to.greaterThan(0);
    });

    it('deposit() multiple times not allowed', async () => {
      await pillarToken
        .connect(owner)
        .approve(pillarDAO.address, ethers.utils.parseEther('20000'));
      await pillarDAO.deposit(stakingAmount);
      const tran = pillarDAO.deposit(stakingAmount);
      await expect(tran).to.revertedWith(
        'PillarDAO:: user is already a member'
      );
    });
  });

  describe('Checking MembershipNFT ID', async () => {
    it('membershipId()', async () => {
      await pillarToken
        .connect(owner)
        .approve(pillarDAO.address, stakingAmount);
      await pillarDAO.deposit(stakingAmount);
      const membershipId = await pillarDAO.membershipId(owner.address);
      expect(membershipId).to.equal(1);
    });
  });

  describe('Checking if user can unstake', async () => {
    it('canUnstake() - should be false for staked member', async () => {
      await pillarToken
        .connect(owner)
        .approve(pillarDAO.address, stakingAmount);
      await pillarDAO.deposit(stakingAmount);
      const ret = await pillarDAO.canUnstake(owner.address);
      expect(ret).to.equal(false);
    });

    it('canUnstake() - should be true for unstaked member', async () => {
      const ret = await pillarDAO.canUnstake(owner.address);
      expect(ret).to.equal(true);
    });
  });

  describe('Withdrawing', async () => {
    it('withdraw() fails when not member', async () => {
      const tran = pillarDAO.connect(addr1).withdraw();
      await expect(tran).to.revertedWith(
        'PillarDAO:: insufficient balance to withdraw'
      );
    });

    it('withdraw() fails when tried early', async () => {
      await pillarToken
        .connect(owner)
        .approve(pillarDAO.address, stakingAmount);
      await pillarDAO.deposit(stakingAmount);
      const tran = pillarDAO.withdraw();
      await expect(tran).to.revertedWith('PillarDAO:: too early to withdraw');
    });

    it('withdraw() after 52 weeks', async () => {
      await pillarToken
        .connect(owner)
        .approve(pillarDAO.address, stakingAmount);
      await pillarDAO.deposit(stakingAmount);
      await time.increase(secondsIn53Weeks);
      const tran = await pillarDAO.withdraw();
      const ret = await tran.wait();
      const membershipId = await pillarDAO.membershipId(owner.address);
      expect(ret.events.length).to.gte(0);
      expect(membershipId).to.equal(0);
    });
  });

  describe('Contract configurability', async () => {
    it('configuration functions can be called only by owner', async () => {
      const txn1 = pillarDAO.connect(addr2).setMembershipURI('test');
      await expect(txn1).to.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('#withdrawTokenToOwner', async () => {
    it('should withdraw non-staking token contract balance to the owner', async () => {
      const TestToken = await ethers.getContractFactory('TestToken');
      const testToken = await TestToken.deploy();
      await testToken.deployed();
      const ownerStartBalance = await testToken.balanceOf(owner.address);
      await testToken.approve(owner.address, ethers.utils.parseEther('100'));
      await testToken
        .connect(owner)
        .transferFrom(
          owner.address,
          pillarDAO.address,
          ethers.utils.parseEther('1')
        );
      const ownerPreBalance = await testToken.balanceOf(owner.address);
      const daoPreBalance = await testToken.balanceOf(pillarDAO.address);
      await pillarDAO.withdrawTokenToOwner(testToken.address);
      const ownerPostBalance = await testToken.balanceOf(owner.address);
      const daoPostBalance = await testToken.balanceOf(pillarDAO.address);
      expect(ownerStartBalance).gt(ownerPreBalance);
      expect(ownerPostBalance).gt(ownerPreBalance);
      expect(ownerStartBalance).eq(ownerPostBalance);
      expect(daoPreBalance).eq(ethers.utils.parseEther('1'));
      expect(daoPreBalance).gt(daoPostBalance);
      expect(daoPostBalance).eq(0);
    });
  });

  describe('check migration', async () => {
    it('should add pre-existing members', async () => {
      const deposit = ethers.utils.parseEther('10000');
      const totalDeposits = ethers.utils.parseEther('90000');
      // Pre-mint the MembershipNFTs
      await membershipNFT.setVaultAddress(owner.address);
      await membershipNFT.connect(owner).mint(members[0]);
      await membershipNFT.connect(owner).mint(members[1]);
      await membershipNFT.connect(owner).mint(members[2]);
      await membershipNFT.connect(owner).mint(members[3]);
      await membershipNFT.connect(owner).mint(members[4]);
      await membershipNFT.connect(owner).mint(members[5]);
      await membershipNFT.connect(owner).mint(members[6]);
      await membershipNFT.connect(owner).mint(members[7]);
      await membershipNFT.connect(owner).mint(members[8]);
      await membershipNFT.setVaultAddress(pillarDAO.address);
      // Membership ID check
      expect(await pillarDAO.membershipId(members[0])).to.equal(1);
      expect(await pillarDAO.membershipId(members[1])).to.equal(2);
      expect(await pillarDAO.membershipId(members[2])).to.equal(3);
      expect(await pillarDAO.membershipId(members[3])).to.equal(4);
      expect(await pillarDAO.membershipId(members[4])).to.equal(5);
      expect(await pillarDAO.membershipId(members[5])).to.equal(6);
      expect(await pillarDAO.membershipId(members[6])).to.equal(7);
      expect(await pillarDAO.membershipId(members[7])).to.equal(8);
      expect(await pillarDAO.membershipId(members[8])).to.equal(9);
      // Deposited balance check
      expect(await pillarDAO.balanceOf(members[0])).to.equal(deposit);
      expect(await pillarDAO.balanceOf(members[1])).to.equal(deposit);
      expect(await pillarDAO.balanceOf(members[2])).to.equal(deposit);
      expect(await pillarDAO.balanceOf(members[3])).to.equal(deposit);
      expect(await pillarDAO.balanceOf(members[4])).to.equal(deposit);
      expect(await pillarDAO.balanceOf(members[5])).to.equal(deposit);
      expect(await pillarDAO.balanceOf(members[6])).to.equal(deposit);
      expect(await pillarDAO.balanceOf(members[7])).to.equal(deposit);
      expect(await pillarDAO.balanceOf(members[8])).to.equal(deposit);
      // Deposit PLR tokens manually to cover
      await pillarToken.connect(owner).approve(owner.address, totalDeposits);
      await pillarToken
        .connect(owner)
        .transferFrom(owner.address, pillarDAO.address, totalDeposits);
      expect(await pillarToken.balanceOf(pillarDAO.address)).to.equal(
        totalDeposits
      );
      // Check withdrawal
      await time.increase(secondsIn53Weeks);
      // get pre-withdrawal balance
      const pre1 = await pillarToken.balanceOf(members[0]);
      const pre2 = await pillarToken.balanceOf(members[1]);
      const pre3 = await pillarToken.balanceOf(members[2]);
      const pre4 = await pillarToken.balanceOf(members[3]);
      const pre5 = await pillarToken.balanceOf(members[4]);
      const pre6 = await pillarToken.balanceOf(members[5]);
      const pre7 = await pillarToken.balanceOf(members[6]);
      const pre8 = await pillarToken.balanceOf(members[7]);
      const pre9 = await pillarToken.balanceOf(members[8]);
      // approve to burn NFT
      await membershipNFT.connect(pm1).approve(pillarDAO.address, 1);
      await membershipNFT.connect(pm2).approve(pillarDAO.address, 2);
      await membershipNFT.connect(pm3).approve(pillarDAO.address, 3);
      await membershipNFT.connect(pm4).approve(pillarDAO.address, 4);
      await membershipNFT.connect(pm5).approve(pillarDAO.address, 5);
      await membershipNFT.connect(pm6).approve(pillarDAO.address, 6);
      await membershipNFT.connect(pm7).approve(pillarDAO.address, 7);
      await membershipNFT.connect(pm8).approve(pillarDAO.address, 8);
      await membershipNFT.connect(pm9).approve(pillarDAO.address, 9);
      // withdraw
      await pillarDAO.connect(pm1).withdraw();
      await pillarDAO.connect(pm2).withdraw();
      await pillarDAO.connect(pm3).withdraw();
      await pillarDAO.connect(pm4).withdraw();
      await pillarDAO.connect(pm5).withdraw();
      await pillarDAO.connect(pm6).withdraw();
      await pillarDAO.connect(pm7).withdraw();
      await pillarDAO.connect(pm8).withdraw();
      await pillarDAO.connect(pm9).withdraw();
      // get post-withdrawal balance
      const post1 = await pillarToken.balanceOf(members[0]);
      const post2 = await pillarToken.balanceOf(members[1]);
      const post3 = await pillarToken.balanceOf(members[2]);
      const post4 = await pillarToken.balanceOf(members[3]);
      const post5 = await pillarToken.balanceOf(members[4]);
      const post6 = await pillarToken.balanceOf(members[5]);
      const post7 = await pillarToken.balanceOf(members[6]);
      const post8 = await pillarToken.balanceOf(members[7]);
      const post9 = await pillarToken.balanceOf(members[8]);
      // check PillarToken balance increased by stake amount
      expect(pre1 + deposit).to.equal(post1);
      expect(pre2 + deposit).to.equal(post2);
      expect(pre3 + deposit).to.equal(post3);
      expect(pre4 + deposit).to.equal(post4);
      expect(pre5 + deposit).to.equal(post5);
      expect(pre6 + deposit).to.equal(post6);
      expect(pre7 + deposit).to.equal(post7);
      expect(pre8 + deposit).to.equal(post8);
      expect(pre9 + deposit).to.equal(post9);
      // check MembershipNFT id is now 0
      expect(await pillarDAO.membershipId(members[0])).to.equal(0);
      expect(await pillarDAO.membershipId(members[1])).to.equal(0);
      expect(await pillarDAO.membershipId(members[2])).to.equal(0);
      expect(await pillarDAO.membershipId(members[3])).to.equal(0);
      expect(await pillarDAO.membershipId(members[4])).to.equal(0);
      expect(await pillarDAO.membershipId(members[5])).to.equal(0);
      expect(await pillarDAO.membershipId(members[6])).to.equal(0);
      expect(await pillarDAO.membershipId(members[7])).to.equal(0);
      expect(await pillarDAO.membershipId(members[8])).to.equal(0);
    });

    it('should revert if any pre-existing member address is address(0)', async () => {
      const invalidMembers = [
        pm1.address,
        pm2.address,
        ethers.constants.AddressZero,
      ];
      const fact = await ethers.getContractFactory('PillarDAO');
      await expect(
        fact.deploy(
          pillarToken.address,
          stakingAmount,
          membershipNFT.address,
          invalidMembers
        )
      ).to.be.revertedWith('PillarDAO: invalid pre-existing member');
    });
  });

  describe('Viewing and setting deposit timestamp for a member', async () => {
    it('should return the deposit timestamp for a member', async () => {
      const now = await time.latest();
      await pillarToken
        .connect(owner)
        .approve(pillarDAO.address, stakingAmount);
      await pillarDAO.deposit(stakingAmount);
      const depTS = await pillarDAO.viewDepositTimestamp(owner.address);
      const then = await time.latest();
      expect(parseInt(depTS.toString())).to.be.greaterThan(now);
      expect(parseInt(depTS.toString())).to.be.lessThanOrEqual(then);
    });

    it('invalid member', async () => {
      await expect(
        pillarDAO
          .connect(owner)
          .setDepositTimestamp(
            ethers.constants.AddressZero,
            await time.latest()
          )
      ).to.be.revertedWith('PillarDAO: invalid member');
    });

    it('invalid timestamp', async () => {
      await expect(
        pillarDAO.connect(owner).setDepositTimestamp(addr1.address, 0)
      ).to.be.revertedWith('PillarDAO: invalid timestamp');
    });

    it('should set the new timestamp for the member', async () => {
      await pillarToken
        .connect(owner)
        .approve(pillarDAO.address, stakingAmount);
      await pillarDAO.deposit(stakingAmount);
      const initTS = await pillarDAO.viewDepositTimestamp(owner.address);
      await pillarDAO.setDepositTimestamp(owner.address, 100);
      const newTS = await pillarDAO.viewDepositTimestamp(owner.address);
      expect(newTS).lt(initTS);
      expect(newTS).to.equal(100);
    });
  });
});
