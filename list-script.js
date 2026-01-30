// Global variables
let allProducts = [];
let filteredProducts = [];
let currentStore = "";
let currentSort = "default";
const productsContainer = document.getElementById('productsContainer');
const loadingSpinner = document.getElementById("loadingSpinner");
const searchInput = document.getElementById("searchInput");
const menuIcon = document.getElementById('menuIcon');
const bottomSheet = document.getElementById("bottomSheet");
const closeSheet = document.querySelector('.close-sheet');
const menuItems = document.querySelectorAll(".menu-item");
const productModal = document.getElementById('productModal');
const closeModal = document.querySelector(".close-modal");
const toast = document.getElementById("toast");
const sortButton = document.getElementById("sortButton");
const sortOptions = document.getElementById("sortOptions");
const sortOptionElements = document.querySelectorAll(".sort-option");
const storeNameElement = document.getElementById("storeName");
const productCountElement = document.getElementById("productCount");

// Store name mapping based on code prefix
const storeNameMapping = {
    'CX': 'Cxhub',
    'FX': 'Fitzyx',
    'HX': 'Hxtrends',
    'TX': 'Txstore',
    'MX': 'Mxmart',
    'BX': 'Bxshop',
    'SX': 'Sxstyle',
    'DX': 'Dxdeals',
    'PX': 'Pxplace',
    'RX': 'Rxretail'
};

// Main BuyHut Instagram link (same for all stores)
const mainInstagramLink = 'https://www.instagram.com/buyhutstore.in?igsh=Z2YweWVraW15MGsx';

// Get store code from URL
function getStoreFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const store = urlParams.get('store');
    console.log('Store from URL:', store); // Debug log
    return store ? store.trim().toUpperCase() : '';
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    currentStore = getStoreFromURL();
    
    console.log('Current Store:', currentStore); // Debug log
    
    if (!currentStore || currentStore === '') {
        console.error('No store parameter found in URL'); // Debug log
        showError("No store specified. Redirecting to homepage...");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Set store name in header and title
    const storeName = storeNameMapping[currentStore] || `${currentStore} Store`;
    storeNameElement.textContent = storeName;
    document.getElementById('pageTitle').textContent = `${storeName} - BUYHUT store`;
    
    // Set main BuyHut Instagram link (same for all stores)
    const instagramElement = document.getElementById('storeInstagram');
    if (instagramElement) {
        instagramElement.href = mainInstagramLink;
        instagramElement.style.display = 'flex';
    }
    
    console.log('Store Name:', storeName); // Debug log
    
    fetchProducts();
    setupEventListeners();
});

// Fetch products from Google Sheets
async function fetchProducts() {
    loadingSpinner.style.display = "flex";
    productsContainer.style.display = "none";
    
    try {
        const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets/1uQ8682WiB6OfPnKyl390l3xz981_wpi439Ms97bSd4I/values/Products?key=AIzaSyAq3X8C0HxkmY-l1DQlbmtqespOhauVjm0");
        
        if (!response.ok) {
            throw new Error("HTTP error! Status: " + response.status);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            throw new Error("No data found in the Google Sheet");
        }
        
        if (data.values.length < 2) {
            throw new Error("Google Sheet must have at least 2 rows: headers in Row 1 and product data starting from Row 2");
        }
        
        const headers = data.values[0];
        const requiredColumns = ["Name", "PriceMin", "PriceMax", 'Category', "BuyLink", "BuyOn", "ImageURL", "CreatedTime", "Description", 'ProductCode'];
        const columnIndices = {};
        
        requiredColumns.forEach(col => {
            const index = headers.findIndex(h => h.trim().toLowerCase() === col.toLowerCase());
            if (index === -1) {
                throw new Error(`Required column "${col}" not found in Google Sheet headers`);
            }
            columnIndices[col.toLowerCase()] = index;
        });
        
        allProducts = [];
        
        for (let i = 1; i < data.values.length; i++) {
            const row = data.values[i];
            
            if (row.length < headers.length) {
                console.warn(`Row ${i + 1} has insufficient data, skipping`);
                continue;
            }
            
            const productCode = row[columnIndices.productcode];
            
            if (!productCode || productCode.trim() === '') {
                console.warn(`Row ${i + 1} is missing required ProductCode, skipping`);
                continue;
            }
            
            // Filter by store code (first 2 characters)
            const codePrefix = productCode.substring(0, 2).toUpperCase();
            console.log('Checking product:', productCode, 'Prefix:', codePrefix, 'Current Store:', currentStore); // Debug log
            
            if (codePrefix !== currentStore) {
                continue;
            }
            
            const product = {
                'name': row[columnIndices.name] || "Unknown Product",
                'priceMin': parseFloat(row[columnIndices.pricemin]) || 0,
                'priceMax': parseFloat(row[columnIndices.pricemax]) || 0,
                'category': row[columnIndices.category] || "Uncategorized",
                'buyLink': row[columnIndices.buylink] || '#',
                'buyOn': row[columnIndices.buyon] || 'Store',
                'imageURL': row[columnIndices.imageurl] || "https://via.placeholder.com/300",
                'createdTime': row[columnIndices.createdtime] || new Date().toISOString(),
                'description': row[columnIndices.description] || "No description available",
                'productCode': productCode,
                'views': Math.floor(Math.random() * 2000) + 1000
            };
            
            allProducts.push(product);
        }
        
        if (allProducts.length === 0) {
            showEmptyState();
        } else {
            filteredProducts = [...allProducts];
            sortProducts();
            renderProducts();
        }
        
    } catch (error) {
        console.error("Error fetching products:", error);
        showError(error.message);
    } finally {
        loadingSpinner.style.display = "none";
    }
}

