let allProducts = [];
let filteredProducts = [];
let currentCategory = "all";
let isLoading = true;
const productsContainer = document.getElementById('productsContainer');
const loadingSpinner = document.getElementById("loadingSpinner");
const searchInput = document.getElementById("searchInput");
const searchSuggestions = document.getElementById("searchSuggestions");
const categoryChips = document.querySelectorAll('.category-chip');
const menuIcon = document.getElementById('menuIcon');
const bottomSheet = document.getElementById("bottomSheet");
const closeSheet = document.querySelector('.close-sheet');
const menuItems = document.querySelectorAll(".menu-item");
const productModal = document.getElementById('productModal');
const closeModal = document.querySelector(".close-modal");
const toast = document.getElementById("toast");
const customDropdown = document.getElementById("customDropdown");
const selectedCategory = document.getElementById("selectedCategory");
const dropdownItems = document.querySelectorAll('.custom-dropdown-item');
// ========== NEW NAVIGATION FUNCTIONALITY - ADD THIS ==========

// Navigation functionality for new nav bar
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all items
        navItems.forEach(nav => nav.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');
        
        // Get category from nav item
        const category = item.getAttribute('data-category');
        
        // Update the category chips to match
        categoryChips.forEach(chip => {
            if (chip.dataset.category === category) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
        
        // Update dropdown to match
        updateCustomDropdown(category);
        
        // Filter products
        filterByCategory(category);
        
        // Scroll to products
        window.scrollTo({ top: 70, behavior: 'smooth' });
    });
});

// Wishlist counter (for the heart icon)
let wishlistCount = 0;
const wishlistCountEl = document.querySelector('.wishlist-count');

