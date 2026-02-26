// backend/routes/stagesRoutes.js
const express = require('express');
const router = express.Router();
const stagesController = require('../controllers/stagesController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', stagesController.getAllStages);
router.post('/', verifyToken, isAdmin, stagesController.createStage);
router.put('/:id', verifyToken, isAdmin, stagesController.updateStage);

module.exports = router;
