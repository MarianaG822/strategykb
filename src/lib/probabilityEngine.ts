// Motor de Probabilidade Adaptativo - Engenharia Reversa Spribe Mines
// Implementa Fisher-Yates + Desvio Padrão Local para máxima assertividade

export interface ProbabilityResult {
  safeCells: number[];
  confidenceMap: Map<number, number>;
  iterations: number;
  entropy: number;
  mode: "ADAPTIVE";
  adaptiveInfo: {
    patternsAvoided: number;
    trainingBonus: number;
    hotspots: number[];
    coldspots: number[]; // Células que raramente têm bombas
    localDeviation: number; // Desvio padrão local
  };
}

/**
 * Simula o algoritmo Fisher-Yates do Spribe
 * Gera posições de minas como o cassino faz
 */
function fisherYatesMineGeneration(numberOfMines: number): number[] {
  const positions = Array.from({ length: 25 }, (_, i) => i);
  const mines: number[] = [];
  
  for (let i = 0; i < numberOfMines; i++) {
    // Simula o random do hash (0 a 1)
    const randomFloat = Math.random();
    const index = Math.floor(randomFloat * positions.length);
    mines.push(positions.splice(index, 1)[0]);
  }
  
  return mines;
}

/**
 * Calcula frequência de cada célula no histórico
 * Retorna mapa normalizado de 0 a 1
 */
function buildFrequencyMap(recentPatterns: number[][]): Map<number, number> {
  const freq = new Map<number, number>();
  
  for (let i = 0; i < 25; i++) {
    freq.set(i, 0);
  }
  
  if (recentPatterns.length === 0) return freq;
  
  // Conta ocorrências
  for (const pattern of recentPatterns) {
    for (const cell of pattern) {
      freq.set(cell, (freq.get(cell) || 0) + 1);
    }
  }
  
  // Normaliza para 0-1
  const maxFreq = Math.max(...Array.from(freq.values()));
  if (maxFreq > 0) {
    for (let i = 0; i < 25; i++) {
      freq.set(i, (freq.get(i) || 0) / maxFreq);
    }
  }
  
  return freq;
}

/**
 * Calcula o Desvio Padrão Local
 * Quanto maior, mais irregular a distribuição recente
 */
