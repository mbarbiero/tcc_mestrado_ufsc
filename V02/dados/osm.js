const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Importação da configuração global e da fábrica do banco de dados
const config = require('./sc_config');
const criarDbExecutor = require('./db_executor');
// Funções utilitárias
const Util = require('./util');
const { stringify } = require('querystring');

class OSM {
    constructor() {
        this.servidores = [
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter"
        ];
        this.servidorAtual = this.servidores[0];

        // Inicializa os métodos encapsulados e isolados para esta instância da classe
        this.db = criarDbExecutor();
    }

    rotacionarServidor() {
        this.servidorAtual = this.servidorAtual === this.servidores[0] ? this.servidores[1] : this.servidores[0];
        console.warn(`[OSM] Alterando servidor para contingência: ${this.servidorAtual}`);
    }

    async executarQuery(query) {
        const params = new URLSearchParams();
        params.append('data', query.trim());

        try {
            const response = await axios.post(this.servidorAtual, params, {
                timeout: 120000,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'SuperCIATA/2.0'
                }
            });
            return response.data;
        } catch (erro) {
            // Rastreia erros específicos HTTP do servidor Overpass (Ex: 504 Gateway Timeout, 429 Too Many Requests)
            if (erro.response) {
                throw new Error(`[Fase: Consulta OSM] Servidor Overpass devolvió código HTTP ${erro.response.status}: ${erro.response.statusText}`);
            } else if (erro.request) {
                // Erro de timeout ou falta de resposta de rede
                throw new Error(`[Fase: Consulta OSM] El servidor Overpass no respondió a la solicitud (Timeout).`);
            } else {
                throw new Error(`[Fase: Consulta OSM] Error al configurar la petición: ${erro.message}`);
            }
        }
    }

    /**
     * Obtém os caminhos viários utilizando um filtro de raio dinâmico a partir do centróide.
     */
    async obterLogradouros(municipio, latitude, longitude, raioKm = 5) {
        if (!latitude || !longitude) {
            throw new Error("[OSM] Coordenadas de latitude e longitude inválidas para a busca geoespacial.");
        }

        // Converte o valor dinâmico em quilômetros recebido do front para metros
        const raioMetros = raioKm * 1000;

        let overpassQuery = `[out:json][timeout:1200];\n`;

        overpassQuery += `
        (
            way["highway"]["name"](around:${raioMetros}, ${latitude}, ${longitude});
        );
        out geom;
        `;

        return await this.executarQuery(overpassQuery);
    }

    /**
    * Compila os elementos do OSM estruturando a geometria WKT linear e acoplando a chave SC_ID_MUNICIPIO
    */
    compilarLogradourosParaSQL(dadosBrutos) {
        if (!dadosBrutos || !dadosBrutos.elements) return [];

        const pais = dadosBrutos.pais || 'Brasil';
        const estado = dadosBrutos.estado || '';
        const municipio = dadosBrutos.municipio || '';
        const scIdMunicipio = dadosBrutos.sc_id_municipio || '';
        const osm_id_municipio = dadosBrutos.osm_id_municipio;

        // Função interna rápida para realizar escape de strings e evitar quebras no SQL
        const esc = (str) => str ? str.replace(/'/g, "''") : '';

        return dadosBrutos.elements
            .filter(el => el.type === 'way' && el.geometry && el.geometry.length >= 2)
            .map(via => {
                // Montagem da String WKT (Padrão GIS: Longitude antes de Latitude)
                const coordenadasWKT = via.geometry.map(pt => `${pt.lon} ${pt.lat}`).join(', ');
                const wktLineString = `LINESTRING(${coordenadasWKT})`;

                const nomeOriginal = via.tags?.name || '';
                const nomeNormalizado = Util.NormalizaString(nomeOriginal);
                const tipoVia = via.tags?.highway || '';

                // Escapes específicos para a concatenação segura dentro da fórmula do CRC32
                const mIdEscaped = esc(scIdMunicipio);
                const nNormEscaped = esc(nomeNormalizado);

                // Fórmula SQL nativa injetada dinamicamente para computar o Hash composto
                const formulaScIdLogradouro = `LPAD(HEX(CRC32(CONCAT('${mIdEscaped}', '${nNormEscaped}'))), 8, '0')`;

                return `
                INSERT INTO superciata.OSM_LOGRADOUROS (
                    municipio, estado, pais, OSM_ID_MUNICIPIO, way_id, nome_via, 
                    nome_via_normalizado, tipo_via, geometria, 
                    SC_ID_MUNICIPIO, SC_ID_LOGRADOURO
                ) VALUES (
                    '${esc(municipio)}', 
                    ${estado ? `'${esc(estado)}'` : 'NULL'}, 
                    '${esc(pais)}', 
                    ${osm_id_municipio},
                    ${via.id}, 
                    ${nomeOriginal ? `'${esc(nomeOriginal)}'` : 'NULL'}, 
                    ${nomeNormalizado ? `'${esc(nomeNormalizado)}'` : 'NULL'}, 
                    ${tipoVia ? `'${esc(tipoVia)}'` : 'NULL'}, 
                    ST_GeomFromText('${wktLineString}', 4326), 
                    '${mIdEscaped}',
                    ${formulaScIdLogradouro}
                ) ON DUPLICATE KEY UPDATE 
                    nome_via = VALUES(nome_via), 
                    nome_via_normalizado = VALUES(nome_via_normalizado), 
                    tipo_via = VALUES(tipo_via), 
                    geometria = VALUES(geometria), 
                    SC_ID_MUNICIPIO = VALUES(SC_ID_MUNICIPIO),
                    SC_ID_LOGRADOURO = VALUES(SC_ID_LOGRADOURO);
            `.trim().replace(/\s+/g, ' ');
            });
    }

    /**
     * Grava os dados puros recebidos em um arquivo físico no tempDir
     */
    async gravarArquivoLocal(municipio, dados) {
        try {
            const fsPromises = fs.promises;
            const nomeLimpo = municipio.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const diretorio = config.paths.tempDir;

            await fsPromises.mkdir(diretorio, { recursive: true });

            const caminhoCompleto = path.join(diretorio, `vias_${nomeLimpo}.json`);
            await fsPromises.writeFile(caminhoCompleto, JSON.stringify(dados, null, 2));
            console.log(`[MotorOSM] Dados persistidos localmente em tempDir: vias_${nomeLimpo}.json`);
        } catch (err) {
            console.error(`[MotorOSM] Erro ao gravar arquivo JSON no tempDir:`, err.message);
        }
    }

    async processarEGravarLogradouros(dadosBrutos) {
        let tempSqlPath = null;
        try {
            console.log(`[SuperCIATA] Sincronizando malha urbana para: ${dadosBrutos.municipio}`);

            // Validar se o JSON bruto vindo do OSM é válido e possui elementos antes de avançar
            if (!dadosBrutos || typeof dadosBrutos !== 'object') {
                throw new Error("[Fase: Validación JSON] El formato de los datos crudos devueltos por OSM es inválido.");
            }

            try {
                await this.gravarArquivoLocal(dadosBrutos.municipio, dadosBrutos);
            } catch (errFile) {
                console.warn("⚠️ Não foi possível gravar o log local, prosseguindo com a carga...", errFile.message);
            }

            // PASSO 1: Inicialização da tabela estrutural
            const sqlPath = path.join(__dirname, 'sql', 'CREATE_TABLE_osm_logradouros.sql');
            let resultadoEstrutura;
            try {
                resultadoEstrutura = await this.db.executa_arquivo_sql(sqlPath);
            } catch (errDb) {
                throw new Error(`[Fase: Infraestructura DB] Erro ao validar tabela osm_logradouros: ${errDb.message}`);
            }

            if (!resultadoEstrutura || !resultadoEstrutura.sucesso) {
                throw new Error("[Fase: Infraestructura DB] Falló la ejecución del archivo estructural SQL.");
            }

            // PASSO 2: Mapeamento e Compilação das Geometrias
            let viasProcessadas = [];
            try {
                viasProcessadas = this.compilarLogradourosParaSQL(dadosBrutos);
            } catch (errComp) {
                throw new Error(`[Fase: Compilación Geométrica] Error al compilar objetos geográficos a WKT: ${errComp.message}`);
            }

            if (viasProcessadas.length === 0) {
                return { sucesso: true, mensagem: "No se encontraron vías válidas para procesar dentro del radio.", registros: 0 };
            }

            // PASSO 3: Gravação do arquivo físico em lote e despacho para o dbExecutor
            const hashArquivo = dadosBrutos.municipio.toLowerCase().replace(/[^a-z0-9]/g, '_');
            tempSqlPath = path.join(config.paths.tempDir, `temp_carga_vias_${hashArquivo}.sql`);

            try {
                fs.writeFileSync(tempSqlPath, viasProcessadas.join('\n'), 'utf8');
            } catch (errFs) {
                throw new Error(`[Fase: Sistema de Archivos] No se pudo escribir el lote SQL temporal: ${errFs.message}`);
            }

            let resultadoCarga;
            try {
                resultadoCarga = await this.db.executa_arquivo_sql(tempSqlPath);
            } catch (errCarga) {
                throw new Error(`[Fase: Carga de Datos] Error crítico al persistir el lote en la base de datos: ${errCarga.message}`);
            }

            if (fs.existsSync(tempSqlPath)) fs.unlinkSync(tempSqlPath);

            if (!resultadoCarga || !resultadoCarga.sucesso) {
                throw new Error("[Fase: Carga de Datos] El ejecutor de la base de datos reportó un fallo interno durante la inserción masiva.");
            }

            return {
                sucesso: true,
                registros_sincronizados: viasProcessadas.length,
                detalhes_execucao: resultadoCarga.detalhes
            };

        } catch (erro) {
            console.error("[SuperCIATA] Erro no pipeline do módulo OSM:", erro.message);
            if (tempSqlPath && fs.existsSync(tempSqlPath)) {
                try { fs.unlinkSync(tempSqlPath); } catch (e) { }
            }
            throw erro; // Repassa o erro com a identificação da fase correta
        }
    }
}

module.exports = OSM;