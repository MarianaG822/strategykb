// probabilityEngine.ts

export interface ProbabilityResult {
  safeCells: number[]
  confidenceMap: Map<number, number>
  iterations: number
  threshold: number
}

/**
 * Calcula um threshold dinâmico de segurança
 * Quanto mais minas, menor o threshold aceitável
 */
function calculateThreshold(mines: number): number {
  if (mines <= 2) return 0.9
  if (mines <= 4) return 0.8
  if (mines <= 6) return 0.65
  if (mines <= 8) return 0.55
  return 0.45
}

/**
 * Motor principal de cálculo de oportunidades
 */
export function generateOpportunities(
  totalCells: number,
  numberOfMines: number,
  iterations: number = 5000
): ProbabilityResult {
  const hitCount = new Array<number>(totalCells).fill(0)

  // Simulações
  for (let i = 0; i < iterations; i++) {
    const mines = new Set<number>()

    while (mines.size < numberOfMines) {
      mines.add(Math.floor(Math.random() * totalCells))
    }

    for (let cell = 0; cell < totalCells; cell++) {
      if (!mines.has(cell)) {
        hitCount[cell]++
      }
    }
  }

  // Mapa de probabilidades
  const confidenceMap = new Map<number, number>()
  const probabilities: { index: number; value: number }[] = []

  for (let i = 0; i < totalCells; i++) {
    const probability = hitCount[i] / iterations
    confidenceMap.set(i, probability)
    probabilities.push({ index: i, value: probability })
  }

  // Ordena do mais seguro para o menos seguro
  probabilities.sort((a, b) => b.value - a.value)

  // Threshold dinâmico
  const threshold = calculateThreshold(numberOfMines)

  // Células consideradas seguras
  let safeCells = probabilities
    .filter(p => p.value >= threshold)
    .map(p => p.index)

  /**
   * Fallback inteligente:
   * Se nenhuma célula passar no threshold,
   * pega as 3 melhores disponíveis
   */
  if (safeCells.length === 0) {
    safeCells = probabilities.slice(0, 3).map(p => p.index)
  }

  return {
    safeCells,
    confidenceMap,
    iterations,
    threshold
  }
}
