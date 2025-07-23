/**
 * Search Manager - Gestión de búsqueda en actas
 * Parte del sistema modular de Actas Municipales
 */

window.SearchManager = {
    /**
     * Buscar actas por término de búsqueda
     * @param {string} searchTerm - Término a buscar
     */
    async searchActas(searchTerm) {
        const searchResultsDiv = document.getElementById('searchResults');
        const searchResultsList = document.getElementById('searchResultsList');
        const actasListDiv = document.getElementById('actasList');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (!searchTerm || searchTerm.trim() === '') {
            this.clearSearch();
            return;
        }
        
        searchResultsList.innerHTML = '<div class="loading">Buscando...</div>';
        searchResultsDiv.style.display = 'block';
        actasListDiv.style.display = 'none';
        clearBtn.style.display = 'inline-block';
        
        try {
            // Búsqueda directa en la tabla actas usando el campo busqueda_texto
            const searchQuery = encodeURIComponent(`*${searchTerm}*`);
            
            const headers = window.getApiHeaders();
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?busqueda_texto=ilike.${searchQuery}&order=created_at.desc`, {
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const results = await response.json();
            
            if (results.length === 0) {
                searchResultsList.innerHTML = '<p class="no-results">No se encontraron resultados para tu búsqueda.</p>';
                return;
            }
            
            searchResultsList.innerHTML = this.renderSearchResults(results);
                
        } catch (error) {
            searchResultsList.innerHTML = `<div class="error">Error al realizar la búsqueda: ${error.message}</div>`;
            console.error('Error detallado en búsqueda:', error);
        }
    },

    /**
     * Renderizar resultados de búsqueda
     * @param {Array} results - Resultados de la búsqueda
     * @returns {string} HTML renderizado
     */
    renderSearchResults(results) {
        return '<div class="actas-list">' + 
            results.map(acta => `
                <div class="acta-item">
                    <div class="acta-main" onclick="openPDF('${acta.archivo_url}')">
                        <div class="acta-filename">${acta.archivo_nombre || acta.titulo || 'Documento sin nombre'}</div>
                        <div class="acta-summary">${acta.resumen_automatico || 'Resumen no disponible'}</div>
                        <div class="search-relevance">Encontrado en: ${acta.titulo}</div>
                    </div>
                    <div class="acta-actions">
                        <button class="btn-ai-query" onclick="openAIModal('${acta.id}', '${acta.titulo}', '${acta.archivo_url}', '${acta.resumen_automatico || ''}')">
                            &#129302; Consultar IA
                        </button>
                        ${userRole === 'admin' ? `
                            <button class="btn-delete" onclick="deleteActa('${acta.id}', '${acta.archivo_nombre || acta.titulo || 'esta acta'}')" title="Eliminar acta">
                                &#128465; Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('') + 
            '</div>';
    },

    /**
     * Limpiar búsqueda y volver a la lista completa
     */
    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('actasList').style.display = 'block';
        document.getElementById('clearSearchBtn').style.display = 'none';
        
        // Recargar lista completa de actas
        if (window.ActasManager && window.ActasManager.loadActas) {
            window.ActasManager.loadActas();
        } else {
            // Fallback
            loadActas();
        }
    },

    /**
     * Inicializar event listeners de búsqueda
     */
    initializeEventListeners() {
        // Event listener para el formulario de búsqueda
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const searchTerm = document.getElementById('searchInput').value.trim();
                if (searchTerm) {
                    await this.searchActas(searchTerm);
                }
            });
        }
    },

    /**
     * Inicializar el módulo
     */
    initialize() {
        this.initializeEventListeners();
        console.log('✅ SearchManager inicializado');
    }
};

// Mantener compatibilidad con funciones globales
window.searchActas = (searchTerm) => window.SearchManager.searchActas(searchTerm);
window.clearSearch = () => window.SearchManager.clearSearch();