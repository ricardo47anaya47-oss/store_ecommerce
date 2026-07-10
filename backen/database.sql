-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  stock INT DEFAULT 0,
  image_url VARCHAR(500),
  rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de items de órdenes
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabla de reseñas
CREATE TABLE IF NOT EXISTS reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- Insertar productos de ejemplo
INSERT INTO products (title, description, price, category, stock, image_url, rating) VALUES
('Laptop Pro', 'Laptop potente para profesionales', 999.99, 'electronics', 10, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', 4.5),
('Mouse Inalámbrico', 'Mouse ergonómico y preciso', 29.99, 'electronics', 50, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', 4.2),
('Teclado Mecánico', 'Teclado gaming con retroiluminación', 89.99, 'electronics', 30, 'https://images.unsplash.com/photo-1587829191301-d3d6c1ef14a9?w=400', 4.7),
('Monitor 4K', 'Monitor ultra HD para edición', 399.99, 'electronics', 15, 'https://images.unsplash.com/photo-1587831990711-3d71b3619b60?w=400', 4.6),
('Auriculares Bluetooth', 'Auriculares inalámbricos premium', 149.99, 'electronics', 25, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 4.4),
('Webcam 1080p', 'Cámara web HD para video conferencias', 59.99, 'electronics', 40, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400', 4.1),
('Hub USB-C', 'Expansor de puertos USB', 49.99, 'electronics', 60, 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400', 4.3),
('Lámpara LED', 'Lámpara de escritorio LED', 39.99, 'home', 45, 'https://images.unsplash.com/photo-1565636192335-14e88b7ce338?w=400', 4.2),
('Almohada Ergonómica', 'Almohada especializada para el cuello', 49.99, 'home', 35, 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400', 4.5),
('Mochila Laptop', 'Mochila resistente para laptop', 79.99, 'accessories', 50, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 4.4);
