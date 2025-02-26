SELECT DISTINCT logradouro
FROM `geo`.`ciata_lotes`
order by logradouro;

CREATE TABLE retangopolis AS
SELECT * FROM ciata_lotes 
WHERE logradouro IN('SAO PAULO',
'AMAZONAS',
'PERNAMBUCO',
'MINAS GERAIS',
'ESPÍRITO SANTO',
'SERGIPE',
'ALAGOAS',
'CEARÁ'
);

-- Eliminando o termo "SETOR " de infComplementar 
UPDATE retangopolis
SET	infComplementar = right(infComplementar, 4)
WHERE cadastro <> "";

-- Criando o atributo idFace composto pela concatenação de infComplementar(setor), quadra e logradouro
ALTER TABLE retangopolis
ADD COLUMN idFace VARCHAR(100);
UPDATE retangopolis
SET	idFace = concat(infComplementar, ".", quadra, ".", logradouro)
WHERE cadastro <> "";

-- Criando a classe "Face" e seus atributos
CREATE TABLE faces (
	idFace VARCHAR(100) PRIMARY KEY,
    nrOrdemFace INT
);
INSERT INTO faces (idFace)
	SELECT DISTINCT idFace FROM retangopolis;
SELECT * FROM faces;
 
SELECT * FROM retangopolis;

SELECT DISTINCT quadra, logradouro FROM retangopolis order by quadra;

-- Criando a classe retangopolis_quadras para armazenar as quadras
CREATE TABLE `retangopolis_quadras` (
  `idQuadra` varchar(5) NOT NULL,
  `qtLogradouros` int DEFAULT NULL,
  `nmLogradouros` varchar(1024) DEFAULT NULL,
  UNIQUE KEY `idlocationsQuadra_UNIQUE` (`idQuadra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
SELECT * FROM retangopolis_quadras;

-- Executar o script javascript

SELECT * FROM geo.retangolandia_quadras
WHERE qtLogradouros = 4;

SELECT DISTINCT logradouro FROM retangolandia ORDER BY logradouro;

CREATE TABLE quadras_retangolandia AS
SELECT 
	quadra as idQuadra, 
    COUNT(*) as qtLogradouros, 
    JSON_ARRAYAGG(logradouro) AS nmLogradouros
FROM (
	SELECT DISTINCT 
		quadra, 
        logradouro 
	FROM geo.retangolandia
	) AS LOGR
GROUP BY quadra;

-- Cria a tabela quadras_retangolandia com o id da quadra e os logradouros que a compõe 
DROP TABLE quadras_retangolandia;
SELECT * FROM quadras_retangolandia ORDER BY qtLogradouros DESC;




