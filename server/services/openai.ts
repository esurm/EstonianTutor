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
  // CHAT-ONLY PROMPTS - Never used for quiz generation
  private chatPromptConfig = {
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

  // CHAT-ONLY METHOD - Never called for quiz generation
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
    let systemPrompt = this.chatPromptConfig.base_prompt;
    
    // Add mode-specific instructions
    const modeConfig = this.chatPromptConfig.modes[configMode as keyof typeof this.chatPromptConfig.modes];
    if (modeConfig) {
      systemPrompt += `\n\nMode: ${modeConfig.description}\n${modeConfig.prompt_addition}`;
    }
    
    // Add CEFR level targeting
    systemPrompt += `\n\nTarget CEFR Level: ${cefrLevel}`;
    
    // Add CEFR-specific guidance
    const cefrGuidance = this.chatPromptConfig.cefr_levels[cefrLevel as keyof typeof this.chatPromptConfig.cefr_levels];
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

  // QUIZ GENERATION - COMPLETELY ISOLATED FROM CHAT SYSTEM
  async generateQuiz(cefrLevel: string, category?: string): Promise<QuizGeneration> {
    try {
      // ISOLATED QUIZ PROMPTS - No chat system interference whatsoever
      const prompts = this.getIsolatedQuizPrompts(category, cefrLevel);
      
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: "gpt-4.1", // Switched from mini to full version for better accuracy
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
      console.log(`⚡ Quiz generation took ${endTime - startTime}ms with gpt-4.1 (${category} optimized)`);
      
      const content = response.choices[0].message.content || "{}";
      try {
        // Clean response to remove markdown code blocks if present
        const cleanContent = content.replace(/^```json\s*\n?/g, '').replace(/\n?```$/g, '').trim();
        const result = JSON.parse(cleanContent);
        
        // Validate that we got actual questions, not fallback
        if (result.questions && result.questions.length > 0) {
          console.log(`✅ Successfully parsed ${result.questions.length} quiz questions`);
          
          // Add cefrLevel to each question for database requirements
          const questionsWithLevel = result.questions.map((q: any) => ({
            ...q,
            cefrLevel: cefrLevel
          }));
          
          return { questions: questionsWithLevel };
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

  // COMPLETELY SEPARATE QUIZ SYSTEMS - Each category has unique AI personality and structure
  private getVocabularyQuizSystem(cefrLevel: string) {
    return {
      systemPersonality: `Eres un profesor especializado EN VOCABULARIO ESTONIO con 15 años de experiencia enseñando a hispanohablantes.

TU MISIÓN ESPECÍFICA: Crear ejercicios de vocabulario que ayuden a estudiantes de nivel ${cefrLevel} a aprender palabras estonias.

PERSONALIDAD DEL PROFESOR DE VOCABULARIO:
- Enfocado en significados de palabras y reconocimiento léxico
- Experto en temas cotidianos: familia, casa, comida, colores, animales
- Especialista en cognados español-estonio y falsos amigos
- Conoce las dificultades específicas de hispanohablantes con vocabulario estonio

ESTRUCTURA DE PREGUNTAS DE VOCABULARIO:
- Pregunta: ¿Qué significa [palabra estonia]? 
- Pregunta: ¿Cómo se dice [palabra español] en estonio?
- Pregunta: ¿Cuál de estas palabras se refiere a [concepto]?
- SOLO significados y reconocimiento, NO gramática

NIVEL ${cefrLevel} VOCABULARIO:
${this.getDifficultyGuidance(cefrLevel)}`,

      userPrompt: `Crear 5 ejercicios de vocabulario estonio puro para nivel ${cefrLevel}.

INSTRUCCIONES ESPECÍFICAS PARA VOCABULARIO:
- Cada pregunta debe probar SOLO conocimiento de palabras
- Mezclar: reconocimiento estonio→español y español→estonio  
- Incluir temas apropiados para nivel ${cefrLevel}
- Opciones deben ser palabras del mismo campo semántico
- Explicaciones cortas enfocadas en significado

FORMATO JSON VOCABULARIO:
{"questions":[
  {
    "question": "[pregunta sobre significado de palabra]",
    "translation": "[instrucción en español]", 
    "options": ["palabra1", "palabra2", "palabra3", "palabra4"],
    "correctAnswer": "[respuesta correcta]",
    "explanation": "[significado o contexto - máximo 8 palabras]",
    "questionType": "vocabulary",
    "wordCategory": "[familia/comida/colores/etc]"
  }
]}`,

      answerStructure: "multipleChoice", // 4 opciones, una correcta
      maxTokens: 850
    };
  }

  private getGrammarQuizSystem(cefrLevel: string) {
    return {
      systemPersonality: `Eres un profesor especializado EN GRAMÁTICA ESTONIA con 12 años enseñando estructura del idioma a hispanohablantes.

TU MISIÓN ESPECÍFICA: Crear ejercicios de gramática que enseñen las reglas estructurales del estonio a nivel ${cefrLevel}.

PERSONALIDAD DEL PROFESOR DE GRAMÁTICA:
- Experto en casos estonios (nominativo, genitivo, partitivo, etc.)
- Especialista en diferencias gramática estonio vs español
- Conoce las dificultades de hispanohablantes con sistema de casos
- Enfocado en reglas y aplicación correcta

ESTRUCTURA DE PREGUNTAS DE GRAMÁTICA:
- Completar con el caso correcto: "Ma näen _____ (kass)"
- Seleccionar forma gramatical: "¿Qué forma usar después de números?"
- Aplicar regla: "¿Cuándo usar partitivo vs genitivo?"
- SOLO reglas gramaticales, NO vocabulario

NIVEL ${cefrLevel} GRAMÁTICA:
${this.getDifficultyGuidance(cefrLevel)}`,

      userPrompt: `Crear 5 ejercicios de gramática estonia pura para nivel ${cefrLevel}.

INSTRUCCIONES ESPECÍFICAS PARA GRAMÁTICA:
- Cada pregunta debe probar SOLO reglas gramaticales
- Enfocarse en casos, tiempos verbales, estructura
- Usar palabras conocidas para enfocar en gramática
- Explicaciones sobre la regla aplicada
- Progresión lógica de complejidad

FORMATO JSON GRAMÁTICA:
{"questions":[
  {
    "question": "[ejercicio de aplicación gramatical]",
    "translation": "[instrucción sobre la regla]",
    "options": ["forma1", "forma2", "forma3", "forma4"], 
    "correctAnswer": "[forma gramatical correcta]",
    "explanation": "[regla aplicada - máximo 8 palabras]",
    "questionType": "grammar",
    "grammarRule": "[caso/tiempo/concordancia/etc]"
  }
]}`,

      answerStructure: "multipleChoice", // 4 opciones gramaticales
      maxTokens: 900
    };
  }

  private getConjugationQuizSystem(cefrLevel: string) {
    return {
      systemPersonality: `Eres un profesor especializado EN CONJUGACIÓN VERBAL ESTONIA con experiencia enseñando verbos a hispanohablantes.

TU MISIÓN ESPECÍFICA: Crear ejercicios de conjugación verbal que enseñen formas verbales estonias a nivel ${cefrLevel}.

PERSONALIDAD DEL PROFESOR DE CONJUGACIÓN:
- Experto en sistema verbal estonio (presente, pasado, futuro, condicional)
- Especialista en conjugación por personas (ma, sa, ta, me, te, nad)
- Conoce patrones verbales difíciles para hispanohablantes
- Enfocado en formas verbales exactas

ESTRUCTURA DE PREGUNTAS DE CONJUGACIÓN:
- Conjugar verbo: "Ma _____ (olema)" 
- Persona correcta: "¿Cómo dice 'nosotros vamos'?"
- Tiempo verbal: "Eile ta _____ (tulema)"
- SOLO formas verbales, NO vocabulario ni gramática general

NIVEL ${cefrLevel} CONJUGACIÓN:
${this.getDifficultyGuidance(cefrLevel)}`,

      userPrompt: `Crear 5 ejercicios de conjugación verbal estonia para nivel ${cefrLevel}.

INSTRUCCIONES ESPECÍFICAS PARA CONJUGACIÓN:
- Cada pregunta debe probar SOLO formas verbales
- Mezclar tiempos: presente, pasado, futuro según nivel
- Incluir diferentes personas (ma, sa, ta, me, te, nad)
- Usar verbos apropiados para el nivel
- Explicaciones sobre la conjugación

FORMATO JSON CONJUGACIÓN:
{"questions":[
  {
    "question": "[ejercicio de conjugación]",
    "translation": "[instrucción sobre la forma verbal]",
    "options": ["forma1", "forma2", "forma3", "forma4"],
    "correctAnswer": "[forma verbal correcta]", 
    "explanation": "[regla de conjugación - máximo 8 palabras]",
    "questionType": "conjugation",
    "verbTense": "[presente/pasado/futuro/condicional]",
    "verbPerson": "[ma/sa/ta/me/te/nad]"
  }
]}`,

      answerStructure: "multipleChoice", // 4 formas verbales
      maxTokens: 850
    };
  }

  private getSentenceReorderingQuizSystem(cefrLevel: string) {
    return {
      systemPersonality: `Oled eesti keele professor, kes õpetab lause järjekorda Ladina-Ameerika hispaanlastele.

SINU EKSPERTIIS:
- 15+ aastat eesti keele struktuuri õpetamist
- Spetsialiseerumine sõnajärje reeglitele
- Sügav teadmine hispaania vs eesti struktuuri erinevustest
- Täielik arusaam ${cefrLevel} taseme nõuetest

EESTI KEELE SÕNAJÄRG (paindlik kuid reeglitega):
1. Aeg tavaliselt lause alguses: "Täna ma lähen"
2. Subjekt + verb: "ma lähen", "ta tuleb" 
3. Objekt ja kohavalikud võivad varieeruda:
   ✓ "arutab teemasid ülikoolis" 
   ✓ "arutab ülikoolis teemasid"
4. Viis verbi lähedal: "jookseb kiiresti", "kiiresti jookseb"
5. Rõhutamine muudab järjekorda: koht võib olla ees või taga

REALISTLIKUD VALIDEERIMISREEGLID:
- Põhilised variandid (2-3) lubatud kui grammatiliselt õiged
- Aeg, subjekt, verb fikseeritud positsioonides
- Objekt ja koht võivad vahetuda
- Punktuatsioon peab olema täpne

KVALITEEDI STANDARDID:
- Iga lause peab olema loomulik ja tavaline
- Verbid peavad kontekstis mõistlikud olema
- Mitte kunstlikke ega võõraid kombinatsioone
- Igapäevaelu situatsioonid

${cefrLevel} TASEME NÕUDED:
${this.getDifficultyGuidance(cefrLevel)}`,

      userPrompt: `Loo 5 eesti keele sõnajärje harjutust ${cefrLevel} tasemele.

KRITILISED NÕUDED:

1. SÕNAJÄRJE ÕIGSUS:
   - Põhiline vastus + 1-2 lubatud varianti
   - Aeg-subjekt-verb on fikseeritud
   - Objekt ja koht võivad vahetuda kui grammatiliselt õige

2. SÕNADE TÄPSUS JA SEGAMINE (KRIITILINE):
   - Kasuta AINULT sõnu, mis on õiges vastuses
   - Ära lisa ühtegi ekstra sõna või vale vorm
   - Näide: kui vastus on "Homme õpilased õpivad koolis" → options: ["homme", "õpilased", "õpivad", "koolis"]
   - Sega need sõnad juhuslikult järjestuses
   - Kontrolli et iga sõna on täpselt sama kui vastuses

3. REALISTLIKUD LAUSED:
   - Igapäevased situatsioonid
   - Loomulikud verbid ja kontekstid
   - Mitte absurdsed kombinatsioonid

4. TASEME SOBIVUS (${cefrLevel}):
   - A1-A2: Lihtsad 4-5 sõna laused
   - B1-B2: Keskmised 5-6 sõna koos adverbidega  
   - C1-C2: Keerukad 6-8 sõna koos kõrvallausetega

JSON FORMAAT:
{"questions":[
  {
    "question": "Järjesta sõnad õigesti:",
    "translation": "[täpne hispaaniakeelne tõlge]",
    "options": ["sõna1", "sõna2", "sõna3", "sõna4", "sõna5", "sõna6"],
    "correctAnswer": "[Põhiline õige vastus täpse punktuatsiooniga]",
    "alternativeAnswers": ["[Alternatiivne õige vastus]", "[Teine variant kui on]"],
    "explanation": "[Lühike selgitus sõnajärje reegli kohta]",
    "questionType": "sentence_reordering"
  }
]}

PUNKTUATSIOONI REEGLID:
- A1-A2: "Sõna1 sõna2 sõna3."
- B1-B2: "Sõna1, sõna2 sõna3."  
- C1-C2: "Sõna1, sõna2, sõna3 ja sõna4."

KRIITILISED KONTROLLID:
1. Kontrolli et options sisaldab AINULT correctAnswer sõnu
2. Ära kasuta sõnu mis ei ole vastuses
3. Näide vigane: vastus "homme õpilased" kuid options ["homses", "õpilased"] → VALE
4. Näide õige: vastus "homme õpilased" ja options ["homme", "õpilased"] → ÕIGE`,

      answerStructure: "wordReordering",
      maxTokens: 950
    };
  }

  private getErrorDetectionQuizSystem(cefrLevel: string) {
    return {
      systemPersonality: `Eres un profesor especializado EN CORRECCIÓN DE ERRORES ESTONIOS con experiencia en errores típicos de hispanohablantes.

TU MISIÓN ESPECÍFICA: Crear ejercicios de detección de errores que identifiquen mistakes reales en estonio para nivel ${cefrLevel}.

PERSONALIDAD DEL PROFESOR DE CORRECCIÓN:
- Experto en errores gramaticales típicos de estudiantes
- Especialista en mistakes comunes español→estonio
- Conoce errores específicos por nivel CEFR
- Enfocado en corrección pedagógica

TIPOS DE ERRORES REALES QUE CREAS:
- Error de caso: "Ma näen kass" → debería ser "kassi" 
- Error de verbo: "Me läheb" → debería ser "läheme"  
- Error de plural: "kolm kass" → debería ser "kolme kassi"
- Error de tiempo: "Eile ma lähen" → debería ser "läksin"
- Error de modo: "Ma arvan, et ta tuleb" (indicativo correcto) vs "Ma arvan, et ta tuleks" (condicional incorrecto)

ESTRUCTURAS CORRECTAS (NO MARCAR COMO ERRORES):
✓ "maja aknast" - caso elativo correcto
✓ "mida ta ostis" - pronombre relativo correcto  
✓ "Me näeme suur maja" - orden correcto
✓ "oleks sattunud" - condicional perfecto correcto en contexto hipotético
✓ "kui ta oleks tulnud" - condicional en cláusula condicional
✓ "milles ta kunagi oleks" - uso correcto del condicional

REGLA CRÍTICA PARA EXPLICACIONES:
- TODAS las explicaciones deben estar en ESPAÑOL únicamente
- NUNCA uses palabras en estonio en las explicaciones
- SIEMPRE menciona la palabra correcta específica en la explicación
- Formato obligatorio: "Error de [tipo], debería ser '[palabra_correcta]'"
- Máximo 12 palabras en español por explicación
- PROHIBIDO: explicaciones vagas como "pronombre incorrecto"
- OBLIGATORIO: mencionar la palabra exacta que debería usarse

NIVEL ${cefrLevel} ERRORES:
${this.getCefrGuidanceForErrorDetection(cefrLevel)}`,

      userPrompt: `Crear 5 ejercicios de detección de errores estonios reales para nivel ${cefrLevel}.

INSTRUCCIONES ESPECÍFICAS PARA DETECCIÓN DE ERRORES:
- Cada oración debe contener UN error gramatical real y obvio
- Error debe ser pedagógicamente útil para nivel ${cefrLevel}
- Crear errores auténticos, no inventados
- Palabras como opciones para identificar el error
- En las explicaciones SIEMPRE incluir la palabra correcta específica
- NO usar explicaciones vagas, mencionar la forma exacta correcta

FORMATO JSON DETECCIÓN DE ERRORES:
{"questions":[
  {
    "question": "Leia lause seast grammatiline viga: [oración_con_error_real]",
    "translation": "[traducción de oración con error]",
    "options": ["palabra1", "palabra2", "palabra3", "palabra4"],
    "correctAnswer": "[palabra que contiene el error]",
    "explanation": "Error de [tipo], debería ser '[palabra_exacta]' ([razón_breve])",
    "questionType": "error_detection",
    "errorType": "[caso/verbo/plural/tiempo]"
  }
]}

EJEMPLOS DE EXPLICACIONES CORRECTAS EN ESPAÑOL:
✓ "Error de caso, debería ser 'kassi' (partitivo)"
✓ "Error de verbo, debería ser 'läheme' (primera persona)"
✓ "Error de tiempo, debería ser 'läksin' (pasado)"
✓ "Error de número, debería ser 'kolme kassi' (plural)"
✓ "Error de caso, debería ser 'linna' (illativo)"
✓ "Error de pronombre, debería ser 'keda' (acusativo)"

EJEMPLOS PROHIBIDOS (demasiado vagos):
✗ "Pronombre relativo incorrecto en contexto"
✗ "Error de tiempo verbal"
✗ "Caso incorrecto"
✗ Cualquier explicación sin la palabra correcta específica

EJEMPLOS PROHIBIDOS (NUNCA USAR):
✗ "Kaudne kõneviis vale tuleviku korral"
✗ "'Oleks' vale kõneviis ajas, peaks olema"
✗ "Tingiv kõneviis vale"
✗ Cualquier palabra en estonio en las explicaciones`,

      answerStructure: "errorIdentification", // Seleccionar palabra errónea
      maxTokens: 1000
    };
  }

  // ISOLATED QUIZ PROMPTS - No connection to chat system
  private getIsolatedQuizPrompts(category: string, cefrLevel: string) {
    switch(category) {
      case "vocabulary":
        const vocabSystem = this.getVocabularyQuizSystem(cefrLevel);
        return {
          system: vocabSystem.systemPersonality,
          user: vocabSystem.userPrompt,
          maxTokens: vocabSystem.maxTokens
        };
      
      case "grammar":
        const grammarSystem = this.getGrammarQuizSystem(cefrLevel);
        return {
          system: grammarSystem.systemPersonality,
          user: grammarSystem.userPrompt,
          maxTokens: grammarSystem.maxTokens
        };
      
      case "conjugation":
        const conjugationSystem = this.getConjugationQuizSystem(cefrLevel);
        return {
          system: conjugationSystem.systemPersonality,
          user: conjugationSystem.userPrompt,
          maxTokens: conjugationSystem.maxTokens
        };
      
      case "sentence_reordering":
        const reorderingSystem = this.getSentenceReorderingQuizSystem(cefrLevel);
        return {
          system: reorderingSystem.systemPersonality,
          user: reorderingSystem.userPrompt,
          maxTokens: reorderingSystem.maxTokens
        };
      
      case "error_detection":
        const errorSystem = this.getErrorDetectionQuizSystem(cefrLevel);
        return {
          system: errorSystem.systemPersonality,
          user: errorSystem.userPrompt,
          maxTokens: errorSystem.maxTokens
        };
      
      default:
        return {
          system: `Create 5 Estonian questions (${cefrLevel}). Questions in Estonian, explanations in Spanish. JSON format only.`,
          user: `5 questions with options, correct answer, explanation.`,
          maxTokens: 700
        };
    }
  }

  private getCefrGuidanceForErrorDetection(cefrLevel: string): string {
    switch (cefrLevel) {
      case "A1":
        return `A1 Level - Basic Estonian errors:
- Present tense verb mistakes (*olen* vs *oled*)
- Basic nominative/partitive case confusion
- Simple word order errors (SVO)
- Basic adjective agreement
Use simple daily vocabulary, short sentences.`;
      
      case "A2":
        return `A2 Level - Elementary Estonian errors:
- Past tense (*lihtminevik*) mistakes
- Basic case system (nominative, genitive, partitive, illative)
- Plural forms (*tore/toredad*, *head/head*)
- Modal verb constructions (*saama*, *tahtma*)
Use everyday vocabulary, moderate sentence complexity.`;
      
      case "B1":
        return `B1 Level - Intermediate Estonian errors:
- All 14 cases in basic contexts
- Perfect tense (*täisminevik*) mistakes
- Basic consonant gradation patterns
- Subordinate clause structure errors
Use intermediate vocabulary, varied sentence structures.`;
      
      case "B2":
        return `B2 Level - Upper-intermediate Estonian errors:
- Complex case usage in advanced contexts
- Conditional mood (*tingiv kõneviis*) mistakes
- Advanced consonant gradation errors
- Passive voice constructions
Use sophisticated vocabulary, complex sentence patterns.`;
      
      case "C1":
        return `C1 Level - Advanced Estonian errors:
- Quotative mood (*kaudne kõneviis*) mistakes
- Subtle case distinctions in complex contexts
- Advanced aspectual and temporal nuances
- Sophisticated discourse structures
Use advanced vocabulary, intricate grammatical patterns.`;
      
      case "C2":
        return `C2 Level - Mastery-level Estonian errors:
- Native-like stylistic distinctions
- Complex idiomatic constructions
- Subtle semantic case relationships
- Advanced discourse markers
Use sophisticated vocabulary, native-level complexity.`;
      
      default:
        return `B1 Level - Standard intermediate errors focusing on case system and verb conjugations.`;
    }
  }
}

export const openaiService = new OpenAIService();
