const hre = require("hardhat");

async function main() {
  console.log("Deploying contract...");

  const FreelancePlatform = await hre.ethers.getContractFactory("FreelancePlatform");
  const platform = await FreelancePlatform.deploy();

  await platform.waitForDeployment();

  const address = await platform.getAddress();

  console.log(`FreelancePlatform deployed to: ${address}`);
  console.log("Збережіть цю адресу, вона знадобиться для React!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});