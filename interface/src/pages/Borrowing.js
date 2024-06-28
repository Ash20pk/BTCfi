// pages/Borrowing.js
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../Web3Context';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputRightAddon,
  HStack,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useColorModeValue,
  Container,
  Progress,
} from '@chakra-ui/react';

export const Borrowing = () => {
  const { contract, depositCollateral, borrowBTC, account, ethers, loading } = useWeb3();
  const [collateral, setCollateral] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [userCollateral, setUserCollateral] = useState(0);
  const [availableToBorrow, setAvailableToBorrow] = useState(0);
  const [borrowLimit, setBorrowLimit] = useState(0);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (contract) {
      const fetchUserData = async () => {
        const collateral = ethers.formatUnits((await contract.getUserCollateral(account.toString())), 18);
        console.log('Collateral', collateral);
        setUserCollateral(collateral);
        const limit = (collateral * 0.8).toFixed(2);
        setBorrowLimit(limit);
        const borrowed = await contract.getUserBorrowed(account.toString());
        setAvailableToBorrow(limit - (Number(borrowed)).toFixed(2));
      };
      fetchUserData();
      // Set up an interval to fetch data every 30 seconds
      const interval = setInterval(fetchUserData, 30000);
      return () => clearInterval(interval);
    }
  }, [contract]);

  const handleDepositCollateral = async () => {
    try {
      await depositCollateral(ethers.parseUnits(collateral.toString(), "ether"));
      console.log('Deposit', collateral);
      if(!loading) {
      toast({
        title: "Collateral deposited",
        description: `You have successfully deposited ${collateral} USDT as collateral`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setCollateral('');
    }
    } catch (error) {
      toast({
        title: "Deposit failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleBorrow = async () => {
    try {
      await borrowBTC(ethers.parseUnits(loanAmount.toString(), "ether"));
      console.log(loanAmount);
      if(!loading) {
      toast({
        title: "Borrow successful",
        description: `You have successfully borrowed ${loanAmount} BTC`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setLoanAmount('');
    }
    } catch (error) {
      toast({
        title: "Borrow failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const borrowPercentage = (borrowLimit - availableToBorrow) / borrowLimit * 100;

  return (
    <Container maxW="container.xl">
      <VStack spacing={8} align="stretch">
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          <Stat
            bg={bgColor}
            borderRadius="lg"
            boxShadow="md"
            p={5}
            border="1px"
            borderColor={borderColor}
          >
            <StatLabel fontSize="lg">Your Collateral</StatLabel>
            <StatNumber fontSize="3xl">{userCollateral.toLocaleString()} USDT</StatNumber>
            <StatHelpText>Total deposited</StatHelpText>
          </Stat>
          
          <Stat
            bg={bgColor}
            borderRadius="lg"
            boxShadow="md"
            p={5}
            border="1px"
            borderColor={borderColor}
          >
            <StatLabel fontSize="lg">Borrow Limit</StatLabel>
            <StatNumber fontSize="3xl">{borrowLimit.toLocaleString()} BTC</StatNumber>
            <StatHelpText>80% of collateral</StatHelpText>
          </Stat>

          <Stat
            bg={bgColor}
            borderRadius="lg"
            boxShadow="md"
            p={5}
            border="1px"
            borderColor={borderColor}
          >
            <StatLabel fontSize="lg">Available to Borrow</StatLabel>
            <StatNumber fontSize="3xl">{availableToBorrow.toLocaleString()} BTC</StatNumber>
            <StatHelpText>Remaining borrow limit</StatHelpText>
          </Stat>
        </SimpleGrid>

        <Box
          bg={bgColor}
          borderRadius="lg"
          boxShadow="md"
          p={6}
          border="1px"
          borderColor={borderColor}
        >
          <VStack spacing={4}>
            <Text fontSize="xl" fontWeight="bold">Deposit Collateral</Text>
            <InputGroup size="lg">
              <Input
                type="number"
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                placeholder="Amount in USDT"
              />
              <InputRightAddon children="USDT" />
            </InputGroup>
            <Button colorScheme="green" onClick={handleDepositCollateral} width="100%">
              Deposit Collateral
            </Button>
          </VStack>
        </Box>

        <Box
          bg={bgColor}
          borderRadius="lg"
          boxShadow="md"
          p={6}
          border="1px"
          borderColor={borderColor}
        >
          <VStack spacing={4}>
            <Text fontSize="xl" fontWeight="bold">Borrow BTC</Text>
            <InputGroup size="lg">
              <Input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="Amount in BTC"
              />
              <InputRightAddon children="BTC" />
            </InputGroup>
            <Button colorScheme="blue" onClick={handleBorrow} width="100%">
              Borrow BTC
            </Button>
          </VStack>
        </Box>

        <Box>
          <Text mb={2}>Borrow Utilization</Text>
          <Progress value={borrowPercentage} colorScheme="blue" height="32px" borderRadius="md" />
        </Box>
      </VStack>
    </Container>
  );
};