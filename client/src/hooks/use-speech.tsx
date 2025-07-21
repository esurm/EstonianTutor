import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useSpeech() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error de Micrófono",
        description: "No se pudo acceder al micrófono. Verificá los permisos.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob, language: string = "es-HN") => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const audioDataPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
      });

      reader.readAsDataURL(audioBlob);
      const audioData = await audioDataPromise;

      const result = await api.transcribeAudio(audioData, language);
      return result;
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Error de Transcripción",
        description: "No se pudo transcribir el audio. Intentá de nuevo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  }, [toast]);

  const playAudio = useCallback(async (audioUrl: string) => {
    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setCurrentAudio(null);
      };

      await audio.play();
    } catch (error) {
      console.error("Audio playback error:", error);
      toast({
        title: "Error de Audio",
        description: "No se pudo reproducir el audio.",
        variant: "destructive",
      });
    }
  }, [currentAudio, toast]);

  const synthesizeSpeech = useCallback(async (text: string, language: string = "et-EE") => {
    try {
      const result = await api.synthesizeSpeech(text, language);
      return result;
    } catch (error) {
      console.error("Speech synthesis error:", error);
      toast({
        title: "Error de Síntesis",
        description: "No se pudo generar el audio.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const analyzePronunciation = useCallback(async (audioBlob: Blob, expectedText: string) => {
    try {
      const reader = new FileReader();
      const audioDataPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
      });

      reader.readAsDataURL(audioBlob);
      const audioData = await audioDataPromise;

      const result = await api.analyzePronunciation(audioData, expectedText);
      return result;
    } catch (error) {
      console.error("Pronunciation analysis error:", error);
      toast({
        title: "Error de Análisis",
        description: "No se pudo analizar la pronunciación.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const recordAndTranscribe = useCallback(async (language: string = "es-HN") => {
    try {
      await startRecording();
      
      // Return a promise that resolves when recording is stopped
      return new Promise<{ text: string; confidence: number; language: string }>((resolve, reject) => {
        const checkRecording = () => {
          if (!isRecording) {
            stopRecording()
              .then(audioBlob => transcribeAudio(audioBlob, language))
              .then(resolve)
              .catch(reject);
          } else {
            setTimeout(checkRecording, 100);
          }
        };
        checkRecording();
      });
    } catch (error) {
      console.error("Record and transcribe error:", error);
      throw error;
    }
  }, [startRecording, stopRecording, transcribeAudio, isRecording]);

  return {
    isRecording,
    isTranscribing,
    isPlaying: !!currentAudio,
    startRecording,
    stopRecording,
    transcribeAudio,
    playAudio,
    synthesizeSpeech,
    analyzePronunciation,
    recordAndTranscribe,
  };
}
