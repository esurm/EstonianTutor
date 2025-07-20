import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { api, type QuizQuestion } from "@/lib/api";
import { useSpeech } from "@/hooks/use-speech";
import { useCEFRTracking } from "@/hooks/use-cefr-tracking";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  Award,
  BarChart3,
  ArrowRight,
  Volume2
} from "lucide-react";

interface QuizInterfaceProps {
  onQuizComplete: (results: any) => void;
  category?: string;
}

interface QuizAnswer {
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  cefrLevel: string;
  responseTime: number;
}

export function QuizInterface({ onQuizComplete, category }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);

  const { toast } = useToast();
  const { user } = useCEFRTracking();
  const { playAudio, synthesizeSpeech } = useSpeech();

  // Generate quiz
  const generateQuizMutation = useMutation({
    mutationFn: () => api.generateQuiz(user?.cefrLevel, category),
    onSuccess: (data) => {
      setQuestions(data.quiz.questions);
      setSessionId(data.sessionId);
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar el quiz. Intentá de nuevo.",
        variant: "destructive",
      });
    }
  });

  // Submit quiz
  const submitQuizMutation = useMutation({
    mutationFn: (data: { sessionId: number; answers: QuizAnswer[]; responseTime: number[] }) => 
      api.submitQuiz(data.sessionId, data.answers, data.responseTime),
    onSuccess: (results) => {
      setQuizResults(results);
      setShowResults(true);
      onQuizComplete(results);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el quiz. Intentá de nuevo.",
        variant: "destructive",
      });
    }
  });

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Generate quiz on mount
  useEffect(() => {
    generateQuizMutation.mutate();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) {
      toast({
        title: "Selecciona una respuesta",
        description: "Debés elegir una opción antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    const responseTime = Math.floor((Date.now() - questionStartTime) / 1000);
    
    const answerData: QuizAnswer = {
      question: currentQuestion.question,
      type: currentQuestion.type,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      userAnswer: selectedAnswer,
      explanation: currentQuestion.explanation,
      cefrLevel: currentQuestion.cefrLevel,
      responseTime
    };

    const newAnswers = [...answers, answerData];
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer("");
      setQuestionStartTime(Date.now());
    } else {
      // Quiz complete
      if (sessionId) {
        const responseTimes = newAnswers.map(a => a.responseTime);
        submitQuizMutation.mutate({
          sessionId,
          answers: newAnswers,
          responseTime: responseTimes
        });
      }
    }
  };

  const handlePlayQuestionAudio = async () => {
    if (currentQuestion?.correctAnswer) {
      try {
        const tts = await synthesizeSpeech(currentQuestion.correctAnswer, "et-EE");
        await playAudio(tts.audioUrl);
      } catch (error) {
        toast({
          title: "Error de Audio",
          description: "No se pudo reproducir el audio.",
          variant: "destructive",
        });
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: "¡Excelente!", color: "bg-green-500" };
    if (score >= 70) return { text: "Muy Bien", color: "bg-blue-500" };
    if (score >= 50) return { text: "Bien", color: "bg-yellow-500" };
    return { text: "Seguí Practicando", color: "bg-red-500" };
  };

  if (generateQuizMutation.isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Generando quiz personalizado...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResults && quizResults) {
    const scoreBadge = getScoreBadge(quizResults.score);
    
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Award className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">¡Quiz Completado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(quizResults.score)}`}>
              {quizResults.score}%
            </div>
            <Badge className={`${scoreBadge.color} text-white mb-4`}>
              {scoreBadge.text}
            </Badge>
            <p className="text-gray-600">
              {quizResults.correctCount} de {quizResults.totalQuestions} respuestas correctas
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <Clock className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="font-semibold">{formatTime(timeElapsed)}</p>
              <p className="text-xs text-gray-500">Tiempo Total</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="font-semibold">{quizResults.correctCount}</p>
              <p className="text-xs text-gray-500">Correctas</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="font-semibold">{user?.cefrLevel}</p>
              <p className="text-xs text-gray-500">Nivel CEFR</p>
            </div>
          </div>

          {quizResults.assessment?.levelChanged && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">¡Nivel Mejorado!</span>
              </div>
              <p className="text-green-700 text-sm">
                Tu nivel CEFR ha sido actualizado a {quizResults.assessment.newLevel}. 
                ¡Excelente progreso!
              </p>
            </div>
          )}

          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
            size="lg"
          >
            Hacer Otro Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-gray-600">No hay preguntas disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-lg">
              Quiz de Vocabulario - Nivel {user?.cefrLevel}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-lg font-semibold text-primary">
                {formatTime(timeElapsed)}
              </span>
            </div>
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayQuestionAudio}
              className="w-8 h-8 p-0"
            >
              <Play className="h-4 w-4" />
            </Button>
            <span className="font-medium text-gray-900">{currentQuestion.question}</span>
          </div>
          <p className="text-sm text-gray-600 italic ml-11">
            Escucha el audio para la pronunciación correcta
          </p>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.options?.map((option, index) => {
            const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = selectedAnswer === option;
            
            return (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleAnswerSelect(option)}
                className={`w-full p-4 text-left justify-between h-auto ${
                  isSelected 
                    ? "border-primary bg-blue-50 hover:bg-blue-50" 
                    : "hover:border-primary hover:bg-blue-50"
                }`}
              >
                <span className="font-medium text-gray-900">
                  {optionLabel}) {option}
                </span>
                <div className={`w-6 h-6 border-2 rounded-full transition-all ${
                  isSelected 
                    ? "border-primary bg-primary" 
                    : "border-gray-300"
                }`}>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-white absolute transform translate-x-0.5 translate-y-0.5" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer || submitQuizMutation.isPending}
          className="w-full"
          size="lg"
        >
          {currentQuestionIndex < questions.length - 1 ? (
            <>
              Siguiente Pregunta
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Finalizar Quiz
              <CheckCircle className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
