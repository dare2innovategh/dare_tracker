import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Validate the stored password format
    if (!stored || !stored.includes('.')) {
      console.error("Invalid password format in database");
      return false;
    }
    
    // Split the hash and salt
    const [hashed, salt] = stored.split(".");
    
    // Validate both parts exist
    if (!hashed || !salt) {
      console.error("Invalid password format: missing hash or salt component");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// Create a memory store for sessions as a fallback when database isn't available
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "dare-youth-in-jobs-tracker-secret";
  
  // Use memory store as a fallback if database session store isn't available
  const memoryStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: memoryStore, // Use memory store instead of database store
    cookie: { 
      secure: process.env.NODE_ENV === "production", 
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Validate inputs
        if (!username || !password) {
          console.warn("Login attempt with missing username or password");
          return done(null, false);
        }
        
        const user = await storage.getUserByUsername(username);
        
        // If user not found or user has no password
        if (!user) {
          console.warn(`No user found with username: ${username}`);
          return done(null, false);
        }
        
        if (!user.password) {
          console.error(`User ${username} has no password set`);
          return done(null, false);
        }
        
        // Try password comparison
        const passwordMatches = await comparePasswords(password, user.password);
        if (!passwordMatches) {
          console.warn(`Invalid password attempt for user: ${username}`);
          return done(null, false);
        }
        
        // Success
        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      try {
        // Update the lastLogin field for the user
        const updatedUser = await storage.updateUser(user.id, {
          lastLogin: new Date()
        });
        
        req.login(updatedUser || user, (err) => {
          if (err) return next(err);
          return res.status(200).json(updatedUser || user);
        });
      } catch (error) {
        return next(error);
      }
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.json(req.user);
  });
}
