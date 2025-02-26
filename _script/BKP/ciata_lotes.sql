USE geo;
Create table ciata_lotes (
	cadastro VARCHAR(10) PRIMARY KEY,
	logradouro VARCHAR(100),
	numero int,
    bairro VARCHAR(100),
    infComplementar VARCHAR(100),
    quadra VARCHAR(10),
    lote VARCHAR(10),
    area FLOAT,
    testada FLOAT
);
