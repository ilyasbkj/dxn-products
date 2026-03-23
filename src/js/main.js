import '../css/style.css';
import { db, auth } from './firebase.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { initI18n, setLanguage } from './i18n.js';

initI18n();

const productsContainer = document.getElementById('products-container');
const loginBtn = document.getElementById('nav-login-btn');
const adminBtn = document.getElementById('nav-admin-btn');
const logoutBtn = document.getElementById('nav-logout-btn');


let allProducts = [];

// Mobile Menu
const mobileToggle = document.getElementById('mobile-menu-toggle');
const navMenu = document.getElementById('nav-menu');
if (mobileToggle && navMenu) {
  mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
  // Close menu on link click
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
  });
}

// Modal Logic
const modal = document.getElementById('universal-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

function openModal(content) {
  console.log("Opening modal with content");
  modalBody.innerHTML = content;
  modal.classList.add('active');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  setTimeout(() => modal.classList.add('hidden'), 300);
  modalBody.innerHTML = '';
  document.body.style.overflow = '';
}

if (modalClose) {
  modalClose.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeModal(); });
  modalClose.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); closeModal(); });
}
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// Hero Slider Logic
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length === 0) return;
  let currentSlide = 0;
  
  setInterval(() => {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 5000);
}

// About Tabs Logic
function initAboutTabs() {
  const tabs = document.querySelectorAll('.about-tab');
  const contents = document.querySelectorAll('.about-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      contents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${target.substring(0,3)}-content`) {
           content.classList.add('active');
        } else if (target === 'history' && content.id === 'hist-content') {
           content.classList.add('active');
        } else if (target === 'philosophy' && content.id === 'phi-content') {
           content.classList.add('active');
        }
      });
    });
  });
}

// Authentication
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    try {
      const docRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(docRef);
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        adminBtn.href = '/panel-z8x2k9m4.html';
        adminBtn.classList.remove('hidden');
      }
    } catch (e) { console.error(e); }
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (adminBtn) adminBtn.classList.add('hidden');
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.reload();
  });
}

// Products Logic
async function loadProducts() {
  if (!productsContainer) return;
  productsContainer.innerHTML = '<div class="text-center" style="grid-column: 1 / -1;"><p data-i18n="loading">Cargando...</p></div>';
  
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    allProducts = [];
    querySnapshot.forEach((doc) => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });

    if (allProducts.length === 0) {
      allProducts = getMockProducts();
    }
    renderCategories();
  } catch (error) {
    console.warn("Using mock products");
    allProducts = getMockProducts();
    renderCategories();
  }
}

function renderCategories() {
  productsContainer.innerHTML = '';
  document.getElementById('category-filter-container').classList.add('hidden');

  const ci = window._categoryImages || {};
  const categories = [
    { id: 'drinks', key: 'cat_drinks', img: ci.drinks || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&auto=format&fit=crop' },
    { id: 'supplements', key: 'cat_supps', img: ci.supplements || 'https://images.unsplash.com/photo-1490474504059-1f1e10269f41?q=80&w=400&auto=format&fit=crop' },
    { id: 'hygiene', key: 'cat_hygiene', img: ci.hygiene || 'https://images.unsplash.com/photo-1600857062241-987114b03658?q=80&w=400&auto=format&fit=crop' }
  ];

  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'product-card cursor-pointer';
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${cat.img}" alt="${cat.id}" class="product-image" />
      </div>
      <div class="product-info text-center">
        <h3 class="product-title" data-i18n="${cat.key}">${cat.id}</h3>
      </div>
    `;
    card.addEventListener('click', () => renderProducts(cat.id));
    productsContainer.appendChild(card);
  });
  setLanguage(localStorage.getItem('dxn_lang') || 'es');
}

function renderProducts(category) {
  productsContainer.innerHTML = '';
  document.getElementById('category-filter-container').classList.remove('hidden');

  const filtered = allProducts.filter(p => (p.category === category) || (!p.category && category === 'drinks'));
  
  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const lang = localStorage.getItem('dxn_lang') || 'es';
    const description = product[`desc_${lang}`] || product.desc_es || product.description || '';
    
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.imageUrl || 'https://via.placeholder.com/400'}" alt="${product.name}" class="product-image" />
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-desc">${description.length > 80 ? description.substring(0, 80) + '...' : description}</p>
        <a href="${product.link || '#'}" target="_blank" class="btn btn-outline" style="font-size: 0.7rem; padding: 8px 15px;" data-i18n="btn_learn_more">Saber más</a>
      </div>
    `;
    productsContainer.appendChild(card);
  });
  setLanguage(localStorage.getItem('dxn_lang') || 'es');
}

document.getElementById('back-to-categories')?.addEventListener('click', renderCategories);

