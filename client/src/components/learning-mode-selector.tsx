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
      badgeColor: "bg-blue-500",
      gradientFrom: "from-blue-50",
      gradientTo: "to-blue-100",
      borderColor: "border-blue-200",
      hoverFrom: "hover:from-blue-100",
      hoverTo: "hover:to-blue-200",
      iconColor: "bg-blue-500"
    },
    {
      id: "quiz-grammar",
      title: "Quiz de Gramática",
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
      id: "quiz-conjugation",
      title: "Quiz de Conjugación",
      description: "Tiempos verbales y personas",
      icon: BookOpen,
      badge: "AUTO-GENERADO",
      badgeColor: "bg-emerald-500",
      gradientFrom: "from-emerald-50",
      gradientTo: "to-emerald-100",
      borderColor: "border-emerald-200",
      hoverFrom: "hover:from-emerald-100",
      hoverTo: "hover:to-emerald-200",
      iconColor: "bg-emerald-500"
    },
    {
      id: "quiz-sentence-reordering",
      title: "Quiz de Oraciones",
      description: "Orden de palabras en estonio",
      icon: ArrowUpDown,
      badge: "AUTO-GENERADO",
      badgeColor: "bg-yellow-500",
      gradientFrom: "from-yellow-50",
      gradientTo: "to-yellow-100",
      borderColor: "border-yellow-200",
      hoverFrom: "hover:from-yellow-100",
      hoverTo: "hover:to-yellow-200",
      iconColor: "bg-yellow-500"
    },
    {
      id: "quiz-error-detection",
      title: "Quiz de Errores",
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
                  ${mode.id === 'quiz-vocabulary' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-950 dark:border-blue-800 dark:hover:bg-blue-900' : 
                    mode.id === 'quiz-grammar' ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-950 dark:border-purple-800 dark:hover:bg-purple-900' :
                    mode.id === 'quiz-conjugation' ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950 dark:border-emerald-800 dark:hover:bg-emerald-900' :
                    mode.id === 'quiz-sentence-reordering' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800 dark:hover:bg-yellow-900' :
                    mode.id === 'quiz-error-detection' ? 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-950 dark:border-red-800 dark:hover:bg-red-900' :
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
