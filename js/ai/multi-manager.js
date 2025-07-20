/**
 * multi-manager.js - Lógica de consulta IA múltiple
 * Sistema de Actas Municipales
 */

window.MultiAIManager = {
    maxActasPerQuery: 10,
    maxTokensPerActa: 2000,
    
    /**
     * Inicialización
     */
    initialize() {
        console.log('✅ MultiAIManager inicializado');
    },
    
    /**
     * Realizar consulta IA múltiple
     */
    async askMultiAI() {
        const queryInput = document.getElementById('multiAIQuery');
        const query = queryInput ? queryInput.value.trim() : '';
        const selectedActas = window.MultiSelector.getSelectedActas();
        
        console.log(`🤖 Iniciando consulta múltiple: "${query}" sobre ${selectedActas.length} actas`);
        
        // Validaciones
        if (!query) {
            alert('Por favor ingrese una pregunta');
            return;
        }
        
        if (selectedActas.length === 0) {
            alert('No hay actas seleccionadas');
            return;
        }
        
        if (selectedActas.length > this.maxActasPerQuery) {
            alert(`Máximo ${this.maxActasPerQuery} actas por consulta`);
            return;
        }
        
        // Actualizar UI
        window.MultiAIModal.updateAskButton('🤔 Analizando múltiples actas...', true);
        window.MultiAIModal.showResponse('<div class="loading">🔄 La IA está analizando las actas seleccionadas...</div>');
        
        try {
            // Obtener configuración
            const SUPABASE_URL = window.SUPABASE_URL;
            const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
            
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('Configuración de Supabase no disponible');
            }
            
            // Obtener texto de todas las actas
            console.log('📖 Obteniendo texto de las actas...');
            const actasTexts = await this.getMultipleActasTexts(selectedActas, SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // Generar contexto combinado
            console.log('🔧 Combinando contexto de actas...');
            const combinedContext = this.combineActasTexts(actasTexts);
            
            // Generar respuesta
            console.log('🤖 Generando respuesta...');
            const response = await this.generateMultiResponse(query, combinedContext, selectedActas);
            
            // Mostrar respuesta
            window.MultiAIModal.showResponse(`<div class="ai-answer">${response}</div>`);
            
            // Guardar en historial
            if (window.MultiHistory) {
                console.log('💾 Guardando en historial...');
                await window.MultiHistory.save(selectedActas, query, response);
                await window.MultiHistory.load();
            }
            
            // Limpiar consulta
            window.MultiAIModal.clearQuery();
            
            console.log('✅ Consulta múltiple completada exitosamente');
            
        } catch (error) {
            console.error('❌ Error en consulta múltiple:', error);
            window.MultiAIModal.showResponse(`<div class="error">❌ Error al consultar la IA: ${error.message}</div>`);
        } finally {
            window.MultiAIModal.updateAskButton('🤖 Preguntar a la IA', false);
        }
    },
    
    /**
     * Obtener textos de múltiples actas
     */
    async getMultipleActasTexts(selectedActas, SUPABASE_URL, SUPABASE_ANON_KEY) {
        console.log(`📚 Procesando ${selectedActas.length} actas...`);
        
        const promises = selectedActas.map(async (acta, index) => {
            try {
                console.log(`📄 Procesando acta ${index + 1}/${selectedActas.length}: ${acta.titulo}`);
                
                // Usar la función existente de AIManager
                const text = await window.AIManager.getActaText(acta.id, SUPABASE_URL, SUPABASE_ANON_KEY);
                const truncatedText = this.truncateIntelligently(text, this.maxTokensPerActa);
                
                return {
                    actaId: acta.id,
                    titulo: acta.titulo,
                    texto: truncatedText,
                    originalLength: text.length,
                    truncatedLength: truncatedText.length,
                    success: true
                };
            } catch (error) {
                console.error(`❌ Error obteniendo texto de acta ${acta.id}:`, error);
                return {
                    actaId: acta.id,
                    titulo: acta.titulo,
                    texto: '',
                    success: false,
                    error: error.message
                };
            }
        });
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log(`📊 Procesamiento completado: ${successful.length} exitosas, ${failed.length} fallidas`);
        
        return results;
    },
    
    /**
     * Combinar textos de múltiples actas
     */
    combineActasTexts(actasTexts) {
        let combinedText = '=== ANÁLISIS DE MÚLTIPLES ACTAS MUNICIPALES ===\n\n';
        
        const successfulActas = actasTexts.filter(acta => acta.success && acta.texto);
        const failedActas = actasTexts.filter(acta => !acta.success || !acta.texto);
        
        // Estadísticas
        combinedText += `📊 ESTADÍSTICAS:\n`;
        combinedText += `- Total de actas procesadas: ${actasTexts.length}\n`;
        combinedText += `- Actas con contenido disponible: ${successfulActas.length}\n`;
        combinedText += `- Actas sin contenido: ${failedActas.length}\n\n`;
        
        // Agregar actas exitosas
        successfulActas.forEach((acta, index) => {
            combinedText += `=== ACTA ${index + 1}: ${acta.titulo} ===\n`;
            combinedText += `[Longitud original: ${acta.originalLength} caracteres, Procesado: ${acta.truncatedLength} caracteres]\n\n`;
            combinedText += `${acta.texto}\n\n`;
            combinedText += `--- FIN ACTA ${index + 1} ---\n\n`;
        });
        
        // Mencionar actas fallidas
        if (failedActas.length > 0) {
            combinedText += '=== ACTAS NO DISPONIBLES ===\n';
            failedActas.forEach(acta => {
                combinedText += `❌ ${acta.titulo}: ${acta.error || 'Sin texto extraído'}\n`;
            });
            combinedText += '\n';
        }
        
        combinedText += `=== INSTRUCCIONES PARA LA IA ===\n`;
        combinedText += `Analiza el contenido de las ${successfulActas.length} actas municipales anteriores y responde la consulta del usuario.\n`;
        combinedText += `IMPORTANTE:\n`;
        combinedText += `- Incluye referencias específicas a las actas relevantes en tu respuesta\n`;
        combinedText += `- Si la información no está disponible en las actas, indícalo claramente\n`;
        combinedText += `- Estructura tu respuesta de manera clara y organizada\n`;
        combinedText += `- Menciona el número de acta cuando hagas referencia a información específica\n\n`;
        
        const totalChars = combinedText.length;
        const estimatedTokens = Math.round(totalChars / 4);
        
        console.log(`📝 Contexto combinado generado: ${totalChars} caracteres (~${estimatedTokens} tokens)`);
        
        return combinedText;
    },
    
    /**
     * Truncar texto inteligentemente
     */
    truncateIntelligently(text, maxTokens) {
        if (!text) return '';
        
        // Estimación simple: 1 token ≈ 4 caracteres
        const maxChars = maxTokens * 4;
        
        if (text.length <= maxChars) {
            return text;
        }
        
        console.log(`✂️ Truncando texto de ${text.length} a ~${maxChars} caracteres`);
        
        // Truncar en la oración más cercana
        const truncated = text.substring(0, maxChars);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastExclamation = truncated.lastIndexOf('!');
        
        const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
        
        if (lastSentenceEnd > maxChars * 0.8) {
            return truncated.substring(0, lastSentenceEnd + 1) + '\n\n[Texto truncado por límite de tokens]';
        }
        
        return truncated + '...\n\n[Texto truncado por límite de tokens]';
    },
    
    /**
     * Generar respuesta múltiple
     */
    async generateMultiResponse(query, combinedContext, selectedActas) {
        // Usar IA real si está disponible
        const OPENAI_API_KEY = window.OPENAI_API_KEY;
        
        if (OPENAI_API_KEY && window.AI_FUNCTIONS?.callOpenAI) {
            try {
                console.log('🤖 Usando IA real para consulta múltiple');
                return await window.AI_FUNCTIONS.callOpenAI(query, combinedContext);
            } catch (error) {
                console.error('❌ Error con IA real, usando simulación:', error);
            }
        }
        
        // Simulación mejorada para múltiples actas
        console.log('🎭 Usando simulación de IA para consulta múltiple');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return this.simulateMultiResponse(query, combinedContext, selectedActas);
    },
    
    /**
     * Simular respuesta múltiple
     */
    simulateMultiResponse(query, combinedContext, selectedActas) {
        const queryLower = query.toLowerCase();
        let response = `# 📋 Análisis de ${selectedActas.length} Actas Municipales\n\n`;
        
        // Análisis básico por palabras clave
        if (queryLower.includes('presupuesto') || queryLower.includes('budget') || queryLower.includes('económic') || queryLower.includes('dinero')) {
            response += '## 💰 Análisis Presupuestario\n\n';
            response += `He analizado ${selectedActas.length} actas buscando información sobre presupuestos y temas económicos.\n\n`;
            
            selectedActas.forEach((acta, index) => {
                response += `**${index + 1}. ${acta.titulo}:**\n`;
                response += `- Se menciona información presupuestaria en el contenido\n`;
                response += `- Revisar sección de propuestas económicas\n\n`;
            });
            
        } else if (queryLower.includes('vota') || queryLower.includes('aprob') || queryLower.includes('rechaz')) {
            response += '## 🗳️ Análisis de Votaciones\n\n';
            response += `Revisando las votaciones y decisiones en las ${selectedActas.length} actas seleccionadas:\n\n`;
            
            selectedActas.forEach((acta, index) => {
                response += `**Acta ${index + 1}: ${acta.titulo}**\n`;
                response += `- Contiene registros de votaciones del pleno\n`;
                response += `- Verificar sección de acuerdos y resoluciones\n\n`;
            });
            
        } else if (queryLower.includes('tema') || queryLower.includes('asunto') || queryLower.includes('principal')) {
            response += '## 📋 Temas Principales\n\n';
            response += `Resumen de los principales temas tratados en las actas:\n\n`;
            
            selectedActas.forEach((acta, index) => {
                response += `### ${index + 1}. ${acta.titulo}\n`;
                response += `**Temas identificados:**\n`;
                response += `- ${acta.resumen || 'Diversos temas municipales tratados en sesión'}\n`;
                response += `- Revisar orden del día y desarrollo de la sesión\n\n`;
            });
            
        } else {
            response += '## 🔍 Análisis General\n\n';
            response += `Análisis de la consulta: "${query}"\n\n`;
            
            selectedActas.forEach((acta, index) => {
                response += `### Acta ${index + 1}: ${acta.titulo}\n`;
                response += `- **Resumen:** ${acta.resumen || 'Información disponible en el documento completo'}\n`;
                response += `- **Relevancia:** Contiene información relacionada con su consulta\n\n`;
            });
        }
        
        // Sección de conclusiones
        response += '---\n\n';
        response += '## 📊 Resumen del Análisis\n\n';
        response += `✅ **Actas procesadas:** ${selectedActas.length}\n`;
        response += `📄 **Documentos analizados:** Todos los seleccionados\n`;
        response += `🔍 **Consulta:** ${query}\n\n`;
        
        // Recomendaciones
        response += '## 💡 Recomendaciones\n\n';
        response += '- Consulte los PDFs completos para información detallada\n';
        response += '- Use el buscador para términos específicos\n';
        response += '- Configure la integración con OpenAI para análisis más profundo\n\n';
        
        response += '---\n\n';
        response += `⚠️ *Esta es una respuesta simulada basada en ${selectedActas.length} actas municipales. `;
        response += `Para análisis detallado con IA real, configure la integración con OpenAI en las variables de entorno.*`;
        
        return response;
    }
};

console.log('✅ multi-manager.js cargado');