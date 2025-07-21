# Estonian Quiz Professor Prompts Analysis

## Overview
Each specialized professor has unique prompts and accesses Estonian corpus knowledge through the `estonianCorpus` service. The corpus is injected during professor instantiation via the factory pattern.

## 1. Vocabulary Professor (vocabulary-professor.ts)

### System Prompt
- **Experience**: 15 years teaching Estonian vocabulary to Honduran Spanish speakers
- **Specialization**: Word meanings, lexical recognition, semantic fields
- **Prohibited**: Grammar, conjugations, syntax
- **Corpus Access**: 
  ```typescript
  const vocabulary = estonianCorpus.getVocabularyByLevel(this.cefrLevel);
  ```
- **Key Features**:
  - Uses CEFR-appropriate vocabulary lists
  - Focuses on cognates and false friends
  - Themes: A1 (family/colors) → C1 (abstract concepts)

### Settings
- Temperature: 0.2 (consistent vocabulary choices)
- MaxTokens: 600
- topP: 0.85

## 2. Grammar Professor (grammar-professor.ts)

### System Prompt
- **Experience**: 12 years teaching Estonian case system
- **Specialization**: 14-case system, case agreement, grammatical rules
- **Prohibited**: Vocabulary meanings, word definitions
- **Corpus Access**:
  ```typescript
  const grammarExamples = estonianCorpus.generateGrammarExamples("case_system", this.cefrLevel);
  ```
- **Key Features**:
  - Progressive case teaching: A1 (nom/gen/part) → C1 (all 14 cases)
  - Focus on Spanish speaker errors with cases
  - Uses simple known words to focus on grammar

### Settings
- Temperature: 0.1 (very consistent grammar rules)
- MaxTokens: 800 (increased for C1 complexity)
- topP: 0.75

## 3. Conjugation Professor (conjugation-professor.ts)

### System Prompt
- **Specialization**: Verbal forms, tenses, persons
- **Prohibited**: Vocabulary, nominal cases
- **Corpus Access**:
  ```typescript
  const verbExamples = estonianCorpus.generateGrammarExamples("verb_conjugation", this.cefrLevel);
  ```
- **Critical Rules**:
  - Correct Estonian pronouns: ma, sa, ta, me, te, nad
  - MEIL construction for "have" conditional (meil oleks, NOT me oleks)
  - Progressive tense teaching: A1 (present) → C1 (quotative)

### Settings
- Temperature: 0.05 (ultra-precise for verb forms)
- MaxTokens: 700
- topP: 0.6

## 4. Sentence Reordering Professor (sentence-reordering-professor.ts)

### System Prompt
- **Specialization**: Estonian word order patterns
- **Corpus Access**:
  ```typescript
  const sentenceExamples = estonianCorpus.getSentencesByLevel(this.cefrLevel);
  ```
- **Key Features**:
  - Teaches flexible Estonian word order vs rigid Spanish
  - Provides alternative correct orders
  - V2 tendency but not obligatory
  - Time expressions often fronted

### Settings
- Temperature: 0.1 (consistent patterns)
- MaxTokens: 1200 (largest - needs alternatives)
- topP: 0.8

## 5. Error Detection Professor (error-detection-professor.ts)

### System Prompt
- **Specialization**: Common Spanish speaker errors in Estonian
- **CRITICAL RULE**: ONE ERROR PER SENTENCE
- **Problem**: Still generating multiple errors (tähtis probleem should be tähtsat probleemi)
- **Current Examples at C1**:
  ```json
  {"question": "¿Qué palabra está mal: 'Õpilased arutasid tähtsat probleem'?", 
   "correctAnswer": "probleem", "explanation": "partitivo: probleemi"}
  ```

### Settings
- Temperature: 0.05 (very low for consistent single errors)
- MaxTokens: 700
- topP: 0.9

## Estonian Corpus Integration

The corpus is accessed through `estonianCorpus` service which provides:

1. **Vocabulary Lists** by CEFR level
2. **Grammar Examples** (case system, verb conjugation)
3. **Complete Sentences** for word order practice
4. **Common Error Patterns** from Spanish speakers

### Corpus Knowledge Injection
```typescript
// In base-professor.ts
this.corpusKnowledge = this.getCorpusKnowledge();

// Each professor receives Estonian linguistic data
private getCorpusKnowledge(): string {
  return `TIENES ACCESO COMPLETO AL CORPUS LINGÜÍSTICO ESTONIO:
  - Vocabulario por niveles CEFR (A1-C2)
  - Sistema completo de 14 casos con ejemplos
  - Conjugaciones verbales y tiempos
  - Patrones sintácticos y orden de palabras
  - Errores comunes de hispanohablantes`;
}
```

## Critical Issues

### Error Detection Multiple Errors
The main issue is that the AI generates sentences with multiple errors despite explicit instructions:
- "tähtis probleem" has TWO errors (should be "tähtsat probleemi")
- This violates pedagogical principles - students can't identify which error to fix

### Potential Solutions Using Estonian NLP Tools

**Vabamorf** (Estonian morphological analyzer):
- Could validate that generated sentences have exactly one error
- Can check case agreement between adjectives and nouns
- Provides morphological analysis to ensure accuracy

**EstNLTK** (Estonian NLP toolkit):
- More comprehensive linguistic analysis
- Could validate grammatical correctness
- Ensure generated errors are realistic

### Implementation Approach
```typescript
// Hypothetical integration
async validateSingleError(sentence: string, errorWord: string) {
  const analysis = await estonianNLP.analyze(sentence);
  const errors = analysis.findGrammaticalErrors();
  return errors.length === 1 && errors[0].word === errorWord;
}
```

## Recommendations

1. **Integrate Estonian NLP validation** to ensure single-error constraint
2. **Pre-validate generated questions** before returning to user
3. **Create error templates** that guarantee single errors
4. **Add explicit case-agreement rules** in error detection prompts

The current system relies on GPT-4's Estonian knowledge, which while extensive, sometimes generates pedagogically incorrect exercises (multiple errors). Integration with Estonian-specific NLP tools would significantly improve accuracy and educational value.