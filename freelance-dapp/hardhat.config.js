require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      // URL вашого RPC провайдера (Alchemy або Infura)
      url: process.env.SEPOLIA_URL || "", 
      // Приватний ключ вашого гаманця MetaMask
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], 
    },
  },
  paths: {
    artifacts: "./src/artifacts", // Щоб React бачив скомпільований JSON
  }
};