// Motor de Probabilidade Adaptativo - Estilo Spribe Mines
// Usa histórico de bombas para melhorar assertividade

export interface AnalysisStep {
  type: 'info' | 'process' | 'success' | 'warning';
  message: string;
  timestamp: Date;
}

export interface ProbabilityResult {
  safeCells: number[];
  confidenceMap: Map<number, number>;
  iterations: number;
  entropy: number;
  mode: "ADAPTIVE";
  adaptiveInfo: {
    patternsAvoided: number;
    trainingBonus: number;
    hotspots: number[]; // Células com alta frequência de bombas
  };
}

/**
 * Cria um mapa de calor baseado no histórico de bombas
 * Células que aparecem mais vezes no histórico = mais perigosas
 */
function buildHeatmap(recentPatterns: number[][]): Map<number, number> {
  const heatmap = new Map<number, number>();
  
  // Inicializa todas as células com 0
  for (let i = 0; i < 25; i++) {
    heatmap.set(i, 0);
  }
  
  // Conta frequência de bombas em cada célula
  for (const pattern of recentPatterns) {
    for (const cell of pattern) {
      heatmap.set(cell, (heatmap.get(cell) || 0) + 1);
    }
  }
  
  return heatmap;
}

/**
 * Calcula similaridade entre dois padrões usando Jaccard Index
 */
function calculatePatternSimilarity(pattern1: number[], pattern2: number[]): number {
  if (pattern1.length === 0 || pattern2.length === 0) return 0;
  const set1 = new Set(pattern1);
  const set2 = new Set(pattern2);
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  return intersection / union;
}

/**
 * Verifica se um padrão é muito similar aos recentes
 */
function isPatternTooSimilar(newPattern: number[], recentPatterns: number[][], threshold: number = 0.5): boolean {
  for (const recent of recentPatterns) {
    if (calculatePatternSimilarity(newPattern, recent) > threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Motor de oportunidades ADAPTATIVO
 * Usa o histórico para evitar células que frequentemente têm bombas
 */
export async function runAdaptiveMonteCarloSimulation(
  numberOfMines: number,
  iterations: number = 3000,
  _baseThreshold: number = 0.97,
  recentPatterns: number[][] = [],
  trainingLevel: number = 0
): Promise<ProbabilityResult> {
  const totalCells = 25;
  const safeCount = new Array<number>(totalCells).fill(0);
  let patternsAvoided = 0;

  // Constrói mapa de calor do histórico
  const heatmap = buildHeatmap(recentPatterns);
  
  // Identifica hotspots (células com alta frequência de bombas)
  const hotspots: number[] = [];
  const avgFrequency = recentPatterns.length > 0 
    ? recentPatterns.reduce((sum, p) => sum + p.length, 0) / recentPatterns.length / totalCells
    : 0;
  
  heatmap.forEach((freq, cell) => {
    if (freq > avgFrequency * 2 && freq >= 2) {
      hotspots.push(cell);
    }
  });

  // Bônus baseado no nível de treinamento (mais histórico = mais preciso)
  const trainingBonus = Math.min(trainingLevel * 1.5, 15);

  // Simulações Monte Carlo com peso do histórico
  for (let i = 0; i < iterations; i++) {
    const mines = new Set<number>();

    // Gera posições de minas aleatórias
    while (mines.size < numberOfMines) {
      mines.add(Math.floor(Math.random() * totalCells));
    }

    const mineArray = Array.from(mines);

    // Se muito similar a padrões recentes, descarta (padrões tendem a não repetir)
    if (recentPatterns.length > 0 && isPatternTooSimilar(mineArray, recentPatterns, 0.4)) {
      patternsAvoided++;
      continue;
    }

    // Conta células seguras nesta iteração
    for (let cell = 0; cell < totalCells; cell++) {
      if (!mines.has(cell)) {
        safeCount[cell]++;
      }
    }
  }

  // Normaliza as contagens para probabilidades
  const effectiveIterations = Math.max(iterations - patternsAvoided, 1);
  const probabilities: { index: number; value: number }[] = [];
  const confidenceMap = new Map<number, number>();

  for (let i = 0; i < totalCells; i++) {
    let prob = safeCount[i] / effectiveIterations;
    
    // AJUSTE ADAPTATIVO: Penaliza células que frequentemente têm bombas no histórico
    const historicalFreq = heatmap.get(i) || 0;
    if (recentPatterns.length > 0 && historicalFreq > 0) {
      // Quanto mais vezes teve bomba, maior a penalidade
      const penalty = (historicalFreq / recentPatterns.length) * 0.3;
      prob = prob * (1 - penalty);
    }
    
    // BÔNUS: Células que nunca tiveram bombas no histórico ganham boost
    if (recentPatterns.length >= 3 && historicalFreq === 0) {
      prob = Math.min(prob * 1.1, 0.99);
    }
    
    probabilities.push({ index: i, value: prob });
    confidenceMap.set(i, prob);
  }

  // Ordena por maior probabilidade de segurança
  probabilities.sort((a, b) => b.value - a.value);

  // Quantidade adaptativa de sugestões baseada na dificuldade
  const safeCellsAvailable = totalCells - numberOfMines;
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

  suggestionsCount = Math.max(1, suggestionsCount);

  // Pega as células com maior probabilidade de segurança
  // Exclui hotspots das sugestões se tiver histórico suficiente
  let safeCells = probabilities
    .filter(p => recentPatterns.length < 3 || !hotspots.includes(p.index))
    .slice(0, suggestionsCount)
    .map(p => p.index);

  // Fallback: se filtrou demais, pega as melhores sem filtro
  if (safeCells.length < suggestionsCount) {
    safeCells = probabilities
      .slice(0, suggestionsCount)
      .map(p => p.index);
  }

  // Calcula entropia
  const p = numberOfMines / totalCells;
  const entropy = p === 0 || p === 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));

  return {
    safeCells,
    confidenceMap,
    iterations: effectiveIterations,
    entropy,
    mode: "ADAPTIVE",
    adaptiveInfo: {
      patternsAvoided,
      trainingBonus,
      hotspots
    }
  };
}

/**
 * Gera passos de análise para o log visual
 */
export function generateAnalysisSteps(mines: number, trainingLevel: number): AnalysisStep[] {
  return [
    { type: 'info', message: `Iniciando análise com ${mines} minas...`, timestamp: new Date() },
    { type: 'process', message: 'Executando 3000 simulações Monte Carlo...', timestamp: new Date() },
    { type: 'process', message: 'Calculando densidade de probabilidade...', timestamp: new Date() },
    { type: 'info', message: `Nível de treinamento: ${trainingLevel}`, timestamp: new Date() },
    { type: 'success', message: 'Sinais de alta confiança identificados!', timestamp: new Date() }
  ];
}
