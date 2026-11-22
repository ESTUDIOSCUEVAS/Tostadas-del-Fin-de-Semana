const STORAGE = 'tostadas-del-fin-order-v1';
const money = amount => '$' + amount.toLocaleString('es-MX');
const ingredients = ['Lechuga', 'Tomate', 'Cebolla morada', 'Queso', 'Aguacate'];
const byId = id => document.getElementById(id);
const options = byId('options');
const order = byId('order');
const checkout = byId('checkout');
const form = byId('product-form');
const controls = form.elements;
const ingredientInputs = [...byId('ingredients').querySelectorAll('input')];
const productButtons = [...document.querySelectorAll('[data-product]')];
const photos = Object.fromEntries(productButtons.map(button => [
  button.dataset.product, button.closest('article').querySelector('img')
]));
let statusTimeout;
let lines = loadOrder();
let currentId;
let editIndex;
let returnToCart;

function loadOrder() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE) ?? '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function unitPrice(line) {
  const product = products[line.id];
  return (product.sizes?.[line.size]?.[1] ?? product.price) + (line.fries ? product.fries : 0);
}

function variant(line) {
  return JSON.stringify([line.id, line.size, line.removed, line.broth, line.fries, line.notes]);
}

function description(line) {
  const product = products[line.id];
  return [
    product.sizes?.[line.size]?.[0],
    line.removed.length ? 'Sin ' + line.removed.map(index => ingredients[index].toLowerCase()).join(', ') : product.ingredients && 'Con todo',
    line.broth && 'Con consomé',
    line.fries && 'Con papas',
    line.notes && 'Nota: ' + line.notes
  ].filter(Boolean).join(' · ');
}

function total() {
  return lines.reduce((sum, line) => sum + unitPrice(line) * line.quantity, 0);
}

function saveOrder() {
  try { localStorage.setItem(STORAGE, JSON.stringify(lines)); } catch {}
  renderOrder();
}

function draft() {
  const product = products[currentId];
  return {
    id: currentId,
    size: product.sizes ? Number(controls.portion.value) : 0,
    removed: product.ingredients ? ingredientInputs.flatMap((input, index) => input.checked ? [] : [index]) : [],
    broth: Boolean(product.broth && controls.broth.checked),
    fries: Boolean(product.fries && controls['extra-fries'].checked),
    notes: product.notes ? controls.notes.value.trim().replace(/\s+/g, ' ') : '',
    quantity: controls.quantity.valueAsNumber
  };
}

function updateSubtotal() {
  const line = draft();
  const subtotal = controls.quantity.validity.valid ? money(unitPrice(line) * line.quantity) : '—';
  byId('subtotal').value = subtotal;
  byId('add-line').disabled = !controls.quantity.validity.valid;
  byId('quantity-down').disabled = controls.quantity.valueAsNumber <= 1;
  byId('quantity-up').disabled = controls.quantity.valueAsNumber >= 999;
  byId('add-line').textContent = (editIndex === -1 ? 'Agregar al pedido' : 'Guardar cambios') + ' · ' + subtotal;
}

function openProduct(id, existing, index = -1) {
  const product = products[id];
  returnToCart = order.open;
  if (returnToCart) order.close();
  currentId = id;
  editIndex = index;
  form.reset();
  byId('options-title').textContent = product.name;
  const image = photos[id]?.cloneNode();
  const photo = byId('product-photo');
  photo.replaceChildren(...(image ? [image] : []));
  photo.hidden = !image;
  byId('ingredients').hidden = !product.ingredients;
  byId('broth-option').hidden = !product.broth;
  byId('fries-option').hidden = !product.fries;
  byId('fries-label').textContent = 'Agregar papas (+' + money(product.fries || 0) + ')';
  byId('portion-option').hidden = !product.sizes;
  byId('notes-option').hidden = !product.notes;
  byId('notes-label').textContent = id === 'agua' ? 'Sabor (opcional)' : id === 'refresco' ? 'Refresco de tu preferencia (opcional)' : 'Notas especiales (opcional)';
  controls.portion.replaceChildren(...(product.sizes ?? []).map(([label, price], position) => new Option(label + ' · ' + money(price), position)));
  if (existing) {
    controls.portion.value = existing.size;
    ingredientInputs.forEach((input, position) => { input.checked = !existing.removed.includes(position); });
    controls.broth.checked = existing.broth;
    controls['extra-fries'].checked = existing.fries;
    controls.notes.value = existing.notes;
    controls.quantity.value = index === -1 ? 1 : existing.quantity;
  }
  updateSubtotal();
  options.showModal();
}

