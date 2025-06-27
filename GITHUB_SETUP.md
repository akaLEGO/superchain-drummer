# 🚀 GitHub Repository Setup Guide

## 📋 Prerequisites
- GitHub account
- Git installed locally
- Node.js and npm installed
- MetaMask wallet with testnet ETH

## 🔧 Step-by-Step Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `superchain-drummer`
4. Description: `Taiko-inspired rhythm game with real blockchain transactions`
5. Make it **Public** (for GitHub Pages)
6. **Don't** initialize with README (we already have one)
7. Click "Create repository"

### 2. Connect Local Repository to GitHub

```bash
# Add the remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/superchain-drummer.git

# Push to GitHub
git push -u origin main
```

### 3. Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

#### Required Secrets:
- `PRIVATE_KEY` - Your wallet's private key (without 0x prefix)
- `ETHERSCAN_API_KEY` - Etherscan API key
- `BASESCAN_API_KEY` - Basescan API key  
- `INKSCAN_API_KEY` - Inkscan API key

#### Optional Secrets:
- `IPFS_KEY` - IPFS API key (for decentralized hosting)
- `IPFS_SECRET` - IPFS API secret

### 4. Enable GitHub Pages

1. Go to Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `gh-pages`
4. Folder: `/ (root)`
5. Click "Save"

### 5. Enable GitHub Actions

1. Go to Actions tab
2. Click "Enable Actions"
3. The CI/CD pipeline will run automatically on pushes

## 🔒 Security Configuration

### Environment Protection
1. Go to Settings → Environments
2. Create environment: `testnet`
3. Add protection rules:
   - Required reviewers: Add yourself
   - Wait timer: 0 minutes
   - Deployment branches: `main`

### Branch Protection
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators

## 🎮 Game Deployment

### Automatic Deployment
The GitHub Actions workflow will automatically:
1. Run security audits
2. Test smart contracts
3. Deploy contracts to testnets
4. Deploy frontend to GitHub Pages

### Manual Deployment
If you prefer manual deployment:

```bash
# Deploy contracts
npm run deploy:all

# Update frontend with contract addresses
# Then push to trigger GitHub Pages deployment
git add .
git commit -m "Update contract addresses"
git push
```

## 📊 Repository Features

### ✅ What's Included:
- **CI/CD Pipeline** - Automated testing and deployment
- **Security Auditing** - Automated security checks
- **Issue Templates** - Structured bug reports and feature requests
- **PR Templates** - Comprehensive pull request guidelines
- **GitHub Pages** - Automatic frontend hosting
- **IPFS Deployment** - Decentralized hosting option

### 🔄 Workflow Triggers:
- **Push to main** - Full CI/CD pipeline
- **Pull Request** - Security audit and testing
- **Manual trigger** - Available in Actions tab

## 🛠️ Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/new-feature
```

### 2. Make Changes
```bash
# Make your changes
npm run security:audit  # Check for security issues
npm test               # Run tests
```

### 3. Create Pull Request
```bash
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

### 4. Review and Merge
- GitHub Actions will run automatically
- Review the security audit results
- Merge when all checks pass

## 🚨 Important Notes

### Security:
- **Never commit `.env` files** - They're in `.gitignore`
- **Use test wallets only** - Never use mainnet wallets
- **Rotate API keys regularly** - Keep them secure

### Deployment:
- **Testnets only** - This is for testing purposes
- **Monitor gas costs** - Testnet ETH is free but limited
- **Update contract addresses** - After deployment, update frontend

### Maintenance:
- **Regular security audits** - Run `npm run security:check`
- **Update dependencies** - Keep packages current
- **Monitor GitHub Actions** - Check for failures

## 🔗 Useful Links

- **Repository:** `https://github.com/YOUR_USERNAME/superchain-drummer`
- **Game URL:** `https://YOUR_USERNAME.github.io/superchain-drummer`
- **Issues:** `https://github.com/YOUR_USERNAME/superchain-drummer/issues`
- **Actions:** `https://github.com/YOUR_USERNAME/superchain-drummer/actions`

## 🎉 You're Ready!

Your Superchain Drummer repository is now set up with:
- ✅ Automated testing and deployment
- ✅ Security auditing
- ✅ Professional issue templates
- ✅ GitHub Pages hosting
- ✅ CI/CD pipeline

**Next steps:**
1. Deploy your contracts
2. Update contract addresses in frontend
3. Share your game URL
4. Start the rhythm revolution! 🥁 