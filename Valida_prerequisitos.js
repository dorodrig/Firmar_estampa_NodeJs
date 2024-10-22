const { exec } = require('child_process');
const color = require('colors');

// Función para verificar si Java está instalado y obtener su versión
function checkJavaInstallation() {
    exec('java -version', (error, stdout, stderr) => {
        if (error) {
            console.log("No se ha encontrado una instalación de JAVA".red);
            console.log("Por favor asegúrese de contar con una instalación de JAVA".red);
        } else {
            // El comando 'java -version' normalmente escribe en stderr, así que usamos stderr para la versión
            const versionOutput = stderr.split('\n')[0]; // Tomamos la primera línea
            const version = versionOutput.match(/"(.*?)"/)[1]; // Extraemos la versión entre comillas
            console.log("Se ha encontrado una instalación de JAVA".green);
            console.log(`Versión: ${version}`.green);
        }
    });
}

// Ejecución de la función
checkJavaInstallation();
