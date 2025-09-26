const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');


// Create a new category
router.post('/', categoryController.createCategory);

// Get all categories (with pagination and filtering)
router.get('/', categoryController.getCategories);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Update category
router.put('/:id', categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);


// Get categories by store
router.get('/store/:storeId', categoryController.getCategoriesByStore);

// Sync categories with WooCommerce
router.post('/sync/:storeId', categoryController.syncCategoriesWithWooCommerce);

module.exports = router; 
