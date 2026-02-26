import express from "express";
import { createClient } from "@supabase/supabase-js";

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

app.use(express.json());

// Health check for Vercel
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is running", 
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    supabaseConfigured: !!supabaseAdmin
  });
});

// Auth Routes
app.get("/api/auth/url", (req, res) => {
  const provider = req.query.provider as string || 'google';
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const appUrl = process.env.APP_URL || `http://localhost:3000`;
  const redirectUri = `${appUrl}/`;

  if (!supabaseUrl) {
    return res.status(500).json({ error: "Supabase URL not configured" });
  }

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

  if (access_token) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
    if (error || !user) {
      return res.status(401).json({ error: "Authentication failed: Invalid session" });
    }
    verifiedUid = user.id;
    verifiedEmail = user.email;
    metadata = user.user_metadata || {};
  }

  if (!verifiedEmail) {
    return res.status(400).json({ error: "Synchronization failed: No email address found" });
  }

  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("id, supabase_uid, name, email, role, current_stage_id")
    .or(`supabase_uid.eq.${verifiedUid},email.eq.${verifiedEmail}`)
    .maybeSingle();
  
  if (fetchError) {
    return res.status(500).json({ error: `Database error: ${fetchError.message}` });
  }

  if (!existingUser) {
    const effectiveRole = role || metadata.role || metadata.user_role || 'player';
    const effectiveName = name || metadata.full_name || metadata.name || verifiedEmail.split('@')[0] || 'User';

    let userRole = effectiveRole;

    if (userRole === 'player') {
      const { data: invitation, error: invError } = await supabaseAdmin
        .from("invitations")
        .select("*")
        .eq("email", verifiedEmail)
        .eq("status", "pending")
        .maybeSingle();
      
      if (!invError && invitation) {
        await supabaseAdmin.from("invitations").update({ status: 'accepted' }).eq("id", invitation.id);
      } else if (!invitation_token) {
        return res.status(403).json({ error: "Access Denied: Players must be invited by a coach to join." });
      }
    }

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
      return res.status(500).json({ error: `Failed to create user record: ${insertError.message}` });
    }
    return res.json(newUser);
  } else if (!existingUser.supabase_uid) {
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({ supabase_uid: verifiedUid })
      .eq("id", existingUser.id)
      .select("id, name, email, role, current_stage_id")
      .single();
    
    if (updateError) {
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
    await supabaseAdmin
      .from("stage_skills")
      .insert({ stage_id, skill_id: skill.id });
  }

  res.json(skill);
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

// Fallback for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

export default app;
