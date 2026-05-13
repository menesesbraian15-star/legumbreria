// --- 1. DATOS INICIALES ---
const productosDefault = [
  { id: 1, nombre: 'Zanahoria', precio: 800, stock: 15, emoji: '🥕' },
  { id: 2, nombre: 'Papa', precio: 600, stock: 20, emoji: '🥔' },
  { id: 3, nombre: 'Cebolla', precio: 700, stock: 10, emoji: '🧅' },
  { id: 4, nombre: 'Tomate', precio: 1200, stock: 8, emoji: '🍅' },
  { id: 5, nombre: 'Lechuga', precio: 400, stock: 20, emoji: '🥬' },
  { id: 6, nombre: 'Brócoli', precio: 900, stock: 6, emoji: '🥦' },
  { id: 7, nombre: 'Limón', precio: 500, stock: 30, emoji: '🍋' },
  { id: 8, nombre: 'Manzana', precio: 950, stock: 12, emoji: '🍎' },
];

let productos = JSON.parse(localStorage.getItem('productos') || 'null') || productosDefault;
let carrito = [];
let historial = JSON.parse(localStorage.getItem('historial') || '[]');
let nextVenta = parseInt(localStorage.getItem('nextVenta') || '1');

// Estado de la sesión actual
let metodoPago = 'efectivo';
let modoTeclado = 'cant'; 
let valorTeclado = '0';
let productoSeleccionado = null;

// --- 2. FUNCIONES DE NAVEGACIÓN Y RELOJ ---
function actualizarReloj() {
  const el = document.getElementById('reloj');
  if (el) el.textContent = new Date().toLocaleTimeString('es-AR');
}
setInterval(actualizarReloj, 1000);

function mostrarVista(id, btn) {
  document.querySelectorAll('.vista').forEach(v => v.classList.add('oculto'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const vista = document.getElementById('vista-' + id);
  if (vista) vista.classList.remove('oculto');
  if (btn) btn.classList.add('active');
  if (id === 'historial') renderHistorial();
}

// --- 3. LÓGICA DEL TECLADO (CORREGIDA) ---
function tecla(val) {
  // BLOQUEO: Si no hay producto seleccionado, no permite escribir números
  if (!productoSeleccionado && modoTeclado === 'cant') {
    alert("Primero toca un producto de la lista");
    return;
  }

  if (val === 'C') {
    valorTeclado = '0';
  } else if (val === 'back') {
    valorTeclado = valorTeclado.length > 1 ? valorTeclado.slice(0, -1) : '0';
  } else if (val === '.') {
    if (!valorTeclado.includes('.')) valorTeclado += '.';
  } else if (val === '+/-') {
    valorTeclado = valorTeclado.startsWith('-') ? valorTeclado.slice(1) : '-' + valorTeclado;
  } else {
    // Reemplaza el '0' inicial para evitar '08'
    valorTeclado = valorTeclado === '0' ? val : valorTeclado + val;
  }

  document.getElementById('teclado-valor').textContent = valorTeclado;

  // Si estamos en modo cantidad, actualizamos el carrito en tiempo real
  if (modoTeclado === 'cant' && productoSeleccionado) {
    const cantidad = parseFloat(valorTeclado) || 0;
    const idx = carrito.findIndex(c => c.id === productoSeleccionado.id);

    if (idx >= 0) {
      if (cantidad > 0) {
        carrito[idx].cantidad = cantidad;
        carrito[idx].subtotal = productoSeleccionado.precio * cantidad;
      } else {
        carrito.splice(idx, 1);
      }
    } else if (cantidad > 0) {
      carrito.push({
        ...productoSeleccionado,
        cantidad: cantidad,
        subtotal: productoSeleccionado.precio * cantidad
      });
    }
    renderCarrito();
  } else if (modoTeclado === 'desc') {
    actualizarTotales();
  }
}

function teclaAccion(modo) {
  modoTeclado = modo;
  valorTeclado = '0';
  document.getElementById('teclado-label').textContent = modo === 'cant' ? 'Cantidad (kg)' : 'Descuento (%)';
  document.getElementById('teclado-valor').textContent = '0';
  actualizarTotales();
}

// --- 4. RENDERIZADO DE PRODUCTOS ---
function seleccionarProducto(p) {
  productoSeleccionado = p;
  modoTeclado = 'cant';
  
  // Actualizar etiqueta del teclado para saber qué estamos editando
  document.getElementById('teclado-label').textContent = `${p.emoji} ${p.nombre} ($${p.precio})`;

  const enCarrito = carrito.find(c => c.id === p.id);
  valorTeclado = enCarrito ? String(enCarrito.cantidad) : '0';
  document.getElementById('teclado-valor').textContent = valorTeclado;

  renderProductos();
}

function renderProductos() {
  const grid = document.getElementById('productos-grid');
  if (!grid) return;
  grid.innerHTML = '';

  productos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'tarjeta-producto';
    // Estilo de selección
    if (productoSeleccionado && productoSeleccionado.id === p.id) {
      div.style.border = "3px solid #4CAF50";
      div.style.backgroundColor = "#e8f5e9";
    }
    div.innerHTML = `
      <div class="tarjeta-emoji">${p.emoji}</div>
      <div class="tarjeta-nombre">${p.nombre}</div>
      <div class="tarjeta-precio">$${p.precio}/kg</div>
    `;
    div.onclick = () => seleccionarProducto(p);
    grid.appendChild(div);
  });
}

