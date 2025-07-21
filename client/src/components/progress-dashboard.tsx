import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCEFRTracking } from "@/hooks/use-cefr-tracking";
import { api, type User } from "@/lib/api";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  BookOpen,
  MessageSquare,
  Mic,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgressSession {
  id: number;
  type: string;
  score?: number;
  startTime: Date;
  duration?: number;
}

interface ProgressData {
  user: User;
  recentSessions: ProgressSession[];
}

interface ProgressDashboardProps {
  onModeSelect?: (mode: "chat" | "quiz-vocabulary" | "quiz-grammar" | "quiz-conjugation" | "quiz-sentence-reordering" | "quiz-error-detection" | "dialogue" | "pronunciation" | "grammar") => void;
}

export function ProgressDashboard({ onModeSelect }: ProgressDashboardProps = {}) {
  const { user, getLevelInfo, getProgressToNextLevel } = useCEFRTracking();
  
  const { data: progressData, isLoading } = useQuery<ProgressData>({
    queryKey: ["/api/progress"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const levelInfo = getLevelInfo((user as any)?.cefrLevel || "B1");
  const progressInfo = getProgressToNextLevel((user as any)?.cefrLevel || "B1");
  
  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return <BookOpen className="w-3 h-3" />;
      case "chat":
        return <MessageSquare className="w-3 h-3" />;
      case "pronunciation":
        return <Mic className="w-3 h-3" />;
      default:
        return <CheckCircle className="w-3 h-3" />;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "quiz":
        return "bg-blue-500";
      case "chat":
        return "bg-green-500";
      case "pronunciation":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>Tu Progreso</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* CEFR Level Display */}
        <div className="bg-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-90">CEFR</p>
              <p className="text-2xl font-bold">{(user as any)?.cefrLevel}</p>
              <p className="text-xs opacity-75">{levelInfo.name}</p>
            </div>
            <div className="text-right">
              {progressInfo.nextLevel ? (
                <>
                  <p className="text-sm opacity-90">Progreso a {progressInfo.nextLevel}</p>
                  <p className="text-2xl font-bold">{progressInfo.progress}%</p>
                </>
              ) : (
                <>
                  <p className="text-sm opacity-90">Nivel Máximo</p>
                  <Award className="h-6 w-6 mx-auto mt-1" />
                </>
              )}
            </div>
          </div>
          {progressInfo.nextLevel && (
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-3">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressInfo.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center min-h-[80px]">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{(user as any)?.wordsLearned || 0}</p>
            <p className="text-xs text-gray-600">Palabras Nuevas</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center min-h-[80px]">
            <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-green-500">{(user as any)?.accuracy || 0}%</p>
            <p className="text-xs text-gray-600">Precisión</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center min-h-[80px]">
            <Award className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-purple-500">{(user as any)?.streak || 0}</p>
            <p className="text-xs text-gray-600">Días Seguidos</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center min-h-[80px]">
            <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold text-orange-500">
              {formatDuration((user as any)?.totalTime || 0)}
            </p>
            <p className="text-xs text-gray-600">Tiempo Total</p>
          </div>
        </div>

        {/* Chat Mode Selector */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-gray-900">Modos de Aprendizaje</h4>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={() => onModeSelect?.("chat")}
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors h-auto dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="w-3 h-3 bg-gray-600 rounded-full dark:bg-gray-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Conversación General</span>
            </Button>
            
            <Button
              onClick={() => onModeSelect?.("dialogue")}
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors h-auto dark:bg-indigo-950 dark:border-indigo-800 dark:hover:bg-indigo-900"
            >
              <div className="w-3 h-3 bg-indigo-600 rounded-full dark:bg-indigo-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Simulación de Diálogo</span>
            </Button>
            
            <Button
              onClick={() => onModeSelect?.("pronunciation")}
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 p-3 bg-lime-50 border border-lime-200 rounded-lg hover:bg-lime-100 transition-colors h-auto dark:bg-lime-950 dark:border-lime-800 dark:hover:bg-lime-900"
            >
              <div className="w-3 h-3 bg-lime-600 rounded-full dark:bg-lime-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Práctica de Pronunciación</span>
            </Button>
            
            <Button
              onClick={() => onModeSelect?.("grammar")}
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors h-auto dark:bg-orange-950 dark:border-orange-800 dark:hover:bg-orange-900"
            >
              <div className="w-3 h-3 bg-orange-600 rounded-full dark:bg-orange-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Ejercicios de Gramática</span>
            </Button>
            
            <Button
              onClick={() => onModeSelect?.("quiz-vocabulary")}
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors h-auto dark:bg-blue-950 dark:border-blue-800 dark:hover:bg-blue-900"
            >
              <div className="w-3 h-3 bg-blue-600 rounded-full dark:bg-blue-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Quiz de Vocabulario</span>
            </Button>
            
            <Button
              onClick={() => onModeSelect?.("quiz-grammar")}
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors h-auto dark:bg-purple-950 dark:border-purple-800 dark:hover:bg-purple-900"
            >
              <div className="w-3 h-3 bg-purple-600 rounded-full dark:bg-purple-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Quiz de Gramática</span>
            </Button>
            
            <Button
              onClick={() => onModeSelect?.("quiz-conjugation")}
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors h-auto dark:bg-emerald-950 dark:border-emerald-800 dark:hover:bg-emerald-900"
            >
              <div className="w-3 h-3 bg-emerald-600 rounded-full dark:bg-emerald-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Quiz de Conjugación</span>
            </Button>
            
            <Button
              onClick={() => onModeSelect?.("quiz-sentence-reordering")}
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors h-auto dark:bg-yellow-950 dark:border-yellow-800 dark:hover:bg-yellow-900"
            >
              <div className="w-3 h-3 bg-yellow-600 rounded-full dark:bg-yellow-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Quiz de Oraciones</span>
            </Button>
            
            <Button
              onClick={() => onModeSelect?.("quiz-error-detection")}
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors h-auto dark:bg-red-950 dark:border-red-800 dark:hover:bg-red-900"
            >
              <div className="w-3 h-3 bg-red-600 rounded-full dark:bg-red-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Quiz de Errores</span>
            </Button>
            
            <Button
              variant="ghost"
              disabled
              className="w-full flex items-center justify-start space-x-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg transition-colors h-auto dark:bg-cyan-950 dark:border-cyan-800 opacity-60 cursor-not-allowed"
            >
              <div className="w-3 h-3 bg-cyan-600 rounded-full dark:bg-cyan-400"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Chatear</span>
            </Button>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}
