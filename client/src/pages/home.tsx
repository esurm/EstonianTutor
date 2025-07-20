import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { LearningModeSelector } from "@/components/learning-mode-selector";
import { QuizInterface } from "@/components/quiz-interface";
import { ProgressDashboard } from "@/components/progress-dashboard";
import { CulturalNotes } from "@/components/cultural-notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Lightbulb, TriangleAlert, Target, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type LearningMode = "chat" | "quiz" | "dialogue" | "pronunciation" | "grammar";

export default function Home() {
  const [currentMode, setCurrentMode] = useState<LearningMode>("chat");
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const { toast } = useToast();

  const handleModeSelect = (mode: LearningMode) => {
    setCurrentMode(mode);
    
    if (mode === "dialogue") {
      toast({
        title: "Simulación de Diálogo",
        description: "Describí una situación y te genero un diálogo personalizado.",
      });
    } else if (mode === "pronunciation") {
      toast({
        title: "Práctica de Pronunciación", 
        description: "Hacé clic en el micrófono y repetí las palabras en estonio.",
      });
    } else if (mode === "grammar") {
      toast({
        title: "Ejercicios de Gramática",
        description: "Practicá gramática con explicaciones culturales.",
      });
    }
  };

  const handleQuizComplete = (results: any) => {
    setCurrentMode("chat");
    toast({
      title: "Quiz Completado",
      description: `Obtuviste ${results.score}% - ¡Buen trabajo!`,
    });
  };

  const renderMainContent = () => {
    switch (currentMode) {
      case "quiz":
        return <QuizInterface onQuizComplete={handleQuizComplete} />;
      case "chat":
      default:
        return (
          <div className="space-y-6">
            <ChatInterface />
            <LearningModeSelector onModeSelect={handleModeSelect} />
          </div>
        );
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "createDialogue":
        setCurrentMode("dialogue");
        toast({
          title: "Crear Diálogo",
          description: "Describí una situación en el chat y te ayudo a crear un diálogo.",
        });
        break;
      case "reviewMistakes":
        toast({
          title: "Revisar Errores",
          description: "Esta función estará disponible pronto.",
        });
        break;
      case "practiceWeakAreas":
        toast({
          title: "Áreas Débiles",
          description: "Generando ejercicios personalizados...",
        });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Learning Area - Left Column (2/3 width) */}
          <div className="lg:col-span-2">
            {renderMainContent()}
          </div>
          
          {/* Sidebar - Right Column (1/3 width) */}
          <div className="space-y-6">
            <ProgressDashboard />
            <CulturalNotes />
            
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    onClick={() => handleQuickAction("createDialogue")}
                    className="w-full flex items-center justify-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors h-auto"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Crear Diálogo</p>
                      <p className="text-xs text-gray-600">Describe una situación</p>
                    </div>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => handleQuickAction("reviewMistakes")}
                    className="w-full flex items-center justify-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors h-auto"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TriangleAlert className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Revisar Errores</p>
                      <p className="text-xs text-gray-600">Patrones comunes</p>
                    </div>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => handleQuickAction("practiceWeakAreas")}
                    className="w-full flex items-center justify-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors h-auto"
                  >
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Áreas Débiles</p>
                      <p className="text-xs text-gray-600">Práctica enfocada</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Floating Action Button - Mobile Only */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <Button
          size="lg"
          onClick={() => setShowQuickMenu(!showQuickMenu)}
          className="w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
        >
          <Plus className={`h-6 w-6 transition-transform ${showQuickMenu ? "rotate-45" : ""}`} />
        </Button>
        
        {showQuickMenu && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border p-4 min-w-[200px]">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentMode("quiz");
                  setShowQuickMenu(false);
                }}
                className="w-full justify-start"
              >
                Nuevo Quiz
              </Button>
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => {
                  handleQuickAction("createDialogue");
                  setShowQuickMenu(false);
                }}
                className="w-full justify-start"
              >
                Crear Diálogo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentMode("pronunciation");
                  setShowQuickMenu(false);
                }}
                className="w-full justify-start"
              >
                Pronunciación
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
