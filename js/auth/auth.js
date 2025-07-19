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
    authenticate(password) {
        if (!password) return null;
        
        const PASSWORD_ADMIN = window.APP_CONFIG?.PASSWORD_ADMIN || window.PASSWORD_ADMIN || 'admin123';
        const PASSWORD_USER = window.APP_CONFIG?.PASSWORD_USER || window.PASSWORD_USER || 'usuario123';
        
        if (password === PASSWORD_ADMIN) {
            this.state.userRole = 'admin';
            this.state.isAuthenticated = true;
            return 'admin';
        } else if (password === PASSWORD_USER) {
            this.state.userRole = 'user';
            this.state.isAuthenticated = true;
            return 'user';
        }
        
        return null;
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
        
        console.log('✅ Sesión cerrada');
    },

    /**
     * Verifica si el usuario actual es administrador
     */
    isAdmin() {
        return this.state.userRole === 'admin';
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
        
        const role = this.authenticate(password);
        
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

// Mantener variable global userRole para compatibilidad
Object.defineProperty(window, 'userRole', {
    get() { return window.Auth.state.userRole; },
    set(value) { window.Auth.state.userRole = value; }
});

console.log('✅ Auth.js cargado correctamente');