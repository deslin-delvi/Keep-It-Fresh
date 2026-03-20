// Track active expiry pill filter independently from category dropdown
window._activeExpiryFilter = 'all';

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = './login.html';
  } else {
    const user = JSON.parse(localStorage.getItem('user'));
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user) {
      userNameElement.textContent = `Hello, ${user.name}`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadGroceries();
  setCurrentDate();

  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('add-grocery-btn').addEventListener('click', openAddGroceryModal);

  // When category changes, reset expiry pill and reload
  document.getElementById('expiry-filter').addEventListener('change', () => {
    window._activeExpiryFilter = 'all';
    loadGroceries();
  });

  const closeButtons = document.querySelectorAll('.close-btn');
  closeButtons.forEach(button => button.addEventListener('click', closeModals));

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeModals();
  });

  document.getElementById('add-grocery-form').addEventListener('submit', addGrocery);
  document.getElementById('edit-grocery-form').addEventListener('submit', updateGrocery);
});

function setCurrentDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('grocery-purchase-date').value = today;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = './login.html';
}

function openAddGroceryModal() {
  document.getElementById('add-grocery-modal').style.display = 'block';
  setCurrentDate();
}

function openEditGroceryModal(grocery) {
  document.getElementById('edit-grocery-id').value = grocery._id;
  document.getElementById('edit-grocery-name').value = grocery.name;
  document.getElementById('edit-grocery-quantity').value = grocery.quantity;
  document.getElementById('edit-grocery-unit').value = grocery.unit;
  document.getElementById('edit-grocery-purchase-date').value = formatDateForInput(grocery.purchaseDate);
  document.getElementById('edit-grocery-expiry-date').value = formatDateForInput(grocery.expiryDate);
  document.getElementById('edit-grocery-category').value = grocery.category;
  document.getElementById('edit-grocery-notes').value = grocery.notes || '';
  document.getElementById('edit-grocery-modal').style.display = 'block';
}

function closeModals() {
  document.getElementById('add-grocery-modal').style.display = 'none';
  document.getElementById('edit-grocery-modal').style.display = 'none';
  document.getElementById('add-grocery-form').reset();
  document.getElementById('edit-grocery-form').reset();
}

// ── Summary Stats Bar ──
// categoryFiltered = groceries already narrowed to selected category
// fullGroceries    = all groceries (used to re-render when pill is clicked)
function renderStatsBar(categoryFiltered, fullGroceries) {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // Stats count from category-filtered list so numbers reflect current category
  const total        = categoryFiltered.length;
  const fresh        = categoryFiltered.filter(g => new Date(g.expiryDate) > nextWeek).length;
  const expiringSoon = categoryFiltered.filter(g => {
    const d = new Date(g.expiryDate);
    return d >= today && d <= nextWeek;
  }).length;
  const expired      = categoryFiltered.filter(g => new Date(g.expiryDate) < today).length;

  let bar = document.getElementById('stats-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'stats-bar';
    const groceryList = document.getElementById('grocery-list');
    groceryList.parentNode.insertBefore(bar, groceryList);
  }

  bar.innerHTML = `
    <div class="stat-pill stat-total"   data-filter="all">
      <span class="stat-num">${total}</span>
      <span class="stat-label">Total</span>
    </div>
    <div class="stat-pill stat-fresh"   data-filter="fresh">
      <span class="stat-num">${fresh}</span>
      <span class="stat-label">Fresh</span>
    </div>
    <div class="stat-pill stat-warning" data-filter="expiring-soon">
      <span class="stat-num">${expiringSoon}</span>
      <span class="stat-label">Expiring Soon</span>
    </div>
    <div class="stat-pill stat-danger"  data-filter="expired">
      <span class="stat-num">${expired}</span>
      <span class="stat-label">Expired</span>
    </div>
  `;

  // Pill click: apply expiry filter within current category
  bar.querySelectorAll('.stat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      window._activeExpiryFilter = pill.dataset.filter;
      renderGroceryList(fullGroceries);
      bar.querySelectorAll('.stat-pill').forEach(p => p.classList.remove('stat-active'));
      pill.classList.add('stat-active');
    });
  });

  // Highlight active pill
  bar.querySelectorAll('.stat-pill').forEach(pill => {
    pill.classList.toggle('stat-active', pill.dataset.filter === window._activeExpiryFilter);
  });
}

