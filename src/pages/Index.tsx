import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Sparkles } from "lucide-react";
import MinesGrid from "@/components/MinesGrid";
import ConfigPanel from "@/components/ConfigPanel";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import ScanningOverlay from "@/components/ScanningOverlay";

type CellState = 'hidden' | 'star' | 'mine';

const Index = () => {
  const [mines, setMines] = useState(3);
  const [stars, setStars] = useState(5);
  const [grid, setGrid] = useState<CellState[]>(Array(25).fill('hidden'));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [suggestedCells, setSuggestedCells] = useState<number[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState('');
  const [totalGames, setTotalGames] = useState(0);
  const [wins, setWins] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [gameActive, setGameActive] = useState(false);

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
    setGameActive(true);
  }, [mines, generateMinePositions]);

  const analyzePattern = async () => {
    if (!gameActive) {
      startNewGame();
    }

    setIsScanning(true);
    setScanProgress(0);
    
    const stages = [
      'Conectando ao servidor...',
      'Analisando padrões RNG...',
      'Calculando probabilidades...',
      'Identificando células seguras...',
      'Finalizando análise...'
    ];

    for (let i = 0; i <= 100; i += 2) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setScanProgress(i);
      setScanStage(stages[Math.floor(i / 25)]);
    }

    // Generate suggested safe cells (cells that are NOT mines)
    const safeCells = Array.from({ length: 25 }, (_, i) => i)
      .filter(i => !minePositions.includes(i) && grid[i] === 'hidden');
    
    // Randomly select some safe cells as suggestions (biased towards success)
    const shuffled = safeCells.sort(() => Math.random() - 0.5);
    const suggestCount = Math.min(stars, shuffled.length, Math.floor(Math.random() * 3) + 3);
    
    setSuggestedCells(shuffled.slice(0, suggestCount));
    setIsScanning(false);
    setTotalGames(prev => prev + 1);
  };

  const handleCellClick = (index: number) => {
    if (!gameActive || grid[index] !== 'hidden') return;

    const newGrid = [...grid];
    
    if (minePositions.includes(index)) {
      newGrid[index] = 'mine';
      setGrid(newGrid);
      setCurrentStreak(0);
      setGameActive(false);
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
      
      // Check if all stars found
      const starsFound = newGrid.filter(c => c === 'star').length;
      if (starsFound >= stars) {
        setGameActive(false);
      }
    }
  };

  const resetGame = () => {
    setGrid(Array(25).fill('hidden'));
    setMinePositions([]);
    setSuggestedCells([]);
    setGameActive(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white p-4 md:p-8">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
            Simulador de Estratégia
            <Sparkles className="w-8 h-8 text-purple-400" />
          </h1>
          <p className="text-slate-400 text-sm">Análise de Probabilidade • Grid 5x5</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Panel - Config */}
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

            <div className="flex flex-col gap-2">
              <Button
                onClick={analyzePattern}
                disabled={isScanning}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-6 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all"
              >
                <Search className="w-5 h-5 mr-2" />
                Analisar Probabilidade
              </Button>

              <Button
                onClick={resetGame}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </motion.div>

          {/* Center - Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-1 relative"
          >
            <AnimatePresence>
              {isScanning && (
                <ScanningOverlay progress={scanProgress} stage={scanStage} />
              )}
            </AnimatePresence>
            
            <MinesGrid
              grid={grid}
              onCellClick={handleCellClick}
              suggestedCells={suggestedCells}
              isScanning={isScanning}
            />

            {suggestedCells.length > 0 && !isScanning && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-green-400 mt-3"
              >
                ✓ {suggestedCells.length} células com alta probabilidade identificadas
              </motion.p>
            )}
          </motion.div>

          {/* Right Panel - Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <PerformanceDashboard
              totalGames={totalGames}
              wins={wins}
              currentStreak={currentStreak}
            />

            <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="text-purple-400 font-medium">Nota:</span> Este é um simulador 
                educacional de probabilidade. Os resultados são gerados por RNG local para 
                demonstração de conceitos estatísticos.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
