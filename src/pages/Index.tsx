import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
// IMPORTANTE: Caminhos ajustados para a RAIZ da pasta SRC conforme sua imagem
import { useTrainingHistory } from "@/useTrainingHistory"; 
import { runAdaptiveMonteCarloSimulation } from "@/probabilityEngine";

// Componentes da UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, History, RefreshCw, Bomb } from "lucide-react";

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
  const [lastBombsInput, setLastBombsInput] = useState("");

  const handleProcessRound = async () => {
    setIsSimulating(true);
    
    // 1. Se você digitou as bombas, elas são salvas no histórico (localStorage)
    if (lastBombsInput) {
      const positions = lastBombsInput
        .split(',')
        .map(n => parseInt(n.trim()) - 1) // Converte para índice 0-24
        .filter(n => !isNaN(n) && n >= 0 && n < 25);
      
      if (positions.length > 0) {
        addEntry(positions, mines);
      }
    }

    try {
      // 2. Pega os padrões salvos para a IA "desviar" deles
      const recentPatterns = getRecentPatterns(5);
      
      const simulation = await runAdaptiveMonteCarloSimulation(
        mines,
        1000, 
        0.97, 
        recentPatterns,
        trainingLevel
      );

      setResults(simulation);
      setLastBombsInput(""); // Limpa o campo para a próxima rodada
      
      toast({
        title: "Cálculo Adaptativo",
        description: `IA nível ${trainingLevel} analisou ${totalEntries} jogos.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro de Importação",
        description: "Verifique se os arquivos estão na raiz da pasta src.",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 flex items-center justify-center font-sans">
      <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 shadow-2xl">
        <CardHeader className="border-b border-zinc-800 pb-4 mb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-tighter">
              <Brain className="text-emerald-500" /> Mines IA Predictor
            </CardTitle>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 font-mono">
              IA LVL: {trainingLevel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ONDE FORAM AS ÚLTIMAS BOMBAS - Sua solicitação principal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
              <Bomb size={16} className="text-red-500" /> ÚLTIMAS BOMBAS (EX: 2, 14, 25)
            </div>
            <Input 
              value={lastBombsInput}
              onChange={(e) => setLastBombsInput(e.target.value)}
              placeholder="Digite as bombas da última rodada..."
              className="bg-zinc-950 border-zinc-800 focus:ring-emerald-500 text-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-bold uppercase">Minas: {mines}</label>
              <input 
                type="range" min="1" max="24" value={mines} 
                onChange={(e) => setMines(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <Button 
              onClick={handleProcessRound} 
              disabled={isSimulating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black"
            >
              {isSimulating ? <RefreshCw className="animate-spin mr-2" /> : "GERAR SINAL"}
            </Button>
          </div>

          {results && (
            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 animate-in fade-in zoom-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-4 uppercase text-xs tracking-widest">
                <Target size={18} /> Entradas de Alta Confiança:
              </div>
              <div className="grid grid-cols-4 gap-3">
                {results.safeCells.slice(0, 4).map((cell: number) => (
                  <div key={cell} className="bg-zinc-950 p-3 text-center rounded-lg border border-emerald-500/40 text-emerald-400 font-mono text-xl font-bold shadow-lg">
                    {cell + 1}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-500/10 flex justify-between text-[10px] text-zinc-500 font-mono uppercase">
                <span>Padrões Evitados: {results.adaptiveInfo.patternsAvoided}</span>
                <span>Bônus IA: {results.adaptiveInfo.trainingBonus.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