// Show empty state
function showEmptyState() {
    const storeName = storeNameMapping[currentStore.toUpperCase()] || `${currentStore.toUpperCase()} Store`;
    productsContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-box-open"></i>
            <h3>No Products Found</h3>
            <p>There are currently no products available in ${storeName}.</p>
            <button onclick="window.location.href='index.html'">
                <i class="fas fa-home"></i> Go to Homepage
            </button>
        </div>
    `;
    productsContainer.style.display = "block";
    productCountElement.textContent = "0 products found";
}

// Show error message
function showError(message) {
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get('store');
    
    productsContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Error Loading Products</h3>
            <p>${message}</p>
            <div style="margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 8px; font-size: 12px; word-break: break-all;">
                <strong>Debug Info:</strong><br>
                URL: ${currentUrl}<br>
                Store Parameter: ${storeParam || 'null'}
            </div>
            <button onclick="window.location.href='index.html'">Go to Homepage</button>
        </div>
    `;
    productsContainer.style.display = 'block';
}

// Sort products
function sortProducts() {
    switch (currentSort) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.priceMin - b.priceMin);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.priceMax - a.priceMax);
            break;
        case 'default':
        default:
            filteredProducts.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
            break;
    }
}

// Render products
function renderProducts() {
    productsContainer.innerHTML = "";
    productsContainer.style.display = "grid";
    
    // Update product count
    productCountElement.textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`;
    
    filteredProducts.forEach((product, index) => {
        const productCard = createProductCard(product, index);
        productsContainer.appendChild(productCard);
    });
}

// Create product card
function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${index * 0.05}s`;
    
    const isNew = isProductNew(product.createdTime);
    
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${product.imageURL}" 
                 alt="${product.name}" 
                 class="product-image" 
                 onerror="this.src='https://via.placeholder.com/300?text=Image+Not+Found'"
                 loading="lazy">
            <div class="share-icon">
                <i class="fas fa-share-alt"></i>
            </div>
            ${isNew ? '<div class="new-tag">New</div>' : ''}
        </div>
        <div class="product-info">
            <div class="product-code">${product.productCode}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">₹${product.priceMin} ~ ₹${product.priceMax}</div>
            <div class="product-views"><i class="fas fa-eye"></i> ${product.views} views</div>
            <a href="${product.buyLink}" class="buy-button" target="_blank">Buy on ${product.buyOn}</a>
        </div>
    `;
    
    // Handle share icon click
    const shareIcon = card.querySelector('.share-icon');
    shareIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        shareProduct(product);
    });
    
    // Open modal on card click (except share icon and buy button)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.buy-button') && !e.target.closest('.share-icon')) {
            openProductModal(product);
        }
    });
    
    return card;
}

// Check if product is new (within 7 days)
function isProductNew(createdTime) {
    const productDate = new Date(createdTime);
    const now = new Date();
    const daysDiff = Math.floor((now - productDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
            filteredProducts = [...allProducts];
        } else {
            filteredProducts = allProducts.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query) ||
                product.productCode.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query)
            );
        }
        
        sortProducts();
        renderProducts();
    });
    
    // Sort dropdown
    sortButton.addEventListener('click', (e) => {
        e.stopPropagation();
        sortOptions.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!sortButton.contains(e.target) && !sortOptions.contains(e.target)) {
            sortOptions.classList.remove('show');
        }
    });
    
    // Sort option selection
    sortOptionElements.forEach(option => {
        option.addEventListener('click', () => {
            const sortType = option.getAttribute('data-sort');
            currentSort = sortType;
            
            // Update active state
            sortOptionElements.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Update button label
            const sortLabel = option.textContent.trim();
            document.getElementById('sortLabel').textContent = sortLabel;
            
            // Close dropdown
            sortOptions.classList.remove('show');
            
            // Re-sort and render
            sortProducts();
            renderProducts();
        });
    });
    
    // Menu icon
    menuIcon.addEventListener('click', () => {
        bottomSheet.classList.add("active");
    });
    
    // Close bottom sheet
    closeSheet.addEventListener('click', () => {
        bottomSheet.classList.remove("active");
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        productModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (e.target === bottomSheet) {
            bottomSheet.classList.remove("active");
        }
    });
    
    // Menu items navigation
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            const page = item.getAttribute("data-page");
            if (page) {
                window.location.href = `info.html?page=${page}`;
            }
        });
    });
}

// Open product modal
function openProductModal(product) {
    const modalBody = document.querySelector('.modal-body');
    const relatedContainer = document.querySelector('.related-products-container');
    
    const productIsNew = isProductNew(product.createdTime);
    
    modalBody.innerHTML = `
        <div class="modal-image-section">
            <img src="${product.imageURL}" 
                 alt="${product.name}" 
                 class="modal-image" 
                 onerror="this.src='https://via.placeholder.com/600x400?text=Image+Not+Found'"
                 onload="this.parentElement.classList.add('loaded')">
        </div>
        
        <div class="modal-info-section">
            <div class="modal-product-code">${product.productCode}</div>
            
            <h2 class="modal-product-name">${product.name}</h2>
            
            <div class="modal-price-section">
                <div>
                    <div class="price-label">Price Range</div>
                    <div class="modal-product-price">₹${product.priceMin} - ₹${product.priceMax}</div>
                </div>
            </div>
            
            <div class="modal-stats">
                <div class="modal-product-views">
                    <i class="fas fa-eye"></i>
                    <span>${product.views} views</span>
                </div>
                ${productIsNew ? '<span class="stat-divider"></span><div class="new-badge"><i class="fas fa-star"></i> New Arrival</div>' : ''}
            </div>
            
            <div class="modal-product-description">
                <strong>Description:</strong><br>
                ${product.description}
            </div>
            <div class="modal-actions">
                <a href="${product.buyLink}" class="modal-buy-button" target="_blank" onclick='showToast("Redirecting to ${product.buyOn}...")'>
                    <i class="fas fa-shopping-cart"></i>
                    <span>Buy on ${product.buyOn}</span>
                </a>
                <button class="modal-share-button" onclick='shareProduct(${JSON.stringify(product).replace(/'/g, "&#39;")})'>
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    // Load related products from same store
    const relatedProducts = allProducts.filter(p => 
        p.category === product.category && 
        p.productCode !== product.productCode
    ).slice(0, 6);
    
    relatedContainer.innerHTML = '';
    
    if (relatedProducts.length === 0) {
        document.querySelector('.related-products').style.display = 'none';
    } else {
        document.querySelector('.related-products').style.display = 'block';
        
        relatedProducts.forEach(relatedProduct => {
            const card = document.createElement('div');
            card.className = 'related-product-card';
            card.innerHTML = `
                <img src="${relatedProduct.imageURL}" 
                     alt="${relatedProduct.name}" 
                     class="related-product-image" 
                     onerror="this.src='https://via.placeholder.com/150?text=Image+Not+Found'">
                <div class="related-product-info">
                    <div class="related-product-name">${relatedProduct.name}</div>
                    <div class="related-product-price">₹${relatedProduct.priceMin}</div>
                    <div class="related-product-views">
                        <i class="fas fa-eye"></i> ${relatedProduct.views} views
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                openProductModal(relatedProduct);
                productModal.scrollTop = 0;
            });
            
            relatedContainer.appendChild(card);
        });
    }
    
    productModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        productModal.scrollTop = 0;
    }, 100);
}

// Share product
function shareProduct(product) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?store=${currentStore}`;
    const shareText = `Check out ${product.name} on BUYHUT store!\nPrice: ₹${product.priceMin} - ₹${product.priceMax}\n\n${shareUrl}`;
    
    if (navigator.share) {
        navigator.share({
            title: product.name,
            text: shareText,
            url: shareUrl
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Product link copied to clipboard!');
        }).catch(err => {
            console.log('Error copying:', err);
            showToast('Unable to share product');
        });
    }
}

// Show toast message
function showToast(message) {
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
