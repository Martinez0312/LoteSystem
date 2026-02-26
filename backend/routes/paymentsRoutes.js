// backend/routes/paymentsRoutes.js
const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');

router.post('/', verifyToken, validatePayment, paymentsController.createPayment);
router.get('/my', verifyToken, paymentsController.getMyPayments);
router.get('/all', verifyToken, isAdmin, paymentsController.getAllPayments);
router.get('/:id/receipt', verifyToken, paymentsController.downloadReceipt);

module.exports = router;
