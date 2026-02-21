// app-quadrilateros.js
const fs = require('fs');
const readline = require('readline');
const path = require('path');

class Point {
  constructor(lng, lat) {
    this.lng = parseFloat(lng);
    this.lat = parseFloat(lat);
  }

  toString() {
    return `${this.lng} ${this.lat}`;
  }

  equals(other, tolerance = 0.0000001) {
    return Math.abs(this.lng - other.lng) < tolerance && 
           Math.abs(this.lat - other.lat) < tolerance;
  }

  distanceTo(other) {
    const dx = this.lng - other.lng;
    const dy = this.lat - other.lat;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

function parsePolygon(wkt) {
  // Remove "MULTIPOLYGON(" ou "POLYGON(" do início e ")" do final
  let content = wkt.replace(/^(MULTIPOLYGON\(|POLYGON\()/, '').replace(/\)$/, '');
  
  // Se for MULTIPOLYGON com um único polígono, extrai o conteúdo
  if (content.startsWith('(')) {
    content = content.substring(1, content.length - 1);
  }
  
  const rings = [];
  let depth = 0;
  let start = 0;
  
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '(') {
      depth++;
      if (depth === 1) start = i;
    } else if (content[i] === ')') {
      depth--;
      if (depth === 0) {
        const ringStr = content.substring(start + 1, i);
        const points = parsePoints(ringStr);
        rings.push(points);
      }
    }
  }
  
  // Se não encontrou parênteses aninhados, é um polígono simples
  if (rings.length === 0) {
    const points = parsePoints(content);
    if (points.length > 0) {
      rings.push(points);
    }
  }
  
  return rings;
}

function parsePoints(ringStr) {
  const points = [];
  const coords = ringStr.split(',').map(c => c.trim());
  
  for (const coord of coords) {
    const [lng, lat] = coord.split(' ').map(Number);
    if (!isNaN(lng) && !isNaN(lat)) {
      points.push(new Point(lng, lat));
    }
  }
  
  return points;
}

function removeDuplicates(points) {
  const unique = [];
  for (const point of points) {
    const exists = unique.some(p => p.equals(point));
    if (!exists) {
      unique.push(point);
    }
  }
  return unique;
}

function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.lng - p2.lng, y: p1.lat - p2.lat };
  const v2 = { x: p3.lng - p2.lng, y: p3.lat - p2.lat };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  const cos = dot / (mag1 * mag2);
  const clampedCos = Math.max(-1, Math.min(1, cos));
  const angleRad = Math.acos(clampedCos);
  const angleDeg = angleRad * (180 / Math.PI);
  
  return angleDeg;
}

function isAngleNear90(angle, tolerance = 20) {
  return Math.abs(angle - 90) <= tolerance;
}

function isQuadrilateral(points) {
  // Remove pontos duplicados (incluindo o último que repete o primeiro)
  const uniquePoints = removeDuplicates(points.slice(0, -1));
  
  // Um quadrilátero deve ter 4 vértices distintos
  return uniquePoints.length === 4;
}

function getQuadrilateralAngles(points) {
  const uniquePoints = removeDuplicates(points.slice(0, -1));
  
  if (uniquePoints.length !== 4) return [];
  
  const angles = [];
  for (let i = 0; i < 4; i++) {
    const p1 = uniquePoints[i];
    const p2 = uniquePoints[(i + 1) % 4];
    const p3 = uniquePoints[(i + 2) % 4];
    
    const angle = calculateAngle(p1, p2, p3);
    angles.push(angle);
  }
  
  return angles;
}

function checkRightAngles(angles, tolerance = 20) {
  if (angles.length !== 4) return false;
  
  // Todos os ângulos devem estar próximos de 90°
  return angles.every(angle => isAngleNear90(angle, tolerance));
}

