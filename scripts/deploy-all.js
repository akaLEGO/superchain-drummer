const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying Superchain Drummer contracts...");
  console.log("Network:", network.name);
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  // For now, we'll use the deployer as the relayer
  // In production, you'd want a separate relayer service
  const relayerAddress = deployer.address;
  
  console.log("📋 Deploying SuperchainDrummerGasDeposit contract...");
  
  const SuperchainDrummerGasDeposit = await ethers.getContractFactory("SuperchainDrummerGasDeposit");
  const gasDepositContract = await SuperchainDrummerGasDeposit.deploy(relayerAddress);
  
  await gasDepositContract.waitForDeployment();
  const contractAddress = await gasDepositContract.getAddress();
  
  console.log("✅ SuperchainDrummerGasDeposit deployed to:", contractAddress);
  
  // Verify contract on Etherscan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("🔍 Waiting for block confirmations...");
    await gasDepositContract.deploymentTransaction().wait(6);
    
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [relayerAddress],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Contract verification failed:", error.message);
    }
  }
  
  // Log deployment info
  console.log("\n📊 Deployment Summary:");
  console.log("Network:", network.name);
  console.log("Contract Address:", contractAddress);
  console.log("Relayer Address:", relayerAddress);
  console.log("Deployer:", deployer.address);
  
  // Get initial contract stats
  const [totalHits, totalBalance] = await gasDepositContract.getContractStats();
  const [minDeposit, maxDeposit] = await gasDepositContract.getDepositLimits();
  const gasPerHit = await gasDepositContract.gasPerHit();
  
  console.log("\n📈 Contract Configuration:");
  console.log("Min Deposit:", ethers.formatEther(minDeposit), "ETH");
  console.log("Max Deposit:", ethers.formatEther(maxDeposit), "ETH");
  console.log("Gas Per Hit:", gasPerHit.toString(), "gas");
  console.log("Total Hits:", totalHits.toString());
  console.log("Contract Balance:", ethers.formatEther(totalBalance), "ETH");
  
  // Save deployment info to file
  const deploymentInfo = {
    network: network.name,
    contractAddress: contractAddress,
    relayerAddress: relayerAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    configuration: {
      minDeposit: ethers.formatEther(minDeposit),
      maxDeposit: ethers.formatEther(maxDeposit),
      gasPerHit: gasPerHit.toString()
    }
  };
  
  const fs = require('fs');
  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    `${deploymentsDir}/deployment-${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`\n💾 Deployment info saved to: deployments/deployment-${network.name}.json`);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n🔗 Next steps:");
  console.log("1. Update frontend with contract address:", contractAddress);
  console.log("2. Test gas deposits and withdrawals");
  console.log("3. Test drum hit recording");
  console.log("4. Deploy to other networks if needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 