CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL,
    stock INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO productos (nombre, descripcion, precio, stock)
VALUES 
('Paracetamol 500mg', 'Caja de 20 comprimidos', 2500, 50),
('Ibuprofeno 400mg', 'Caja de 10 comprimidos', 3200, 40),
('Alcohol Gel', 'Botella de 250ml', 1800, 100);
