import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTrainingHistory } from "@/hooks/useTrainingHistory";
import { 
  runAdaptiveMonteCarloSimulation, 
  calculateBaseProbability, 
  calculateEntropy 
} from "@/utils/probabilityEngine";

// Componentes da Interface (Shadcn UI)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, Target, History } from "lucide-react";

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

  // Executa a simulação baseada no histórico de bombas
  const executeSimulation = async () => {
    setIsSimulating(true);
    try {
      // Obtém os últimos 5 padrões de bombas para ajustar a probabilidade
      const recentPatterns = getRecentPatterns(5);
      
      const simulation = await runAdaptiveMonteCarloSimulation(
        mines,
        1000, // Iterações
        0.97, // Limiar de confiança
        recentPatterns,
        trainingLevel
      );

      setResults(simulation);
      
      toast({
        title: "Análise Concluída",
        description: `O motor adaptativo processou ${totalEntries} rodadas anteriores.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na simulação",
        description: "Verifique o motor de probabilidade.",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Brain className="text-primary" /> 
                Mines Predictor Pro
              </CardTitle>
              <p className="text-sm text-muted-foreground">Motor Monte Carlo Adaptativo</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <History size={14} /> Treino: Nível {trainingLevel}
            </Badge>
          </CardHeader>
          
          <CardContent className="grid gap-8 md:grid-cols-2">
            {/* Painel de Controlo */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Quantidade de Minas</span>
                  <span className="font-bold text-primary">{mines}</span>
                </div>
                <Slider 
                  value={[mines]} 
                  min={1} 
                  max={24} 
                  step={1} 
                  onValueChange={(v) => setMines(v[0])} 
                />
              </div>

              <Button 
                className="w-full h-12 text-lg" 
                onClick={executeSimulation} 
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <><Loader2 className="mr-2 animate-spin" /> A Analisar...</>
                ) : (
                  "Gerar Previsão"
                )}
              </Button>
            </div>

            {/* Painel de Resultados */}
            <div className="bg-muted/50 rounded-lg p-4 flex flex-col justify-center border">
              {results ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-500 font-semibold">
                    <Target size={20} />
                    Melhores Células:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {results.safeCells.slice(0, 6).map((cell: number) => (
                      <div key={cell} className="bg-background border rounded p-2 text-center font-mono">
                        #{cell + 1}
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                    <p>Confiança: {(results.threshold * 100).toFixed(1)}%</p>
                    <p>Padrões evitados: {results.adaptiveInfo.patternsAvoided}</p>
                    <p>Bónus de IA: +{results.adaptiveInfo.trainingBonus.toFixed(2)}%</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Aguardando dados da simulação...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
