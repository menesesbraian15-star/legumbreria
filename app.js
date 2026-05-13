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
let nextId = parseInt(localStorage.getItem('nextId') || '9');

// Variables de control de interfaz
let metodoPago = 'efectivo';
let modoTeclado = 'cant'; // 'cant' o 'desc'
let valorTeclado = '0';
let productoSeleccionado = null;

// --- 2. FUNCIONES DE UTILIDAD ---
function guardarLocal() {
  localStorage.setItem('productos', JSON.stringify(productos));
  localStorage.setItem('historial', JSON.stringify(historial));
  localStorage.setItem('nextVenta', String(nextVenta));
  localStorage.setItem('nextId', String(nextId));
}

function actualizarReloj() {
  const el = document.getElementById('reloj');
  if (el) el.textContent = new Date().toLocaleTimeString('es-AR');
}
setInterval(actualizarReloj, 1000);

// --- 3. LÓGICA DEL TECLADO ---
function tecla(val) {
  // Manejo de caracteres especiales
  if (val === 'C') {
    valorTeclado = '0';
  } else if (val === 'back') {
    valorTeclado = valorTeclado.length > 1 ? valorTeclado.slice(0, -1) : '0';
  } else if (val === '.') {
    if (!valorTeclado.includes('.')) valorTeclado += '.';
  } else if (val === '+/-') {
    valorTeclado = valorTeclado.startsWith('-') ? valorTeclado.slice(1) : '-' + valorTeclado;
  } else {
    // Reemplaza el cero inicial por el número presionado
    valorTeclado = valorTeclado === '0' ? val : valorTeclado + val;
  }

  document.getElementById('teclado-valor').textContent = valorTeclado;

  // Si estamos en modo cantidad, actualizar el carrito automáticamente
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
        cantidad,
        subtotal: productoSeleccionado.precio * cantidad
      });
    }
    renderCarrito();
  }

  if (modoTeclado === 'desc') {
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

// --- 4. GESTIÓN DE PRODUCTOS ---
function seleccionarProducto(p) {
  productoSeleccionado = p;
  modoTeclado = 'cant';
  
  // Sincronizar teclado con la cantidad actual en carrito si existe
  const enCarrito = carrito.find(c => c.id === p.id);
  valorTeclado = enCarrito ? String(enCarrito.cantidad) : '0';

  document.getElementById('teclado-label').textContent = 'Cantidad (kg)';
  document.getElementById('teclado-valor').textContent = valorTeclado;

  renderProductos();
}

function renderProductos() {
  const grid = document.getElementById('productos-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const buscador = document.getElementById('buscador');
  const filtro = buscador ? buscador.value.toLowerCase() : '';

  productos.filter(p => p.nombre.toLowerCase().includes(filtro)).forEach(p => {
    const div = document.createElement('div');
    div.className = 'tarjeta-producto';
    if (productoSeleccionado?.id === p.id) {
      div.style.border = "2px solid #4CAF50";
      div.style.background = "#e8f5e9";
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
    div.innerHTML = `
      <div style="flex:1">
        <strong>${item.emoji} ${item.nombre}</strong><br>
        <small>${item.cantidad} kg x $${item.precio}</small>
      </div>
      <span style="font-weight:bold">$${item.subtotal.toFixed(2)}</span>
    `;
    // Al hacer clic en el item del carrito, lo seleccionamos para editar
    div.onclick = () => seleccionarProducto(productos.find(p => p.id === item.id));
    wrap.appendChild(div);
  });
  actualizarTotales();
}

function actualizarTotales() {
  const subtotal = carrito.reduce((acc, curr) => acc + curr.subtotal, 0);
  const descPct = modoTeclado === 'desc' ? (parseFloat(valorTeclado) || 0) : 0;
  const montoDesc = subtotal * (descPct / 100);
  const total = subtotal - montoDesc;

  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('total').textContent = `$${total.toFixed(2)}`;
  
  const lineaDesc = document.getElementById('linea-desc');
  if (montoDesc > 0) {
    lineaDesc.style.display = 'flex';
    document.getElementById('monto-desc').textContent = `-$${montoDesc.toFixed(2)}`;
  } else {
    lineaDesc.style.display = 'none';
  }
}

function selPago(btn, metodo) {
  document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  metodoPago = metodo;
}

function confirmarVenta() {
  if (carrito.length === 0) return alert('El carrito está vacío');

  const totalFinal = parseFloat(document.getElementById('total').textContent.replace('$', ''));

  const venta = {
    id: nextVenta++,
    fecha: new Date().toLocaleString('es-AR'),
    items: [...carrito],
    total: totalFinal,
    pago: metodoPago
  };

  historial.unshift(venta);
  guardarLocal();

  // --- RESET TOTAL ---
  carrito = [];
  productoSeleccionado = null;
  valorTeclado = '0';
  modoTeclado = 'cant';
  metodoPago = 'efectivo';

  // Reset Interfaz
  document.getElementById('teclado-valor').textContent = '0';
  document.getElementById('teclado-label').textContent = 'Cantidad (kg)';
  document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('active'));
  const btnEfectivo = document.querySelector('.btn-pago');
  if (btnEfectivo) btnEfectivo.classList.add('active');

  renderCarrito();
  renderProductos();
  alert(`✅ Venta #${venta.id} guardada.`);
}

function cancelarVenta() {
  if (carrito.length > 0 && confirm('¿Deseas cancelar la venta y vaciar el carrito?')) {
    carrito = [];
    productoSeleccionado = null;
    valorTeclado = '0';
    document.getElementById('teclado-valor').textContent = '0';
    renderCarrito();
    renderProductos();
  }
}

// --- 6. NAVEGACIÓN Y VISTAS ---
function mostrarVista(id, btn) {
  document.querySelectorAll('.vista').forEach(v => v.classList.add('oculto'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  const vista = document.getElementById('vista-' + id);
  if (vista) vista.classList.remove('oculto');
  if (btn) btn.classList.add('active');

  if (id === 'inventario') renderInventario();
  if (id === 'historial') renderHistorial();
}

// --- 7. INVENTARIO E HISTORIAL ---
function renderInventario() {
  const tbody = document.getElementById('inv-tabla');
  if (!tbody) return;
  tbody.innerHTML = '';
  productos.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.emoji} ${p.nombre}</td>
      <td>$${p.precio}</td>
      <td>${p.stock}</td>
      <td>
        <button onclick="eliminarProducto(${i})" style="background:red; color:white; border:none; padding:5px; border-radius:3px; cursor:pointer">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function eliminarProducto(index) {
  if (confirm('¿Eliminar producto?')) {
    productos.splice(index, 1);
    guardarLocal();
    renderInventario();
    renderProductos();
  }
}

function renderHistorial() {
  const tbody = document.getElementById('hist-tabla');
  if (!tbody) return;
  tbody.innerHTML = '';
  historial.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${v.id}</td>
      <td>${v.fecha}</td>
      <td>$${v.total.toFixed(2)}</td>
      <td><span class="badge-pago">${v.pago}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// --- 8. INICIO ---
window.onload = () => {
  actualizarReloj();
  renderProductos();
  renderCarrito();
};
