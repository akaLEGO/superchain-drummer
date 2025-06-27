// Superchain Drummer Web3 Integration
// Usage: const web3 = new SuperchainDrummerWeb3(); await web3.connectWallet();
// Then use web3.depositGas, web3.getUserStats, web3.recordDrumHit, etc.

class SuperchainDrummerWeb3 {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.userBalances = {
            'op-sepolia': 0,
            'base-sepolia': 0,
            'ink-sepolia': 0
        };
        this.isConnected = false;
        // Replace these with your deployed contract addresses:
        this.contractAddresses = {
            'op-sepolia': '0xYourOpSepoliaAddress',
            'base-sepolia': '0xYourBaseSepoliaAddress',
            'ink-sepolia': '0xYourInkSepoliaAddress'
        };
        this.chainConfigs = {
            'op-sepolia': {
                chainId: '0xaa36a7',
                chainName: 'OP Sepolia',
                rpcUrl: 'https://sepolia.optimism.io',
                blockExplorer: 'https://sepolia-optimism.etherscan.io',
                currency: 'ETH'
            },
            'base-sepolia': {
                chainId: '0x14a34',
                chainName: 'Base Sepolia',
                rpcUrl: 'https://sepolia.base.org',
                blockExplorer: 'https://sepolia.basescan.org',
                currency: 'ETH'
            },
            'ink-sepolia': {
                chainId: '0xaa36a8',
                chainName: 'Ink Sepolia',
                rpcUrl: 'https://sepolia.ink.optimism.io',
                blockExplorer: 'https://sepolia-ink.optimism.io',
                currency: 'ETH'
            }
        };
        this.contractABI = [
            "function depositGas(uint256 amount) external payable",
            "function withdrawGas(uint256 amount) external",
            "function getUserStats(address user) external view returns (uint256 balance, uint256 hits, uint256 score)",
            "function canHit(address user) external view returns (bool)",
            "function recordDrumHit(address user, uint256 accuracy, uint256 combo) external",
            "function getContractStats() external view returns (uint256 totalHits, uint256 totalBalance)",
            "function getDepositLimits() external view returns (uint256 min, uint256 max)",
            "event GasDeposited(address indexed user, uint256 amount, uint256 timestamp)",
            "event GasWithdrawn(address indexed user, uint256 amount, uint256 timestamp)",
            "event DrumHitRecorded(address indexed user, uint256 hitId, uint256 accuracy, uint256 combo, uint256 timestamp)"
        ];
        this.initialize();
    }
    async initialize() {
        if (typeof window.ethereum !== 'undefined') {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());
        } else {
            this.showNotification('Please install MetaMask!', 'error');
        }
    }
    async connectWallet() {
        if (!this.provider) throw new Error('MetaMask not detected');
        await this.provider.send("eth_requestAccounts", []);
        this.isConnected = true;
        await this.initializeContracts();
        await this.updateAllBalances();
        this.showNotification('Wallet connected!', 'success');
    }
    async initializeContracts() {
        for (const [chainKey, address] of Object.entries(this.contractAddresses)) {
            if (address && address !== '0x...') {
                this.contracts[chainKey] = new ethers.Contract(address, this.contractABI, this.signer);
            }
        }
    }
    async switchToNetwork(chainKey) {
        const config = this.chainConfigs[chainKey];
        if (!config) throw new Error(`Unknown chain: ${chainKey}`);
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: config.chainId }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: config.chainId,
                        chainName: config.chainName,
                        rpcUrls: [config.rpcUrl],
                        nativeCurrency: { name: config.currency, symbol: config.currency, decimals: 18 },
                        blockExplorerUrls: [config.blockExplorer]
                    }],
                });
            } else {
                throw switchError;
            }
        }
    }
    async depositGas(chainKey, amountEth) {
        if (!this.isConnected) throw new Error('Wallet not connected');
        const contract = this.contracts[chainKey];
        if (!contract) throw new Error(`Contract not initialized for ${chainKey}`);
        await this.switchToNetwork(chainKey);
        const amountWei = ethers.utils.parseEther(amountEth.toString());
        const tx = await contract.depositGas(amountWei, { value: amountWei });
        this.showNotification(`Depositing ${amountEth} ETH to ${this.chainConfigs[chainKey].chainName}...`, 'info');
        await tx.wait();
        await this.updateBalance(chainKey);
        this.showNotification(`Deposited ${amountEth} ETH to ${this.chainConfigs[chainKey].chainName}!`, 'success');
    }
    async withdrawGas(chainKey, amountEth) {
        if (!this.isConnected) throw new Error('Wallet not connected');
        const contract = this.contracts[chainKey];
        if (!contract) throw new Error(`Contract not initialized for ${chainKey}`);
        await this.switchToNetwork(chainKey);
        const amountWei = ethers.utils.parseEther(amountEth.toString());
        const tx = await contract.withdrawGas(amountWei);
        this.showNotification(`Withdrawing ${amountEth} ETH from ${this.chainConfigs[chainKey].chainName}...`, 'info');
        await tx.wait();
        await this.updateBalance(chainKey);
        this.showNotification(`Withdrew ${amountEth} ETH from ${this.chainConfigs[chainKey].chainName}!`, 'success');
    }
    async updateBalance(chainKey) {
        if (!this.isConnected || !this.contracts[chainKey]) return;
        const address = await this.signer.getAddress();
        const [balance] = await this.contracts[chainKey].getUserStats(address);
        this.userBalances[chainKey] = parseFloat(ethers.utils.formatEther(balance));
        this.updateBalanceDisplay(chainKey);
    }
    async updateAllBalances() {
        for (const chainKey of Object.keys(this.userBalances)) {
            await this.updateBalance(chainKey);
        }
    }
    updateBalanceDisplay(chainKey) {
        const el = document.getElementById(`${chainKey.replace('-','')}Balance`);
        if (el) el.textContent = `${this.userBalances[chainKey].toFixed(3)} ETH`;
    }
    async canHit(chainKey) {
        if (!this.isConnected || !this.contracts[chainKey]) return false;
        const address = await this.signer.getAddress();
        return await this.contracts[chainKey].canHit(address);
    }
    async recordDrumHit(chainKey, accuracy, combo) {
        if (!this.isConnected || !this.contracts[chainKey]) throw new Error('Contract not available');
        await this.switchToNetwork(chainKey);
        const tx = await this.contracts[chainKey].recordDrumHit(await this.signer.getAddress(), accuracy, combo);
        await tx.wait();
        await this.updateBalance(chainKey);
        this.showNotification(`Drum hit recorded on ${this.chainConfigs[chainKey].chainName}!`, 'success');
    }
    async getUserStats(chainKey) {
        if (!this.isConnected || !this.contracts[chainKey]) return { balance: 0, hits: 0, score: 0 };
        const address = await this.signer.getAddress();
        const [balance, hits, score] = await this.contracts[chainKey].getUserStats(address);
        return {
            balance: parseFloat(ethers.utils.formatEther(balance)),
            hits: hits.toNumber(),
            score: score.toNumber()
        };
    }
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 20px; border-radius: 8px; color: white; font-weight: bold; z-index: 1000; max-width: 300px; word-wrap: break-word;`;
        switch (type) {
            case 'success': notification.style.background = 'linear-gradient(45deg, #51cf66, #40c057)'; break;
            case 'error': notification.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)'; break;
            default: notification.style.background = 'linear-gradient(45deg, #00d2ff, #3a7bd5)'; break;
        }
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => { notification.style.opacity = '0'; setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 500); }, 3000);
    }
}
window.SuperchainDrummerWeb3 = SuperchainDrummerWeb3; 