function element(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function action(label, callback, className = 'secondary') {
  const button = element('button', label, className);
  button.type = 'button';
  button.addEventListener('click', callback);
  return button;
}

function summary(line) {
  const item = element('li', '', 'order-item');
  const title = element('strong', line.quantity + ' × ' + products[line.id].name + ' · ' + money(line.quantity * unitPrice(line)));
  const detail = element('div', '', 'line-summary');
  const text = element('div', '');
  text.append(title, element('p', [money(unitPrice(line)) + ' por unidad', description(line)].filter(Boolean).join(' · ')));
  const image = photos[line.id]?.cloneNode();
  if (image) {
    image.alt = '';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    detail.append(image);
  }
  detail.append(text);
  item.append(detail);
  return item;
}

function renderOrder() {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  byId('view-order').textContent = count ? 'Ver mi pedido · ' + count + (count === 1 ? ' producto · ' : ' productos · ') + money(total()) : 'Ver mi pedido';
  byId('review').disabled = !count;
  byId('empty-order').hidden = Boolean(count);
  byId('order-total').textContent = money(total());
  byId('cart-lines').replaceChildren(...lines.map((line, index) => {
    const item = summary(line);
    const actions = element('div', '', 'line-actions');
    actions.append(
      action('−1', () => {
        if (line.quantity > 1) {
          line.quantity--;
          saveOrder();
        }
      }),
      action('+1', () => { if (line.quantity < 999) { line.quantity++; saveOrder(); } }),
      action('Editar', () => openProduct(line.id, line, index)),
      action('Duplicar', () => openProduct(line.id, line)),
      action('Eliminar', () => {
        if (window.confirm('¿Quitar ' + products[line.id].name.toLowerCase() + ' del pedido?')) {
          lines.splice(index, 1);
          saveOrder();
        }
      })
    );
    actions.firstElementChild.disabled = line.quantity === 1;
    item.append(actions);
    return item;
  }));
}

for (const button of productButtons) {
  const product = products[button.dataset.product];
  const price = button.closest('article').querySelector('.price');
  price.textContent = (product.sizes ? 'Desde ' : '') + money(product.price);
  button.addEventListener('click', () => openProduct(button.dataset.product));
}

function changeQuantity(step) {
  const quantity = controls.quantity;
  quantity.value = Math.max(1, Math.min(999, (quantity.valueAsNumber || 0) + step));
  updateSubtotal();
}

byId('quantity-down').addEventListener('click', () => changeQuantity(-1));
byId('quantity-up').addEventListener('click', () => changeQuantity(1));
form.addEventListener('input', () => {
  byId('product-error').textContent = '';
  updateSubtotal();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const line = draft();
  const match = lines.findIndex((existing, index) => index !== editIndex && variant(existing) === variant(line));
  if (match !== -1 && lines[match].quantity + line.quantity > 999) {
    byId('product-error').textContent = 'El límite por preparación es de 999 unidades.';
    return;
  }
  if (match !== -1) {
    lines[match].quantity += line.quantity;
    if (editIndex !== -1) lines.splice(editIndex, 1);
  } else if (editIndex === -1) {
    lines.push(line);
  } else {
    lines[editIndex] = line;
  }
  saveOrder();
  clearTimeout(statusTimeout);
  byId('status').textContent = editIndex === -1 ? 'Agregado a tu pedido' : 'Producto actualizado';
  statusTimeout = setTimeout(() => { byId('status').textContent = ''; }, 2500);
  options.close();
});

options.addEventListener('close', () => {
  byId('product-error').textContent = '';
  if (returnToCart) order.showModal();
});
byId('close-options').addEventListener('click', () => options.close());
byId('view-order').addEventListener('click', () => order.showModal());
byId('continue').addEventListener('click', () => order.close());
byId('review').addEventListener('click', () => {
  byId('checkout-lines').replaceChildren(...lines.map(summary));
  byId('checkout-total').textContent = money(total()) + ' MXN';
  order.close();
  checkout.showModal();
});
byId('back-cart').addEventListener('click', () => { checkout.close(); order.showModal(); });

function orderMessage(name, reference, notes) {
  return [
    'Pedido en el local · Tostadas del Fin',
    'Nombre: ' + name,
    reference && 'Mesa o ubicación: ' + reference,
    '',
    ...lines.map(line => {
      const details = description(line);
      return line.quantity + ' × ' + products[line.id].name + (details ? ' (' + details + ')' : '') + ' — ' + money(line.quantity * unitPrice(line));
    }),
    '',
    'Total: ' + money(total()) + ' MXN',
    notes && 'Indicaciones: ' + notes
  ].filter(value => value !== false).join('\n');
}

byId('checkout-form').addEventListener('submit', event => {
  event.preventDefault();
  const nameField = byId('customer');
  const name = nameField.value.trim();
  if (!name) {
    nameField.value = '';
    nameField.reportValidity();
    return;
  }
  const reference = byId('location').value.trim();
  const notes = byId('order-notes').value.trim().replace(/\s+/g, ' ');
  const message = orderMessage(name, reference || false, notes || false);
  window.location.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(message);
});
renderOrder();
