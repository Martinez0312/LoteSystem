// frontend/js/api.js
// Cliente API centralizado para comunicación con el backend

const API_BASE = '/api';

// ── Gestión del Token JWT ──────────────────────────────────────
const Auth = {
    getToken: () => localStorage.getItem('token'),
    getUser: () => {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    },
    setSession: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },
    clearSession: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    isLoggedIn: () => !!localStorage.getItem('token'),
    isAdmin: () => {
        const user = Auth.getUser();
        return user && user.rol === 'Administrador';
    },
    requireAuth: () => {
        if (!Auth.isLoggedIn()) {
            window.location.href = '/pages/login.html';
            return false;
        }
        return true;
    },
    requireAdmin: () => {
        if (!Auth.isLoggedIn()) { window.location.href = '/pages/login.html'; return false; }
        if (!Auth.isAdmin()) { window.location.href = '/pages/dashboard.html'; return false; }
        return true;
    }
};

// ── Función fetch centralizada ─────────────────────────────────
const apiFetch = async (endpoint, options = {}) => {
    const token = Auth.getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        // Si el token expiró, cerrar sesión
        if (response.status === 401) {
            Auth.clearSession();
            window.location.href = '/pages/login.html';
            return;
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}`);
        }

        return data;
    } catch (error) {
        if (error.name === 'SyntaxError') {
            throw new Error('Error al procesar respuesta del servidor');
        }
        throw error;
    }
};

// ── API Endpoints ──────────────────────────────────────────────
const API = {
    // Auth
    auth: {
        register: (data) => apiFetch('/auth/register', { method: 'POST', body: data }),
        login: (data) => apiFetch('/auth/login', { method: 'POST', body: data }),
        profile: () => apiFetch('/auth/profile'),
        updateProfile: (data) => apiFetch('/auth/profile', { method: 'PUT', body: data }),
        forgotPassword: (email) => apiFetch('/auth/forgot-password', { method: 'POST', body: { email } }),
        resetPassword: (token, password) => apiFetch('/auth/reset-password', { method: 'POST', body: { token, password } }),
    },

    // Lotes
    lots: {
        getAll: (params = {}) => {
            const qs = new URLSearchParams(params).toString();
            return apiFetch(`/lots${qs ? '?' + qs : ''}`);
        },
        getById: (id) => apiFetch(`/lots/${id}`),
        create: (data) => apiFetch('/lots', { method: 'POST', body: data }),
        update: (id, data) => apiFetch(`/lots/${id}`, { method: 'PUT', body: data }),
        changeStatus: (id, estado) => apiFetch(`/lots/${id}/status`, { method: 'PATCH', body: { estado } }),
        delete: (id) => apiFetch(`/lots/${id}`, { method: 'DELETE' }),
        stats: () => apiFetch('/lots/stats'),
    },

    // Compras
    purchases: {
        create: (data) => apiFetch('/purchases', { method: 'POST', body: data }),
        my: () => apiFetch('/purchases/my'),
        all: () => apiFetch('/purchases/all'),
        getById: (id) => apiFetch(`/purchases/${id}`),
        account: () => apiFetch('/purchases/account'),
    },

    // Pagos
    payments: {
        create: (data) => apiFetch('/payments', { method: 'POST', body: data }),
        my: () => apiFetch('/payments/my'),
        all: () => apiFetch('/payments/all'),
        downloadReceipt: (id) => {
            // Descargar PDF directamente
            const token = Auth.getToken();
            const link = document.createElement('a');
            link.href = `/api/payments/${id}/receipt`;
            // Para descargas autenticadas usar fetch
            fetch(`/api/payments/${id}/receipt`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.blob()).then(blob => {
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = `comprobante_pago_${id}.pdf`;
                link.click();
                URL.revokeObjectURL(url);
            });
        }
    },

    // PQRS
    pqrs: {
        create: (data) => apiFetch('/pqrs', { method: 'POST', body: data }),
        my: () => apiFetch('/pqrs/my'),
        all: (params = {}) => {
            const qs = new URLSearchParams(params).toString();
            return apiFetch(`/pqrs/all${qs ? '?' + qs : ''}`);
        },
        getById: (id) => apiFetch(`/pqrs/${id}`),
        update: (id, data) => apiFetch(`/pqrs/${id}`, { method: 'PUT', body: data }),
        stats: () => apiFetch('/pqrs/stats'),
    },

    // Usuarios
    users: {
        all: () => apiFetch('/users'),
        getById: (id) => apiFetch(`/users/${id}`),
        create: (data) => apiFetch('/users', { method: 'POST', body: data }),
        update: (id, data) => apiFetch(`/users/${id}`, { method: 'PUT', body: data }),
        toggle: (id) => apiFetch(`/users/${id}/toggle`, { method: 'PATCH' }),
        dashboard: () => apiFetch('/users/dashboard'),
    },

    // Etapas
    stages: {
        all: () => apiFetch('/stages'),
        create: (data) => apiFetch('/stages', { method: 'POST', body: data }),
        update: (id, data) => apiFetch(`/stages/${id}`, { method: 'PUT', body: data }),
    }
};

// ── Utilidades UI ──────────────────────────────────────────────
const UI = {
    // Toast notifications
    toast: (message, type = 'success', duration = 4000) => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, duration);
    },

    // Loading overlay
    showLoading: () => {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
    },
    hideLoading: () => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    // Formatear moneda colombiana
    currency: (value) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    },

    // Formatear fecha
    date: (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    },

    // Badge de estado
    statusBadge: (estado) => {
        const map = {
            'Disponible': 'badge-success', 'Vendido': 'badge-danger', 'Reservado': 'badge-warning',
            'Activo': 'badge-primary', 'Completado': 'badge-success', 'Cancelado': 'badge-danger',
            'Pendiente': 'badge-warning', 'En proceso': 'badge-info', 'Resuelto': 'badge-success',
        };
        return `<span class="badge ${map[estado] || 'badge-secondary'}">${estado}</span>`;
    },

    // Abrir/cerrar modal
    openModal: (id) => document.getElementById(id)?.classList.add('active'),
    closeModal: (id) => document.getElementById(id)?.classList.remove('active'),

    // Confirmar acción
    confirm: (message) => window.confirm(message),

    // Inicializar navbar usuario
    initNavbar: () => {
        const user = Auth.getUser();
        const userMenuEl = document.getElementById('user-menu');
        if (userMenuEl && user) {
            userMenuEl.innerHTML = `
                <span style="color:#555;font-weight:500;">Hola, ${user.nombre}</span>
                <a href="${Auth.isAdmin() ? '/pages/admin-dashboard.html' : '/pages/dashboard.html'}" class="btn btn-nav btn-sm">Dashboard</a>
                <a href="#" onclick="logout()" style="color:#dc3545;font-weight:600;">Salir</a>
            `;
        } else if (userMenuEl) {
            userMenuEl.innerHTML = `
                <a href="/pages/login.html">Ingresar</a>
                <a href="/pages/register.html" class="btn btn-nav btn-sm">Registrarse</a>
            `;
        }
    }
};

// Función global de logout
const logout = () => {
    Auth.clearSession();
    UI.toast('Sesión cerrada correctamente', 'info');
    setTimeout(() => window.location.href = '/', 1000);
};

// Inicializar navbar en todas las páginas
document.addEventListener('DOMContentLoaded', () => {
    UI.initNavbar();
    
    // Hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.navbar-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    // Cerrar modales al click fuera
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });
});