// ── Render grocery list ──
function renderGroceryList(groceries) {
  const groceryList    = document.getElementById('grocery-list');
  const categoryFilter = document.getElementById('expiry-filter').value;
  const today          = new Date();
  const nextWeek       = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // Step 1: filter by category
  const categoryFiltered = categoryFilter === 'all'
    ? groceries
    : groceries.filter(g => g.category === categoryFilter);

  // Step 2: update stats bar to reflect this category
  renderStatsBar(categoryFiltered, groceries);

  // Step 3: further filter by expiry pill
  let filtered = [...categoryFiltered];
  if (window._activeExpiryFilter === 'expired') {
    filtered = filtered.filter(g => new Date(g.expiryDate) < today);
  } else if (window._activeExpiryFilter === 'expiring-soon') {
    filtered = filtered.filter(g => {
      const d = new Date(g.expiryDate);
      return d >= today && d <= nextWeek;
    });
  } else if (window._activeExpiryFilter === 'fresh') {
    filtered = filtered.filter(g => new Date(g.expiryDate) > nextWeek);
  }

  if (filtered.length === 0) {
    groceryList.innerHTML = `
      <div class="empty-list">
        <p>No items match this filter. Try a different category or expiry status.</p>
      </div>`;
    return;
  }

  let groceryHTML = '';
  filtered.forEach(grocery => {
    const expiryDate = new Date(grocery.expiryDate);
    const daysDiff   = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

    let expiryClass = 'fresh';
    let expiryText  = `${daysDiff} days left`;

    if (daysDiff < 0) {
      expiryClass = 'expired';
      expiryText  = `Expired ${Math.abs(daysDiff)} days ago`;
    } else if (daysDiff <= 7) {
      expiryClass = 'expiring-soon';
      expiryText  = daysDiff === 0 ? 'Expires today' : `${daysDiff} days left`;
    }

    groceryHTML += `
      <div class="grocery-item" data-id="${grocery._id}">
        <div class="grocery-info">
          <div class="grocery-name">${grocery.name}</div>
          <div class="grocery-details">
            <span>${grocery.quantity} ${grocery.unit}</span>
            <span class="grocery-category">${grocery.category}</span>
            <div class="grocery-expiry">
              <span class="expiry-label">Expiry:</span>
              <span class="expiry-date ${expiryClass}">${formatDate(grocery.expiryDate)} (${expiryText})</span>
            </div>
          </div>
        </div>
        <div class="grocery-item-actions">
          <button class="btn btn-small btn-secondary edit-btn"   data-id="${grocery._id}">Edit</button>
          <button class="btn btn-small btn-danger    delete-btn" data-id="${grocery._id}">Delete</button>
        </div>
      </div>`;
  });

  groceryList.innerHTML = groceryHTML;

  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', () => {
      const grocery = groceries.find(g => g._id === button.getAttribute('data-id'));
      openEditGroceryModal(grocery);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const groceryId = button.getAttribute('data-id');
      const grocery   = groceries.find(g => g._id === groceryId);
      const itemName  = grocery ? grocery.name : 'this item';
      const confirmed = await showConfirm(`Delete "${itemName}" from your list?`);
      if (confirmed) deleteGrocery(groceryId);
    });
  });
}

// Load groceries from API
async function loadGroceries() {
  const groceryList = document.getElementById('grocery-list');
  const token       = localStorage.getItem('token');

  try {
    const response = await fetch('/api/groceries', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch groceries');

    const responseData = await response.json();
    if (!responseData.success || !responseData.groceries) {
      throw new Error('Invalid response format');
    }

    const groceries = responseData.groceries;
    groceries.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (groceries.length === 0) {
      // Show zeroed stats bar even when empty
      renderStatsBar([], []);
      groceryList.innerHTML = `
        <div class="empty-list">
          <p>No groceries found. Add some by clicking "Add New Grocery"!</p>
        </div>`;
      return;
    }

    renderGroceryList(groceries);

  } catch (error) {
    console.error('Error loading groceries:', error);
    showToast('Error loading groceries. Please try again.', 'error');
    groceryList.innerHTML = `
      <div class="empty-list">
        <p>Error loading groceries. Please try again later.</p>
      </div>`;
  }
}

// Add a new grocery
async function addGrocery(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const groceryData = {
    name:         document.getElementById('grocery-name').value,
    quantity:     document.getElementById('grocery-quantity').value,
    unit:         document.getElementById('grocery-unit').value,
    purchaseDate: document.getElementById('grocery-purchase-date').value,
    expiryDate:   document.getElementById('grocery-expiry-date').value,
    category:     document.getElementById('grocery-category').value,
    notes:        document.getElementById('grocery-notes').value
  };

  try {
    const response = await fetch('/api/groceries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(groceryData)
    });

    if (!response.ok) throw new Error('Failed to add grocery');

    closeModals();
    loadGroceries();
    showToast(`"${groceryData.name}" added to your list! 🛒`, 'success');

  } catch (error) {
    console.error('Error adding grocery:', error);
    showToast('Error adding grocery. Please try again.', 'error');
  }
}

// Update a grocery
async function updateGrocery(e) {
  e.preventDefault();
  const token     = localStorage.getItem('token');
  const groceryId = document.getElementById('edit-grocery-id').value;

  const groceryData = {
    name:         document.getElementById('edit-grocery-name').value,
    quantity:     document.getElementById('edit-grocery-quantity').value,
    unit:         document.getElementById('edit-grocery-unit').value,
    purchaseDate: document.getElementById('edit-grocery-purchase-date').value,
    expiryDate:   document.getElementById('edit-grocery-expiry-date').value,
    category:     document.getElementById('edit-grocery-category').value,
    notes:        document.getElementById('edit-grocery-notes').value
  };

  try {
    const response = await fetch(`/api/groceries/${groceryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(groceryData)
    });

    if (!response.ok) throw new Error('Failed to update grocery');

    closeModals();
    loadGroceries();
    showToast(`"${groceryData.name}" updated successfully! ✏️`, 'success');

  } catch (error) {
    console.error('Error updating grocery:', error);
    showToast('Error updating grocery. Please try again.', 'error');
  }
}

// Delete a grocery
async function deleteGrocery(groceryId) {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`/api/groceries/${groceryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete grocery');

    loadGroceries();
    showToast('Item removed from your list.', 'info');

  } catch (error) {
    console.error('Error deleting grocery:', error);
    showToast('Error deleting item. Please try again.', 'error');
  }
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDateForInput(dateString) {
  return new Date(dateString).toISOString().split('T')[0];
}