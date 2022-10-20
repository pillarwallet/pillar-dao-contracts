# **PILLAR STAKING CONTRACT**

&nbsp;  

## **PURPOSE**

&nbsp;  

To allow PillarToken holders (PLR) to stake their tokens and earn rewards (paid in wETH).

&nbsp;  

---
---

&nbsp;  

## **CONTRACT**

&nbsp;  

### **CONSTRUCTOR**

&nbsp;  

Takes staking token address, reward token address and max contract stake limits as arguments.  
Max contract stake limits are defaulted to 7.2m PLR (17e18) if 0 passed in as argument, otherwise will be updated to new amount.

&nbsp;  

### **PUBLIC FUNCTIONS**

&nbsp;  

* `stake` - Allows users to stake their PLR tokens into the contract. This can only be done when the contract state is STAKEABLE. The amount staked has to be >= the minimum stake limit, <= the maximum stake limit and <= the maximum allowed staking amount of the contract. Stake amount should be given in wei. After the staking period has passed, no more staking will be allowed.
* `unstake` - Allows users to withdraw their tokens from the contract and claim the rewards they have earned. This can only be done when the contract state is READY_FOR_UNSTAKE.
* `getContractState` - Allows users to see the current state of the contract. The four states are:
  * `INITIALIZED` - The contract has been initialized, however staking cannot yet be performed.
  * `STAKEABLE` - The contract has been opened for staking. Users can now stake tokens in the contract (which will be open for a specific time window).
  * `STAKED` - The contract is no longer accepting user's tokens for staking. This denotes the period where tokens are locked for staking (for a specified time window - >= 12 months from time of staking locked).
  * `READY_FOR_UNSTAKE` - The contract is open for unstaking. Staked tokens are no longer locked and rewards have been calculated.
* `getStakedAmountForAccount` - Allows users to check how many tokens are staked for an address.
* `getStakedAccounts` - Returns a list of all stakeholder addresses.

&nbsp;  

### **RESTRICTED FUNCTIONS**

&nbsp;  

* `depositRewards` - Called by contract owner to deposit reward tokens for allocation.
* `updateMinStakeLimit` - Called by contract owner to update the current minimum stake amount for users (initially 10,000 PLR). This can only be done when the contract is STAKEABLE. Should be given in wei.
* `updateMaxStakeLimit` - Called by contract owner to update the current maximum stake amount for users (initially 250,000 PLR). This can only be done when the contract is STAKEABLE. Should be given in wei.
* `setStateInitialized` - Called by the contract owner to change the contract state to INITIALIZED.
* `setStateStakeable` - Called by the contract owner to change the contract state to STAKEABLE.
* `setStateStaked` - Called by the contract owner to change the contract state to STAKED.
* `setStateReadyForUnstake` - Called by the contract owner to change the contract state to READY_FOR_UNSTAKE.

&nbsp;  

---
---
  
&nbsp;  

## **REWARD TOKEN ALLOCATION**

&nbsp;  

| SYMBOL |        DEFINITION       |
|:------:|:-----------------------:|
|   Ps   |     stake percentage    |
|   Si   | individual stake amount |
|   bps  |       basis points      |
|   St   |   total staked amount   |
|   R    |      reward amount      |
|   Rt   |       total reward      |

&nbsp; 

<div style="background-color:rgba(245, 245, 220, 0.1470588); text-align:center; vertical-align: middle; padding:40px 0;">
<font size="+2">Ps = (Si * bps) / St</font><p>
<font size="+2">R = (Ps * Rt) / bps</font>
</div>

&nbsp;  

* NB: This provides a reward amount to two decimal places (rounded down)

&nbsp;  

---
---

&nbsp;  

## **CUSTOM ERRORS**

&nbsp;  

### InvalidRewardsToken
* Fires if: The reward token address passed in on contract deployment is the zero address.
* Representation `InvalidRewardsToken()`
### InvalidStakingToken
* Fires if: The staking token address passed in on contract deployment is the zero address.
* Representation `InvalidStakingToken()`
### InvalidMinimumStake
* Fires if: The attempted stake amount does not meet minimum stake requirements.
* Representation `InvalidMinimumStake(minimumStakeAmount)`
  * Provided error arguement will be of type `Integer` and will be the current minimum stake requirement.
### InvalidMaximumStake
* Fires if: The attempted stake amount does not meet maximum stake requirements.
* Representation `InvalidMaximumStake(maximumStakeAmount)`
  * Provided error arguement will be of type `Integer` and will be the current maximum stake limit.
### InsufficientBalance
* Fires if: The balance of the user attempting to stake is lower than their attempted stake.
* Representation `InsufficientBalance()`
### MaximumTotalStakeReached
* Fires if: The maximum stake limit is reached or would be reached by the attempted stake.
* Representation `MaximumTotalStakeReached(totalMaxStake, currentStakedAmount, remainingStakeableAmount, stakerAmount)`
  * Provided error arguments will be of type `Integer` and will be the current contract maximum stake limit, the current user staked balance, the remaining stakeable balance, the attemped stake amount.
