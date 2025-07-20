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

    // Determine if level should change
    const newLevel = this.determineNewLevel(
      previousLevel,
      performanceScore,
      assessment.recommendation
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

  private determineNewLevel(
    currentLevel: CEFRLevel,
    performanceScore: number,
    recommendation: "maintain" | "increase" | "decrease"
  ): CEFRLevel {
    const currentIndex = this.levelProgression.indexOf(currentLevel);
    
    // Strong performance indicators for level progression
    if (performanceScore >= 4.5 && recommendation === "increase" && currentIndex < this.levelProgression.length - 1) {
      return this.levelProgression[currentIndex + 1];
    }
    
    // Poor performance indicators for level regression
    if (performanceScore <= 2.0 && recommendation === "decrease" && currentIndex > 0) {
      return this.levelProgression[currentIndex - 1];
    }

    // Maintain current level
    return currentLevel;
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
