const express = require('express');
const { getAllUsers, getUserById, updateUserRole, deleteUser, getSystemSettings, updateSystemSettings } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/', getAllUsers);
router.get('/settings', getSystemSettings);
router.patch('/settings', updateSystemSettings);

router.get('/:id', getUserById);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;
