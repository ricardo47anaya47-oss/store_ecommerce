const pool = require('../config/database');

// Crear orden
exports.createOrder = async (req, res) => {
  try {
    const { items, total } = req.body;
    const userId = req.user.id;
    const connection = await pool.getConnection();

    // Crear orden
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
      [userId, total, 'pending']
    );

    const orderId = orderResult.insertId;

    // Crear items de la orden
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );

      // Actualizar stock del producto
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Orden creada',
      orderId,
    });
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden',
    });
  }
};

// Obtener órdenes del usuario
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const connection = await pool.getConnection();

    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Obtener items de cada orden
    for (let order of orders) {
      const [items] = await connection.query(
        `SELECT oi.*, p.title, p.image_url FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    connection.release();

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
    });
  }
};

// Obtener orden por ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (orders.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada',
      });
    }

    const [items] = await connection.query(
      `SELECT oi.*, p.title, p.image_url FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        ...orders[0],
        items,
      },
    });
  } catch (error) {
    console.error('Error obteniendo orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden',
    });
  }
};

// Actualizar estado de orden (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Estado de orden actualizado',
    });
  } catch (error) {
    console.error('Error actualizando orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar orden',
    });
  }
};
