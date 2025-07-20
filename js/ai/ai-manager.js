/**
 * ai-manager.js - Gestión principal del sistema IA
 * Sistema de Actas Municipales
 */

window.AIManager = {
    /**
     * Inicialización del módulo
     */
    initialize() {
        console.log('✅ AIManager inicializado');
    },
    
    /**
     * Realiza una consulta a la IA
     */
    async askAI() {
        const query = document.getElementById('aiQuery').value.trim();
        
        if (!query) {
            alert('Por favor ingrese una pregunta');
            return;
        }
        
        const actaId = window.AIModal ? window.AIModal.getCurrentActaId() : window.currentActaId;
        if (!actaId) {
            alert('Error: No hay acta seleccionada');
            return;
        }
        
        // Actualizar UI
        if (window.AIModal) {
            window.AIModal.updateAskButton('🤔 Pensando...', true);
            window.AIModal.updateResponse('<div class="loading">La IA está analizando el acta...</div>');
        }
        
        try {
            // Obtener configuración
            const config = window.AppConfig || {};
            const SUPABASE_URL = config.SUPABASE_URL || window.SUPABASE_URL;
            const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;
            
            // Obtener el texto extraído del acta
            let textoActa = await this.getActaText(actaId, SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // Generar respuesta de IA
            const simulatedResponse = await this.simulateAIResponse(query, textoActa);
            
            // Actualizar UI con respuesta
            if (window.AIModal) {
                window.AIModal.updateResponse(`<div class="ai-answer">${simulatedResponse}</div>`);
            }
            
            // Guardar consulta en base de datos
            if (window.AIHistory) {
                await window.AIHistory.save(actaId, query, simulatedResponse);
                await window.AIHistory.load(actaId);
            }
            
            // Limpiar campo de pregunta
            if (window.AIModal) {
                window.AIModal.clearQuery();
            }
            
        } catch (error) {
            if (window.AIModal) {
                window.AIModal.updateResponse(`<div class="error">Error al consultar la IA: ${error.message}</div>`);
            }
        } finally {
            if (window.AIModal) {
                window.AIModal.updateAskButton('🤖 Preguntar a la IA', false);
            }
        }
    },
    
    /**
     * Obtiene el texto extraído de un acta
     */
    async getActaText(actaId, SUPABASE_URL, SUPABASE_ANON_KEY) {
        let textoActa = '';
        
        try {
            const actaResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}&select=texto_extraido,titulo,archivo_url`, 
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );
            
            if (actaResponse.ok) {
                const actaData = await actaResponse.json();
                if (actaData.length > 0) {
                    textoActa = actaData[0].texto_extraido || '';
                    
                    // Si no hay texto extraído, intentar extraerlo del PDF
                    if (!textoActa && actaData[0].archivo_url && window.PDFTextExtractor && window.PDFTextExtractor.isPdfJsLoaded()) {
                        try {
                            if (window.AIModal) {
                                window.AIModal.updateResponse('<div class="loading">Extrayendo texto del PDF...</div>');
                            }
                            
                            window.PDFTextExtractor.configurePdfJs();
                            textoActa = await window.PDFTextExtractor.extractTextFromUrl(actaData[0].archivo_url);
                            
                            // Actualizar el texto en la base de datos para futuras consultas
                            await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}`, {
                                method: 'PATCH',
                                headers: {
                                    'apikey': SUPABASE_ANON_KEY,
                                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    texto_extraido: textoActa,
                                    estado_procesamiento: 'completado'
                                })
                            });
                        } catch (extractError) {
                            console.error('Error extrayendo texto del PDF:', extractError);
                        }
                    }
                }
            }
        } catch (fetchError) {
            console.error('Error obteniendo datos del acta:', fetchError);
        }
        
        return textoActa;
    },
    
    /**
     * Simula una respuesta de IA o usa IA real si está configurada
     */
    async simulateAIResponse(query, textoActa) {
        const config = window.AppConfig || {};
        const OPENAI_API_KEY = config.OPENAI_API_KEY || window.OPENAI_API_KEY;
        
        // Si hay API key configurada, usar IA real
        if (OPENAI_API_KEY && window.AI_FUNCTIONS?.callOpenAI) {
            try {
                console.log('Usando IA real con OpenAI');
                const contexto = textoActa || 'No se pudo extraer el contenido del PDF. Por favor, revise el archivo directamente.';
                return await window.AI_FUNCTIONS.callOpenAI(query, contexto);
            } catch (error) {
                console.error('Error con IA real, usando simulación:', error);
            }
        }
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Si hay texto extraído, intentar responder basado en él
        if (textoActa) {
            const queryLower = query.toLowerCase();
            const textoLower = textoActa.toLowerCase();
            
            let respuesta = 'Basándome en el contenido del acta:\n\n';
            
            // Buscar fragmentos relevantes
            const palabrasClave = query.split(' ').filter(p => p.length > 3);
            let fragmentosRelevantes = [];
            
            for (const palabra of palabrasClave) {
                const indice = textoLower.indexOf(palabra.toLowerCase());
                if (indice !== -1) {
                    const inicio = Math.max(0, indice - 200);
                    const fin = Math.min(textoActa.length, indice + 200);
                    let fragmento = textoActa.substring(inicio, fin).trim();
                    
                    if (inicio > 0) fragmento = '...' + fragmento;
                    if (fin < textoActa.length) fragmento = fragmento + '...';
                    
                    fragmentosRelevantes.push(fragmento);
                }
            }
            
            if (fragmentosRelevantes.length > 0) {
                respuesta += 'He encontrado la siguiente información relevante:\n\n';
                respuesta += fragmentosRelevantes.slice(0, 3).join('\n\n');
            } else {
                respuesta += 'No he encontrado información específica sobre "' + query + '" en el acta. ';
                respuesta += 'El documento contiene ' + textoActa.length + ' caracteres de contenido. ';
                respuesta += 'Por favor, reformule su pregunta o consulte el PDF directamente.';
            }
            
            return respuesta;
        }
        
        return 'No se pudo extraer el contenido del PDF para responder su consulta. Por favor, consulte el documento directamente haciendo clic en "Ver PDF".';
    }
};

// Función global para compatibilidad
window.askAI = async function() {
    if (window.AIManager) {
        return await window.AIManager.askAI();
    }
};

// Función global simulateAIResponse para compatibilidad
window.simulateAIResponse = async function(query, textoActa) {
    if (window.AIManager) {
        return await window.AIManager.simulateAIResponse(query, textoActa);
    }
};

console.log('✅ ai-manager.js cargado');