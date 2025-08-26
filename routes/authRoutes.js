const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");

// ========================================
// GENERAL USER ENDPOINTS (for storehubomale)
// ========================================

// Register user (creates organization and user)
router.post('/register', authController.registerUser);

// Login user (for organization users)
router.post("/login", authController.loginUser);

// ========================================
// SUPER ADMIN ENDPOINTS (separate system)
// ========================================

// Register Super Admin
router.post('/super-admin/register', authController.registerSuperAdmin);

// Login Super Admin
router.post('/super-admin/login', authController.loginSuperAdmin);

// ========================================
// PASSWORD CHANGE ENDPOINTS
// ========================================

// Change password for a regular user (with organizationId)
router.post('/change/password', authController.changePassword);

// Change password for a super admin
router.post('/super-admin/change/password', authController.changePasswordSuperAdmin);

module.exports = router;