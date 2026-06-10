var productos = [];

var productForm = document.getElementById("productForm");
var productoId = document.getElementById("productoId");
var nombre = document.getElementById("nombre");
var descripcion = document.getElementById("descripcion");
var precio = document.getElementById("precio");
var stock = document.getElementById("stock");
var productosBody = document.getElementById("productosBody");
var messageBox = document.getElementById("messageBox");
var submitButton = document.getElementById("submitButton");
var cancelEditButton = document.getElementById("cancelEditButton");
var refreshButton = document.getElementById("refreshButton");
var sessionInfo = document.getElementById("sessionInfo");

function mostrarMensaje(texto, tipo) {
    messageBox.textContent = texto;
    messageBox.className = "message-box";

    if (tipo === "ok") {
        messageBox.classList.add("message-ok");
    } else {
        messageBox.classList.add("message-error");
    }

    messageBox.style.display = "block";

    setTimeout(function () {
        messageBox.style.display = "none";
    }, 4000);
}

function formatoPrecio(valor) {
    var numero = Number(valor);

    if (Number.isNaN(numero)) {
        return "$0";
    }

    return "$" + numero.toLocaleString("es-CL");
}

function formatoFecha(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    var date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
        return fecha;
    }

    return date.toLocaleString("es-CL");
}

function limpiarFormulario() {
    productoId.value = "";
    nombre.value = "";
    descripcion.value = "";
    precio.value = "";
    stock.value = "";

    submitButton.textContent = "Guardar producto";
    cancelEditButton.style.display = "none";
}

function pintarProductos() {
    productosBody.innerHTML = "";

    if (productos.length === 0) {
        productosBody.innerHTML = "<tr><td colspan='7'>No existen productos registrados.</td></tr>";
        return;
    }

    for (var i = 0; i < productos.length; i++) {
        var producto = productos[i];

        var fila = document.createElement("tr");

        fila.innerHTML =
            "<td>" + producto.id + "</td>" +
            "<td>" + producto.nombre + "</td>" +
            "<td>" + (producto.descripcion || "Sin descripcion") + "</td>" +
            "<td>" + formatoPrecio(producto.precio) + "</td>" +
            "<td>" + producto.stock + "</td>" +
            "<td>" + formatoFecha(producto.fecha_creacion) + "</td>" +
            "<td class='actions-cell'>" +
                "<button class='edit-button' onclick='editarProducto(" + producto.id + ")'>Editar</button>" +
                "<button class='delete-button' onclick='eliminarProducto(" + producto.id + ")'>Eliminar</button>" +
            "</td>";

        productosBody.appendChild(fila);
    }
}

async function cargarSesion() {
    try {
        var respuesta = await fetch("/api/session");
        var data = await respuesta.json();

        if (data.ok) {
            sessionInfo.textContent = "Sesión activa: " + data.usuario + " | Acceso condicional validado";
        } else {
            sessionInfo.textContent = "No se pudo validar la sesión.";
        }
    } catch (error) {
        sessionInfo.textContent = "Error al consultar la sesión.";
    }
}

async function cargarProductos() {
    productosBody.innerHTML = "<tr><td colspan='7'>Cargando productos...</td></tr>";

    try {
        var respuesta = await fetch("/api/productos");
        var data = await respuesta.json();

        if (!data.ok) {
            productosBody.innerHTML = "<tr><td colspan='7'>Error al cargar productos.</td></tr>";
            return;
        }

        productos = data.productos;
        pintarProductos();
    } catch (error) {
        productosBody.innerHTML = "<tr><td colspan='7'>No se pudo conectar con la API.</td></tr>";
    }
}

async function guardarProducto(evento) {
    evento.preventDefault();

    var producto = {
        nombre: nombre.value,
        descripcion: descripcion.value,
        precio: precio.value,
        stock: stock.value
    };

    var id = productoId.value;
    var url = "/api/productos";
    var metodo = "POST";

    if (id !== "") {
        url = "/api/productos/" + id;
        metodo = "PUT";
    }

    try {
        var respuesta = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(producto)
        });

        var data = await respuesta.json();

        if (data.ok) {
            mostrarMensaje(data.mensaje, "ok");
            limpiarFormulario();
            cargarProductos();
        } else {
            mostrarMensaje(data.mensaje || "No se pudo guardar el producto.", "error");
        }
    } catch (error) {
        mostrarMensaje("Error al conectar con el servidor.", "error");
    }
}

function editarProducto(id) {
    var encontrado = null;

    for (var i = 0; i < productos.length; i++) {
        if (productos[i].id === id) {
            encontrado = productos[i];
            break;
        }
    }

    if (!encontrado) {
        mostrarMensaje("Producto no encontrado.", "error");
        return;
    }

    productoId.value = encontrado.id;
    nombre.value = encontrado.nombre;
    descripcion.value = encontrado.descripcion || "";
    precio.value = encontrado.precio;
    stock.value = encontrado.stock;

    submitButton.textContent = "Actualizar producto";
    cancelEditButton.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function eliminarProducto(id) {
    var confirmar = confirm("¿Seguro que desea eliminar este producto?");

    if (!confirmar) {
        return;
    }

    try {
        var respuesta = await fetch("/api/productos/" + id, {
            method: "DELETE"
        });

        var data = await respuesta.json();

        if (data.ok) {
            mostrarMensaje(data.mensaje, "ok");
            cargarProductos();
        } else {
            mostrarMensaje(data.mensaje || "No se pudo eliminar el producto.", "error");
        }
    } catch (error) {
        mostrarMensaje("Error al conectar con el servidor.", "error");
    }
}

productForm.addEventListener("submit", guardarProducto);

cancelEditButton.addEventListener("click", function () {
    limpiarFormulario();
});

refreshButton.addEventListener("click", function () {
    cargarProductos();
});

cargarSesion();
cargarProductos();