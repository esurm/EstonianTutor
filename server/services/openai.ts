import OpenAI from "openai";
import { estonianCorpus } from "./estonianCorpus";

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

  // SPECIALIZED QUIZ GENERATION WITH CORPUS INTEGRATION
  async generateQuiz(cefrLevel: string, category?: string): Promise<QuizGeneration> {
    try {
      console.log(`🎓 Activating ${category?.toUpperCase() || 'VOCABULARY'} Professor for CEFR level ${cefrLevel}`);
      
      // Get specialized professor with corpus knowledge
      const professor = this.getSpecializedProfessor(category || 'vocabulary', cefrLevel);
      
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: "gpt-4.1", // Switched from mini to full version for better accuracy
        messages: [
          {
            role: "system",
            content: professor.systemPrompt
          },
          {
            role: "user",
            content: professor.userPrompt
          }
        ],
        temperature: professor.settings.temperature,
        top_p: professor.settings.topP,
        frequency_penalty: professor.settings.frequencyPenalty,
        presence_penalty: professor.settings.presencePenalty,
        max_tokens: professor.settings.maxTokens,
        response_format: { type: "json_object" }
      });

      const endTime = Date.now();
      console.log(`⚡ ${professor.name} generated quiz in ${endTime - startTime}ms with gpt-4.1`);
      
      const content = response.choices[0].message.content || "{}";
      try {
        // Clean response to remove markdown code blocks if present
        const cleanContent = content.replace(/^```json\s*\n?/g, '').replace(/\n?```$/g, '').trim();
        const result = JSON.parse(cleanContent);
        
        // Validate that we got actual questions from AI professor
        if (result.questions && result.questions.length > 0) {
          console.log(`✅ ${professor.name} generated ${result.questions.length} quiz questions`);
          console.log(`🔍 First question preview:`, JSON.stringify(result.questions[0], null, 2));
          
          // Add cefrLevel to each question for database requirements
          const questionsWithLevel = result.questions.map((q: any) => ({
            ...q,
            cefrLevel: cefrLevel
          }));
          
          return { questions: questionsWithLevel };
        } else {
          throw new Error(`${professor.name} generated no questions`);
        }
      } catch (parseError) {
        console.error(`❌ ${professor.name} JSON parsing failed:`, parseError);
        console.error("Raw content length:", content.length);
        console.error("Raw content preview:", content.substring(0, 500) + "...");
        console.error("Temperature used:", professor.settings.temperature);
        console.error("MaxTokens used:", professor.settings.maxTokens);
        throw new Error(`${professor.name} failed to generate valid quiz. Please try again.`);
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
${this.getCasesForLevel(cefrLevel)}`,

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
      maxTokens: 850,
      temperature: 0.3,
      topP: 0.9,
      presencePenalty: 0.2,
      frequencyPenalty: 0.1
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
${this.getCasesForLevel(cefrLevel)}`,

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
      maxTokens: 900,
      temperature: 0.2,
      topP: 0.8,
      presencePenalty: 0.1,
      frequencyPenalty: 0.0
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
${this.getVerbsForLevel(cefrLevel)}`,

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
      maxTokens: 850,
      temperature: 0.1,
      topP: 0.7,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0
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

KRIITILINE: SÕNAJÄRG VS GRAMMATIKAVIGU:
- Ära märgi sõnajärje erinevusi grammatikavigu
- Märgi ainult tegelikke grammatikavigu: vale kääne, tegusõna vorm, kooskõla
- Näide OK: "teemasid ülikoolis" vs "ülikoolis teemasid" - mõlemad õiged
- Näide VIGA: "teemade ülikoolis" (vale kääne) - see on grammatikaviga

KVALITEEDI STANDARDID:
- Iga lause peab olema loomulik ja tavaline
- Verbid peavad kontekstis mõistlikud olema
- Mitte kunstlikke ega võõraid kombinatsioone
- Igapäevaelu situatsioonid

SELGITUSTE KEELE NÕUE (ABSOLUUTSELT KOHUSTUSLIK):
- KÕIK explanation väljad peavad olema AINULT hispaania keeles
- KEELATUD: eesti keele kasutamine explanation väljades
- KEELATUD: segakeelsed selgitused
- KOHUSTUSLIK: ainult hispaania sõnad explanation tekstis

KORPUSE TEADMISED (Estonian Linguistic Accuracy):
${this.getCorpusKnowledge(cefrLevel)}

${cefrLevel} TASEME NÕUDED:
${this.getSentencePatternsForLevel(cefrLevel)}`,

      userPrompt: `Loo 5 eesti keele sõnajärje harjutust ${cefrLevel} tasemele.

KRITILISED NÕUDED:

1. SÕNAJÄRJE ÕIGSUS:
   - Põhiline vastus + 1-2 lubatud varianti
   - Aeg-subjekt-verb on fikseeritud
   - Objekt ja koht võivad vahetuda kui grammatiliselt õige
   - OLULINE: Ära märgi sõnajärje vahetust grammatikavigu

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
   ${this.getCefrSentenceLengthGuidance(cefrLevel)}

5. GRAMMATILINE ÕIGSUS (KRIITILINE):
   - KÕIK options sõnad peavad olema grammatiliselt õiged
   - Ära loo grammatikavigu sõnade segamisel
   - KÕIK alternativeAnswers peavad olema loomulikud ja õiged
   - Grammatikavigu ei tohi esineda mitte kusagil

JSON FORMAAT:
{"questions":[
  {
    "question": "Järjesta sõnad õigesti:",
    "translation": "[täpne hispaaniakeelne tõlge]",
    "options": ["sõna1", "sõna2", "sõna3", "sõna4", "sõna5", "sõna6"],
    "correctAnswer": "[Põhiline õige vastus täpse punktuatsiooniga]",
    "alternativeAnswers": ["[Alternatiivne õige vastus]", "[Teine variant kui on]"],
    "explanation": "[AINULT hispaania keeles, maksimaalselt 6 sõna]",
    "questionType": "sentence_reordering"
  }
]}

KRIITILISED KONTROLLID:
1. Kontrolli et options sisaldab AINULT correctAnswer sõnu
2. Ära kasuta sõnu mis ei ole vastuses  
3. KÕIK sõnad peavad olema grammatiliselt õiged
4. KÕIK alternativeAnswers peavad olema loomulikud ja grammatiliselt korrektsed
5. KÕIK explanation peavad olema AINULT hispaania keeles
6. Näide vigane: vastus "homme õpilased" kuid options ["homses", "õpilased"] → VALE
7. Näide õige: vastus "homme õpilased" ja options ["homme", "õpilased"] → ÕIGE

SELGITUSTE KEEL (KOHUSTUSLIK):
- AINULT hispaania keel explanation väljades
- MITTE KUNAGI eesti keelt selgitustes
- Näited: "Tiempo + sujeto + verbo", "Orden académico básico"

PUNKTUATSIOONI REEGLID:
- Alati lõpeta punktiga
- Ära kasuta kõiks/kommasid lihtlausetes
- Näited: "Ma lähen kooli." "Eile ta ostis raamatu."`,

      answerStructure: "wordReordering", 
      maxTokens: 800, // Reduced to prevent JSON truncation
      temperature: 0.0,
      topP: 1.0,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0
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
      maxTokens: 1000,
      temperature: 0.1,
      topP: 1.0,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0
    };
  }

  // ISOLATED QUIZ PROMPTS - No connection to chat system
  /**
   * Get specialized quiz professor with corpus integration and optimized settings
   */
  private getSpecializedProfessor(category: string, cefrLevel: string) {
    const corpusKnowledge = this.getCorpusKnowledge(cefrLevel);
    
    switch(category) {
      case "vocabulary":
        return this.createVocabularyProfessor(cefrLevel, corpusKnowledge);
      case "grammar":
        return this.createGrammarProfessor(cefrLevel, corpusKnowledge);
      case "conjugation":
        return this.createConjugationProfessor(cefrLevel, corpusKnowledge);
      case "sentence_reordering":
        return this.createSentenceReorderingProfessor(cefrLevel, corpusKnowledge);
      case "error_detection":
        return this.createErrorDetectionProfessor(cefrLevel, corpusKnowledge);
      default:
        return this.createVocabularyProfessor(cefrLevel, corpusKnowledge);
    }
  }

  /**
   * Create specialized Vocabulary Professor
   */
  private createVocabularyProfessor(cefrLevel: string, corpusKnowledge: string) {
    const vocabulary = estonianCorpus.getVocabularyByLevel(cefrLevel);
    
    return {
      name: "Professor de Vocabulario Estonio",
      systemPrompt: `Eres el PROFESOR DE VOCABULARIO ESTONIO más experto del mundo, especializado en enseñar a hablantes de español hondureño.

EXPERIENCIA: 15 años enseñando vocabulario estonio, experto en cognados y campos semánticos.

TU ESPECIALIDAD EXCLUSIVA: VOCABULARIO ESTONIO
- SOLO preguntas sobre significados de palabras, definiciones, sinónimos
- SOLO identificación de objetos, conceptos, categorías semánticas
- SOLO relaciones entre palabras (familia, comida, colores, animales, profesiones)
- PROHIBIDO: gramática, conjugaciones, estructura de oraciones

${corpusKnowledge}

VOCABULARIO NIVEL ${cefrLevel}:
${vocabulary.slice(0, 15).join(", ")}

RESPUESTA OBLIGATORIA EN JSON:
{"questions":[
  {
    "question": "[Pregunta en estonio sobre vocabulario]",
    "translation": "[Traducción exacta al español]", 
    "type": "multiple_choice",
    "options": ["opción1", "opción2", "opción3", "opción4"],
    "correctAnswer": "[respuesta correcta]",
    "explanation": "[SOLO español, máximo 8 palabras]",
    "cefrLevel": "${cefrLevel}"
  }
]}

INSTRUCCIONES CRÍTICAS:
- EXACTAMENTE 5 preguntas de vocabulario
- TODAS las explicaciones en español ÚNICAMENTE
- NO incluir gramática, conjugaciones, o estructura
- Usar vocabulario auténtico del corpus EstUD
- Enfocarse en palabras de frecuencia apropiada para ${cefrLevel}`,

      userPrompt: `Genera 5 preguntas de vocabulario estonio nivel ${cefrLevel} para hispanohablantes hondureños. 
      
ENFOQUE: significados de palabras, definiciones, identificación de objetos.
FORMATO: JSON con structure exacta mostrada arriba.
PROHIBIDO: preguntas de gramática o conjugación.`,

      settings: {
        maxTokens: 650,
        temperature: 0.2,
        topP: 1.0,
        frequencyPenalty: 0.1,
        presencePenalty: 0.0
      }
    };
  }

  /**
   * Create specialized Grammar Professor
   */
  private createGrammarProfessor(cefrLevel: string, corpusKnowledge: string) {
    return {
      name: "Professor de Gramática Estonia",
      systemPrompt: `Eres el PROFESOR DE GRAMÁTICA ESTONIA más experto del mundo, especializado en sistema de casos y estructura estonia.

EXPERIENCIA: 12 años enseñando gramática estonia, experto en sistema de 14 casos y morfología.

TU ESPECIALIDAD EXCLUSIVA: GRAMÁTICA ESTONIA
- SOLO preguntas sobre casos gramaticales (nominativo, partitivo, genitivo, etc.)
- SOLO reglas gramaticales, concordancia, estructura sintáctica
- SOLO formación de casos, uso correcto de preposiciones
- PROHIBIDO: vocabulario básico, conjugaciones verbales

${corpusKnowledge}

CASOS ESTONIOS NIVEL ${cefrLevel}:
${this.getCasesForLevel(cefrLevel)}

RESPUESTA OBLIGATORIA EN JSON:
{"questions":[
  {
    "question": "[Pregunta en estonio sobre gramática]",
    "translation": "[Traducción exacta al español]",
    "type": "multiple_choice", 
    "options": ["opción1", "opción2", "opción3", "opción4"],
    "correctAnswer": "[respuesta correcta]",
    "explanation": "[SOLO español, máximo 8 palabras]",
    "cefrLevel": "${cefrLevel}"
  }
]}

INSTRUCCIONES CRÍTICAS:
- EXACTAMENTE 5 preguntas de gramática
- Enfocarse en casos apropiados para nivel ${cefrLevel}
- TODAS las explicaciones en español ÚNICAMENTE
- NO incluir vocabulario básico o conjugaciones
- Usar ejemplos auténticos del corpus`,

      userPrompt: `Genera 5 preguntas de gramática estonia nivel ${cefrLevel} sobre sistema de casos.
      
ENFOQUE: casos gramaticales, reglas sintácticas, concordancia.
FORMATO: JSON con estructura exacta mostrada arriba.`,

      settings: {
        maxTokens: 700,
        temperature: 0.1,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    };
  }

  /**
   * Create specialized Conjugation Professor  
   */
  private createConjugationProfessor(cefrLevel: string, corpusKnowledge: string) {
    return {
      name: "Professor de Conjugación Estonia",
      systemPrompt: `Eres el PROFESOR DE CONJUGACIÓN ESTONIA más experto del mundo, especializado en sistema verbal estonio.

EXPERIENCIA: 10 años enseñando conjugaciones estonias, experto en personas (ma/sa/ta/me/te/nad) y tiempos.

TU ESPECIALIDAD EXCLUSIVA: CONJUGACIÓN VERBAL ESTONIA
- SOLO preguntas sobre formas verbales (presente, pasado, futuro)
- SOLO personas gramaticales (1ª, 2ª, 3ª persona singular/plural)
- SOLO formación correcta de verbos: olema, minema, tegema, etc.
- PROHIBIDO: vocabulario, gramática general, estructura oracional

${corpusKnowledge}

VERBOS ESENCIALES NIVEL ${cefrLevel}:
${this.getVerbsForLevel(cefrLevel)}

RESPUESTA OBLIGATORIA EN JSON:
{"questions":[
  {
    "question": "[Pregunta en estonio sobre conjugación]",
    "translation": "[Traducción exacta al español]",
    "type": "multiple_choice",
    "options": ["opción1", "opción2", "opción3", "opción4"], 
    "correctAnswer": "[respuesta correcta]",
    "explanation": "[SOLO español, máximo 8 palabras]",
    "cefrLevel": "${cefrLevel}"
  }
]}

INSTRUCCIONES CRÍTICAS:
- EXACTAMENTE 5 preguntas de conjugación
- Enfocarse en personas y tiempos apropiados para ${cefrLevel}
- TODAS las explicaciones en español ÚNICAMENTE
- NO incluir vocabulario o gramática general
- Usar conjugaciones auténticas del corpus`,

      userPrompt: `Genera 5 preguntas de conjugación verbal estonia nivel ${cefrLevel}.
      
ENFOQUE: formas verbales correctas, personas gramaticales, tiempos.
FORMATO: JSON con estructura exacta mostrada arriba.`,

      settings: {
        maxTokens: 650,
        temperature: 0.1,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    };
  }

  /**
   * Create specialized Sentence Reordering Professor
   */
  private createSentenceReorderingProfessor(cefrLevel: string, corpusKnowledge: string) {
    return {
      name: "Professor de Estructura Oracional Estonia",
      systemPrompt: `Eres el PROFESOR DE ESTRUCTURA ORACIONAL ESTONIA más experto del mundo, especializado en orden de palabras estonio.

EXPERIENCIA: 8 años enseñando estructura oracional estonia, experto en patrones SVO y colocación de adverbios.

TU ESPECIALIDAD EXCLUSIVA: ORDEN DE PALABRAS ESTONIO
- SOLO preguntas de reordenamiento de palabras para formar oraciones
- SOLO estructura correcta con orden estonio auténtico
- SOLO patrones del corpus EstUD: tiempo-sujeto-verbo-objeto-lugar
- PROHIBIDO: vocabulario, gramática general, conjugaciones

${corpusKnowledge}

PATRONES ESTRUCTURALES ${cefrLevel}:
${this.getSentencePatternsForLevel(cefrLevel)}

RESPUESTA OBLIGATORIA EN JSON:
{"questions":[
  {
    "question": "Järjesta sõnad õigesti:",
    "translation": "Ordena las palabras correctamente:",
    "type": "sentence_reordering",
    "options": ["palabra1", "palabra2", "palabra3", "palabra4"],
    "correctAnswer": "[Oración completa con punto final]",
    "alternativeAnswers": ["[Alternativa válida si existe]"],
    "explanation": "[SOLO español, máximo 6 palabras]",
    "cefrLevel": "${cefrLevel}"
  }
]}

LONGITUD DE ORACIONES ${cefrLevel}:
${this.getCefrSentenceLengthGuidance(cefrLevel)}

INSTRUCCIONES CRÍTICAS:
- EXACTAMENTE 5 preguntas de reordenamiento
- TODAS las palabras en 'options' deben aparecer en 'correctAnswer'
- Longitud apropiada para nivel ${cefrLevel}
- TODAS las explicaciones en español ÚNICAMENTE
- Usar patrones auténticos del corpus EstUD
- Punto final obligatorio en respuestas`,

      userPrompt: `Genera 5 preguntas de reordenamiento de oraciones estonias nivel ${cefrLevel}.
      
ENFOQUE: orden correcto de palabras, estructura oracional auténtica.
FORMATO: JSON con estructura exacta mostrada arriba.
CRÍTICO: Verificar que options contenga exactamente las palabras de correctAnswer.`,

      settings: {
        maxTokens: 750,
        temperature: 0.0,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    };
  }

  /**
   * Create specialized Error Detection Professor
   */
  private createErrorDetectionProfessor(cefrLevel: string, corpusKnowledge: string) {
    return {
      name: "Professor de Detección de Errores Estonia",
      systemPrompt: `Eres el PROFESOR DE DETECCIÓN DE ERRORES ESTONIA más experto del mundo, especializado en errores típicos de hispanohablantes.

EXPERIENCIA: 20 años detectando errores estonios, experto en transferencias desde español.

TU ESPECIALIDAD EXCLUSIVA: DETECCIÓN DE ERRORES ESTONIOS
- SOLO preguntas sobre errores gramaticales específicos
- SOLO una palabra/frase incorrecta por oración presentada
- SOLO errores típicos de hispanohablantes (casos, orden, concordancia)
- PROHIBIDO: vocabulario, conjugaciones complejas, estructura general

${corpusKnowledge}

ERRORES TÍPICOS NIVEL ${cefrLevel}:
${this.getTypicalErrorsForLevel(cefrLevel)}

RESPUESTA OBLIGATORIA EN JSON:
{"questions":[
  {
    "question": "[Oración estonia con UN error específico]",
    "translation": "[Traducción de la oración correcta al español]",
    "type": "error_detection",
    "options": ["palabra1", "palabra2", "palabra3", "palabraERRÓNEA"],
    "correctAnswer": "[SOLO la palabra/frase incorrecta]",
    "explanation": "[SOLO español, máximo 6 palabras]",
    "cefrLevel": "${cefrLevel}"
  }
]}

EJEMPLO VÁLIDO:
{
  "question": "Ma lähen homme koolisse bussiga.",
  "translation": "Voy mañana a la escuela en autobús.",
  "type": "error_detection", 
  "options": ["lähen", "homme", "koolisse", "bussiga"],
  "correctAnswer": "koolisse",
  "explanation": "Debe ser 'kooli', no dirección."
}

INSTRUCCIONES CRÍTICAS:
- EXACTAMENTE 5 preguntas de detección de errores
- Cada oración debe tener SOLO UN error específico
- 'correctAnswer' debe ser SOLO la palabra/frase incorrecta
- 'options' debe incluir 4 opciones: 3 correctas + 1 incorrecta
- TODAS las explicaciones en español ÚNICAMENTE
- Usar errores auténticos del corpus EstUD`,

      userPrompt: `Genera 5 preguntas de detección de errores estonios nivel ${cefrLevel}.
      
ENFOQUE: oraciones con un error cada una, errores típicos de hispanohablantes.
FORMATO: JSON con estructura exacta mostrada arriba.
CRÍTICO: 'options' debe incluir 4 palabras/frases de la oración, siendo una incorrecta.`,

      settings: {
        maxTokens: 650,
        temperature: 0.1,
        topP: 1.0,
        frequencyPenalty: 0.1,
        presencePenalty: 0.0
      }
    };
  }

  /**
   * Helper methods for specialized content
   */
  private getCasesForLevel(cefrLevel: string): string {
    const cases = {
      A1: "nominativo, partitivo (ma, sa, ta + objetos básicos)",
      A2: "nominativo, partitivo, genitivo (posesión básica)",
      B1: "nominativo, partitivo, genitivo, ilativo (hacia), inesesivo (en)",
      B2: "todos los casos locales + aditivo, komutativos",
      C1: "sistema completo de 14 casos con matices",
      C2: "casos en contextos complejos y registros especializados"
    };
    return cases[cefrLevel as keyof typeof cases] || cases.B1;
  }

  private getVerbsForLevel(cefrLevel: string): string {
    const verbs = {
      A1: "olema (olen, oled, on), minema (lähen), tulema (tulen)",
      A2: "tegema, söõma, jõõma, magama, ütlema",
      B1: "rääkima, õppima, töötama, elama, mängima",
      B2: "analüüsima, uurima, võrdlema, selgitama",
      C1: "kontseptualiseerima, sünteetisema, problematiseerima",
      C2: "dialektiliselt mõistma, hermeneutiliselt tõlgendama"
    };
    return verbs[cefrLevel as keyof typeof verbs] || verbs.B1;
  }

  private getSentencePatternsForLevel(cefrLevel: string): string {
    const patterns = {
      A1: "SVO põhiline: Ma lähen kooli. Ta tuleb koju.",
      A2: "Aeg + SVO: Täna ma lähen tööle. Homme ta tuleb.",
      B1: "Adverbid + kompleksid: Ta räägib hästi eesti keelt.",
      B2: "Akadeemiline: Professor seletas täna uut teemat.",
      C1: "Keerukad: Eksperdid analüüsivad süstemaatiliselt probleeme.",
      C2: "Abstraktsed: Intellektuaalid kontseptualiseerivad metafüüsilisi dimensioone."
    };
    return patterns[cefrLevel as keyof typeof patterns] || patterns.B1;
  }

  private getTypicalErrorsForLevel(cefrLevel: string): string {
    const errors = {
      A1: "vale kääne: *mul on kool (õige: ma lähen kooli)",
      A2: "partitivi segadus: *ma söön leiva (õige: ma söön leiba)",
      B1: "koht vs suund: *ma olen koolis minemas (segane)",
      B2: "kompleksne konkordi: *suured majad on kaunis (õige: ilusad)",
      C1: "akadeemiline register: vale sõnajärg analüütilistes lausetes",
      C2: "stilistiline ebatäpsus: vale register formaalsetees kontekstides"
    };
    return errors[cefrLevel as keyof typeof errors] || errors.B1;
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
- Morphology: Use authentic case endings from corpus data`;
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
