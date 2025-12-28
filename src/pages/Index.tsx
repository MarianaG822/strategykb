import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTrainingHistory } from "@/hooks/useTrainingHistory";
import { 
  runAdaptiveMonteCarloSimulation, 
  calculateBaseProbability, 
  calculateEntropy 
} from "@/utils/probabilityEngine";

// Componentes da UI (Assumindo que existem no seu projeto Lovable)
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { toast } = useToast();
  const { 
    addEntry, 
    getRecentPatterns, 
    trainingLevel, 
    totalEntries 
  } = useTrainingHistory();

  const [mines, setMines] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [lastBombPositions, setLastBombPositions] = useState<number[]>([]);

  // Função para processar o final da rodada e aprender com as bombas
  const handleEndOfRound = (positions: number[]) => {
    addEntry(positions, mines);
    setLastBombPositions(positions);
    toast({
      title: "Padrão Registrado",
      description: "O algoritmo aprendeu com as últimas bombas para melhorar a precisão.",
    });
  };

  const executeSimulation = async () => {
    setIsSimulating(true);
    try {
      // Obtém padrões recentes do histórico para a simulação adaptativa
      const recentPatterns = getRecentPatterns(5);
      
      const simulation = await runAdaptiveMonteCarloSimulation(
        mines,
        1000,
        0.97,
        recentPatterns,
        trainingLevel
      );

      setResults(simulation);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na simulação",
        description: "Não foi possível calcular as probabilidades.",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6 bg-card text-card-foreground">
        <h1 className="text-2xl font-bold mb-4">Analisador Monte Carlo Adaptativo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">Configurações</h2>
            <div className="flex flex-col gap-4">
              <label>Número de Minas: {mines}</label>
              <input 
                type="range" 
                min="1" 
                max="24" 
                value={mines} 
                onChange={(e) => setMines(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Nível de Treinamento: {trainingLevel} ({totalEntries} rodadas)
              </p>
              <Button 
                onClick={executeSimulation} 
                disabled={isSimulating}
              >
                {isSimulating ? "Simulando..." : "Calcular Próxima Rodada"}
              </Button>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Probabilidades</h2>
            {results ? (
              <div className="space-y-2">
                <p>Células Seguras: {results.safeCells.slice(0, 3).join(", ")}</p>
                <p>Bônus de Precisão: +{results.adaptiveInfo.trainingBonus.toFixed(2)}%</p>
                <p>Padrões Evitados: {results.adaptiveInfo.patternsAvoided}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Inicie a simulação para ver os resultados.</p>
            )}
          </section>
        </div>
      </Card>
    </div>
  );
};

export default Index;
ems-center justify-center gap-4 text-[10px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-green-500" />
              ADAPTIVE_ENGINE: ACTIVE
            </span>
            <span>|</span>
            <span>MONTE_CARLO: 1000 ITER</span>
            <span>|</span>
            <span>TRAINING_LVL: {trainingLevel}</span>
            <span>|</span>
            <span className="text-cyan-400">PATTERNS: {totalEntries}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Left Panel - Config & Training */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <ConfigPanel
              mines={mines}
              stars={stars}
              onMinesChange={setMines}
              onStarsChange={setStars}
            />

            <TrainingPanel
              trainingLevel={trainingLevel}
              trainingProgress={trainingProgress}
              totalEntries={totalEntries}
              isMarkingMode={isMarkingMode}
              markedMines={markedMines}
              expectedMines={mines}
              onToggleMarkingMode={handleToggleMarkingMode}
              onConfirmMarks={handleConfirmMarks}
              onClearHistory={handleClearHistory}
            />

            <div className="flex flex-col gap-2">
              <Button
                onClick={analyzePattern}
                disabled={isScanning || isMarkingMode}
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-5 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all font-mono text-sm tracking-wider disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <span className="animate-pulse">ANALYZING...</span>
                    <span className="ml-2">{scanProgress}%</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    ANALISAR_OPORTUNIDADE
                  </>
                )}
              </Button>

              <Button
                onClick={resetGame}
                variant="outline"
                disabled={isMarkingMode}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white font-mono text-xs tracking-wider"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                RESET_MATRIX
              </Button>
            </div>
          </motion.div>

          {/* Center - Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-3"
          >
            {/* Marking mode indicator */}
            <AnimatePresence>
              {isMarkingMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-2 bg-yellow-900/50 rounded-lg border border-yellow-500/50 text-center"
                >
                  <p className="text-xs text-yellow-400 font-mono">
                    🎯 MODO DE MARCAÇÃO ATIVO - Clique onde as bombas estavam
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <MinesGrid
              grid={grid}
              onCellClick={handleCellClick}
              suggestedCells={suggestedCells}
              confidenceMap={confidenceMap}
              isScanning={isScanning}
              scanIndex={scanIndex}
              isMarkingMode={isMarkingMode}
              markedMines={markedMines}
            />

            <AnimatePresence>
              {suggestedCells.length > 0 && !isScanning && !isMarkingMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-green-900/30 rounded-lg border border-green-500/30 text-center"
                >
                  <p className="text-sm text-green-400 font-mono">
                    <span className="text-green-300">✓</span> {suggestedCells.length} SINAIS DE ALTA CONFIANÇA IDENTIFICADOS
                  </p>
                  <p className="text-[10px] text-green-500/70 mt-1">
                    Clique nas células marcadas para revelar
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <StatsPanel
              baseProbability={baseProbability}
              entropy={entropy}
              iterations={1000}
              threshold={0.97}
            />

            <PerformanceDashboard
              totalGames={totalGames}
              wins={wins}
              currentStreak={currentStreak}
            />
          </motion.div>

          {/* Right Panel - Operation Log */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="h-[500px] lg:h-auto"
          >
            <OperationLog logs={operationLogs} isActive={isScanning} />
          </motion.div>
        </div>

        {/* Footer disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center p-3 bg-slate-900/30 rounded-lg border border-slate-700/30"
        >
          <p className="text-[10px] text-slate-500 font-mono">
            <span className="text-cyan-500">[DISCLAIMER]</span> Simulador educacional de probabilidade com aprendizado adaptativo. 
            Dados persistidos localmente via localStorage.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
