// Funciones para extraer texto de archivos PDF usando PDF.js
// Este módulo se debe incluir después de cargar PDF.js

window.PDFTextExtractor = {
    // Extraer texto completo de un archivo PDF
    async extractTextFromFile(file) {
        try {
            // Convertir archivo a ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Cargar el documento PDF
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            
            // Iterar sobre todas las páginas
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Extraer texto de cada item
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');
                
                fullText += `\n--- Página ${pageNum} ---\n${pageText}\n`;
            }
            
            return fullText.trim();
        } catch (error) {
            console.error('Error extrayendo texto del PDF:', error);
            throw new Error('No se pudo extraer el texto del PDF: ' + error.message);
        }
    },
    
    // Extraer texto de un PDF desde URL
    async extractTextFromUrl(url) {
        try {
            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');
                
                fullText += `\n--- Página ${pageNum} ---\n${pageText}\n`;
            }
            
            return fullText.trim();
        } catch (error) {
            console.error('Error extrayendo texto del PDF desde URL:', error);
            throw new Error('No se pudo extraer el texto del PDF: ' + error.message);
        }
    },
    
    // Generar resumen del texto (primeros 500 caracteres significativos)
    generateSummary(text, maxLength = 500) {
        if (!text) return '';
        
        // Limpiar texto y remover información irrelevante
        const cleanText = text
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s+/g, ' ')
            // Remover encabezados municipales repetitivos
            .replace(/C\/\s*La\s+Fuente,?\s*2\s*[–\-]\s*06830\s+LA\s+ZARZA[^\.]*\.?/gi, '')
            .replace(/Telf\.?\s*924366001[^\.]*\.?/gi, '')
            .replace(/Web:\s*www\.lazarza\.net[^\.]*\.?/gi, '')
            .replace(/E-mail:\s*registro@lazarza\.es[^\.]*\.?/gi, '')
            // Remover fechas y tipos de sesión (ya están en el nombre del archivo)
            .replace(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g, '')
            .replace(/sesión\s+(?:ordinaria|extraordinaria)/gi, '')
            .replace(/asistentes?\s*:?[^\.]{0,200}\.?/gi, '')
            .trim();
        
        // Buscar elementos clave de actas municipales
        const patterns = {
            acuerdos: /(?:se\s+(?:aprueba|adopta|acuerda)|acuerdo|decisión|resolución)\s*:?\s*([^\.]{20,200}\.)/gi,
            presupuestos: /(?:presupuesto|importe|cantidad|euros?|€)\s*[^\.]{0,100}(?:\d+[.,]\d+|\d+)\s*(?:euros?|€)?[^\.]{0,50}\./gi
        };
        
        let summary = '';
        let usedText = new Set();
        
        // Extraer acuerdos principales
        const acuerdosMatches = Array.from(cleanText.matchAll(patterns.acuerdos));
        if (acuerdosMatches.length > 0) {
            const acuerdo = acuerdosMatches[0][1].trim();
            if (!usedText.has(acuerdo.toLowerCase()) && acuerdo.length > 20) {
                summary += `Acuerdo: ${acuerdo} `;
                usedText.add(acuerdo.toLowerCase());
            }
        }
        
        // Extraer información de presupuestos
        const presupuestoMatches = Array.from(cleanText.matchAll(patterns.presupuestos));
        if (presupuestoMatches.length > 0) {
            const presupuesto = presupuestoMatches[0][0].trim();
            if (!usedText.has(presupuesto.toLowerCase())) {
                summary += `${presupuesto} `;
                usedText.add(presupuesto.toLowerCase());
            }
        }
        
        // Si no se encontró información estructurada, usar los primeros párrafos relevantes
        if (summary.length < 50) {
            const paragraphs = cleanText.split(/\.\s+/).filter(p => 
                p.length > 30 && 
                !p.toLowerCase().includes('asistente') &&
                !p.toLowerCase().includes('presente') &&
                !p.toLowerCase().includes('alcalde') &&
                !p.toLowerCase().includes('secretari')
            );
            
            if (paragraphs.length > 0) {
                summary = paragraphs[0].substring(0, maxLength - 3) + '...';
            } else {
                summary = cleanText.substring(0, maxLength - 3) + '...';
            }
        }
        
        // Truncar al límite máximo
        if (summary.length > maxLength) {
            const lastPeriod = summary.lastIndexOf('.', maxLength);
            if (lastPeriod > maxLength * 0.7) {
                summary = summary.substring(0, lastPeriod + 1);
            } else {
                summary = summary.substring(0, maxLength - 3) + '...';
            }
        }
        
        return summary.trim();
    },
    
    // Validar si PDF.js está cargado
    isPdfJsLoaded() {
        return typeof pdfjsLib !== 'undefined';
    },
    
    // Configurar PDF.js worker
    configurePdfJs() {
        if (this.isPdfJsLoaded()) {
            // Usar CDN para el worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            return true;
        }
        return false;
    }
};
