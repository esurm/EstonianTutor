import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSpeech } from "@/hooks/use-speech";
import { useCEFRTracking } from "@/hooks/use-cefr-tracking";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Send, 
  Play, 
  Pause,
  Volume2, 
  Bot, 
  User, 
  GraduationCap,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  source: "user" | "assistant";
  timestamp: Date;
  audioUrl?: string;
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  grammarNotes?: string;
  culturalContext?: string;
  encouragement?: string;
}

export function ChatInterface({ placeholder = "Escribir en estonio o hacer clic en el micrófono...", mode = "chat", title = "Tutor de Estonio", headerColor = "bg-blue-600" }: { placeholder?: string; mode?: string; title?: string; headerColor?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { 
    isRecording, 
    isTranscribing, 
    startRecording, 
    stopRecording, 
    transcribeAudio, 
    playAudio 
  } = useSpeech();
  
  const { user } = useCEFRTracking();

  const chatMutation = useMutation({
    mutationFn: (message: string) => api.sendChatMessage(message, currentSessionId || undefined, mode),
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${data.messageId}`,
        text: data.message.message,
        source: "assistant",
        timestamp: new Date(),
        audioUrl: data.audioUrl,
        corrections: data.message.corrections,
        grammarNotes: data.message.grammarNotes,
        culturalContext: data.message.culturalContext,
        encouragement: data.message.encouragement,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Audio is available but not auto-played - user can click play button
      
      // Invalidate user data to update progress
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Intentá de nuevo.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      source: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    
    // Send to API
    chatMutation.mutate(text.trim());
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      try {
        const audioBlob = await stopRecording();
        const transcription = await transcribeAudio(audioBlob, "es-HN");
        
        if (transcription.text.trim()) {
          handleSendMessage(transcription.text);
        } else {
          toast({
            title: "Sin Audio",
            description: "No se detectó voz. Intentá de nuevo.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error de Grabación",
          description: "Hubo un problema con la grabación.",
          variant: "destructive",
        });
      }
    } else {
      await startRecording();
    }
  };

  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlayAudio = async (audioUrl: string, messageId: string) => {
    try {
      // If this message is currently playing, pause it
      if (playingAudioId === messageId && currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        setPlayingAudioId(null);
        return;
      }

      // Stop any other audio first
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Create and play new audio (only once)
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setPlayingAudioId(messageId);
      
      audio.onended = () => {
        setPlayingAudioId(null);
        setCurrentAudio(null);
      };
      
      audio.onerror = () => {
        console.error('Audio playback error');
        setPlayingAudioId(null);
        setCurrentAudio(null);
      };
      
      audio.onpause = () => {
        setPlayingAudioId(null);
      };
      
      audio.onplay = () => {
        setPlayingAudioId(messageId);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudioId(null);
      setCurrentAudio(null);
    }

    try {
      setPlayingAudioId(messageId);
      await playAudio(audioUrl);
      setPlayingAudioId(null);
    } catch (error) {
      setPlayingAudioId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMessage: ChatMessage = {
        id: "greeting",
        text: "¡Tere! ¡Hola! Soy tu tutor de estonio. Estoy aquí para ayudarte a mejorar tu nivel. ¿En qué te gustaría practicar hoy?",
        source: "assistant",
        timestamp: new Date(),
        encouragement: "¡Muy bien por empezar a aprender estonio!"
      };
      setMessages([greetingMessage]);
    }
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className={`${headerColor} text-black`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-black" />
            </div>
            <div>
              <h2 className="text-black font-semibold">{title}</h2>
              <p className="text-black text-opacity-80 text-sm">¡Listo para ayudarte!</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm opacity-90">Nivel: {user?.cefrLevel || 'B1'}</p>
            <p className="text-xs opacity-75">Sesión Activa</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[500px]">
          {messages.map((message) => (
            <div key={message.id}>
              {message.source === "assistant" ? (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 max-w-md">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div 
                        className="text-gray-900 text-sm mb-2"
                        dangerouslySetInnerHTML={{
                          __html: message.text
                            // Remove Estonian brackets since they're no longer used
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
                        }}
                      />
                      {message.audioUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlayAudio(message.audioUrl!, message.id)}
                          className="text-primary hover:text-primary/80 p-1 h-auto w-8"
                        >
                          {playingAudioId === message.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString("es-HN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    
                    {/* Grammar Notes */}
                    {message.grammarNotes && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <GraduationCap className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-800 font-medium text-sm">Nota Gramatical</span>
                        </div>
                        <p className="text-amber-900 text-sm">{message.grammarNotes}</p>
                      </div>
                    )}
                    
                    {/* Cultural Context */}
                    {message.culturalContext && (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-800 font-medium text-sm">Contexto Cultural</span>
                        </div>
                        <p className="text-blue-900 text-sm">{message.culturalContext}</p>
                      </div>
                    )}
                    
                    {/* Corrections */}
                    {message.corrections && message.corrections.length > 0 && (
                      <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-orange-800 font-medium text-sm">Correcciones</span>
                        </div>
                        {message.corrections.map((correction, idx) => (
                          <div key={idx} className="mb-2 last:mb-0">
                            <p className="text-sm">
                              <span className="line-through text-red-600">{correction.original}</span>
                              {" → "}
                              <span className="text-green-600 font-medium">{correction.corrected}</span>
                            </p>
                            <p className="text-xs text-orange-700 mt-1">{correction.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 max-w-md">
                    <div className="bg-primary rounded-lg px-4 py-3 ml-auto">
                      <p className="text-white text-sm">{message.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {message.timestamp.toLocaleTimeString("es-HN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {chatMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                  <span className="text-sm text-gray-600 ml-2">Pensando...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="lg"
              onClick={handleVoiceInput}
              disabled={isTranscribing || chatMutation.isPending}
              className={`w-12 h-12 p-0 ${isRecording ? "animate-pulse" : ""}`}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            
            <div className="flex-1">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={chatMutation.isPending || isRecording}
                className="w-full"
              />
            </div>
            
            <Button
              size="lg"
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || chatMutation.isPending || isRecording}
              className="w-12 h-12 p-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Recording Indicator */}
          {isRecording && (
            <div className="mt-3 flex items-center justify-center space-x-2 text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Grabando... Habla en español</span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          )}
          
          {/* Transcribing Indicator */}
          {isTranscribing && (
            <div className="mt-3 flex items-center justify-center space-x-2 text-blue-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <span className="text-sm font-medium">Transcribiendo...</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
