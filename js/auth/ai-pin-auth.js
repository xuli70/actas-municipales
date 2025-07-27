/**
 * ai-pin-auth.js - Sistema de autenticación por PIN para consultas IA
 * Solo aplica para usuarios regulares, no para administradores
 * Sistema de Actas Municipales
 */

window.AIPinAuth = {
    
    /**
     * Verifica si el usuario tiene acceso a las funciones de IA
     * @returns {boolean} true si es admin o usuario con PIN validado
     */
    isValidated() {
        // Los administradores siempre tienen acceso directo
        if (window.Auth && window.Auth.isAdmin()) {
            return true;
        }
        
        // Los usuarios regulares necesitan PIN validado en la sesión
        return sessionStorage.getItem('ai_pin_validated') === 'true';
    },
    
    /**
     * Valida el PIN ingresado por el usuario
     * @param {string} pin - PIN de 4 dígitos
     * @returns {boolean} true si el PIN es correcto
     */
    async validatePin(pin) {
        const correctPin = window.APP_CONFIG?.AI_ACCESS_PIN;
        
        if (!correctPin) {
            console.warn('⚠️ AI_ACCESS_PIN no configurado. Acceso denegado.');
            return false;
        }
        
        if (pin === correctPin) {
            // Guardar validación en la sesión actual
            sessionStorage.setItem('ai_pin_validated', 'true');
            console.log('✅ PIN validado correctamente para la sesión');
            return true;
        }
        
        console.log('❌ PIN incorrecto');
        return false;
    },
    
    /**
     * Muestra el modal de entrada de PIN
     * @returns {Promise<boolean>} true si el usuario ingresó el PIN correcto
     */
    async requestPin() {
        return new Promise((resolve) => {
            const modal = document.getElementById('aiPinModal');
            const pinInput = document.getElementById('aiPinInput');
            const pinError = document.getElementById('aiPinError');
            const submitBtn = document.getElementById('aiPinSubmit');
            const cancelBtn = document.getElementById('aiPinCancel');
            
            if (!modal || !pinInput) {
                console.error('❌ Modal de PIN no encontrado');
                resolve(false);
                return;
            }
            
            // Limpiar estado anterior
            pinInput.value = '';
            pinError.style.display = 'none';
            
            // Mostrar modal
            modal.style.display = 'flex';
            pinInput.focus();
            
            // Handler para submit
            const handleSubmit = async () => {
                const pin = pinInput.value.trim();
                
                if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
                    pinError.textContent = 'El PIN debe ser de 4 dígitos';
                    pinError.style.display = 'block';
                    pinInput.select();
                    return;
                }
                
                const isValid = await this.validatePin(pin);
                
                if (isValid) {
                    modal.style.display = 'none';
                    resolve(true);
                } else {
                    pinError.textContent = 'PIN incorrecto. Intente nuevamente.';
                    pinError.style.display = 'block';
                    pinInput.select();
                }
            };
            
            // Handler para cancelar
            const handleCancel = () => {
                modal.style.display = 'none';
                resolve(false);
            };
            
            // Event listeners temporales
            const handleKeyPress = (e) => {
                if (e.key === 'Enter') {
                    handleSubmit();
                } else if (e.key === 'Escape') {
                    handleCancel();
                }
            };
            
            // Limpiar listeners anteriores si existen
            submitBtn.replaceWith(submitBtn.cloneNode(true));
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            
            // Obtener referencias nuevas después del clone
            const newSubmitBtn = document.getElementById('aiPinSubmit');
            const newCancelBtn = document.getElementById('aiPinCancel');
            
            // Agregar nuevos listeners
            newSubmitBtn.addEventListener('click', handleSubmit);
            newCancelBtn.addEventListener('click', handleCancel);
            pinInput.addEventListener('keypress', handleKeyPress);
            
            // Limpiar al cerrar
            const cleanup = () => {
                pinInput.removeEventListener('keypress', handleKeyPress);
            };
            
            // Guardar cleanup para uso posterior
            modal.dataset.cleanup = cleanup;
        });
    },
    
    /**
     * Verifica acceso y solicita PIN si es necesario
     * @returns {Promise<boolean>} true si el usuario tiene acceso
     */
    async checkAccess() {
        if (this.isValidated()) {
            return true;
        }
        
        // Usuario regular sin PIN validado - solicitar PIN
        return await this.requestPin();
    },
    
    /**
     * Limpia la validación del PIN (al cerrar sesión)
     */
    clearValidation() {
        sessionStorage.removeItem('ai_pin_validated');
        console.log('✅ Validación de PIN eliminada');
    },
    
    /**
     * Inicializa el módulo
     */
    initialize() {
        // Limpiar validación al cerrar sesión
        const originalLogout = window.logout;
        window.logout = function() {
            window.AIPinAuth.clearValidation();
            if (originalLogout) {
                originalLogout.apply(this, arguments);
            }
        };
        
        console.log('✅ AIPinAuth inicializado');
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AIPinAuth.initialize());
} else {
    window.AIPinAuth.initialize();
}

console.log('✅ ai-pin-auth.js cargado correctamente');