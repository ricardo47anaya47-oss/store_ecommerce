const pool = require('../config/database');

// Obtener todos los productos
exports.getAllProducts = async (req, res) => {
  try {
    const { limit = 10, offset = 0, search, category } = req.query;
    const connection = await pool.getConnection();

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await connection.query(query, params);

    // Obtener total de productos
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    const [countResult] = await connection.query(countQuery, countParams);

    connection.release();

    res.json({
      success: true,
      data: products,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
    });
  }
};

// Obtener producto por ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [products] = await connection.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    connection.release();

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    res.json({
      success: true,
      data: products[0],
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
    });
  }
};

// Crear producto (admin)
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock, image_url } = req.body;
    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO products (title, description, price, category, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, price, category, stock, image_url]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Producto creado',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
    });
  }
};

// Actualizar producto (admin)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, stock, image_url } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE products SET title = ?, description = ?, price = ?, category = ?, stock = ?, image_url = ? WHERE id = ?',
      [title, description, price, category, stock, image_url, id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Producto actualizado',
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
    });
  }
};

// Eliminar producto (admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    await connection.query('DELETE FROM products WHERE id = ?', [id]);

    connection.release();

    res.json({
      success: true,
      message: 'Producto eliminado',
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
    });
  }
};

// Obtener categorías
exports.getCategories = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [categories] = await connection.query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );

    connection.release();

    res.json({
      success: true,
      data: categories.map(c => c.category),
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
    });
  }
};
