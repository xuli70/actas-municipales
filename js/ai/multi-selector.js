/**
 * multi-selector.js - Gestión de selección múltiple de actas
 * Sistema de Actas Municipales
 */

window.MultiSelector = {
    selectedActas: [],
    selectionMode: false,
    
    /**
     * Inicialización
     */
    initialize() {
        this.setupEventListeners();
        console.log('✅ MultiSelector inicializado');
    },
    
    /**
     * Activar modo selección
     */
    async enterSelectionMode() {
        // Verificar acceso con PIN si es necesario (solo usuarios)
        if (window.AIPinAuth && !await window.AIPinAuth.checkAccess()) {
            console.log('❌ Acceso denegado - PIN no validado');
            return;
        }
        
        this.selectionMode = true;
        this.selectedActas = [];
        
        console.log('🔄 Activando modo selección múltiple');
        
        // Actualizar UI
        const multiSection = document.getElementById('multiAISection');
        const startButton = document.querySelector('.btn-start-selection');
        
        if (multiSection) multiSection.style.display = 'block';
        if (startButton) startButton.style.display = 'none';
        
        // Agregar checkboxes a todas las actas
        this.addCheckboxesToActas();
        this.updateUI();
    },
    
    /**
     * Salir del modo selección
     */
    exitSelectionMode() {
        console.log('🔄 Saliendo del modo selección múltiple');
        
        this.selectionMode = false;
        this.selectedActas = [];
        
        // Actualizar UI
        const multiSection = document.getElementById('multiAISection');
        const startButton = document.querySelector('.btn-start-selection');
        
        if (multiSection) multiSection.style.display = 'none';
        if (startButton) startButton.style.display = 'block';
        
        // Remover checkboxes
        this.removeCheckboxesFromActas();
    },
    
    /**
     * Agregar checkboxes a las actas existentes
     */
    addCheckboxesToActas() {
        const actaItems = document.querySelectorAll('.acta-item');
        console.log(`📋 Agregando checkboxes a ${actaItems.length} actas`);
        
        actaItems.forEach((item, index) => {
            // Verificar si ya tiene checkbox
            if (item.querySelector('.acta-selector')) return;
            
            item.classList.add('selection-mode');
            
            // Obtener ID del acta desde el botón AI existente
            const aiButton = item.querySelector('.btn-ai-query');
            let actaId = null;
            
            if (aiButton && aiButton.onclick) {
                const onclickStr = aiButton.onclick.toString();
                const idMatch = onclickStr.match(/'([^']+)'/);
                if (idMatch) actaId = idMatch[1];
            }
            
            if (!actaId) {
                actaId = `acta-${index}-${Date.now()}`;
            }
            
            // Crear checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'acta-selector';
            checkbox.dataset.actaId = actaId;
            checkbox.addEventListener('change', (e) => this.toggleActa(e));
            
            // Insertar checkbox al inicio
            item.insertBefore(checkbox, item.firstChild);
            
            // Hacer toda el área clickeable (excepto botones)
            item.addEventListener('click', (e) => {
                // No interferir con botones existentes
                if (e.target.tagName === 'BUTTON' || e.target.className.includes('btn')) {
                    return;
                }
                
                if (e.target.className !== 'acta-selector') {
                    checkbox.checked = !checkbox.checked;
                    this.toggleActa({ target: checkbox });
                }
            });
        });
    },
    
    /**
     * Remover checkboxes
     */
    removeCheckboxesFromActas() {
        const checkboxes = document.querySelectorAll('.acta-selector');
        console.log(`🗑️ Removiendo ${checkboxes.length} checkboxes`);
        
        checkboxes.forEach(cb => cb.remove());
        
        const actaItems = document.querySelectorAll('.acta-item');
        actaItems.forEach(item => {
            item.classList.remove('selection-mode', 'selected');
            
            // Clonar para remover event listeners
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });
        
        // Re-agregar funcionalidad original
        this.restoreOriginalFunctionality();
    },
    
    /**
     * Restaurar funcionalidad original de las actas
     */
    restoreOriginalFunctionality() {
        // Recargar las actas para restaurar la funcionalidad original
        if (window.ActasManager && window.ActasManager.loadActas) {
            setTimeout(() => {
                window.ActasManager.loadActas();
            }, 100);
        }
    },
    
    /**
     * Toggle selección de acta individual
     */
    toggleActa(event) {
        const checkbox = event.target;
        const actaId = checkbox.dataset.actaId;
        const actaItem = checkbox.closest('.acta-item');
        
        if (checkbox.checked) {
            if (!this.selectedActas.find(a => a.id === actaId)) {
                // Obtener datos del acta desde el DOM
                const actaData = this.extractActaData(actaItem, actaId);
                this.selectedActas.push(actaData);
                actaItem.classList.add('selected');
                console.log('✅ Acta seleccionada:', actaData.titulo);
            }
        } else {
            this.selectedActas = this.selectedActas.filter(a => a.id !== actaId);
            actaItem.classList.remove('selected');
            console.log('❌ Acta deseleccionada:', actaId);
        }
        
        this.updateUI();
    },
    
    /**
     * Extraer datos del acta desde el DOM
     */
    extractActaData(actaItem, actaId) {
        const titulo = actaItem.querySelector('.acta-filename')?.textContent?.trim() || 'Sin título';
        const resumen = actaItem.querySelector('.acta-summary')?.textContent?.trim() || 'Sin resumen';
        
        return {
            id: actaId,
            titulo: titulo,
            resumen: resumen
        };
    },
    
    /**
     * Seleccionar todas las actas
     */
    selectAll() {
        console.log('☑️ Seleccionando todas las actas');
        const checkboxes = document.querySelectorAll('.acta-selector');
        checkboxes.forEach(cb => {
            if (!cb.checked) {
                cb.checked = true;
                this.toggleActa({ target: cb });
            }
        });
    },
    
    /**
     * Limpiar selección
     */
    clearSelection() {
        console.log('🗑️ Limpiando selección');
        const checkboxes = document.querySelectorAll('.acta-selector');
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        
        document.querySelectorAll('.acta-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        this.selectedActas = [];
        this.updateUI();
    },
    
    /**
     * Actualizar interfaz
     */
    updateUI() {
        const count = this.selectedActas.length;
        const countElement = document.getElementById('selectedCount');
        const summaryElement = document.getElementById('selectionSummary');
        const multiAIBtn = document.querySelector('.btn-multi-ai');
        
        if (countElement) countElement.textContent = count;
        
        if (summaryElement) {
            if (count === 0) {
                summaryElement.textContent = 'No hay actas seleccionadas';
            } else if (count === 1) {
                summaryElement.textContent = `1 acta seleccionada: ${this.selectedActas[0].titulo}`;
            } else {
                const titulos = this.selectedActas.map(a => a.titulo).join(', ');
                if (titulos.length > 100) {
                    summaryElement.textContent = `${count} actas seleccionadas`;
                } else {
                    summaryElement.textContent = `${count} actas seleccionadas: ${titulos}`;
                }
            }
        }
        
        if (multiAIBtn) {
            multiAIBtn.disabled = count === 0;
        }
    },
    
    /**
     * Obtener actas seleccionadas
     */
    getSelectedActas() {
        return [...this.selectedActas];
    },
    
    /**
     * Event listeners
     */
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.selectionMode) {
                if (e.ctrlKey && e.key === 'a') {
                    e.preventDefault();
                    this.selectAll();
                }
                if (e.key === 'Escape') {
                    this.exitSelectionMode();
                }
            }
        });
    }
};

console.log('✅ multi-selector.js cargado');