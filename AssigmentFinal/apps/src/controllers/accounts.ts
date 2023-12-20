import { Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';

import { Products, Product } from '../Interface/products';
import {
  Deposit,
  Account,
  AccontResponse,
  Purchases,
} from '../Interface/accounts';

let Accounts: Account[] = [];

const createAccount = (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is empty' });
    }
    const id = uuidv4();
    const { name } = req.body;
    const balance = 0;
    Accounts.push({ id, name, balance });
    return res.status(201).json({ id, name, balance });
  } catch (error) {
    return res
      .status(500)
      .json(
        'Unable to process your request at this movement. Please try again later.'
      );
  }
};

const getAllAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const allAccountResponses = Accounts.map((account) => {
      return {
        id: account.id,
        name: account.name,
        balance: account.balance,
      };
    });

    res.status(200).json(allAccountResponses);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountId } = req.params;

    const account = Accounts.find((account) => account.id === accountId);

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
    }

    const accountResponse: AccontResponse = {
      id: account.id,
      name: account.name,
      balance: account.balance,
    };

    res.status(200).json(accountResponse);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Validating the input request for register deposit
const validateInputdeposit = (req: Request): boolean => {
  const { accountId } = req.params;
  const { amount } = req.body;
  const SimulatedDayDeposit = Number(req.headers['simulated-day']);

  if (
    Math.sign(amount) !== 1 ||
    Math.sign(SimulatedDayDeposit) !== 1 ||
    !Accounts.find((account) => account.id === accountId)
  ) {
    return false;
  }

  return true;
};

const registerDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!validateInputdeposit(req)) {
      res.status(400).json({ message: 'Invalid input' });
    }

    const { accountId } = req.params;
    const { amount } = req.body;
    const SimulatedDayDeposit = Number(req.headers['simulated-day']);

    const account = Accounts.find((account) => account.id === accountId);

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
    }

    if (!account.depositDetails) {
      account.depositDetails = [];
    }

    const depositDetails: Deposit = {
      id: uuidv4(),
      amount,
      SimulatedDayDeposit,
      depositdate: new Date(),
      simulatedDayDeposit: 0,
    };

    account.depositDetails.push(depositDetails);

    // Calculate the balance on the deposit day
    const balanceOnDepositDay = account.depositDetails.reduce(
      (total, deposit) => {
        if (deposit.simulatedDayDeposit + 1 <= SimulatedDayDeposit) {
          return total + deposit.amount;
        }
        return account.balance;
      },
      0
    );

    // Update the account balance
    account.balance = balanceOnDepositDay;

    // Construct the response
    const registerDepositRes: AccontResponse = {
      id: account.id,
      name: account.name,
      balance: balanceOnDepositDay,
    };

    res.status(201).json(registerDepositRes);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSoldProductCount = (
  productId: string,
  simulationDay: number
): number => {
  // Check if the Accounts array is empty
  if (Accounts.length === 0) {
    return 0;
  }

  // Iterate over the Accounts array and count the number of products sold
  let numberOfProductsSold = 0;
  Accounts.forEach((account) => {
    if (account.purchaseDetails !== undefined) {
      account.purchaseDetails.forEach((purchase) => {
        if (
          purchase.productId === productId &&
          purchase.simulatedDayPurchase < simulationDay
        ) {
          numberOfProductsSold += 1;
        }
      });
    }
  });

  // Return the number of products sold
  return numberOfProductsSold;
};

const validateStock = (id: string, simmulationDay: number): boolean => {
  // Get the sold stock for the given product and simulation day
  const soldStock = getSoldProductCount(id, simmulationDay);

  // Get the product stock
  const productStock = Products.find((product) => product.id === id).stock;

  // Return true if the product has enough stock, false otherwise
  return productStock - soldStock > 0;
};

