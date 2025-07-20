import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface TutorResponse {
  message: string;
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  grammarNotes?: string;
  culturalContext?: string;
  encouragement?: string;
}

export interface CEFRAssessment {
  currentLevel: string;
  confidence: number;
  speedScore: number; // 1-5
  accuracyScore: number; // 1-5
  complexityScore: number; // 1-5
  recommendation: "maintain" | "increase" | "decrease";
  reasoning: string;
}

export interface QuizGeneration {
  questions: {
    question: string;
    type: "multiple_choice" | "fill_blank";
    options?: string[];
    correctAnswer: string;
    explanation: string;
    cefrLevel: string;
  }[];
}

export interface DialogueGeneration {
  scenario: string;
  turns: {
    speaker: "user" | "other";
    estonian: string;
    spanish: string;
    audioPrompt?: boolean;
  }[];
  culturalNotes?: string;
}

export class OpenAIService {
  private getSystemPrompt(mode: string = "chat"): string {
    const basePrompt = `Eres un tutor de estonio para un usuario hondureño intermedio. El usuario ya conoce estonio básico. 

INSTRUCCIONES CRÍTICAS PARA TTS:
- RESPONDE SOLO EN ESTONIO. Ninguna palabra en español en el mensaje principal.
- Solo "Nota gramatical" y "Contexto Cultural" van en español hondureño (van en secciones separadas)
- Usa solo estonio: "Tere! Kuidas läheb?" "Väga hea!" "Proovi veel kord!"
- Nada de traducciones entre paréntesis en el mensaje principal
- Temperature: 0.2, top_p: 0.9 para respuestas precisas`;

    if (mode === "dialogue") {
      return basePrompt + `

MODO SIMULACIÓN DE DIÁLOGO:
- Responde solo en estonio: "Siin on üks dialoog selle kohta..."
- "**Sina ütled:** Tere! Kas saate mind aidata?"
- "**Teine inimene vastab:** Tere! Jah, loomulikult."
- "**Sina ütled:** Ma otsin..."
- Sin traducciones en el mensaje principal
- Contexto cultural solo en secciones separadas`;
    }

    if (mode === "pronunciation") {
      return basePrompt + `

MODO PRÁCTICA DE PRONUNCIACIÓN:
- Responde solo en estonio: "Tere! Harjutame hääldust."
- Para palabras: "**Tere** [TE-re]"
- "Proovi öelda: **Aitäh** [AI-täh]"
- "Kuula ja korda!"
- Sin traducciones en el mensaje principal
- Explicaciones fonéticas solo en "Nota gramatical"`;
    }

    if (mode === "grammar") {
      return basePrompt + `

MODO EJERCICIOS DE GRAMÁTICA:
- Responde solo en estonio: "Grammatikaharjutus! Õpime koos."
- Ejemplos: "**Mina olen õpetaja.** Sina oled õpilane."
- Pregunta: "**Mis teemat tahad õppida?** Käänded? Tegusõnad?"
- Ejercicios: "**Harjutus:** Kuidas sa ütled...?"
- Sin traducciones en el mensaje principal
- Explicaciones solo en "Nota gramatical"`;
    }

    return basePrompt;
  }

  async getChatResponse(
    userMessage: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[],
    currentCEFRLevel: string,
    mode: string = "chat"
  ): Promise<TutorResponse> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `${this.getSystemPrompt(mode)}
            
Nivel CEFR actual del usuario: ${currentCEFRLevel}
Adapta tu respuesta a este nivel.

Responde en JSON con esta estructura:
{
  "message": "tu respuesta principal en español hondureño",
  "corrections": [{"original": "palabra incorrecta", "corrected": "palabra correcta", "explanation": "explicación"}],
  "grammarNotes": "explicación gramatical si es relevante",
  "culturalContext": "contexto cultural estonio vs hondureño",
  "encouragement": "mensaje de aliento en español hondureño"
}`
          },
          ...conversationHistory,
          { role: "user", content: userMessage }
        ],
        temperature: 0.2,
        top_p: 0.9,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to get tutor response");
    }
  }

  async assessCEFRLevel(
    userResponses: string[],
    responseTimeSeconds: number[],
    currentLevel: string
  ): Promise<CEFRAssessment> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Eres un evaluador CEFR experto para el idioma estonio. Analiza las respuestas del usuario y evalúa su nivel actual.

