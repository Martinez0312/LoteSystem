// backend/routes/pqrsRoutes.js
const express = require('express');
const router = express.Router();
const pqrsController = require('../controllers/pqrsController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { validatePQRS } = require('../middleware/validation');

router.post('/', verifyToken, validatePQRS, pqrsController.createPQRS);
router.get('/my', verifyToken, pqrsController.getMyPQRS);
router.get('/all', verifyToken, isAdmin, pqrsController.getAllPQRS);
router.get('/stats', verifyToken, isAdmin, pqrsController.getPQRSStats);
router.get('/:id', verifyToken, pqrsController.getPQRSById);
router.put('/:id', verifyToken, isAdmin, pqrsController.updatePQRS);

module.exports = router;
