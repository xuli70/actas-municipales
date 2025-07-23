/**
 * auth.js - Sistema de autenticación
 * Sistema de Actas Municipales
 */

// Namespace global para autenticación
window.Auth = {
    
    state: {
        userRole: null,
        isAuthenticated: false
    },

    /**
     * Autentica al usuario con la contraseña proporcionada
     */
    async authenticate(password) {
        if (!password) return null;
        
        const PASSWORD_ADMIN = window.APP_CONFIG?.PASSWORD_ADMIN || window.PASSWORD_ADMIN || 'admin123';
        const PASSWORD_USER = window.APP_CONFIG?.PASSWORD_USER || window.PASSWORD_USER || 'usuario123';
        
        let role = null;
        let dbRole = null;
        
        if (password === PASSWORD_ADMIN) {
            role = 'admin';
            dbRole = 'administrador';
        } else if (password === PASSWORD_USER) {
            role = 'user';
            dbRole = 'usuario_publico';
        }
        
        if (role) {
            // Crear sesión temporal en la base de datos
            const sessionToken = await this.createSession(dbRole);
            if (sessionToken) {
                this.state.userRole = role;
                this.state.isAuthenticated = true;
                return role;
            }
        }
        
        return null;
    },

    /**
     * Crea una sesión temporal en Supabase
     */
    async createSession(role) {
        try {
            const token = crypto.randomUUID();
            
            // Validar y usar duración de sesión con fallback seguro
            const sessionHours = parseInt(window.APP_CONFIG?.SESSION_DURATION_HOURS) || 8;
            const expiresAt = new Date(Date.now() + sessionHours * 60 * 60 * 1000);
            
            // Validar que la fecha sea válida antes de continuar
            if (isNaN(expiresAt.getTime())) {
                throw new Error('Fecha de expiración inválida');
            }
            
            // Usar variables de entorno de Coolify directamente
            const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://supmcp.axcsol.com';
            const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || '';
            
            // Guardar en Supabase
            const response = await fetch(`${SUPABASE_URL}/rest/v1/sesiones_temporales`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    rol: role,
                    ip_address: null, // Se puede agregar después
                    user_agent: navigator.userAgent,
                    expires_at: expiresAt.toISOString()
                })
            });
            
            if (response.ok) {
                // Guardar token localmente
                sessionStorage.setItem('session_token', token);
                console.log('✅ Sesión temporal creada exitosamente');
                return token;
            } else {
                console.error('❌ Error creando sesión temporal:', response.status);
                return null;
            }
            
        } catch (error) {
            console.error('❌ Error creando sesión temporal:', error);
            return null;
        }
    },

    /**
     * Muestra el menú principal después de autenticación exitosa
     */
    showMainMenu() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('actasSection').style.display = 'none';
        document.getElementById('adminSection').style.display = 'none';
        document.getElementById('backButton').style.display = 'none';
        
        const userRoleElement = document.getElementById('userRole');
        const adminButton = document.getElementById('adminButton');
        
        if (this.state.userRole === 'admin') {
            userRoleElement.textContent = 'Administrador';
            adminButton.style.display = 'block';
        } else {
            userRoleElement.textContent = 'Usuario';
            userRoleElement.style.color = 'green';
            adminButton.style.display = 'none';
        }
        
        if (window.Navigation) {
            window.Navigation.setCurrentView('menu');
        } else {
            window.currentView = 'menu';
        }
        
        console.log('✅ Menú principal mostrado para:', this.state.userRole);
    },

    /**
     * Cierra la sesión del usuario
     */
    logout() {
        this.state.userRole = null;
        this.state.isAuthenticated = false;
        
        // Limpiar token de sesión
        sessionStorage.removeItem('session_token');
        
        // Limpiar historial de consultas IA de la sesión
        if (window.AIHistory && window.AIHistory.clearSession) {
            window.AIHistory.clearSession();
        }
        if (window.MultiHistory && window.MultiHistory.clearSession) {
            window.MultiHistory.clearSession();
        }
        
        document.getElementById('authScreen').style.display = 'block';
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('actasSection').style.display = 'none';
        document.getElementById('adminSection').style.display = 'none';
        document.getElementById('backButton').style.display = 'none';
        
        const authForm = document.getElementById('authForm');
        if (authForm) authForm.reset();
        
        const authMessage = document.getElementById('authMessage');
        if (authMessage) authMessage.innerHTML = '';
        
        if (window.Navigation) {
            window.Navigation.setCurrentView('auth');
        } else {
            window.currentView = 'auth';
        }
        
        console.log('✅ Sesión cerrada, token eliminado y historial de consultas limpiado');
    },

    /**
     * Verifica si el usuario actual es administrador
     */
    isAdmin() {
        return this.state.userRole === 'admin';
    },

    /**
     * Obtiene headers con token de sesión para llamadas API
     */
    getApiHeaders() {
        const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || '';
        
        // Headers básicos para todas las peticiones
        const headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        };
        
        // Solo para usuarios autenticados, agregar token de sesión
        if (this.state.isAuthenticated && this.state.userRole === 'admin') {
            const sessionToken = sessionStorage.getItem('session_token');
            if (sessionToken) {
                headers['x-session-token'] = sessionToken;
            }
        }
        
        return headers;
    },

    /**
     * Inicializa el sistema de autenticación
     */
    initialize() {
        const authForm = document.getElementById('authForm');
        if (!authForm) {
            console.error('❌ Formulario de autenticación no encontrado');
            return;
        }

        authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        console.log('✅ Sistema de autenticación inicializado');
    },

    /**
     * Maneja el envío del formulario de autenticación
     */
    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const messageDiv = document.getElementById('authMessage');
        const passwordInput = document.getElementById('password');
        const password = passwordInput?.value;
        
        if (!password) {
            if (window.Utils) {
                Utils.showMessage('authMessage', 'Por favor ingrese una contraseña', 'error');
            } else {
                messageDiv.innerHTML = '<div class="error">Por favor ingrese una contraseña</div>';
            }
            return;
        }
        
        const role = await this.authenticate(password);
        
        if (role) {
            if (window.Utils) {
                Utils.showMessage('authMessage', 'Acceso autorizado...', 'success');
            } else {
                messageDiv.innerHTML = '<div class="success">Acceso autorizado...</div>';
            }
            
            setTimeout(() => {
                this.showMainMenu();
            }, 1000);
            
        } else {
            if (window.Utils) {
                Utils.showMessage('authMessage', 'Contraseña incorrecta', 'error');
            } else {
                messageDiv.innerHTML = '<div class="error">Contraseña incorrecta</div>';
            }
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
};

// Compatibilidad: mantener funciones globales existentes
window.authenticate = window.Auth.authenticate.bind(window.Auth);
window.showMainMenu = window.Auth.showMainMenu.bind(window.Auth);
window.logout = window.Auth.logout.bind(window.Auth);
window.getApiHeaders = window.Auth.getApiHeaders.bind(window.Auth);

// Mantener variable global userRole para compatibilidad
Object.defineProperty(window, 'userRole', {
    get() { return window.Auth.state.userRole; },
    set(value) { window.Auth.state.userRole = value; }
});

console.log('✅ Auth.js cargado correctamente');