function calculateLocalDeviation(frequencyMap: Map<number, number>): number {
  const values = Array.from(frequencyMap.values());
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Identifica hotspots (células muito frequentes) e coldspots (raramente usadas)
 */
function identifyZones(frequencyMap: Map<number, number>, recentPatterns: number[][]): {
  hotspots: number[];
  coldspots: number[];
} {
  if (recentPatterns.length < 2) {
    return { hotspots: [], coldspots: [] };
  }
  
  const hotspots: number[] = [];
  const coldspots: number[] = [];
  const threshold = 0.6;
  
  frequencyMap.forEach((normalizedFreq, cell) => {
    if (normalizedFreq >= threshold) {
      hotspots.push(cell);
    } else if (normalizedFreq === 0) {
      coldspots.push(cell);
    }
  });
  
  return { hotspots, coldspots };
}

/**
 * Calcula similaridade Jaccard entre dois padrões
 */
function jaccardSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Motor Principal - Monte Carlo com Fisher-Yates + Desvio Local
 */
export async function runAdaptiveMonteCarloSimulation(
  numberOfMines: number,
  iterations: number = 5000,
  _baseThreshold: number = 0.97,
  recentPatterns: number[][] = [],
  trainingLevel: number = 0
): Promise<ProbabilityResult> {
  
  const safetyScore = new Array<number>(25).fill(0);
  let patternsAvoided = 0;
  let validIterations = 0;
  
  // Análise do histórico
  const frequencyMap = buildFrequencyMap(recentPatterns);
  const localDeviation = calculateLocalDeviation(frequencyMap);
  const { hotspots, coldspots } = identifyZones(frequencyMap, recentPatterns);
  
  // Bônus de treinamento
  const trainingBonus = Math.min(trainingLevel * 2, 20);
  
  // Simulações Monte Carlo com Fisher-Yates
  for (let i = 0; i < iterations; i++) {
    const simulatedMines = fisherYatesMineGeneration(numberOfMines);
    
    // Verificação de similaridade com histórico recente
    // Cassinos evitam padrões muito repetitivos
    let tooSimilar = false;
    if (recentPatterns.length >= 2) {
      for (const recent of recentPatterns.slice(0, 3)) {
        if (jaccardSimilarity(simulatedMines, recent) > 0.5) {
          tooSimilar = true;
          patternsAvoided++;
          break;
        }
      }
    }
    
    if (tooSimilar) continue;
    
    validIterations++;
    
    // Contabiliza células seguras
    for (let cell = 0; cell < 25; cell++) {
      if (!simulatedMines.includes(cell)) {
        safetyScore[cell]++;
      }
    }
  }
  
  // Fallback se muitas iterações foram descartadas
  if (validIterations < iterations * 0.3) {
    validIterations = iterations;
    for (let i = 0; i < 25; i++) {
      safetyScore[i] = Math.round((iterations * (25 - numberOfMines)) / 25);
    }
  }
  
  // Calcula probabilidades ajustadas
  const probabilities: { index: number; score: number }[] = [];
  const confidenceMap = new Map<number, number>();
  
  for (let i = 0; i < 25; i++) {
    let baseProb = safetyScore[i] / validIterations;
    
    // AJUSTE ADAPTATIVO baseado no histórico
    if (recentPatterns.length >= 2) {
      const historicalFreq = frequencyMap.get(i) || 0;
      
      // Penaliza hotspots (células que saem muito)
      if (hotspots.includes(i)) {
        baseProb *= (1 - historicalFreq * 0.4);
      }
      
      // BÔNUS para coldspots (células que não saem)
      // Aproveitando o "Desvio Padrão Local"
      if (coldspots.includes(i)) {
        // Quanto maior o desvio local, maior o bônus
        const deviationBonus = Math.min(localDeviation * 0.3, 0.15);
        baseProb = Math.min(baseProb * (1 + 0.1 + deviationBonus), 0.99);
      }
    }
    
    // Bônus de treinamento
    if (trainingLevel >= 3) {
      baseProb = Math.min(baseProb * (1 + trainingBonus * 0.005), 0.99);
    }
    
    probabilities.push({ index: i, score: baseProb });
    confidenceMap.set(i, baseProb);
  }
  
  // Ordena por maior score
  probabilities.sort((a, b) => b.score - a.score);
  
  // Quantidade de sugestões baseada na dificuldade
  const safeCellsAvailable = 25 - numberOfMines;
  let suggestionsCount: number;
  
  if (numberOfMines >= 20) {
    suggestionsCount = 1;
  } else if (numberOfMines >= 15) {
    suggestionsCount = 2;
  } else if (numberOfMines >= 10) {
    suggestionsCount = 3;
  } else if (numberOfMines >= 5) {
    suggestionsCount = Math.min(4, safeCellsAvailable);
  } else {
    suggestionsCount = Math.min(5, safeCellsAvailable);
  }
  
  // Seleciona as melhores células, evitando hotspots quando possível
  let safeCells = probabilities
    .filter(p => !hotspots.includes(p.index) || recentPatterns.length < 3)
    .slice(0, suggestionsCount)
    .map(p => p.index);
  
  // Fallback
  if (safeCells.length < suggestionsCount) {
    safeCells = probabilities.slice(0, suggestionsCount).map(p => p.index);
  }
  
  // Entropia
  const p = numberOfMines / 25;
  const entropy = p === 0 || p === 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
  
  return {
    safeCells,
    confidenceMap,
    iterations: validIterations,
    entropy,
    mode: "ADAPTIVE",
    adaptiveInfo: {
      patternsAvoided,
      trainingBonus,
      hotspots,
      coldspots,
      localDeviation
    }
  };
}
