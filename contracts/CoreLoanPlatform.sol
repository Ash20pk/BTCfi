// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CoreLoanPlatform is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable tUSDT;
    IERC20 public immutable tCORE;

    uint256 public constant COLLATERAL_RATIO = 150; // 150% collateralization
    uint256 public constant BORROWABLE_RATIO = 80; // 80% of collateral can be borrowed
    uint256 public constant INTEREST_RATE = 5; // 5% interest rate
    uint256 public constant LOAN_DURATION = 30 days;

    struct Loan {
        uint256 amount;
        uint256 collateral;
        uint256 timestamp;
        bool active;
    }

    mapping(address => Loan) public loans;
    mapping(address => uint256) public userCollateral;
    mapping(address => uint256) public lenderBalances;

    event LoanTaken(address indexed borrower, uint256 amount, uint256 collateral);
    event LoanRepaid(address indexed borrower, uint256 amount, uint256 interest);
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event CoreDeposited(address indexed lender, uint256 amount);
    event CoreWithdrawn(address indexed lender, uint256 amount);

    constructor(address _tUSDT, address _tCORE) Ownable(msg.sender) {
        require(_tUSDT != address(0) && _tCORE != address(0), "Invalid token addresses");
        tUSDT = IERC20(_tUSDT);
        tCORE = IERC20(_tCORE);
    }

    function depositCollateral(uint256 amount) external  {
        require(amount > 0, "Amount must be greater than 0");
        tUSDT.safeTransferFrom(msg.sender, address(this), amount);
        userCollateral[msg.sender] += amount;
        emit CollateralDeposited(msg.sender, amount);
    }

    function withdrawCollateral(uint256 amount) external  {
        require(amount > 0, "Amount must be greater than 0");
        require(userCollateral[msg.sender] >= amount, "Insufficient collateral");
        
        uint256 borrowedAmount = loans[msg.sender].active ? loans[msg.sender].amount : 0;
        uint256 requiredCollateral = (borrowedAmount * COLLATERAL_RATIO) / 100;
        require(userCollateral[msg.sender] - amount >= requiredCollateral, "Withdrawal would undercollateralize loan");

        userCollateral[msg.sender] -= amount;
        tUSDT.safeTransfer(msg.sender, amount);
        emit CollateralWithdrawn(msg.sender, amount);
    }

    function borrowCORE(uint256 amount) external  {
        require(amount > 0, "Amount must be greater than 0");
        require(!loans[msg.sender].active, "Existing loan must be repaid first");

        uint256 requiredCollateral = (amount * COLLATERAL_RATIO) / 100;
        require(userCollateral[msg.sender] >= requiredCollateral, "Insufficient collateral");
        
        uint256 maxBorrowable = (userCollateral[msg.sender] * BORROWABLE_RATIO) / 100;
        require(amount <= maxBorrowable, "Borrow amount exceeds limit");

        require(tCORE.balanceOf(address(this)) >= amount, "Insufficient tCORE in contract");

        loans[msg.sender] = Loan(amount, requiredCollateral, block.timestamp, true);
        tCORE.safeTransfer(msg.sender, amount);

        emit LoanTaken(msg.sender, amount, requiredCollateral);
    }

    function repayLoan() external  {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No active loan");
        
        uint256 interest = (loan.amount * INTEREST_RATE * (block.timestamp - loan.timestamp)) / (100 * 365 days);
        uint256 totalRepayment = loan.amount + interest;

        tCORE.safeTransferFrom(msg.sender, address(this), totalRepayment);

        loan.active = false;

        emit LoanRepaid(msg.sender, loan.amount, interest);
    }

    function depositCORE(uint256 amount) external  {
        require(amount > 0, "Amount must be greater than 0");
        tCORE.safeTransferFrom(msg.sender, address(this), amount);
        lenderBalances[msg.sender] += amount;
        emit CoreDeposited(msg.sender, amount);
    }

    function withdrawCORE(uint256 amount) external  {
        require(amount > 0, "Amount must be greater than 0");
        require(lenderBalances[msg.sender] >= amount, "Insufficient balance");
        lenderBalances[msg.sender] -= amount;
        tCORE.safeTransfer(msg.sender, amount);
        emit CoreWithdrawn(msg.sender, amount);
    }

    function getBorrowableAmount(address user) external view returns (uint256) {
        return (userCollateral[user] * BORROWABLE_RATIO) / 100;
    }

    function getLoanDetails(address borrower) external view returns (Loan memory) {
        return loans[borrower];
    }

    function getLenderBalance(address lender) external view returns (uint256) {
        return lenderBalances[lender];
    }

    function getTotalStaked() external view returns (uint256) {
        return tUSDT.balanceOf(address(this));
    }

    function getTotalBorrowed() external view returns (uint256) {
        return tCORE.totalSupply() - tCORE.balanceOf(address(this));
    }

    function getCurrentApy() external pure returns (uint256) {
        return INTEREST_RATE;
    }

    function getUserCollateral(address user) external view returns (uint256) {
        return userCollateral[user];
    }

    function getUserBorrowed(address user) external view returns (uint256) {
        return loans[user].amount;
    }

    function getUserStaked(address user) external view returns (uint256) {
        return userCollateral[user];
    }
}