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
  Lightbulb,
  ArrowUpDown,
  AlertTriangle
} from "lucide-react";

interface LearningModeProps {
  onModeSelect: (mode: "quiz-vocabulary" | "quiz-grammar" | "quiz-conjugation" | "quiz-sentence-reordering" | "quiz-error-detection" | "dialogue" | "pronunciation" | "grammar") => void;
}

export function LearningModeSelector({ onModeSelect }: LearningModeProps) {

  const modes = [
    {
      id: "quiz-vocabulary",
      title: "Quiz de Vocabulario",
      description: "Preguntas de palabras y significados",
      icon: HelpCircle,
      badge: "AUTO-GENERADO",
      badgeColor: "bg-cyan-500",
      gradientFrom: "from-cyan-50",
      gradientTo: "to-cyan-100",
      borderColor: "border-cyan-200",
      hoverFrom: "hover:from-cyan-100",
      hoverTo: "hover:to-cyan-200",
      iconColor: "bg-cyan-500"
    },
    {
      id: "quiz-grammar",
      title: "Quiz de Gramática",
      description: "Conjugaciones, casos y estructuras",
      icon: BookOpen,
      badge: "AUTO-GENERADO",
      badgeColor: "bg-indigo-500",
      gradientFrom: "from-indigo-50",
      gradientTo: "to-indigo-100",
      borderColor: "border-indigo-200",
      hoverFrom: "hover:from-indigo-100",
      hoverTo: "hover:to-indigo-200",
      iconColor: "bg-indigo-500"
    },
    {
      id: "quiz-conjugation",
      title: "Quiz de Conjugación",
      description: "Tiempos verbales y personas",
      icon: BookOpen,
      badge: "AUTO-GENERADO",
      badgeColor: "bg-rose-500",
      gradientFrom: "from-rose-50",
      gradientTo: "to-rose-100",
      borderColor: "border-rose-200",
      hoverFrom: "hover:from-rose-100",
      hoverTo: "hover:to-rose-200",
      iconColor: "bg-rose-500"
    },
    {
      id: "quiz-sentence-reordering",
      title: "Reordenamiento de Oraciones",
      description: "Orden de palabras en estonio",
      icon: ArrowUpDown,
      badge: "AUTO-GENERADO",
      badgeColor: "bg-amber-500",
      gradientFrom: "from-amber-50",
      gradientTo: "to-amber-100",
      borderColor: "border-amber-200",
      hoverFrom: "hover:from-amber-100",
      hoverTo: "hover:to-amber-200",
      iconColor: "bg-amber-500"
    },
    {
      id: "quiz-error-detection",
      title: "Detección de Errores",
      description: "Encuentra errores gramaticales",
      icon: AlertTriangle,
      badge: "AUTO-GENERADO",
      badgeColor: "bg-red-500",
      gradientFrom: "from-red-50",
      gradientTo: "to-red-100",
      borderColor: "border-red-200",
      hoverFrom: "hover:from-red-100",
      hoverTo: "hover:to-red-200",
      iconColor: "bg-red-500"
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
    onModeSelect(modeId as "quiz-vocabulary" | "quiz-grammar" | "quiz-conjugation" | "quiz-sentence-reordering" | "quiz-error-detection" | "dialogue" | "pronunciation" | "grammar");
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
                  ${mode.id === 'quiz-vocabulary' ? 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300' : 
                    mode.id === 'quiz-grammar' ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300' :
                    mode.id === 'quiz-conjugation' ? 'bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300' :
                    mode.id === 'quiz-sentence-reordering' ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300' :
                    mode.id === 'quiz-error-detection' ? 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300' :
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
