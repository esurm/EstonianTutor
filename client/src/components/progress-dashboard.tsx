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

export function ProgressDashboard() {
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

  const levelInfo = getLevelInfo(user?.cefrLevel || "B1");
  const progressInfo = getProgressToNextLevel(user?.cefrLevel || "B1");
  
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
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Nivel CEFR Actual</p>
              <p className="text-2xl font-bold">{user?.cefrLevel}</p>
              <p className="text-xs opacity-75">{levelInfo.name}</p>
            </div>
            <div className="text-right">
              {progressInfo.nextLevel ? (
                <>
                  <p className="text-sm opacity-90">Progreso a {progressInfo.nextLevel}</p>
                  <p className="text-lg font-semibold">{progressInfo.progress}%</p>
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
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{user?.wordsLearned || 0}</p>
            <p className="text-xs text-gray-600">Palabras Aprendidas</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-green-500">{user?.accuracy || 0}%</p>
            <p className="text-xs text-gray-600">Precisión</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-purple-500">{user?.streak || 0}</p>
            <p className="text-xs text-gray-600">Días Seguidos</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold text-orange-500">
              {formatDuration(user?.totalTime || 0)}
            </p>
            <p className="text-xs text-gray-600">Tiempo Total</p>
          </div>
        </div>

        {/* Recent Performance */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Rendimiento Reciente</span>
          </h4>
          
          {progressData?.recentSessions?.length ? (
            <div className="space-y-2">
              {progressData.recentSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getSessionTypeColor(session.type)}`}>
                    </div>
                    <span className="text-sm text-gray-700 capitalize">
                      {session.type === "quiz" && "Quiz"}
                      {session.type === "chat" && "Conversación"}
                      {session.type === "pronunciation" && "Pronunciación"}
                      {session.type === "dialogue" && "Diálogo"}
                    </span>
                  </div>
                  <div className="text-right">
                    {session.score !== null && session.score !== undefined ? (
                      <Badge 
                        variant={session.score >= 80 ? "default" : session.score >= 60 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {session.score}%
                      </Badge>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {formatDuration(session.duration)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay sesiones recientes</p>
              <p className="text-xs">¡Empezá a practicar para ver tu progreso!</p>
            </div>
          )}
        </div>

        {/* Achievement Badge */}
        {user && user.streak >= 7 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">¡Racha Increíble!</p>
                <p className="text-sm text-yellow-700">
                  {user.streak} días consecutivos practicando
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