function simplifyToQuadrilateral(points) {
  // Remove duplicatas
  let uniquePoints = removeDuplicates(points.slice(0, -1));
  
  console.log(`  Pontos únicos: ${uniquePoints.length}`);
  
  if (uniquePoints.length === 4) {
    // Já é um quadrilátero, só precisa fechar
    return [...uniquePoints, uniquePoints[0]];
  }
  
  if (uniquePoints.length < 4) {
    // Menos de 4 pontos, não é um polígono válido
    console.log(`  AVISO: Menos de 4 vértices (${uniquePoints.length})`);
    return points; // Retorna original
  }
  
  // Mais de 4 pontos - precisa simplificar para 4
  // Estratégia: encontrar os 4 pontos mais distantes (cantos aproximados)
  
  // Calcular centroide
  let sumLng = 0, sumLat = 0;
  for (const p of uniquePoints) {
    sumLng += p.lng;
    sumLat += p.lat;
  }
  const center = new Point(sumLng / uniquePoints.length, sumLat / uniquePoints.length);
  
  // Calcular ângulo polar de cada ponto em relação ao centro
  const pointsWithAngle = uniquePoints.map(p => {
    const angle = Math.atan2(p.lat - center.lat, p.lng - center.lng) * 180 / Math.PI;
    return { point: p, angle: (angle + 360) % 360 };
  });
  
  // Ordenar por ângulo
  pointsWithAngle.sort((a, b) => a.angle - b.angle);
  
  // Agrupar pontos próximos em ângulo
  const groups = [];
  const angleThreshold = 30; // graus
  
  for (const item of pointsWithAngle) {
    if (groups.length === 0) {
      groups.push([item]);
    } else {
      const lastGroup = groups[groups.length - 1];
      const lastAngle = lastGroup[lastGroup.length - 1].angle;
      
      if (item.angle - lastAngle < angleThreshold) {
        lastGroup.push(item);
      } else {
        groups.push([item]);
      }
    }
  }
  
  // Mesclar primeiro e último grupo se necessário
  if (groups.length > 1) {
    const firstGroup = groups[0];
    const lastGroup = groups[groups.length - 1];
    
    if (360 - lastGroup[lastGroup.length - 1].angle + firstGroup[0].angle < angleThreshold) {
      groups[0] = [...lastGroup, ...firstGroup];
      groups.pop();
    }
  }
  
  console.log(`  Grupos de ângulos: ${groups.length}`);
  
  if (groups.length === 4) {
    // Já temos 4 grupos - pegar o ponto mais distante do centro em cada grupo
    const corners = groups.map(group => {
      let farthest = group[0];
      let maxDist = group[0].point.distanceTo(center);
      
      for (let i = 1; i < group.length; i++) {
        const dist = group[i].point.distanceTo(center);
        if (dist > maxDist) {
          maxDist = dist;
          farthest = group[i];
        }
      }
      
      return farthest.point;
    });
    
    // Ordenar os cantos em sentido horário
    const cornersWithAngle = corners.map(p => {
      const angle = Math.atan2(p.lat - center.lat, p.lng - center.lng) * 180 / Math.PI;
      return { point: p, angle: (angle + 360) % 360 };
    });
    cornersWithAngle.sort((a, b) => a.angle - b.angle);
    
    return [...cornersWithAngle.map(item => item.point), cornersWithAngle[0].point];
  }
  
  if (groups.length < 4) {
    // Menos de 4 grupos - precisamos dividir
    console.log(`  Menos de 4 grupos (${groups.length}), forçando 4 cantos`);
    
    // Pegar os pontos mais distantes do centro
    const pointsWithDist = uniquePoints.map(p => ({
      point: p,
      dist: p.distanceTo(center)
    }));
    
    pointsWithDist.sort((a, b) => b.dist - a.dist);
    
    const corners = pointsWithDist.slice(0, 4).map(item => item.point);
    
    // Ordenar os cantos em sentido horário
    const cornersWithAngle = corners.map(p => {
      const angle = Math.atan2(p.lat - center.lat, p.lng - center.lng) * 180 / Math.PI;
      return { point: p, angle: (angle + 360) % 360 };
    });
    cornersWithAngle.sort((a, b) => a.angle - b.angle);
    
    return [...cornersWithAngle.map(item => item.point), cornersWithAngle[0].point];
  }
  
  // groups.length > 4 - precisamos selecionar 4 grupos
  console.log(`  Mais de 4 grupos (${groups.length}), selecionando os mais significativos`);
  
  // Calcular "força" de cada grupo (soma das distâncias)
  const groupStrength = groups.map(group => {
    const sumDist = group.reduce((sum, item) => sum + item.point.distanceTo(center), 0);
    return { group, strength: sumDist };
  });
  
  groupStrength.sort((a, b) => b.strength - a.strength);
  
  const selectedGroups = groupStrength.slice(0, 4).map(item => item.group);
  
  // Pegar o ponto mais distante de cada grupo selecionado
  const corners = selectedGroups.map(group => {
    let farthest = group[0];
    let maxDist = group[0].point.distanceTo(center);
    
    for (let i = 1; i < group.length; i++) {
      const dist = group[i].point.distanceTo(center);
      if (dist > maxDist) {
        maxDist = dist;
        farthest = group[i];
      }
    }
    
    return farthest.point;
  });
  
  // Ordenar os cantos em sentido horário
  const cornersWithAngle = corners.map(p => {
    const angle = Math.atan2(p.lat - center.lat, p.lng - center.lng) * 180 / Math.PI;
    return { point: p, angle: (angle + 360) % 360 };
  });
  cornersWithAngle.sort((a, b) => a.angle - b.angle);
  
  return [...cornersWithAngle.map(item => item.point), cornersWithAngle[0].point];
}