// ========== END OF NEW CODE ==========

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  setupEventListeners();
  setupCustomDropdown();
});
async function fetchProducts() {
  isLoading = true;
  loadingSpinner.style.display = "flex";
  productsContainer.style.display = "none";
  try {
    const _0x1d489a = await fetch("https://sheets.googleapis.com/v4/spreadsheets/1uQ8682WiB6OfPnKyl390l3xz981_wpi439Ms97bSd4I/values/Products?key=AIzaSyAq3X8C0HxkmY-l1DQlbmtqespOhauVjm0");
    if (!_0x1d489a.ok) {
      throw new Error("HTTP error! Status: " + _0x1d489a.status);
    }
    const _0x41d58c = await _0x1d489a.json();
    if (!_0x41d58c.values || _0x41d58c.values.length === 0x0) {
      throw new Error("No data found in the Google Sheet");
    }
    if (_0x41d58c.values.length < 0x2) {
      throw new Error("Google Sheet must have at least 2 rows: headers in Row 1 and product data starting from Row 2");
    }
    const _0x1c78ba = _0x41d58c.values[0x0];
    const _0x40caba = ["Name", "PriceMin", "PriceMax", 'Category', "BuyLink", "BuyOn", "ImageURL", "CreatedTime", "Description", 'ProductCode'];
    const _0x19f230 = {};
    _0x40caba.forEach(_0x4a048f => {
      const _0x1380b6 = _0x1c78ba.findIndex(_0x26e9d2 => _0x26e9d2.trim().toLowerCase() === _0x4a048f.toLowerCase());
      if (_0x1380b6 === -0x1) {
        throw new Error("Required column \"" + _0x4a048f + "\" not found in Google Sheet headers");
      }
      _0x19f230[_0x4a048f.toLowerCase()] = _0x1380b6;
    });
    allProducts = [];
    for (let _0x4cd106 = 0x1; _0x4cd106 < _0x41d58c.values.length; _0x4cd106++) {
      const _0x4169db = _0x41d58c.values[_0x4cd106];
      if (_0x4169db.length < _0x1c78ba.length) {
        console.warn("Row " + (_0x4cd106 + 0x1) + " has insufficient data, skipping");
        continue;
      }
      const _0x1de041 = _0x19f230.productcode;
      if (!_0x4169db[_0x1de041] || _0x4169db[_0x1de041].trim() === '') {
        console.warn("Row " + (_0x4cd106 + 0x1) + " is missing required ProductCode, skipping");
        continue;
      }
      const _0x314c14 = {
        'name': _0x4169db[_0x19f230.name] || "Unknown Product",
        'priceMin': _0x4169db[_0x19f230.pricemin] || '0',
        'priceMax': _0x4169db[_0x19f230.pricemax] || '0',
        'category': _0x4169db[_0x19f230.category] || "Uncategorized",
        'buyLink': _0x4169db[_0x19f230.buylink] || '#',
        'buyOn': _0x4169db[_0x19f230.buyon] || 'Store',
        'imageURL': _0x4169db[_0x19f230.imageurl] || "https://via.placeholder.com/300",
        'createdTime': _0x4169db[_0x19f230.createdtime] || new Date().toISOString(),
        'description': _0x4169db[_0x19f230.description] || "No description available",
        'productCode': _0x4169db[_0x19f230.productcode],
        'views': Math.floor(Math.random() * 0x7d0) + 0x3e8
      };
      allProducts.push(_0x314c14);
    }
    if (allProducts.length === 0x0) {
      throw new Error("No valid products found in the Google Sheet. Make sure ProductCode is provided for each product.");
    }
    allProducts.sort((_0x40baad, _0x164ba6) => {
      return new Date(_0x164ba6.createdTime) - new Date(_0x40baad.createdTime);
    });
    filteredProducts = [...allProducts];
    renderProducts();
    checkUrlForProductCode();
  } catch (_0x9649d4) {
    console.error("Error fetching products:", _0x9649d4);
    productsContainer.innerHTML = "\n            <div class=\"error-message\">\n                <i class=\"fas fa-exclamation-circle\"></i>\n                <h3>Error Loading Products</h3>\n                <p>There was a problem loading products from Google Sheets: " + _0x9649d4.message + "</p>\n                <button onclick=\"fetchProducts()\">Try Again</button>\n            </div>\n        ";
    productsContainer.style.display = 'block';
  } finally {
    isLoading = false;
    loadingSpinner.style.display = "none";
  }
}
function setupCustomDropdown() {
  if (!customDropdown) {
    return;
  }
  customDropdown.querySelector(".custom-dropdown-selected").addEventListener("click", () => {
    customDropdown.classList.toggle("open");
  });
  document.addEventListener("click", _0x4c143b => {
    if (!customDropdown.contains(_0x4c143b.target)) {
      customDropdown.classList.remove("open");
    }
  });
  dropdownItems.forEach(_0x533664 => {
    _0x533664.addEventListener('click', () => {
      selectedCategory.textContent = _0x533664.textContent;
      dropdownItems.forEach(_0x22d7b1 => _0x22d7b1.classList.remove('active'));
      _0x533664.classList.add("active");
      customDropdown.classList.remove("open");
      const _0x4a30a1 = _0x533664.dataset.value;
      categoryChips.forEach(_0x2680b8 => {
        if (_0x2680b8.dataset.category === _0x4a30a1) {
          _0x2680b8.classList.add("active");
        } else {
          _0x2680b8.classList.remove('active');
        }
      });
      filterByCategory(_0x4a30a1);
    });
  });
}
function setupEventListeners() {
  searchInput.addEventListener("input", _0x17cd6b => {
    const _0x3194d7 = _0x17cd6b.target.value;
    if (_0x3194d7.trim() === '') {
      searchSuggestions.style.display = 'none';
      filterByCategory(currentCategory);
    } else {
      showSearchSuggestions(_0x3194d7);
    }
  });
  searchInput.addEventListener("keypress", _0x4e053 => {
    if (_0x4e053.key === 'Enter') {
      const _0x224a62 = _0x4e053.target.value;
      if (_0x224a62.trim() !== '') {
        searchSuggestions.style.display = "none";
        filterBySearch(_0x224a62);
      }
    }
  });
  categoryChips.forEach(_0x3b24fe => {
    _0x3b24fe.addEventListener("click", () => {
      categoryChips.forEach(_0x4bc2bf => _0x4bc2bf.classList.remove('active'));
      _0x3b24fe.classList.add("active");
      const _0x2268a9 = _0x3b24fe.dataset.category;
      updateCustomDropdown(_0x2268a9);
      filterByCategory(_0x2268a9);
    });
  });
  menuIcon.addEventListener('click', () => {
    bottomSheet.classList.add("active");
  });
  closeSheet.addEventListener("click", () => {
    bottomSheet.classList.remove("active");
  });
  closeModal.addEventListener("click", () => {
    productModal.style.display = "none";
    document.body.style.overflow = 'auto';
  });
  window.addEventListener("click", _0x35ceca => {
    if (_0x35ceca.target === productModal) {
      productModal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });
  window.addEventListener("click", _0x5b6836 => {
    if (_0x5b6836.target === bottomSheet) {
      bottomSheet.classList.remove('active');
    }
  });
  menuItems.forEach(_0x12983a => {
    _0x12983a.addEventListener("click", () => {
      bottomSheet.classList.remove("active");
      window.location.href = "info.html?section=" + _0x12983a.dataset.page;
    });
  });
}
function updateCustomDropdown(_0x7f6106) {
  if (!customDropdown) {
    return;
  }
  const _0x410494 = document.querySelector(".custom-dropdown-item[data-value=\"" + _0x7f6106 + "\"]");
  if (_0x410494) {
    selectedCategory.textContent = _0x410494.textContent;
    dropdownItems.forEach(_0x23d598 => _0x23d598.classList.remove("active"));
    _0x410494.classList.add('active');
  }
}
function checkUrlForProductCode() {
  const _0xf286d0 = new URLSearchParams(window.location.search);
  let _0x1e2218 = null;
  for (const [_0x4b08d2, _0x3ce550] of _0xf286d0.entries()) {
    if (_0x4b08d2.startsWith("product")) {
      _0x1e2218 = _0x4b08d2.replace("product", '');
      break;
    }
  }
  if (!_0x1e2218 && _0xf286d0.has("code")) {
    _0x1e2218 = _0xf286d0.get("code");
  }
  if (_0x1e2218) {
    const _0x2262e9 = allProducts.find(_0x834084 => _0x834084.productCode === _0x1e2218);
    if (_0x2262e9) {
      searchInput.value = _0x1e2218;
      filterBySearch(_0x1e2218);
      setTimeout(() => {
        openProductModal(_0x2262e9);
      }, 0x1f4);
    }
  }
}
function showSearchSuggestions(_0x3a7407) {
  const _0x513375 = _0x3a7407.toLowerCase().trim();
  if (_0x513375 === '') {
    searchSuggestions.style.display = "none";
    return;
  }
  const _0xb6c668 = allProducts.filter(_0x222873 => _0x222873.name.toLowerCase().includes(_0x513375) || _0x222873.description.toLowerCase().includes(_0x513375) || _0x222873.category.toLowerCase().includes(_0x513375) || _0x222873.productCode.toLowerCase().includes(_0x513375)).slice(0x0, 0x5);
  if (_0xb6c668.length === 0x0) {
    searchSuggestions.style.display = "none";
    return;
  }
  searchSuggestions.innerHTML = '';
  _0xb6c668.forEach(_0x206f4f => {
    const _0xea2075 = document.createElement("div");
    _0xea2075.className = "search-suggestion-item";
    _0xea2075.innerHTML = "\n            <span class=\"suggestion-code\">" + _0x206f4f.productCode + "</span>\n            <span class=\"suggestion-name\">" + _0x206f4f.name + "</span>\n        ";
    _0xea2075.addEventListener("click", () => {
      searchInput.value = _0x206f4f.productCode;
      searchSuggestions.style.display = "none";
      filterBySearch(_0x206f4f.productCode);
      setTimeout(() => {
        openProductModal(_0x206f4f);
      }, 0x64);
    });
    searchSuggestions.appendChild(_0xea2075);
  });
  searchSuggestions.style.display = "block";
}
function renderProducts() {
  if (filteredProducts.length === 0x0) {
    productsContainer.innerHTML = "\n            <div class=\"no-products\">\n                <i class=\"fas fa-search\"></i>\n                <h3>No Products Found</h3>\n                <p>Try adjusting your search or category filter.</p>\n            </div>\n        ";
  } else {
    productsContainer.innerHTML = '';
    filteredProducts.forEach(_0x2a466b => {
      const _0x334261 = isProductNew(_0x2a466b.createdTime);
      if (!_0x2a466b.views) {
        _0x2a466b.views = Math.floor(Math.random() * 0x7d0) + 0x3e8;
      }
      const _0x18439d = document.createElement("div");
      _0x18439d.className = "product-card";
      _0x18439d.innerHTML = "\n                <div class=\"product-image-container\">\n                    <img src=\"" + _0x2a466b.imageURL + "\" alt=\"" + _0x2a466b.name + "\" class=\"product-image\" onerror=\"this.src='https://via.placeholder.com/300?text=Image+Not+Found'\">\n                    <div class=\"share-icon\">\n                        <i class=\"fas fa-share-alt\"></i>\n                    </div>\n                    " + (_0x334261 ? "<div class=\"new-tag\">New</div>" : '') + "\n                </div>\n                <div class=\"product-info\">\n                    <div class=\"product-code\">" + _0x2a466b.productCode + "</div>\n                    <div class=\"product-name\">" + _0x2a466b.name + "</div>\n                    <div class=\"product-price\">₹" + _0x2a466b.priceMin + " ~ ₹" + _0x2a466b.priceMax + "</div>\n                    <div class=\"product-views\"><i class=\"fas fa-eye\"></i> " + _0x2a466b.views + " views</div>\n                    <a href=\"" + _0x2a466b.buyLink + "\" class=\"buy-button\" target=\"_blank\">Buy on " + _0x2a466b.buyOn + "</a>\n                </div>\n            ";
      _0x18439d.addEventListener('click', _0x59573c => {
        if (_0x59573c.target.closest(".buy-button") || _0x59573c.target.closest(".share-icon")) {
          return;
        }
        openProductModal(_0x2a466b);
      });
      const _0x3aad83 = _0x18439d.querySelector('.share-icon');
      _0x3aad83.addEventListener("click", _0x5e53da => {
        _0x5e53da.stopPropagation();
        shareProduct(_0x2a466b);
      });
      productsContainer.appendChild(_0x18439d);
    });
  }
  productsContainer.style.display = "grid";
}
function isProductNew(_0x2783b6) {
  const _0x4316e4 = new Date(_0x2783b6);
  const _0x23bc6a = new Date();
  const _0x2b9fde = Math.abs(_0x23bc6a - _0x4316e4);
  const _0x3d0cf9 = Math.ceil(_0x2b9fde / 86400000);
  return _0x3d0cf9 <= 0x7;
}
function filterByCategory(_0xe9a6c5) {
  currentCategory = _0xe9a6c5;
  if (_0xe9a6c5 === "all") {
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter(_0x353b62 => _0x353b62.category.toLowerCase().includes(_0xe9a6c5.toLowerCase()));
  }
  if (searchInput.value.trim() !== '') {
    filterBySearch(searchInput.value);
  } else {
    renderProducts();
  }
}
function filterBySearch(_0x3003a3) {
  const _0xb650c6 = _0x3003a3.toLowerCase().trim();
  if (_0xb650c6 === '') {
    filterByCategory(currentCategory);
    return;
  }
  let _0x14678a;
  if (currentCategory === "all") {
    _0x14678a = [...allProducts];
  } else {
    _0x14678a = allProducts.filter(_0x343a96 => _0x343a96.category.toLowerCase().includes(currentCategory.toLowerCase()));
  }
  filteredProducts = _0x14678a.filter(_0x1bd8f9 => _0x1bd8f9.name.toLowerCase().includes(_0xb650c6) || _0x1bd8f9.description.toLowerCase().includes(_0xb650c6) || _0x1bd8f9.category.toLowerCase().includes(_0xb650c6) || _0x1bd8f9.productCode.toLowerCase().includes(_0xb650c6));
  renderProducts();
}
function openProductModal(_0x34d0be) {
  const _0x21ea74 = document.querySelector(".modal-body");
  const _0x275d08 = document.querySelector(".related-products-container");
  _0x21ea74.innerHTML = "\n        <img src=\"" + _0x34d0be.imageURL + "\" alt=\"" + _0x34d0be.name + "\" class=\"modal-image\" onerror=\"this.src='https://via.placeholder.com/600x400?text=Image+Not+Found'\">\n        <div class=\"modal-product-code\">" + _0x34d0be.productCode + "</div>\n        <div class=\"modal-product-name\">" + _0x34d0be.name + "</div>\n        <div class=\"modal-product-price\">₹" + _0x34d0be.priceMin + " ~ ₹" + _0x34d0be.priceMax + "</div>\n        <div class=\"modal-product-views\"><i class=\"fas fa-eye\"></i> " + _0x34d0be.views + " views</div>\n        <div class=\"modal-product-description\">" + _0x34d0be.description + "</div>\n        <a href=\"" + _0x34d0be.buyLink + "\" class=\"modal-buy-button\" target=\"_blank\">Buy on " + _0x34d0be.buyOn + "</a>\n    ";
  const _0x2d62ac = allProducts.filter(_0x2c0004 => _0x2c0004.category === _0x34d0be.category && _0x2c0004.productCode !== _0x34d0be.productCode).slice(0x0, 0x4);
  _0x275d08.innerHTML = '';
  if (_0x2d62ac.length === 0x0) {
    document.querySelector('.related-products').style.display = 'none';
  } else {
    document.querySelector(".related-products").style.display = "block";
    _0x2d62ac.forEach(_0x1aaa90 => {
      const _0xe9af7a = document.createElement("div");
      _0xe9af7a.className = "related-product-card";
      _0xe9af7a.innerHTML = "\n                <img src=\"" + _0x1aaa90.imageURL + "\" alt=\"" + _0x1aaa90.name + "\" class=\"related-product-image\" onerror=\"this.src='https://via.placeholder.com/150?text=Image+Not+Found'\">\n                <div class=\"related-product-info\">\n                    <div class=\"related-product-name\">" + _0x1aaa90.name + "</div>\n                    <div class=\"related-product-price\">₹" + _0x1aaa90.priceMin + "</div>\n                    <div class=\"related-product-views\"><i class=\"fas fa-eye\"></i> " + _0x1aaa90.views + " views</div>\n                </div>\n            ";
      _0xe9af7a.addEventListener('click', () => {
        openProductModal(_0x1aaa90);
      });
      _0x275d08.appendChild(_0xe9af7a);
    });
  }
  productModal.style.display = 'block';
  document.body.style.overflow = "hidden";
}
function shareProduct(_0x2b2041) {
  const _0x6c2c34 = '' + window.location.origin + window.location.pathname + "?code=" + _0x2b2041.productCode;
  if (navigator.share) {
    navigator.share({
      'title': _0x2b2041.name + " - BUYHUT store",
      'text': "Check out this " + _0x2b2041.name + " on BUYHUT store! Price: ₹" + _0x2b2041.priceMin + " ~ ₹" + _0x2b2041.priceMax,
      'url': _0x6c2c34
    }).then(() => {
      showToast("Product shared successfully!");
    })["catch"](_0x15d86f => {
      console.error("Error sharing:", _0x15d86f);
      copyToClipboard(_0x6c2c34);
    });
  } else {
    copyToClipboard(_0x6c2c34);
  }
}
function copyToClipboard(_0x25654a) {
  const _0x77e783 = document.createElement("input");
  _0x77e783.style.position = "fixed";
  _0x77e783.style.opacity = 0x0;
  _0x77e783.value = _0x25654a;
  document.body.appendChild(_0x77e783);
  _0x77e783.select();
  document.execCommand("copy");
  document.body.removeChild(_0x77e783);
  showToast("Link copied to clipboard!");
}
function showToast(_0x32b6b3) {
  const _0x304d42 = document.getElementById("toastMessage");
  _0x304d42.textContent = _0x32b6b3;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = "none";
  }, 0xbb8);
}
