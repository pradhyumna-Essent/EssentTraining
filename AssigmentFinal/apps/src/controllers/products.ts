import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from 'yup';
import Accounts from './accounts';
import { Product, Products } from '../Interface/products';

const addProducts = (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    const { title, description, price, stock } = req.body;

    // Validate the request body
    if (!title) {
      throw new ValidationError('The product title is required.');
    }

    if (price <= 0) {
      throw new ValidationError('The product price must be a positive number.');
    }

    if (stock <= 0) {
      throw new ValidationError('The product stock must be a positive number.');
    }

    // Create the new product
    const productDetails: Product = {
      id,
      title,
      description,
      price,
      stock,
    };

    Products.push(productDetails);

    // Send the successful response
    res.status(201).json(productDetails);
  } catch (error) {
    // Handle different types of errors
    if (error instanceof ValidationError) {
      res.status(400).json(error.errors);
    } else {
      // Unexpected error
      console.error(error);
      res
        .status(500)
        .json(
          'Unable to process your request at this movement. Please try again later.'
        );
    }
  }
};

const getAllProducts = (req: Request, res: Response) => {
  try {
    const productsList = JSON.parse(JSON.stringify(Products));

    // Check if any purchase happened
    productsList.forEach((productcopy) => {
      const numberofSoldStocks = Accounts.getSoldProductCount(
        productcopy.id,
        Number(req.headers['simulated-day'])
      );

      // Update the product stock
      productcopy.stock -= numberofSoldStocks;
    });

    // Send the successful response
    res.status(200).json(productsList);
  } catch (error) {
    // Unexpected error
    console.error(error);
    res
      .status(500)
      .json(
        'Unable to process your request at this movement. Please try again later.'
      );
  }
};

const getproductById = (req: Request, res: Response) => {
  try {
    let productsList = [];
    productsList = JSON.parse(JSON.stringify(Products));

    const { productId } = req.params;
    const productdtls = productsList.find(
      (product) => product.id === productId
    );

    if (!productdtls) {
      // Product not found
      res.status(404).send('None');
    } else {
      const numberofSoldStocks = Accounts.getSoldProductCount(
        productdtls.id,
        Number(req.headers['simulated-day'])
      );

      // Update the product stock
      productdtls.stock -= numberofSoldStocks;

      // Send the successful response
      res.status(200).json(productdtls);
    }
  } catch (error) {
    // Unexpected error
    console.error(error);
    res
      .status(500)
      .json(
        'Unable to process your request at this movement. Please try again later.'
      );
  }
};

export default {
  addProducts,
  getAllProducts,
  getproductById,
};
