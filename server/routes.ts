import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openaiService } from "./services/openai";
import { speechService } from "./services/speech";
import { cefrAssessmentService } from "./services/cefr-assessment";
import { insertUserSchema, insertSessionSchema, insertMessageSchema, insertQuizSchema, type CEFRLevel } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create default user for demo
  let defaultUser = await storage.getUserByUsername("demo_user");
  if (!defaultUser) {
    defaultUser = await storage.createUser({
      username: "demo_user",
      cefrLevel: "B1",
      wordsLearned: 247,
      accuracy: 87,
      streak: 12,
      totalTime: 1680 // 28 hours in minutes
    });
  }

  // User routes
  app.get("/api/user", async (req, res) => {
    try {
      res.json(defaultUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/user", async (req, res) => {
    try {
      const updates = req.body;
      const updatedUser = await storage.updateUser(defaultUser!.id, updates);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Chat routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      let session;
      if (sessionId) {
        session = await storage.getSession(sessionId);
      } else {
        session = await storage.createSession({
          userId: defaultUser!.id,
          sessionType: "chat",
          cefrLevelAtStart: defaultUser!.cefrLevel,
          endTime: null,
          score: null,
          wordsUsed: 0,
          mistakes: [],
          cefrLevelAtEnd: null
        });
      }

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Save user message
      await storage.createMessage({
        sessionId: session.id,
        text: message,
        lang: "et",
        source: "user",
        corrected: false,
        correctionExplanation: null,
        audioUrl: null
      });

      // Get conversation history
      const messages = await storage.getSessionMessages(session.id);
      const conversationHistory = messages.map(msg => ({
        role: msg.source === "user" ? "user" as const : "assistant" as const,
        content: msg.text
      }));

      // Get AI response
      const tutorResponse = await openaiService.getChatResponse(
        message,
        conversationHistory,
        defaultUser!.cefrLevel
      );

      // Generate TTS for response
      const tts = await speechService.synthesizeSpeech(tutorResponse.message, "et-EE");

      // Save assistant message
      const assistantMessage = await storage.createMessage({
        sessionId: session.id,
        text: tutorResponse.message,
        lang: "es",
        source: "assistant",
        corrected: false,
        correctionExplanation: null,
        audioUrl: tts.audioUrl
      });

      res.json({
        sessionId: session.id,
        message: tutorResponse,
        audioUrl: tts.audioUrl,
        messageId: assistantMessage.id
      });

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Speech routes
  app.post("/api/speech/transcribe", async (req, res) => {
    try {
      const { audioData, language = "es-HN" } = req.body;
      
      // Convert base64 to blob
      const audioBuffer = Buffer.from(audioData, 'base64');
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      
      const transcription = await speechService.transcribeAudio(audioBlob, language);
      res.json(transcription);
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  app.post("/api/speech/synthesize", async (req, res) => {
    try {
      const { text, language = "et-EE" } = req.body;
      const tts = await speechService.synthesizeSpeech(text, language);
      res.json(tts);
    } catch (error) {
      console.error("Speech synthesis error:", error);
      res.status(500).json({ error: "Failed to synthesize speech" });
    }
  });

  app.post("/api/speech/analyze-pronunciation", async (req, res) => {
    try {
      const { audioData, expectedText } = req.body;
      
      const audioBuffer = Buffer.from(audioData, 'base64');
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      
      const analysis = await speechService.analyzePronunciation(audioBlob, expectedText);
      res.json(analysis);
    } catch (error) {
      console.error("Pronunciation analysis error:", error);
      res.status(500).json({ error: "Failed to analyze pronunciation" });
    }
  });

  // Quiz routes
  app.post("/api/quiz/generate", async (req, res) => {
    try {
      const { cefrLevel, category } = req.body;
      const quiz = await openaiService.generateQuiz(cefrLevel || defaultUser!.cefrLevel, category);
      
      // Create session for quiz
      const session = await storage.createSession({
        userId: defaultUser!.id,
        sessionType: "quiz",
        cefrLevelAtStart: defaultUser!.cefrLevel,
        endTime: null,
        score: null,
        wordsUsed: 0,
        mistakes: [],
        cefrLevelAtEnd: null
      });

      res.json({
        sessionId: session.id,
        quiz
      });
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  app.post("/api/quiz/submit", async (req, res) => {
    try {
      const { sessionId, answers, responseTime } = req.body;
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Calculate score
      let correctCount = 0;
      const totalQuestions = answers.length;

      // Save quiz results and calculate score
      for (const answer of answers) {
        const isCorrect = answer.userAnswer === answer.correctAnswer;
        if (isCorrect) correctCount++;

        await storage.createQuiz({
          sessionId,
          question: answer.question,
          questionType: answer.type,
          options: answer.options,
          correctAnswer: answer.correctAnswer,
          userAnswer: answer.userAnswer,
          isCorrect,
          explanation: answer.explanation,
          cefrLevel: answer.cefrLevel,
          responseTime: responseTime[answers.indexOf(answer)]
        });
      }

      const score = Math.round((correctCount / totalQuestions) * 100);

      // Update session
      await storage.updateSession(sessionId, {
        endTime: new Date(),
        score
      });

      // Assess CEFR level
      const userResponses = answers.map((a: any) => a.userAnswer);
      const responseTimes = responseTime;
      
      const assessment = await cefrAssessmentService.assessAndUpdateUserLevel(
        defaultUser!.id,
        userResponses,
        responseTimes,
        score
      );

      res.json({
        score,
        correctCount,
        totalQuestions,
        assessment
      });
    } catch (error) {
      console.error("Quiz submit error:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Dialogue routes
  app.post("/api/dialogue/generate", async (req, res) => {
    try {
      const { scenario, cefrLevel } = req.body;
      const dialogue = await openaiService.generateDialogue(
        scenario,
        cefrLevel || defaultUser!.cefrLevel
      );
      res.json(dialogue);
    } catch (error) {
      console.error("Dialogue generation error:", error);
      res.status(500).json({ error: "Failed to generate dialogue" });
    }
  });

  // CEFR assessment routes
  app.post("/api/cefr/adjust", async (req, res) => {
    try {
      const { direction } = req.body;
      const newLevel = await cefrAssessmentService.manualLevelAdjustment(
        defaultUser!.id,
        direction
      );
      
      // Update our cached user
      defaultUser = await storage.getUser(defaultUser!.id);
      
      res.json({ newLevel });
    } catch (error) {
      console.error("CEFR adjustment error:", error);
      res.status(500).json({ error: "Failed to adjust CEFR level" });
    }
  });

  app.get("/api/cefr/recommendations", async (req, res) => {
    try {
      const recommendations = await cefrAssessmentService.getAdaptiveDifficultyContent(defaultUser!.id);
      res.json(recommendations);
    } catch (error) {
      console.error("CEFR recommendations error:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Progress routes
  app.get("/api/progress", async (req, res) => {
    try {
      const sessions = await storage.getUserSessions(defaultUser!.id);
      const recentSessions = sessions.slice(0, 10).map(session => ({
        id: session.id,
        type: session.sessionType,
        score: session.score,
        startTime: session.startTime,
        duration: session.endTime 
          ? Math.round((session.endTime.getTime() - (session.startTime?.getTime() || 0)) / 60000) 
          : null
      }));

      res.json({
        user: defaultUser,
        recentSessions
      });
    } catch (error) {
      console.error("Progress error:", error);
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  // Vocabulary routes
  app.get("/api/vocabulary", async (req, res) => {
    try {
      const { level, category } = req.query;
      
      let vocabulary;
      if (level) {
        vocabulary = await storage.getVocabularyByLevel(level as CEFRLevel);
      } else if (category) {
        vocabulary = await storage.getVocabularyByCategory(category as string);
      } else {
        vocabulary = await storage.getAllVocabulary();
      }
      
      res.json(vocabulary);
    } catch (error) {
      console.error("Vocabulary error:", error);
      res.status(500).json({ error: "Failed to get vocabulary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
