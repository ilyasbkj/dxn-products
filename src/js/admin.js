import '../css/style.css';
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, setDoc 
} from 'firebase/firestore';

const adminContent = document.getElementById('admin-content');
const unauthorizedMsg = document.getElementById('unauthorized-msg');
const logoutBtn = document.getElementById('admin-logout-btn');

const productsTbody = document.getElementById('products-tbody');
const formContainer = document.getElementById('form-container');
const productForm = document.getElementById('product-form');
const btnShowForm = document.getElementById('btn-show-form');
const btnCancel = document.getElementById('btn-cancel');
const formTitle = document.getElementById('form-title');

const articlesTbody = document.getElementById('articles-tbody');
const articleFormContainer = document.getElementById('article-form-container');
const articleForm = document.getElementById('article-form');
const btnShowArticleForm = document.getElementById('btn-show-article-form');
const btnCancelArticle = document.getElementById('btn-cancel-article');
const articleFormTitle = document.getElementById('article-form-title');

const contactForm = document.getElementById('contact-form');
const contactEmail = document.getElementById('contact-email');
const contactWhatsApp = document.getElementById('contact-whatsapp');

const workForm = document.getElementById('work-form');
const workLinkInput = document.getElementById('work-link-input');
const workDescEs = document.getElementById('work-desc-es');
const workDescEn = document.getElementById('work-desc-en');
const workDescFr = document.getElementById('work-desc-fr');
const workDescCa = document.getElementById('work-desc-ca');
const workDescAr = document.getElementById('work-desc-ar');

let productsList = [];
let articlesList = [];

// Rutas Integradas - Protegidas estrictamente para el rol 'admin'
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      unauthorizedMsg.textContent = 'Verificando permisos de administrador...';
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        unauthorizedMsg.style.display = 'none';
        adminContent.style.display = 'block';
        loadAdminProducts();
        loadAdminArticles();
        loadSettings();
      } else {
        unauthorizedMsg.innerHTML = 'Acceso denegado: Necesitas ser el Administrador oficial para ver este panel.<br><br><a href="/" style="color:var(--accent-primary)">Volver al Catálogo</a>';
        unauthorizedMsg.style.color = 'var(--text-secondary)';
      }
    } catch(e) {
      unauthorizedMsg.textContent = 'Error validando tu nivel de seguridad en Firestore.';
      unauthorizedMsg.style.color = 'var(--danger)';
    }
  } else {
    // No logueado, redirigir
    window.location.href = '/login.html';
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = '/';
});

// UI Eventos
btnShowForm.addEventListener('click', () => {
  formContainer.classList.remove('hidden');
  productForm.reset();
  document.getElementById('prod-id').value = '';
  formTitle.textContent = 'Agregar Producto';
  window.scrollTo({ top: formContainer.offsetTop, behavior: 'smooth'});
});

btnCancel.addEventListener('click', () => {
  formContainer.classList.add('hidden');
  productForm.reset();
});

btnShowArticleForm.addEventListener('click', () => {
  articleFormContainer.classList.remove('hidden');
  articleForm.reset();
  document.getElementById('art-id').value = '';
  articleFormTitle.textContent = 'Agregar Artículo';
  window.scrollTo({ top: articleFormContainer.offsetTop, behavior: 'smooth'});
});

btnCancelArticle.addEventListener('click', () => {
  articleFormContainer.classList.add('hidden');
  articleForm.reset();
});

// Cargar catálogo DB
async function loadAdminProducts() {
  productsTbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando productos de la base de datos...</td></tr>';
  
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    productsList = [];
    querySnapshot.forEach((docSnap) => {
      productsList.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    renderTable();
  } catch (error) {
    console.error("Error conectando a DB:", error);
    productsTbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--danger)">Error al obtener productos. Verifica los permisos de Firestore y la configuración del SDK.</td></tr>`;
  }
}