function processPolygon(points) {
  console.log(`\n  Processando polígono com ${points.length} pontos`);
  
  // Verificar se é quadrilátero
  const isQuad = isQuadrilateral(points);
  
  if (isQuad) {
    const angles = getQuadrilateralAngles(points);
    console.log(`  É quadrilátero com ângulos: ${angles.map(a => Math.round(a)).join(', ')}°`);
    
    const hasRightAngles = checkRightAngles(angles, 20);
    
    if (hasRightAngles) {
      console.log('  ✓ Quadrilátero com ângulos retos (aprox. 90°) - mantido');
      // Já é um quadrilátero com ângulos retos, só garantir que está fechado
      const uniquePoints = removeDuplicates(points.slice(0, -1));
      return [...uniquePoints, uniquePoints[0]];
    } else {
      console.log('  ✗ Quadrilátero mas ângulos não são retos');
      // Mesmo assim, mantém como quadrilátero
      const uniquePoints = removeDuplicates(points.slice(0, -1));
      return [...uniquePoints, uniquePoints[0]];
    }
  } else {
    console.log('  Não é quadrilátero, simplificando...');
    const simplified = simplifyToQuadrilateral(points);
    console.log(`  Simplificado para ${simplified.length} pontos`);
    
    // Verificar ângulos do resultado
    if (simplified.length >= 4) {
      const angles = getQuadrilateralAngles(simplified);
      if (angles.length === 4) {
        console.log(`  Ângulos resultantes: ${angles.map(a => Math.round(a)).join(', ')}°`);
      }
    }
    
    return simplified;
  }
}

function pointsToWKT(points) {
  if (points.length === 0) return '';
  const coords = points.map(p => `${p.lng} ${p.lat}`).join(', ');
  return `(${coords})`;
}

function polygonToWKT(rings) {
  if (rings.length === 0) return 'POLYGON EMPTY';
  
  const ringsStr = rings.map(ring => pointsToWKT(ring)).join(', ');
  return `POLYGON(${ringsStr})`;
}

