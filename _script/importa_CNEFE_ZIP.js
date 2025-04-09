const yauzl = require('yauzl');
const fs = require('fs');
const csv = require('fast-csv');
const path = require('path');

const pastaTrabalho = './dados';
const pastaProcessados = './dados/processados'

function streamCSVFromZip(zipFilePath) {
    return new Promise((resolve, reject) => {
        const results = [];

        yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
            if (err) return reject(err);

            zipfile.readEntry();

            zipfile.on('entry', (entry) => {
                if (!/\.csv$/i.test(entry.fileName)) {
                    zipfile.readEntry();
                    return;
                }

                zipfile.openReadStream(entry, (err, readStream) => {
                    if (err) return reject(err);

                    readStream
                        .pipe(csv.parse({ headers: true, delimiter: ';' }))
                        .on('data', (data) => {
                            console.log(data.COD_UNICO_ENDERECO);
                            results.push(data);
                        })
                        .on('end', () => {
                            zipfile.readEntry();
                        })
                        .on('error', reject);
                });
            });

            zipfile.on('end', () => resolve(results));

            zipfile.on('error', reject);
        });
    });
}

async function ProcessaMoveArquivo(zipFilePath, destinationFolder) {
    try {
        // 1. Processar o arquivo ZIP (usando um dos métodos anteriores)
        const data = await streamCSVFromZip(zipFilePath);

        // 2. Criar pasta de destino se não existir
        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder, { recursive: true });
        }

        // 3. Mover o arquivo ZIP processado
        const fileName = path.basename(zipFilePath);
        const destinationPath = path.join(destinationFolder, fileName);

        fs.renameSync(zipFilePath, destinationPath);

        console.log(`Arquivo movido para: ${destinationPath}`);
        return { data, movedTo: destinationPath };
    } catch (error) {
        console.error('Erro ao mover arquivo:', error);
        throw error;
    }
}

function leArquivosZip() {
    fs.readdir(pastaTrabalho, (err, files) => {
        if (err) {
            console.error('Erro ao ler diretório:', err);
            return;
        }

        const zipFiles = files.filter(file => path.extname(file) === '.zip');

        zipFiles.forEach(file => {
            console.log(file);
            ProcessaMoveArquivo(path.join(pastaTrabalho, file), pastaProcessados)
                .then(result => console.log('Processamento completo:', result))
                .catch(err => console.error(err))
                .then(data => {
                    console.log('Dados:', data)
                })
                .catch(err => console.error(err));
        });
    });
}

// Uso
leArquivosZip();