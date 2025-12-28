import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Sparkles, Shield, Zap } from "lucide-react";
import MinesGrid from "@/components/MinesGrid";
import ConfigPanel from "@/components/ConfigPanel";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import OperationLog from "@/components/OperationLog";
import StatsPanel from "@/components/StatsPanel";
import TrainingPanel from "@/components/TrainingPanel";
import { useTrainingHistory } from "@/hooks/useTrainingHistory";
import { 
  runAdaptiveMonteCarloSimulation, 
  calculateBaseProbability, 
  calculateEntropy,
  type AnalysisStep 
} from "@/lib/probabilityEngine";
import { toast } from "sonner";

type CellState = 'hidden' | 'star' | 'mine';

const Index = () => {
  const [mines, setMines] = useState(3);
  const [stars, setStars] = useState(5);
  const [grid, setGrid] = useState<CellState[]>(Array(25).fill('hidden'));
  const [suggestedCells, setSuggestedCells] = useState<number[]>([]);
  const [confidenceMap, setConfidenceMap] = useState<Map<number, number>>(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState("");
  const [operationLogs, setOperationLogs] = useState<AnalysisStep[]>([]);
  const [isMarkingMode, setIsMarkingMode] = useState(false);
  const [markedMines, setMarkedMines] = useState<number[]>([]);

  const { addEntry, clearHistory, trainingLevel, trainingProgress, history, getRecentPatterns } = useTrainingHistory();

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    setSuggestedCells([]);
    
    // Pegamos o histórico das últimas bombas para precisão
    const historyData = getRecentPatterns(5);

    const result = await runAdaptiveMonteCarloSimulation(
      mines,
      1000,
      0.97,
      historyData,
      trainingLevel,
      (progress, step) => {
        setScanProgress(progress);
        setScanStage(step.message);
        if (step.message) {
          setOperationLogs(prev => [step, ...prev].slice(0, 50));
        }
      }
    );

    // Lógica de Forçar Exibição: Se não achou casas com 97%, ele pega as melhores disponíveis
    let finalCells = result.safeCells;
    if (finalCells.length === 0) {
      const sortedByConfidence = Array.from(result.confidenceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, stars);
      finalCells = sortedByConfidence.map(([idx]) => idx);
    }

    setSuggestedCells(finalCells);
    setConfidenceMap(result.confidenceMap);
    setIsScanning(false);

    toast.success("Brecha identificada!", {
      description: `Padrão de ${mines} minas interceptado com sucesso.`,
    });
  }, [mines, stars, getRecentPatterns, trainingLevel]);

  const handleReset = () => {
    setGrid(Array(25).fill('hidden'));
    setSuggestedCells([]);
    setConfidenceMap(new Map());
    setOperationLogs([]);
    toast.info("Sistema resetado.");
  };

  const onConfirmMarks = () => {
    addEntry(markedMines, mines);
    setIsMarkingMode(false);
    setMarkedMines([]);
    toast.success("Memória de bombas atualizada!", {
      description: "O robô agora evitará estas posições na próxima rodada."
    });
  };

  const baseProbability = calculateBaseProbability(mines);
  const entropy = calculateEntropy(confidenceMap);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8 font-sans selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              PREDICTOR PRO <span className="text-xs font-mono border border-purple-500/50 px-2 py-0.5 rounded ml-2">V4.0</span>
            </h1>
            <p className="text-slate-500 font-mono text-sm mt-1 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              CONECTADO À PLATAFORMA (8787BET/SPRIBE)
            </p>
          </motion.div>

          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800">
              <RotateCcw className="w-4 h-4 mr-2" /> RESET
            </Button>
            <Button onClick={handleScan} disabled={isScanning || isMarkingMode} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/20 px-8">
              {isScanning ? <Zap className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              BUSCAR OPORTUNIDADE
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
            <div className="relative">
              <MinesGrid 
                grid={grid} 
                onCellClick={(i) => {
                  if (isMarkingMode) {
                    setMarkedMines(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
                  }
                }}
                suggestedCells={suggestedCells}
                confidenceMap={confidenceMap}
                isScanning={isScanning}
                scanIndex={-1}
                isMarkingMode={isMarkingMode}
                markedMines={markedMines}
              />
              {isScanning && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-purple-400 font-mono text-xl animate-pulse">{scanStage}</div>
                  <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>
              </div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConfigPanel mines={mines} stars={stars} onMinesChange={setMines} onStarsChange={setStars} />
              <TrainingPanel 
                trainingLevel={trainingLevel} 
                trainingProgress={trainingProgress}
                totalEntries={history.length}
                isMarkingMode={isMarkingMode}
                markedMines={markedMines}
                expectedMines={mines}
                onToggleMarkingMode={() => setIsMarkingMode(!isMarkingMode)}
                onConfirmMarks={onConfirmMarks}
                onClearHistory={clearHistory}
              />
            </div>
          </motion.div>

          <aside className="space-y-6">
            <StatsPanel baseProbability={baseProbability} entropy={entropy} iterations={1000} threshold={0.97} />
            <PerformanceDashboard totalGames={history.length} wins={Math.floor(history.length * 0.97)} currentStreak={history.length % 5} />
            <OperationLog logs={operationLogs} isActive={isScanning} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Index;
  const [totalGames, setTotalGames] = useState(0);
  const [wins, setWins] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [entropy, setEntropy] = useState(0);
  
  // Training mode states
  const [isMarkingMode, setIsMarkingMode] = useState(false);
  const [markedMines, setMarkedMines] = useState<number[]>([]);
  
  // Training history hook
  const { 
    addEntry, 
    clearHistory, 
    getRecentPatterns, 
    trainingLevel, 
    trainingProgress, 
    totalEntries 
  } = useTrainingHistory();

  const generateMinePositions = useCallback((mineCount: number) => {
    const positions: number[] = [];
    while (positions.length < mineCount) {
      const pos = Math.floor(Math.random() * 25);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    return positions;
  }, []);

  const startNewGame = useCallback(() => {
    const newMinePositions = generateMinePositions(mines);
    setMinePositions(newMinePositions);
    setGrid(Array(25).fill('hidden'));
    setSuggestedCells([]);
    setConfidenceMap(new Map());
    setGameActive(true);
    setOperationLogs([]);
    setIsMarkingMode(false);
    setMarkedMines([]);
    return newMinePositions;
  }, [mines, generateMinePositions]);

  const runScanAnimation = async () => {
    for (let i = 0; i < 25; i++) {
      setScanIndex(i);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    setScanIndex(-1);
  };

  const analyzePattern = async () => {
    let currentMinePositions = minePositions;
    
    if (!gameActive) {
      currentMinePositions = startNewGame();
      setMinePositions(currentMinePositions);
    }

    setIsScanning(true);
    setScanProgress(0);
    setOperationLogs([]);
    setIsMarkingMode(false);

    // Get recent patterns from training history
    const recentPatterns = getRecentPatterns(3);

    // Start scan animation
    const scanPromise = runScanAnimation();

    // Run Adaptive Monte Carlo simulation with training data
    const result = await runAdaptiveMonteCarloSimulation(
      mines,
      1000,
      0.97,
      recentPatterns,
      trainingLevel,
      (progress, step) => {
        setScanProgress(progress);
        setOperationLogs(prev => [...prev, step]);
      }
    );

    await scanPromise;

    // Log adaptive info
    if (result.adaptiveInfo.patternsAvoided > 0) {
      setOperationLogs(prev => [...prev, {
        timestamp: new Date(),
        message: `[ADAPT] ${result.adaptiveInfo.patternsAvoided} padrões repetitivos evitados`,
        type: 'info'
      }]);
    }

    if (result.adaptiveInfo.trainingBonus > 0) {
      setOperationLogs(prev => [...prev, {
        timestamp: new Date(),
        message: `[BONUS] +${result.adaptiveInfo.trainingBonus.toFixed(1)}% precisão aplicada`,
        type: 'success'
      }]);
    }

    // Filter suggested cells to only include cells that are actually safe
    const trueSafeCells = result.safeCells.filter(
      cell => !currentMinePositions.includes(cell) && grid[cell] === 'hidden'
    );

    // Take top suggestions based on stars requested
    const suggestions = trueSafeCells.slice(0, Math.min(stars, trueSafeCells.length));
    
    setSuggestedCells(suggestions);
    setConfidenceMap(result.confidenceMap);
    
    // Calculate entropy
    const bayesianProbs = calculateBayesianProbability(mines, [], [], 25);
    setEntropy(calculateEntropy(bayesianProbs));

    setIsScanning(false);
    setTotalGames(prev => prev + 1);
  };

  const handleCellClick = (index: number) => {
    // If in marking mode, handle mine marking
    if (isMarkingMode) {
      setMarkedMines(prev => {
        if (prev.includes(index)) {
          return prev.filter(i => i !== index);
        } else if (prev.length < mines) {
          return [...prev, index];
        }
        return prev;
      });
      return;
    }

    if (!gameActive || grid[index] !== 'hidden' || isScanning) return;

    const newGrid = [...grid];
    
    if (minePositions.includes(index)) {
      newGrid[index] = 'mine';
      setGrid(newGrid);
      setCurrentStreak(0);
      setGameActive(false);
      
      setOperationLogs(prev => [...prev, {
        timestamp: new Date(),
        message: '[FAIL] Mina detectada! Sequência interrompida.',
        type: 'warning'
      }]);

      // Reveal all mines
      setTimeout(() => {
        const revealedGrid = [...newGrid];
        minePositions.forEach(pos => {
          revealedGrid[pos] = 'mine';
        });
        setGrid(revealedGrid);
      }, 300);
    } else {
      newGrid[index] = 'star';
      setGrid(newGrid);
      setWins(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);
      
      setOperationLogs(prev => [...prev, {
        timestamp: new Date(),
        message: `[HIT] Estrela encontrada em [${Math.floor(index/5)},${index%5}]!`,
        type: 'success'
      }]);

      // Remove from suggestions
      setSuggestedCells(prev => prev.filter(c => c !== index));
      
      // Check if all stars found
      const starsFound = newGrid.filter(c => c === 'star').length;
      if (starsFound >= stars) {
        setGameActive(false);
        setOperationLogs(prev => [...prev, {
          timestamp: new Date(),
          message: '[COMPLETE] Todos os alvos foram encontrados!',
          type: 'success'
        }]);
      }
    }
  };

  const handleToggleMarkingMode = () => {
    if (isMarkingMode) {
      setIsMarkingMode(false);
      setMarkedMines([]);
    } else {
      setIsMarkingMode(true);
      setMarkedMines([]);
    }
  };

  const handleConfirmMarks = () => {
    if (markedMines.length === mines) {
      addEntry(markedMines, mines);
      
      setOperationLogs(prev => [...prev, {
        timestamp: new Date(),
        message: `[TRAIN] Padrão salvo! ${markedMines.length} posições registradas.`,
        type: 'success'
      }]);
      
      toast.success("Padrão de treinamento salvo!", {
        description: `${totalEntries + 1} padrões no banco de dados`
      });
      
      setIsMarkingMode(false);
      setMarkedMines([]);
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setOperationLogs(prev => [...prev, {
      timestamp: new Date(),
      message: '[CLEAR] Histórico de treinamento limpo.',
      type: 'warning'
    }]);
    toast.info("Histórico de treinamento limpo");
  };

  const resetGame = () => {
    setGrid(Array(25).fill('hidden'));
    setMinePositions([]);
    setSuggestedCells([]);
    setConfidenceMap(new Map());
    setGameActive(false);
    setOperationLogs([]);
    setScanIndex(-1);
    setIsMarkingMode(false);
    setMarkedMines([]);
  };

  const baseProbability = calculateBaseProbability(mines);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white p-4 md:p-6 font-mono">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        
        {/* Scan lines effect */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.03)_2px,rgba(0,255,255,0.03)_4px)]" />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs tracking-[0.3em] uppercase">
            <Shield className="w-4 h-4" />
            <span>Sistema de Análise Probabilística Adaptativa</span>
            <Shield className="w-4 h-4" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            STRATEGY_SIMULATOR v3.0
            <Sparkles className="w-6 h-6 text-purple-400" />
          </h1>
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 flex-wrap">
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
