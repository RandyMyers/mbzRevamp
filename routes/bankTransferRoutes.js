const express = require('express');
const router = express.Router();
const bankTransferController = require('../controllers/bankTransferController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Bank Transfer
 *     description: Bank transfer payment endpoints
 */

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/bank-transfer/details:
 *   get:
 *     summary: Get bank details and customer reference for transfer
 *     tags: [Bank Transfer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank details and customer reference
 */
router.get('/details', protect, bankTransferController.getBankDetails);

/**
 * @swagger
 * /api/bank-transfer/upload-receipt:
 *   post:
 *     summary: Upload payment receipt
 *     tags: [Bank Transfer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Receipt uploaded successfully
 */
router.post('/upload-receipt', protect, bankTransferController.uploadReceipt);

/**
 * @swagger
 * /api/bank-transfer/submit:
 *   post:
 *     summary: Submit bank transfer with receipt
 *     tags: [Bank Transfer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId, amount, receiptUrl]
 *             properties:
 *               planId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               billingInterval:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly]
 *               receiptUrl:
 *                 type: string
 *               bankName:
 *                 type: string
 *               transferDate:
 *                 type: string
 *                 format: date
 *               senderName:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transfer submitted successfully
 */
router.post('/submit', protect, bankTransferController.submitBankTransfer);

/**
 * @swagger
 * /api/bank-transfer/history:
 *   get:
 *     summary: Get user's bank transfer history
 *     tags: [Bank Transfer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's transfers
 */
router.get('/history', protect, bankTransferController.getUserTransfers);

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/bank-transfer/admin/pending:
 *   get:
 *     summary: Get all pending bank transfers (Admin)
 *     tags: [Bank Transfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of pending transfers
 */
router.get('/admin/pending', protect, restrictTo('super-admin', 'admin'), bankTransferController.getPendingTransfers);

/**
 * @swagger
 * /api/bank-transfer/admin/all:
 *   get:
 *     summary: Get all bank transfers with filters (Admin)
 *     tags: [Bank Transfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, all]
 *     responses:
 *       200:
 *         description: List of transfers
 */
router.get('/admin/all', protect, restrictTo('super-admin', 'admin'), bankTransferController.getAllTransfers);

/**
 * @swagger
 * /api/bank-transfer/admin/{id}:
 *   get:
 *     summary: Get transfer details (Admin)
 *     tags: [Bank Transfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer details
 */
router.get('/admin/:id', protect, restrictTo('super-admin', 'admin'), bankTransferController.getTransferDetails);

/**
 * @swagger
 * /api/bank-transfer/admin/{id}/approve:
 *   post:
 *     summary: Approve bank transfer (Admin)
 *     tags: [Bank Transfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer approved
 */
router.post('/admin/:id/approve', protect, restrictTo('super-admin', 'admin'), bankTransferController.approveTransfer);

/**
 * @swagger
 * /api/bank-transfer/admin/{id}/reject:
 *   post:
 *     summary: Reject bank transfer (Admin)
 *     tags: [Bank Transfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer rejected
 */
router.post('/admin/:id/reject', protect, restrictTo('super-admin', 'admin'), bankTransferController.rejectTransfer);

module.exports = router;
