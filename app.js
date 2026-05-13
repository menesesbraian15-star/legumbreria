// =========================
// LEGUMBRERÍA POS - FULL FIX
// =========================

// -------------------------
// DATOS
// -------------------------
const productosDefault = [
  { id:1, nombre:'Zanahoria', precio:800, stock:15, emoji:'🥕' },
  { id:2, nombre:'Papa', precio:600, stock:20, emoji:'🥔' },
  { id:3, nombre:'Cebolla', precio:700, stock:10, emoji:'🧅' },
  { id:4, nombre:'Tomate', precio:1200, stock:8, emoji:'🍅' },
  { id:5, nombre:'Lechuga', precio:400, stock:20, emoji:'🥬' },
  { id:6, nombre:'Brócoli', precio:900, stock:6, emoji:'🥦' },
  { id:7, nombre:'Limón', precio:500, stock:30, emoji:'🍋' },
  { id:8, nombre:'Manzana', precio:950, stock:12, emoji:'🍎' },
];

let productos =
  JSON.parse(localStorage.getItem('productos') || 'null')
  || productosDefault;

let nextId =
  parseInt(localStorage.getItem('nextId') || '9');

let carrito = [];

let historial =
  JSON.parse(localStorage.getItem('historial') || '[]');

let nextVenta =
  parseInt(localStorage.getItem('nextVenta') || '1');

let metodoPago = 'efectivo';

let modoTeclado = 'cant';

let valorTeclado = '';

let productoSeleccionado = null;

// -------------------------
// GUARDAR
// -------------------------
function guardarProductos() {

  localStorage.setItem(
    'productos',
    JSON.stringify(productos)
  );

  localStorage.setItem(
    'nextId',
    String(nextId)
  );
}

// -------------------------
// RELOJ
// -------------------------
function actualizarReloj() {

  const ahora = new Date();

  const reloj =
    document.getElementById('reloj');

  if (reloj) {

    reloj.textContent =
      ahora.toLocaleTimeString('es-AR', {
        hour:'2-digit',
        minute:'2-digit',
        second:'2-digit'
      });
  }
}

setInterval(actualizarReloj, 1000);

actualizarReloj();

// -------------------------
// NAVEGACIÓN
// -------------------------
function mostrarVista(id, btn = null) {

  document.querySelectorAll('.vista')
    .forEach(v => v.classList.add('oculto'));

  document.querySelectorAll('.tab-btn')
    .forEach(b => b.classList.remove('active'));

  const vista =
    document.getElementById('vista-' + id);

  if (vista) {
    vista.classList.remove('oculto');
  }

  if (btn) {
    btn.classList.add('active');
  }

  if (id === 'inventario') {
    renderInventario();
  }

  if (id === 'historial') {
    renderHistorial();
  }
}

// -------------------------
// TECLADO
// -------------------------
function teclaAccion(modo) {

  modoTeclado = modo;

  valorTeclado = '';

  const label =
    document.getElementById('teclado-label');

  const valor =
    document.getElementById('teclado-valor');

  if (label) {

    label.textContent =
      modo === 'cant'
        ? 'Cantidad (kg)'
        : 'Descuento (%)';
  }

  if (valor) {
    valor.textContent = '0';
  }

  actualizarTotales();
}

function tecla(val) {

  // limpiar
  if (val === 'C') {

    valorTeclado = '';
  }

  // borrar uno
  else if (val === 'back') {

    valorTeclado =
      valorTeclado.length > 1
        ? valorTeclado.slice(0, -1)
        : '';
  }

  // negativo
  else if (val === '+/-') {

    valorTeclado =
      valorTeclado.startsWith('-')
        ? valorTeclado.slice(1)
        : '-' + valorTeclado;
  }

  // decimal
  else if (val === '.') {

    if (!valorTeclado.includes('.')) {

      valorTeclado =
        valorTeclado === ''
          ? '0.'
          : valorTeclado + '.';
    }
  }

  // números
  else {

    if (
      valorTeclado === ''
      || valorTeclado === '0'
    ) {

      valorTeclado = String(val);

    } else {

      valorTeclado += String(val);
    }
  }

  // mostrar
  const pantalla =
    document.getElementById('teclado-valor');

  if (pantalla) {

    pantalla.textContent =
      valorTeclado || '0';
  }

  // ---------------------
  // CANTIDAD
  // ---------------------
  if (
    modoTeclado === 'cant'
    && productoSeleccionado
  ) {

    const cantidad =
      parseFloat(valorTeclado) || 0;

    let item =
      carrito.find(
        c => c.id === productoSeleccionado.id
      );

    // eliminar
    if (cantidad <= 0) {

      carrito =
        carrito.filter(
          c => c.id !== productoSeleccionado.id
        );
    }

    // actualizar
    else if (item) {

      item.cantidad = cantidad;

      item.subtotal =
        item.precio * cantidad;
    }

    // nuevo
    else {

      carrito.push({

        id: productoSeleccionado.id,

        nombre: productoSeleccionado.nombre,

        emoji: productoSeleccionado.emoji,

        precio: productoSeleccionado.precio,

        cantidad,

        subtotal:
          productoSeleccionado.precio
          * cantidad
      });
    }

    renderCarrito();
  }

  // ---------------------
  // DESCUENTO
  // ---------------------
  if (modoTeclado === 'desc') {

    actualizarTotales();
  }
}

