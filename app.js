const menuButton = document.querySelector('.menu-toggle');
const pageMenu = document.querySelector('.page-menu');

if (menuButton && pageMenu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Open page navigation' : 'Close page navigation');
    pageMenu.hidden = isOpen;
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.menu-wrap')) {
      pageMenu.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open page navigation');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      pageMenu.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open page navigation');
      menuButton.focus();
    }
  });

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  pageMenu.querySelectorAll('[data-page]').forEach((link) => {
    if (link.dataset.page === currentPage) link.setAttribute('aria-current', 'page');
  });
}

const cartStorageKey = 'furniro-cart-items';
let cartItems = [];

try {
  const savedItems = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
  if (Array.isArray(savedItems)) cartItems = savedItems;
} catch {
  cartItems = [];
}

function saveCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach((count) => {
    count.textContent = String(itemCount);
  });
}

function renderCart() {
  const cartList = document.querySelector('#cart-items');
  if (!cartList) return;

  const emptyState = document.querySelector('#cart-empty');
  const cartContent = document.querySelector('#cart-content');
  const total = document.querySelector('#cart-total');
  const isEmpty = cartItems.length === 0;

  emptyState.hidden = !isEmpty;
  cartContent.hidden = isEmpty;
  cartList.replaceChildren();

  let subtotal = 0;
  cartItems.forEach((item, index) => {
    subtotal += item.price * item.quantity;

    const row = document.createElement('article');
    row.className = 'cart-item';
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.name;
    const details = document.createElement('div');
    details.className = 'cart-item-details';
    const title = document.createElement('h2');
    title.textContent = item.name;
    const description = document.createElement('p');
    description.textContent = item.description;
    const price = document.createElement('strong');
    price.textContent = `$${item.price.toLocaleString('en-US')}`;
    details.append(title, description, price);

    const controls = document.createElement('div');
    controls.className = 'cart-item-controls';
    const quantity = document.createElement('span');
    quantity.textContent = `Qty ${item.quantity}`;
    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.dataset.cartAction = 'decrease';
    decrease.dataset.index = String(index);
    decrease.setAttribute('aria-label', `Remove one ${item.name}`);
    decrease.textContent = '−';
    const increase = document.createElement('button');
    increase.type = 'button';
    increase.dataset.cartAction = 'increase';
    increase.dataset.index = String(index);
    increase.setAttribute('aria-label', `Add one ${item.name}`);
    increase.textContent = '+';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.cartAction = 'remove';
    remove.dataset.index = String(index);
    remove.className = 'cart-remove';
    remove.setAttribute('aria-label', `Remove ${item.name} from cart`);
    remove.title = 'Remove item';
    const removeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    removeIcon.setAttribute('viewBox', '0 0 24 24');
    removeIcon.setAttribute('width', '16');
    removeIcon.setAttribute('height', '16');
    removeIcon.setAttribute('fill', 'none');
    removeIcon.setAttribute('stroke', 'currentColor');
    removeIcon.setAttribute('stroke-width', '1.6');
    removeIcon.setAttribute('stroke-linecap', 'round');
    removeIcon.setAttribute('stroke-linejoin', 'round');
    removeIcon.setAttribute('aria-hidden', 'true');
    removeIcon.innerHTML = '<path d="M3 6h18M8 6V4h8v2m2 0-1 14H7L6 6m4 5v6m4-6v6" />';
    remove.append(removeIcon);
    controls.append(decrease, quantity, increase, remove);
    row.append(image, details, price, controls);
    cartList.append(row);
  });

  if (total) total.textContent = `$${subtotal.toLocaleString('en-US')}`;
}

document.querySelectorAll('.add-to-cart').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.product-card');
    const name = card.querySelector('h3').textContent.trim();
    const price = Number(card.querySelector('.product-info strong').textContent.replace(/[^0-9.]/g, ''));
    const existingItem = cartItems.find((item) => item.name === name);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({
        name,
        description: card.querySelector('.product-info p').textContent.trim(),
        price,
        image: card.querySelector('img').src,
        quantity: 1
      });
    }

    saveCart();
    button.textContent = 'Added';
    window.setTimeout(() => { button.textContent = 'Add to cart'; }, 1200);
  });
});

const cartList = document.querySelector('#cart-items');
if (cartList) {
  cartList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;

    const index = Number(button.dataset.index);
    const item = cartItems[index];
    if (!item) return;

    if (button.dataset.cartAction === 'increase') item.quantity += 1;
    if (button.dataset.cartAction === 'decrease') item.quantity -= 1;
    if (button.dataset.cartAction === 'remove' || item.quantity <= 0) cartItems.splice(index, 1);
    saveCart();
    renderCart();
  });
}

saveCart();
renderCart();

const filters = document.querySelectorAll('.filter-button');
const searchInput = document.querySelector('.shop-search');
const shopCards = document.querySelectorAll('.shop-results .product-card');
const noResults = document.querySelector('.no-results');
let activeCategory = 'all';

function updateProducts() {
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  let visibleCount = 0;

  shopCards.forEach((card) => {
    const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
    const matchesSearch = card.textContent.toLowerCase().includes(searchTerm);
    const isVisible = matchesCategory && matchesSearch;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  if (noResults) noResults.hidden = visibleCount > 0;
}

filters.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    filters.forEach((filter) => filter.setAttribute('aria-pressed', String(filter === button)));
    updateProducts();
  });
});

if (searchInput) searchInput.addEventListener('input', updateProducts);

document.querySelectorAll('.newsletter-form, .contact-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    if (message) message.textContent = form.classList.contains('contact-form')
      ? 'Thanks for reaching out. We’ll be in touch soon.'
      : 'You’re on the list. Keep an eye on your inbox.';
    form.reset();
  });
});