function getMockProducts() {
  return [
    { id: "1", name: "Café Lingzhi 3 en 1", category: "drinks", desc_es: "Café con Ganoderma...", imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400" },
    { id: "2", name: "Cocozhi", category: "drinks", desc_es: "Bebida de cacao...", imageUrl: "https://images.unsplash.com/photo-1544787210-2213d8196695?q=80&w=400" },
    { id: "3", name: "Spirulina Cereal", category: "supplements", desc_es: "Nutrición completa...", imageUrl: "https://images.unsplash.com/photo-1490474504059-1f1e10269f41?q=80&w=400" }
  ];
}

// Articles Logic
async function loadArticles() {
  const articlesContainer = document.getElementById('articles-container');
  if (!articlesContainer) return;
  
  try {
    const querySnapshot = await getDocs(collection(db, 'articles'));
    const articles = [];
    querySnapshot.forEach((doc) => { articles.push({ id: doc.id, ...doc.data() }); });

    if (articles.length === 0) {
      articlesContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No hay noticias disponibles.</p>';
      return;
    }

    const lang = localStorage.getItem('dxn_lang') || 'es';
    articlesContainer.innerHTML = '';
    articles.slice(0, 5).forEach(art => {
      const card = document.createElement('div');
      card.className = 'product-card cursor-pointer';
      const title = art[`title_${lang}`] || art.title_es || art.title || 'Sin título';
      const desc = art[`desc_${lang}`] || art.desc_es || art.description || '';

      card.innerHTML = `
        <div class="product-image-container">
          <img src="${art.imageUrl || 'https://via.placeholder.com/400'}" alt="${title}" class="product-image" />
        </div>
        <div class="product-info">
          <h3 class="product-title">${title}</h3>
          <p class="product-desc">${desc.length > 60 ? desc.substring(0, 60) + '...' : desc}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        openModal(`
          <h2 class="section-title text-left">${title}</h2>
          <img src="${art.imageUrl || ''}" style="width: 100%; border-radius: 4px; margin-bottom: 20px;" />
          <div style="white-space: pre-wrap; line-height: 1.6;">${desc}</div>
        `);
      });
      articlesContainer.appendChild(card);
    });
  } catch (e) { console.error(e); }
}

// Gallery Logic - loads from Firestore 'gallery' collection
async function loadGallery() {
  const container = document.getElementById('gallery-container');
  if(!container) return;

  let videos = [];
  try {
    const snap = await getDocs(collection(db, 'gallery'));
    snap.forEach(d => videos.push({ id: d.id, ...d.data() }));
  } catch(e) { console.warn('Gallery fallback'); }

  if (videos.length === 0) {
    videos = [
      { title: 'DXN One World One Market', videoId: 'dQw4w9WgXcQ' },
      { title: 'Ganoderma Benefits', videoId: 'j0Sdy7_9-m0' }
    ];
  }

  container.innerHTML = '';
  videos.forEach(v => {
    const vid = v.videoId || v.id;
    const card = document.createElement('div');
    card.className = 'video-card cursor-pointer';
    card.innerHTML = `
      <div class="video-thumb" style="background-image: url('https://img.youtube.com/vi/${vid}/0.jpg');">
         <button class="play-btn">▶</button>
      </div>
      <p class="video-title">${v.title}</p>
    `;
    card.addEventListener('click', () => {
      openModal(`
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
          <iframe src="https://www.youtube.com/embed/${vid}?autoplay=1" 
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                  frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>
        <h3 style="margin-top: 15px; text-transform: uppercase;">${v.title}</h3>
      `);
    });
    container.appendChild(card);
  });
}

// Contact & Work settings
async function loadContactInfo() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'contact'));
    if (snap.exists()) {
      const data = snap.data();
      const emailBtn = document.getElementById('footer-email-btn');
      const waBtn = document.getElementById('footer-wa-btn');
      if(emailBtn && data.email) emailBtn.href = `mailto:${data.email}`;
      if(waBtn && data.whatsapp) waBtn.href = `https://wa.me/${data.whatsapp.replace(/\D/g, '')}`;
    }
  } catch(e) { console.warn('Contact defaults'); }
}

let workWithUsData = null;
async function loadWorkSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'work_with_us'));
    if (snap.exists()) {
      workWithUsData = snap.data();
      updateWorkDescription();
    }
  } catch(e) { console.error(e); }
}

function updateWorkDescription() {
  if (!workWithUsData) return;
  const lang = localStorage.getItem('dxn_lang') || 'es';
  const descEl = document.getElementById('work-desc');
  const linkEl = document.getElementById('work-link');
  if (descEl) descEl.textContent = workWithUsData[`desc_${lang}`] || workWithUsData.desc_es || '';
  if (linkEl && workWithUsData.link) linkEl.href = workWithUsData.link;
}

// Category images from Firestore
async function loadCategoryImages() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'categories'));
    if (snap.exists()) {
      const data = snap.data();
      window._categoryImages = data;
    }
  } catch(e) { console.warn('Using default category images'); }
}

// Init everything
await loadCategoryImages();
initHeroSlider();
initAboutTabs();
loadProducts();
loadArticles();
loadGallery();
loadContactInfo();
loadWorkSettings();

const langSelector = document.getElementById('language-selector');
if (langSelector) {
  langSelector.addEventListener('change', () => {
    setTimeout(() => {
      loadArticles();
      loadProducts();
      updateWorkDescription();
    }, 50);
  });
}
