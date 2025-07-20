/**
 * ai-history.js - Gestión del historial de consultas IA
 * Sistema de Actas Municipales
 */

window.AIHistory = {
    /**
     * Inicialización del módulo
     */
    initialize() {
        console.log('✅ AIHistory inicializado');
    },
    
    /**
     * Guarda una consulta en la base de datos
     */
    async save(actaId, question, answer) {
        try {
            // Obtener configuración de las variables globales que se cargan en index.html
            const SUPABASE_URL = window.SUPABASE_URL;
            const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
            
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                console.error('Configuración de Supabase no disponible');
                return;
            }
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/consultas_ia`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    acta_id: actaId,
                    pregunta: question,
                    respuesta: answer,
                    created_by: window.userRole || 'usuario'
                })
            });
            
            if (!response.ok) {
                console.error('Error al guardar consulta:', response.statusText);
            }
        } catch (error) {
            console.error('Error al guardar consulta:', error);
        }
    },
    
    /**
     * Carga el historial de consultas de un acta
     */
    async load(actaId) {
        try {
            // Obtener configuración de las variables globales que se cargan en index.html
            const SUPABASE_URL = window.SUPABASE_URL;
            const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
            
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                console.error('Configuración de Supabase no disponible');
                return;
            }
            
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/consultas_ia?acta_id=eq.${actaId}&order=created_at.desc&limit=5`, 
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );
            
            if (response.ok) {
                const history = await response.json();
                this.render(history);
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    },
    
    /**
     * Renderiza el historial en el DOM
     */
    render(history) {
        const historyDiv = document.getElementById('queryHistory');
        const historyList = document.getElementById('historyList');
        
        if (history.length > 0) {
            historyDiv.style.display = 'block';
            historyList.innerHTML = history.map(item => `
                <div class="history-item">
                    <div class="history-question"><strong>P:</strong> ${item.pregunta}</div>
                    <div class="history-answer"><strong>R:</strong> ${item.respuesta}</div>
                    <div class="history-date">${new Date(item.created_at).toLocaleString('es-ES')}</div>
                </div>
            `).join('');
        } else {
            historyDiv.style.display = 'none';
        }
    }
};

// Funciones globales para compatibilidad
window.saveQuery = async function(actaId, question, answer) {
    if (window.AIHistory) {
        return await window.AIHistory.save(actaId, question, answer);
    }
};

window.loadQueryHistory = async function(actaId) {
    if (window.AIHistory) {
        return await window.AIHistory.load(actaId);
    }
};

console.log('✅ ai-history.js cargado');