(async () => {
    const PDFMerger = (await import('pdf-merger-js')).default;
    const path = require('path');
    const fs = require('fs');

    // Función para combinar PDFs
    async function combinarPDFs(directorioTemporalFirmas, archivoSalida) {
        const merger = new PDFMerger();

        // Leer todos los archivos PDF en la carpeta "firma_temp"
        const archivosPDF = fs.readdirSync(directorioTemporalFirmas)
            .filter(file => file.endsWith('.pdf'))
            .map(file => path.join(directorioTemporalFirmas, file));

        if (archivosPDF.length === 0) {
            console.error('No se encontraron archivos PDF para combinar.');
            return;
        }

        // Añadir cada PDF al merger
        for (const archivoPDF of archivosPDF) {
            await merger.add(archivoPDF);
        }

        // Guardar el PDF combinado
        await merger.save(archivoSalida);
        console.log(`PDFs combinados correctamente en: ${archivoSalida}`);
    }

    // Ejemplo de uso
    let ruta = 'C:/Users/DavidOrlandoRodrigue/Desktop/pdf_firmar/firmado/Carpeta 01';
    const directorioTemporalFirmas = path.join(ruta); // Directorio donde están los PDFs firmados
    //const directorioTemporalFirmas = path.join(__dirname, 'firma_temp'); // Directorio donde están los PDFs firmados
    const archivoSalida = path.join(__dirname, 'pdf_combinado_final.pdf'); // Ruta del archivo final combinado

    combinarPDFs(directorioTemporalFirmas, archivoSalida)
        .then(() => console.log('PDFs combinados con éxito.'))
        .catch(err => console.error('Error al combinar PDFs:', err));
})();
