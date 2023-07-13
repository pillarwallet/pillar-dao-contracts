const { ethers, waffle, network } = require('hardhat');
const chai = require('chai');
const { expect } = require('chai');
const { smock } = require('@defi-wonderland/smock');
chai.use(smock.matchers);

const token = require('./abi/token.json');

const stakingAmount = ethers.utils.parseEther('10000');

describe('PillarDAO', () => {
  let pillarDAO;
  let membershipNFT;
  let plrToken;

  let owner;
  let vault;

  let addr1;
  let addr2;
  let addr3;

  /* create named accounts for contract roles */

  before(async () => {
    /* before tests */
    [owner, addr1, addr2, addr3, vault] = await ethers.getSigners();

    // creating a fake PLR token
    plrToken = await smock.fake(token);
    plrToken.name.returns('Pillar Token');
    plrToken.symbol.returns('PLR');
    plrToken.totalSupply.returns(ethers.utils.parseEther('800000000'));
    plrToken.balanceOf
      .whenCalledWith(owner)
      .returns(ethers.utils.parseEther('50000000'));
    plrToken.balanceOf
      .whenCalledWith(addr1)
      .returns(ethers.utils.parseEther('10000'));
    plrToken.allowance.returns(stakingAmount);
    plrToken.transferFrom.returns(true);
    plrToken.transfer.returns(true);

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
      plrToken.address,
      stakingAmount,
      membershipNFT.address
    );
    await pillarDAO.deployed();
    await membershipNFT.setVaultAddress(pillarDAO.address);
    await pillarDAO.setMembershipURI(
      'ipfs://QmPSdB5ieVnPdmsj68ksAWV3ZmrLjr8ESLNVq6NpG8MsYg/'
    );
  });

  it('Deploys without errors', async () => {
    const stakeAmt = await pillarDAO.stakingAmount();
    expect(stakeAmt).to.equal(stakingAmount);
  });

  it('deposit() with incorrect amount not allowed', async () => {
    const stakeAmt = ethers.utils.parseEther('10');
    const tran = pillarDAO.connect(addr1).deposit(stakeAmt);
    await expect(tran).to.revertedWith('PillarDAO:: invalid staked amount');
  });

  it('deposit()', async () => {
    const tran = await pillarDAO.deposit(stakingAmount);
    const ret = await tran.wait();
    expect(ret.events.length).to.greaterThan(0);
  });

  it('deposit() multiple times not allowed', async () => {
    const tran = pillarDAO.deposit(stakingAmount);
    await expect(tran).to.revertedWith('PillarDAO:: user is already a member');
  });

  it('membershipId()', async () => {
    const membershipId = await pillarDAO.membershipId(owner.address);
    expect(membershipId).to.equal(1);
  });

  it('canUnstake()', async () => {
    const ret = await pillarDAO.canUnstake(owner.address);
    expect(ret).to.equal(false);
  });

  it('withdraw() fails when not member', async () => {
    const tran = pillarDAO.connect(addr1).withdraw();
    await expect(tran).to.revertedWith(
      'PillarDAO:: insufficient balance to withdraw'
    );
  });

  it('withdraw() fails when tried early', async () => {
    const tran = pillarDAO.withdraw();
    await expect(tran).to.revertedWith('PillarDAO:: too early to withdraw');
  });

  it('configuration functions can be called only by owner', async () => {
    const txn1 = pillarDAO.connect(addr2).setMembershipURI('test');
    const txn2 = pillarDAO.connect(addr2).withdrawToOwner();
    await expect(txn1).to.revertedWith('Ownable: caller is not the owner');
    await expect(txn2).to.revertedWith('Ownable: caller is not the owner');
  });

  it('withdraw() after 52 weeks', async () => {
    let now = new Date();
    now.setDate(now.getDate() + 53 * 7);
    const newTimestamp = Math.floor(now.getTime() / 1000);
    await network.provider.send('evm_setNextBlockTimestamp', [newTimestamp]);
    await network.provider.send('evm_mine');
    const tran = await pillarDAO.withdraw();
    const ret = await tran.wait();
    const membershipId = await pillarDAO.membershipId(owner.address);
    expect(ret.events.length).to.gte(0);
    expect(membershipId).to.equal(0);
  });
});
