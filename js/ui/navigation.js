/**
 * navigation.js - Sistema de navegación entre vistas
 * Sistema de Actas Municipales
 */

// Namespace global para navegación
window.Navigation = {
    
    state: {
        currentView: 'auth',
        previousView: null
    },

    /**
     * Muestra la sección de actas
     */
    showActas() {
        this.hideAllSections();
        
        document.getElementById('actasSection').style.display = 'block';
        document.getElementById('backButton').style.display = 'block';
        
        this.setCurrentView('actas');
        
        // Cargar actas si la función existe
        if (typeof loadActas === 'function') {
            loadActas();
        }
        
        console.log('✅ Vista de actas mostrada');
    },

    /**
     * Muestra la sección de administración
     */
    showAdmin() {
        const isAdmin = window.Auth ? window.Auth.isAdmin() : window.userRole === 'admin';
        
        if (!isAdmin) {
            alert('Acceso denegado. Solo los administradores pueden subir actas.');
            return;
        }
        
        this.hideAllSections();
        
        document.getElementById('adminSection').style.display = 'block';
        document.getElementById('backButton').style.display = 'block';
        
        this.setCurrentView('admin');
        
        // Cargar estadísticas de procesamiento si la función existe
        if (typeof loadProcessingStats === 'function') {
            loadProcessingStats();
        }
        
        console.log('✅ Vista de administración mostrada');
    },

    /**
     * Vuelve al menú principal
     */
    goBack() {
        if (window.Auth && window.Auth.showMainMenu) {
            window.Auth.showMainMenu();
        } else if (typeof showMainMenu === 'function') {
            showMainMenu();
        } else {
            this.showMainMenu();
        }
    },

    /**
     * Muestra el menú principal
     */
    showMainMenu() {
        const isAuthenticated = window.Auth ? window.Auth.state.isAuthenticated : window.userRole !== null;
        
        if (!isAuthenticated) {
            console.warn('⚠️ Usuario no autenticado, redirigiendo a login');
            this.showAuth();
            return;
        }
        
        this.hideAllSections();
        
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('backButton').style.display = 'none';
        
        this.setCurrentView('menu');
        
        console.log('✅ Menú principal mostrado');
    },

    /**
     * Oculta todas las secciones
     */
    hideAllSections() {
        const sections = ['authScreen', 'mainMenu', 'actasSection', 'adminSection'];
        
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.style.display = 'none';
            }
        });
    },

    /**
     * Establece la vista actual
     */
    setCurrentView(view) {
        this.state.previousView = this.state.currentView;
        this.state.currentView = view;
        
        // La variable global se actualiza automáticamente vía Object.defineProperty
    },

    /**
     * Inicializa el sistema de navegación
     */
    initialize() {
        console.log('✅ Sistema de navegación inicializado');
    }
};

// Compatibilidad: mantener funciones globales existentes
window.showActas = window.Navigation.showActas.bind(window.Navigation);
window.showAdmin = window.Navigation.showAdmin.bind(window.Navigation);
window.goBack = window.Navigation.goBack.bind(window.Navigation);

// Mantener variable global currentView para compatibilidad
Object.defineProperty(window, 'currentView', {
    get() { return window.Navigation.state.currentView; },
    set(value) { window.Navigation.setCurrentView(value); }
});

console.log('✅ Navigation.js cargado correctamente');