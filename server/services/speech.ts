export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  language: string;
}

export interface TextToSpeechResult {
  audioUrl: string;
  duration: number;
}

export class SpeechService {
  async transcribeAudio(audioBlob: Blob, language: string = "es-HN"): Promise<SpeechRecognitionResult> {
    try {
      // Using Whisper API for transcription
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", language);

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        text: result.text,
        confidence: 0.9, // Whisper doesn't provide confidence, using default high value
        language: language
      };
    } catch (error) {
      console.error("Speech recognition error:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  async synthesizeSpeech(text: string, language: string = "et-EE"): Promise<TextToSpeechResult> {
    try {
      // Using Azure Speech API for Estonian TTS
      const azureKey = process.env.AZURE_SPEECH_KEY || process.env.AZURE_SPEECH_KEY_ENV_VAR || "default_key";
      const azureRegion = process.env.AZURE_SPEECH_REGION || "eastus";
      
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
          <voice name="et-EE-AnuNeural">
            ${text}
          </voice>
        </speak>
      `;

      const response = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": azureKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3"
        },
        body: ssml
      });

      if (!response.ok) {
        throw new Error(`Azure TTS error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      // Convert to base64 for easy transmission
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

      return {
        audioUrl,
        duration: Math.floor(text.length / 10) // Rough estimate: 10 characters per second
      };
    } catch (error) {
      console.error("Speech synthesis error:", error);
      throw new Error("Failed to synthesize speech");
    }
  }

  async analyzePronunciation(userAudioBlob: Blob, expectedText: string): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    try {
      // First transcribe the user's Estonian speech
      const transcription = await this.transcribeAudio(userAudioBlob, "et-EE");
      
      // Simple pronunciation analysis based on text similarity
      const similarity = this.calculateTextSimilarity(transcription.text.toLowerCase(), expectedText.toLowerCase());
      
      let score = Math.floor(similarity * 100);
      let feedback = "";
      let suggestions: string[] = [];

      if (score >= 90) {
        feedback = "¡Excelente pronunciación! Muy bien, hermano.";
      } else if (score >= 70) {
        feedback = "Buena pronunciación. Seguí practicando.";
        suggestions = ["Intentá hablar un poco más despacio", "Prestá atención a las vocales estonias"];
      } else if (score >= 50) {
        feedback = "Pronunciación aceptable, pero se puede mejorar.";
        suggestions = ["Escuchá el audio de referencia otra vez", "Practicá las consonantes difíciles"];
      } else {
        feedback = "Necesitás más práctica. ¡No te desanimés!";
        suggestions = ["Repetí después del audio", "Enfocate en cada sílaba", "Practicá más lento al principio"];
      }

      return { score, feedback, suggestions };
    } catch (error) {
      console.error("Pronunciation analysis error:", error);
      return {
        score: 0,
        feedback: "No pude analizar tu pronunciación. Intentá de nuevo.",
        suggestions: ["Verificá que el micrófono esté funcionando", "Hablá más fuerte"]
      };
    }
  }

  private calculateTextSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const speechService = new SpeechService();
