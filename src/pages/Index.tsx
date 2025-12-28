import { useState } from "react";
// Importações corrigidas para a raiz do projeto (onde os seus ficheiros estão)
import { useToast } from "@/hooks/use-toast"; 
import { useTrainingHistory } from "@/useTrainingHistory"; 
import { 
  runAdaptiveMonteCarloSimulation 
} from "@/probabilityEngine"; 

// Componentes UI (Certifique-se que estes existem ou use HTML simples se falhar)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Index = () => {
  const { toast } = useToast();
  const { addEntry, getRecentPatterns, trainingLevel } = useTrainingHistory();

  const [mines, setMines] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [lastBombs, setLastBombs] = useState("");

  const handleCalculate = async () => {
    setIsSimulating(true);
    
    // 1. Regista as últimas bombas se o utilizador inseriu dados
    if (lastBombs) {
      const positions = lastBombs.split(',')
        .map(n => parseInt(n.trim()) - 1)
        .filter(n => !isNaN(n) && n >= 0 && n < 25);
      
      if (positions.length > 0) {
        addEntry(positions, mines);
      }
    }

    try {
      // 2. Executa a simulação adaptativa com o histórico
      const recentPatterns = getRecentPatterns(5);
      const simulation = await runAdaptiveMonteCarloSimulation(
        mines,
        1000,
        0.97,
        recentPatterns,
        trainingLevel
      );

      setResults(simulation);
      setLastBombs(""); // Limpa o campo
      
      toast({
        title: "Análise Atualizada",
        description: "O algoritmo aprendeu com as últimas bombas inseridas.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no Motor",
        description: "Verifique se os ficheiros probabilityEngine.ts e useTrainingHistory.ts estão na pasta src.",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-center text-emerald-500">Mines AI Predictor</CardTitle>
          <p className="text-center text-xs text-slate-500">Nível de Treino: {trainingLevel}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Onde foram as últimas bombas? (ex: 1, 5, 20)</label>
            <Input 
              value={lastBombs}
              onChange={(e) => setLastBombs(e.target.value)}
              placeholder="Números de 1 a 25 separados por vírgula"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          
          <div className="flex flex-col gap-4">
            <label className="text-sm">Minas: {mines}</label>
            <input 
              type="range" min="1" max="24" value={mines} 
              onChange={(e) => setMines(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <Button 
              onClick={handleCalculate} 
              disabled={isSimulating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSimulating ? "A Calcular..." : "Calcular Próxima Rodada"}
            </Button>
          </div>

          {results && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-emerald-400 font-bold mb-2 text-sm text-center">SUGESTÕES DE ENTRADA:</p>
              <div className="grid grid-cols-4 gap-2">
                {results.safeCells.slice(0, 4).map((cell: number) => (
                  <div key={cell} className="bg-slate-800 p-2 text-center rounded border border-emerald-500/40 text-emerald-400 font-mono">
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
          
