/**
 * Reorder Manager - Gestión de reordenamiento de actas para administradores
 * Parte del sistema modular de Actas Municipales
 */

window.ReorderManager = {
    reorderMode: false,
    actas: [],
    
    /**
     * Inicializar el módulo
     */
    initialize() {
        this.setupEventListeners();
        console.log('✅ ReorderManager inicializado');
    },
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Los event listeners se configurarán cuando se active el modo
    },
    
    /**
     * Entrar en modo reordenamiento
     */
    enterReorderMode() {
        if (userRole !== 'admin') {
            alert('Solo los administradores pueden reordenar las actas.');
            return;
        }
        
        console.log('🔄 Activando modo reordenamiento');
        this.reorderMode = true;
        
        // Cargar actas actuales
        this.loadCurrentActas();
        
        // Actualizar UI
        this.updateUIForReorderMode();
        
        // Configurar drag and drop
        this.setupDragAndDrop();
    },
    
    /**
     * Salir del modo reordenamiento
     */
    exitReorderMode() {
        console.log('🔄 Saliendo del modo reordenamiento');
        this.reorderMode = false;
        
        // Restaurar UI normal
        this.restoreNormalUI();
        
        // Recargar actas con orden actualizado
        if (window.ActasManager && window.ActasManager.loadActas) {
            window.ActasManager.loadActas();
        }
        
        // Ocultar botón cancelar, mostrar botón reordenar
        const reorderBtn = document.querySelector('.btn-reorder');
        const cancelBtn = document.querySelector('.btn-cancel-reorder');
        
        if (reorderBtn) reorderBtn.style.display = 'inline-block';
        if (cancelBtn) cancelBtn.style.display = 'none';
    },
    
    /**
     * Cargar actas actuales para reordenamiento
     */
    async loadCurrentActas() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?order=orden_manual.asc.nulls.last,fecha.desc`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (!response.ok) throw new Error('Error al cargar actas');
            
            this.actas = await response.json();
            console.log(`📋 Cargadas ${this.actas.length} actas para reordenamiento`);
            
        } catch (error) {
            console.error('Error cargando actas para reordenamiento:', error);
            alert('Error al cargar las actas para reordenar.');
        }
    },
    
    /**
     * Actualizar UI para modo reordenamiento
     */
    updateUIForReorderMode() {
        const actasList = document.getElementById('actasList');
        if (!actasList) return;
        
        // Agregar clase de modo reordenamiento
        actasList.classList.add('reorder-mode');
        
        // Agregar controles de reordenamiento a cada acta
        const actasItems = actasList.querySelectorAll('.acta-item');
        actasItems.forEach((item, index) => {
            this.addReorderControls(item, index);
        });
        
        // Mostrar instrucciones
        this.showReorderInstructions();
        
        // Ocultar botón reordenar, mostrar botón cancelar
        const reorderBtn = document.querySelector('.btn-reorder');
        const cancelBtn = document.querySelector('.btn-cancel-reorder');
        
        if (reorderBtn) reorderBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
    },
    
    /**
     * Agregar controles de reordenamiento a un item de acta
     */
    addReorderControls(item, index) {
        // Hacer el item arrastrable
        item.setAttribute('draggable', 'true');
        item.classList.add('reorderable');
        
        // Agregar handle de arrastre
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.title = 'Arrastra para reordenar';
        
        // Agregar botones de orden
        const orderControls = document.createElement('div');
        orderControls.className = 'order-controls';
        orderControls.innerHTML = `
            <button class="btn-move-up" onclick="ReorderManager.moveUp(${index})" title="Subir" ${index === 0 ? 'disabled' : ''}>↑</button>
            <span class="order-number">${index + 1}</span>
            <button class="btn-move-down" onclick="ReorderManager.moveDown(${index})" title="Bajar" ${index === this.actas.length - 1 ? 'disabled' : ''}>↓</button>
        `;
        
        // Insertar controles al inicio del item
        item.insertBefore(dragHandle, item.firstChild);
        item.appendChild(orderControls);
        
        // Guardar índice original
        item.dataset.originalIndex = index;
    },
    
    /**
     * Configurar drag and drop
     */
    setupDragAndDrop() {
        const actasList = document.getElementById('actasList');
        if (!actasList) return;
        
        actasList.addEventListener('dragstart', this.handleDragStart.bind(this));
        actasList.addEventListener('dragover', this.handleDragOver.bind(this));
        actasList.addEventListener('drop', this.handleDrop.bind(this));
        actasList.addEventListener('dragend', this.handleDragEnd.bind(this));
    },
    
    /**
     * Manejar inicio de arrastre
     */
    handleDragStart(e) {
        if (!e.target.classList.contains('reorderable')) return;
        
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
        e.dataTransfer.setData('text/plain', e.target.dataset.actaId);
    },
    
    /**
     * Manejar arrastre sobre elemento
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = this.getDragAfterElement(e.clientY);
        const dragging = document.querySelector('.dragging');
        
        if (afterElement == null) {
            e.currentTarget.appendChild(dragging);
        } else {
            e.currentTarget.insertBefore(dragging, afterElement);
        }
    },
    
    /**
     * Obtener elemento después del cual insertar
     */
    getDragAfterElement(y) {
        const draggableElements = [...document.querySelectorAll('.reorderable:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },
    
    /**
     * Manejar soltar elemento
     */
    handleDrop(e) {
        e.preventDefault();
        this.updateOrder();
    },
    
    /**
     * Manejar fin de arrastre
     */
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    },
    
    /**
     * Mover acta hacia arriba
     */
    moveUp(index) {
        if (index <= 0) return;
        
        const actasList = document.getElementById('actasList').querySelector('.actas-list');
        const items = actasList.children;
        
        if (index < items.length) {
            actasList.insertBefore(items[index], items[index - 1]);
            this.updateOrder();
        }
    },
    
    /**
     * Mover acta hacia abajo
     */
    moveDown(index) {
        const actasList = document.getElementById('actasList').querySelector('.actas-list');
        const items = actasList.children;
        
        if (index >= items.length - 1) return;
        
        actasList.insertBefore(items[index + 1], items[index]);
        this.updateOrder();
    },
    
    /**
     * Actualizar orden después de cambios
     */
    async updateOrder() {
        const actasList = document.getElementById('actasList').querySelector('.actas-list');
        const items = [...actasList.children];
        
        // Actualizar números de orden en UI
        items.forEach((item, index) => {
            const orderNumber = item.querySelector('.order-number');
            if (orderNumber) orderNumber.textContent = index + 1;
            
            // Actualizar botones
            const upBtn = item.querySelector('.btn-move-up');
            const downBtn = item.querySelector('.btn-move-down');
            
            if (upBtn) upBtn.disabled = index === 0;
            if (downBtn) downBtn.disabled = index === items.length - 1;
        });
        
        // Guardar orden en Supabase
        await this.saveOrderToDatabase(items);
    },
    
    /**
     * Guardar orden en base de datos
     */
    async saveOrderToDatabase(items) {
        console.log('💾 Guardando nuevo orden en Supabase...');
        
        try {
            const updates = items.map((item, index) => ({
                id: item.dataset.actaId,
                orden_manual: index + 1
            }));
            
            // Actualizar cada acta individualmente
            for (const update of updates) {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${update.id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ orden_manual: update.orden_manual })
                });
                
                if (!response.ok) {
                    throw new Error(`Error actualizando acta ${update.id}`);
                }
            }
            
            console.log('✅ Orden guardado exitosamente');
            
        } catch (error) {
            console.error('❌ Error guardando orden:', error);
            alert('Error al guardar el nuevo orden. Por favor, intente nuevamente.');
        }
    },
    
    /**
     * Mostrar instrucciones de reordenamiento
     */
    showReorderInstructions() {
        const actasList = document.getElementById('actasList');
        
        // Crear div de instrucciones si no existe
        let instructions = document.querySelector('.reorder-instructions');
        if (!instructions) {
            instructions = document.createElement('div');
            instructions.className = 'reorder-instructions';
            instructions.innerHTML = `
                <div class="instructions-content">
                    <h4>📝 Modo Reordenamiento Activado</h4>
                    <p>• Arrastra las actas usando el ícono ⋮⋮ para reordenar</p>
                    <p>• Usa los botones ↑ ↓ para mover individualmente</p>
                    <p>• Los cambios se guardan automáticamente</p>
                </div>
            `;
            actasList.insertBefore(instructions, actasList.firstChild);
        }
        
        instructions.style.display = 'block';
    },
    
    /**
     * Restaurar UI normal
     */
    restoreNormalUI() {
        const actasList = document.getElementById('actasList');
        if (!actasList) return;
        
        // Remover clase de modo reordenamiento
        actasList.classList.remove('reorder-mode');
        
        // Ocultar instrucciones
        const instructions = document.querySelector('.reorder-instructions');
        if (instructions) instructions.style.display = 'none';
        
        // Remover controles de reordenamiento
        const dragHandles = actasList.querySelectorAll('.drag-handle');
        const orderControls = actasList.querySelectorAll('.order-controls');
        
        dragHandles.forEach(handle => handle.remove());
        orderControls.forEach(control => control.remove());
        
        // Remover atributos de arrastre
        const actasItems = actasList.querySelectorAll('.acta-item');
        actasItems.forEach(item => {
            item.removeAttribute('draggable');
            item.classList.remove('reorderable');
            delete item.dataset.originalIndex;
        });
    }
};

// Mantener compatibilidad con funciones globales
window.enterReorderMode = () => window.ReorderManager.enterReorderMode();
window.exitReorderMode = () => window.ReorderManager.exitReorderMode();