### StakeWouldBeGreaterThanMax
* Fires if: The maximum stake limit of the contract is reached or would be reached by the attempted stake.
* Representation `StakeWouldBeGreaterThanMax()`
### ProposedMaxStakeTooLow
* Fires if: The propsed maximum stake limit is lower than the current minimum stake limit.
* Representation `ProposedMaxStakeTooLow(currentMin, proposedMax)`
  * Provided error arguments will be of type `Integer` and will be the current minimum stake limit and the propsed maximum stake limit.
### ProposedMinStakeTooHigh
* Fires if: The propsed minimum stake limit is higher than the current maximum stake limit.
* Representation `ProposedMinStakeTooHigh(currentMax, proposedMin)`
  * Provided error arguments will be of type `Integer` and will be the current maximum stake limit and the propsed minimum stake limit.
### OnlyWhenInitialized
* Fires if: The propsed action is only allowed when contract state is INITIALIZED.
* Representation `OnlyWhenInitialized()`
### OnlyWhenStakeable
* Fires if: The propsed action is only allowed when contract state is STAKEABLE.
* Representation `OnlyWhenStakeable()`
### OnlyWhenStaked
* Fires if: The propsed action is only allowed when contract state is STAKED.
* Representation `OnlyWhenStaked()`
### OnlyWhenReadyForUnstake
* Fires if: The propsed action is only allowed when contract state is READY_FOR_UNSTAKE.
* Representation `OnlyWhenReadyForUnstake()`
### RewardsNotTransferred
* Fires if: Token rewards allocation is attempted when no reward tokens exist on contract.
* Representation `RewardsNotTransferred()`
### StakingPeriodPassed
* Fires if: The alloted staking period has passed.
* Representation `StakingPeriodPassed()`
### StakingDurationTooShort
* Fires if: If attempt to change contract state from STAKABLE to STAKED before alloted staking period has elapsed.
* Representation `StakingDurationTooShort()`
### StakedDurationTooShort
* Fires if: The stake period is less than 12 months.
* Representation `StakedDurationTooShort()`
### RewardsCannotBeZero
* Fires if: Trying to deposit reward amount of 0.
* Representation `RewardsCannotBeZero()`
### UserAlreadyClaimedRewards
* Fires if: Trying to claim rewards/unstake more than once.
* Representation `UserAlreadyClaimedRewards`
  * * Provided error arguments will be of type `Address` and will be the address of the user that is trying to unstake/claim multiple times.


&nbsp;  

---
---

&nbsp;  

## TESTING

&nbsp;  

### RUNNING TESTS

Once in the root directory:  

`npm i`  
`npx hardhat node`  

In a separate terminal window:  

`npx hardhat test test/PillarStaking.spec.js`

&nbsp;  

### TESTS

