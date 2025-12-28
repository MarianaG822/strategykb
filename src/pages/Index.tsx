import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTrainingHistory } from "@/useTrainingHistory"; // Removido o /hooks/ se estiver na raiz
import { 
  runAdaptiveMonteCarloSimulation, 
  calculateBaseProbability, 
  calculateEntropy 
} from "@/probabilityEngine"; // Importado da raiz de src conforme sua lista

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, History, RefreshCw } from "lucide-react";

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

  const handleUpdateAndSimulate = async () => {
    setIsSimulating(true);
    
    // Processa as últimas bombas antes de simular
    if (lastBombsInput) {
      const positions = lastBombsInput
        .split(',')
        .map(n => parseInt(n.trim()) - 1)
        .filter(n => !isNaN(n) && n >= 0 && n < 25);
      
      if (positions.length > 0) {
        addEntry(positions, mines);
      }
    }

    try {
      const recentPatterns = getRecentPatterns(5);
      
      // Chamada ao motor de probabilidade
      const simulation = await runAdaptiveMonteCarloSimulation(
        mines,
        1000, // Iterações
        0.97, // Confiança
        recentPatterns,
        trainingLevel
      );

      setResults(simulation);
      setLastBombsInput(""); 
      
      toast({
        title: "Análise Adaptativa Concluída",
        description: `O algoritmo ajustou a precisão com base em ${totalEntries} registos.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no Motor",
        description: "Verifique se as funções foram exportadas corretamente.",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-emerald-500">
            <Brain size={28} /> ESTRATÉGIA IA
          </CardTitle>
          <div className="flex justify-center gap-2 mt-2">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
              Nível IA: {trainingLevel}
            </Badge>
            <Badge variant="outline" className="border-zinc-700">
              Histórico: {totalEntries}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-zinc-500">Últimas Bombas (Ex: 2, 14, 21)</label>
            <Input 
              value={lastBombsInput}
              onChange={(e) => setLastBombsInput(e.target.value)}
              placeholder="Digite onde as bombas caíram..."
              className="bg-zinc-900 border-zinc-800 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-zinc-500">MINAS: {mines}</label>
              <input 
                type="range" min="1" max="24" value={mines} 
                onChange={(e) => setMines(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <Button 
              onClick={handleUpdateAndSimulate} 
              disabled={isSimulating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isSimulating ? <RefreshCw className="animate-spin" /> : "ANALISAR"}
            </Button>
          </div>

          {results && (
            <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <div className="text-emerald-400 font-bold flex items-center gap-2 mb-3">
                <Target size={18} /> PRÓXIMAS JOGADAS:
              </div>
              <div className="grid grid-cols-4 gap-2">
                {results.safeCells.slice(0, 4).map((cell: number) => (
                  <div key={cell} className="bg-zinc-900 p-2 text-center rounded border border-emerald-500/30 text-emerald-400 font-mono">
                    {cell + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
