import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  profileImage: text("profile_image"),
  cefrLevel: text("cefr_level").notNull().default("B1"), // A1, A2, B1, B2, C1, C2
  wordsLearned: integer("words_learned").notNull().default(0),
  accuracy: integer("accuracy").notNull().default(0), // percentage
  streak: integer("streak").notNull().default(0),
  totalTime: integer("total_time").notNull().default(0), // minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionType: text("session_type").notNull(), // "chat", "quiz", "pronunciation", "dialogue"
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  score: integer("score"), // percentage for quizzes, null for chat
  wordsUsed: integer("words_used").default(0),
  mistakes: jsonb("mistakes").$type<{ word: string; correction: string; explanation: string }[]>().default([]),
  cefrLevelAtStart: text("cefr_level_at_start").notNull(),
  cefrLevelAtEnd: text("cefr_level_at_end"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id),
  text: text("text").notNull(),
  lang: text("lang").notNull(), // "es" or "et"
  source: text("source").notNull(), // "user" or "assistant"
  timestamp: timestamp("timestamp").defaultNow(),
  corrected: boolean("corrected").default(false),
  correctionExplanation: text("correction_explanation"),
  audioUrl: text("audio_url"), // for TTS audio
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id),
  question: text("question").notNull(),
  questionType: text("question_type").notNull(), // "multiple_choice", "fill_blank"
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  explanation: text("explanation"),
  cefrLevel: text("cefr_level").notNull(),
  responseTime: integer("response_time"), // seconds
});

export const vocabulary = pgTable("vocabulary", {
  id: serial("id").primaryKey(),
  estonianWord: text("estonian_word").notNull(),
  spanishTranslation: text("spanish_translation").notNull(),
  cefrLevel: text("cefr_level").notNull(),
  category: text("category"), // "family", "food", "travel", etc.
  pronunciation: text("pronunciation"),
  exampleSentence: text("example_sentence"),
  culturalNote: text("cultural_note"),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  vocabularyId: integer("vocabulary_id").references(() => vocabulary.id),
  masteryLevel: integer("mastery_level").notNull().default(0), // 0-5
  lastReviewed: timestamp("last_reviewed").defaultNow(),
  timesCorrect: integer("times_correct").default(0),
  timesIncorrect: integer("times_incorrect").default(0),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  startTime: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
});

export const insertVocabularySchema = createInsertSchema(vocabulary).omit({
  id: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  lastReviewed: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Vocabulary = typeof vocabulary.$inferSelect;
export type InsertVocabulary = z.infer<typeof insertVocabularySchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

// CEFR levels enum
export const CEFRLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CEFRLevel = typeof CEFRLevels[number];

// Session types
export const SessionTypes = ["chat", "quiz", "pronunciation", "dialogue"] as const;
export type SessionType = typeof SessionTypes[number];
