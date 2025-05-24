// Global variables
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let isLoading = true;

// DOM Elements
const productsContainer = document.getElementById('productsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const categoryChips = document.querySelectorAll('.category-chip');
const menuIcon = document.getElementById('menuIcon');
const bottomSheet = document.getElementById('bottomSheet');
const closeSheet = document.querySelector('.close-sheet');
const menuItems = document.querySelectorAll('.menu-item');
const productModal = document.getElementById('productModal');
const closeModal = document.querySelector('.close-modal');
const toast = document.getElementById('toast');
const customDropdown = document.getElementById('customDropdown');
const selectedCategory = document.getElementById('selectedCategory');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownItems = document.querySelectorAll('.custom-dropdown-item');

// Google Sheets API Configuration
const API_KEY = 'AIzaSyAq3X8C0HxkmY-l1DQlbmtqespOhauVjm0';
const SHEET_ID = '1uQ8682WiB6OfPnKyl390l3xz981_wpi439Ms97bSd4I';
const SHEET_NAME = 'Products';
const SHEET_RANGE = 'A2:J1000'; // Adjust range as needed

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
    setupCustomDropdown();
});

// Fetch products from Google Sheets
async function fetchProducts() {
    isLoading = true;
    loadingSpinner.style.display = 'flex';
    productsContainer.style.display = 'none';
    
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            throw new Error('No data found in the Google Sheet');
        }
        
        // Check if we have at least 2 rows (header + at least one product)
        if (data.values.length < 2) {
            throw new Error('Google Sheet must have at least 2 rows: headers in Row 1 and product data starting from Row 2');
        }
        
        // Get headers from first row
        const headers = data.values[0];
        
        // Validate headers - we need all required columns
        const requiredColumns = ['Name', 'PriceMin', 'PriceMax', 'Category', 'BuyLink', 'BuyOn', 'ImageURL', 'CreatedTime', 'Description', 'ProductCode'];
        const headerIndexes = {};
        
        // Find indexes for each required column
        requiredColumns.forEach(column => {
            const index = headers.findIndex(header => header.trim().toLowerCase() === column.toLowerCase());
            if (index === -1) {
                throw new Error(`Required column "${column}" not found in Google Sheet headers`);
            }
            headerIndexes[column.toLowerCase()] = index;
        });
        
        // Create products from rows (starting from row 2)
        allProducts = [];
        
        // For each row (product) starting from index 1 (Row 2)
        for (let rowIndex = 1; rowIndex < data.values.length; rowIndex++) {
            const row = data.values[rowIndex];
            
            // Check if row has enough data
            if (row.length < headers.length) {
                console.warn(`Row ${rowIndex + 1} has insufficient data, skipping`);
                continue;
            }
            
            // Check if ProductCode is missing or empty (required field)
            const productCodeIndex = headerIndexes['productcode'];
            if (!row[productCodeIndex] || row[productCodeIndex].trim() === '') {
                console.warn(`Row ${rowIndex + 1} is missing required ProductCode, skipping`);
                continue;
            }
            
            // Create a product object by reading across the row using header indexes
            const product = {
                name: row[headerIndexes['name']] || 'Unknown Product',
                priceMin: row[headerIndexes['pricemin']] || '0',
                priceMax: row[headerIndexes['pricemax']] || '0',
                category: row[headerIndexes['category']] || 'Uncategorized',
                buyLink: row[headerIndexes['buylink']] || '#',
                buyOn: row[headerIndexes['buyon']] || 'Store',
                imageURL: row[headerIndexes['imageurl']] || 'https://via.placeholder.com/300',
                createdTime: row[headerIndexes['createdtime']] || new Date().toISOString(),
                description: row[headerIndexes['description']] || 'No description available',
                productCode: row[headerIndexes['productcode']],
                views: Math.floor(Math.random() * 2000) + 1000 // Random views between 1000-3000
            };
            
            allProducts.push(product);
        }
        
        // Check if we have any valid products
        if (allProducts.length === 0) {
            throw new Error('No valid products found in the Google Sheet. Make sure ProductCode is provided for each product.');
        }
        
        // Sort by createdTime (newest first)
        allProducts.sort((a, b) => {
            return new Date(b.createdTime) - new Date(a.createdTime);
        });
        
        // Initialize with all products
        filteredProducts = [...allProducts];
        renderProducts();
        
        // Check URL for product code or code parameter
        checkUrlForProductCode();
        
    } catch (error) {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Products</h3>
                <p>There was a problem loading products from Google Sheets: ${error.message}</p>
                <button onclick="fetchProducts()">Try Again</button>
            </div>
        `;
        productsContainer.style.display = 'block';
    } finally {
        isLoading = false;
        loadingSpinner.style.display = 'none';
    }
}

// Setup custom dropdown
function setupCustomDropdown() {
    if (!customDropdown) return;
    
    // Toggle dropdown on click
    customDropdown.querySelector('.custom-dropdown-selected').addEventListener('click', () => {
        customDropdown.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!customDropdown.contains(e.target)) {
            customDropdown.classList.remove('open');
        }
    });
    
    // Handle dropdown item selection
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update selected text
            selectedCategory.textContent = item.textContent;
            
            // Update active class
            dropdownItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Close dropdown
            customDropdown.classList.remove('open');
            
            // Filter products
            const category = item.dataset.value;
            
            // Update category chips
            categoryChips.forEach(chip => {
                if (chip.dataset.category === category) {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });
            
            // Filter products
            filterByCategory(category);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        
        if (query.trim() === '') {
            searchSuggestions.style.display = 'none';
            filterByCategory(currentCategory);
        } else {
            // Show search suggestions
            showSearchSuggestions(query);
        }
    });
    
    // Search input - enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value;
            if (query.trim() !== '') {
                searchSuggestions.style.display = 'none';
                filterBySearch(query);
            }
        }
    });
    
    // Category chips
    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove active class from all chips
            categoryChips.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked chip
            chip.classList.add('active');
            
            // Get category
            const category = chip.dataset.category;
            
            // Update dropdown if it exists
            updateCustomDropdown(category);
            
            // Filter products by category
            filterByCategory(category);
        });
    });
    
    // Menu icon
    menuIcon.addEventListener('click', () => {
        bottomSheet.classList.add('active');
    });
    
    // Close sheet
    closeSheet.addEventListener('click', () => {
        bottomSheet.classList.remove('active');
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        productModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close bottom sheet when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === bottomSheet) {
            bottomSheet.classList.remove('active');
        }
    });
    
    // Menu items
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            bottomSheet.classList.remove('active');
            
            // Navigate to info page with section parameter
            window.location.href = `info.html?section=${item.dataset.page}`;
        });
    });
}

// Update custom dropdown based on category
function updateCustomDropdown(category) {
    if (!customDropdown) return;
    
    // Update selected text
    const activeItem = document.querySelector(`.custom-dropdown-item[data-value="${category}"]`);
    if (activeItem) {
        selectedCategory.textContent = activeItem.textContent;
        
        // Update active class
        dropdownItems.forEach(item => item.classList.remove('active'));
        activeItem.classList.add('active');
    }
}

// Check URL for product code
function checkUrlForProductCode() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for product code in URL
    let productCode = null;
    
    // Check for product{code} parameter
    for (const [key, value] of urlParams.entries()) {
        if (key.startsWith('product')) {
            productCode = key.replace('product', '');
            break;
        }
    }
    
    // Check for code parameter
    if (!productCode && urlParams.has('code')) {
        productCode = urlParams.get('code');
    }
    
    if (productCode) {
        // Find product with this code
        const product = allProducts.find(p => p.productCode === productCode);
        
        if (product) {
            // Fill search input with product code
            searchInput.value = productCode;
            
            // Filter products to show only this product
            filterBySearch(productCode);
            
            // Open product modal
            setTimeout(() => {
                openProductModal(product);
            }, 500);
        }
    }
}

// Show search suggestions
function showSearchSuggestions(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm === '') {
        searchSuggestions.style.display = 'none';
        return;
    }
    
    // Filter products by search term
    const suggestions = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.productCode.toLowerCase().includes(searchTerm)
    ).slice(0, 5); // Limit to 5 suggestions
    
    if (suggestions.length === 0) {
        searchSuggestions.style.display = 'none';
        return;
    }
    
    // Create suggestion items
    searchSuggestions.innerHTML = '';
    
    suggestions.forEach(product => {
        const item = document.createElement('div');
        item.className = 'search-suggestion-item';
        item.innerHTML = `
            <span class="suggestion-code">${product.productCode}</span>
            <span class="suggestion-name">${product.name}</span>
        `;
        
        item.addEventListener('click', () => {
            searchInput.value = product.productCode;
            searchSuggestions.style.display = 'none';
            filterBySearch(product.productCode);
            
            // Open product modal
            setTimeout(() => {
                openProductModal(product);
            }, 100);
        });
        
        searchSuggestions.appendChild(item);
    });
    
    searchSuggestions.style.display = 'block';
}

// Render products to the DOM
function renderProducts() {
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No Products Found</h3>
                <p>Try adjusting your search or category filter.</p>
            </div>
        `;
    } else {
        productsContainer.innerHTML = '';
        
        filteredProducts.forEach(product => {
            // Check if product is new (within last 7 days)
            const isNew = isProductNew(product.createdTime);
            
            // Generate random view count if not already set
            if (!product.views) {
                product.views = Math.floor(Math.random() * 2000) + 1000; // Random views between 1000-3000
            }
            
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.imageURL}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300?text=Image+Not+Found'">
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
            
            // Add click event to open modal
            productCard.addEventListener('click', (e) => {
                // Don't open modal if clicking on buy button or share icon
                if (e.target.closest('.buy-button') || e.target.closest('.share-icon')) {
                    return;
                }
                openProductModal(product);
            });
            
            // Add click event to share icon
            const shareIcon = productCard.querySelector('.share-icon');
            shareIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                shareProduct(product);
            });
            
            // Buy button now uses direct link without redirection
            // The href attribute already contains the exact BuyLink from Google Sheet
            // We only need to ensure the click event doesn't interfere with the direct link
            
            productsContainer.appendChild(productCard);
        });
    }
    
    productsContainer.style.display = 'grid';
}

