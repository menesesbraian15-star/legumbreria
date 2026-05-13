// --- DATOS ---
let productos = [
  { id:1, nombre:'Zanahoria', precio:800, stock:15, emoji:'🥕' },
  { id:2, nombre:'Papa', precio:600, stock:20, emoji:'🥔' },
  { id:3, nombre:'Cebolla', precio:700, stock:10, emoji:'🧅' },
  { id:4, nombre:'Tomate', precio:1200, stock:8, emoji:'🍅' },
  { id:5, nombre:'Lechuga', precio:400, stock:20, emoji:'🥬' },
  { id:6, nombre:'Brócoli', precio:900, stock:6, emoji:'🥦' },
  { id:7, nombre:'Limón', precio:500, stock:30, emoji:'🍋' },
  { id:8, nombre:'Manzana', precio:950, stock:12, emoji:'🍎' },
];
let nextId = 9;
let carrito = [];
let historial = JSON.parse(localStorage.getItem('historial') || '[]');
let nextVenta = parseInt(localStorage.getItem('nextVenta') || '1');
let metodoPago = 'efectivo';
let modoTeclado = 'cant';
let valorTeclado = '0';
let productoSeleccionado = null;

// --- RELOJ ---
function actualizarReloj() {
  const ahora = new Date();
  document.getElementById('reloj').textContent =
    ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

// --- NAVEGACIÓN ---
function mostrarVista(id) {
  document.querySelectorAll('.vista').forEach(v => v.classList.add('oculto'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('vista-' + id).classList.remove('oculto');
  event.currentTarget.classList.add('active');
  if (id === 'inventario') renderInventario();
  if (id === 'historial') renderHistorial();
}

// --- TECLADO ---
function teclaAccion(modo) {
  modoTeclado = modo;
  valorTeclado = '0';
  document.getElementById('teclado-label').textContent =
    modo === 'cant' ? 'Cantidad (kg)' : 'Descuento (%)';
  document.getElementById('teclado-valor').textContent = '0';

  // Si hay producto seleccionado y cambiamos cantidad, actualizar preview
  if (productoSeleccionado && modo === 'cant') {
    actualizarTotales();
  }
}

function tecla(val) {
  if (val === 'C') {
    valorTeclado = '0';
  } else if (val === 'back') {
    valorTeclado = valorTeclado.length > 1 ? valorTeclado.slice(0, -1) : '0';
  } else if (val === '+/-') {
    valorTeclado = valorTeclado.startsWith('-') ? valorTeclado.slice(1) : '-' + valorTeclado;
  } else if (val === '.') {
    if (!valorTeclado.includes('.')) valorTeclado += '.';
  } else {
    valorTeclado = valorTeclado === '0' ? val : valorTeclado + val;
  }
  document.getElementById('teclado-valor').textContent = valorTeclado;

  // Actualizar subtotal del último item del carrito en tiempo real
  if (modoTeclado === 'cant' && carrito.length > 0 && productoSeleccionado) {
    const cantidad = parseFloat(valorTeclado) || 0;
    const idx = carrito.findIndex(c => c.id === productoSeleccionado.id);
    if (idx >= 0) {
      carrito[idx].cantidad = cantidad;
      carrito[idx].subtotal = productoSeleccionado.precio * cantidad;
      renderCarrito();
      return;
    }
  }

  if (modoTeclado === 'desc') {
    actualizarTotales();
  }
}

// --- PRODUCTOS ---
function renderProductos() {
  const q = (document.getElementById('buscador').value || '').toLowerCase();
  const grid = document.getElementById('productos-grid');
  grid.innerHTML = '';
  productos
    .filter(p => p.nombre.toLowerCase().includes(q))
    .forEach(p => {
      const div = document.createElement('div');
      div.className = 'tarjeta-producto';
      if (productoSeleccionado && productoSeleccionado.id === p.id) {
        div.style.borderColor = '#4CAF50';
        div.style.background = '#f1f8e9';
      }
      div.innerHTML = `
        <div class="tarjeta-emoji">${p.emoji}</div>
        <div class="tarjeta-nombre">${p.nombre}</div>
        <div class="tarjeta-precio">$${p.precio.toLocaleString()}/kg</div>
      `;
      div.onclick = () => seleccionarProducto(p);
      grid.appendChild(div);
    });
}

function seleccionarProducto(p) {
  productoSeleccionado = p;
  modoTeclado = 'cant';
  valorTeclado = '0';
  document.getElementById('teclado-label').textContent = 'Cantidad (kg)';
  document.getElementById('teclado-valor').textContent = '0';
  renderProductos();
}

function agregarAlCarritoConCantidad() {
  if (!productoSeleccionado) { alert('Seleccioná un producto primero'); return; }
  const cantidad = parseFloat(valorTeclado);
  if (!cantidad || cantidad <= 0) { alert('Ingresá una cantidad'); return; }

  const subtotal = productoSeleccionado.precio * cantidad;
  const existe = carrito.findIndex(c => c.id === productoSeleccionado.id);
  if (existe >= 0) {
    carrito[existe].cantidad += cantidad;
    carrito[existe].subtotal += subtotal;
  } else {
    carrito.push({
      id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      emoji: productoSeleccionado.emoji,
      precio: productoSeleccionado.precio,
      cantidad,
      subtotal
    });
  }

  valorTeclado = '0';
  document.getElementById('teclado-valor').textContent = '0';
  productoSeleccionado = null;
  renderProductos();
  renderCarrito();
}

// --- CARRITO ---
function renderCarrito() {
  const wrap = document.getElementById('carrito-items');
  const vacio = document.getElementById('carrito-vacio');

  if (carrito.length === 0) {
    wrap.innerHTML = '';
    wrap.appendChild(vacio);
    vacio.style.display = 'flex';
    actualizarTotales();
    return;
  }

  vacio.style.display = 'none';
  wrap.innerHTML = '';
  carrito.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'item-carrito';
    div.innerHTML = `
      <div class="item-carrito-info">
        <div class="item-carrito-nombre">${item.emoji} ${item.nombre}</div>
        <div class="item-carrito-detalle">${item.cantidad.toFixed(2)} kg × $${item.precio.toLocaleString()}</div>
      </div>
      <span class="item-carrito-precio">$${item.subtotal.toFixed(2)}</span>
      <button class="btn-quitar" onclick="quitarItem(${i})">×</button>
    `;
    wrap.appendChild(div);
  });
  actualizarTotales();
}

function quitarItem(i) {
  carrito.splice(i, 1);
  if (carrito.length === 0) productoSeleccionado = null;
  renderCarrito();
  renderProductos();
}

function actualizarTotales() {
  const subtotal = carrito.reduce((s, c) => s + c.subtotal, 0);
  const descPct = modoTeclado === 'desc' ? Math.min(parseFloat(valorTeclado) || 0, 100) : 0;
  const descMonto = subtotal * descPct / 100;
  const total = subtotal - descMonto;

  document.getElementById('subtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('total').textContent = '$' + total.toFixed(2);

  const lineaDesc = document.getElementById('linea-desc');
  if (descMonto > 0) {
    lineaDesc.style.display = 'flex';
    document.getElementById('monto-desc').textContent = '-$' + descMonto.toFixed(2);
  } else {
    lineaDesc.style.display = 'none';
  }
}

// --- PAGO ---
function selPago(btn, metodo) {
  document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  metodoPago = metodo;
}

// --- CONFIRMAR VENTA ---
function confirmarVenta() {
  if (carrito.length === 0) { alert('El carrito está vacío'); return; }

  const subtotal = carrito.reduce((s, c) => s + c.subtotal, 0);
  const descPct = modoTeclado === 'desc' ? Math.min(parseFloat(valorTeclado) || 0, 100) : 0;
  const descMonto = subtotal * descPct / 100;
  const total = subtotal - descMonto;

  const venta = {
    id: nextVenta++,
    fecha: new Date().toLocaleString('es-AR'),
    items: [...carrito],
    descuento: descMonto,
    total,
    pago: metodoPago,
  };

  historial.unshift(venta);
  localStorage.setItem('historial', JSON.stringify(historial));
  localStorage.setItem('nextVenta', String(nextVenta));

  // Reset completo
  carrito = [];
  valorTeclado = '0';
  modoTeclado = 'cant';
  productoSeleccionado = null;
  document.getElementById('teclado-valor').textContent = '0';
  document.getElementById('teclado-label').textContent = 'Cantidad (kg)';
  document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('active'));
  document.querySelector('.btn-pago').classList.add('active');
  metodoPago = 'efectivo';

  renderCarrito();
  renderProductos();
  alert(`✅ Venta #${venta.id} registrada — Total: $${total.toFixed(2)}`);
}

function cancelarVenta() {
  if (carrito.length === 0) return;
  if (confirm('¿Cancelar la venta actual?')) {
    carrito = [];
    productoSeleccionado = null;
    valorTeclado = '0';
    document.getElementById('teclado-valor').textContent = '0';
    renderCarrito();
    renderProductos();
  }
}

// --- INVENTARIO ---
function agregarProducto() {
  const nombre = document.getElementById('inv-nombre').value.trim();
  const precio = parseFloat(document.getElementById('inv-precio').value);
  const stock  = parseFloat(document.getElementById('inv-stock').value);
  const emoji  = document.getElementById('inv-emoji').value.trim() || '🥦';

  if (!nombre || isNaN(precio) || isNaN(stock)) { alert('Completá todos los campos'); return; }

  productos.push({ id: nextId++, nombre, precio, stock, emoji });
  ['inv-nombre','inv-precio','inv-stock','inv-emoji'].forEach(id => document.getElementById(id).value = '');
  renderInventario();
  renderProductos();
}

function editarProducto(i) {
  const p = productos[i];
  const nuevoNombre = prompt('Nombre:', p.nombre);
  if (nuevoNombre === null) return;
  const nuevoPrecio = prompt('Precio ($/kg):', p.precio);
  if (nuevoPrecio === null) return;
  const nuevoStock = prompt('Stock:', p.stock);
  if (nuevoStock === null) return;
  const nuevoEmoji = prompt('Emoji:', p.emoji);
  if (nuevoEmoji === null) return;

  productos[i].nombre = nuevoNombre.trim() || p.nombre;
  productos[i].precio = parseFloat(nuevoPrecio) || p.precio;
  productos[i].stock  = parseFloat(nuevoStock) || p.stock;
  productos[i].emoji  = nuevoEmoji.trim() || p.emoji;

  renderInventario();
  renderProductos();
}

function eliminarProducto(i) {
  if (confirm(`¿Eliminar "${productos[i].nombre}"?`)) {
    productos.splice(i, 1);
    renderInventario();
    renderProductos();
  }
}

function renderInventario() {
  const tbody = document.getElementById('inv-tabla');
  tbody.innerHTML = '';
  productos.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.emoji} ${p.nombre}</td>
      <td>$${p.precio.toLocaleString()}</td>
      <td>${p.stock}</td>
      <td style="display:flex;gap:6px;">
        <button onclick="editarProducto(${i})" style="background:#1565c0;padding:4px 10px;font-size:12px">✏️ Editar</button>
        <button onclick="eliminarProducto(${i})" style="background:#e53935;padding:4px 10px;font-size:12px">🗑 Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- HISTORIAL ---
function renderHistorial() {
  const tbody = document.getElementById('hist-tabla');
  const vacio = document.getElementById('hist-vacio');
  tbody.innerHTML = '';

  if (historial.length === 0) { vacio.style.display = 'block'; return; }
  vacio.style.display = 'none';

  historial.forEach(v => {
    const detalle = v.items.map(i => `${i.emoji}${i.nombre} (${i.cantidad.toFixed(2)}kg)`).join(', ');
    const badge = `<span class="badge-pago badge-${v.pago}">${v.pago}</span>`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${v.id}</td>
      <td>${v.fecha}</td>
      <td style="font-size:12px;color:#666">${detalle}</td>
      <td>${badge}</td>
      <td style="font-weight:bold;color:#2e7d32">$${v.total.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function borrarHistorial() {
  if (confirm('¿Borrar todo el historial?')) {
    historial = [];
    localStorage.setItem('historial', '[]');
    renderHistorial();
  }
}

// --- INICIO ---
renderProductos();
