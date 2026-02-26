// backend/routes/usersRoutes.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/dashboard', verifyToken, isAdmin, usersController.getDashboardStats);
router.get('/', verifyToken, isAdmin, usersController.getAllUsers);
router.get('/:id', verifyToken, isAdmin, usersController.getUserById);
router.post('/', verifyToken, isAdmin, usersController.createUser);
router.put('/:id', verifyToken, isAdmin, usersController.updateUser);
router.patch('/:id/toggle', verifyToken, isAdmin, usersController.toggleUserStatus);

module.exports = router;
