const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 80;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const pool = new Pool({
    host: process.env.DB_HOST || 'database',
    user: process.env.DB_USER || 'simi_user',
    password: process.env.DB_PASSWORD || 'simi_password',
    database: process.env.DB_NAME || 'simi_erp',
    port: process.env.DB_PORT || 5432
});

app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

app.post('/api/productos', async (req, res) => {
    const { nombre, descripcion, precio, stock } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, descripcion, precio, stock]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ERP SIMI ejecutandose en puerto ${PORT}`);
});