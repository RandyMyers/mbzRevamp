const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Contacts
 *     description: contacts operations
 */

const { sendContactEmail } = require('../controllers/contactController');

// POST /api/contact

/**
 * @swagger
 * /api/contact/:
 *   post:
 *     summary: Create Item
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', sendContactEmail);

module.exports = router; 
