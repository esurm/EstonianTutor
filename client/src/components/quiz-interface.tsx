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
  Volume2,
  X
} from "lucide-react";

interface QuizInterfaceProps {
  onQuizComplete: (results: any) => void;
  onQuizClose: () => void;
  category: "vocabulary" | "grammar" | "conjugation" | "sentence_reordering" | "error_detection";
}

interface QuizAnswer {
  question: string;
  type?: string;
  questionType?: string;
  options?: string[];
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  cefrLevel: string;
  responseTime: number;
}

export function QuizInterface({ onQuizComplete, onQuizClose, category }: QuizInterfaceProps) {
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
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const { toast } = useToast();
  const { user } = useCEFRTracking();
  const { playAudio, synthesizeSpeech } = useSpeech();

  // Generate quiz
  const generateQuizMutation = useMutation({
    mutationFn: () => api.generateQuiz((user as any)?.cefrLevel || "B1", category),
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
      console.log("Quiz submission successful, results:", results);
      setQuizResults(results);
      setShowResults(true);
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

  const handleSubmitAnswer = () => {
    const isCompletionQuestion = currentQuestion?.questionType === "completion" || currentQuestion?.type === "completion";
    
    if (!selectedAnswer || selectedAnswer.trim() === "") {
      toast({
        title: isCompletionQuestion ? "Escribe tu respuesta" : "Selecciona una respuesta",
        description: isCompletionQuestion ? "Debés escribir una respuesta antes de continuar." : "Debés elegir una opción antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    // Check if answer is correct
    const userAnswer = selectedAnswer.toLowerCase().trim();
    const correctAnswer = currentQuestion.correctAnswer.toLowerCase().trim();
    const isCorrect = userAnswer === correctAnswer;
    
    setIsAnswerCorrect(isCorrect);
    setShowAnswerFeedback(true);
  };

  const handleNextQuestion = () => {
    const responseTime = Math.floor((Date.now() - questionStartTime) / 1000);
    
    const answerData: QuizAnswer = {
      question: currentQuestion.question,
      type: currentQuestion.questionType || currentQuestion.type || "multiple_choice",
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      userAnswer: selectedAnswer,
      explanation: currentQuestion.explanation,
      cefrLevel: currentQuestion.cefrLevel,
      responseTime
    };

    const newAnswers = [...answers, answerData];
    setAnswers(newAnswers);

    // Reset for next question
    setShowAnswerFeedback(false);
    setSelectedAnswer("");
    setQuestionStartTime(Date.now());

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz complete - but don't submit yet, wait for user to click "Ver Resultados"
      console.log("Quiz completed, waiting for user to click Results button");
      setQuizCompleted(true);
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

  const handleShowResults = () => {
    if (sessionId && answers.length === questions.length) {
      console.log("Submitting quiz answers:", answers.length);
      const responseTimes = answers.map(a => a.responseTime);
      submitQuizMutation.mutate({
        sessionId,
        answers,
        responseTime: responseTimes
      });
    }
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
              <p className="font-semibold">{(user as any)?.cefrLevel || "B1"}</p>
              <p className="text-xs text-gray-500">Nivel CEFR</p>
            </div>
          </div>

          {/* Detailed Answer Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Revisión de Respuestas</h3>
            {answers.map((answer, index) => {
              const isCorrect = answer.userAnswer.toLowerCase().trim() === answer.correctAnswer.toLowerCase().trim();
              
              return (
                <div key={index} className={`border rounded-lg p-4 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">
                        Pregunta {index + 1}: {answer.question}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Tu respuesta:</span>
                          <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {answer.userAnswer}
                          </span>
                        </div>
                        
                        {!isCorrect && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Respuesta correcta:</span>
                            <span className="font-medium text-green-700">
                              {answer.correctAnswer}
                            </span>
                          </div>
                        )}
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                          <p className="text-blue-800 text-sm">
                            <span className="font-medium">Explicación:</span> {answer.explanation}
                          </p>
                        </div>
                        
                        {answer.options && answer.options.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Opciones disponibles:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {answer.options.map((option, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Tiempo: {answer.responseTime}s</span>
                          <span>Nivel: {answer.cefrLevel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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

          <div className="flex space-x-4">
            <Button 
              onClick={() => {
                setShowResults(false);
                setQuestions([]);
                setCurrentQuestionIndex(0);
                setSelectedAnswer("");
                setAnswers([]);
                setQuizResults(null);
                generateQuizMutation.mutate();
              }} 
              className="flex-1"
              size="lg"
            >
              Hacer Otro Quiz
            </Button>
            <Button 
              onClick={() => {
                onQuizComplete(quizResults);
                onQuizClose();
              }} 
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Finalizar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion && !quizCompleted) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-gray-600">No hay preguntas disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  // If quiz is completed, show completion state instead of current question
  if (quizCompleted && answers.length === questions.length) {
    return (
      <Card className="bg-gray-50">
        <CardHeader className="bg-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-lg">
                {(() => {
                  switch(category) {
                    case "vocabulary": return "Quiz de Vocabulario";
                    case "grammar": return "Quiz de Gramática";
                    case "conjugation": return "Quiz de Conjugación";
                    case "sentence_reordering": return "Quiz de Oraciones";
                    case "error_detection": return "Quiz de Errores";
                    default: return "Quiz de Gramática";
                  }
                })()} - Nivel {user?.cefrLevel || "B1"}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Quiz Completado - {questions.length} preguntas respondidas
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-lg font-semibold text-primary">
                  {formatTime(timeElapsed)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onQuizClose}
                className="w-8 h-8 p-0 hover:bg-gray-100"
                title="Cerrar quiz"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={100} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ¡Quiz Completado!
            </h3>
            <p className="text-green-700 mb-4">
              Has respondido todas las preguntas. Haz clic en "Ver Resultados" para ver tu puntuación.
            </p>
            <Button
              onClick={handleShowResults}
              className="w-full"
              size="lg"
              disabled={submitQuizMutation.isPending}
            >
              Ver Resultados
              <BarChart3 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-50">
      <CardHeader className="bg-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-lg">
              {(() => {
                switch(category) {
                  case "vocabulary": return "Quiz de Vocabulario";
                  case "grammar": return "Quiz de Gramática";
                  case "conjugation": return "Quiz de Conjugación";
                  case "sentence_reordering": return "Quiz de Oraciones";
                  case "error_detection": return "Quiz de Errores";
                  default: return "Quiz de Gramática";
                }
              })()} - Nivel {user?.cefrLevel || "B1"}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {quizCompleted ? `Quiz Completado - ${questions.length} preguntas` : `Pregunta ${currentQuestionIndex + 1} de ${questions.length}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-lg font-semibold text-primary">
                {formatTime(timeElapsed)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onQuizClose}
              className="w-8 h-8 p-0 hover:bg-gray-100"
              title="Cerrar quiz"
            >
              <X className="h-4 w-4" />
            </Button>
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
            {currentQuestion.translation || "Haz clic en el botón de audio para escuchar la pronunciación"}
          </p>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {category === "error_detection" ? (
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">
                Haz clic en la palabra o frase que contiene el error:
              </label>
              
              {/* Error Detection - Use options array if available, otherwise click-to-select */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !showAnswerFeedback && handleAnswerSelect(option)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        showAnswerFeedback
                          ? option === currentQuestion.correctAnswer
                            ? "border-green-500 bg-green-100 text-green-800"
                            : selectedAnswer === option
                            ? "border-red-500 bg-red-100 text-red-800"
                            : "border-gray-200 bg-gray-50"
                          : selectedAnswer === option
                          ? "border-blue-500 bg-blue-100 text-blue-800"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="text-lg leading-relaxed">
                    {currentQuestion.question
                      .replace(/^Leia lause seast grammatiline viga:\s*/g, '')
                      .replace(/^Leia lause seast viga:\s*["""]/g, '')
                      .replace(/["""]\s*$/g, '')
                      .split(/(\s+)/)
                      .map((word, index) => {
                        if (!word.trim()) return word; // Keep spaces as-is
                        
                        const cleanWord = word.replace(/[.,!?;:"""]/g, '');
                        const isSelected = selectedAnswer === cleanWord;
                        const isCorrect = currentQuestion.correctAnswer && cleanWord.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
                        
                        let wordClass = "";
                        if (showAnswerFeedback) {
                          if (isCorrect) {
                            wordClass = "bg-green-200 border-green-500 text-green-800";
                          } else if (isSelected && !isCorrect) {
                            wordClass = "bg-red-200 border-red-500 text-red-800";
                          } else {
                            wordClass = "hover:bg-gray-100";
                          }
                        } else {
                          wordClass = isSelected 
                            ? "bg-blue-200 border-blue-500 text-blue-800" 
                            : "hover:bg-blue-100 cursor-pointer";
                        }
                        
                        return (
                          <span
                            key={index}
                            onClick={() => !showAnswerFeedback && handleAnswerSelect(cleanWord)}
                            className={`inline-block px-1 py-0.5 m-0.5 border-2 border-transparent rounded transition-all ${wordClass}`}
                          >
                            {word}
                          </span>
                        );
                      })}
                  </div>
                </div>
              )}
              
              {selectedAnswer && !showAnswerFeedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-blue-800 text-sm">
                    Has seleccionado: <span className="font-semibold">"{selectedAnswer}"</span>
                  </p>
                </div>
              )}
            </div>
          ) : currentQuestion.questionType === "completion" || currentQuestion.type === "completion" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Completa la oración escribiendo la palabra en estonio:
              </label>
              <input
                type="text"
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Escribe la palabra correcta en estonio..."
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent text-lg ${
                  showAnswerFeedback 
                    ? (isAnswerCorrect 
                        ? "border-green-500 bg-green-50 text-green-800 focus:ring-green-500" 
                        : "border-red-500 bg-red-50 text-red-800 focus:ring-red-500")
                    : "border-gray-300 focus:ring-primary"
                }`}
                autoFocus
                disabled={showAnswerFeedback}
              />
              <p className="text-xs text-gray-500 italic">
                Pista: La respuesta debe estar en estonio y coincidir exactamente con la palabra correcta.
              </p>
            </div>
          ) : (
            currentQuestion.options?.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              
              // Color logic for feedback state
              let buttonClass = "";
              let circleClass = "";
              let iconElement = null;
              
              if (showAnswerFeedback) {
                if (isCorrect) {
                  buttonClass = "border-green-500 bg-green-50 text-green-800 hover:bg-green-50";
                  circleClass = "border-green-500 bg-green-500";
                  iconElement = <CheckCircle className="w-4 h-4 text-white absolute transform translate-x-0.5 translate-y-0.5" />;
                } else if (isSelected && !isCorrect) {
                  buttonClass = "border-red-500 bg-red-50 text-red-800 hover:bg-red-50";
                  circleClass = "border-red-500 bg-red-500";
                  iconElement = <XCircle className="w-4 h-4 text-white absolute transform translate-x-0.5 translate-y-0.5" />;
                } else {
                  buttonClass = "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-50";
                  circleClass = "border-gray-300";
                }
              } else {
                buttonClass = isSelected 
                  ? "border-primary bg-blue-50 hover:bg-blue-50" 
                  : "hover:border-primary hover:bg-blue-50";
                circleClass = isSelected 
                  ? "border-primary bg-primary" 
                  : "border-gray-300";
                iconElement = isSelected ? (
                  <CheckCircle className="w-4 h-4 text-white absolute transform translate-x-0.5 translate-y-0.5" />
                ) : null;
              }
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => !showAnswerFeedback && handleAnswerSelect(option)}
                  disabled={showAnswerFeedback}
                  className={`w-full p-4 text-left justify-between h-auto ${buttonClass}`}
                >
                  <span className="font-medium text-gray-900">
                    {optionLabel}) {option}
                  </span>
                  <div className={`w-6 h-6 border-2 rounded-full transition-all ${circleClass}`}>
                    {iconElement}
                  </div>
                </Button>
              );
            })
          )}
        </div>

        {/* Answer Feedback */}
        {showAnswerFeedback && (
          <div className={`border rounded-lg p-4 ${isAnswerCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center space-x-2 mb-2">
              {isAnswerCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${isAnswerCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isAnswerCorrect ? '¡Correcto!' : 'Incorrecto'}
              </span>
            </div>
            
            {!isAnswerCorrect && (
              <p className="text-sm text-red-700 mb-2">
                Respuesta correcta: <span className="font-medium">{currentQuestion.correctAnswer}</span>
              </p>
            )}
            
            <p className="text-sm text-gray-700">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Submit Button */}
        {!showAnswerFeedback ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={(!selectedAnswer || selectedAnswer.trim() === "") || submitQuizMutation.isPending}
            className="w-full"
            size="lg"
          >
            Comprobar Respuesta
            <CheckCircle className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={quizCompleted ? handleShowResults : handleNextQuestion}
            className="w-full"
            size="lg"
            disabled={submitQuizMutation.isPending}
          >
            {quizCompleted ? (
              <>
                Ver Resultados
                <BarChart3 className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Siguiente Pregunta
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