const validateFunds = async (
  accountId: string,
  simulationDay: number,
  productId: string
): Promise<boolean> => {
  try {
    // Get the account
    const account = Accounts.find((Account) => Account.id === accountId);

    // Check if the account has any deposit details
    if (!account.depositDetails) {
      return false;
    }

    // Calculate the deposit balance on the purchase day
    const depositBalanceOnPurchaseDay = account.depositDetails.reduce(
      (total, depositDtl) => {
        if (depositDtl.SimulatedDayDeposit + 1 <= simulationDay) {
          return total + depositDtl.amount;
        }
        return account.balance;
      },
      0
    );

    // Calculate the total amount purchased
    let amountPurchased = 0;
    if (account.purchaseDetails !== undefined) {
      amountPurchased = account.purchaseDetails.reduce(
        (total, purchaseDtl) =>
          total +
          Products.find(
            (Product: { id: string }) => Product.id === purchaseDtl.productId
          ).price,
        0
      );
    }

    // Get the product price
    const productPrice = Products.find(
      (product: { id: string }) => product.id === productId
    ).price;

    // Return true if the account has enough funds, false otherwise
    return productPrice <= depositBalanceOnPurchaseDay - amountPurchased;
  } catch (error) {
    // Handle the error
    console.error('Error validating funds:', error);
    return false;
  }
};

// Legal Purchase check
const checkLegalPurchase = (
  accountId: string,
  simulationDay: number
): boolean => {
  try {
    // Get the account
    const account = Accounts.find((Account) => Account.id === accountId);

    // Check if the account has any purchase details
    if (!account.purchaseDetails) {
      return true;
    }

    // Sort the purchase details based on time
    const purchaseDtls = account.purchaseDetails.sort(
      (a: Purchases, b: Purchases) =>
        b.SimulatedDayPurchase - a.SimulatedDayPurchase
    );

    // Check if the most recent purchase was made on the same day or before the
    // simulation day
    return purchaseDtls[0].simulatedDayPurchase <= simulationDay;
  } catch (error) {
    // Handle the error
    console.error('Error checking legal purchase:', error);
    return false;
  }
};

const validateInputPurchase = async (req: Request): Promise<number> => {
  try {
    // Validate the purchase product
    const purchaseProduct = Products.find(
      (product) => product.id === req.body.productId
    );
    if (!purchaseProduct) {
      return 400;
    }

    // Validate the purchase simulation day
    const purchaseSimulationDay = Number(req.headers['simulated-day']);
    if (!purchaseSimulationDay || purchaseSimulationDay < 1) {
      return 400;
    }

    // Validate the account
    const account = Accounts.find(
      (account) => account.id === req.params.accountId
    );
    if (!account) {
      return 400;
    }

    // Validate the stock
    if (!validateStock(purchaseProduct.id, purchaseSimulationDay)) {
      return 409;
    }

    // Validate the funds
    if (
      !(await validateFunds(
        account.id,
        purchaseSimulationDay,
        purchaseProduct.id
      ))
    ) {
      return 409;
    }

    // Validate the legal purchase
    if (!checkLegalPurchase(account.id, purchaseSimulationDay)) {
      return 400;
    }

    // All validations passed
    return 200;
  } catch (error) {
    // Handle the error
    console.error('Error validating purchase input:', error);
    return 500;
  }
};

const registerPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate the purchase input
    const purchaseValidationStatus = await validateInputPurchase(req);
    if (purchaseValidationStatus !== 200) {
      res.status(purchaseValidationStatus).json({
        message: 'Purchase failed. Please check your input and try again.',
      });
    }

    // Get the account
    const account = Accounts.find(
      (account) => account.id === req.params.accountId
    );

    // Create a new purchase detail
    const purchaseDetails: Purchases = {
      productId: req.body.productId,
      SimulatedDayPurchase: Number(req.headers['simulated-day']),
      simulatedDayPurchase: 0,
    };

    // Add the purchase detail to the account
    account.purchaseDetails.push(purchaseDetails);

    // Save the account
    const updatedAccounts = [...Accounts];
    updatedAccounts[Accounts.indexOf(account)] = account;
    Accounts = updatedAccounts;

    // Return a success response
    res.status(201).json({ message: 'Purchase successful' });
  } catch (error) {
    // Handle the error
    console.error('Error registering purchase:', error);
    res.status(500).json({
      message:
        'Unable to process your request at this movement. Please try again later.',
    });
  }
};

export default {
  createAccount,
  getAccount,
  getAllAccounts,
  registerDeposit,
  registerPurchase,
  getSoldProductCount,
  Accounts,
};
