import { openaiService, type CEFRAssessment } from "./openai";
import { storage } from "../storage";
import type { CEFRLevel, User } from "@shared/schema";

export class CEFRAssessmentService {
  private readonly levelProgression: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

  async assessAndUpdateUserLevel(
    userId: number,
    userResponses: string[],
    responseTimeSeconds: number[],
    sessionScore?: number
  ): Promise<{
    previousLevel: CEFRLevel;
    newLevel: CEFRLevel;
    levelChanged: boolean;
    assessment: CEFRAssessment;
  }> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    const previousLevel = user.cefrLevel as CEFRLevel;
    
    // Get AI assessment
    const assessment = await openaiService.assessCEFRLevel(
      userResponses,
      responseTimeSeconds,
      previousLevel
    );

    // Calculate comprehensive performance score
    const performanceScore = this.calculatePerformanceScore(
      assessment.speedScore,
      assessment.accuracyScore,
      assessment.complexityScore,
      sessionScore
    );

    // Determine if level should change (now requires session history analysis)
    const newLevel = await this.determineNewLevel(
      userId,
      previousLevel,
      performanceScore,
      assessment.recommendation,
      "quiz" // Default session type for assessment
    );

    // Update user level if changed
    let levelChanged = false;
    if (newLevel !== previousLevel) {
      await storage.updateUser(userId, { cefrLevel: newLevel });
      levelChanged = true;
    }

