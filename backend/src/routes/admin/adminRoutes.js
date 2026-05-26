const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middlewares/auth');
const { getAllUsers, getUserById, updateUser, deleteUser, getSystemStats, getServerHealth } = require('../../controllers/admin/adminController');

router.use(authMiddleware, adminOnly);

router.get('/users',        getAllUsers);
router.get('/users/:id',    getUserById);
router.put('/users/:id',    updateUser);
router.delete('/users/:id', deleteUser);
router.get('/stats',        getSystemStats);
router.get('/server',       getServerHealth);

module.exports = router;
