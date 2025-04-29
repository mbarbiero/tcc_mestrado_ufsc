const yauzl = require('yauzl');
const fs = require('fs');
const csv = require('fast-csv');
const path = require('path');
const mysql = require('mysql2/promise');
const { Console } = require('console');

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
                        .on('data', async (data) => {
                            const query = await RetSqlCnefe(data);
                            await inserirPontos(query);
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

        zipFiles.forEach(async (file) => {
            console.log(file);
            await ProcessaMoveArquivo(path.join(pastaTrabalho, file), pastaProcessados)
                .then(result => console.log('Processamento completo:', result))
                .catch(err => console.error(err))
        });
    });
}

async function RetSqlCnefe(dados) {
    var sql = `INSERT INTO cnefe (
        COD_UNICO_ENDERECO,
        COD_UF,
        COD_MUNICIPIO,
        COD_DISTRITO,
        COD_SUBDISTRITO,
        COD_SETOR,
        NUM_QUADRA,
        NUM_FACE,
        TIPO_LOGRADOURO,
        NOM_LOGRADOURO,
        NUM_ENDERECO,
        NOM_COMPLEMENTO,
        CEP,
        LATITUDE,
        LONGITUDE,
        COORD
    ) VALUES (
        '${dados.COD_UNICO_ENDERECO}',      -- COD_UNICO_ENDERECO
        '${dados.COD_UF}',                  -- COD_UF
        '${dados.COD_MUNICIPIO}',           -- COD_MUNICIPIO
        '${dados.COD_DISTRITO}',            -- COD_DISTRITO
        '${dados.COD_SUBDISTRITO}',         -- COD_SUBDISTRITO
        '${dados.COD_SETOR}',               -- COD_SETOR 
        '${dados.COD_SETOR + dados.NUM_QUADRA}',              -- NUM_QUADRA 
        '${dados.NUM_FACE}',                -- NUM_FACE 
        '${dados.NOM_TIPO_SEGLOGR}',         -- TIPO_LOGRADOURO 
        '${dados.NOM_TITULO_SEGLOGR + " " + dados.NOM_SEGLOGR}',     -- NOM_LOGRADOURO 
        '${dados.NUM_ENDERECO + dados.DSC_MODIFICADOR}',            -- NUM_ENDERECO 
        '${dados.NOM_COMP_ELEM1 + " " + dados.VAL_COMP_ELEM1 + " " + dados.NOM_COMP_ELEM2 + " " + dados.VAL_COMP_ELEM2}',       -- NOM_COMPLEMENTO 
        '${dados.CEP}',         -- CEP 
        ${dados.LATITUDE},      -- LATITUDE 
        ${dados.LONGITUDE},     -- LONGITUDE 
        ST_GeomFromText('POINT(${dados.LATITUDE} ${dados.LONGITUDE})', 4326)
    );`;
    console.log(sql);
    return (sql);
}

// Query com múltiplos valores em uma única execução
async function inserirPontos(query) {
    console.log(query);

    const connection = await pool.getConnection();

    try {
        // Executa a query com todos os registros
        const [result] = await connection.query(query);
        console.log(`${result.affectedRows} registros inseridos!`);

    } catch (err) {
        console.error("Erro na inserção:", err);
    } finally {
        connection.release(); // Libera a conexão de volta para o pool
    }
}

// Uso
// Configuração da conexão
const pool = mysql.createPool({
    host: 'mysql.smuu.com.br',
    user: 'smuu_add1',
    password: 'SmuuBd1',
    database: 'smuu',
    port: 3306
});
/*
const pool = mysql.createPool({
    host: 'localhost',
    user: 'ciata',
    password: 'ciata',
    database: 'ciata_cnefe',
    waitForConnections: true,
    connectionLimit: 10
});
*/
leArquivosZip();

