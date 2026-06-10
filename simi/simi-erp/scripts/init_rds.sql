CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL,
    stock INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO productos (nombre, descripcion, precio, stock)
SELECT 'Paracetamol 500mg', 'Analgesico y antipiretico utilizado para aliviar dolor y fiebre.', 1500, 100
WHERE NOT EXISTS (
    SELECT 1 FROM productos WHERE nombre = 'Paracetamol 500mg'
);

INSERT INTO productos (nombre, descripcion, precio, stock)
SELECT 'Ibuprofeno 400mg', 'Antiinflamatorio utilizado para dolor e inflamacion.', 2200, 80
WHERE NOT EXISTS (
    SELECT 1 FROM productos WHERE nombre = 'Ibuprofeno 400mg'
);

INSERT INTO productos (nombre, descripcion, precio, stock)
SELECT 'Alcohol Gel', 'Producto de higiene para limpieza de manos.', 1800, 60
WHERE NOT EXISTS (
    SELECT 1 FROM productos WHERE nombre = 'Alcohol Gel'
);

INSERT INTO productos (nombre, descripcion, precio, stock)
SELECT 'Mascarilla Quirurgica', 'Insumo de proteccion personal para uso sanitario.', 500, 200
WHERE NOT EXISTS (
    SELECT 1 FROM productos WHERE nombre = 'Mascarilla Quirurgica'
);

INSERT INTO productos (nombre, descripcion, precio, stock)
SELECT 'Suero Fisiologico', 'Solucion salina utilizada para limpieza y procedimientos basicos.', 1200, 50
WHERE NOT EXISTS (
    SELECT 1 FROM productos WHERE nombre = 'Suero Fisiologico'
);