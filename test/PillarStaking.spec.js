const { ethers, network } = require('hardhat');
const { expect } = require('chai');
const { expectRevert } = require('@openzeppelin/test-helpers');
const contract = require('../artifacts/contracts/PillarStakedToken.sol/PillarStakedToken.json');

const oneDay = 60 * 60 * 24;
const oneMonth = 4 * 7 * 24 * 60 * 60;
const oneYearOneWeek = 53 * 7 * 24 * 60 * 60;

describe('PillarStakingContract', () => {
  let wethToken,
    plrToken,
    plrStakedToken,
    plrStaking,
    owner,
    addr1,
    addr2,
    addr3;

  before(async () => {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
  });

  beforeEach(async () => {
    // deploy DummyWETHToken contract
    const WETHToken = await ethers.getContractFactory('DummyWETHToken');
    wethToken = await WETHToken.deploy();

    // deploy DummyPillarToken contract
    const PillarToken = await ethers.getContractFactory('DummyPillarToken');
    plrToken = await PillarToken.deploy();

    // deploy PillarStaking contract
    const PillarStaking = await ethers.getContractFactory('PillarStaking');
    plrStaking = await PillarStaking.deploy(
      plrToken.address,
      wethToken.address,
      0
    );

    // get PillarStakedToken address & attach
    stakeToken = await plrStaking.stakedToken();
    plrStakedToken = new ethers.Contract(stakeToken, contract.abi, owner);

    // transfer dPLR & dWETH tokens to accounts
    await plrToken
      .connect(owner)
      .transfer(addr1.address, ethers.utils.parseEther('1000000'));
    await plrToken
      .connect(owner)
      .transfer(addr2.address, ethers.utils.parseEther('1000000'));
    await plrToken
      .connect(owner)
      .approve(plrStaking.address, ethers.utils.parseEther('10000000'));
    await plrToken
      .connect(addr1)
      .approve(plrStaking.address, ethers.utils.parseEther('1000000'));
    await plrToken
      .connect(addr2)
      .approve(plrStaking.address, ethers.utils.parseEther('1000000'));
    await wethToken
      .connect(owner)
      .approve(plrStaking.address, ethers.utils.parseEther('10000'));
  });

  // DEPLOYMENT //
  describe('Deployment', () => {
    it('Deploys Pillar Token without errors', async () => {
      const ptName = await plrToken.name();
      const ptSymbol = await plrToken.symbol();
      const ptTotalSupply = await plrToken.totalSupply();
      expect(ptName).to.equal('DummyPillarToken');
      expect(ptSymbol).to.equal('dPLR');
      expect(ptTotalSupply).to.equal(ethers.utils.parseEther('1000000000'));
    });

    it('Deploys WETH Token without errors', async () => {
      const wethName = await wethToken.name();
      const wethSymbol = await wethToken.symbol();
      const wethTotalSupply = await wethToken.totalSupply();
      expect(wethName).to.equal('DummyWETHToken');
      expect(wethSymbol).to.equal('dWETH');
      expect(wethTotalSupply).to.equal(ethers.utils.parseEther('1000000000'));
    });

    it('Deploys Pillar Staking contract without errors', async () => {
      const psTokenAddress = await plrStaking.stakingToken();
      const psTokenMinStake = await plrStaking.minStake();
      const psTokenMaxStake = await plrStaking.maxStake();
      const psTokenMaxTotalStake = await plrStaking.maxTotalStake();
      const psStakingState = await plrStaking.getContractState();
      const psStakingToken = await plrStaking.stakingToken();
      const psRewardToken = await plrStaking.rewardToken();
      expect(psTokenAddress).to.equal(plrToken.address);
      expect(psTokenMinStake).to.equal(ethers.utils.parseEther('10000'));
      expect(psTokenMaxStake).to.equal(ethers.utils.parseEther('250000'));
      expect(psTokenMaxTotalStake).to.equal(ethers.utils.parseEther('7200000'));
      expect(psStakingState).to.equal(0);
      expect(psStakingToken).to.equal(plrToken.address);
      expect(psRewardToken).to.equal(wethToken.address);
    });

    it('Deploys Pillar Staked Token from Staking contract without errors', async () => {
      const pStkName = await plrStakedToken.name();
      const pStkSymbol = await plrStakedToken.symbol();
      const adminRole =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      const minterRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes('MINTER_ROLE')
      );
      const isAdmin = await plrStakedToken.hasRole(adminRole, owner.address);
      const isMinter = await plrStakedToken.hasRole(
        minterRole,
        plrStaking.address
      );
      expect(pStkName).to.equal('Staked Pillar');
      expect(pStkSymbol).to.equal('stkPLR');
      expect(isAdmin).to.equal(true);
      expect(isMinter).to.equal(true);
    });
  });

  describe('Staking PLR', () => {
    it('stake(): Should allow users to stake within specified limits', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stakeAmount = '13131000000000000000000'; // 13,131 PLR
      const tx = await plrStaking.connect(addr1).stake(stakeAmount);
      const addr1StakedBalance = await plrStakedToken.balanceOf(addr1.address);
      expect(await plrStaking.totalStaked()).to.equal(stakeAmount);
      expect(await plrToken.balanceOf(plrStaking.address)).to.equal(
        stakeAmount
      );
      expect(
        await plrStaking.getStakedAmountForAccount(addr1.address)
      ).to.equal(stakeAmount);
      expect(addr1StakedBalance).to.equal(stakeAmount);
    });

    it('stake(): Should allow a single user to stake multiple times within specified limits', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR
      const totalStaked = '70000000000000000000000'; // 70,000 PLR
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(addr1).stake(stakeAmount);
      expect(await plrStaking.totalStaked()).to.equal(totalStaked);
      expect(await plrToken.balanceOf(plrStaking.address)).to.equal(
        totalStaked
      );
      expect(
        await plrStaking.getStakedAmountForAccount(addr1.address)
      ).to.equal(totalStaked);
      expect(await plrStakedToken.balanceOf(addr1.address)).to.equal(
        totalStaked
      );
    });
  });

  describe('Unstaking PLR and earning rewards', () => {
    it('unstake(): Should allow a user to unstake their total staked balance and earned rewards (no prior reward calculation)', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR;
      const rewardAmount = '71000000000000000000'; // 71 ETH
      await plrStaking.connect(addr1).stake(stakeAmount);
      expect(await plrStaking.totalStaked()).to.equal(stakeAmount);
      expect(await plrToken.balanceOf(plrStaking.address)).to.equal(
        stakeAmount
      );
      expect(
        await plrStaking.getStakedAmountForAccount(addr1.address)
      ).to.equal(stakeAmount);
      await network.provider.send('evm_increaseTime', [oneMonth]);
      await plrStaking.connect(owner).setStateStaked();
      await network.provider.send('evm_increaseTime', [oneYearOneWeek]);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await plrStaking.connect(owner).depositRewards(rewardAmount);
      await plrStakedToken
        .connect(addr1)
        .approve(plrStaking.address, stakeAmount);
      await plrStaking.connect(addr1).unstake();
      expect(await plrToken.balanceOf(plrStaking.address)).to.equal(0);
      expect(await plrStakedToken.balanceOf(addr1.address)).to.equal(0);
      expect(await wethToken.balanceOf(addr1.address)).to.equal(
        ethers.utils.parseEther('71')
      ); // 100% of reward as only staker
    });

    it('unstake(): Should allow a user to unstake their total staked balance and earned rewards (prior reward calculation)', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR;
      const rewardAmount = '71000000000000000000'; // 71 ETH
      await plrStaking.connect(addr1).stake(stakeAmount);
      expect(await plrStaking.totalStaked()).to.equal(stakeAmount);
      expect(await plrToken.balanceOf(plrStaking.address)).to.equal(
        stakeAmount
      );
      expect(
        await plrStaking.getStakedAmountForAccount(addr1.address)
      ).to.equal(stakeAmount);
      await network.provider.send('evm_increaseTime', [oneMonth]);
      await plrStaking.connect(owner).setStateStaked();
      await network.provider.send('evm_increaseTime', [oneYearOneWeek]);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await plrStaking.connect(owner).depositRewards(rewardAmount);
      await plrStakedToken
        .connect(addr1)
        .approve(plrStaking.address, stakeAmount);
      await plrStaking.connect(addr1).eligibleRewardAmount(addr1.address);
      await plrStaking.connect(addr1).unstake();
      expect(await plrToken.balanceOf(plrStaking.address)).to.equal(0);
      expect(await plrStakedToken.balanceOf(addr1.address)).to.equal(0);
      expect(await wethToken.balanceOf(addr1.address)).to.equal(
        ethers.utils.parseEther('71')
      ); // 100% of reward as only staker
    });

    it('unstake(): Should allow multiple users to unstake their total staked balance and earned rewards', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stakeAmount1 = '10000000000000000000000'; // 10,000 PLR;
      const stakeAmount2 = '20000000000000000000000'; // 20,000 PLR;
      const rewardAmount = '63000000000000000000'; // 63 ETH
      await plrStaking.connect(addr1).stake(stakeAmount1);
      await plrStaking.connect(addr2).stake(stakeAmount2);
      expect(
        await plrStaking.getStakedAmountForAccount(addr1.address)
      ).to.equal(stakeAmount1);
      expect(
        await plrStaking.getStakedAmountForAccount(addr2.address)
      ).to.equal(stakeAmount2);
      expect(await plrStakedToken.balanceOf(addr1.address)).to.equal(
        stakeAmount1
      );
      expect(await plrStakedToken.balanceOf(addr2.address)).to.equal(
        stakeAmount2
      );
      await plrStaking.connect(owner).depositRewards(rewardAmount);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await plrStakedToken
        .connect(addr1)
        .approve(plrStaking.address, stakeAmount1);
      await plrStakedToken
        .connect(addr2)
        .approve(plrStaking.address, stakeAmount2);
      await plrStaking.connect(addr1).unstake();
      const bal = await wethToken.balanceOf(plrStaking.address);
      await plrStaking.connect(addr2).unstake();
      expect(await plrToken.balanceOf(plrStaking.address)).to.equal(0);
      expect(await plrStakedToken.balanceOf(addr1.address)).to.equal(0);
      expect(await plrStakedToken.balanceOf(addr2.address)).to.equal(0);
      expect(await wethToken.balanceOf(addr1.address)).to.equal(
        ethers.utils.parseEther('20.9979')
      );
      expect(await wethToken.balanceOf(addr2.address)).to.equal(
        ethers.utils.parseEther('41.9958')
      );
    });
  });

  describe('Calculating reward allocation', () => {
    it("eligibleRewardAmount(): should calculate a user's reward allocation", async () => {
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR;
      const rewardAmount = '63000000000000000000'; // 63 ETH
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(owner).depositRewards(rewardAmount);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await plrStaking.connect(addr1).eligibleRewardAmount(addr1.address);
      const reward = await plrStaking.getRewardAmountForAccount(addr1.address);
      expect(reward).to.equal(ethers.utils.parseEther('63'));
    });
  });

  describe('Updating max stake limit', () => {
    it('updateMaxStakeLimit(): Should allow decreasing of maximum stake', async () => {
      const minStake = '0'; // 0 PLR
      const newMaxStake = '13000000000000000000'; // 13 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.updateMinStakeLimit(minStake);
      await plrStaking.updateMaxStakeLimit(newMaxStake);
      const lowerMaxStake = await plrStaking.maxStake();
      expect(lowerMaxStake.toString()).to.equal(newMaxStake);
    });

    it('updateMaxStakeLimit(): Should allow increasing of maximum stake', async () => {
      const newMaxStake = '331313000000000000000000'; // 331,313 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.updateMaxStakeLimit(newMaxStake);
      const higherMaxStake = await plrStaking.maxStake();
      expect(higherMaxStake.toString()).to.equal(newMaxStake);
    });
  });

  describe('Updating min stake limit', () => {
    it('updateMinStakeLimit(): Should allow decreasing of minimum stake', async () => {
      const newMinStake = '13000000000000000000'; // 13 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.updateMinStakeLimit(newMinStake);
      const lowerMinStake = await plrStaking.minStake();
      expect(lowerMinStake.toString()).to.equal(newMinStake);
    });

    it('updateMinStakeLimit(): Should allow increasing of minimum stake', async () => {
      const newMinStake = '13131000000000000000000'; // 13,131 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.updateMinStakeLimit(newMinStake);
      const higherMinStake = await plrStaking.minStake();
      expect(higherMinStake.toString()).to.equal(newMinStake);
    });
  });

  describe('Viewing stakeholders', () => {
    it('getStakedAccounts: Should return list of stakeholders', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR;
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(addr2).stake(stakeAmount);
      const stakedAccounts = await plrStaking.getStakedAccounts();
      expect(stakedAccounts[0]).to.equal(addr1.address);
      expect(stakedAccounts[1]).to.equal(addr2.address);
    });
  });

  describe('Viewing staked amount', () => {
    it('getStakedAmountForAccount(): Should return zero for a user that has not staked', async () => {
      expect(
        await plrStaking.getStakedAmountForAccount(addr2.address)
      ).to.equal(0);
    });

    it('getStakedAmountForAccount(): Should return staked amount for a user that has staked', async () => {
      const stake1 = '10000000000000000000000'; // 10,000 PLR
      const stake2 = '15000000000000000000000'; // 15,000 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(stake1);
      await plrStaking.connect(addr1).stake(stake2);
      const totalStaked = await plrStaking.getStakedAmountForAccount(
        addr1.address
      );
      expect(totalStaked.toString()).to.equal('25000000000000000000000');
    });
  });

  describe('Viewing reward amount', () => {
    it('getRewardAmountForAccount(): Should return zero for a user that has not calculated their rewards', async () => {
      await plrStaking.connect(owner).setStateReadyForUnstake();
      expect(
        await plrStaking.getRewardAmountForAccount(addr2.address)
      ).to.equal(0);
    });

    it('getRewardAmountForAccount(): Should return reward amounts for users', async () => {
      const stakeAmount1 = '10000000000000000000000'; // 10,000 PLR;
      const stakeAmount2 = '20000000000000000000000'; // 20,000 PLR;
      const rewardAmount = '63000000000000000000'; // 63 ETH
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(stakeAmount1);
      await plrStaking.connect(addr2).stake(stakeAmount2);
      await plrStaking.connect(owner).depositRewards(rewardAmount);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await plrStaking.connect(addr1).eligibleRewardAmount(addr1.address);
      await plrStaking.connect(addr2).eligibleRewardAmount(addr2.address);
      const reward1 = await plrStaking.getRewardAmountForAccount(addr1.address);
      const reward2 = await plrStaking.getRewardAmountForAccount(addr2.address);
      expect(reward1).to.equal(ethers.utils.parseEther('20.9979'));
      expect(reward2).to.equal(ethers.utils.parseEther('41.9958'));
    });
  });

  describe('Updating/viewing contract state', () => {
    it('setStateStakeable(): Should update staking state from INITIALIZED to STAKEABLE', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const newState = await plrStaking.getContractState();
      expect(newState).to.equal(1);
    });

    it('setStateStaked(): Should update staking state from INITIALIZED to STAKED', async () => {
      await plrStaking.connect(owner).setStateStaked();
      const newState = await plrStaking.getContractState();
      expect(newState).to.equal(2);
    });

    it('setStateReadyForUnstake(): Should update staking state from INITIALIZED to READY_FOR_UNSTAKE', async () => {
      await plrStaking.connect(owner).setStateReadyForUnstake();
      const newState = await plrStaking.getContractState();
      expect(newState).to.equal(3);
    });

    it('setStateInitialized(): Should set staking state to INITIALIZED', async () => {
      await plrStaking.connect(owner).setStateInitialized();
      const newState = await plrStaking.getContractState();
      expect(newState).to.equal(0);
    });

    it('getContractState(): Should be initialized with state: INITIALIZED', async () => {
      const state = await plrStaking.getContractState();
      expect(state).to.equal(0);
    });

    it('getContractState(): Should return current contract state: STAKED', async () => {
      await plrStaking.connect(owner).setStateStaked();
      const state = await plrStaking.getContractState();
      expect(state).to.equal(2);
    });
  });

  describe('Depositing rewards', () => {
    it('depositRewards(): Should allow the contract owner to deposit reward tokens', async () => {
      const rewards = ethers.utils.parseEther('100');
      await plrStaking.connect(owner).depositRewards(rewards);
      const wethBalance = await wethToken.balanceOf(plrStaking.address);
      expect(wethBalance).to.equal(rewards);
    });
  });

  describe('Function permissions', () => {
    it('stkPLR - transfer(): should not let anyone but staking contract transfer stkPLR tokens', async () => {
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR
      await plrStaking.connect(owner).setStateStakeable();
      const tx = await plrStaking.connect(addr1).stake(stakeAmount);
      await tx.wait();
      await expectRevert.unspecified(
        plrStakedToken.connect(addr1).transfer(addr2.address, 1000)
      );
    });

    it('depositRewards(): Error checks - should only allow owner to call', async () => {
      await expectRevert(
        plrStaking
          .connect(addr1)
          .depositRewards(ethers.utils.parseEther('100')),
        'Ownable: caller is not the owner'
      );
    });

    it('setStateInitialized(): Error checks - should only allow owner to call', async () => {
      await expectRevert(
        plrStaking.connect(addr1).setStateInitialized(),
        'Ownable: caller is not the owner'
      );
    });

    it('setStateStakeable(): Error checks - should only allow owner to call', async () => {
      await expectRevert(
        plrStaking.connect(addr1).setStateStakeable(),
        'Ownable: caller is not the owner'
      );
    });

    it('setStateStakeable(): Error checks - should only allow owner to call', async () => {
      await expectRevert(
        plrStaking.connect(addr1).setStateStakeable(),
        'Ownable: caller is not the owner'
      );
    });

    it('setStateReadyForUnstake(): Error checks - should only allow owner to call', async () => {
      await expectRevert(
        plrStaking.connect(addr1).setStateReadyForUnstake(),
        'Ownable: caller is not the owner'
      );
    });

    it('updateMinStakeLimit(): Error checks - should only allow owner to call', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      await expectRevert(
        plrStaking.connect(addr1).updateMinStakeLimit(5000),
        'Ownable: caller is not the owner'
      );
    });

    it('updateMaxStakeLimit(): Error checks - should only allow owner to call', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      await expectRevert(
        plrStaking.connect(addr1).updateMaxStakeLimit(250001),
        'Ownable: caller is not the owner'
      );
    });
  });

  describe('Contract state checks', () => {
    it('stake(): Error checks - should trigger contract state (STAKEABLE) check', async () => {
      await expectRevert(
        plrStaking.connect(addr1).stake(9999),
        'OnlyWhenStakeable'
      );
    });

    it('unstake(): Error checks - should trigger contract state (READY_FOR_UNSTAKE) check', async () => {
      const stake = '10000000000000000000000'; // 10,000 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(stake);
      await expectRevert(
        plrStaking.connect(addr1).unstake(),
        'OnlyWhenReadyForUnstake'
      );
    });

    it('eligibleRewardAmount(): should trigger contract state (READY_FOR_UNSTAKE) check', async () => {
      const stake = '10000000000000000000000'; // 10,000 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(stake);
      await expectRevert(
        plrStaking.eligibleRewardAmount(addr1.address),
        'OnlyWhenReadyForUnstake'
      );
    });

    it('updateMinStakeLimit(): Error checks - should trigger contract state (STAKEABLE) check', async () => {
      await expectRevert(
        plrStaking.connect(owner).updateMinStakeLimit(5000),
        'OnlyWhenStakeable()'
      );
    });

    it('updateMaxStakeLimit(): Error checks - should trigger contract state (STAKEABLE) check', async () => {
      await expectRevert(
        plrStaking.connect(owner).updateMaxStakeLimit(5000),
        'OnlyWhenStakeable()'
      );
    });
  });

  describe('Events', () => {
    it('stake(): Should emit an event on successful staking', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stakeAmount = '13131000000000000000000'; // 13,131 PLR
      await expect(plrStaking.connect(addr1).stake(stakeAmount))
        .to.emit(plrStaking, 'Staked')
        .withArgs(addr1.address, stakeAmount);
    });

    it('unstake(): Should emit an Unstaked event on unstaking', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR;
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await plrStaking
        .connect(owner)
        .depositRewards(ethers.utils.parseEther('71'));
      await plrStakedToken
        .connect(addr1)
        .approve(plrStaking.address, stakeAmount);
      await expect(plrStaking.connect(addr1).unstake())
        .to.emit(plrStaking, 'Unstaked')
        .withArgs(addr1.address, stakeAmount);
    });

    it('unstake(): Should emit an RewardPaid event on unstaking', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR;
      const rewards = '71000000000000000000'; // 71 ETH
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await plrStaking.connect(owner).depositRewards(rewards);
      await plrStakedToken
        .connect(addr1)
        .approve(plrStaking.address, stakeAmount);
      await expect(plrStaking.connect(addr1).unstake())
        .to.emit(plrStaking, 'RewardPaid')
        .withArgs(addr1.address, rewards);
    });

    it('depositRewards(): Should emit an RewardsDeposited event on depositing rewards', async () => {
      const rewards = '100000000000000000000'; // 100 ETH
      await expect(await plrStaking.connect(owner).depositRewards(rewards))
        .to.emit(plrStaking, 'RewardsDeposited')
        .withArgs(rewards);
    });

    it('updateMinStakeLimit(): Should emit an MinStakeAmountUpdated event', async () => {
      const newMinStake = '13131000000000000000000'; // 13,131 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await expect(plrStaking.updateMinStakeLimit(newMinStake))
        .to.emit(plrStaking, 'MinStakeAmountUpdated')
        .withArgs(newMinStake);
    });

    it('updateMaxStakeLimit(): Should emit an MaxStakeAmountUpdated event', async () => {
      const newMaxStake = '331313000000000000000000'; // 331,313 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await expect(plrStaking.updateMaxStakeLimit(newMaxStake))
        .to.emit(plrStaking, 'MaxStakeAmountUpdated')
        .withArgs(newMaxStake);
    });

    it('setState<contract-state>(): Should emit ContractStateUpdated event', async () => {
      await expect(plrStaking.connect(owner).setStateInitialized())
        .to.emit(plrStaking, 'ContractStateUpdated')
        .withArgs(0);
      await expect(plrStaking.connect(owner).setStateStakeable())
        .to.emit(plrStaking, 'ContractStateUpdated')
        .withArgs(1);
      await network.provider.send('evm_increaseTime', [oneMonth]);
      await expect(plrStaking.connect(owner).setStateStaked())
        .to.emit(plrStaking, 'ContractStateUpdated')
        .withArgs(2);
      await network.provider.send('evm_increaseTime', [oneYearOneWeek]);
      await expect(plrStaking.connect(owner).setStateReadyForUnstake())
        .to.emit(plrStaking, 'ContractStateUpdated')
        .withArgs(3);
    });
  });

  describe('Custom errors', () => {
    it('stake(): Error checks - should not allow users to stake when state is STAKED', async () => {
      const stake = '10000000000000000000000'; // 10,000 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(stake);
      await network.provider.send('evm_increaseTime', [oneMonth]);
      await plrStaking.connect(owner).setStateStaked();
      await expectRevert(
        plrStaking.connect(addr1).stake(stake),
        'OnlyWhenStakeable()'
      );
    });

    it('stake(): Error checks - should not allow users to stake when staking period has passed', async () => {
      const stake = '10000000000000000000000'; // 10,000 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(stake);
      await network.provider.send('evm_increaseTime', [oneMonth]);
      await expectRevert(
        plrStaking.connect(addr1).stake(stake),
        'StakingPeriodPassed()'
      );
    });

    it('stake(): Error checks - should not allow users to stake when the staking period has ended', async () => {
      const stake = '10000000000000000000000'; // 10,000 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await network.provider.send('evm_increaseTime', [oneMonth + oneDay]);
      await expectRevert(
        plrStaking.connect(addr1).stake(stake),
        'StakingPeriodPassed()'
      );
    });

    it('stake(): Error checks - should trigger minimum stake amount check', async () => {
      const invalidStake = '9999000000000000000000'; // 9,999 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await expectRevert(
        plrStaking.connect(addr1).stake(invalidStake),
        'InvalidMinimumStake(10000000000000000000000)'
      );
    });

    it('stake(): Error checks - should trigger maximum stake amount check', async () => {
      const invalidStake = '250001000000000000000000'; // 250,001 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await expectRevert(
        plrStaking.connect(addr1).stake(invalidStake),
        'InvalidMaximumStake(250000000000000000000000)'
      );
    });

    it('stake(): Error checks - should trigger insufficient balance check', async () => {
      const invalidStake = '10000000000000000000000'; // 10,000 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await expectRevert(
        plrStaking.connect(addr3).stake(invalidStake),
        'InsufficientBalance()'
      );
    });

    it('stake(): Error checks - should trigger maximum personal stake amount check', async () => {
      const initialStake = '240000000000000000000000'; // 240,000 PLR
      const invalidStake = '10001000000000000000000'; // 10,001 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(initialStake);
      await expectRevert(
        plrStaking.connect(addr1).stake(invalidStake),
        'StakeWouldBeGreaterThanMax()'
      );
    });

    it('stake(): Error checks - should trigger maximum total stake reached amount check', async () => {
      const newMaxStake = '7199999000000000000000000'; // 7,199,999 PLR
      const invalidStake = '10000000000000000000000'; // 10,000 PLR
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(owner).updateMaxStakeLimit(newMaxStake);
      await plrStaking.connect(owner).stake(newMaxStake);
      await expectRevert(
        plrStaking.connect(addr1).stake(invalidStake),
        `MaximumTotalStakeReached(7200000000000000000000000, 7199999000000000000000000, 1000000000000000000, 10000000000000000000000)`
      );
    });

    it('unstake(): Error checks - should trigger error is user tries to unstake and claim rewards twice', async () => {
      await plrStaking.connect(owner).setStateStakeable();
      const stake = '10000000000000000000000'; // 10,000 PLR
      const rewardAmount = '71000000000000000000'; // 71 ETH
      await plrStaking.connect(addr1).stake(stake);
      await plrStaking.connect(addr2).stake(stake);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await plrStaking.connect(owner).depositRewards(rewardAmount);
      await plrStakedToken.connect(addr1).approve(plrStaking.address, stake);
      await plrStakedToken.connect(addr2).approve(plrStaking.address, stake);
      await plrStaking.connect(addr1).unstake();
      await plrStaking.connect(addr2).unstake();
      await expectRevert(
        plrStaking.connect(addr1).unstake(),
        `UserAlreadyClaimedRewards("${addr1.address}")`
      );
      await expectRevert(
        plrStaking.connect(addr2).unstake(),
        `UserAlreadyClaimedRewards("${addr2.address}")`
      );
    });

    it('eligibleRewardAmount(): Error checks - should trigger if argument is zero address', async () => {
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR;
      const rewardAmount = '63000000000000000000'; // 63 ETH
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(owner).depositRewards(rewardAmount);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await expectRevert(
        plrStaking
          .connect(addr1)
          .eligibleRewardAmount(ethers.constants.AddressZero),
        'ZeroAddress()'
      );
    });

    it('eligibleRewardAmount(): Error checks - should trigger if attempted to calculate rewards more than once', async () => {
      const stakeAmount = '10000000000000000000000'; // 10,000 PLR;
      const rewardAmount = '63000000000000000000'; // 63 ETH
      await plrStaking.connect(owner).setStateStakeable();
      await plrStaking.connect(addr1).stake(stakeAmount);
      await plrStaking.connect(owner).depositRewards(rewardAmount);
      await plrStaking.connect(owner).setStateReadyForUnstake();
      await plrStaking.connect(addr1).eligibleRewardAmount(addr1.address);
      await expectRevert(
        plrStaking.connect(addr1).eligibleRewardAmount(addr1.address),
        'RewardsAlreadyCalculated()'
      );
    });

    it('depositRewards(): Error checks - should trigger if attempted to deposit zero reward tokens', async () => {
      await expectRevert(
        plrStaking.connect(owner).depositRewards(0),
        'RewardsCannotBeZero()'
      );
    });

    it('setStateReadyForUnstake(): Error checks - should trigger if staked period < 12 months', async () => {
      await plrStaking.connect(owner).setStateStaked();
      await expectRevert(
        plrStaking.setStateReadyForUnstake(),
        'StakedDurationTooShort()'
      );
    });
  });
});
