import express from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin
// Note: On Vercel, ensure these are set in the Environment Variables section
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

const app = express();

// Middleware
app.use(express.json());

// Health check for Vercel
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is running", 
    vercel: !!process.env.VERCEL,
    supabaseConfigured: !!supabaseAdmin,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey
  });
});

// Auth Routes
app.get("/api/auth/url", (req, res) => {
  const provider = req.query.provider as string || 'google';
  const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:3000`);
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
  try {
    const { supabase_uid, email, name, access_token, role, invitation_token } = req.body;
    
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin not configured" });
    }

    let verifiedUid = supabase_uid;
    let verifiedEmail = email;
    let metadata: any = {};

    if (access_token) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
      if (error || !user) {
        return res.status(401).json({ error: "Invalid session" });
      }
      verifiedUid = user.id;
      verifiedEmail = user.email;
      metadata = user.user_metadata || {};
    }

    if (!verifiedEmail) {
      return res.status(400).json({ error: "Email required" });
    }

    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .or(`supabase_uid.eq.${verifiedUid},email.eq.${verifiedEmail}`)
      .maybeSingle();
    
    if (fetchError) throw fetchError;

    if (!existingUser) {
      const userRole = role || metadata.role || 'player';
      const userName = name || metadata.full_name || verifiedEmail.split('@')[0];

      if (userRole === 'player') {
        const { data: invitation } = await supabaseAdmin
          .from("invitations")
          .select("*")
          .eq("email", verifiedEmail)
          .eq("status", "pending")
          .maybeSingle();
        
        if (invitation) {
          await supabaseAdmin.from("invitations").update({ status: 'accepted' }).eq("id", invitation.id);
        } else if (!invitation_token) {
          return res.status(403).json({ error: "Invitation required" });
        }
      }

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          supabase_uid: verifiedUid,
          name: userName,
          email: verifiedEmail,
          role: userRole
        })
        .select("*")
        .single();
      
      if (insertError) throw insertError;
      return res.json(newUser);
    }

    if (!existingUser.supabase_uid && verifiedUid) {
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from("users")
        .update({ supabase_uid: verifiedUid })
        .eq("id", existingUser.id)
        .select("*")
        .single();
      if (updateError) throw updateError;
      return res.json(updatedUser);
    }
    
    return res.json(existingUser);
  } catch (err: any) {
    console.error("Sync error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// User Routes
app.get("/api/users", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Not configured" });
  const { data, error } = await supabaseAdmin.from("users").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/stages", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Not configured" });
  try {
    const { data: stages } = await supabaseAdmin.from("stages").select("*");
    const { data: skills } = await supabaseAdmin.from("skills").select("*, stage_skills(stage_id)");
    const formattedSkills = skills?.map((s: any) => ({ ...s, stage_id: s.stage_skills[0]?.stage_id }));
    res.json({ stages, skills: formattedSkills });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/progress/:userId", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Not configured" });
  const { data, error } = await supabaseAdmin.from("user_progress").select("*").eq("user_id", req.params.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/progress", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Not configured" });
  const { error } = await supabaseAdmin.from("user_progress").upsert(req.body, { onConflict: 'user_id,skill_id' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get("/api/invitations/:token", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Not configured" });
  const { data, error } = await supabaseAdmin.from("invitations").select("*, coach:users!coach_id(name)").eq("token", req.params.token).single();
  if (error) return res.status(404).json({ error: "Not found" });
  res.json(data);
});

app.post("/api/invitations", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Not configured" });
  const token = Math.random().toString(36).substring(7);
  const { error } = await supabaseAdmin.from("invitations").insert({ ...req.body, token });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, token });
});

// Admin routes
app.patch("/api/admin/users/:id", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Not configured" });
  const { data, error } = await supabaseAdmin.from("users").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/admin/users/:id", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Not configured" });
  const { error } = await supabaseAdmin.from("users").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Fallback
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

export default app;
