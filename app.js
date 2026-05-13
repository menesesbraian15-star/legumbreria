// --- 1. ESTADO DE LA APLICACIÓN ---
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

// Variables de control
let metodoPago = 'efectivo';
let modoTeclado = 'cant'; 
let valorTeclado = '0';
let productoSeleccionado = null;

// --- 2. LÓGICA DEL TECLADO ---
function tecla(val) {
  // BLOQUEO SEGURIDAD: No permite escribir si no hay un producto activo
  if (!productoSeleccionado && modoTeclado === 'cant') {
    alert("Seleccione un producto de la lista primero");
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
    // Reemplazo del 0 inicial
    valorTeclado = valorTeclado === '0' ? val : valorTeclado + val;
  }

  // Actualizar pantalla teclado
  document.getElementById('teclado-valor').textContent = valorTeclado;

  // Sincronizar con el carrito en tiempo real
  if (modoTeclado === 'cant' && productoSeleccionado) {
    actualizarCarrito(parseFloat(valorTeclado) || 0);
  } else if (modoTeclado === 'desc') {
    actualizarTotales();
  }
}

function actualizarCarrito(cantidad) {
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
}

function teclaAccion(modo) {
  modoTeclado = modo;
  valorTeclado = '0';
  document.getElementById('teclado-label').textContent = modo === 'cant' ? 'Cantidad (kg)' : 'Descuento (%)';
  document.getElementById('teclado-valor').textContent = '0';
  actualizarTotales();
}

// --- 3. PRODUCTOS ---
function seleccionarProducto(p) {
  productoSeleccionado = p;
  modoTeclado = 'cant';
  
  // Feedback visual en la calculadora
  document.getElementById('teclado-label').textContent = `${p.emoji} ${p.nombre} ($${p.precio})`;

  // Cargar cantidad si ya existe en el carrito
  const existente = carrito.find(c => c.id === p.id);
  valorTeclado = existente ? String(existente.cantidad) : '0';
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

// --- 4. CARRITO Y TOTALES ---
function renderCarrito() {
  const wrap = document.getElementById('carrito-items');
  const vacio = document.getElementById('carrito-vacio');
  
  if (carrito.length === 0) {
    wrap.innerHTML = '';
    if (vacio) vacio.style.display = 'flex';
    actualizarTotales();
    return;
  }

  if (vacio) vacio.style.display = 'none';
  wrap.innerHTML = '';
  carrito.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-carrito';
    div.style = "display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; cursor:pointer";
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
}

// --- 5. CIERRE DE VENTA (EL ARREGLO) ---
function confirmarVenta() {
  if (carrito.length === 0) return alert('El carrito está vacío');

  const totalTxt = document.getElementById('total').textContent;

  const venta = {
    id: nextVenta++,
    fecha: new Date().toLocaleString(),
    items: [...carrito],
    total: totalTxt,
    pago: metodoPago
  };

  historial.unshift(venta);
  localStorage.setItem('historial', JSON.stringify(historial));
  localStorage.setItem('nextVenta', nextVenta);

  // --- LIMPIEZA CRÍTICA ---
  carrito = [];
  productoSeleccionado = null;
  valorTeclado = '0';
  modoTeclado = 'cant';
  metodoPago = 'efectivo';

  // Forzar reseteo de textos en pantalla
  document.getElementById('teclado-valor').textContent = '0';
  document.getElementById('teclado-label').textContent = 'Seleccione Producto';
  document.getElementById('subtotal').textContent = '$0.00';
  document.getElementById('total').textContent = '$0.00';
  
  // Resetear estilos de botones de pago
  document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('active'));
  const btnEfectivo = document.querySelector('.btn-pago');
  if (btnEfectivo) btnEfectivo.classList.add('active');

  // Refrescar vistas
  renderCarrito();
  renderProductos();
  
  alert(`✅ Venta #${venta.id} completada.`);
}

function selPago(btn, metodo) {
  document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  metodoPago = metodo;
}

// --- 6. INICIO ---
window.onload = () => {
  renderProductos();
  renderCarrito();
};
