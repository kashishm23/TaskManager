const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Mount protect middleware so only authenticated users can fetch stats
router.get('/stats', protect, getDashboardStats);

module.exports = router;
