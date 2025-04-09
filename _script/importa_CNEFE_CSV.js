// Abrir arquivo CSV
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // npm install csv-parser

const directoryPath = './dados';

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Erro ao ler diretório:', err);
        return;
    }
    
    const csvFiles = files.filter(file => path.extname(file) === '.csv');
    
    csvFiles.forEach(file => {
        const results = [];
        fs.createReadStream(path.join(directoryPath, file))
            .pipe(csv({
                separator: ';'  // Define o ponto e vírgula como delimitador
            }))
            .on('data', (data) => {
                console.log(data.COD_UNICO_ENDERECO);
                results.push(data);
            })
            .on('end', () => {
                console.log(`Dados do arquivo ${file}:`, results[300]);
                // Processar os dados do CSV aqui
            });
    });
});