#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Estonian Language Validator
Validates Estonian grammar, case agreement, and error detection
"""

import json
import sys
import re

class EstonianValidator:
    def __init__(self):
        # Estonian case system
        self.cases = {
            'nom': 'nominatiiv',
            'gen': 'genitiiv', 
            'part': 'partitiiv',
            'ill': 'illatiiv',
            'ine': 'inessiiv',
            'ela': 'elatiiv',
            'all': 'allatiiv',
            'ade': 'adessiiv',
            'abl': 'ablatiiv',
            'tra': 'translatiiv',
            'ter': 'terminatiiv',
            'ess': 'essiiv',
            'abe': 'abessiiv',
            'com': 'komitatiiv'
        }
        
        # Common Estonian word endings by case
        self.case_endings = {
            'part': ['t', 'd', 'i', 'e', 'a', 'u'],
            'gen': ['i', 'e', 'a', 'u'],
            'ill': ['sse', 'de', 'te', 'ha', 'hu', 'i'],
            'ine': ['s', 'es', 'is', 'as'],
            'ela': ['st', 'est', 'ist', 'ast'],
            'all': ['le', 'lle'],
            'ade': ['l', 'el', 'il', 'al', 'ul'],
            'abl': ['lt', 'elt', 'ilt', 'alt', 'ult'],
            'tra': ['ks', 'eks', 'iks', 'aks', 'uks'],
            'com': ['ga'],
            'abe': ['ta']
        }
        
        # Estonian pronouns and their correct verb forms
        self.pronoun_verb_agreement = {
            'ma': {'person': 1, 'number': 'sing', 'endings': ['n']},
            'sa': {'person': 2, 'number': 'sing', 'endings': ['d']},
            'ta': {'person': 3, 'number': 'sing', 'endings': ['b', 'ø']},
            'me': {'person': 1, 'number': 'plur', 'endings': ['me']},
            'te': {'person': 2, 'number': 'plur', 'endings': ['te']},
            'nad': {'person': 3, 'number': 'plur', 'endings': ['vad', 'id']}
        }
        
        # Common Estonian adjective-noun agreement patterns
        self.adjective_patterns = {
            'partitive': {
                'adjective': ['t', 'at', 'ut', 'et'],
                'noun': ['t', 'i', 'd', 'e', 'a', 'u']
            },
            'genitive': {
                'adjective': ['ø', 'a', 'e'],
                'noun': ['i', 'e', 'a', 'u']
            }
        }
        
    def validate_single_error(self, sentence, error_word, explanation):
        """
        Validates that a sentence contains exactly one grammatical error
        """
        words = sentence.split()
        error_count = 0
        error_details = []
        
        # Check for verb agreement errors
        for i, word in enumerate(words):
            if word in self.pronoun_verb_agreement:
                pronoun = word
                if i + 1 < len(words):
                    verb = words[i + 1]
                    if not self._check_verb_agreement(pronoun, verb):
                        error_count += 1
                        error_details.append({
                            'type': 'verb_agreement',
                            'word': verb,
                            'position': i + 1
                        })
        
        # Check for case errors in adjective-noun pairs
        for i in range(len(words) - 1):
            if self._is_adjective_noun_pair(words[i], words[i + 1]):
                if not self._check_case_agreement(words[i], words[i + 1]):
                    error_count += 2  # Both adjective and noun are wrong
                    error_details.append({
                        'type': 'case_agreement',
                        'words': [words[i], words[i + 1]],
                        'positions': [i, i + 1]
                    })
        
        # Check for simple case errors
        if error_word in words:
            idx = words.index(error_word)
            if self._is_case_error(error_word, explanation):
                error_count += 1
                error_details.append({
                    'type': 'case_error',
                    'word': error_word,
                    'position': idx
                })
        
        return {
            'valid': error_count == 1,
            'error_count': error_count,
            'errors': error_details,
            'message': 'Single error detected' if error_count == 1 else f'Multiple errors detected: {error_count}'
        }
    
    def _check_verb_agreement(self, pronoun, verb):
        """Check if verb agrees with pronoun"""
        if pronoun not in self.pronoun_verb_agreement:
            return True
            
        expected = self.pronoun_verb_agreement[pronoun]
        
        # Special case for 3rd person singular (no ending)
        if pronoun == 'ta' and not any(verb.endswith(e) for e in ['n', 'd', 'me', 'te', 'vad']):
            return True
            
        # Check if verb has correct ending
        for ending in expected['endings']:
            if ending == 'ø':  # No ending
                continue
            if verb.endswith(ending):
                return True
                
        return False
    
    def _is_adjective_noun_pair(self, word1, word2):
        """Simple heuristic to detect adjective-noun pairs"""
        # Common Estonian adjective endings
        adj_endings = ['ne', 'line', 'lik', 'kas', 'ine']
        return any(word1.endswith(e) for e in adj_endings)
    
    def _check_case_agreement(self, adjective, noun):
        """Check if adjective and noun are in the same case"""
        # Simple check: both should have similar endings for case agreement
        for case_type, patterns in self.adjective_patterns.items():
            adj_match = any(adjective.endswith(e) for e in patterns['adjective'])
            noun_match = any(noun.endswith(e) for e in patterns['noun'])
            if adj_match and noun_match:
                return True
        return False
    
    def _is_case_error(self, word, explanation):
        """Check if the error is a simple case error"""
        case_keywords = ['partitiiv', 'genitiiv', 'illatiiv', 'inessiiv', 
                        'elatiiv', 'allatiiv', 'adessiiv', 'ablatiiv',
                        'partitivo', 'genitivo', 'ilativo', 'inessivo',
                        'caso', 'requiere']
        return any(kw in explanation.lower() for kw in case_keywords)
    
    def analyze_error_detection_quiz(self, quiz_data):
        """Analyze all questions in an error detection quiz"""
        results = []
        
        for question in quiz_data.get('questions', []):
            sentence_match = re.search(r"'([^']+)'", question['question'])
            if not sentence_match:
                continue
                
            sentence = sentence_match.group(1)
            error_word = question['correctAnswer']
            explanation = question['explanation']
            
            validation = self.validate_single_error(sentence, error_word, explanation)
            
            results.append({
                'question': question['question'],
                'sentence': sentence,
                'error_word': error_word,
                'validation': validation
            })
        
        # Summary
        valid_count = sum(1 for r in results if r['validation']['valid'])
        
        return {
            'total_questions': len(results),
            'valid_questions': valid_count,
            'invalid_questions': len(results) - valid_count,
            'details': results,
            'all_valid': valid_count == len(results)
        }
    
    def suggest_fix(self, sentence, error_word):
        """Suggest a fix for the error"""
        words = sentence.split()
        if error_word not in words:
            return None
            
        idx = words.index(error_word)
        
        # Check if it's a verb agreement error
        if idx > 0 and words[idx-1] in self.pronoun_verb_agreement:
            pronoun = words[idx-1]
            expected = self.pronoun_verb_agreement[pronoun]
            
            # Generate correct verb form
            if pronoun == 'ma':
                return error_word + 'n'
            elif pronoun == 'sa':
                return error_word + 'd'
            elif pronoun == 'ta':
                return error_word.rstrip('n').rstrip('d')
            elif pronoun == 'me':
                return error_word + 'me'
            elif pronoun == 'te':
                return error_word + 'te'
            elif pronoun == 'nad':
                return error_word + 'vad'
        
        return None

if __name__ == '__main__':
    validator = EstonianValidator()
    
    # Read JSON from stdin
    input_data = json.loads(sys.stdin.read())
    
    if input_data.get('action') == 'validate_quiz':
        result = validator.analyze_error_detection_quiz(input_data.get('quiz', {}))
        print(json.dumps(result))
    
    elif input_data.get('action') == 'validate_single':
        result = validator.validate_single_error(
            input_data.get('sentence', ''),
            input_data.get('error_word', ''),
            input_data.get('explanation', '')
        )
        print(json.dumps(result))
    
    elif input_data.get('action') == 'suggest_fix':
        fix = validator.suggest_fix(
            input_data.get('sentence', ''),
            input_data.get('error_word', '')
        )
        print(json.dumps({'suggested_fix': fix}))