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
        
        // Limpiar texto de saltos de línea múltiples y espacios extras
        const cleanText = text
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Si el texto es corto, devolverlo completo
        if (cleanText.length <= maxLength) {
            return cleanText;
        }
        
        // Buscar el final de una oración cerca del límite
        let summary = cleanText.substring(0, maxLength);
        const lastPeriod = summary.lastIndexOf('.');
        const lastComma = summary.lastIndexOf(',');
        
        // Cortar en el punto más cercano (. o ,)
        const cutPoint = Math.max(lastPeriod, lastComma);
        if (cutPoint > maxLength * 0.8) {
            summary = summary.substring(0, cutPoint + 1);
        } else {
            summary += '...';
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
