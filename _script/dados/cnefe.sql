-- Create table CNEFE
CREATE TABLE CNEFE (
  COD_UNICO_ENDERECO VARCHAR(10),
  COD_MUNICIPIO VARCHAR(7),
  COD_DISTRITO VARCHAR(9),
  COD_SUBDISTRITO VARCHAR(11),
  COD_SETOR VARCHAR(16),
  NUM_QUADRA VARCHAR(18),
  NUM_FACE VARCHAR(2),
  TIPO_LOGRADOURO VARCHAR(20),
  NOM_LOGRADOURO VARCHAR(100),
  NUM_ENDERECO VARCHAR(10),
  NOM_COMPLEMENTO VARCHAR(20),
  CEP VARCHAR(9),
  LATITUDE REAL,
  LONGITUDE REAL,
  COORD POINT NOT NULL SRID 4326,
  CONSTRAINT pk_CNEFE PRIMARY KEY (COD_UNICO_ENDERECO)
);
/

-- Create the spatial index on geom column of CNEFE
ALTER TABLE CNEFE ADD SPATIAL INDEX(COORD); 