    return {
      previousLevel,
      newLevel,
      levelChanged,
      assessment
    };
  }

  private calculatePerformanceScore(
    speedScore: number,
    accuracyScore: number,
    complexityScore: number,
    sessionScore?: number
  ): number {
    // Weighted average of different performance metrics
    const weights = {
      speed: 0.2,
      accuracy: 0.4,
      complexity: 0.3,
      session: 0.1
    };

    let totalScore = 
      speedScore * weights.speed +
      accuracyScore * weights.accuracy +
      complexityScore * weights.complexity;

    if (sessionScore !== undefined) {
      totalScore += (sessionScore / 20) * weights.session; // Convert percentage to 1-5 scale
    }

    return Math.min(5, Math.max(1, totalScore));
  }

  private async determineNewLevel(
    userId: number,
    currentLevel: CEFRLevel,
    performanceScore: number,
    recommendation: "maintain" | "increase" | "decrease",
    sessionType: string
  ): Promise<CEFRLevel> {
    const currentIndex = this.levelProgression.indexOf(currentLevel);
    
    // Get recent user performance history
    const recentSessions = await storage.getUserSessions(userId);
    const levelSessions = recentSessions.filter(s => s.cefrLevelAtStart === currentLevel);
    
    // Require minimum sessions at current level before advancement
    const minimumSessionsRequired = this.getMinimumSessionsForLevel(currentLevel);
    if (levelSessions.length < minimumSessionsRequired) {
      return currentLevel; // Not enough experience at current level
    }
    
    // Calculate performance across different session types
    const performanceByType = this.analyzePerformanceByType(levelSessions);
    const diversityScore = this.calculateDiversityScore(levelSessions);
    
    // Advancement requires consistent high performance across multiple areas
    if (performanceScore >= 4.5 && recommendation === "increase" && currentIndex < this.levelProgression.length - 1) {
      const avgScore = this.calculateAverageRecentScore(levelSessions);
      const consistencyScore = this.calculateConsistencyScore(levelSessions);
      
      // Require high average (>75%), good consistency (>70%), and topic diversity (>60%)
      if (avgScore >= 75 && consistencyScore >= 70 && diversityScore >= 60) {
        return this.levelProgression[currentIndex + 1];
      }
    }
    
    // Regression only after consistent poor performance
    if (performanceScore <= 2.0 && recommendation === "decrease" && currentIndex > 0) {
      const recentPoorSessions = levelSessions.filter(s => s.score && s.score < 50).length;
      // Require at least 3 poor performances before regression
      if (recentPoorSessions >= 3) {
        return this.levelProgression[currentIndex - 1];
      }
    }

    return currentLevel;
  }

  private getMinimumSessionsForLevel(level: CEFRLevel): number {
    const requirements = {
      A1: 3, // Minimum sessions before advancing from A1
      A2: 4,
      B1: 5,
      B2: 6,
      C1: 7,
      C2: 8
    };
    return requirements[level] || 5;
  }

  private analyzePerformanceByType(sessions: any[]): Record<string, number> {
    const byType: Record<string, { total: number, sum: number }> = {};
    
    sessions.forEach(session => {
      if (!session.score) return;
      const type = session.sessionType;
      if (!byType[type]) byType[type] = { total: 0, sum: 0 };
      byType[type].total++;
      byType[type].sum += session.score;
    });

    const averages: Record<string, number> = {};
    Object.keys(byType).forEach(type => {
      averages[type] = byType[type].sum / byType[type].total;
    });
    
    return averages;
  }

  private calculateDiversityScore(sessions: any[]): number {
    const uniqueTypes = new Set(sessions.map(s => s.sessionType)).size;
    const expectedTypes = 4; // chat, quiz, dialogue, pronunciation, grammar
    return Math.min(100, (uniqueTypes / expectedTypes) * 100);
  }

  private calculateAverageRecentScore(sessions: any[]): number {
    const scoredSessions = sessions.filter(s => s.score !== null);
    if (scoredSessions.length === 0) return 0;
    
    const totalScore = scoredSessions.reduce((sum, s) => sum + s.score, 0);
    return totalScore / scoredSessions.length;
  }

  private calculateConsistencyScore(sessions: any[]): number {
    const scores = sessions.filter(s => s.score !== null).map(s => s.score);
    if (scores.length < 3) return 0;
    
    // Calculate standard deviation
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    // Convert to percentage where lower variation = higher score
    return Math.max(0, 100 - (stdDev / mean) * 100);
  }

  async getAdaptiveDifficultyContent(userId: number): Promise<{
    recommendedLevel: CEFRLevel;
    vocabularyCategories: string[];
    grammarTopics: string[];
    exerciseTypes: string[];
  }> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    const userProgress = await storage.getUserProgress(userId);
    const currentLevel = user.cefrLevel as CEFRLevel;
    const currentIndex = this.levelProgression.indexOf(currentLevel);

    // Analyze user's weak areas
    const weakVocabulary = userProgress
      .filter(p => p.masteryLevel < 3)
      .slice(0, 5);

    // Determine content recommendations based on level and performance
    const recommendations = this.getContentRecommendations(currentLevel, userProgress.length);

    return {
      recommendedLevel: currentLevel,
      vocabularyCategories: recommendations.vocabularyCategories,
      grammarTopics: recommendations.grammarTopics,
      exerciseTypes: recommendations.exerciseTypes
    };
  }

  private getContentRecommendations(level: CEFRLevel, progressCount: number): {
    vocabularyCategories: string[];
    grammarTopics: string[];
    exerciseTypes: string[];
  } {
    const recommendations = {
      A1: {
        vocabularyCategories: ["family", "greetings", "numbers", "colors"],
        grammarTopics: ["basic_verbs", "pronouns", "present_tense"],
        exerciseTypes: ["multiple_choice", "matching", "pronunciation"]
      },
      A2: {
        vocabularyCategories: ["food", "clothing", "transport", "time"],
        grammarTopics: ["past_tense", "adjectives", "plurals"],
        exerciseTypes: ["fill_blank", "conversation", "listening"]
      },
      B1: {
        vocabularyCategories: ["work", "technology", "culture", "government"],
        grammarTopics: ["conditional", "passive_voice", "reported_speech"],
        exerciseTypes: ["essay", "dialogue", "complex_grammar"]
      },
      B2: {
        vocabularyCategories: ["business", "science", "politics", "literature"],
        grammarTopics: ["subjunctive", "complex_sentences", "idiomatic_expressions"],
        exerciseTypes: ["debate", "analysis", "creative_writing"]
      },
      C1: {
        vocabularyCategories: ["academic", "professional", "abstract_concepts"],
        grammarTopics: ["advanced_syntax", "stylistic_devices", "formal_register"],
        exerciseTypes: ["research", "presentation", "critical_analysis"]
      },
      C2: {
        vocabularyCategories: ["specialized", "literary", "technical"],
        grammarTopics: ["native_level_nuances", "regional_variations"],
        exerciseTypes: ["expert_discussion", "translation", "cultural_interpretation"]
      }
    };

    return recommendations[level] || recommendations.B1;
  }

  async manualLevelAdjustment(userId: number, direction: "increase" | "decrease"): Promise<CEFRLevel> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    const currentLevel = user.cefrLevel as CEFRLevel;
    const currentIndex = this.levelProgression.indexOf(currentLevel);

    let newLevel = currentLevel;

    if (direction === "increase" && currentIndex < this.levelProgression.length - 1) {
      newLevel = this.levelProgression[currentIndex + 1];
    } else if (direction === "decrease" && currentIndex > 0) {
      newLevel = this.levelProgression[currentIndex - 1];
    }

    if (newLevel !== currentLevel) {
      await storage.updateUser(userId, { cefrLevel: newLevel });
    }

    return newLevel;
  }
}

export const cefrAssessmentService = new CEFRAssessmentService();