// Renderizado Dom de la tabla
function renderTable() {
  if (productsList.length === 0) {
    productsTbody.innerHTML = '<tr><td colspan="5" class="text-center">El catálogo está vacío. Agrega el primer producto.</td></tr>';
    return;
  }
  
  productsTbody.innerHTML = '';
  productsList.forEach(prod => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width: 80px"><img src="${prod.imageUrl || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; object-fit:cover; border-radius:4px" /></td>
      <td><strong>${prod.name}</strong></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.description}</td>
      <td><a href="${prod.link}" target="_blank" style="color: var(--accent-primary)">Enlace Afiliado/Compra</a></td>
      <td style="width: 180px">
        <button class="btn action-btn bg-gold" style="padding: 6px 12px; font-size: 0.8em; margin-right: 5px; background:var(--accent-gold); color:black; border-radius: 4px;" onclick="editProduct('${prod.id}')">Editar</button>
        <button class="btn action-btn bg-danger" style="padding: 6px 12px; font-size: 0.8em; border-radius: 4px; border:none; background:var(--danger); color:white;" onclick="deleteProduct('${prod.id}')">Eliminar</button>
      </td>
    `;
    productsTbody.appendChild(tr);
  });
}

// Exponer funciones al scope global para los atributos onclick de los elementos inyectados
window.editProduct = (id) => {
  const product = productsList.find(p => p.id === id);
  if (!product) return;
  
  formTitle.textContent = 'Editar Producto';
  document.getElementById('prod-id').value = product.id;
  document.getElementById('prod-name').value = product.name;
  document.getElementById('prod-category').value = product.category || 'drinks';
  document.getElementById('prod-desc').value = product.description;
  document.getElementById('prod-img').value = product.imageUrl || '';
  document.getElementById('prod-link').value = product.link || '';
  
  formContainer.classList.remove('hidden');
  window.scrollTo({ top: formContainer.offsetTop, behavior: 'smooth'});
};

window.deleteProduct = async (id) => {
  if (!confirm('¿Estás SEGURO de que quieres eliminar este producto del catálogo permanentemente?')) return;
  
  try {
    await deleteDoc(doc(db, 'products', id));
    await loadAdminProducts();
  } catch (error) {
    console.error("Error borrando:", error);
    alert("Error al borrar el producto. Verifica los permisos de Firestore.");
  }
};

// Insertar o Actualizar DB 
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = productForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando datos...';
  
  const id = document.getElementById('prod-id').value;
  const productData = {
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value,
    description: document.getElementById('prod-desc').value,
    imageUrl: document.getElementById('prod-img').value,
    link: document.getElementById('prod-link').value
  };
  
  try {
    if (id) {
      // Actualizar 
      await updateDoc(doc(db, 'products', id), productData);
    } else {
      // Nuevo
      await addDoc(collection(db, 'products'), productData);
    }
    
    formContainer.classList.add('hidden');
    productForm.reset();
    await loadAdminProducts();
  } catch (error) {
    console.error("Error guardando:", error);
    alert("Hubo un error al guardar los cambios en la Base de Datos. Detalles en consola.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Guardar Producto';
  }
});

// Cargar Artículos DB
async function loadAdminArticles() {
  articlesTbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando artículos de la base de datos...</td></tr>';
  
  try {
    const querySnapshot = await getDocs(collection(db, 'articles'));
    articlesList = [];
    querySnapshot.forEach((docSnap) => {
      articlesList.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    renderArticlesTable();
  } catch (error) {
    console.error("Error conectando a DB:", error);
    articlesTbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color:var(--danger)">Error al obtener artículos.</td></tr>`;
  }
}