&nbsp;  

  **PillarStakingContract**  
    **Deployment**  
      <span style="color: green;">✔</span> Deploys Pillar Token without errors  
      <span style="color: green;">✔</span> Deploys WETH Token without errors   
      <span style="color: green;">✔</span> Deploys Pillar Staking contract without errors  
    **Staking PLR**  
      <span style="color: green;">✔</span> stake(): Should allow users to stake within specified limits  
      <span style="color: green;">✔</span> stake(): Should allow a single user to stake multiple times within specified limits  
    **Unstaking PLR and earning rewards**  
      <span style="color: green;">✔</span> unstake(): Should allow a user to unstake their total staked balance and earned rewards (67ms)  
      <span style="color: green;">✔</span> unstake(): Should allow multiple users to unstake their total staked balance and earned rewards (84ms)  
    **Updating max stake limit**  
      <span style="color: green;">✔</span> updateMaxStakeLimit(): Should allow decreasing of maximum stake  
      <span style="color: green;">✔</span> updateMaxStakeLimit(): Should allow increasing of maximum stake  
    **Updating min stake limit**  
      <span style="color: green;">✔</span> updateMinStakeLimit(): Should allow decreasing of minimum stake  
      <span style="color: green;">✔</span> updateMinStakeLimit(): Should allow increasing of minimum stake  
    **Viewing stakeholders**  
      <span style="color: green;">✔</span> getStakedAccounts: Should return list of stakeholders   
    **Viewing staked amount**  
      <span style="color: green;">✔</span> getStakedAmountForAccount(): Should return zero for a user that has not staked  
      <span style="color: green;">✔</span> getStakedAmountForAccount(): Should return staked amount for a user that has staked  
    **Updating/viewing contract state**  
      <span style="color: green;">✔</span> setStateStakeable(): Should update staking state from INITIALIZED to STAKEABLE  
      <span style="color: green;">✔</span> setStateStaked(): Should update staking state from INITIALIZED to STAKED  
      <span style="color: green;">✔</span> setStateReadyForUnstake(): Should update staking state from INITIALIZED to READY_FOR_UNSTAKE  
      <span style="color: green;">✔</span> setStateInitialized(): Should set staking state to INITIALIZED  
      <span style="color: green;">✔</span> getContractState(): Should be initialized with state: INITIALIZED  
      <span style="color: green;">✔</span> getContractState(): Should return current contract state: STAKED  
    **Depositing rewards**
      <span style="color: green;">✔</span> depositRewards(): Should allow the contract owner to deposit reward tokens  
    **Function permissions**  
      <span style="color: green;">✔</span> calculateRewardAllocation(): Error checks - should only allow owner to call  
      <span style="color: green;">✔</span> setStateInitialized(): Error checks - should only allow owner to call  
      <span style="color: green;">✔</span> setStateStakeable(): Error checks - should only allow owner to call  
      <span style="color: green;">✔</span> setStateStakeable(): Error checks - should only allow owner to call  
      <span style="color: green;">✔</span> setStateReadyForUnstake(): Error checks - should only allow owner to call  
      <span style="color: green;">✔</span> updateMinStakeLimit(): Error checks - should only allow owner to call  
      <span style="color: green;">✔</span> updateMaxStakeLimit(): Error checks - should only allow owner to call  
    **Contract state checks**  
      <span style="color: green;">✔</span> stake(): Error checks - should trigger contract state (STAKEABLE) check  
      <span style="color: green;">✔</span> unstake(): Error checks - should trigger contract state (READY_FOR_UNSTAKE) check  
      <span style="color: green;">✔</span> updateMinStakeLimit(): Error checks - should trigger contract state (STAKEABLE) check  
      <span style="color: green;">✔</span> updateMaxStakeLimit(): Error checks - should trigger contract state (STAKEABLE) check  
    **Events**  
      <span style="color: green;">✔</span> stake(): Should emit an event on successful staking  
      <span style="color: green;">✔</span> unstake(): Should emit an Unstaked event on unstaking  
      <span style="color: green;">✔</span> unstake(): Should emit an RewardPaid event on unstaking (47ms)  
      <span style="color: green;">✔</span> depositRewards(): Should emit an RewardsDeposited event on depositing rewards  
      <span style="color: green;">✔</span> updateMinStakeLimit(): Should emit an MinStakeAmountUpdated event  
      <span style="color: green;">✔</span> updateMaxStakeLimit(): Should emit an MaxStakeAmountUpdated event  
      <span style="color: green;">✔</span> setState<contract-state>(): Should emit ContractStateUpdated event  
    **Custom errors**  
      <span style="color: green;">✔</span> stake(): Error checks - should not allow users to stake when state is STAKED  
      <span style="color: green;">✔</span> stake(): Error checks - should not allow users to stake when staking period has passed    
      <span style="color: green;">✔</span> </span> stake(): Error checks - should not allow users to stake when the staking period has ended  
      <span style="color: green;">✔</span> stake(): Error checks - should trigger minimum stake amount check  
      <span style="color: green;">✔</span> stake(): Error checks - should trigger maximum stake amount check  
      <span style="color: green;">✔</span> stake(): Error checks - should trigger insufficient balance check  
      <span style="color: green;">✔</span> stake(): Error checks - should trigger maximum personal stake amount check  
      <span style="color: green;">✔</span> stake(): Error checks - should trigger maximum total stake reached amount check  
      <span style="color: green;">✔</span> unstake(): Error checks - should trigger error is user tries to unstake and claim rewards twice  
      <span style="color: green;">✔</span> depositRewards(): Error checks - should trigger if attempted to deposit zero reward tokens  
      <span style="color: green;">✔</span> setStateReadyForUnstake(): Error checks - should trigger if staked period < 12 months  


&nbsp;  

### TEST COVERAGE

&nbsp;  


File                      |  % Stmts | % Branch |  % Funcs |  % Lines |
--------------------------|----------|----------|----------|----------|
 contracts/               |          |          |          |          |
  PillarStaking.sol       |    94.23 |    80.56 |    89.47 |    91.57 |

&nbsp;  

### GAS REPORTER

&nbsp;  


|  Solc version: 0.8.4               |  Optimizer enabled: true  |  Runs: 10000  |  Block limit: 30000000 gas  
|--------------------------------------------------|---------------------------|---------------|-----------------------------|
|  **Methods**                                                                                                                   
|  **Contract**      |  **Method**                 |  **Min**    |  **Max**    |  **Avg**      | **# calls**   |
|  PillarStaking     |  depositRewards             |             |             |        90250  |            8  |
|  PillarStaking     |  setStateInitialized        |          -  |          -  |        26947  |            3  |
|  PillarStaking     |  setStateReadyForUnstake    |      31955  |      49055  |        34093  |            8  |
|  PillarStaking     |  setStateStakeable          |          -  |          -  |        68771  |           30  |
|  PillarStaking     |  setStateStaked             |      53847  |      70947  |        61176  |            7  |
|  PillarStaking     |  stake                      |      76838  |     192306  |       155290  |           26  |
|  PillarStaking     |  unstake                    |     103381  |     112981  |       106048  |            9  |
|  PillarStaking     |  updateMaxStakeLimit        |      34020  |      34056  |        34042  |            5  |
|  PillarStaking     |  updateMinStakeLimit        |      29203  |      34099  |        33115  |            5  |
|  **Deployments**                                 |                                           |**% of limit** |             
|  PillarStaking                                   |    1820466  |    1820490  |      1820488  |        6.1 %  |

&nbsp;  

---
---