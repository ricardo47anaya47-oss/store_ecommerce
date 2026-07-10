const express = require('express');
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

// Rutas protegidas (admin)
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
