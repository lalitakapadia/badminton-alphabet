import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
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

async function startServer() {
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
    // Supabase Auth usually handles the code exchange on the client side 
    // if it's a hash-based redirect, but for server-side it might be different.
    // However, we just need to return the success page that sends postMessage.
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
    
    console.log(`Syncing user: ${email} (${supabase_uid}), Role: ${role}`);

    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

    let verifiedUid = supabase_uid;
    let verifiedEmail = email;
    let metadata: any = {};

    // Verify with Supabase Admin if token is provided
    if (access_token) {
      console.log("Verifying access token with Supabase Admin...");
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
      if (error || !user) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ error: "Invalid Supabase token" });
      }
      verifiedUid = user.id;
      verifiedEmail = user.email;
      metadata = user.user_metadata || {};
      console.log(`Token verified for ${verifiedEmail}. Metadata:`, JSON.stringify(metadata));
    }

    // Check if user exists
    console.log(`Checking if user exists in local DB: ${verifiedEmail} / ${verifiedUid}`);
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, supabase_uid, name, email, role, current_stage_id")
      .or(`supabase_uid.eq.${verifiedUid},email.eq.${verifiedEmail}`)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Fetch error during sync:", fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingUser) {
      console.log("User not found in local DB. Creating new record...");
      
      const effectiveRole = role || metadata.role || 'player';
      const effectiveName = name || metadata.full_name || verifiedEmail?.split('@')[0] || 'Unknown';

      console.log(`Effective Role: ${effectiveRole}, Effective Name: ${effectiveName}`);

      let coachId = null;
      let userRole = effectiveRole;

      // If it's a player registration, check invitation
      if (userRole === 'player' && invitation_token) {
        const { data: invitation, error: invError } = await supabaseAdmin
          .from("invitations")
          .select("*")
          .eq("token", invitation_token)
          .eq("status", "pending")
          .single();
        
        if (!invError && invitation) {
          coachId = invitation.coach_id;
          // Mark invitation as accepted
          await supabaseAdmin.from("invitations").update({ status: 'accepted' }).eq("id", invitation.id);
        } else {
          return res.status(400).json({ error: "Invalid or expired invitation" });
        }
      } else if (userRole === 'player' && !invitation_token) {
        // If we can't find an invitation and it's a player, we block it
        // unless they are an admin (which we don't handle here yet)
        console.warn(`Blocking player sync without invitation: ${verifiedEmail}`);
        return res.status(403).json({ error: "Players cannot register without an invitation" });
      }

      // Create new user
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
        console.error("Insert error during sync:", insertError);
        return res.status(500).json({ error: insertError.message });
      }
      console.log("New user record created:", newUser.id);
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
    
    // In a real app, you'd send an email here
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
    const { coachId } = req.params;
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

    // Since coach_id doesn't exist, we can't filter. 
    // For now, return nothing or all players? 
    // Let's return nothing to avoid showing everyone's players to every coach.
    res.json([]);
  });

  app.patch("/api/players/:id/approve", async (req, res) => {
    res.json({ success: true });
  });

  app.post("/api/register", async (req, res) => {
    const { name, email, password, role, invitation_token } = req.body;
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

    try {
      let coachId = null;
      if (role === 'player') {
        if (!invitation_token) throw new Error("Invitation token required for players");
        
        const { data: inv, error: invErr } = await supabaseAdmin
          .from("invitations")
          .select("*")
          .eq("token", invitation_token)
          .eq("status", "pending")
          .single();
        
        if (invErr || !inv) throw new Error("Invalid or expired invitation");
        coachId = inv.coach_id;
        await supabaseAdmin.from("invitations").update({ status: 'accepted' }).eq("id", inv.id);
      }

      const { data, error } = await supabaseAdmin
        .from("users")
        .insert({ 
          name, 
          email, 
          password, 
          role: role || 'player'
        })
        .select("id, name, email, role, current_stage_id")
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role, current_stage_id")
      .eq("email", email)
      .eq("password", password)
      .single();
    
    if (data) {
      res.json(data);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
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

    // Flatten skills to match expected format
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
