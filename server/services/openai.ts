import OpenAI from "openai";
import { estonianCorpus } from "./estonianCorpus";
import { createProfessor } from "./professors";
import { estonianValidator } from "./estonianValidator";

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
    type: "multiple_choice" | "fill_blank" | "sentence_reordering" | "error_detection";
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
        max_tokens: 400
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
      // Get corpus knowledge
      const corpusKnowledge = this.getCorpusKnowledge(currentCEFRLevel);
      
      // Create chat professor
      const professor = createProfessor('chat', currentCEFRLevel, corpusKnowledge, mode);
      const config = professor.getProfessor();
      
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `${config.systemPrompt}

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
        temperature: config.settings.temperature,
        top_p: config.settings.topP,
        presence_penalty: config.settings.presencePenalty,
        frequency_penalty: config.settings.frequencyPenalty,
        max_tokens: config.settings.maxTokens,
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

  // SPECIALIZED QUIZ GENERATION WITH HARDCODED PATTERNS
  async generateQuiz(cefrLevel: string, category?: string): Promise<QuizGeneration> {
    try {
      console.log(`🎓 Activating ${category?.toUpperCase() || 'VOCABULARY'} Professor for CEFR level ${cefrLevel}`);
      
      // Use direct generation for instant quiz creation
      console.log(`⚡ Using direct hardcoded generation for instant quiz creation`);
      
      // Get corpus knowledge
      const corpusKnowledge = this.getCorpusKnowledge(cefrLevel);
      
      // Create specialized professor
      const professor = createProfessor(category || 'vocabulary', cefrLevel, corpusKnowledge);
      
      // Check if professor has direct generation method
      if (typeof (professor as any).generateDirectQuestions === 'function') {
        const startTime = Date.now();
        const result = (professor as any).generateDirectQuestions();
        const endTime = Date.now();
        
        console.log(`⚡ Direct generation completed in ${endTime - startTime}ms`);
        console.log(`✅ Generated ${result.questions.length} ${category} questions instantly`);
        
        return { questions: result.questions };
      }
      
      // Fallback to AI generation if direct method not available
      const config = professor.getProfessor();
      
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: config.systemPrompt
          },
          {
            role: "user",
            content: config.userPrompt
          }
        ],
        temperature: config.settings.temperature,
        top_p: config.settings.topP,
        frequency_penalty: config.settings.frequencyPenalty,
        presence_penalty: config.settings.presencePenalty,
        max_tokens: config.settings.maxTokens,
        response_format: { type: "json_object" }
      });

      const endTime = Date.now();
      console.log(`⚡ ${config.name} generated quiz in ${endTime - startTime}ms with gpt-4.1`);
      
      const content = response.choices[0].message.content || "{}";
      try {
        // Clean response to remove markdown code blocks if present
        let cleanContent = content.replace(/^```json\s*\n?/g, '').replace(/\n?```$/g, '').trim();
        
        // Fix common JSON issues for error detection category
        if (category === 'error_detection') {
          // Remove any trailing incomplete content after last complete object
          const lastBraceIndex = cleanContent.lastIndexOf('}');
          if (lastBraceIndex !== -1 && lastBraceIndex < cleanContent.length - 1) {
            cleanContent = cleanContent.substring(0, lastBraceIndex + 1);
          }
          
          // Clean up trailing commas and incomplete arrays
          cleanContent = cleanContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          
          console.log(`🔧 Cleaned error_detection content (${cleanContent.length} chars)`);
        }
        
        const result = JSON.parse(cleanContent);
        
        // Validate that we got actual questions from AI professor
        if (result.questions && result.questions.length > 0) {
          console.log(`✅ ${config.name} generated ${result.questions.length} quiz questions`);
          console.log(`🔍 First question preview:`, JSON.stringify(result.questions[0], null, 2));
          
          // Skip complex validation for faster generation
          console.log(`⚡ Generated ${result.questions.length} ${category} questions - skipping validation for speed`);
          
          // Add cefrLevel to each question for database requirements
          const questionsWithLevel = result.questions.map((q: any) => ({
            ...q,
            cefrLevel: cefrLevel
          }));
          
          return { questions: questionsWithLevel };
        } else {
          throw new Error(`${config.name} generated no questions`);
        }
      } catch (parseError) {
        console.error(`❌ ${config.name} JSON parsing failed:`, parseError);
        console.error("Raw content length:", content.length);
        console.error("Raw content preview:", content.substring(0, 500) + "...");
        console.error("Temperature used:", config.settings.temperature);
        console.error("MaxTokens used:", config.settings.maxTokens);
        
        // Try to salvage partial JSON for any category
        console.log(`🔧 Attempting to salvage JSON for ${category}...`);
        try {
          // Clean up common JSON issues
          let fixedContent = content;
          
          // Remove trailing commas
          fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1');
          
          // If truncated, try to find the last complete question
          if (!fixedContent.trim().endsWith('}')) {
            const lastCompleteQuestion = fixedContent.lastIndexOf('},{');
            if (lastCompleteQuestion !== -1) {
              // Keep everything up to the last complete question and close properly
              fixedContent = fixedContent.substring(0, lastCompleteQuestion) + '}]}';
              console.log(`🔧 Truncated to last complete question`);
            } else {
              // Try to find at least one complete question
              const questionsStart = fixedContent.indexOf('"questions":[{');
              const firstQuestionEnd = fixedContent.indexOf('}', questionsStart);
              if (questionsStart !== -1 && firstQuestionEnd !== -1) {
                fixedContent = fixedContent.substring(0, questionsStart) + 
                             '"questions":[' + 
                             fixedContent.substring(questionsStart + 14, firstQuestionEnd + 1) + 
                             ']}';
                console.log(`🔧 Salvaged single question`);
              }
            }
          }
          
          // Try to add missing closing braces
          let braceCount = (fixedContent.match(/{/g) || []).length - (fixedContent.match(/}/g) || []).length;
          while (braceCount > 0) {
            fixedContent += '}';
            braceCount--;
          }
          
          // Try parsing the fixed content
          const salvageResult = JSON.parse(fixedContent);
          if (salvageResult.questions && salvageResult.questions.length > 0) {
            console.log(`✅ Salvaged ${salvageResult.questions.length} questions from truncated JSON`);
            
            // Validate question structure and add missing fields
            const questionsWithLevel = salvageResult.questions.map((q: any) => ({
              question: q.question || "Quiz question missing",
              type: q.type || "multiple_choice",
              options: q.options || ["opción 1", "opción 2", "opción 3", "opción 4"],
              correctAnswer: q.correctAnswer || "opción 1",
              explanation: q.explanation || "Explicación no disponible",
              cefrLevel: cefrLevel
            }));
            
            return { questions: questionsWithLevel };
          }
        } catch (salvageError) {
          console.error("Salvage attempt failed:", salvageError);
        }
        
        // If all else fails, return a fallback quiz
        console.log(`❌ All parsing attempts failed, returning fallback quiz for ${category}`);
        return {
          questions: [{
            question: "Quiz temporalmente no disponible",
            type: "multiple_choice",
            options: ["Reintentar", "Seleccionar otro tipo", "Continuar", "Regresar"],
            correctAnswer: "Reintentar",
            explanation: "El sistema está generando un nuevo quiz. Por favor intenta de nuevo.",
            cefrLevel: cefrLevel
          }]
        };
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      throw new Error("Failed to generate quiz");
    }
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















  /**
   * Helper methods for specialized content
   */
  private getCasesForLevel(cefrLevel: string): string {
    const cases = {
      A1: "nominativo básico (ma olen), partitivo simple (ma söön leiba)",
      A2: "nominativo, partitivo, genitivo (posesión minu/sinu), ilativo básico (kooli/koju)",
      B1: "6 casos locales: ilativo, inessivo, elativo (kooli/koolis/koolist) + allativo, adessivo, ablativo",
      B2: "los 14 casos estonios: 3 estructurales + 6 locales + 5 semánticos (translativo, terminativo, esivo, abessivo, komitativo)",
      C1: "uso avanzado de todos los 14 casos en contextos académicos y profesionales complejos",
      C2: "dominio completo de matices estilísticos y registros especializados (nivel no evaluado oficialmente)"
    };
    return cases[cefrLevel as keyof typeof cases] || cases.B1;
  }

  private getVerbsForLevel(cefrLevel: string): string {
    const verbs = {
      A1: "olema (olen/oled/on), minema (lähen/lähed/läheb), tulema (tulen/tuled/tuleb), tegema (teen/teed/teeb)",
      A2: "söõma, jõõma, magama, ütlema, vaatama, kuulama, ostma, andma, võtma",
      B1: "rääkima, õppima, töötama, elama, mängima, lugema, kirjutama, mõistma, aitama",
      B2: "analüüsima, uurima, võrdlema, selgitama, arendama, planeerima, organiseerima",
      C1: "kontseptualiseerima, sünteetisema, problematiseerima, argumenteerima, interpreteerima",
      C2: "nivel no evaluado oficialmente en Estonia (solo hasta C1)"
    };
    return verbs[cefrLevel as keyof typeof verbs] || verbs.B1;
  }

  private getSentencePatternsForLevel(cefrLevel: string): string {
    const patterns = {
      A1: "SVO básico: Ma lähen kooli. Ta tuleb koju. Ma söön leiba.",
      A2: "Tiempo + SVO: Täna ma lähen tööle. Eile ta tuli koju. Homme me sõidame.",
      B1: "Adverbios + objetos: Ta räägib hästi eesti keelt. Me ostame poest toitu.",
      B2: "Estructuras académicas: Professor seletas täna uut teemat. Õpilased analüüsivad teksti.",
      C1: "Construcciones complejas: Eksperdid analüüsivad süstemaatiliselt probleeme akadeemilises kontekstis.",
      C2: "nivel no evaluado oficialmente en Estonia (solo hasta C1)"
    };
    return patterns[cefrLevel as keyof typeof patterns] || patterns.B1;
  }

  private getTypicalErrorsForLevel(cefrLevel: string): string {
    const errors = {
      A1: "confusión nominativo/partitivo: *Ma joon piima (correcto: piim), *Ma söön leiv (correcto: leiba)",
      A2: "caso genitivo mal aplicado: *see on mina raamat (correcto: minu), *ma lähen koolis (correcto: kooli)",
      B1: "confusión de casos locales: *Ma elan Tallinna (correcto: Tallinnas), *Ta tuleb koolis (correcto: koolist)",
      B2: "concordancia adjetival: *suured maja (correcto: suured majad), *vana autoga (correcto: vana autoga)",
      C1: "casos complejos en contexto académico: errores sutiles en terminativo, esivo, komitativo según contexto profesional",
      C2: "nivel no evaluado oficialmente en Estonia (solo hasta C1)"
    };
    return errors[cefrLevel as keyof typeof errors] || errors.B1;
  }

  /**
   * Generate realistic options for error detection questions
   */
  private generateOptionsForError(error: any): string[] {
    const words = error.errorSentence.split(' ');
    const options = [error.errorWord];
    
    // Add other words from the sentence as distractors
    words.forEach((word: string) => {
      if (word !== error.errorWord && options.length < 4) {
        options.push(word);
      }
    });
    
    // Pad with common Estonian words if needed
    const commonWords = ['ja', 'on', 'ei', 'või', 'see', 'ta'];
    commonWords.forEach(word => {
      if (options.length < 4 && !options.includes(word)) {
        options.push(word);
      }
    });
    
    // Shuffle options
    return this.shuffleArray(options);
  }

  private shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get Estonian corpus knowledge for AI prompts
   */
  private getCorpusKnowledge(cefrLevel: string): string {
    const vocabulary = estonianCorpus.getVocabularyByLevel(cefrLevel);
    const sentences = estonianCorpus.getSentencesByLevel(cefrLevel);
    const grammarExamples = estonianCorpus.generateGrammarExamples("case_system", cefrLevel);

    return `
AUTHENTIC ESTONIAN PATTERNS (${cefrLevel} level):
- Vocabulary: ${vocabulary.slice(0, 10).join(", ")}
- Sample structures: ${sentences.slice(0, 2).map(s => `"${s.text}"`).join(", ")}
- Grammar patterns: ${grammarExamples.slice(0, 3).join(", ")}
- Word order: Follow Estonian SVO with flexible adverb placement
- Morphology: Use authentic case endings from corpus data

CRITICAL ERROR DETECTION GUIDANCE:
IGNORE the correct examples above. For error detection exercises, you MUST create sentences with ACTUAL GRAMMATICAL ERRORS that Spanish speakers commonly make when learning Estonian.`;
  }

  /**
   * Get realistic Estonian errors with corrections for error detection
   */
  private getCommonEstonianErrors(cefrLevel: string): string {
    const errorPairs = {
      A1: [
        { wrong: "Ma joon piima", correct: "Ma joon piim", error: "piima", explanation: "Objeto directo debe ser nominativo" },
        { wrong: "Ta lähen kooli", correct: "Ta läheb kooli", error: "lähen", explanation: "Tercera persona es 'läheb'" },
        { wrong: "Me olen kodus", correct: "Ma olen kodus", error: "Me", explanation: "Primera persona singular es 'Ma'" }
      ],
      A2: [
        { wrong: "Ma söön leiva", correct: "Ma söön leiba", error: "leiva", explanation: "Partitivo para objetos parciales" },
        { wrong: "See on mina raamat", correct: "See on minu raamat", error: "mina", explanation: "Genitivo para posesión" },
        { wrong: "Ta tuleb koolist koju", correct: "Ta tuleb koolist koju", error: "none", explanation: "Actually correct - bad example" }
      ],
      B1: [
        { wrong: "Ma elan Tallinna", correct: "Ma elan Tallinnas", error: "Tallinna", explanation: "Inessivo para ubicación" },
        { wrong: "Ta ootab bussis", correct: "Ta ootab bussi", error: "bussis", explanation: "Partitivo para objeto esperado" },
        { wrong: "Me läheme koolis", correct: "Me läheme kooli", error: "koolis", explanation: "Ilativo para dirección" }
      ]
    };
    
    const levelErrors = errorPairs[cefrLevel as keyof typeof errorPairs] || errorPairs.A2;
    return levelErrors.map(e => `WRONG: "${e.wrong}" → CORRECT: "${e.correct}" (ERROR WORD: "${e.error}" - ${e.explanation})`).join("\n");
  }



  private getCefrSentenceLengthGuidance(cefrLevel: string): string {
    switch (cefrLevel) {
      case "A1":
        return `A1 Level - 3-4 sõna laused:
- Lihtsad SVO: "Ma lähen kooli"
- Aeg + SVO: "Täna ma söön"
- 70% chance: 3 sõna, 30% chance: 4 sõna`;
      
      case "A2":
        return `A2 Level - 4-5 sõna laused:
- Põhilised adverbid: "Ma lähen kiiresti kooli"
- Lihtne aeg/koht: "Eile ma sõin kodus"
- 60% chance: 4 sõna, 40% chance: 5 sõna`;
      
      case "B1":
        return `B1 Level - 4-6 sõna laused:
- Objekti variandid: "Ta ostis poest toitu"
- Adverbiaalsed määrused: "Me õpime ülikoolis eesti keelt"
- 40% chance: 4-5 sõna, 60% chance: 5-6 sõna`;
      
      case "B2":
        return `B2 Level - 5-6 sõna laused:
- Keerukamad struktuurid: "Tudengid arutasid aktiivselt kultuurilisi teemasid"
- Mitme määruse kasutamine: "Professor seletas täna ülikoolis grammatikat"
- 30% chance: 5 sõna, 70% chance: 6 sõna`;
      
      case "C1":
        return `C1 Level - 5-7 sõna laused:
- Akadeemilised teemad: "Eksperdid arutlevad sageli keeruliste küsimuste üle"
- Täpsemad väljendid: "Professor analüüsis põhjalikult kirjanduse näiteid"
- 20% chance: 5 sõna, 50% chance: 6 sõna, 30% chance: 7 sõna`;
      
      case "C2":
        return `C2 Level - 6-8 sõna laused:
- Kõrgetasemelised väljendid: "Akadeemikud diskuteerivad intensiivselt filosoofiliste kontseptsioonide üle"
- Keerukad struktuurid: "Kirjanikud käsitlesid sügavalt ühiskondlikke probleeme oma teostes"
- 10% chance: 6 sõna, 60% chance: 7 sõna, 30% chance: 8 sõna`;
      
      default:
        return `B1 Level - 4-6 sõna laused (standard)`;
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
