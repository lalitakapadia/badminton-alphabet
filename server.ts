import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("badminton.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    current_stage_id INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    level_1 TEXT,
    level_2 TEXT,
    level_3 TEXT,
    level_4 TEXT,
    level_5 TEXT
  );

  CREATE TABLE IF NOT EXISTS stage_skills (
    stage_id INTEGER,
    skill_id INTEGER,
    PRIMARY KEY (stage_id, skill_id),
    FOREIGN KEY (stage_id) REFERENCES stages(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    user_id INTEGER,
    skill_id INTEGER,
    status TEXT DEFAULT 'not_started',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
  );
`);

// Seed initial data if empty
const stageCount = db.prepare("SELECT count(*) as count FROM stages").get() as { count: number };
if (stageCount.count === 0) {
  const insertStage = db.prepare("INSERT INTO stages (name, description) VALUES (?, ?)");
  const insertSkill = db.prepare("INSERT INTO skills (id, name, description, level_1, level_2, level_3, level_4, level_5) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const insertStageSkill = db.prepare("INSERT INTO stage_skills (stage_id, skill_id) VALUES (?, ?)");

  const stages = [
    { name: "Stage 1: Foundation", desc: "Core athletic base and essential movement patterns." },
    { name: "Stage 2: Fundamentals", desc: "Developing rally flow and basic hitting mechanics." },
    { name: "Stage 3: Mechanics", desc: "Focusing on kinetic efficiency and offensive structure." },
    { name: "Stage 4: Tactics & Mastery", desc: "Strategic positioning, speed, and high-performance variation." }
  ];

  const skillData = [
    { id: 1, char: "A", name: "Athletic Base", l1: "Static ready only", l2: "Split visible but late", l3: "Timed split in drills", l4: "Timed split in rally", l5: "Anticipatory split" },
    { id: 2, char: "B", name: "Balance", l1: "Falls/wobbles", l2: "Holds briefly", l3: "Stable lunge + push back", l4: "Stable under speed", l5: "Stable under pressure" },
    { id: 3, char: "C", name: "Clean Contact", l1: "Frequent mishits", l2: "5/10 clean stationary", l3: "8/10 clean in movement", l4: "Clean under pace", l5: "Clean under pressure" },
    { id: 4, char: "D", name: "Direction", l1: "Random", l2: "Straight control", l3: "Straight + cross control", l4: "Intentional placement", l5: "Disguised direction" },
    { id: 5, char: "E", name: "Efficient Footwork", l1: "Late to shuttle", l2: "Covers 4 corners", l3: "Covers 6 corners smooth", l4: "6 corners at speed", l5: "Efficient + anticipatory" },
    { id: 6, char: "F", name: "Flow", l1: "3–5 shots", l2: "6–8 shots", l3: "10–15 shots", l4: "20+ under pace", l5: "30+ match intensity" },
    { id: 7, char: "G", name: "Grip System", l1: "Incorrect grip", l2: "Correct FH grip", l3: "Auto FH/BH switch", l4: "Finger acceleration", l5: "Disguised grip use" },
    { id: 8, char: "H", name: "Height Control", l1: "Flat/short clears", l2: "Mid-court clear", l3: "Full backcourt clear", l4: "Adjusts trajectory", l5: "Controls tempo" },
    { id: 9, char: "I", name: "Impact Timing", l1: "Beside body", l2: "Attempts front contact", l3: "Consistent in front", l4: "Early interception", l5: "Peak contact mastery" },
    { id: 10, char: "J", name: "Jump Mechanics", l1: "Unsafe landing", l2: "Controlled landing", l3: "Basic scissor jump", l4: "Balanced jump smash", l5: "Seamless jump recovery" },
    { id: 11, char: "K", name: "Kinetic Chain", l1: "Arm only", l2: "Shoulder rotation", l3: "Hip-shoulder sequence", l4: "Efficient transfer", l5: "Explosive full chain" },
    { id: 12, char: "L", name: "Lunge Quality", l1: "Knee collapse", l2: "Stable but slow recover", l3: "Stable + push back", l4: "Explosive recovery", l5: "Net dominance control" },
    { id: 13, char: "M", name: "Movement Reading", l1: "Reacts late", l2: "Reacts after net", l3: "Reads early", l4: "Anticipates patterns", l5: "Predicts intention" },
    { id: 14, char: "N", name: "Net Control", l1: "Shuttle sits high", l2: "Basic tight net", l3: "Tight + lift option", l4: "Net spin control", l5: "Deceptive net mastery" },
    { id: 15, char: "O", name: "Offensive Structure", l1: "Random attack", l2: "Smash only", l3: "Clear-drop-smash idea", l4: "Structured build-up", l5: "Maintains attack" },
    { id: 16, char: "P", name: "Positioning", l1: "Stays where landed", l2: "Returns slowly", l3: "Returns consistently", l4: "Adjusts base", l5: "Strategic positioning" },
    { id: 17, char: "Q", name: "Quickness", l1: "Slow first step", l2: "Visible effort", l3: "Fast first step", l4: "Rapid transitions", l5: "Elite reactive speed" },
    { id: 18, char: "R", name: "Recovery", l1: "Walks back", l2: "Late recovery", l3: "Recovers before hit", l4: "Recovers ready", l5: "Offensive recovery" },
    { id: 19, char: "S", name: "Serve & Return", l1: "Illegal/inconsistent", l2: "Legal high serve", l3: "Accurate high/short", l4: "Tactical placement", l5: "Controls first 3 shots" },
    { id: 20, char: "T", name: "Tactics", l1: "Random play", l2: "Sees open space", l3: "Uses patterns", l4: "Exploits weakness", l5: "Adapts mid-match" },
    { id: 21, char: "U", name: "Under Pressure", l1: "Technique collapses", l2: "Slight instability", l3: "Maintains form", l4: "Controls rally emotions", l5: "Clutch performance" },
    { id: 22, char: "V", name: "Variation", l1: "One pace only", l2: "Clear vs drop", l3: "Pace + angle variation", l4: "Multi-option attack", l5: "Full deception" },
    { id: 23, char: "W", name: "Wrist/Fingers", l1: "Arm dominant", l2: "Basic finger use", l3: "Drive acceleration", l4: "Explosive wrist", l5: "Micro precision control" },
    { id: 24, char: "X", name: "X-Factor", l1: "Follows only", l2: "Attempts creativity", l3: "Shows style", l4: "Adaptive creativity", l5: "Signature weapon" },
    { id: 25, char: "Y", name: "Physical Conditioning", l1: "Fatigues quickly", l2: "Moderate endurance", l3: "Sustains rally", l4: "Strong speed endurance", l5: "High-performance fitness" },
    { id: 26, char: "Z", name: "Zone (Mental)", l1: "Easily distracted", l2: "Short focus", l3: "Focus full rally", l4: "Resets after errors", l5: "Competitive composur" }
  ];

  stages.forEach((s) => insertStage.run(s.name, s.desc));
  skillData.forEach((skill) => {
    insertSkill.run(skill.id, `${skill.char}: ${skill.name}`, "", skill.l1, skill.l2, skill.l3, skill.l4, skill.l5);
  });

  // Mapping provided by user
  const mapping = [
    // Stage 1
    { s: 1, k: [1, 2, 3, 5, 12, 18] },
    // Stage 2
    { s: 2, k: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
    // Stage 3
    { s: 3, k: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] },
    // Stage 4
    { s: 4, k: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26] }
  ];

  mapping.forEach(m => {
    m.k.forEach(skillId => {
      insertStageSkill.run(m.s, skillId);
    });
  });

  // Create default admin
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "Admin Coach", "admin@badminton.com", "admin123", "admin"
  );

  // Seed students from provided list
  const students = [
    { name: "P M", email: "p.m@badminton.com" },
    { name: "S K", email: "s.k@badminton.com" },
    { name: "A S", email: "a.s@badminton.com" },
    { name: "R R", email: "r.r@badminton.com" },
    { name: "A B", email: "a.b@badminton.com" },
    { name: "A S 2", email: "a.s2@badminton.com" }
  ];

  students.forEach(s => {
    db.prepare("INSERT INTO users (name, email, password, role, current_stage_id) VALUES (?, ?, ?, ?, ?)").run(
      s.name, s.email, "student123", "user", 1
    );
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/register", (req, res) => {
    const { name, email, password } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, password);
      const user = db.prepare("SELECT id, name, email, role, current_stage_id FROM users WHERE id = ?").get(result.lastInsertRowid);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role, current_stage_id FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // User Routes
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, role, current_stage_id FROM users").all();
    res.json(users);
  });

  app.patch("/api/users/:id/stage", (req, res) => {
    const { id } = req.params;
    const { stageId } = req.body;
    db.prepare("UPDATE users SET current_stage_id = ? WHERE id = ?").run(stageId, id);
    res.json({ success: true });
  });

  // Progress Routes
  app.get("/api/stages", (req, res) => {
    const stages = db.prepare("SELECT * FROM stages").all();
    const skills = db.prepare(`
      SELECT s.*, ss.stage_id 
      FROM skills s 
      JOIN stage_skills ss ON s.id = ss.skill_id
    `).all();
    res.json({ stages, skills });
  });

  app.get("/api/progress/:userId", (req, res) => {
    const { userId } = req.params;
    const progress = db.prepare("SELECT * FROM user_progress WHERE user_id = ?").all(userId);
    res.json(progress);
  });

  app.post("/api/progress", (req, res) => {
    const { userId, skillId, status } = req.body;
    db.prepare(`
      INSERT INTO user_progress (user_id, skill_id, status) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_id, skill_id) DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
    `).run(userId, skillId, status);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
