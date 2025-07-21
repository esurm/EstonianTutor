import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class ErrorDetectionProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Detección de Errores";
  }

  getSystemPrompt(): string {
    return `GENERA ORACIONES ESTONIAS CON ERRORES EN FORMATO JSON

EJEMPLOS EXACTOS nivel ${this.cefrLevel}:
${this.getSpecificErrorExamplesForLevel()}

COPIA estos patrones EXACTAMENTE, solo cambia las palabras.
Genera un JSON con 5 preguntas.`;
  }

  getUserPrompt(): string {
    return `Genera 5 oraciones con ERRORES típicos de hispanohablantes.

EJEMPLOS OBLIGATORIOS nivel ${this.cefrLevel}:
${this.getSpecificErrorExamplesForLevel()}

Usa estos patrones de error EXACTAMENTE.`;
  }

  private getSpecificErrorExamplesForLevel(): string {
    const examples = {
      A1: `
{"question": "¿Qué palabra está mal: 'Ta lähen poodi'?", "options": ["Ta", "lähen", "poodi"], "correctAnswer": "lähen", "explanation": "3ra persona: läheb"}
{"question": "¿Qué palabra está mal: 'Mul on kaks koer'?", "options": ["Mul", "on", "kaks", "koer"], "correctAnswer": "koer", "explanation": "después de número: koera"}`,
      
      A2: `
{"question": "¿Qué palabra está mal: 'Ma elan Tallinn'?", "options": ["Ma", "elan", "Tallinn"], "correctAnswer": "Tallinn", "explanation": "vivir en: Tallinnas"}
{"question": "¿Qué palabra está mal: 'See on mina raamat'?", "options": ["See", "on", "mina", "raamat"], "correctAnswer": "mina", "explanation": "posesivo: minu"}`,
      
      B1: `
{"question": "¿Qué palabra está mal: 'Ma panen raamatu laud'?", "options": ["Ma", "panen", "raamatu", "laud"], "correctAnswer": "laud", "explanation": "hacia superficie: lauale"}
{"question": "¿Qué palabra está mal: 'Eile ma lähen kinno'?", "options": ["Eile", "ma", "lähen", "kinno"], "correctAnswer": "lähen", "explanation": "pasado: läksin"}`,
      
      B2: `
{"question": "¿Qué palabra está mal: 'Ma tulen ilma raha'?", "options": ["Ma", "tulen", "ilma", "raha"], "correctAnswer": "raha", "explanation": "sin algo: rahata"}
{"question": "¿Qué palabra está mal: 'Ta ootab bussis'?", "options": ["Ta", "ootab", "bussis"], "correctAnswer": "bussis", "explanation": "esperar algo: bussi"}`,
      
      C1: `
{"question": "¿Qué palabra está mal: 'Eksperdid arutavad selle küsimus üle'?", "options": ["Eksperdid", "arutavad", "selle", "küsimus", "üle"], "correctAnswer": "küsimus", "explanation": "genitivo: küsimuse"}
{"question": "¿Qué palabra está mal: 'Professor selgitas teema huvitavalt'?", "options": ["Professor", "selgitas", "teema", "huvitavalt"], "correctAnswer": "teema", "explanation": "objeto directo: teemat"}`,
      
      C2: `Nivel C2 no evaluado oficialmente en Estonia`
    };
    return examples[this.cefrLevel as keyof typeof examples] || examples.B1;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 500, // Optimized for speed and completeness
      temperature: 0.05,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    };
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