function processRow(columns) {
  const [id, codigo_ibge, codigo_cartografico, geometria] = columns;
  
  try {
    console.log(`\n=== Quadra ${id} (${codigo_cartografico}) ===`);
    
    // Parsear geometria
    const rings = parsePolygon(geometria);
    console.log(`Anéis encontrados: ${rings.length}`);
    
    const simplifiedRings = [];
    
    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      console.log(`\nAnel ${i + 1}:`);
      
      const simplifiedRing = processPolygon(ring);
      simplifiedRings.push(simplifiedRing);
    }
    
    // Gerar nova geometria WKT
    const newGeometria = polygonToWKT(simplifiedRings);
    
    return [id, codigo_ibge, codigo_cartografico, newGeometria];
    
  } catch (error) {
    console.error(`ERRO ao processar geometria para quadra ${id}:`, error.message);
    return [id, codigo_ibge, codigo_cartografico, geometria];
  }
}

async function main() {
  const inputFile = process.argv[2] || 'Quadras - Capanema.csv';
  const outputFile = process.argv[3] || 'Quadras - Capanema - quadrilateros.csv';
  
  const inputPath = path.resolve(inputFile);
  const outputPath = path.resolve(outputFile);
  
  console.log('='.repeat(60));
  console.log('SIMPLIFICADOR DE QUADRAS - POLÍGONOS PARA QUADRILÁTEROS');
  console.log('='.repeat(60));
  console.log(`Arquivo de entrada: ${inputPath}`);
  console.log(`Arquivo de saída: ${outputPath}`);
  console.log('='.repeat(60));
  
  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath),
    crlfDelay: Infinity
  });
  
  const outputStream = fs.createWriteStream(outputPath);
  let isFirstLine = true;
  let lineCount = 0;
  let processedCount = 0;
  let quadrilaterosCount = 0;
  let rightAnglesCount = 0;
  
  outputStream.write('quadras.id,quadras.codigo_ibge_municipio,quadras.codigo_cartografico,quadras.geometria\n');
  
  for await (const line of rl) {
    lineCount++;
    
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    
    if (line.trim() === '') continue;
    
    // Parse CSV
    const columns = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(col => {
      if (col.startsWith('"') && col.endsWith('"')) {
        return col.slice(1, -1);
      }
      return col;
    }) || [];
    
    if (columns.length >= 4) {
      const processed = processRow(columns);
      
      // Estatísticas
      processedCount++;
      const rings = parsePolygon(columns[3]);
      for (const ring of rings) {
        if (isQuadrilateral(ring)) {
          quadrilaterosCount++;
          const angles = getQuadrilateralAngles(ring);
          if (checkRightAngles(angles, 20)) {
            rightAnglesCount++;
          }
        }
      }
      
      outputStream.write(processed.map(col => {
        if (col.includes(',')) {
          return `"${col}"`;
        }
        return col;
      }).join(',') + '\n');
      
      if (processedCount % 10 === 0) {
        console.log(`\n--- Processadas ${processedCount} quadras ---`);
      }
    }
  }
  
  outputStream.end();
  
  console.log('\n' + '='.repeat(60));
  console.log('PROCESSAMENTO CONCLUÍDO');
  console.log('='.repeat(60));
  console.log(`Total de linhas lidas: ${lineCount - 1}`);
  console.log(`Total de quadras processadas: ${processedCount}`);
  console.log(`Quadriláteros identificados: ${quadrilaterosCount}`);
  console.log(`Com ângulos aproximadamente retos: ${rightAnglesCount}`);
  console.log(`Taxa de quadriláteros: ${(quadrilaterosCount/processedCount*100).toFixed(1)}%`);
  console.log(`Taxa de ângulos retos: ${(rightAnglesCount/quadrilaterosCount*100).toFixed(1)}%`);
  console.log('='.repeat(60));
  console.log(`Arquivo de saída: ${outputPath}`);
}

main().catch(console.error);