// -------------------------
// PRODUCTOS
// -------------------------
function renderProductos() {

  const buscador =
    document.getElementById('buscador');

  const q =
    buscador
      ? buscador.value.toLowerCase()
      : '';

  const grid =
    document.getElementById('productos-grid');

  if (!grid) return;

  grid.innerHTML = '';

  productos
    .filter(p =>
      p.nombre.toLowerCase().includes(q)
    )
    .forEach(p => {

      const div =
        document.createElement('div');

      div.className =
        'tarjeta-producto';

      if (
        productoSeleccionado
        && productoSeleccionado.id === p.id
      ) {

        div.style.borderColor =
          '#4CAF50';

        div.style.background =
          '#f1f8e9';
      }

      div.innerHTML = `
        <div class="tarjeta-emoji">
          ${p.emoji}
        </div>

        <div class="tarjeta-nombre">
          ${p.nombre}
        </div>

        <div class="tarjeta-precio">
          $${p.precio.toLocaleString()}/kg
        </div>
      `;

      div.onclick =
        () => seleccionarProducto(p);

      grid.appendChild(div);
    });
}

function seleccionarProducto(p) {

  productoSeleccionado = p;

  modoTeclado = 'cant';

  valorTeclado = '';

  const label =
    document.getElementById('teclado-label');

  const pantalla =
    document.getElementById('teclado-valor');

  if (label) {
    label.textContent = 'Cantidad (kg)';
  }

  if (pantalla) {
    pantalla.textContent = '0';
  }

  const item =
    carrito.find(c => c.id === p.id);

  if (item && pantalla) {

    valorTeclado =
      String(item.cantidad);

    pantalla.textContent =
      valorTeclado;
  }

  renderProductos();
}

// -------------------------
// CARRITO
// -------------------------
function renderCarrito() {

  const wrap =
    document.getElementById('carrito-items');

  const vacio =
    document.getElementById('carrito-vacio');

  if (!wrap || !vacio) return;

  const items =
    carrito.filter(c => c.cantidad > 0);

  if (items.length === 0) {

    wrap.innerHTML = '';

    wrap.appendChild(vacio);

    vacio.style.display = 'flex';

    actualizarTotales();

    return;
  }

  vacio.style.display = 'none';

  wrap.innerHTML = '';

  items.forEach((item, i) => {

    const div =
      document.createElement('div');

    div.className =
      'item-carrito';

    div.innerHTML = `
      <div class="item-carrito-info">

        <div class="item-carrito-nombre">
          ${item.emoji} ${item.nombre}
        </div>

        <div class="item-carrito-detalle">
          ${item.cantidad.toFixed(2)} kg ×
          $${item.precio.toLocaleString()}
        </div>

      </div>

      <span class="item-carrito-precio">
        $${item.subtotal.toFixed(2)}
      </span>

      <button
        class="btn-quitar"
        onclick="quitarItem(${i})"
      >
        ×
      </button>
    `;

    wrap.appendChild(div);
  });

  actualizarTotales();
}

function quitarItem(i) {

  carrito.splice(i, 1);

  if (carrito.length === 0) {
    productoSeleccionado = null;
  }

  renderCarrito();

  renderProductos();
}

// -------------------------
// TOTALES
// -------------------------
function actualizarTotales() {

  const subtotal =
    carrito.reduce(
      (s, c) => s + c.subtotal,
      0
    );

  const descPct =
    modoTeclado === 'desc'
      ? Math.min(
          parseFloat(valorTeclado) || 0,
          100
        )
      : 0;

  const descMonto =
    subtotal * descPct / 100;

  const total =
    subtotal - descMonto;

  const subtotalEl =
    document.getElementById('subtotal');

  const totalEl =
    document.getElementById('total');

  if (subtotalEl) {
    subtotalEl.textContent =
      '$' + subtotal.toFixed(2);
  }

  if (totalEl) {
    totalEl.textContent =
      '$' + total.toFixed(2);
  }

  const lineaDesc =
    document.getElementById('linea-desc');

  const montoDesc =
    document.getElementById('monto-desc');

  if (
    descMonto > 0
    && lineaDesc
    && montoDesc
  ) {

    lineaDesc.style.display = 'flex';

    montoDesc.textContent =
      '-$' + descMonto.toFixed(2);

  } else if (lineaDesc) {

    lineaDesc.style.display = 'none';
  }
}

