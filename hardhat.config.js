require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "op-sepolia": {
      url: process.env.OP_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155420,
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia-optimistic.etherscan.io",
        },
      },
    },
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.basescan.org",
        },
      },
    },
    "ink-sepolia": {
      url: process.env.INK_SEPOLIA_RPC_URL || "https://sepolia.ink.optimism.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155421,
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia-ink.optimism.io",
        },
      },
    },
    hardhat: {
      chainId: 31337,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  etherscan: {
    apiKey: {
      "op-sepolia": process.env.ETHERSCAN_API_KEY || "",
      "base-sepolia": process.env.BASESCAN_API_KEY || "",
      "ink-sepolia": process.env.INKSCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
}; 