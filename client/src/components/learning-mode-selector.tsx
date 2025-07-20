import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  MessageSquare, 
  Mic, 
  BookOpen,
  Sparkles,
  Users,
  Brain,
  Lightbulb
} from "lucide-react";

interface LearningModeProps {
  onModeSelect: (mode: "quiz-vocabulary" | "quiz-grammar" | "dialogue" | "pronunciation" | "grammar") => void;
}

export function LearningModeSelector({ onModeSelect }: LearningModeProps) {

  const modes = [
    {
      id: "quiz-vocabulary",
      title: "Quiz de Vocabulario",
      description: "Preguntas de palabras y significados",
      icon: HelpCircle,
      badge: "AUTO-GENERADO",
      badgeColor: "bg-green-500",
      gradientFrom: "from-green-50",
      gradientTo: "to-green-100",
      borderColor: "border-green-200",
      hoverFrom: "hover:from-green-100",
      hoverTo: "hover:to-green-200",
      iconColor: "bg-green-500"
    },
    {
      id: "quiz-grammar",
      title: "Ejercicios de Gramática",
      description: "Conjugaciones, casos y estructuras",
      icon: BookOpen,
      badge: "AUTO-GENERADO",
      badgeColor: "bg-purple-500",
      gradientFrom: "from-purple-50",
      gradientTo: "to-purple-100",
      borderColor: "border-purple-200",
      hoverFrom: "hover:from-purple-100",
      hoverTo: "hover:to-purple-200",
      iconColor: "bg-purple-500"
    },
    {
      id: "dialogue",
      title: "Simulación de Diálogo",
      description: "Crea situaciones personalizadas",
      icon: MessageSquare,
      badge: "PERSONALIZADO",
      badgeColor: "bg-purple-500",
      gradientFrom: "from-purple-50",
      gradientTo: "to-purple-100",
      borderColor: "border-purple-200",
      hoverFrom: "hover:from-purple-100",
      hoverTo: "hover:to-purple-200",
      iconColor: "bg-purple-500"
    },
    {
      id: "pronunciation",
      title: "Práctica de Pronunciación",
      description: "Feedback instantáneo de IA",
      icon: Mic,
      badge: "CON IA",
      badgeColor: "bg-green-500",
      gradientFrom: "from-green-50",
      gradientTo: "to-green-100",
      borderColor: "border-green-200",
      hoverFrom: "hover:from-green-100",
      hoverTo: "hover:to-green-200",
      iconColor: "bg-green-500"
    },
    {
      id: "grammar",
      title: "Ejercicios de Gramática",
      description: "Explicaciones culturales incluidas",
      icon: BookOpen,
      badge: "ADAPTATIVO",
      badgeColor: "bg-orange-500",
      gradientFrom: "from-orange-50",
      gradientTo: "to-orange-100",
      borderColor: "border-orange-200",
      hoverFrom: "hover:from-orange-100",
      hoverTo: "hover:to-orange-200",
      iconColor: "bg-orange-500"
    }
  ];

  const handleModeClick = (modeId: string) => {
    // Directly trigger the mode selection without showing selection state
    onModeSelect(modeId as "quiz-vocabulary" | "quiz-grammar" | "dialogue" | "pronunciation" | "grammar");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <span>Herramientas de Aprendizaje</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Button
                key={mode.id}
                variant="ghost"
                onClick={() => handleModeClick(mode.id)}
                className={`
                  group p-3 h-auto flex-col items-start space-y-0 
                  ${mode.id === 'quiz' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300' : 
                    mode.id === 'dialogue' ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300' :
                    mode.id === 'pronunciation' ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300' :
                    'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300'}
                  border transition-all duration-200 
                  hover:shadow-md hover:scale-[1.02]
                `}
              >
                <div className="w-full text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-800">
                      {mode.title}
                    </h4>
                    <Badge className={`text-xs text-white ${mode.badgeColor}`}>
                      {mode.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700">
                    {mode.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
