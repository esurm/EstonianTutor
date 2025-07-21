import { useState } from "react";

import { Navigation } from "@/components/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { LearningModeSelector } from "@/components/learning-mode-selector";
import { QuizInterface } from "@/components/quiz-interface";
import { ProgressDashboard } from "@/components/progress-dashboard";

export default function Home() {
  const [currentMode, setCurrentMode] = useState<"chat" | "quiz-vocabulary" | "quiz-grammar" | "quiz-conjugation" | "quiz-sentence-reordering" | "quiz-error-detection" | "dialogue" | "pronunciation" | "grammar">("chat");


  const handleModeSelect = (mode: string) => {
    setCurrentMode(mode as "quiz-vocabulary" | "quiz-grammar" | "quiz-conjugation" | "quiz-sentence-reordering" | "quiz-error-detection" | "dialogue" | "pronunciation" | "grammar");
  };

  const handleQuizComplete = (score: number) => {
    console.log(`Quiz completed with score: ${score}%`);
    setCurrentMode("chat");
  };

  const renderMainContent = () => {
    switch (currentMode) {
      case "quiz-vocabulary":
        return <QuizInterface category="vocabulary" onQuizComplete={handleQuizComplete} onQuizClose={() => setCurrentMode("chat")} />;
      case "quiz-grammar":
        return <QuizInterface category="grammar" onQuizComplete={handleQuizComplete} onQuizClose={() => setCurrentMode("chat")} />;
      case "quiz-conjugation":
        return <QuizInterface category="conjugation" onQuizComplete={handleQuizComplete} onQuizClose={() => setCurrentMode("chat")} />;
      case "quiz-sentence-reordering":
        return <QuizInterface category="sentence_reordering" onQuizComplete={handleQuizComplete} onQuizClose={() => setCurrentMode("chat")} />;
      case "quiz-error-detection":
        return <QuizInterface category="error_detection" onQuizComplete={handleQuizComplete} onQuizClose={() => setCurrentMode("chat")} />;
      case "dialogue":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <ChatInterface 
                  key="dialogue" 
                  placeholder="Describí una situación: '¿Cómo pido ayuda en una tienda en Estonia?'" 
                  mode="dialogue" 
                  title="Simulación de Diálogo"
                  headerColor="bg-purple-100"
                />
              </div>
              <div className="lg:col-span-1 order-last lg:order-none">
                <ProgressDashboard onModeSelect={handleModeSelect} />
              </div>
            </div>
          </div>
        );
      case "pronunciation":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <ChatInterface 
                  key="pronunciation" 
                  placeholder="Escribí una palabra o frase en estonio para practicar pronunciación..." 
                  mode="pronunciation"
                  title="Práctica de Pronunciación"
                  headerColor="bg-green-100"
                />
              </div>
              <div className="lg:col-span-1 order-last lg:order-none">
                <ProgressDashboard onModeSelect={handleModeSelect} />
              </div>
            </div>
          </div>
        );
      case "grammar":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <ChatInterface 
                  key="grammar" 
                  placeholder="Preguntá sobre gramática: '¿Cómo funcionan los casos en estonio?'" 
                  mode="grammar"
                  title="Ejercicios de Gramática"
                  headerColor="bg-orange-100"
                />
              </div>
              <div className="lg:col-span-1 order-last lg:order-none">
                <ProgressDashboard onModeSelect={handleModeSelect} />
              </div>
            </div>
          </div>
        );
      case "chat":
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <ChatInterface 
                  placeholder="¿Qué querés aprender hoy? Escribí en español o estonio..." 
                  mode="chat" 
                  title="Tutor de Estonio con IA"
                  headerColor="bg-blue-100"
                />
              </div>
              <div className="lg:col-span-1 order-last lg:order-none">
                <ProgressDashboard onModeSelect={handleModeSelect} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderMainContent()}
      </div>
    </div>
  );
}