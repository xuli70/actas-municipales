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
     * Configurar event listeners usando delegación de eventos
     */
    setupEventListeners() {
        const actasList = document.getElementById('actasList');
        if (!actasList) return;
        
        // Usar delegación de eventos para manejar clicks en botones de flecha
        actasList.addEventListener('click', (e) => {
            console.log('🔍 DEBUG Event delegation click:', e.target.className, e.target.tagName);
            
            // Verificar si se hizo click en un botón de mover hacia arriba
            if (e.target.classList.contains('btn-move-up')) {
                e.preventDefault();
                e.stopPropagation(); // Evitar propagación
                console.log('🔼 DEBUG: Click en btn-move-up detectado');
                
                const actaItem = e.target.closest('.acta-item');
                if (actaItem) {
                    const currentIndex = this.getCurrentIndex(actaItem);
                    console.log(`🔼 Delegated click: Moviendo hacia arriba desde posición: ${currentIndex}`);
                    
                    // Deshabilitar temporalmente el botón para evitar dobles clicks
                    e.target.disabled = true;
                    setTimeout(() => e.target.disabled = false, 500);
                    
                    this.moveUp(currentIndex);
                } else {
                    console.log('❌ No se encontró .acta-item padre');
                }
                return;
            }
            
            // Verificar si se hizo click en un botón de mover hacia abajo
            if (e.target.classList.contains('btn-move-down')) {
                e.preventDefault();
                e.stopPropagation(); // Evitar propagación
                console.log('🔽 DEBUG: Click en btn-move-down detectado');
                
                const actaItem = e.target.closest('.acta-item');
                if (actaItem) {
                    const currentIndex = this.getCurrentIndex(actaItem);
                    console.log(`🔽 Delegated click: Moviendo hacia abajo desde posición: ${currentIndex}`);
                    
                    // Deshabilitar temporalmente el botón para evitar dobles clicks
                    e.target.disabled = true;
                    setTimeout(() => e.target.disabled = false, 500);
                    
                    this.moveDown(currentIndex);
                } else {
                    console.log('❌ No se encontró .acta-item padre');
                }
                return;
            }
        });
        
        console.log('✅ Event delegation configurado para botones de reordenamiento');
    },
    
    /**
     * Entrar en modo reordenamiento
     */
    async enterReorderMode() {
        if (userRole !== 'admin') {
            alert('Solo los administradores pueden reordenar las actas.');
            return;
        }
        
        console.log('🔄 Activando modo reordenamiento');
        this.reorderMode = true;
        
        // Cargar actas actuales y esperar a que termine
        await this.loadCurrentActas();
        
        // Actualizar UI después de cargar
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
            // Usar la función con orden personalizado del ActasManager
            await window.ActasManager.loadActasWithCustomOrder();
            
            // Obtener las actas cargadas desde Supabase para uso interno
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?order=orden_manual.asc.nullslast,fecha.desc`, {
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
        if (!actasList) {
            console.error('❌ No se encontró elemento actasList');
            return;
        }
        
        // Agregar clase de modo reordenamiento
        actasList.classList.add('reorder-mode');
        
        // Agregar controles de reordenamiento a cada acta - buscar dentro de .actas-list
        const actasItems = actasList.querySelectorAll('.actas-list .acta-item');
        console.log(`📋 Encontrados ${actasItems.length} items de actas para reordenar`);
        
        if (actasItems.length === 0) {
            console.error('❌ No se encontraron items de actas para reordenar');
            return;
        }
        
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
        console.log(`🔧 Agregando controles a acta ${index}:`, item.dataset.actaId);
        
        // Verificar que el item tiene actaId
        if (!item.dataset.actaId) {
            console.error(`❌ Item ${index} no tiene data-acta-id`);
            return;
        }
        
        // Hacer el item arrastrable
        item.setAttribute('draggable', 'true');
        item.classList.add('reorderable');
        
        // Agregar handle de arrastre
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.title = 'Arrastra para reordenar';
        
        // Crear botones de orden
        const upBtn = document.createElement('button');
        upBtn.className = 'btn-move-up';
        upBtn.innerHTML = '↑';
        upBtn.title = 'Subir';
        upBtn.disabled = index === 0;
        
        const downBtn = document.createElement('button');
        downBtn.className = 'btn-move-down';
        downBtn.innerHTML = '↓';
        downBtn.title = 'Bajar';
        downBtn.disabled = index === this.actas.length - 1;
        
        // Los event listeners se manejan via delegación de eventos
        // Ver setupEventListeners() para la implementación
        
        // Crear contenedor de controles
        const orderControls = document.createElement('div');
        orderControls.className = 'order-controls';
        
        // Agregar span con número de orden
        const orderNumber = document.createElement('span');
        orderNumber.className = 'order-number';
        orderNumber.textContent = index + 1;
        
        // Ensamblar controles
        orderControls.appendChild(upBtn);
        orderControls.appendChild(orderNumber);
        orderControls.appendChild(downBtn);
        
        // Insertar controles al inicio del item
        item.insertBefore(dragHandle, item.firstChild);
        item.appendChild(orderControls);
        
        // Guardar índice original
        item.dataset.originalIndex = index;
    },
    
    /**
     * Obtener índice actual de un elemento en el DOM
     */
    getCurrentIndex(item) {
        const actasList = document.getElementById('actasList').querySelector('.actas-list');
        const items = Array.from(actasList.children);
        return items.indexOf(item);
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
        console.log(`🔼 MoveUp llamado con índice: ${index}`);
        
        if (index <= 0) {
            console.log(`❌ No se puede mover hacia arriba: índice ${index} es el primero`);
            return;
        }
        
        const actasList = document.getElementById('actasList').querySelector('.actas-list');
        const items = Array.from(actasList.children);
        
        console.log(`📋 Total items disponibles: ${items.length}`);
        
        if (index >= items.length) {
            console.error(`❌ Índice fuera de rango: ${index} >= ${items.length}`);
            return;
        }
        
        const currentItem = items[index];
        const previousItem = items[index - 1];
        
        console.log(`🔄 Intercambiando posiciones: item ${index} (${currentItem.dataset.actaId}) sube a posición ${index - 1}, item ${index - 1} (${previousItem.dataset.actaId}) baja a posición ${index}`);
        
        // Intercambiar elementos: mover el elemento actual antes del anterior
        // Esto hace que el elemento actual suba exactamente 1 posición
        actasList.insertBefore(currentItem, previousItem);
        
        // Verificar después del movimiento
        const newItems = Array.from(actasList.children);
        console.log(`📋 DEBUG Después movimiento: [${newItems.map((item, i) => `${i}:${item.dataset.actaId}`).join(', ')}]`);
        
        const newIndexOfMoved = newItems.findIndex(item => item.dataset.actaId === currentItem.dataset.actaId);
        console.log(`📊 ${currentItem.dataset.actaId} se movió de posición ${index} a posición ${newIndexOfMoved} (cambio: ${newIndexOfMoved - index})`);
        
        // Usar setTimeout para asegurar que el DOM esté completamente estable
        setTimeout(() => this.updateOrder(), 0);
    },
    
    /**
     * Mover acta hacia abajo
     */
    moveDown(index) {
        console.log(`🔽 MoveDown llamado con índice: ${index}`);
        
        const actasList = document.getElementById('actasList').querySelector('.actas-list');
        const items = Array.from(actasList.children);
        
        console.log(`📋 DEBUG Antes movimiento: [${items.map((item, i) => `${i}:${item.dataset.actaId}`).join(', ')}]`);
        
        if (index >= items.length - 1) {
            console.log(`❌ No se puede mover hacia abajo: índice ${index} es el último`);
            return;
        }
        
        if (index < 0 || index >= items.length) {
            console.error(`❌ Índice fuera de rango: ${index} no válido para ${items.length} items`);
            return;
        }
        
        const currentItem = items[index];
        const nextItem = items[index + 1];
        
        console.log(`🔄 ANTES: ${currentItem.dataset.actaId} en posición ${index}, ${nextItem.dataset.actaId} en posición ${index + 1}`);
        
        // Intercambiar elementos: mover el elemento siguiente antes del actual
        // Esto hace que el elemento actual baje exactamente 1 posición
        actasList.insertBefore(nextItem, currentItem);
        
        // Verificar después del movimiento
        const newItems = Array.from(actasList.children);
        console.log(`📋 DEBUG Después movimiento: [${newItems.map((item, i) => `${i}:${item.dataset.actaId}`).join(', ')}]`);
        
        const newIndexOfMoved = newItems.findIndex(item => item.dataset.actaId === currentItem.dataset.actaId);
        console.log(`📊 ${currentItem.dataset.actaId} se movió de posición ${index} a posición ${newIndexOfMoved} (cambio: ${newIndexOfMoved - index})`);
        
        // Usar setTimeout para asegurar que el DOM esté completamente estable
        setTimeout(() => this.updateOrder(), 0);
    },
    
    /**
     * Actualizar orden después de cambios
     */
    async updateOrder() {
        // Prevenir múltiples ejecuciones simultáneas
        if (this._updating) {
            console.log('⏳ updateOrder ya se está ejecutando, ignorando llamada duplicada');
            return;
        }
        this._updating = true;
        
        console.log('🔄 Iniciando actualización de orden');
        
        const actasList = document.getElementById('actasList').querySelector('.actas-list');
        const items = Array.from(actasList.children);
        
        // Verificar que no hay duplicados en los IDs
        const ids = items.map(item => item.dataset.actaId);
        const uniqueIds = [...new Set(ids)];
        if (ids.length !== uniqueIds.length) {
            console.error('❌ DETECTADOS IDs DUPLICADOS en el DOM:', ids);
            this._updating = false;
            return;
        }
        
        console.log(`📋 Actualizando orden para ${items.length} items`);
        
        // Actualizar números de orden en UI y estados de botones
        items.forEach((item, index) => {
            console.log(`🔧 Actualizando item ${index}: ${item.dataset.actaId}`);
            
            // Actualizar número de orden
            const orderNumber = item.querySelector('.order-number');
            if (orderNumber) {
                orderNumber.textContent = index + 1;
                console.log(`📊 Número actualizado a: ${index + 1}`);
            }
            
            // Actualizar estado de botones
            const upBtn = item.querySelector('.btn-move-up');
            const downBtn = item.querySelector('.btn-move-down');
            
            if (upBtn) {
                const shouldDisableUp = index === 0;
                upBtn.disabled = shouldDisableUp;
                console.log(`🔼 Botón subir ${shouldDisableUp ? 'deshabilitado' : 'habilitado'} para item ${index}`);
            }
            
            if (downBtn) {
                const shouldDisableDown = index === items.length - 1;
                downBtn.disabled = shouldDisableDown;
                console.log(`🔽 Botón bajar ${shouldDisableDown ? 'deshabilitado' : 'habilitado'} para item ${index}`);
            }
        });
        
        console.log('💾 Procediendo a guardar orden en base de datos');
        
        // Guardar orden en Supabase
        await this.saveOrderToDatabase(items);
    },
    
    /**
     * Guardar orden en base de datos
     */
    async saveOrderToDatabase(items) {
        console.log('💾 Guardando nuevo orden en Supabase...');
        console.log(`📝 Actualizando ${items.length} actas`);
        
        try {
            const updates = items.map((item, index) => ({
                id: item.dataset.actaId,
                orden_manual: index + 1
            }));
            
            console.log('📋 Updates a realizar:', updates);
            
            // Actualizar cada acta individualmente
            for (const update of updates) {
                console.log(`🔄 Actualizando acta ${update.id} con orden ${update.orden_manual}`);
                
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
        } finally {
            // Liberar el flag de actualización
            this._updating = false;
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

// Inicializar el módulo cuando se carga
window.ReorderManager.initialize();

// Mantener compatibilidad con funciones globales
window.enterReorderMode = () => window.ReorderManager.enterReorderMode();
window.exitReorderMode = () => window.ReorderManager.exitReorderMode();