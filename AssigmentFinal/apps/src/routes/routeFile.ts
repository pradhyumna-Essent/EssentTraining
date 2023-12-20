import express from 'express';
import controllers from '../controllers/accounts';
import controllerss from '../controllers/products';

const router = express.Router();
export = router;

router.post('/accounts', controllers.createAccount);
router.get('/accounts', controllers.getAllAccounts);
router.get('/accounts/:accountId', controllers.getAccount);
router.post('/accounts/:accountId/deposits', controllers.registerDeposit);
router.post('/accounts/:accountId/purchases', controllers.registerPurchase);

router.post('/products', controllerss.addProducts);
router.get('/products', controllerss.getAllProducts);
router.get('/products/:productId', controllerss.getproductById);
