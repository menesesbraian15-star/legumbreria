// --- DATOS ---
let productos = [
  { nombre: "Zanahoria", precio: 800, stock: 15 },
  { nombre: "Papa",      precio: 600, stock: 20 },
  { nombre: "Cebolla",   precio: 700, stock: 10 },
];

let carrito = [];
let historial = [];

// --- NAVEGACIÓN ---
function mostrarSeccion(id) {
  document.getElementById('venta').classList.add('oculto');
  document.getElementById('inventario').classList.add('oculto');
  document.getElementById('historial').classList.add('oculto');
  document.getElementById(id).classList.remove('oculto');

  if (id === 'inventario') renderInventario();
  if (id === 'historial')  renderHistorial();
  if (id === 'venta')      actualizarSelect();
}

// --- VENTA ---
function actualizarSelect() {
  const sel = document.getElementById('sel-producto');
  sel.innerHTML = '';
  productos.forEach((p, i) => {
    const op = document.createElement('option');
    op.value = i;
    op.textContent = `${p.nombre} — $${p.precio}/kg`;
    sel.appendChild(op);
  });
}

function agregarAlCarrito() {
  const idx = parseInt(document.getElementById('sel-producto').value);
  const cantidad = parseFloat(document.getElementById('inp-cantidad').value);

  if (isNaN(cantidad) || cantidad <= 0) {
    alert('Ingresá una cantidad válida');
    return;
  }

  const prod = productos[idx];
  const subtotal = prod.precio * cantidad;

  carrito.push({ nombre: prod.nombre, cantidad, subtotal });
  document.getElementById('inp-cantidad').value = '';
  renderCarrito();
}

function renderCarrito() {
  const lista = document.getElementById('lista-carrito');
  lista.innerHTML = '';
  let total = 0;

  carrito.forEach((item, i) => {
    total += item.subtotal;
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${item.nombre} — ${item.cantidad} kg — $${item.subtotal.toFixed(2)}</span>
      <button onclick="quitarDelCarrito(${i})">Quitar</button>
    `;
    lista.appendChild(li);
  });

  document.getElementById('total').textContent = total.toFixed(2);
}

function quitarDelCarrito(i) {
  carrito.splice(i, 1);
  renderCarrito();
}

function confirmarVenta() {
  if (carrito.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  const total = carrito.reduce((s, c) => s + c.subtotal, 0);
  const fecha = new Date().toLocaleString('es-AR');

  historial.unshift({ fecha, items: [...carrito], total });
  carrito = [];
  renderCarrito();
  alert(`✅ Venta registrada — Total: $${total.toFixed(2)}`);
}

// --- INVENTARIO ---
function agregarProducto() {
  const nombre = document.getElementById('inv-nombre').value.trim();
  const precio = parseFloat(document.getElementById('inv-precio').value);
  const stock  = parseFloat(document.getElementById('inv-stock').value);

  if (!nombre || isNaN(precio) || isNaN(stock)) {
    alert('Completá todos los campos');
    return;
  }

  productos.push({ nombre, precio, stock });
  document.getElementById('inv-nombre').value = '';
  document.getElementById('inv-precio').value = '';
  document.getElementById('inv-stock').value  = '';
  renderInventario();
}

function renderInventario() {
  const lista = document.getElementById('lista-inventario');
  lista.innerHTML = '';
  productos.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${p.nombre} — $${p.precio}/kg — Stock: ${p.stock}</span>
      <button onclick="eliminarProducto(${i})">Eliminar</button>
    `;
    lista.appendChild(li);
  });
}

function eliminarProducto(i) {
  productos.splice(i, 1);
  renderInventario();
}

// --- HISTORIAL ---
function renderHistorial() {
  const lista = document.getElementById('lista-historial');
  lista.innerHTML = '';

  if (historial.length === 0) {
    lista.innerHTML = '<li>No hay ventas aún</li>';
    return;
  }

  historial.forEach(v => {
    const li = document.createElement('li');
    const detalle = v.items.map(i => `${i.nombre} (${i.cantidad}kg)`).join(', ');
    li.innerHTML = `<span><strong>${v.fecha}</strong> — ${detalle} — <strong>$${v.total.toFixed(2)}</strong></span>`;
    lista.appendChild(li);
  });
}

// Iniciar
actualizarSelect();
