# 🥁 Superchain Drummer

A Taiko-inspired rhythm game with real blockchain transactions across OP Sepolia, Base Sepolia, and Ink Sepolia.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your private key and API keys
   ```

3. **Deploy contracts:**
   ```bash
   npm run deploy:all
   ```

4. **Update frontend:**
   - Replace contract addresses in `frontend/superchain-drummer-web3.js`
   - Deploy `frontend/index.html` to your hosting platform

## 📋 Required Setup

### 1. Private Key
You need a private key with testnet ETH on all three chains:
- **OP Sepolia:** Get ETH from [Superchain Faucet](https://app.optimism.io/bridge)
- **Base Sepolia:** Get ETH from [Base Faucet](https://bridge.base.org/deposit)
- **Ink Sepolia:** Get ETH from [Ink Faucet](https://faucet.ink.optimism.io)

### 2. API Keys (Optional but Recommended)
For contract verification on block explorers:

- **Etherscan API Key:** [Get here](https://etherscan.io/apis)
- **Basescan API Key:** [Get here](https://basescan.org/apis)
- **Inkscan API Key:** [Get here](https://sepolia-ink.optimism.io)

### 3. Environment Variables
Create `.env` file:
```env
# Your private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: Custom RPC URLs
OP_SEPOLIA_RPC_URL=https://sepolia.optimism.io
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
INK_SEPOLIA_RPC_URL=https://sepolia.ink.optimism.io

# Optional: API Keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_key
BASESCAN_API_KEY=your_basescan_key
INKSCAN_API_KEY=your_inkscan_key

# Optional: Gas reporting
REPORT_GAS=true
```

## 🛠 Deployment Commands

```bash
# Deploy to all networks
npm run deploy:all

# Deploy to specific network
npm run deploy:op      # OP Sepolia
npm run deploy:base    # Base Sepolia
npm run deploy:ink     # Ink Sepolia

# Test contracts
npm test

# Compile contracts
npm run compile
```

## 📊 Contract Features

- ✅ Gas deposits with min/max limits (0.001-1 ETH)
- ✅ Secure withdrawals with reentrancy protection
- ✅ Drum hit recording on-chain
- ✅ Relayer system for meta-transactions
- ✅ Emergency functions (pause, emergency withdraw)
- ✅ Event logging for all actions

## 🔒 Security Features

- ✅ ReentrancyGuard protection
- ✅ Ownable access control
- ✅ Pausable emergency stops
- ✅ Input validation and bounds checking

## 🎮 Game Flow

1. **Deploy contracts** on all three chains
2. **Users visit game** and connect MetaMask
3. **Deposit gas** on desired chains (0.01 ETH recommended)
4. **Start drumming** - each perfect hit creates real transactions
5. **Gas automatically deducted** from smart contract balances
6. **No MetaMask popups** during gameplay!

## 🌐 Deployment Options

### Frontend Hosting
- **GitHub Pages:** Free hosting, just push to repo
- **Netlify/Vercel:** Drag & drop deployment
- **IPFS:** Decentralized hosting
- **Traditional web hosting:** Upload index.html

### Smart Contract Deployment
- **Hardhat:** Automated deployment with verification
- **Manual deployment:** Use Remix IDE
- **CI/CD:** GitHub Actions for automated deployment

## 📈 Production Considerations

### Gas Optimization
- Contract uses ~80k gas per drum hit
- Batch multiple hits for efficiency
- Consider Layer 2 solutions for cheaper transactions

### Relayer Service
- Implement backend relayer for true gasless experience
- Use services like OpenZeppelin Defender or Biconomy
- Monitor gas prices and adjust accordingly

### Monitoring
- Track contract balances and usage
- Set up alerts for low balances
- Monitor for any security issues

## 🔧 Development

### Project Structure
```
superchain-drummer/
├── contracts/
│   └── SuperchainDrummerGasDeposit.sol
├── scripts/
│   └── deploy-all.js
├── test/
│   └── SuperchainDrummerGasDeposit.test.js
├── frontend/
│   ├── index.html (original game)
│   └── superchain-drummer-web3.js (enhanced version)
├── hardhat.config.js
├── package.json
└── README.md
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/SuperchainDrummerGasDeposit.test.js

# Run with gas reporting
REPORT_GAS=true npm test
```

## 🚨 Important Notes

1. **Testnet Only:** This is designed for testnets. For mainnet, additional security audits are required.

2. **Gas Deposits:** Users must deposit gas before playing. Recommend 0.01 ETH per chain.

3. **Relayer Setup:** For production, implement a relayer service for true gasless transactions.

4. **Contract Addresses:** After deployment, update the contract addresses in the frontend.

## 📞 Support

- **Issues:** Create GitHub issue
- **Discord:** Join our community
- **Documentation:** Check the docs folder

## 📄 License

MIT License - see LICENSE file for details

---

**Ready to launch?** Follow the deployment steps above and start the rhythm revolution! 🎵 