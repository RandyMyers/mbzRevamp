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
router.post('/', sendContactEmail);

module.exports = router; 
