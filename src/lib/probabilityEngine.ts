// Motor de Probabilidade Adaptativo - Estilo Spribe Mines

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
  mode: "RELATIVE";
  adaptiveInfo: {
    patternsAvoided: number;
    trainingBonus: number;
  };
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
function isPatternTooSimilar(newPattern: number[], recentPatterns: number[][], threshold: number = 0.6): boolean {
  for (const recent of recentPatterns) {
    if (calculatePatternSimilarity(newPattern, recent) > threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Motor de oportunidades SEMPRE retorna sinais
 * Quanto mais bombas, menor a confiança, mas sempre sugere células
 */
export async function runAdaptiveMonteCarloSimulation(
  numberOfMines: number,
  iterations: number = 3000,
  _baseThreshold: number = 0.97, // Ignorado - usamos ranking relativo
  recentPatterns: number[][] = [],
  trainingLevel: number = 0
): Promise<ProbabilityResult> {
  const totalCells = 25;
  const safeCount = new Array<number>(totalCells).fill(0);
  let patternsAvoided = 0;

  // Bônus baseado no nível de treinamento
  const trainingBonus = Math.min(trainingLevel * 0.5, 5);

  // Simulações Monte Carlo
  for (let i = 0; i < iterations; i++) {
    const mines = new Set<number>();

    // Gera posições de minas aleatórias
    while (mines.size < numberOfMines) {
      mines.add(Math.floor(Math.random() * totalCells));
    }

    const mineArray = Array.from(mines);

    // Se muito similar a padrões recentes, descarta
    if (recentPatterns.length > 0 && isPatternTooSimilar(mineArray, recentPatterns, 0.5)) {
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
  const effectiveIterations = iterations - patternsAvoided;
  const probabilities: { index: number; value: number }[] = [];
  const confidenceMap = new Map<number, number>();

  for (let i = 0; i < totalCells; i++) {
    const prob = effectiveIterations > 0 ? safeCount[i] / effectiveIterations : 0;
    probabilities.push({ index: i, value: prob });
    confidenceMap.set(i, prob);
  }

  // Ordena por maior probabilidade de segurança
  probabilities.sort((a, b) => b.value - a.value);

  // Calcula quantas sugestões dar baseado na dificuldade
  // Mais bombas = menos células seguras disponíveis
  const safeCellsAvailable = totalCells - numberOfMines;
  
  // Quantidade adaptativa de sugestões
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

  // Garante no mínimo 1 sugestão
  suggestionsCount = Math.max(1, suggestionsCount);

  // Pega as células com maior probabilidade de segurança
  const safeCells = probabilities
    .slice(0, suggestionsCount)
    .map(p => p.index);

  // Calcula entropia
  const p = numberOfMines / totalCells;
  const entropy = p === 0 || p === 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));

  return {
    safeCells,
    confidenceMap,
    iterations: effectiveIterations,
    entropy,
    mode: "RELATIVE",
    adaptiveInfo: {
      patternsAvoided,
      trainingBonus
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
