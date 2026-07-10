const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registrar usuario
exports.register = async (req, res) => {
  try {
    const { name, lastName, email, password } = req.body;

    // Validar datos
    if (!name || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona nombre, apellido, email y contraseña',
      });
    }

    const connection = await pool.getConnection();

    // Verificar si el email ya existe
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const fullName = `${name} ${lastName}`;
    const result = await connection.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [fullName, email, hashedPassword]
    );

    const userId = result[0].insertId;
    connection.release();

    // Generar token
    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: userId,
        name: fullName,
        email,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message,
    });
  }
}

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos',
      });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id, name, email, password FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos',
      });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos',
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    connection.release();

    res.json({
      success: true,
      message: 'Sesión iniciada',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
    });
  }
};

// Obtener perfil del usuario
exports.getProfile = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id, name, email, phone, address, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
    });
  }
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone, address, req.user.id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Perfil actualizado',
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
    });
  }
};