Criterios de evaluación:
- Velocidad de respuesta (1-5): más rápido = mayor fluidez
- Precisión gramatical (1-5): corrección de la gramática
- Complejidad del lenguaje (1-5): uso de estructuras avanzadas

Niveles CEFR: A1, A2, B1, B2, C1, C2

Nivel actual: ${currentLevel}

Responde en JSON:
{
  "currentLevel": "nivel CEFR evaluado",
  "confidence": 0.85,
  "speedScore": 4,
  "accuracyScore": 3,
  "complexityScore": 3,
  "recommendation": "maintain|increase|decrease",
  "reasoning": "explicación detallada de la evaluación"
}`
          },
          {
            role: "user",
            content: `Respuestas del usuario: ${userResponses.join(", ")}
Tiempos de respuesta (segundos): ${responseTimeSeconds.join(", ")}`
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("CEFR Assessment error:", error);
      throw new Error("Failed to assess CEFR level");
    }
  }

  async generateQuiz(cefrLevel: string, category?: string): Promise<QuizGeneration> {
    try {
      const difficultyGuidance = this.getDifficultyGuidance(cefrLevel);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Genera un quiz de estonio para nivel ${cefrLevel}${category ? ` en la categoría ${category}` : ""}.

Crea 5 preguntas variadas (múltiple opción y completar espacios).
Las explicaciones deben estar en español hondureño.

NIVEL ${cefrLevel} - DIFICULTAD ESPECÍFICA:
${difficultyGuidance}

Tipos de preguntas:
- "multiple_choice": 4 opciones, una correcta
- "completion": usuario escribe la respuesta

Responde en JSON:
{
  "questions": [
    {
      "question": "pregunta en español hondureño",
      "type": "multiple_choice" | "completion",
      "options": ["opción1", "opción2", "opción3", "opción4"] (solo para multiple_choice),
      "correctAnswer": "respuesta correcta",
      "explanation": "explicación en español hondureño",
      "cefrLevel": "${cefrLevel}"
    }
  ]
}`
          },
          {
            role: "user",
            content: `Genera quiz para nivel ${cefrLevel}${category ? ` categoría ${category}` : ""}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Quiz generation error:", error);
      throw new Error("Failed to generate quiz");
    }
  }

  private getDifficultyGuidance(cefrLevel: string): string {
    const guidance = {
      A1: "Usa vocabulario básico (saludos, números, colores). Estructuras simples. Frases de 3-5 palabras.",
      A2: "Vocabulario cotidiano (familia, trabajo, compras). Oraciones simples con presente y pasado básico.",
      B1: "Temas familiares (viajes, hobbies, planes). Usa futuro, condicional básico. Expresiones de opinión simples.",
      B2: "Temas abstractos (cultura, sociedad). Estructuras complejas, subjuntivo ocasional. Vocabulario especializado.",
      C1: "Temas especializados (política, filosofía). Matices de significado. Expresiones idiomáticas estonias.",
      C2: "Dominio casi nativo. Sutilezas culturales. Registro formal e informal. Literatura estonia."
    };
    return guidance[cefrLevel as keyof typeof guidance] || guidance.B1;
  }

  async generateDialogue(scenario: string, cefrLevel: string): Promise<DialogueGeneration> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Crea un diálogo en estonio para la situación: "${scenario}"
Nivel: ${cefrLevel}

El diálogo debe tener 4-6 turnos, alternando entre el usuario y otra persona.
Incluye traducciones al español hondureño y notas culturales.

Responde en JSON:
{
  "scenario": "descripción del escenario",
  "turns": [
    {
      "speaker": "user" | "other",
      "estonian": "texto en estonio",
      "spanish": "traducción al español hondureño",
      "audioPrompt": true
    }
  ],
  "culturalNotes": "notas culturales relevantes"
}`
          },
          {
            role: "user",
            content: `Crea diálogo para: ${scenario}, nivel ${cefrLevel}`
          }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Dialogue generation error:", error);
      throw new Error("Failed to generate dialogue");
    }
  }
}

export const openaiService = new OpenAIService();
