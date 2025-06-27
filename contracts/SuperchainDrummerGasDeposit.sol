// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SuperchainDrummerGasDeposit
 * @dev Smart contract for managing gas deposits and recording drum hits
 * @author Superchain Drummer Team
 */
contract SuperchainDrummerGasDeposit is ReentrancyGuard, Ownable, Pausable {
    
    // Events
    event GasDeposited(address indexed user, uint256 amount, uint256 timestamp);
    event GasWithdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event DrumHitRecorded(address indexed user, uint256 hitId, uint256 accuracy, uint256 combo, uint256 timestamp);
    event EmergencyWithdraw(address indexed user, uint256 amount, uint256 timestamp);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    
    // State variables
    mapping(address => uint256) public userBalances;
    mapping(address => uint256) public userHitCount;
    mapping(address => uint256) public userTotalScore;
    
    address public relayer;
    uint256 public minDeposit = 0.001 ether;
    uint256 public maxDeposit = 1 ether;
    uint256 public gasPerHit = 80000; // Estimated gas for drum hit transaction
    uint256 public hitCounter;
    
    // Modifiers
    modifier onlyRelayer() {
        require(msg.sender == relayer || msg.sender == owner(), "Only relayer or owner");
        _;
    }
    
    modifier validDeposit(uint256 amount) {
        require(amount >= minDeposit, "Deposit too small");
        require(amount <= maxDeposit, "Deposit too large");
        _;
    }
    
    modifier sufficientBalance(address user, uint256 gasNeeded) {
        require(userBalances[user] >= gasNeeded, "Insufficient gas balance");
        _;
    }
    
    constructor(address _relayer) Ownable(msg.sender) {
        relayer = _relayer;
    }
    
    /**
     * @dev Deposit gas for gameplay
     * @param amount Amount of ETH to deposit
     */
    function depositGas(uint256 amount) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validDeposit(amount) 
    {
        require(msg.value == amount, "Amount mismatch");
        
        userBalances[msg.sender] += amount;
        
        emit GasDeposited(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Withdraw remaining gas balance
     * @param amount Amount to withdraw
     */
    function withdrawGas(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(amount > 0, "Amount must be positive");
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        
        userBalances[msg.sender] -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit GasWithdrawn(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Record a drum hit (called by relayer)
     * @param user Address of the player
     * @param accuracy Hit accuracy (0-100)
     * @param combo Current combo count
     */
    function recordDrumHit(
        address user,
        uint256 accuracy,
        uint256 combo
    ) 
        external 
        onlyRelayer 
        whenNotPaused 
        sufficientBalance(user, gasPerHit) 
    {
        require(accuracy <= 100, "Invalid accuracy");
        require(combo > 0, "Invalid combo");
        
        // Deduct gas for the transaction
        userBalances[user] -= gasPerHit;
        
        // Update user stats
        userHitCount[user]++;
        userTotalScore[user] += accuracy * combo;
        hitCounter++;
        
        emit DrumHitRecorded(user, hitCounter, accuracy, combo, block.timestamp);
    }
    
    /**
     * @dev Get user statistics
     * @param user Address of the user
     * @return balance Current gas balance
     * @return hits Total number of hits
     * @return score Total score
     */
    function getUserStats(address user) 
        external 
        view 
        returns (uint256 balance, uint256 hits, uint256 score) 
    {
        return (userBalances[user], userHitCount[user], userTotalScore[user]);
    }
    
    /**
     * @dev Check if user has sufficient balance for a hit
     * @param user Address of the user
     * @return bool True if sufficient balance
     */
    function canHit(address user) external view returns (bool) {
        return userBalances[user] >= gasPerHit;
    }
    
    // Admin functions
    
    /**
     * @dev Update relayer address
     * @param newRelayer New relayer address
     */
    function updateRelayer(address newRelayer) external onlyOwner {
        require(newRelayer != address(0), "Invalid relayer address");
        address oldRelayer = relayer;
        relayer = newRelayer;
        emit RelayerUpdated(oldRelayer, newRelayer);
    }
    
    /**
     * @dev Update gas per hit
     * @param newGasPerHit New gas amount per hit
     */
    function updateGasPerHit(uint256 newGasPerHit) external onlyOwner {
        require(newGasPerHit > 0, "Gas per hit must be positive");
        gasPerHit = newGasPerHit;
    }
    
    /**
     * @dev Update deposit limits
     * @param newMinDeposit New minimum deposit
     * @param newMaxDeposit New maximum deposit
     */
    function updateDepositLimits(uint256 newMinDeposit, uint256 newMaxDeposit) external onlyOwner {
        require(newMinDeposit < newMaxDeposit, "Invalid limits");
        minDeposit = newMinDeposit;
        maxDeposit = newMaxDeposit;
    }
    
    /**
     * @dev Emergency withdraw for users
     * @param user Address of the user
     */
    function emergencyWithdraw(address user) external onlyOwner whenPaused {
        uint256 balance = userBalances[user];
        require(balance > 0, "No balance to withdraw");
        
        userBalances[user] = 0;
        
        (bool success, ) = payable(user).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
        
        emit EmergencyWithdraw(user, balance, block.timestamp);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw contract fees (if any)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }
    
    // View functions
    
    /**
     * @dev Get contract statistics
     * @return totalHits Total hits recorded
     * @return totalBalance Total contract balance
     */
    function getContractStats() external view returns (uint256 totalHits, uint256 totalBalance) {
        return (hitCounter, address(this).balance);
    }
    
    /**
     * @dev Get deposit limits
     * @return min Minimum deposit
     * @return max Maximum deposit
     */
    function getDepositLimits() external view returns (uint256 min, uint256 max) {
        return (minDeposit, maxDeposit);
    }
    
    // Receive function
    receive() external payable {
        revert("Use depositGas function");
    }
} 