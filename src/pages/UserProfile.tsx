import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Camera, Save, User, Mail, Phone,
  MapPin, FileText, Loader2, CheckCircle2, Pencil
} from "lucide-react";
import creovatorLogo from "@/assets/creovator-logo.png";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    phone: "",
    location: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // ─── Fetch Profile ───────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) { navigate("/auth"); return; }

        // Try profiles table first
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const name = data?.full_name || user.user_metadata?.full_name || "";
        const email = user.email || "";
        const avatar = data?.avatar_url || null;

        setProfile({
          id: user.id,
          full_name: name,
          email,
          avatar_url: avatar,
          bio: data?.bio || null,
          phone: data?.phone || null,
          location: data?.location || null,
        });

        setForm({
          full_name: name,
          bio: data?.bio || "",
          phone: data?.phone || "",
          location: data?.location || "",
        });

        if (avatar) setAvatarUrl(avatar);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // ─── Avatar Select ────────────────────────────────────────────────
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setEditMode(true);
  };

  // ─── Upload Avatar to Supabase Storage ───────────────────────────
  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return avatarUrl;
    setUploadingAvatar(true);
    try {
      const ext = avatarFile.name.split(".").pop();
      const fileName = `${userId}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      return data.publicUrl + `?t=${Date.now()}`; // cache-bust
    } catch (err) {
      console.error("Avatar upload error:", err);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ─── Save Profile ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const newAvatarUrl = await uploadAvatar(profile.id);

      // ✅ Agar upload fail ho toh purani url rakho
      const finalAvatarUrl = newAvatarUrl || avatarUrl;

      const updates = {
        id: profile.id,
        full_name: form.full_name,
        email: profile.email,
        bio: form.bio || null,
        phone: form.phone || null,
        location: form.location || null,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(updates, { onConflict: "id" });

      if (error) throw error;

      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      alert("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Initials ─────────────────────────────────────────────────────
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";
  };

  const displayAvatar = avatarPreview || avatarUrl;

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0a1f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0a1f] text-foreground">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0f0a1f]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <img
            src={creovatorLogo} alt="Creovator"
            className="h-9 object-contain cursor-pointer"
            onClick={() => navigate("/")}
          />
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1 font-medium text-sm">
            Manage your personal information and avatar.
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-[2rem] bg-card/40 border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Top banner */}
          <div className="h-28 bg-gradient-to-r from-primary/40 via-secondary/30 to-accent/20 relative">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
          </div>

          <div className="px-8 pb-8">
            {/* Avatar Section */}
            <div className="flex items-end justify-between -mt-14 mb-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-[#0f0a1f] shadow-xl">
                  {displayAvatar ? (
                    <AvatarImage src={displayAvatar} alt="Profile" className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-[#532062] to-[#2d256d] text-white text-2xl font-black font-serif">
                    {getInitials(form.full_name || profile?.full_name || "")}
                  </AvatarFallback>
                </Avatar>

                {/* Camera overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border-4 border-[#0f0a1f]"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  title="Upload profile picture"
                  
                  onChange={handleAvatarSelect}
                />
              </div>

              {/* Edit / Save buttons */}
              <div className="flex gap-3">
                {!editMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-white/10 hover:border-primary/40 text-sm font-bold"
                    onClick={() => setEditMode(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-white text-sm"
                      onClick={() => {
                        setEditMode(false);
                        setAvatarPreview(null);
                        setAvatarFile(null);
                        setForm({
                          full_name: profile?.full_name || "",
                          bio: profile?.bio || "",
                          phone: profile?.phone || "",
                          location: profile?.location || "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 text-sm font-bold"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : saved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Avatar hint */}
            {editMode && (
              <p className="text-xs text-muted-foreground mb-6 -mt-2">
                Hover over your avatar and click the camera icon to change your photo. Max 5MB.
              </p>
            )}

            {/* Form Fields */}
            <div className="space-y-5">

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Name
                </Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => { setForm(f => ({ ...f, full_name: e.target.value })); setEditMode(true); }}
                  disabled={!editMode}
                  placeholder="Your full name"
                  className="bg-white/5 border-white/10 focus:border-primary/50 disabled:opacity-60 disabled:cursor-not-allowed h-11 rounded-xl font-medium"
                />
              </div>

              {/* Email — read only */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email
                </Label>
                <div className="flex items-center h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground font-medium gap-2">
                  <span className="flex-1 truncate">{profile?.email}</span>
                  <span className="text-[10px] bg-white/10 text-muted-foreground px-2 py-0.5 rounded-full font-black tracking-wider uppercase">
                    Verified
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => { setForm(f => ({ ...f, phone: e.target.value })); setEditMode(true); }}
                  disabled={!editMode}
                  placeholder="+92 300 0000000"
                  className="bg-white/5 border-white/10 focus:border-primary/50 disabled:opacity-60 disabled:cursor-not-allowed h-11 rounded-xl font-medium"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </Label>
                <Input
                  value={form.location}
                  onChange={(e) => { setForm(f => ({ ...f, location: e.target.value })); setEditMode(true); }}
                  disabled={!editMode}
                  placeholder="City, Country"
                  className="bg-white/5 border-white/10 focus:border-primary/50 disabled:opacity-60 disabled:cursor-not-allowed h-11 rounded-xl font-medium"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Bio
                </Label>
                <textarea
                  value={form.bio}
                  onChange={(e) => { setForm(f => ({ ...f, bio: e.target.value })); setEditMode(true); }}
                  disabled={!editMode}
                  placeholder="Tell us a little about yourself..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed resize-none font-medium transition-all"
                />
              </div>

            </div>

            {/* Success Banner */}
            {saved && (
              <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-sm text-green-400 font-bold">Profile updated successfully!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;