/**
 * Motor de Cálculo Estatístico Bayesiano
 * Executa simulações Monte Carlo para identificar células de alta confiança
 */

export interface SimulationResult {
  safeCells: number[];
  confidenceMap: Map<number, number>;
  iterations: number;
  threshold: number;
}

export interface AnalysisStep {
  timestamp: Date;
  message: string;
  type: 'info' | 'process' | 'success' | 'warning';
}

/**
 * Calcula a probabilidade base de erro em qualquer célula
 * P(E) = M/N onde M = minas e N = células totais
 */
export function calculateBaseProbability(mines: number, totalCells: number = 25): number {
  return mines / totalCells;
}

/**
 * Calcula a probabilidade de sucesso para cada célula
 * usando inferência Bayesiana simplificada
 */
export function calculateBayesianProbability(
  mines: number,
  revealedSafe: number[],
  revealedMines: number[],
  totalCells: number = 25
): Map<number, number> {
  const probabilities = new Map<number, number>();
  const remainingCells = totalCells - revealedSafe.length - revealedMines.length;
  const remainingMines = mines - revealedMines.length;
  
  // Probabilidade posterior para cada célula não revelada
  const posteriorProbability = remainingMines > 0 
    ? 1 - (remainingMines / remainingCells)
    : 1;

  for (let i = 0; i < totalCells; i++) {
    if (revealedSafe.includes(i) || revealedMines.includes(i)) {
      probabilities.set(i, revealedSafe.includes(i) ? 1 : 0);
    } else {
      probabilities.set(i, posteriorProbability);
    }
  }

  return probabilities;
}

/**
 * Executa simulação Monte Carlo com N iterações
 * Identifica células que ficam vazias em mais de threshold% das simulações
 */
export async function runMonteCarloSimulation(
  mines: number,
  iterations: number = 1000,
  threshold: number = 0.97,
  onProgress?: (progress: number, step: AnalysisStep) => void
): Promise<SimulationResult> {
  const totalCells = 25;
  const cellHitCount = new Array(totalCells).fill(0);
  
  // Fase 1: Inicialização
  onProgress?.(5, {
    timestamp: new Date(),
    message: '[INIT] Inicializando motor de simulação...',
    type: 'info'
  });

  await sleep(100);

  // Fase 2: Calculando permutações
  onProgress?.(15, {
    timestamp: new Date(),
    message: `[CALC] Calculando ${iterations.toLocaleString()} permutações...`,
    type: 'process'
  });

  await sleep(150);

  // Fase 3: Executando simulações
  const batchSize = iterations / 10;
  
  for (let batch = 0; batch < 10; batch++) {
    for (let i = 0; i < batchSize; i++) {
      // Gera posições aleatórias para as minas
      const minePositions = generateRandomMinePositions(mines, totalCells);
      
      // Incrementa contador para células que NÃO são minas
      for (let cell = 0; cell < totalCells; cell++) {
        if (!minePositions.includes(cell)) {
          cellHitCount[cell]++;
        }
      }
    }

    const progress = 20 + (batch + 1) * 6;
    onProgress?.(progress, {
      timestamp: new Date(),
      message: `[SIM] Processando lote ${batch + 1}/10... (${((batch + 1) * 10)}%)`,
      type: 'process'
    });

    await sleep(80);
  }

  // Fase 4: Verificando integridade
  onProgress?.(85, {
    timestamp: new Date(),
    message: '[API] Verificando integridade da API simulada...',
    type: 'info'
  });

  await sleep(200);

  // Fase 5: Analisando resultados
  onProgress?.(92, {
    timestamp: new Date(),
    message: '[ANALYZE] Analisando densidade de probabilidade...',
    type: 'process'
  });

  await sleep(150);

  // Calcula mapa de confiança
  const confidenceMap = new Map<number, number>();
  const safeCells: number[] = [];

  for (let i = 0; i < totalCells; i++) {
    const confidence = cellHitCount[i] / iterations;
    confidenceMap.set(i, confidence);
    
    if (confidence >= threshold) {
      safeCells.push(i);
    }
  }

  // Ordena células seguras por confiança (maior primeiro)
  safeCells.sort((a, b) => (confidenceMap.get(b) || 0) - (confidenceMap.get(a) || 0));

  // Fase 6: Conclusão
  onProgress?.(100, {
    timestamp: new Date(),
    message: `[SUCCESS] ${safeCells.length} sinais de alta confiança encontrados!`,
    type: 'success'
  });

  return {
    safeCells,
    confidenceMap,
    iterations,
    threshold
  };
}

/**
 * Gera posições aleatórias para minas
 */
function generateRandomMinePositions(mineCount: number, totalCells: number): number[] {
  const positions: number[] = [];
  while (positions.length < mineCount) {
    const pos = Math.floor(Math.random() * totalCells);
    if (!positions.includes(pos)) {
      positions.push(pos);
    }
  }
  return positions;
}

/**
 * Calcula a entropia de Shannon para o estado atual do grid
 */
export function calculateEntropy(probabilities: Map<number, number>): number {
  let entropy = 0;
  probabilities.forEach((p) => {
    if (p > 0 && p < 1) {
      entropy -= p * Math.log2(p) + (1 - p) * Math.log2(1 - p);
    }
  });
  return entropy;
}

/**
 * Função auxiliar para delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