function renderArticlesTable() {
  if (articlesList.length === 0) {
    articlesTbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay artículos publicados. Agrega el primero.</td></tr>';
    return;
  }
  
  articlesTbody.innerHTML = '';
  articlesList.forEach(art => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width: 80px"><img src="${art.imageUrl || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; object-fit:cover; border-radius:4px" /></td>
      <td><strong>${art.title_es || art.title || 'Sin título'}</strong></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${art.desc_es || art.description || 'Sin descripción'}</td>
      <td style="width: 180px">
        <button class="btn action-btn bg-gold" style="padding: 6px 12px; font-size: 0.8em; margin-right: 5px; background:var(--accent-gold); color:black; border-radius: 4px;" onclick="editArticle('${art.id}')">Editar</button>
        <button class="btn action-btn bg-danger" style="padding: 6px 12px; font-size: 0.8em; border-radius: 4px; border:none; background:var(--danger); color:white;" onclick="deleteArticle('${art.id}')">Eliminar</button>
      </td>
    `;
    articlesTbody.appendChild(tr);
  });
}

window.editArticle = (id) => {
  const art = articlesList.find(a => a.id === id);
  if (!art) return;
  
  articleFormTitle.textContent = 'Editar Artículo';
  document.getElementById('art-id').value = art.id;
  
  document.getElementById('art-title-es').value = art.title_es || art.title || '';
  document.getElementById('art-title-en').value = art.title_en || '';
  document.getElementById('art-title-fr').value = art.title_fr || '';
  document.getElementById('art-title-ca').value = art.title_ca || '';
  document.getElementById('art-title-ar').value = art.title_ar || '';
  
  document.getElementById('art-desc-es').value = art.desc_es || art.description || '';
  document.getElementById('art-desc-en').value = art.desc_en || '';
  document.getElementById('art-desc-fr').value = art.desc_fr || '';
  document.getElementById('art-desc-ca').value = art.desc_ca || '';
  document.getElementById('art-desc-ar').value = art.desc_ar || '';
  
  document.getElementById('art-img').value = art.imageUrl || '';
  
  articleFormContainer.classList.remove('hidden');
  window.scrollTo({ top: articleFormContainer.offsetTop, behavior: 'smooth'});
};

window.deleteArticle = async (id) => {
  if (!confirm('¿Estás SEGURO de que quieres eliminar este artículo permanentemente?')) return;
  
  try {
    await deleteDoc(doc(db, 'articles', id));
    await loadAdminArticles();
  } catch (error) {
    console.error("Error borrando artículo:", error);
    alert("Error al borrar el artículo.");
  }
};

articleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = articleForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando datos...';
  
  const id = document.getElementById('art-id').value;
  const data = {
    title_es: document.getElementById('art-title-es').value,
    title_en: document.getElementById('art-title-en').value,
    title_fr: document.getElementById('art-title-fr').value,
    title_ca: document.getElementById('art-title-ca').value,
    title_ar: document.getElementById('art-title-ar').value,
    desc_es: document.getElementById('art-desc-es').value,
    desc_en: document.getElementById('art-desc-en').value,
    desc_fr: document.getElementById('art-desc-fr').value,
    desc_ca: document.getElementById('art-desc-ca').value,
    desc_ar: document.getElementById('art-desc-ar').value,
    imageUrl: document.getElementById('art-img').value,
    createdAt: new Date().toISOString()
  };
  
  try {
    if (id) {
      delete data.createdAt; // don't update creation time
      await updateDoc(doc(db, 'articles', id), data);
    } else {
      await addDoc(collection(db, 'articles'), data);
    }
    
    articleFormContainer.classList.add('hidden');
    articleForm.reset();
    await loadAdminArticles();
  } catch (error) {
    console.error("Error guardando:", error);
    alert("Hubo un error al guardar los cambios en la Base de Datos. Detalles en consola.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Guardar Artículo';
  }
});

// Settings / Contact logic
async function loadSettings() {
  try {
    const docRef = doc(db, 'settings', 'contact');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      contactEmail.value = snap.data().email || '';
      contactWhatsApp.value = snap.data().whatsapp || '';
    }

    const workSnap = await getDoc(doc(db, 'settings', 'work_with_us'));
    if (workSnap.exists()) {
      const data = workSnap.data();
      workLinkInput.value = data.link || '';
      workDescEs.value = data.desc_es || '';
      workDescEn.value = data.desc_en || '';
      workDescFr.value = data.desc_fr || '';
      workDescCa.value = data.desc_ca || '';
      workDescAr.value = data.desc_ar || '';
    }
  } catch (e) {
    console.error("Error cargando ajustes", e);
  }
}

if(contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-contact');
    btn.textContent = 'Guardando...';
    btn.disabled = true;
    try {
      await setDoc(doc(db, 'settings', 'contact'), {
        email: contactEmail.value,
        whatsapp: contactWhatsApp.value
      }, { merge: true });
      alert('¡Información de contacto actualizada con éxito!');
    } catch(e) {
      console.error(e);
      alert('Error al guardar contacto. ¿Tienes permisos en la colección settings?');
    }
    btn.textContent = 'Guardar Ajustes';
    btn.disabled = false;
  });
}

if(workForm) {
  workForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-work');
    btn.textContent = 'Guardando...';
    btn.disabled = true;
    try {
      await setDoc(doc(db, 'settings', 'work_with_us'), {
        link: workLinkInput.value,
        desc_es: workDescEs.value,
        desc_en: workDescEn.value,
        desc_fr: workDescFr.value,
        desc_ca: workDescCa.value,
        desc_ar: workDescAr.value
      }, { merge: true });
      alert('¡Ajustes de Trabajar con nosotros actualizados con éxito!');
    } catch(e) {
      console.error(e);
      alert('Error al guardar ajustes.');
    }
    btn.textContent = 'Guardar Ajustes';
    btn.disabled = false;
  });
}
