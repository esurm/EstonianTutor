import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';
import { estonianErrorGenerator } from '../estonian-error-generator';

export class ErrorDetectionProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Detección de Errores";
  }

  getSystemPrompt(): string {
    return `Generate exactly 5 Estonian grammar error questions for ${this.cefrLevel} level.

COPY THESE EXACT PATTERNS:

VERB AGREEMENT ERRORS:
❌ "Ma läheb kooli" → Error word: "läheb" → Should be: "lähen"  
❌ "Ta lähen tööle" → Error word: "lähen" → Should be: "läheb"
❌ "Me olen kodus" → Error word: "olen" → Should be: "oleme"

CASE ERRORS:
❌ "Ma söön leiv" → Error word: "leiv" → Should be: "leiba" 
❌ "Ma elan Tallinn" → Error word: "Tallinn" → Should be: "Tallinnas"

RULES:
1. Keep word order normal (Subject-Verb-Object)
2. Only change ONE word to make it grammatically wrong
3. Use simple 3-4 word sentences
4. Explanations in Spanish only

JSON FORMAT:
{
  "questions": [
    {
      "question": "¿Qué palabra está incorrecta en: 'Ma läheb kooli'?",
      "type": "error_detection",
      "options": ["Ma", "läheb", "kooli"],
      "correctAnswer": "läheb", 
      "explanation": "Con 'Ma' se usa 'lähen', no 'läheb'",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

Generate 5 questions following these exact patterns.`;
  }

  getUserPrompt(): string {
    return `Create 5 questions like these examples:

EXAMPLE 1:
Sentence with error: "Ma läheb kooli"
Wrong word: "läheb" 
Explanation: "Con 'Ma' se usa 'lähen', no 'läheb'"

EXAMPLE 2: 
Sentence with error: "Ta lähen tööle"
Wrong word: "lähen"
Explanation: "Con 'Ta' se usa 'läheb', no 'lähen'"

EXAMPLE 3:
Sentence with error: "Ma söön leiv"  
Wrong word: "leiv"
Explanation: "Después de 'söön' se usa 'leiba', no 'leiv'"

Make 5 similar questions with simple grammar errors. Return JSON format.`;
  }

  /**
   * Enhanced method to generate pre-validated errors using Estonian linguistic tools
   */
  async generateValidatedErrors(): Promise<any[]> {
    try {
      const estonianErrors = await estonianErrorGenerator.generateErrorsForLevel(this.cefrLevel, 5);
      
      return estonianErrors.map((error, index) => ({
        question: `¿Qué palabra está incorrecta en: '${error.errorSentence}'?`,
        type: "error_detection",
        options: this.generateOptionsForError(error),
        correctAnswer: error.errorWord,
        explanation: error.explanation,
        cefrLevel: this.cefrLevel
      }));
      
    } catch (error) {
      console.error('Failed to generate Estonian validated errors:', error);
      return [];
    }
  }

  /**
   * Generate realistic options for error detection
   */
  private generateOptionsForError(error: any): string[] {
    const words = error.errorSentence.split(' ');
    const options = [error.errorWord];
    
    // Add other words from the sentence as distractors
    words.forEach(word => {
      if (word !== error.errorWord && options.length < 4) {
        options.push(word);
      }
    });
    
    // Pad with common Estonian words if needed
    const commonWords = ['ja', 'on', 'ei', 'või'];
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

  private getSpecificErrorExamplesForLevel(): string {
    const examples = {
      A1: `
{"question": "¿Qué palabra está mal: 'Ta lähen poodi'?", "translation": "Él/Ella va a la tienda", "options": ["Ta", "lähen", "poodi"], "correctAnswer": "lähen", "explanation": "3ra persona: läheb"}
{"question": "¿Qué palabra está mal: 'Mul on kaks koer'?", "translation": "Tengo dos perros", "options": ["Mul", "on", "kaks", "koer"], "correctAnswer": "koer", "explanation": "después de número: koera"}`,
      
      A2: `
{"question": "¿Qué palabra está mal: 'Ma elan Tallinn'?", "translation": "Vivo en Tallin", "options": ["Ma", "elan", "Tallinn"], "correctAnswer": "Tallinn", "explanation": "vivir en: Tallinnas"}
{"question": "¿Qué palabra está mal: 'See on mina raamat'?", "translation": "Este es mi libro", "options": ["See", "on", "mina", "raamat"], "correctAnswer": "mina", "explanation": "posesivo: minu"}`,
      
      B1: `
{"question": "¿Qué palabra está mal: 'Ma panen raamatu laud'?", "translation": "Pongo el libro sobre la mesa", "options": ["Ma", "panen", "raamatu", "laud"], "correctAnswer": "laud", "explanation": "hacia superficie: lauale"}
{"question": "¿Qué palabra está mal: 'Eile ma lähen kinno'?", "translation": "Ayer voy al cine", "options": ["Eile", "ma", "lähen", "kinno"], "correctAnswer": "lähen", "explanation": "pasado: läksin"}`,
      
      B2: `
{"question": "¿Qué palabra está mal: 'Ma tulen ilma raha'?", "translation": "Vengo sin dinero", "options": ["Ma", "tulen", "ilma", "raha"], "correctAnswer": "raha", "explanation": "sin algo: rahata"}
{"question": "¿Qué palabra está mal: 'Ta ootab bussis'?", "translation": "Él/Ella espera el autobús", "options": ["Ta", "ootab", "bussis"], "correctAnswer": "bussis", "explanation": "esperar algo: bussi"}`,
      
      C1: `
{"question": "¿Qué palabra está mal: 'Eksperdid arutavad selle küsimus üle'?", "translation": "Los expertos discuten sobre esta pregunta", "options": ["Eksperdid", "arutavad", "selle", "küsimus", "üle"], "correctAnswer": "küsimus", "explanation": "genitivo: küsimuse"}
{"question": "¿Qué palabra está mal: 'Professor selgitas teema huvitavalt'?", "translation": "El profesor explicó el tema de manera interesante", "options": ["Professor", "selgitas", "teema", "huvitavalt"], "correctAnswer": "teema", "explanation": "partitivo: teemat"}
{"question": "¿Qué palabra está mal: 'Õpilased arutasid tähtsat probleem'?", "translation": "Los estudiantes discutieron un problema importante", "options": ["Õpilased", "arutasid", "tähtsat", "probleem"], "correctAnswer": "probleem", "explanation": "partitivo: probleemi"}`,
      
      C2: `Nivel C2 no evaluado oficialmente en Estonia`
    };
    return examples[this.cefrLevel as keyof typeof examples] || examples.B1;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 600, // Sufficient for 5 simple questions
      temperature: 0.1, // Very low for consistent patterns
      topP: 0.7, // Focused generation
      frequencyPenalty: 0, // No penalty - follow examples exactly
      presencePenalty: 0 // No penalty - copy patterns
    };
  }

  private getRealGrammarErrors(): string {
    const errorTypes = {
      A1: `
VERB CONJUGATION ERRORS:
- "Ma läheb kooli" → ERROR: "läheb" | CORRECT: "lähen" (1st person needs -n)
- "Ta lähen tööle" → ERROR: "lähen" | CORRECT: "läheb" (3rd person needs -b) 
- "Me olen kodus" → ERROR: "olen" | CORRECT: "oleme" (we are)

BASIC CASE ERRORS:
- "Ma söön leiv" → ERROR: "leiv" | CORRECT: "leiba" (partitive object)
- "Kaks koer" → ERROR: "koer" | CORRECT: "koera" (after number = partitive)`,
      
      A2: `
CASE ERRORS:
- "Ma elan Tallinn" → ERROR: "Tallinn" | CORRECT: "Tallinnas" (living IN = inessive)
- "Ma lähen kool" → ERROR: "kool" | CORRECT: "kooli" (going TO = illative)
- "See on mina auto" → ERROR: "mina" | CORRECT: "minu" (possessive = genitive)

VERB ERRORS:
- "Me lähen koju" → ERROR: "lähen" | CORRECT: "läheme" (we go)`,
      
      B1: `
CASE ERRORS:
- "Ma panen raamat laud" → ERROR: "laud" | CORRECT: "lauale" (put ON = allative)
- "Ta võtab laualt raamat" → ERROR: "raamat" | CORRECT: "raamatu" (object = genitive/partitive)
- "Mul on palju raamat" → ERROR: "raamat" | CORRECT: "raamatuid" (many books = partitive plural)`
    };
    
    return errorTypes[this.cefrLevel as keyof typeof errorTypes] || errorTypes.A1;
  }

  private getCommonErrorsForLevel(): string {
    const errors = {
      A1: `
1. CASO NOMINATIVO vs PARTITIVO:
   - ERROR: "Ma joon vesi" → CORRECTO: "Ma joon vett" (agua como objeto)
   - ERROR: "Ta sööb leiva" → CORRECTO: "Ta sööb leiba" (pan como objeto parcial)
   
2. CONCORDANCIA VERBAL:
   - ERROR: "Ma lähed" → CORRECTO: "Ma lähen" (1ra persona)
   - ERROR: "Ta lähen" → CORRECTO: "Ta läheb" (3ra persona)
   
3. CONFUSIÓN SINGULAR/PLURAL:
   - ERROR: "kaks koer" → CORRECTO: "kaks koera" (dos perros - partitivo singular)
   - ERROR: "palju raamat" → CORRECTO: "palju raamatuid" (muchos libros)`,
      
      A2: `
1. CASOS LOCATIVOS MAL APLICADOS:
   - ERROR: "Ma lähen kool" → CORRECTO: "Ma lähen kooli" (ilativo - hacia)
   - ERROR: "Ta elab Tallinn" → CORRECTO: "Ta elab Tallinnas" (inessivo - en)
   
2. GENITIVO INCORRECTO:
   - ERROR: "mina auto" → CORRECTO: "minu auto" (mi carro)
   - ERROR: "tema raamat" → CORRECTO: "tema raamat" (¡este es correcto!)
   
3. OBJETO TOTAL vs PARCIAL:
   - ERROR: "Ma ostan piima" → CORRECTO: "Ma ostan piima" (¡correcto si es algo de leche!)
   - ERROR: "Ma ostan piim" → CORRECTO: "Ma ostan piima" (compro leche en general)`,
      
      B1: `
1. CASOS EXTERNOS CONFUNDIDOS:
   - ERROR: "panen laual" → CORRECTO: "panen lauale" (alativo - hacia superficie)
   - ERROR: "võtan lauale" → CORRECTO: "võtan laualt" (ablativo - desde superficie)
   
2. PARTITIVO PLURAL:
   - ERROR: "Ma näen autod" → CORRECTO: "Ma näen autosid" (veo coches)
   - ERROR: "palju inimesed" → CORRECTO: "palju inimesi" (mucha gente)
   
3. TIEMPO VERBAL INCORRECTO:
   - ERROR: "Eile ma lähen" → CORRECTO: "Eile ma läksin" (ayer fui)
   - ERROR: "Homme ma läksin" → CORRECTO: "Homme ma lähen" (mañana voy)`,
      
      B2: `
1. CASOS GRAMATICALES COMPLEJOS:
   - ERROR: "ilma raha" → CORRECTO: "ilma rahata" (sin dinero - abesivo)
   - ERROR: "koos sõbraga" → CORRECTO: "koos sõbraga" (¡correcto! - comitativo)
   
2. CONDICIONAL MAL FORMADO:
   - ERROR: "ma oleks lähen" → CORRECTO: "ma oleksin läinud" (habría ido)
   - ERROR: "kui ta tuleb, ma ütlen" → CORRECTO: depende del contexto
   
3. CONCORDANCIA EN ORACIONES COMPLEJAS:
   - ERROR: "Ma tean, et ta tule" → CORRECTO: "Ma tean, et ta tuleb"`,
      
      C1: `
1. QUOTATIVO Y FORMAS INDIRECTAS:
   - ERROR: "Ta ütles, et tuleb" → puede ser correcto o incorrecto según contexto
   - ERROR: "Ta tulevat homme" → CORRECTO si es discurso reportado
   
2. MATICES DE CASO EN CONTEXTOS ESPECÍFICOS:
   - Errores sutiles en terminativo, esivo, translativo
   - Confusión entre casos en expresiones idiomáticas
   
3. ASPECTOS VERBALES COMPLEJOS:
   - Errores en verbos compuestos y fraseológicos`,
      
      C2: "Errores muy sutiles en registro, estilo y variaciones dialectales"
    };
    return errors[this.cefrLevel as keyof typeof errors] || errors.B1;
  }

  private getErrorExamples(): string {
    const examples = {
      A1: `
- "Ma söön leiv" (ERROR: debe ser "leiba" - partitivo)
- "Ta lähen poodi" (ERROR: debe ser "läheb" - 3ra persona)
- "Mul on kaks vend" (ERROR: debe ser "venda" - partitivo después de número)`,
      
      A2: `
- "Ma elan Tallinn" (ERROR: debe ser "Tallinnas" - inessivo)
- "See on mina raamat" (ERROR: debe ser "minu" - genitivo)
- "Ta tuleb kool" (ERROR: debe ser "koolist" - elativo)`,
      
      B1: `
- "Ma panen raamatu laud" (ERROR: debe ser "lauale" - alativo)
- "Eile ma lähen kinno" (ERROR: debe ser "läksin" - pasado)
- "Ma näen palju inimesed" (ERROR: debe ser "inimesi" - partitivo plural)`,
      
      B2: `
- "Ma tulen ilma raha" (ERROR: debe ser "rahata" - abesivo)
- "Kui ta tuleks, ma ütleks" (contexto puede requerir indicativo)
- "Ma oleks lähen, aga..." (ERROR: debe ser "oleksin läinud")`,
      
      C1: "Errores sutiles en casos complejos, aspectos verbales, registro",
      C2: "Errores extremadamente sutiles detectables solo por hablantes nativos"
    };
    return examples[this.cefrLevel as keyof typeof examples] || examples.B1;
  }

  private getErrorTypesForLevel(): string {
    const types = {
      A1: "caso (nom/part), concordancia verbal (ma/sa/ta), singular/plural básico",
      A2: "casos locales (kooli/koolis/koolist), genitivo posesivo, objeto parcial",
      B1: "casos externos (lauale/laual/laualt), tiempos verbales, partitivo plural",
      B2: "abesivo/comitativo, condicional, concordancia en subordinadas",
      C1: "quotativo, matices de casos, verbos compuestos",
      C2: "sutilezas estilísticas y dialectales"
    };
    return types[this.cefrLevel as keyof typeof types] || types.B1;
  }
}