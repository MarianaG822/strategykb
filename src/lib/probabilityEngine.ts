// probabilityEngine.ts

export interface ProbabilityResult {
  safeCells: number[]
  confidenceMap: Map<number, number>
  iterations: number
  entropy: number
  mode: "ABSOLUTE" | "RELATIVE"
}

/**
 * Calcula entropia simples do cenário
 * Quanto mais minas, maior a incerteza
 */
function calculateEntropy(mines: number, totalCells: number): number {
  const p = mines / totalCells
  if (p === 0 || p === 1) return 0
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p))
}

/**
 * Motor de oportunidades baseado em RANKING RELATIVO
 * Nunca retorna vazio
 */
export function generateOpportunities(
  totalCells: number,
  numberOfMines: number,
  iterations: number = 3000
): ProbabilityResult {
  const safeCount = new Array<number>(totalCells).fill(0)

  // Simulações Monte Carlo
  for (let i = 0; i < iterations; i++) {
    const mines = new Set<number>()

    while (mines.size < numberOfMines) {
      mines.add(Math.floor(Math.random() * totalCells))
    }

    for (let cell = 0; cell < totalCells; cell++) {
      if (!mines.has(cell)) {
        safeCount[cell]++
      }
    }
  }

  // Probabilidades absolutas
  const probabilities: { index: number; value: number }[] = []
  const confidenceMap = new Map<number, number>()

  for (let i = 0; i < totalCells; i++) {
    const prob = safeCount[i] / iterations
    probabilities.push({ index: i, value: prob })
    confidenceMap.set(i, prob)
  }

  // Ordena por menor risco relativo
  probabilities.sort((a, b) => b.value - a.value)

  /**
   * Quantidade adaptativa de oportunidades:
   * - poucos riscos → mais sugestões
   * - muitos riscos → menos sugestões
   */
  let suggestionsCount = Math.floor(totalCells * 0.12)

  if (numberOfMines >= totalCells * 0.7) suggestionsCount = 1
  else if (numberOfMines >= totalCells * 0.5) suggestionsCount = 2
  else if (numberOfMines >= totalCells * 0.3) suggestionsCount = 3

  suggestionsCount = Math.max(1, suggestionsCount)

  const safeCells = probabilities
    .slice(0, suggestionsCount)
    .map(p => p.index)

  const entropy = calculateEntropy(numberOfMines, totalCells)

  return {
    safeCells,
    confidenceMap,
    iterations,
    entropy,
    mode: "RELATIVE"
  }
}
