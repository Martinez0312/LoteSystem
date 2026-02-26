// backend/routes/lotsRoutes.js
const express = require('express');
const router = express.Router();
const lotsController = require('../controllers/lotsController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { validateLot } = require('../middleware/validation');

// Rutas públicas
router.get('/', lotsController.getAllLots);
router.get('/stats', verifyToken, isAdmin, lotsController.getLotStats);
router.get('/:id', lotsController.getLotById);

// Rutas protegidas (Admin)
router.post('/', verifyToken, isAdmin, validateLot, lotsController.createLot);
router.put('/:id', verifyToken, isAdmin, validateLot, lotsController.updateLot);
router.patch('/:id/status', verifyToken, isAdmin, lotsController.changeLotStatus);
router.delete('/:id', verifyToken, isAdmin, lotsController.deleteLot);

module.exports = router;
