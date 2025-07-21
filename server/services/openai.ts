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
        prompt_addition: "Always try to simulate situational dialogues trying to understand the concept from user prompt (e.g., shops, travel, job interviews). Stay in character and prompt user to speak naturally and respond in context."
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

  private getModeParameters(mode: string) {
    const modeMapping: { [key: string]: string } = {
      "chat": "general_conversation",
      "dialogue": "dialogue_simulation", 
      "pronunciation": "pronunciation_practice",
      "grammar": "grammar_exercises"
    };
    
    const configMode = modeMapping[mode] || mode;
    
    const parameters = {
      general_conversation: {
        temperature: 0.7,
        top_p: 1.0,
        presence_penalty: 0.3,
        frequency_penalty: 0,
        max_tokens: 400
      },
      dialogue_simulation: {
        temperature: 0.8,
        top_p: 1.0,
        presence_penalty: 0.5,
        frequency_penalty: 0,
        max_tokens: 500
      },
      pronunciation_practice: {
        temperature: 0.2,
        top_p: 1.0,
        presence_penalty: 0,
        frequency_penalty: 0,
        max_tokens: 250
      },
      grammar_exercises: {
        temperature: 0.3,
        top_p: 1.0,
        presence_penalty: 0,
        frequency_penalty: 0,
        max_tokens: 400
      }
    };

    return parameters[configMode as keyof typeof parameters] || parameters.general_conversation;
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
      
      // Get mode-specific parameters
      const params = this.getModeParameters(mode);
      
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
        temperature: params.temperature,
        top_p: params.top_p,
        presence_penalty: params.presence_penalty,
        frequency_penalty: params.frequency_penalty,
        max_tokens: params.max_tokens,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || "{}";
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error("JSON parsing error for chat response:", parseError);
        console.error("Raw content:", content);
        // Return fallback response
        return {
          message: "Vabandage, tekkis tehniline probleem. Proovige uuesti.",
          corrections: [],
          grammarNotes: "",
          culturalContext: "",
          encouragement: "Proovige uuesti!"
        };
      }
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
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || "{}";
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error("JSON parsing error for CEFR assessment:", parseError);
        console.error("Raw content:", content);
        // Return fallback assessment
        return {
          currentLevel: currentLevel,
          confidence: 0.5,
          speedScore: 3,
          accuracyScore: 3,
          complexityScore: 3,
          recommendation: "maintain",
          reasoning: "Evaluación técnica fallida, manteniendo nivel actual"
        };
      }
    } catch (error) {
      console.error("CEFR Assessment error:", error);
      throw new Error("Failed to assess CEFR level");
    }
  }

  async generateQuiz(cefrLevel: string, category?: string): Promise<QuizGeneration> {
    try {
      const difficultyGuidance = this.getDifficultyGuidance(cefrLevel);
      
      // Category-specific optimized prompts
      const prompts = this.getCategoryPrompts(category, cefrLevel);
      
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: prompts.system
          },
          {
            role: "user",
            content: prompts.user
          }
        ],
        temperature: 0.2,
        top_p: 1.0,
        frequency_penalty: 0.1,
        presence_penalty: 0,
        max_tokens: prompts.maxTokens,
        response_format: { type: "json_object" }
      });

      const endTime = Date.now();
      console.log(`⚡ Quiz generation took ${endTime - startTime}ms with gpt-4.1-mini (${category} optimized)`);
      
      const content = response.choices[0].message.content || "{}";
      try {
        // Clean response to remove markdown code blocks if present
        const cleanContent = content.replace(/^```json\s*\n?/g, '').replace(/\n?```$/g, '').trim();
        const result = JSON.parse(cleanContent);
        
        // Validate that we got actual questions, not fallback
        if (result.questions && result.questions.length > 0) {
          console.log(`✅ Successfully parsed ${result.questions.length} quiz questions`);
          return result;
        } else {
          throw new Error("No questions found in API response");
        }
      } catch (parseError) {
        console.error("❌ JSON parsing error for quiz generation:", parseError);
        console.error("Raw content length:", content.length);
        console.error("Raw content preview:", content.substring(0, 200) + "...");
        // Return fallback quiz with proper structure (5 questions as expected)
        return {
          questions: [
            {
              question: "Mis on 'tere' tähendus?",
              translation: "¿Qué significa 'tere'?",
              questionType: "multiple_choice",
              options: ["Adiós", "Hola", "Gracias", "Por favor"],
              correctAnswer: "Hola",
              explanation: "'Tere' significa 'hola' en español.",
              cefrLevel: cefrLevel
            },
            {
              question: "Kuidas öelda 'tänan' inglise keeles?",
              translation: "¿Cómo se dice 'tänan' en inglés?",
              questionType: "multiple_choice", 
              options: ["Hello", "Thank you", "Goodbye", "Please"],
              correctAnswer: "Thank you",
              explanation: "'Tänan' significa 'gracias' en español y 'thank you' en inglés.",
              cefrLevel: cefrLevel
            },
            {
              question: "Millal kasutatakse sõna 'nägemist'?",
              translation: "¿Cuándo se usa la palabra 'nägemist'?",
              questionType: "multiple_choice",
              options: ["Hommikul", "Lahkudes", "Söögiajal", "Magama minnes"],
              correctAnswer: "Lahkudes", 
              explanation: "'Nägemist' tähendab 'adiós' ja kasutatakse lahkudes.",
              cefrLevel: cefrLevel
            },
            {
              question: "Täida lünk: 'Ma _____ eesti keelt.'",
              translation: "Completa el espacio: 'Ma _____ eesti keelt.'",
              questionType: "completion",
              correctAnswer: "õpin",
              explanation: "'Õpin' tähendab 'estoy aprendiendo' - Ma õpin eesti keelt = Estoy aprendiendo estonio.",
              cefrLevel: cefrLevel
            },
            {
              question: "Mis on 'kool' tähendus?",
              translation: "¿Qué significa 'kool'?",
              questionType: "multiple_choice",
              options: ["Casa", "Escuela", "Tienda", "Parque"],
              correctAnswer: "Escuela",
              explanation: "'Kool' significa 'escuela' en español.",
              cefrLevel: cefrLevel
            }
          ]
        };
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      throw new Error("Failed to generate quiz");
    }
  }

  async generateBatchQuizzes(requests: Array<{cefrLevel: string, category: string}>): Promise<QuizGeneration[]> {
    try {
      console.log(`🔄 Generating ${requests.length} quizzes in batch mode to save tokens`);
      const startTime = Date.now();
      
      // Create batch request
      const batchPrompts = requests.map((req, index) => {
        const difficultyGuidance = this.getDifficultyGuidance(req.cefrLevel);
        return {
          custom_id: `quiz-${index}`,
          method: "POST",
          url: "/v1/chat/completions",
          body: {
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "system",
                content: `Generate an Estonian language quiz for CEFR level ${req.cefrLevel} EXCLUSIVELY focused on ${req.category === 'vocabulary' ? 'VOCABULARY ONLY' : 'GRAMMAR ONLY'}.

${req.category === 'vocabulary' ? `
STRICT VOCABULARY FOCUS - NO GRAMMAR ALLOWED:
- ONLY questions about word meanings, definitions, and vocabulary recognition
- ONLY synonyms, antonyms, and word relationships
- ONLY words related to specific themes (family, colors, food, animals, objects, etc.)
- ONLY object and concept identification
- NO grammar questions, NO verb conjugations, NO sentence structure
- 70% multiple-choice questions, 30% completion questions (word completion, not sentence)
` : `
STRICT GRAMMAR FOCUS - NO VOCABULARY ALLOWED:
- ONLY verb conjugations (present, past, future tenses)
- ONLY grammatical cases (nominative, genitive, partitive, etc.)
- ONLY sentence structure, word order, and prepositions
- ONLY grammatical rules and language mechanics
- NO vocabulary meanings, NO word definitions, NO translation questions
- 30% multiple-choice questions, 70% completion questions (grammar completion)
`}

Create 5 varied questions APPROPRIATE for the specific CEFR level.
CRITICAL: ALL questions and options must be COMPLETELY IN ESTONIAN. Only explanations should be in Honduran Spanish.

CEFR LEVEL ${req.cefrLevel} - SPECIFIC DIFFICULTY:
${difficultyGuidance}

Respond in JSON format with questions array.`
              },
              {
                role: "user", 
                content: `Generate ${req.category === 'vocabulary' ? 'VOCABULARY ONLY' : 'GRAMMAR ONLY'} quiz for CEFR level ${req.cefrLevel}.`
              }
            ],
            temperature: 0.2,
            top_p: 1.0,
            frequency_penalty: 0.1,
            presence_penalty: 0,
            max_tokens: 800,
            response_format: { type: "json_object" }
          }
        };
      });

      // Use Promise.all for parallel generation instead of sequential
      const results = await Promise.all(
        requests.map(request => this.generateQuiz(request.cefrLevel, request.category))
      );

      const endTime = Date.now();
      console.log(`✅ Batch quiz generation completed in ${endTime - startTime}ms`);
      return results;
    } catch (error) {
      console.error("Batch quiz generation error:", error);
      throw new Error("Failed to generate batch quizzes");
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

  private getCategoryFocus(category?: string): string {
    const focuses = {
      vocabulary: 'VOCABULARY ONLY',
      grammar: 'GRAMMAR ONLY',
      conjugation: 'VERB CONJUGATION ONLY',
      sentence_reordering: 'SENTENCE STRUCTURE ONLY',
      error_detection: 'ERROR DETECTION ONLY'
    };
    return focuses[category as keyof typeof focuses] || focuses.vocabulary;
  }

  private getCategoryPrompt(category?: string): string {
    const prompts = {
      vocabulary: `
STRICT VOCABULARY FOCUS - NO GRAMMAR ALLOWED:
- ONLY questions about word meanings, definitions, and vocabulary recognition
- ONLY synonyms, antonyms, and word relationships
- ONLY words related to specific themes (family, colors, food, animals, objects, etc.)
- ONLY object and concept identification
- NO grammar questions, NO verb conjugations, NO sentence structure
- 70% multiple-choice questions, 30% completion questions (word completion, not sentence)
- Example: "What does 'kass' mean?" or "Complete: The animal that says 'mjau' is a ____"`,
      
      grammar: `
STRICT GRAMMAR FOCUS - NO VOCABULARY ALLOWED:
- ONLY verb conjugations (present, past, future tenses)
- ONLY grammatical cases (nominative, genitive, partitive, etc.)
- ONLY sentence structure, word order, and prepositions
- ONLY grammatical rules and language mechanics
- NO vocabulary meanings, NO word definitions, NO translation questions
- 30% multiple-choice questions, 70% completion questions (grammar completion)
- Example: "Complete the verb: Ma _____ (to go) kooli" or "Which case: Ma näen ____ (kass)"`,

      conjugation: `
STRICT CONJUGATION FOCUS - VERB TENSES AND PERSONS ONLY:
- ONLY verb conjugation questions (present, past, future, conditional)
- ONLY person and number variations (ma, sa, ta, me, te, nad)
- ONLY verb forms and tense transformations
- Focus on common Estonian verbs: olema, minema, tulema, tegema, ütlema
- NO vocabulary meanings, NO word order, NO cases
- 40% multiple-choice questions, 60% completion questions (verb conjugation)
- Example: "Complete: Ma _____ (olema) õpilane" or "Choose: Ta _____ (minema) kooli (läks/läheb/läheks)"`,

      sentence_reordering: `
STRICT SENTENCE STRUCTURE FOCUS - WORD ORDER ONLY:
- ONLY Estonian word order questions (SVO, time-manner-place)
- ONLY sentence reordering and structure questions
- ONLY questions about proper Estonian sentence construction
- Focus on time expressions first, then manner, then place
- NO vocabulary meanings, NO verb conjugations, NO translations
- 20% multiple-choice questions, 80% completion questions (sentence ordering)
- Example: "Reorder: [kooli, ma, homme, lähen]" or "Correct order: [kiiresti, jookseb, ta, parki]"`,

      error_detection: `
STRICT ERROR DETECTION FOCUS - MISTAKE IDENTIFICATION ONLY:
- ONLY questions identifying grammar or spelling mistakes in Estonian sentences
- ONLY error spotting in verb forms, cases, word order, or spelling
- ONLY correction of grammatical and orthographic errors
- Focus on common Estonian mistakes: case endings, verb agreement, word order
- NO vocabulary meanings, NO translations, NO definitions
- 60% multiple-choice questions, 40% completion questions (error correction)
- Example: "Find the error: 'Ma näen kassa parkis'" or "Correct: 'Ta läheb kooli kiiresti'"`,
    };
    return prompts[category as keyof typeof prompts] || prompts.vocabulary;
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
        temperature: 0.8,
        top_p: 1.0,
        presence_penalty: 0.5,
        frequency_penalty: 0,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || "{}";
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error("JSON parsing error for dialogue generation:", parseError);
        console.error("Raw content:", content);
        // Return fallback dialogue
        return {
          scenario: "Conversación básica",
          turns: [
            {
              speaker: "other",
              estonian: "Tere! Kuidas läheb?",
              spanish: "¡Hola! ¿Cómo te va?",
              audioPrompt: true
            },
            {
              speaker: "user",
              estonian: "Tere! Hästi, tänan!",
              spanish: "¡Hola! Bien, gracias!",
              audioPrompt: true
            }
          ],
          culturalNotes: "Saludo estonio básico muy común en Estonia."
        };
      }
    } catch (error) {
      console.error("Dialogue generation error:", error);
      throw new Error("Failed to generate dialogue");
    }
  }

  private getCategoryPrompts(category: string, cefrLevel: string) {
    switch(category) {
      case "vocabulary":
        return {
          system: `Create 5 Estonian vocabulary questions (${cefrLevel}). Questions in Estonian, explanations in Spanish. JSON format only.`,
          user: `5 vocabulary questions with options, correct answer, explanation.`,
          maxTokens: 600
        };
      
      case "grammar":
        return {
          system: `Create 5 Estonian grammar questions (${cefrLevel}). Questions in Estonian, explanations in Spanish. JSON format only.`,
          user: `5 grammar questions with options, correct answer, explanation.`,
          maxTokens: 650
        };
      
      case "conjugation":
        return {
          system: `Create 5 Estonian verb conjugation questions (${cefrLevel}). Questions in Estonian, explanations in Spanish. JSON format only.`,
          user: `5 conjugation questions with options, correct answer, explanation.`,
          maxTokens: 600
        };
      
      case "sentence_reordering":
        return {
          system: `Create 5 Estonian word order questions (${cefrLevel}). Questions in Estonian, explanations in Spanish. JSON format only.`,
          user: `5 sentence reordering questions with options, correct answer, explanation.`,
          maxTokens: 650
        };
      
      case "error_detection":
        return {
          system: `Generate 5 pedagogically correct CEFR ${cefrLevel} Estonian grammar error detection questions.
Each: "Leia lausest grammatiline viga: [lause]" (sentence has exactly one grammar error).
Return plain JSON: { "questions": [ ... ] }
Each question object:
- question: Estonian sentence with one grammar error
- translation: Spanish translation of the same sentence
- options: 4 words from the sentence
- correctAnswer: the single incorrect word
- explanation: in Spanish (max 12 words)
Only grammar errors. No translation or vocabulary questions. Only one word should be incorrect.`,
          user: `5 Estonian grammar error questions`,
          maxTokens: 500
        };
      
      default:
        return {
          system: `Create 5 Estonian questions (${cefrLevel}). Questions in Estonian, explanations in Spanish. JSON format only.`,
          user: `5 questions with options, correct answer, explanation.`,
          maxTokens: 700
        };
    }
  }
}

export const openaiService = new OpenAIService();