// -------------------------
// PAGO
// -------------------------
function selPago(btn, metodo) {

  document.querySelectorAll('.btn-pago')
    .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');

  metodoPago = metodo;
}

// -------------------------
// CONFIRMAR VENTA
// -------------------------
function confirmarVenta() {

  const itemsValidos =
    carrito.filter(c => c.cantidad > 0);

  if (itemsValidos.length === 0) {

    alert('El carrito está vacío');

    return;
  }

  const subtotal =
    itemsValidos.reduce(
      (s, c) => s + c.subtotal,
      0
    );

  const descPct =
    modoTeclado === 'desc'
      ? Math.min(
          parseFloat(valorTeclado) || 0,
          100
        )
      : 0;

  const descMonto =
    subtotal * descPct / 100;

  const total =
    subtotal - descMonto;

  const venta = {

    id: nextVenta++,

    fecha:
      new Date().toLocaleString('es-AR'),

    items:
      JSON.parse(
        JSON.stringify(itemsValidos)
      ),

    descuento: descMonto,

    total,

    pago: metodoPago
  };

  historial.unshift(venta);

  localStorage.setItem(
    'historial',
    JSON.stringify(historial)
  );

  localStorage.setItem(
    'nextVenta',
    String(nextVenta)
  );

  carrito = [];

  productoSeleccionado = null;

  valorTeclado = '';

  modoTeclado = 'cant';

  metodoPago = 'efectivo';

  const pantalla =
    document.getElementById('teclado-valor');

  if (pantalla) {
    pantalla.textContent = '0';
  }

  renderCarrito();

  renderProductos();

  actualizarTotales();

  alert(
    `✅ Venta #${venta.id} registrada — Total: $${total.toFixed(2)}`
  );
}

// -------------------------
// CANCELAR
// -------------------------
function cancelarVenta() {

  if (carrito.length === 0) return;

  if (
    confirm(
      '¿Cancelar la venta actual?'
    )
  ) {

    carrito = [];

    productoSeleccionado = null;

    valorTeclado = '';

    modoTeclado = 'cant';

    const pantalla =
      document.getElementById('teclado-valor');

    if (pantalla) {
      pantalla.textContent = '0';
    }

    renderCarrito();

    renderProductos();

    actualizarTotales();
  }
}

// -------------------------
// INVENTARIO
// -------------------------
function agregarProducto() {

  const nombre =
    document.getElementById('inv-nombre')
      ?.value.trim();

  const precio =
    parseFloat(
      document.getElementById('inv-precio')
        ?.value
    );

  const stock =
    parseFloat(
      document.getElementById('inv-stock')
        ?.value
    );

  const emoji =
    document.getElementById('inv-emoji')
      ?.value.trim() || '🥦';

  if (
    !nombre
    || isNaN(precio)
    || isNaN(stock)
  ) {

    alert('Completá todos los campos');

    return;
  }

  productos.push({
    id: nextId++,
    nombre,
    precio,
    stock,
    emoji
  });

  guardarProductos();

  renderInventario();

  renderProductos();
}

// -------------------------
// INVENTARIO TABLA
// -------------------------
function renderInventario() {

  const tbody =
    document.getElementById('inv-tabla');

  if (!tbody) return;

  tbody.innerHTML = '';

  productos.forEach((p, i) => {

    const tr =
      document.createElement('tr');

    tr.innerHTML = `
      <td>${p.emoji} ${p.nombre}</td>
      <td>$${p.precio.toLocaleString()}</td>
      <td>${p.stock}</td>

      <td style="display:flex;gap:6px">

        <button onclick="editarProducto(${i})">
          ✏️
        </button>

        <button onclick="eliminarProducto(${i})">
          🗑
        </button>

      </td>
    `;

    tbody.appendChild(tr);
  });
}

// -------------------------
// HISTORIAL
// -------------------------
function renderHistorial() {

  const tbody =
    document.getElementById('hist-tabla');

  const vacio =
    document.getElementById('hist-vacio');

  if (!tbody || !vacio) return;

  tbody.innerHTML = '';

  if (historial.length === 0) {

    vacio.style.display = 'block';

    return;
  }

  vacio.style.display = 'none';

  historial.forEach(v => {

    const detalle =
      v.items.map(i =>
        `${i.emoji}${i.nombre} (${i.cantidad.toFixed(2)}kg)`
      ).join(', ');

    const tr =
      document.createElement('tr');

    tr.innerHTML = `
      <td>#${v.id}</td>
      <td>${v.fecha}</td>
      <td>${detalle}</td>
      <td>${v.pago}</td>
      <td>$${v.total.toFixed(2)}</td>
    `;

    tbody.appendChild(tr);
  });
}

// -------------------------
// INICIO
// -------------------------
renderProductos();

renderCarrito();

actualizarTotales();
