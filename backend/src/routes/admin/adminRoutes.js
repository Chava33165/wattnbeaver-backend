const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middlewares/auth');
const { getAllUsers, getUserById, createAdminUser, updateUser, deleteUser, getSystemStats, getServerHealth } = require('../../controllers/admin/adminController');

router.use(authMiddleware, adminOnly);

router.get('/users',               getAllUsers);
router.post('/users',              createAdminUser);
router.get('/users/:id',           getUserById);
router.put('/users/:id',           updateUser);
router.delete('/users/:id',        deleteUser);

// Workaround para Cloudflare WAF que bloquea DELETE y PUT
router.post('/users/:id/delete',   deleteUser);
router.post('/users/:id/update',   updateUser);

router.get('/stats',        getSystemStats);
router.get('/server',       getServerHealth);

module.exports = router;