// --- 5. CARRITO Y VENTAS ---
function renderCarrito() {
  const wrap = document.getElementById('carrito-items');
  const vacio = document.getElementById('carrito-vacio');
  
  if (carrito.length === 0) {
    wrap.innerHTML = '';
    vacio.style.display = 'flex';
    actualizarTotales();
    return;
  }

  vacio.style.display = 'none';
  wrap.innerHTML = '';
  carrito.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-carrito';
    div.style = "display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #eee; cursor:pointer";
    div.innerHTML = `
      <span>${item.emoji} ${item.nombre} (${item.cantidad}kg)</span>
      <strong>$${item.subtotal.toFixed(2)}</strong>
    `;
    div.onclick = () => seleccionarProducto(productos.find(p => p.id === item.id));
    wrap.appendChild(div);
  });
  actualizarTotales();
}

function actualizarTotales() {
  const subtotal = carrito.reduce((acc, curr) => acc + curr.subtotal, 0);
  const descPct = modoTeclado === 'desc' ? (parseFloat(valorTeclado) || 0) : 0;
  const descuento = subtotal * (descPct / 100);
  const total = subtotal - descuento;

  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('total').textContent = `$${total.toFixed(2)}`;
  
  const lineaDesc = document.getElementById('linea-desc');
  if (descuento > 0) {
    lineaDesc.style.display = 'flex';
    document.getElementById('monto-desc').textContent = `-$${descuento.toFixed(2)}`;
  } else {
    lineaDesc.style.display = 'none';
  }
}

function selPago(btn, metodo) {
  document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  metodoPago = metodo;
}

// --- 6. CIERRE DE VENTA (LIMPIEZA TOTAL) ---
function confirmarVenta() {
  if (carrito.length === 0) return alert('El carrito está vacío');

  const totalStr = document.getElementById('total').textContent;

  const venta = {
    id: nextVenta++,
    fecha: new Date().toLocaleString(),
    items: [...carrito],
    total: totalStr,
    pago: metodoPago
  };

  historial.unshift(venta);
  localStorage.setItem('historial', JSON.stringify(historial));
  localStorage.setItem('nextVenta', nextVenta);

  // RESET ABSOLUTO
  carrito = [];
  productoSeleccionado = null;
  valorTeclado = '0';
  modoTeclado = 'cant';
  metodoPago = 'efectivo';

  // Limpiar Interfaz
  document.getElementById('teclado-valor').textContent = '0';
  document.getElementById('teclado-label').textContent = 'Seleccione Producto';
  document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('active'));
  if (document.querySelector('.btn-pago')) document.querySelector('.btn-pago').classList.add('active');

  renderCarrito();
  renderProductos();
  alert(`✅ Venta #${venta.id} completada.`);
}

function cancelarVenta() {
  if (confirm('¿Vaciar todo el carrito?')) {
    carrito = [];
    productoSeleccionado = null;
    valorTeclado = '0';
    document.getElementById('teclado-valor').textContent = '0';
    document.getElementById('teclado-label').textContent = 'Cantidad (kg)';
    renderCarrito();
    renderProductos();
  }
}

function renderHistorial() {
  const tbody = document.getElementById('hist-tabla');
  if (!tbody) return;
  tbody.innerHTML = '';
  historial.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${v.id}</td><td>${v.fecha}</td><td>${v.total}</td><td>${v.pago}</td>`;
    tbody.appendChild(tr);
  });
}

// --- 7. INICIO ---
window.onload = () => {
  renderProductos();
  renderCarrito();
  actualizarReloj();
};
