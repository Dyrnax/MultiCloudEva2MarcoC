async function cargarProductos() {
    const respuesta = await fetch('/api/productos');
    const productos = await respuesta.json();

    const tabla = document.getElementById('tablaProductos');
    tabla.innerHTML = '';

    productos.forEach(producto => {
        const fila = `
            <tr>
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>${producto.descripcion}</td>
                <td>$${producto.precio}</td>
                <td>${producto.stock}</td>
            </tr>
        `;
        tabla.innerHTML += fila;
    });
}

document.getElementById('productoForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const producto = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: document.getElementById('precio').value,
        stock: document.getElementById('stock').value
    };

    await fetch('/api/productos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(producto)
    });

    document.getElementById('productoForm').reset();
    cargarProductos();
});

cargarProductos();