// Check if product is new (within last 7 days)
function isProductNew(createdTime) {
    const createdDate = new Date(createdTime);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
}

// Filter products by category
function filterByCategory(category) {
    currentCategory = category;
    
    if (category === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.category.toLowerCase().includes(category.toLowerCase())
        );
    }
    
    // Apply search filter if there's a search query
    if (searchInput.value.trim() !== '') {
        filterBySearch(searchInput.value);
    } else {
        renderProducts();
    }
}

// Filter products by search query
function filterBySearch(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm === '') {
        filterByCategory(currentCategory); // Reset to current category filter
        return;
    }
    
    // Start with category filtered products
    let categoryFiltered;
    if (currentCategory === 'all') {
        categoryFiltered = [...allProducts];
    } else {
        categoryFiltered = allProducts.filter(product => 
            product.category.toLowerCase().includes(currentCategory.toLowerCase())
        );
    }
    
    // Then apply search filter
    filteredProducts = categoryFiltered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.productCode.toLowerCase().includes(searchTerm)
    );
    
    renderProducts();
}

// Open product modal
function openProductModal(product) {
    const modalBody = document.querySelector('.modal-body');
    const relatedProductsContainer = document.querySelector('.related-products-container');
    
    // Populate modal content
    modalBody.innerHTML = `
        <img src="${product.imageURL}" alt="${product.name}" class="modal-image" onerror="this.src='https://via.placeholder.com/600x400?text=Image+Not+Found'">
        <div class="modal-product-code">${product.productCode}</div>
        <div class="modal-product-name">${product.name}</div>
        <div class="modal-product-price">₹${product.priceMin} ~ ₹${product.priceMax}</div>
        <div class="modal-product-views"><i class="fas fa-eye"></i> ${product.views} views</div>
        <div class="modal-product-description">${product.description}</div>
        <a href="${product.buyLink}" class="modal-buy-button" target="_blank">Buy on ${product.buyOn}</a>
    `;
    
    // Find related products (same category)
    const relatedProducts = allProducts.filter(p => 
        p.category === product.category && p.productCode !== product.productCode
    ).slice(0, 4); // Limit to 4 related products
    
    // Populate related products
    relatedProductsContainer.innerHTML = '';
    if (relatedProducts.length === 0) {
        document.querySelector('.related-products').style.display = 'none';
    } else {
        document.querySelector('.related-products').style.display = 'block';
        
        relatedProducts.forEach(relatedProduct => {
            const relatedCard = document.createElement('div');
            relatedCard.className = 'related-product-card';
            relatedCard.innerHTML = `
                <img src="${relatedProduct.imageURL}" alt="${relatedProduct.name}" class="related-product-image" onerror="this.src='https://via.placeholder.com/150?text=Image+Not+Found'">
                <div class="related-product-info">
                    <div class="related-product-name">${relatedProduct.name}</div>
                    <div class="related-product-price">₹${relatedProduct.priceMin}</div>
                    <div class="related-product-views"><i class="fas fa-eye"></i> ${relatedProduct.views} views</div>
                </div>
            `;
            
            relatedCard.addEventListener('click', () => {
                openProductModal(relatedProduct);
            });
            
            relatedProductsContainer.appendChild(relatedCard);
        });
    }
    
    // Show the modal
    productModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
}

// Share product function
function shareProduct(product) {
    // Create a shareable URL with the product code
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${product.productCode}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: `${product.name} - BUYHUT store`,
            text: `Check out this ${product.name} on BUYHUT store! Price: ₹${product.priceMin} ~ ₹${product.priceMax}`,
            url: shareUrl
        })
        .then(() => {
            showToast('Product shared successfully!');
        })
        .catch(error => {
            console.error('Error sharing:', error);
            // Fallback for sharing
            copyToClipboard(shareUrl);
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        copyToClipboard(shareUrl);
    }
}

// Copy text to clipboard
function copyToClipboard(text) {
    // Create a temporary input element
    const input = document.createElement('input');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);
    
    // Select and copy the text
    input.select();
    document.execCommand('copy');
    
    // Remove the temporary input
    document.body.removeChild(input);
    
    // Show toast message
    showToast('Link copied to clipboard!');
}

// Show toast message
function showToast(message) {
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.style.display = 'block';
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
