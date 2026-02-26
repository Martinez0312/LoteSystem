// backend/routes/purchasesRoutes.js
const express = require('express');
const router = express.Router();
const purchasesController = require('../controllers/purchasesController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/', verifyToken, purchasesController.createPurchase);
router.get('/my', verifyToken, purchasesController.getMyPurchases);
router.get('/all', verifyToken, isAdmin, purchasesController.getAllPurchases);
router.get('/account', verifyToken, purchasesController.getAccountStatement);
router.get('/account/:clienteId', verifyToken, isAdmin, purchasesController.getAccountStatement);
router.get('/:id', verifyToken, purchasesController.getPurchaseById);

module.exports = router;
