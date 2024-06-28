// Web3Context.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LoanPlatformABI from './ABI/CoreLoanPlatform.json';
import BitcoinABI from './ABI/Bitcoin.json';
import USDABI from './ABI/Bitcoin.json';

const Web3Context = createContext();

export const useWeb3 = () => {
  return useContext(Web3Context);
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tUSDT, setUSDT] = useState(null);
  const [tBTC, setBTC] = useState(null);
  const [loading, setLoading] = useState(false);

  const contractAddress = process.env.REACT_APP_DAPP_ADDRESS;
  const usdtAddress = process.env.REACT_APP_USD_ADDRESS;
  const BTCAddress = process.env.REACT_APP_BTC_ADDRESS;

  useEffect(() => {
    if (window.ethereum) {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      setProvider(providerInstance);
    }
  }, []);

  const connectToMetaMask = async () => {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signerInstance = await provider.getSigner();
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const instance = new ethers.Contract(contractAddress, LoanPlatformABI.abi, signerInstance);
      const usdtInstance = new ethers.Contract(usdtAddress, USDABI.abi, signerInstance);
      const BTCInstance = new ethers.Contract(BTCAddress, BitcoinABI.abi, signerInstance);
      setUSDT(usdtInstance);
      setBTC(BTCInstance);
      setSigner(signerInstance);
      setContract(instance);
      setAccount(accounts[0]);
      setIsConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const disconnectFromMetaMask = () => {
    setAccount('');
    setIsConnected(false);
  };

  const depositCollateral = async (amount) => {
    try {
      setLoading(true);
      await tUSDT.approve(contractAddress, ethers.parseUnits(amount.toString(), 6));
      const tx = await contract.depositCollateral(ethers.parseUnits(amount.toString(), 6));
      await tx.wait()
      console.log(`Added: https://scan.test.btcs.network/tx/${tx.hash}`);
      setLoading(false);

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const borrowBTC = async (amount) => {
    try {
      setLoading(true);
      const tx = await contract.borrowBTC(ethers.parseUnits(amount, 6));
      await tx.wait()
      console.log(`Added: https://scan.test.btcs.network/tx/${tx.hash}`);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const repayLoan = async () => {
    try {
      setLoading(true);
      const tx = await contract.repayLoan();
      await tx.wait()
      console.log(`Added: https://scan.test.btcs.network/tx/${tx.hash}`);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const depositBTC = async (amount) => {
    try {
      setLoading(true);
      await tBTC.approve(contractAddress, ethers.parseUnits(amount.toString(), 6))
      const tx = await contract.depositBTC(ethers.parseUnits(amount, 6));
      await tx.wait()
      console.log(`Added: https://scan.test.btcs.network/tx/${tx.hash}`);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const withdrawBTC = async (amount) => {
    try {
      setLoading(true);
      const tx = await contract.withdrawBTC(ethers.parseUnits(amount, 6));
      await tx.wait()
      console.log(`Added: https://scan.test.btcs.network/tx/${tx.hash}`);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <Web3Context.Provider value={{ ethers, account, isConnected, connectToMetaMask, disconnectFromMetaMask, loading, contract, depositCollateral, borrowBTC, repayLoan, depositBTC, withdrawBTC, tBTC, tUSDT }}>
      {children}
    </Web3Context.Provider>
  );
};
