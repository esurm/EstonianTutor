import { db } from "./db";
import {
  users,
  sessions,
  messages,
  quizzes,
  vocabulary,
  userProgress,
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  type Message,
  type InsertMessage,
  type Quiz,
  type InsertQuiz,
  type Vocabulary,
  type InsertVocabulary,
  type UserProgress,
  type InsertUserProgress,
  type CEFRLevel,
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: number): Promise<Session | undefined>;
  getUserSessions(userId: number): Promise<Session[]>;
  updateSession(id: number, updates: Partial<Session>): Promise<Session>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getSessionMessages(sessionId: number): Promise<Message[]>;

  // Quizzes
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getSessionQuizzes(sessionId: number): Promise<Quiz[]>;

  // Vocabulary
  getVocabularyByLevel(cefrLevel: CEFRLevel): Promise<Vocabulary[]>;
  getVocabularyByCategory(category: string): Promise<Vocabulary[]>;
  getAllVocabulary(): Promise<Vocabulary[]>;

  // User Progress
  getUserProgress(userId: number): Promise<UserProgress[]>;
  updateUserProgress(userId: number, vocabularyId: number, updates: Partial<UserProgress>): Promise<UserProgress>;
}

export class DatabaseStorage implements IStorage {
  constructor() {}

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Sessions
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return await db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.startTime));
  }

  async updateSession(id: number, updates: Partial<Session>): Promise<Session> {
    const [updatedSession] = await db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.id, id))
      .returning();
    return updatedSession;
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getSessionMessages(sessionId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(messages.timestamp);
  }

  // Quizzes
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async getSessionQuizzes(sessionId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.sessionId, sessionId));
  }

  // Vocabulary
  async getVocabularyByLevel(cefrLevel: CEFRLevel): Promise<Vocabulary[]> {
    return await db.select().from(vocabulary).where(eq(vocabulary.cefrLevel, cefrLevel));
  }

  async getVocabularyByCategory(category: string): Promise<Vocabulary[]> {
    return await db.select().from(vocabulary).where(eq(vocabulary.category, category));
  }

  async getAllVocabulary(): Promise<Vocabulary[]> {
    return await db.select().from(vocabulary);
  }

  // User Progress
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(userId: number, vocabularyId: number, updates: Partial<UserProgress>): Promise<UserProgress> {
    const [existingProgress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.vocabularyId, vocabularyId)));

    if (existingProgress) {
      const [updatedProgress] = await db
        .update(userProgress)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(userProgress.userId, userId), eq(userProgress.vocabularyId, vocabularyId)))
        .returning();
      return updatedProgress;
    } else {
      const [newProgress] = await db
        .insert(userProgress)
        .values({ userId, vocabularyId, ...updates })
        .returning();
      return newProgress;
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private sessions: Map<number, Session> = new Map();
  private messages: Map<number, Message> = new Map();
  private quizzes: Map<number, Quiz> = new Map();
  private vocabulary: Map<number, Vocabulary> = new Map();
  private userProgress: Map<number, UserProgress> = new Map();
  
  private currentUserId = 1;
  private currentSessionId = 1;
  private currentMessageId = 1;
  private currentQuizId = 1;
  private currentVocabularyId = 1;
  private currentUserProgressId = 1;

  constructor() {
    this.seedVocabulary();
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: insertUser.username,
      cefrLevel: insertUser.cefrLevel || "B1",
      wordsLearned: insertUser.wordsLearned || 0,
      accuracy: insertUser.accuracy || 0,
      streak: insertUser.streak || 0,
      totalTime: insertUser.totalTime || 0,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Sessions
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = {
      id,
      userId: insertSession.userId || null,
      sessionType: insertSession.sessionType,
      startTime: new Date(),
      endTime: insertSession.endTime || null,
      score: insertSession.score || null,
      wordsUsed: insertSession.wordsUsed || 0,
      mistakes: insertSession.mistakes || [],
      cefrLevelAtStart: insertSession.cefrLevelAtStart,
      cefrLevelAtEnd: insertSession.cefrLevelAtEnd || null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0));
  }

  async updateSession(id: number, updates: Partial<Session>): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) throw new Error("Session not found");
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      id,
      sessionId: insertMessage.sessionId || null,
      text: insertMessage.text,
      lang: insertMessage.lang,
      source: insertMessage.source,
      timestamp: new Date(),
      corrected: insertMessage.corrected || false,
      correctionExplanation: insertMessage.correctionExplanation || null,
      audioUrl: insertMessage.audioUrl || null,
    };
    this.messages.set(id, message);
    return message;
  }

  async getSessionMessages(sessionId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  // Quizzes
  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.currentQuizId++;
    const quiz: Quiz = {
      id,
      sessionId: insertQuiz.sessionId || null,
      question: insertQuiz.question,
      questionType: insertQuiz.questionType,
      options: insertQuiz.options || null,
      correctAnswer: insertQuiz.correctAnswer,
      userAnswer: insertQuiz.userAnswer || null,
      isCorrect: insertQuiz.isCorrect || null,
      explanation: insertQuiz.explanation || null,
      cefrLevel: insertQuiz.cefrLevel,
      responseTime: insertQuiz.responseTime || null,
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getSessionQuizzes(sessionId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values())
      .filter(quiz => quiz.sessionId === sessionId);
  }

  // Vocabulary
  async getVocabularyByLevel(cefrLevel: CEFRLevel): Promise<Vocabulary[]> {
    return Array.from(this.vocabulary.values())
      .filter(vocab => vocab.cefrLevel === cefrLevel);
  }

  async getVocabularyByCategory(category: string): Promise<Vocabulary[]> {
    return Array.from(this.vocabulary.values())
      .filter(vocab => vocab.category === category);
  }

  async getAllVocabulary(): Promise<Vocabulary[]> {
    return Array.from(this.vocabulary.values());
  }

  // User Progress
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId);
  }

  async updateUserProgress(userId: number, vocabularyId: number, updates: Partial<UserProgress>): Promise<UserProgress> {
    const existingProgress = Array.from(this.userProgress.values())
      .find(p => p.userId === userId && p.vocabularyId === vocabularyId);

    if (existingProgress) {
      const updatedProgress = { ...existingProgress, ...updates };
      this.userProgress.set(existingProgress.id, updatedProgress);
      return updatedProgress;
    } else {
      const id = this.currentUserProgressId++;
      const newProgress: UserProgress = {
        id,
        userId,
        vocabularyId,
        masteryLevel: 0,
        lastReviewed: new Date(),
        timesCorrect: 0,
        timesIncorrect: 0,
        ...updates,
      };
      this.userProgress.set(id, newProgress);
      return newProgress;
    }
  }

  private seedVocabulary() {
    const vocabData = [
      // A1 Level - Family
      { estonianWord: "õde", spanishTranslation: "hermana", cefrLevel: "A1", category: "family", pronunciation: "ÕH-de" },
      { estonianWord: "vend", spanishTranslation: "hermano", cefrLevel: "A1", category: "family", pronunciation: "VEND" },
      { estonianWord: "ema", spanishTranslation: "madre", cefrLevel: "A1", category: "family", pronunciation: "E-ma" },
      { estonianWord: "isa", spanishTranslation: "padre", cefrLevel: "A1", category: "family", pronunciation: "I-sa" },
      { estonianWord: "tütar", spanishTranslation: "hija", cefrLevel: "A1", category: "family", pronunciation: "TÜ-tar" },

      // A1 Level - Greetings
      { estonianWord: "tere", spanishTranslation: "hola", cefrLevel: "A1", category: "greetings", pronunciation: "TE-re" },
      { estonianWord: "aitäh", spanishTranslation: "gracias", cefrLevel: "A1", category: "greetings", pronunciation: "AI-täh" },
      { estonianWord: "vabandust", spanishTranslation: "disculpe", cefrLevel: "A1", category: "greetings", pronunciation: "VA-ban-dust" },
      
      // B1 Level - Technology
      { estonianWord: "digitaalne", spanishTranslation: "digital", cefrLevel: "B1", category: "technology", pronunciation: "di-gi-TAAL-ne" },
      { estonianWord: "riik", spanishTranslation: "estado/país", cefrLevel: "B1", category: "government", pronunciation: "RIIK" },
    ];

    vocabData.forEach(vocab => {
      const id = this.currentVocabularyId++;
      this.vocabulary.set(id, { ...vocab, id } as Vocabulary);
    });
  }
}

export const storage = new DatabaseStorage();
