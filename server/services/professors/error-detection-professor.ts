import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class ErrorDetectionProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Detección de Errores";
  }

  getSystemPrompt(): string {
    return `You are an Estonian ERROR DETECTION expert for ${this.cefrLevel} level. 

Create 5 Estonian sentences with EXACTLY ONE grammatical error each. Focus on common mistakes Spanish speakers make learning Estonian.

CRITICAL RULES:
1. Each sentence has ONE clear grammatical error
2. Error must be a single word that's grammatically wrong
3. Provide 3-4 options including the error word
4. Give brief explanation in Spanish
5. Use vocabulary appropriate for ${this.cefrLevel} level

ERROR TYPES FOR ${this.cefrLevel}:
${this.getCEFRSpecificErrors()}

EXAMPLES:
${this.getSpecificErrorExamplesForLevel()}

REQUIRED JSON FORMAT:
{
  "questions": [
    {
      "question": "¿Qué palabra está incorrecta en: 'Ma lähen kooli täna'?",
      "type": "error_detection", 
      "options": ["Ma", "lähen", "kooli", "täna"],
      "correctAnswer": "ninguna - la oración es correcta",
      "explanation": "Esta oración está correcta. 'Ma lähen kooli' significa 'Voy a la escuela'",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

Generate exactly 5 questions. Make sure each has a real grammatical error.`;
  }

  getUserPrompt(): string {
    return `Generate exactly 5 Estonian error detection questions for ${this.cefrLevel} level.

Each question must have:
- One Estonian sentence with ONE grammatical error
- 3-4 word options (including the wrong word)
- Correct answer identifies the wrong word
- Spanish explanation of what's wrong
- Appropriate ${this.cefrLevel} vocabulary

Focus on errors Spanish speakers commonly make with Estonian grammar.

Return complete JSON with all 5 questions.`;
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
      maxTokens: 800, // Increased for complete 5-question JSON
      temperature: 0.4, // Increased for more variation
      topP: 0.9,
      frequencyPenalty: 0.1, // Reduce repetition
      presencePenalty: 0.2 // More variety
    };
  }

  private getCEFRSpecificErrors(): string {
    const errorTypes = {
      A1: `
- Verb conjugation: *Ta lähen* → Ta läheb (3rd person)
- Case confusion: *Ma joon piima* → Ma joon piim (nominative object)
- Number after numeral: *kaks koer* → kaks koera (partitive singular)`,
      
      A2: `
- Locative cases: *Ma elan Tallinn* → Ma elan Tallinnas (inessive)
- Possessive: *mina auto* → minu auto (genitive) 
- Movement direction: *Ma lähen kool* → Ma lähen kooli (illative)`,
      
      B1: `
- External locative: *panen laual* → panen lauale (allative)
- Past tense: *Eile ma lähen* → Eile ma läksin (simple past)
- Partitive plural: *Ma näen autod* → Ma näen autosid (partitive)`,
      
      B2: `
- Abessive case: *ilma raha* → ilma rahata (without money)
- Conditional mood: *Ma oleks lähen* → Ma oleksin läinud (perfect conditional)
- Object case: *Ta ootab bussis* → Ta ootab bussi (partitive object)`,
      
      C1: `
- Quotative mood subtleties
- Complex case relationships in subordinate clauses
- Advanced aspectual distinctions`
    };
    
    return errorTypes[this.cefrLevel as keyof typeof errorTypes] || errorTypes.B1;
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