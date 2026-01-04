import { ethers } from 'ethers';
import ABI from './FreelancePlatform.json';

// ТВОЯ АДРЕСА КОНТРАКТУ (З Hardhat deploy)
export const CONTRACT_ADDRESS = "0x602177891f1804E8c3d0AeB4afb434Cb691FE0ca";

export const getEthereumContract = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, signer);
    
    return { contract, signer, provider };
};