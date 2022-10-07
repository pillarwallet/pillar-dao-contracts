const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");
const { smock } = require("@defi-wonderland/smock");
const { expectRevert } = require("@openzeppelin/test-helpers");

describe("PillarStakingContract", () => {
  let plrToken, plrStaking, owner, addr1, addr2, addr3;

  before(async () => {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
  });

  beforeEach(async () => {
    // deploy DummyPillarToken contract
    const PillarToken = await ethers.getContractFactory("DummyPillarToken");
    plrToken = await PillarToken.deploy();

    // deploy PillarStaking contract
    const PillarStaking = await ethers.getContractFactory("PillarStaking");
    plrStaking = await PillarStaking.deploy(plrToken.address);

    //transfer dPLR tokens to accounts
    await plrToken.connect(owner).approve(owner.address, 10000000);
    await plrToken.connect(owner).transfer(addr1.address, 1000000);
    await plrToken.connect(owner).transfer(addr2.address, 1000000);
    await plrToken.connect(owner).approve(plrStaking.address, 10000000);
    await plrToken.connect(addr1).approve(plrStaking.address, 1000000);
    await plrToken.connect(addr2).approve(plrStaking.address, 1000000);
  });

  it("Deploys Pillar Token without errors", async () => {
    const ptName = await plrToken.name();
    const ptSymbol = await plrToken.symbol();
    const ptTotalSupply = await plrToken.totalSupply();
    expect(ptName).to.equal("DummyPillarToken");
    expect(ptSymbol).to.equal("dPLR");
    expect(ptTotalSupply).to.equal(ethers.utils.parseEther("1000000000"));
  });

  it("Deploys Pillar Staking contract without errors", async () => {
    const psTokenAddress = await plrStaking.tokenAddress();
    const psTokenMinStake = await plrStaking.minStake();
    const psTokenMaxStake = await plrStaking.maxStake();
    const psStakingState = await plrStaking.getStakingState();
    expect(psTokenAddress).to.equal(plrToken.address);
    expect(psTokenMinStake).to.equal(10000);
    expect(psTokenMaxStake).to.equal(250000);
    expect(psStakingState).to.equal(0);
  });

  // STAKING //
  it("stake(): Error checks - should trigger contract state (STAKEABLE) check", async () => {
    await expectRevert(
      plrStaking.connect(addr1).stake(9999),
      "OnlyWhenStakeable"
    );
  });

  it("stake(): Error checks - should trigger minimum stake amount check", async () => {
    await plrStaking.connect(owner).setStateStakeable();
    await expectRevert(
      plrStaking.connect(addr1).stake(9999),
      "InvalidMinimumStake(10000)"
    );
  });

  it("stake(): Error checks - should trigger maximum stake amount check", async () => {
    await plrStaking.connect(owner).setStateStakeable();
    await expectRevert(
      plrStaking.connect(addr1).stake(250001),
      "InvalidMaximumStake(250000)"
    );
  });

  it("stake(): Error checks - should trigger maximum personal stake amount check", async () => {
    await plrStaking.connect(owner).setStateStakeable();
    await plrStaking.connect(addr1).stake(240000);
    await expectRevert(
      plrStaking.connect(addr1).stake(10001),
      "StakeWouldBeGreaterThanMax()"
    );
  });

  it("stake(): Error checks - should trigger maximum total stake reached amount check", async () => {
    await plrStaking.connect(owner).setStateStakeable();
    await plrStaking.connect(owner).updateMaxStakeLimit(7199999);
    await plrStaking.connect(owner).stake(7199999);

    await expectRevert(
      plrStaking.connect(addr1).stake(10000),
      "MaximumTotalStakeReached(7200000, 7199999, 1, 10000)"
    );
  });

  it("stake(): Should allow users to stake within specified limits", async () => {
    await plrStaking.connect(owner).setStateStakeable();
    const stakeAmount = 13131;
    const addr1Balance = await plrToken.balanceOf(addr1.address);
    await plrStaking.connect(addr1).stake(stakeAmount);
    expect(await plrStaking.totalStaked()).to.equal(stakeAmount);
    expect(await plrToken.balanceOf(addr1.address)).to.equal(
      addr1Balance - stakeAmount
    );
    expect(await plrToken.balanceOf(plrStaking.address)).to.equal(stakeAmount);
    expect(await plrStaking.getStakedAmountForAccount(addr1.address)).to.equal(
      13131
    );
  });

  // UNSTAKING //
  it("stake(): Error checks - should trigger contract state (READY_FOR_UNSTAKE) check", async () => {
    await plrStaking.connect(owner).setStateStakeable();
    await plrStaking.connect(addr1).stake(10000);
    await expectRevert(
      plrStaking.connect(addr1).unstake(),
      "OnlyWhenReadyForUnstake"
    );
  });

  it("unstake(): Should allow users to unstake their total staked balance", async () => {
    await plrStaking.connect(owner).setStateStakeable();
    const stakeAmount = 13131;
    await plrStaking.connect(addr1).stake(stakeAmount);
    expect(await plrStaking.totalStaked()).to.equal(stakeAmount);
    expect(await plrToken.balanceOf(plrStaking.address)).to.equal(stakeAmount);
    expect(await plrStaking.getStakedAmountForAccount(addr1.address)).to.equal(
      stakeAmount
    );

    await plrStaking.connect(owner).setStateReadyForUnstake();
    await plrStaking.connect(addr1).unstake();
    expect(await plrStaking.totalStaked()).to.equal(0);
    expect(await plrToken.balanceOf(plrStaking.address)).to.equal(0);
    expect(await plrStaking.getStakedAmountForAccount(addr1.address)).to.equal(
      0
    );
  });

  // UPDATING MAX STAKE //

  it("updateMaxStakeLimit(): Error checks - should only allow owner to call", async () => {
    await expectRevert(
      plrStaking.connect(addr1).updateMaxStakeLimit(250001),
      "Ownable: caller is not the owner"
    );
  });

  it("updateMaxStakeLimit(): Should allow decreasing of maximum stake", async () => {
    const currentMaxStake = parseInt(await plrStaking.maxStake());
    await plrStaking.updateMinStakeLimit(0);
    await plrStaking.updateMaxStakeLimit(13);
    const lowerMaxStake = parseInt(await plrStaking.maxStake());
    expect(lowerMaxStake).to.equal(currentMaxStake - 249987);
  });

  it("updateMaxStakeLimit(): Should allow increasing of maximum stake", async () => {
    const currentMaxStake = parseInt(await plrStaking.maxStake());
    await plrStaking.updateMaxStakeLimit(331313);
    const higherMaxStake = parseInt(await plrStaking.maxStake());
    expect(higherMaxStake).to.equal(currentMaxStake + 81313);
  });

  // UPDATING MIN STAKE //

  it("updateMinStakeLimit(): Error checks - should only allow owner to call", async () => {
    await expectRevert(
      plrStaking.connect(addr1).updateMinStakeLimit(5000),
      "Ownable: caller is not the owner"
    );
  });

  it("updateMinStakeLimit(): Should allow decreasing of minimum stake", async () => {
    const currentMinStake = parseInt(await plrStaking.minStake());
    await plrStaking.updateMinStakeLimit(13);
    const lowerMinStake = parseInt(await plrStaking.minStake());
    expect(lowerMinStake).to.equal(currentMinStake - 9987);
  });

  it("updateMinStakeLimit(): Should allow increasing of minimum stake", async () => {
    const currentMinStake = parseInt(await plrStaking.minStake());
    await plrStaking.updateMinStakeLimit(13131);
    const higherMinStake = parseInt(await plrStaking.minStake());
    expect(higherMinStake).to.equal(currentMinStake + 3131);
  });

  // GET USER STAKED BALANCES //

  it("getStakedAmountForAccount(): Should return zero for a user that has not staked", async () => {
    expect(await plrStaking.getStakedAmountForAccount(addr2.address)).to.equal(
      0
    );
  });

  it("getStakedAmountForAccount(): Should return staked amount for a user that has staked", async () => {
    await plrStaking.connect(owner).setStateStakeable();
    await plrStaking.connect(addr1).stake(10000);
    await plrStaking.connect(addr1).stake(15000);
    expect(await plrStaking.getStakedAmountForAccount(addr1.address)).to.equal(
      25000
    );
  });

  // MODIFYING STAKING STATE //

  it("setStateStakeable(): Error checks - should only allow owner to call", async () => {
    await expectRevert(
      plrStaking.connect(addr1).setStateStakeable(),
      "Ownable: caller is not the owner"
    );
  });

  it("setStateStakeable(): Should update staking state from INITIALIZED to STAKEABLE", async () => {
    await plrStaking.connect(owner).setStateStakeable();
    const newState = await plrStaking.getStakingState();
    expect(newState).to.equal(1);
  });

  it("setStateStaked(): Error checks - should only allow owner to call", async () => {
    await expectRevert(
      plrStaking.connect(addr1).setStateStaked(),
      "Ownable: caller is not the owner"
    );
  });

  it("setStateStaked(): Should update staking state from INITIALIZED to STAKED", async () => {
    await plrStaking.connect(owner).setStateStaked();
    const newState = await plrStaking.getStakingState();
    expect(newState).to.equal(2);
  });

  it("setStateReadyForUnstake(): Error checks - should only allow owner to call", async () => {
    await expectRevert(
      plrStaking.connect(addr1).setStateReadyForUnstake(),
      "Ownable: caller is not the owner"
    );
  });

  it("setStateReadyForUnstake(): Should update staking state from INITIALIZED to READY_FOR_UNSTAKE", async () => {
    await plrStaking.connect(owner).setStateReadyForUnstake();
    const newState = await plrStaking.getStakingState();
    expect(newState).to.equal(3);
  });

  it("setStateInitialized(): Error checks - should only allow owner to call", async () => {
    await expectRevert(
      plrStaking.connect(addr1).setStateInitialized(),
      "Ownable: caller is not the owner"
    );
  });

  it("setStateInitialized(): Should set staking state to INITIALIZED", async () => {
    await plrStaking.connect(owner).setStateInitialized();
    const newState = await plrStaking.getStakingState();
    expect(newState).to.equal(0);
  });
});
