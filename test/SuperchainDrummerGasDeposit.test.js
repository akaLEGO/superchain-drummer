const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SuperchainDrummerGasDeposit", function () {
  let SuperchainDrummerGasDeposit;
  let gasDepositContract;
  let owner;
  let relayer;
  let user1;
  let user2;
  let addrs;

  const MIN_DEPOSIT = ethers.parseEther("0.001");
  const MAX_DEPOSIT = ethers.parseEther("1");
  const GAS_PER_HIT = 80000;

  beforeEach(async function () {
    [owner, relayer, user1, user2, ...addrs] = await ethers.getSigners();
    
    SuperchainDrummerGasDeposit = await ethers.getContractFactory("SuperchainDrummerGasDeposit");
    gasDepositContract = await SuperchainDrummerGasDeposit.deploy(relayer.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await gasDepositContract.owner()).to.equal(owner.address);
    });

    it("Should set the right relayer", async function () {
      expect(await gasDepositContract.relayer()).to.equal(relayer.address);
    });

    it("Should set correct initial values", async function () {
      expect(await gasDepositContract.minDeposit()).to.equal(MIN_DEPOSIT);
      expect(await gasDepositContract.maxDeposit()).to.equal(MAX_DEPOSIT);
      expect(await gasDepositContract.gasPerHit()).to.equal(GAS_PER_HIT);
      expect(await gasDepositContract.hitCounter()).to.equal(0);
    });
  });

  describe("Gas Deposits", function () {
    it("Should accept valid deposits", async function () {
      const depositAmount = ethers.parseEther("0.01");
      
      await expect(gasDepositContract.connect(user1).depositGas(depositAmount, { value: depositAmount }))
        .to.emit(gasDepositContract, "GasDeposited")
        .withArgs(user1.address, depositAmount, await time());

      expect(await gasDepositContract.userBalances(user1.address)).to.equal(depositAmount);
    });

    it("Should reject deposits below minimum", async function () {
      const smallDeposit = ethers.parseEther("0.0005");
      
      await expect(
        gasDepositContract.connect(user1).depositGas(smallDeposit, { value: smallDeposit })
      ).to.be.revertedWith("Deposit too small");
    });

    it("Should reject deposits above maximum", async function () {
      const largeDeposit = ethers.parseEther("2");
      
      await expect(
        gasDepositContract.connect(user1).depositGas(largeDeposit, { value: largeDeposit })
      ).to.be.revertedWith("Deposit too large");
    });

    it("Should reject deposits with wrong value", async function () {
      const depositAmount = ethers.parseEther("0.01");
      const wrongValue = ethers.parseEther("0.02");
      
      await expect(
        gasDepositContract.connect(user1).depositGas(depositAmount, { value: wrongValue })
      ).to.be.revertedWith("Amount mismatch");
    });

    it("Should accumulate multiple deposits", async function () {
      const deposit1 = ethers.parseEther("0.01");
      const deposit2 = ethers.parseEther("0.02");
      
      await gasDepositContract.connect(user1).depositGas(deposit1, { value: deposit1 });
      await gasDepositContract.connect(user1).depositGas(deposit2, { value: deposit2 });
      
      expect(await gasDepositContract.userBalances(user1.address)).to.equal(deposit1 + deposit2);
    });
  });

  describe("Gas Withdrawals", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("0.1");
      await gasDepositContract.connect(user1).depositGas(depositAmount, { value: depositAmount });
    });

    it("Should allow users to withdraw their balance", async function () {
      const withdrawAmount = ethers.parseEther("0.05");
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await expect(gasDepositContract.connect(user1).withdrawGas(withdrawAmount))
        .to.emit(gasDepositContract, "GasWithdrawn")
        .withArgs(user1.address, withdrawAmount, await time());

      expect(await gasDepositContract.userBalances(user1.address)).to.equal(ethers.parseEther("0.05"));
    });

    it("Should reject withdrawals exceeding balance", async function () {
      const largeWithdrawal = ethers.parseEther("0.2");
      
      await expect(
        gasDepositContract.connect(user1).withdrawGas(largeWithdrawal)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should reject zero withdrawals", async function () {
      await expect(
        gasDepositContract.connect(user1).withdrawGas(0)
      ).to.be.revertedWith("Amount must be positive");
    });
  });

  describe("Drum Hit Recording", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("0.1");
      await gasDepositContract.connect(user1).depositGas(depositAmount, { value: depositAmount });
    });

    it("Should allow relayer to record drum hits", async function () {
      const accuracy = 95;
      const combo = 5;
      
      await expect(gasDepositContract.connect(relayer).recordDrumHit(user1.address, accuracy, combo))
        .to.emit(gasDepositContract, "DrumHitRecorded")
        .withArgs(user1.address, 1, accuracy, combo, await time());

      expect(await gasDepositContract.userHitCount(user1.address)).to.equal(1);
      expect(await gasDepositContract.userTotalScore(user1.address)).to.equal(accuracy * combo);
      expect(await gasDepositContract.hitCounter()).to.equal(1);
    });

    it("Should deduct gas for each hit", async function () {
      const initialBalance = await gasDepositContract.userBalances(user1.address);
      
      await gasDepositContract.connect(relayer).recordDrumHit(user1.address, 90, 3);
      
      expect(await gasDepositContract.userBalances(user1.address)).to.equal(initialBalance - BigInt(GAS_PER_HIT));
    });

    it("Should reject hits from non-relayer", async function () {
      await expect(
        gasDepositContract.connect(user2).recordDrumHit(user1.address, 90, 3)
      ).to.be.revertedWith("Only relayer or owner");
    });

    it("Should reject hits with insufficient balance", async function () {
      // Record many hits to drain balance
      for (let i = 0; i < 10; i++) {
        await gasDepositContract.connect(relayer).recordDrumHit(user1.address, 90, 3);
      }
      
      await expect(
        gasDepositContract.connect(relayer).recordDrumHit(user1.address, 90, 3)
      ).to.be.revertedWith("Insufficient gas balance");
    });

    it("Should reject invalid accuracy", async function () {
      await expect(
        gasDepositContract.connect(relayer).recordDrumHit(user1.address, 150, 3)
      ).to.be.revertedWith("Invalid accuracy");
    });

    it("Should reject invalid combo", async function () {
      await expect(
        gasDepositContract.connect(relayer).recordDrumHit(user1.address, 90, 0)
      ).to.be.revertedWith("Invalid combo");
    });

    it("Should allow owner to record hits", async function () {
      await expect(gasDepositContract.connect(owner).recordDrumHit(user1.address, 95, 4))
        .to.emit(gasDepositContract, "DrumHitRecorded");
    });
  });

  describe("User Statistics", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("0.1");
      await gasDepositContract.connect(user1).depositGas(depositAmount, { value: depositAmount });
    });

    it("Should return correct user stats", async function () {
      await gasDepositContract.connect(relayer).recordDrumHit(user1.address, 95, 3);
      await gasDepositContract.connect(relayer).recordDrumHit(user1.address, 88, 5);
      
      const [balance, hits, score] = await gasDepositContract.getUserStats(user1.address);
      
      expect(hits).to.equal(2);
      expect(score).to.equal(95 * 3 + 88 * 5);
    });

    it("Should check if user can hit", async function () {
      expect(await gasDepositContract.canHit(user1.address)).to.be.true;
      
      // Drain balance
      for (let i = 0; i < 10; i++) {
        await gasDepositContract.connect(relayer).recordDrumHit(user1.address, 90, 3);
      }
      
      expect(await gasDepositContract.canHit(user1.address)).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update relayer", async function () {
      await expect(gasDepositContract.connect(owner).updateRelayer(user2.address))
        .to.emit(gasDepositContract, "RelayerUpdated")
        .withArgs(relayer.address, user2.address);

      expect(await gasDepositContract.relayer()).to.equal(user2.address);
    });

    it("Should reject relayer update from non-owner", async function () {
      await expect(
        gasDepositContract.connect(user1).updateRelayer(user2.address)
      ).to.be.revertedWithCustomError(gasDepositContract, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to update gas per hit", async function () {
      const newGasPerHit = 100000;
      await gasDepositContract.connect(owner).updateGasPerHit(newGasPerHit);
      expect(await gasDepositContract.gasPerHit()).to.equal(newGasPerHit);
    });

    it("Should allow owner to update deposit limits", async function () {
      const newMin = ethers.parseEther("0.002");
      const newMax = ethers.parseEther("2");
      
      await gasDepositContract.connect(owner).updateDepositLimits(newMin, newMax);
      
      expect(await gasDepositContract.minDeposit()).to.equal(newMin);
      expect(await gasDepositContract.maxDeposit()).to.equal(newMax);
    });

    it("Should reject invalid deposit limits", async function () {
      const newMin = ethers.parseEther("0.002");
      const newMax = ethers.parseEther("0.001");
      
      await expect(
        gasDepositContract.connect(owner).updateDepositLimits(newMin, newMax)
      ).to.be.revertedWith("Invalid limits");
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await gasDepositContract.connect(owner).pause();
      expect(await gasDepositContract.paused()).to.be.true;
      
      await gasDepositContract.connect(owner).unpause();
      expect(await gasDepositContract.paused()).to.be.false;
    });

    it("Should prevent deposits when paused", async function () {
      await gasDepositContract.connect(owner).pause();
      
      const depositAmount = ethers.parseEther("0.01");
      await expect(
        gasDepositContract.connect(user1).depositGas(depositAmount, { value: depositAmount })
      ).to.be.revertedWithCustomError(gasDepositContract, "EnforcedPause");
    });

    it("Should prevent withdrawals when paused", async function () {
      const depositAmount = ethers.parseEther("0.01");
      await gasDepositContract.connect(user1).depositGas(depositAmount, { value: depositAmount });
      
      await gasDepositContract.connect(owner).pause();
      
      await expect(
        gasDepositContract.connect(user1).withdrawGas(depositAmount)
      ).to.be.revertedWithCustomError(gasDepositContract, "EnforcedPause");
    });

    it("Should prevent drum hits when paused", async function () {
      const depositAmount = ethers.parseEther("0.01");
      await gasDepositContract.connect(user1).depositGas(depositAmount, { value: depositAmount });
      
      await gasDepositContract.connect(owner).pause();
      
      await expect(
        gasDepositContract.connect(relayer).recordDrumHit(user1.address, 90, 3)
      ).to.be.revertedWithCustomError(gasDepositContract, "EnforcedPause");
    });
  });

  describe("Emergency Functions", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("0.1");
      await gasDepositContract.connect(user1).depositGas(depositAmount, { value: depositAmount });
    });

    it("Should allow emergency withdrawal when paused", async function () {
      await gasDepositContract.connect(owner).pause();
      
      await expect(gasDepositContract.connect(owner).emergencyWithdraw(user1.address))
        .to.emit(gasDepositContract, "EmergencyWithdraw")
        .withArgs(user1.address, ethers.parseEther("0.1"), await time());

      expect(await gasDepositContract.userBalances(user1.address)).to.equal(0);
    });

    it("Should reject emergency withdrawal when not paused", async function () {
      await expect(
        gasDepositContract.connect(owner).emergencyWithdraw(user1.address)
      ).to.be.revertedWithCustomError(gasDepositContract, "ExpectedPause");
    });

    it("Should reject emergency withdrawal for user with no balance", async function () {
      await gasDepositContract.connect(owner).pause();
      
      await expect(
        gasDepositContract.connect(owner).emergencyWithdraw(user2.address)
      ).to.be.revertedWith("No balance to withdraw");
    });
  });

  describe("Contract Statistics", function () {
    it("Should return correct contract stats", async function () {
      const [totalHits, totalBalance] = await gasDepositContract.getContractStats();
      expect(totalHits).to.equal(0);
      expect(totalBalance).to.equal(0);
      
      const depositAmount = ethers.parseEther("0.1");
      await gasDepositContract.connect(user1).depositGas(depositAmount, { value: depositAmount });
      
      const [totalHitsAfter, totalBalanceAfter] = await gasDepositContract.getContractStats();
      expect(totalHitsAfter).to.equal(0);
      expect(totalBalanceAfter).to.equal(depositAmount);
    });

    it("Should return correct deposit limits", async function () {
      const [min, max] = await gasDepositContract.getDepositLimits();
      expect(min).to.equal(MIN_DEPOSIT);
      expect(max).to.equal(MAX_DEPOSIT);
    });
  });

  describe("Receive Function", function () {
    it("Should reject direct ETH transfers", async function () {
      await expect(
        owner.sendTransaction({
          to: await gasDepositContract.getAddress(),
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWith("Use depositGas function");
    });
  });

  // Helper function to get current timestamp
  async function time() {
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    return block.timestamp;
  }
}); 