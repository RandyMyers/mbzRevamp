const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Audit Logs
 *     description: audit logs operations
 */

const auditLogController = require('../controllers/auditLogController');

router.post('/', auditLogController.createLog);
router.get('/', auditLogController.getLogs);
router.get('/organization/:organizationId', auditLogController.getLogsByOrganization);
router.get('/:logId', auditLogController.getLogById);
router.delete('/:logId', auditLogController.deleteLog);

module.exports = router; 
