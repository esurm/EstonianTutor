import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  profileImage?: string;
  cefrLevel: string;
}

export function setupAuth(app: Express) {
  // Setup PostgreSQL session store for production
  const PgSession = ConnectPgSimple(session);
  
  let store;
  if (process.env.NODE_ENV === "production") {
    if (!process.env.DATABASE_URL) {
      console.error("ERROR: DATABASE_URL is required in production");
      process.exit(1);
    }
    
    if (!process.env.SESSION_SECRET) {
      console.error("ERROR: SESSION_SECRET is required in production");
      process.exit(1);
    }
    
    // Use PostgreSQL for production - connect-pg-simple expects a connection string
    store = new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'session'
    });
    console.log("✅ Using PostgreSQL session store for production");
  } else {
    console.log("⚠️  Using MemoryStore for development (not suitable for production)");
  }
  
  // Session configuration
  app.use(session({
    store: store, // Use PostgreSQL store in production, fallback to memory store in development
    secret: process.env.SESSION_SECRET || "dev-session-secret-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;
        const profileImage = profile.photos?.[0]?.value;

        if (!email || !name || !googleId) {
          return done(new Error("Incomplete Google profile"));
        }

        // Check if user exists
        let user = await storage.getUserByGoogleId(googleId);
        
        if (!user) {
          // Check by email in case user exists but no Google ID
          user = await storage.getUserByEmail(email);
          
          if (user) {
            // Update existing user with Google ID
            console.log(`🔗 Linking Google account to existing user: ${email}`);
            user = await storage.updateUser(user.id, { googleId, profileImage });
          } else {
            // Create new user
            console.log(`✨ Creating new user from Google OAuth: ${email}`);
            user = await storage.createUser({
              googleId,
              email,
              name,
              profileImage,
              cefrLevel: "B1", // Default level for new users
              wordsLearned: 0,
              accuracy: 0,
              streak: 0,
              totalTime: 0,
            });
          }
        } else {
          console.log(`🎯 Existing Google user logged in: ${email}`);
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.post("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
}

// Middleware to check if user is authenticated
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};

// Get current user info
export const getCurrentUser: RequestHandler = (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
};