import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTrainingHistory } from "@/hooks/useTrainingHistory";
import { runAdaptiveMonteCarloSimulation, ProbabilityResult } from "@/lib/probabilityEngine";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, RefreshCw, Bomb, Star, Zap, TrendingUp, Flame } from "lucide-react";

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
  const [results, setResults] = useState<ProbabilityResult | null>(null);
  const [lastBombsInput, setLastBombsInput] = useState("");
  const [showGrid, setShowGrid] = useState(false);

  const handleProcessRound = async () => {
    setIsSimulating(true);
    setResults(null);
    
    // Salva bombas no histórico se informadas
    if (lastBombsInput.trim()) {
      const positions = lastBombsInput
        .split(',')
        .map(n => parseInt(n.trim()) - 1)
        .filter(n => !isNaN(n) && n >= 0 && n < 25);
      
      if (positions.length > 0) {
        addEntry(positions, mines);
      }
    }

    // Simula delay para efeito visual
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const recentPatterns = getRecentPatterns(5);
      
      const simulation = await runAdaptiveMonteCarloSimulation(
        mines,
        3000,
        0.97,
        recentPatterns,
        trainingLevel
      );

      setResults(simulation);
      setLastBombsInput("");
      setShowGrid(true);
      
      toast({
        title: "✓ Análise Concluída",
        description: `${simulation.safeCells.length} sinais encontrados`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha na simulação",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Grid visual 5x5
  const renderGrid = () => {
    if (!results) return null;
    
    const cells = [];
    for (let i = 0; i < 25; i++) {
      const isSuggested = results.safeCells.includes(i);
      const isHotspot = results.adaptiveInfo.hotspots.includes(i);
      const confidence = results.confidenceMap.get(i) || 0;
      
      cells.push(
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.02 }}
          className={`
            aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold relative
            ${isSuggested 
              ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white ring-2 ring-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
              : isHotspot
                ? 'bg-gradient-to-br from-red-900/60 to-red-800/60 text-red-300 ring-1 ring-red-500/50'
                : 'bg-zinc-800/80 text-zinc-500'
            }
          `}
        >
          {isSuggested ? (
            <>
              <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              <span className="text-[9px] mt-0.5">{(confidence * 100).toFixed(0)}%</span>
            </>
          ) : isHotspot ? (
            <>
              <Bomb className="w-3 h-3 text-red-400" />
              <span className="text-[8px] text-red-400">perigoso</span>
            </>
          ) : (
            <span className="text-zinc-600 text-[10px]">{i + 1}</span>
          )}
        </motion.div>
      );
    }
    return cells;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur">
        <CardHeader className="border-b border-zinc-800 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-tight text-lg">
              <Brain className="text-emerald-500" /> Mines Predictor
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 font-mono text-xs">
                <Zap className="w-3 h-3 mr-1" /> {totalEntries} jogos
              </Badge>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 font-mono text-xs">
                <TrendingUp className="w-3 h-3 mr-1" /> LVL {trainingLevel}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {/* Slider de Minas */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-zinc-400 font-bold uppercase flex items-center gap-1">
                <Bomb className="w-3 h-3 text-red-400" /> Quantidade de Minas
              </label>
              <span className="text-emerald-400 font-mono font-bold text-lg">{mines}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="24" 
              value={mines} 
              onChange={(e) => {
                setMines(Number(e.target.value));
                setResults(null);
                setShowGrid(false);
              }}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>1 mina</span>
              <span>24 minas</span>
            </div>
          </div>

          {/* Input de bombas anteriores */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-bold uppercase flex items-center gap-1">
              <Target className="w-3 h-3 text-amber-400" /> Bombas da última rodada (opcional)
            </label>
            <Input 
              value={lastBombsInput}
              onChange={(e) => setLastBombsInput(e.target.value)}
              placeholder="Ex: 2, 14, 25"
              className="bg-zinc-950 border-zinc-700 focus:ring-emerald-500 text-emerald-400 font-mono"
            />
            <p className="text-[10px] text-zinc-600">Informe para treinar a IA</p>
          </div>

          {/* Botão principal */}
          <Button 
            onClick={handleProcessRound} 
            disabled={isSimulating}
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-base uppercase tracking-wide shadow-lg shadow-emerald-500/20"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="animate-spin mr-2" /> 
                Analisando...
              </>
            ) : (
              <>
                <Zap className="mr-2" />
                Gerar Sinal
              </>
            )}
          </Button>

          {/* Grid Visual */}
          <AnimatePresence>
            {showGrid && results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <div className="text-xs text-zinc-400 font-bold uppercase text-center">
                  Células Seguras Identificadas
                </div>
                <div className="grid grid-cols-5 gap-1.5 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  {renderGrid()}
                </div>
                
                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Confiança Média</div>
                    <div className="text-emerald-400 font-mono font-bold text-lg">
                      {results.safeCells.length > 0 
                        ? ((results.safeCells.reduce((acc, cell) => acc + (results.confidenceMap.get(cell) || 0), 0) / results.safeCells.length) * 100).toFixed(1)
                        : 0}%
                    </div>
                  </div>
                  <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Células Sugeridas</div>
                    <div className="text-amber-400 font-mono font-bold text-lg">
                      {results.safeCells.map(c => c + 1).join(', ')}
                    </div>
                  </div>
                </div>

                {results.adaptiveInfo.patternsAvoided > 0 && (
                  <div className="text-center text-[10px] text-zinc-500">
                    IA evitou {results.adaptiveInfo.patternsAvoided} padrões repetitivos
                  </div>
                )}

                {results.adaptiveInfo.hotspots.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-[10px] text-red-400 bg-red-500/10 rounded-lg py-2">
                    <Flame className="w-3 h-3" />
                    {results.adaptiveInfo.hotspots.length} células marcadas como perigosas pelo histórico
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
