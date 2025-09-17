const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin'); //Admin Panel
const appRoutes = require('./app'); //App User

router.use('/admin', adminRoutes);
router.use('/app', appRoutes);

module.exports = router;