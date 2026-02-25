import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Admin
const supabaseAdmin = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

const app = express();
const PORT = 3000;

app.use(express.json());

// Auth Routes
app.get("/api/auth/url", (req, res) => {
  const provider = req.query.provider as string || 'google';
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const redirectUri = `${appUrl}/`;

  if (!supabaseUrl) {
    return res.status(500).json({ error: "Supabase URL not configured" });
  }

  // Construct Supabase OAuth URL
  const params = new URLSearchParams({
    provider: provider,
    redirect_to: redirectUri,
  });

  const authUrl = `${supabaseUrl}/auth/v1/authorize?${params}`;
  res.json({ url: authUrl });
});

app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `);
});

app.post("/api/auth/sync", async (req, res) => {
  const { supabase_uid, email, name, access_token, role, invitation_token } = req.body;
  
  console.log(`[Sync] Request received for: ${email || 'no-email'} (${supabase_uid || 'no-uid'})`);

  if (!supabaseAdmin) {
    console.error("[Sync] Supabase Admin client not initialized");
    return res.status(500).json({ error: "Server configuration error: Supabase not configured" });
  }

  let verifiedUid = supabase_uid;
  let verifiedEmail = email;
  let metadata: any = {};

  // Verify with Supabase Admin if token is provided
  if (access_token) {
    console.log("[Sync] Verifying access token...");
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
    if (error || !user) {
      console.error("[Sync] Token verification failed:", error);
      return res.status(401).json({ error: "Authentication failed: Invalid session" });
    }
    verifiedUid = user.id;
    verifiedEmail = user.email;
    metadata = user.user_metadata || {};
    console.log(`[Sync] Token verified for ${verifiedEmail}. Metadata keys: ${Object.keys(metadata).join(', ')}`);
  }

  if (!verifiedEmail) {
    console.error("[Sync] No email found for user");
    return res.status(400).json({ error: "Synchronization failed: No email address found" });
  }

  // Check if user exists
  console.log(`[Sync] Checking local DB for: ${verifiedEmail} / ${verifiedUid}`);
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("id, supabase_uid, name, email, role, current_stage_id")
    .or(`supabase_uid.eq.${verifiedUid},email.eq.${verifiedEmail}`)
    .maybeSingle();
  
  if (fetchError) {
    console.error("[Sync] DB Fetch error:", fetchError);
    return res.status(500).json({ error: `Database error: ${fetchError.message}` });
  }

  if (!existingUser) {
    console.log("[Sync] User not found in local DB. Preparing to create...");
    
    const effectiveRole = role || metadata.role || metadata.user_role || 'player';
    const effectiveName = name || metadata.full_name || metadata.name || verifiedEmail.split('@')[0] || 'User';

    console.log(`[Sync] Decision - Role: ${effectiveRole}, Name: ${effectiveName}`);

    let userRole = effectiveRole;

    // If it's a player registration, check invitation
    if (userRole === 'player') {
      console.log(`[Sync] Player role detected. Checking invitations for ${verifiedEmail}...`);
      const { data: invitation, error: invError } = await supabaseAdmin
        .from("invitations")
        .select("*")
        .eq("email", verifiedEmail)
        .eq("status", "pending")
        .maybeSingle();
      
      if (!invError && invitation) {
        console.log(`[Sync] Found invitation. Coach ID: ${invitation.coach_id}`);
        await supabaseAdmin.from("invitations").update({ status: 'accepted' }).eq("id", invitation.id);
      } else if (!invitation_token) {
        console.warn(`[Sync] Blocking player registration - no invitation found for ${verifiedEmail}`);
        return res.status(403).json({ error: "Access Denied: Players must be invited by a coach to join." });
      }
    }

    // Create new user
    console.log(`[Sync] Inserting user into DB...`);
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        supabase_uid: verifiedUid,
        name: effectiveName,
        email: verifiedEmail,
        role: userRole
      })
      .select("id, name, email, role, current_stage_id")
      .single();
    
    if (insertError) {
      console.error("[Sync] DB Insert error:", insertError);
      return res.status(500).json({ error: `Failed to create user record: ${insertError.message}` });
    }
    console.log(`[Sync] Successfully created user ${newUser.id}`);
    return res.json(newUser);
  } else if (!existingUser.supabase_uid) {
    console.log("Linking existing email-only user to Supabase UID...");
    // Link existing email-only user to Supabase
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({ supabase_uid: verifiedUid })
      .eq("id", existingUser.id)
      .select("id, name, email, role, current_stage_id")
      .single();
    
    if (updateError) {
      console.error("Update error during sync:", updateError);
      return res.status(500).json({ error: updateError.message });
    }
    return res.json(updatedUser);
  }
  
  res.json(existingUser);
});

// Invitation Routes
app.post("/api/invitations", async (req, res) => {
  const { email, coachId } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const { data, error } = await supabaseAdmin
    .from("invitations")
    .insert({ email, coach_id: coachId, token })
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  
  res.json({ success: true, token });
});

app.get("/api/invitations/:token", async (req, res) => {
  const { token } = req.params;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { data, error } = await supabaseAdmin
    .from("invitations")
    .select("*, coach:users!coach_id(name)")
    .eq("token", token)
    .eq("status", "pending")
    .single();
  
  if (error || !data) return res.status(404).json({ error: "Invalid or expired invitation" });
  res.json(data);
});

// Approval Routes
app.get("/api/coach/:coachId/pending-players", async (req, res) => {
  res.json([]);
});

app.patch("/api/players/:id/approve", async (req, res) => {
  res.json({ success: true });
});

// User Routes
app.get("/api/users", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, role, current_stage_id");
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch("/api/users/:id/stage", async (req, res) => {
  const { id } = req.params;
  const { stageId } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { error } = await supabaseAdmin
    .from("users")
    .update({ current_stage_id: stageId })
    .eq("id", id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Progress Routes
app.get("/api/stages", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { data: stages, error: stageError } = await supabaseAdmin
    .from("stages")
    .select("*");
  
  const { data: skills, error: skillError } = await supabaseAdmin
    .from("skills")
    .select(`
      *,
      stage_skills!inner(stage_id)
    `);
  
  if (stageError || skillError) {
    return res.status(500).json({ error: (stageError || skillError)?.message });
  }

  const formattedSkills = skills.map((s: any) => ({
    ...s,
    stage_id: s.stage_skills[0].stage_id
  }));

  res.json({ stages, skills: formattedSkills });
});

app.get("/api/progress/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { data, error } = await supabaseAdmin
    .from("user_progress")
    .select("*")
    .eq("user_id", userId);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/progress", async (req, res) => {
  const { userId, skillId, status } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { error } = await supabaseAdmin
    .from("user_progress")
    .upsert({ user_id: userId, skill_id: skillId, status, updated_at: new Date().toISOString() }, { onConflict: 'user_id,skill_id' });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Admin Management Routes
app.patch("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", id)
    .select("id, name, email, role, current_stage_id")
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post("/api/admin/stages", async (req, res) => {
  const { name, description } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { data, error } = await supabaseAdmin
    .from("stages")
    .insert({ name, description })
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch("/api/admin/stages/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { data, error } = await supabaseAdmin
    .from("stages")
    .update({ name, description })
    .eq("id", id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/admin/stages/:id", async (req, res) => {
  const { id } = req.params;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { error } = await supabaseAdmin
    .from("stages")
    .delete()
    .eq("id", id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post("/api/admin/skills", async (req, res) => {
  const { stage_id, ...skillData } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { data: skill, error: skillError } = await supabaseAdmin
    .from("skills")
    .insert(skillData)
    .select()
    .single();
  
  if (skillError) return res.status(500).json({ error: skillError.message });

  if (stage_id) {
    const { error: linkError } = await supabaseAdmin
      .from("stage_skills")
      .insert({ stage_id, skill_id: skill.id });
    
    if (linkError) console.error("Error linking skill to stage:", linkError);
  }

  res.json(skill);
});

app.patch("/api/admin/skills/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { data, error } = await supabaseAdmin
    .from("skills")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/admin/skills/:id", async (req, res) => {
  const { id } = req.params;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

  const { error } = await supabaseAdmin
    .from("skills")
    .delete()
    .eq("id", id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Vite middleware for development
async function setupVite() {
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
}

setupVite();

// Export for Vercel
export default app;

// Start server if not running on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
