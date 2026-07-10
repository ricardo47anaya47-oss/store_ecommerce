const express = require('express');
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de órdenes requieren autenticación
router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;
