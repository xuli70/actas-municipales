// summary_generator.js - Generador de resúmenes automáticos para PDFs

class SummaryGenerator {
    constructor() {
        this.wordsToSkip = [
            'sobre', 'durante', 'mediante', 'respecto', 'acuerdo', 'solicitud', 
            'información', 'documento', 'presente', 'anterior', 'siguiente', 
            'número', 'fecha', 'sesión', 'municipal', 'municipio', 'ayuntamiento',
            'para', 'desde', 'hasta', 'cuando', 'donde', 'porque', 'aunque',
            'también', 'además', 'entonces', 'después', 'antes', 'mientras'
        ];
    }

    /**
     * Genera un resumen automático del texto extraído
     * @param {string} textoCompleto - Texto completo del PDF
     * @param {number} maxLength - Longitud máxima del resumen (por defecto 300 caracteres)
     * @returns {string} - Resumen generado
     */
    generateSummary(textoCompleto, maxLength = 300) {
        if (!textoCompleto || textoCompleto.length < 50) {
            return 'Sin contenido suficiente para generar resumen';
        }

        try {
            // Limpiar el texto
            const textoLimpio = this.cleanText(textoCompleto);
            
            // Extraer primer párrafo significativo
            const primerParrafo = this.extractFirstParagraph(textoLimpio);
            
            // Extraer palabras clave
            const palabrasClave = this.extractKeywords(textoLimpio);
            
            // Generar resumen
            let resumen = primerParrafo;
            
            if (palabrasClave.length > 0) {
                resumen += `\n\nPalabras clave: ${palabrasClave.join(', ')}`;
            }
            
            // Truncar si es necesario
            if (resumen.length > maxLength) {
                resumen = resumen.substring(0, maxLength - 3) + '...';
            }
            
            return resumen;
            
        } catch (error) {
            console.error('Error generando resumen:', error);
            return 'Error al generar resumen automático';
        }
    }

    /**
     * Limpia el texto removiendo caracteres especiales y normalizando espacios
     * @param {string} texto - Texto a limpiar
     * @returns {string} - Texto limpio
     */
    cleanText(texto) {
        return texto
            .replace(/\s+/g, ' ')  // Normalizar espacios
            .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ.,;:()]/g, '')  // Mantener solo letras, números y puntuación básica
            .trim();
    }

    /**
     * Extrae el primer párrafo significativo del texto
     * @param {string} texto - Texto completo
     * @returns {string} - Primer párrafo
     */
    extractFirstParagraph(texto) {
        // Dividir por párrafos
        const parrafos = texto.split(/\n\s*\n/);
        
        // Buscar el primer párrafo con contenido sustancial
        for (let parrafo of parrafos) {
            const parrafoLimpio = parrafo.trim();
            
            // Filtrar párrafos muy cortos, números de página, encabezados típicos
            if (parrafoLimpio.length > 50 && 
                !parrafoLimpio.match(/^(página|page|\d+|\w{1,3}\.?|\s*-\s*)$/i) &&
                !parrafoLimpio.match(/^(acta|sesión|pleno|ayuntamiento)\s*(de|del|municipal)?$/i)) {
                
                // Truncar a 200 caracteres aproximadamente para dejar espacio para palabras clave
                if (parrafoLimpio.length > 200) {
                    return parrafoLimpio.substring(0, 200) + '...';
                }
                return parrafoLimpio;
            }
        }
        
        // Si no se encuentra un párrafo adecuado, usar los primeros 200 caracteres
        return texto.substring(0, 200) + '...';
    }

    /**
     * Extrae palabras clave del texto
     * @param {string} texto - Texto completo
     * @returns {Array<string>} - Array de palabras clave
     */
    extractKeywords(texto) {
        // Convertir a minúsculas y dividir en palabras
        const palabras = texto.toLowerCase()
            .split(/\s+/)
            .filter(palabra => palabra.length > 5)  // Solo palabras de más de 5 caracteres
            .filter(palabra => /^[a-záéíóúñ]+$/.test(palabra))  // Solo letras
            .filter(palabra => !this.wordsToSkip.includes(palabra));  // Excluir palabras comunes

        // Contar frecuencia de palabras
        const frecuencia = {};
        palabras.forEach(palabra => {
            frecuencia[palabra] = (frecuencia[palabra] || 0) + 1;
        });

        // Ordenar por frecuencia y tomar las 5 más comunes
        return Object.entries(frecuencia)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([palabra]) => palabra);
    }

    /**
     * Genera un resumen para un acta específica desde la base de datos
     * @param {string} actaId - ID del acta
     * @returns {Promise<string>} - Resumen generado
     */
    async generateSummaryForActa(actaId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}&select=texto_extraido`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error obteniendo datos del acta');
            }

            const data = await response.json();
            if (data.length === 0) {
                return 'Acta no encontrada';
            }

            const textoExtraido = data[0].texto_extraido;
            if (!textoExtraido) {
                return 'Texto no extraído para esta acta';
            }

            return this.generateSummary(textoExtraido);
            
        } catch (error) {
            console.error('Error generando resumen para acta:', error);
            return 'Error al generar resumen';
        }
    }

    /**
     * Actualiza el resumen de un acta en la base de datos
     * @param {string} actaId - ID del acta
     * @param {string} resumen - Resumen generado
     * @returns {Promise<boolean>} - True si se actualizó correctamente
     */
    async updateActaSummary(actaId, resumen) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resumen: resumen,
                    updated_at: new Date().toISOString()
                })
            });

            return response.ok;
            
        } catch (error) {
            console.error('Error actualizando resumen:', error);
            return false;
        }
    }

    /**
     * Procesa todas las actas que no tienen resumen
     * @returns {Promise<Object>} - Estadísticas del procesamiento
     */
    async processAllPendingSummaries() {
        try {
            // Obtener actas sin resumen pero con texto extraído
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?and=(resumen.is.null,texto_extraido.not.is.null)&select=id,texto_extraido`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error obteniendo actas pendientes');
            }

            const actas = await response.json();
            let procesadas = 0;
            let exitosas = 0;

            for (const acta of actas) {
                procesadas++;
                const resumen = this.generateSummary(acta.texto_extraido);
                const actualizado = await this.updateActaSummary(acta.id, resumen);
                
                if (actualizado) {
                    exitosas++;
                }
            }

            return {
                total: actas.length,
                procesadas: procesadas,
                exitosas: exitosas,
                errores: procesadas - exitosas
            };
            
        } catch (error) {
            console.error('Error procesando resúmenes pendientes:', error);
            return {
                total: 0,
                procesadas: 0,
                exitosas: 0,
                errores: 0,
                error: error.message
            };
        }
    }
}

// Hacer disponible globalmente
window.SummaryGenerator = SummaryGenerator;

// Crear instancia global
window.summaryGenerator = new SummaryGenerator();
