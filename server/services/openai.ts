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
  private promptConfig = {
    base_prompt: "You are an expert Estonian language tutor specialized in teaching Honduran Spanish speakers. You always respond only in Estonian, except when providing grammar explanations or cultural context — which you explain briefly in Latin American Spanish. Your teaching is adaptive to CEFR levels (A1–C2): vocabulary, grammar, and sentence complexity must match the learner's level. You are patient, supportive, and clear. You correct gently and give useful, contextual feedback.",
    modes: {
      general_conversation: {
        description: "General Conversation",
        prompt_addition: "Have relaxed conversations about daily life. Gently correct mistakes and introduce useful phrases. Encourage fluency."
      },
      dialogue_simulation: {
        description: "Dialogue Simulation",
        prompt_addition: "Simulate situational dialogues (e.g., shops, travel, job interviews). Stay in character and prompt user to speak naturally and respond in context."
      },
      pronunciation_practice: {
        description: "Pronunciation Practice",
        prompt_addition: "Focus on phonetics. Use IPA for difficult words. Highlight Estonian-specific sounds (e.g., õ, ä, ö, ü). Explain mouth and tongue position in Spanish."
      },
      grammar_exercises: {
        description: "Grammar Exercises",
        prompt_addition: "Provide focused grammar practice. Present 1–2 examples, then quiz the user interactively. Use Spanish to explain errors and give helpful feedback."
      }
    },
    cefr_levels: {
      A1: "Use basic nouns, daily actions, present tense. Short, clear sentences. Avoid abstract concepts.",
      A2: "Introduce routine past/future tense, common prepositions, basic questions. Keep language simple but varied.",
      B1: "Use connected sentences, modal verbs, describe preferences and opinions. Practice real-world situations.",
      B2: "Introduce subordinate clauses, conditionals, and indirect speech. Use more fluent transitions and richer vocabulary.",
      C1: "Use idioms, abstract language, and argumentation. Introduce varied tone and some formal/informal distinctions.",
      C2: "Simulate native fluency. Use nuanced language, literary and colloquial expressions, and culturally rich content."
    }
  };

  private buildSystemPrompt(mode: string = "general_conversation", cefrLevel: string = "B1"): string {
    // Map frontend modes to config modes
    const modeMapping: { [key: string]: string } = {
      "chat": "general_conversation",
      "dialogue": "dialogue_simulation", 
      "pronunciation": "pronunciation_practice",
      "grammar": "grammar_exercises"
    };
    
    const configMode = modeMapping[mode] || mode;
    
    // Start with base prompt
    let systemPrompt = this.promptConfig.base_prompt;
    
    // Add mode-specific instructions
    const modeConfig = this.promptConfig.modes[configMode as keyof typeof this.promptConfig.modes];
    if (modeConfig) {
      systemPrompt += `\n\nMode: ${modeConfig.description}\n${modeConfig.prompt_addition}`;
    }
    
    // Add CEFR level targeting
    systemPrompt += `\n\nTarget CEFR Level: ${cefrLevel}`;
    
    // Add CEFR-specific guidance
    const cefrGuidance = this.promptConfig.cefr_levels[cefrLevel as keyof typeof this.promptConfig.cefr_levels];
    if (cefrGuidance) {
      systemPrompt += `\nLevel Guidelines: ${cefrGuidance}`;
    }
    
    // Add critical TTS instructions
    systemPrompt += `\n\nCRITICAL TTS INSTRUCTIONS:
- Respond ONLY in Estonian. No Spanish words in main message.
- Only use Spanish for "Nota gramatical" and "Contexto Cultural" sections
- Use Estonian phrases: "Tere! Kuidas läheb?" "Väga hea!" "Proovi veel kord!" "Suurepärane töö!"
- No translations in parentheses in main message
- Be patient, supportive, and motivating teacher
- Correct mistakes clearly and pedagogically`;
    
    return systemPrompt;
  }

  async getChatResponse(
    userMessage: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[],
    currentCEFRLevel: string,
    mode: string = "general_conversation"
  ): Promise<TutorResponse> {
    console.log(`🤖 GPT using CEFR level: ${currentCEFRLevel} for mode: ${mode}`);
    try {
      const systemPrompt = this.buildSystemPrompt(mode, currentCEFRLevel);
      console.log(`📝 System prompt built for ${currentCEFRLevel} level in ${mode} mode`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4.1", // Using the new GPT-4.1 model as requested by the user
        messages: [
          {
            role: "system",
            content: `${systemPrompt}

Respond in JSON format with this structure:
{
  "message": "main response ONLY in Estonian",
  "corrections": [{"original": "incorrect word", "corrected": "correct word", "explanation": "explanation in Estonian"}],
  "grammarNotes": "grammar explanation in Honduran Spanish, if relevant",
  "culturalContext": "cultural context Estonia vs Honduras in Spanish", 
  "encouragement": "encouraging message in Estonian: 'Suurepärane!' 'Tubli töö!' 'Jätka samas vaimus!'"
}`
          },
          ...conversationHistory,
          { role: "user", content: userMessage }
        ],
        temperature: 0.3,
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
        model: "gpt-4.1",
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
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `Generate an Estonian language quiz for CEFR level ${cefrLevel} focused on ${category === 'vocabulary' ? 'VOCABULARY' : 'GRAMMAR'}.

${category === 'vocabulary' ? `
VOCABULARY FOCUS:
- Questions about word meanings and definitions
- Synonyms and antonyms
- Words related to specific themes (family, colors, food, etc.)
- Object and concept identification
- 70% multiple-choice questions, 30% completion questions
` : `
GRAMMAR FOCUS:
- Verb conjugations (present, past, future tenses)
- Grammatical cases (nominative, genitive, partitive, etc.)
- Sentence structure and prepositions
- 30% multiple-choice questions, 70% completion questions
`}

Create 5 varied questions APPROPRIATE for the specific CEFR level.
CRITICAL: ALL questions and options must be COMPLETELY IN ESTONIAN. Only explanations should be in Honduran Spanish.

CEFR LEVEL ${cefrLevel} - SPECIFIC DIFFICULTY:
${difficultyGuidance}

CORRECT FORMAT EXAMPLES:

MULTIPLE CHOICE (vocabulary):
- Question: "Mis värvi on meri?"
- Translation: "¿De qué color es el mar?"
- Options: ["sinine", "roheline", "punane", "kollane"]
- Correct: "sinine"
- Explanation: "'Sinine' significa 'azul' en español. El mar es azul."

COMPLETION (grammar):
- Question: "Ma _____ kooli iga päev."
- Translation: "Voy a la escuela todos los días"
- Correct: "lähen"
- Explanation: "'Lähen' es la forma presente del verbo 'ir' en primera persona."

Respond in JSON format:
{
  "questions": [
    {
      "question": "question COMPLETELY IN ESTONIAN (use _____ for blanks to complete)",
      "translation": "translation of the question to Honduran Spanish to help the user",
      "questionType": "multiple_choice" | "completion",
      "options": ["option1 in Estonian", "option2 in Estonian", "option3 in Estonian", "option4 in Estonian"] (only for multiple_choice),
      "correctAnswer": "correct answer in Estonian",
      "explanation": "clear explanation in Honduran Spanish about meaning and grammar",
      "cefrLevel": "${cefrLevel}"
    }
  ]
}`
          },
          {
            role: "user",
            content: `Generate quiz for CEFR level ${cefrLevel}${category ? ` category ${category}` : ""}`
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
      A1: `Vocabulario básico (saludos, números 1-10, colores básicos, familia inmediata). 
           Frases muy simples de 3-5 palabras. Presente simple solamente.
           Ejemplos: "Tere!" (Hola), "Mul on..." (Yo tengo...), números, días de la semana.`,
      
      A2: `Vocabulario cotidiano (100-200 palabras: comida, ropa, transporte, trabajo básico). 
           Oraciones simples, presente y pasado simple. Preguntas básicas con küsisõnad.
           Ejemplos: compras, describir rutina diaria, experiencias pasadas simples.`,
      
      B1: `Vocabulario intermedio (500+ palabras). Temas familiares: viajes, hobbies, planes futuros.
           Usa tiempo futuro, condicional básico. Conectores simples (ja, aga, või, sest).
           Ejemplos: expresar opiniones, hablar de experiencias, hacer planes.`,
      
      B2: `Vocabulario expandido (1000+ palabras). Temas abstractos: cultura estonia, sociedad, trabajo.
           Estructuras complejas, casos gramaticales avanzados. Subjuntivo ocasional.
           Ejemplos: argumentar puntos de vista, discutir problemas sociales.`,
      
      C1: `Vocabulario especializado (2000+ palabras). Temas complejos: política, filosofía, historia estonia.
           Matices de significado, expresiones idiomáticas estonias. Registro formal.
           Ejemplos: literatura estonia, debates académicos, cultura profesional.`,
      
      C2: `Dominio casi nativo (3000+ palabras). Sutilezas culturales específicas de Estonia.
           Registro formal e informal fluido. Referencias a literatura y cultura estonia.
           Ejemplos: textos literarios, humor estonio, dialectos regionales.`
    };
    return guidance[cefrLevel as keyof typeof guidance] || guidance.B1;
  }

  async generateDialogue(scenario: string, cefrLevel: string): Promise<DialogueGeneration> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
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
