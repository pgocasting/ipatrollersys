import React, { useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { auth } from "../lib/firebase";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { useFirebase } from "../hooks/useFirebase";
import { toast } from "sonner";
import { Separator } from "../components/ui/separator";

import {
  Sun,
  Moon,
  Monitor,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Palette,
  ChevronRight,
  Check,
  User as UserIcon,
  Camera,
  Upload,
} from "lucide-react";

// ─── Small reusable sub-components ───────────────────────────────────────────

function SectionCard({ icon: Icon, iconColor = "text-blue-500", title, description, children }) {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className={`settings-icon-wrap`} style={{ background: iconColor + "22" }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div>
          <h2 className="settings-section-title">{title}</h2>
          {description && <p className="settings-section-desc">{description}</p>}
        </div>
      </div>
      <div className="settings-card-body">{children}</div>
    </div>
  );
}

function PasswordInput({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-field">
      <label htmlFor={id} className="pw-label">{label}</label>
      <div className="pw-input-wrap">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pw-input"
          autoComplete="off"
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── Theme Selector ───────────────────────────────────────────────────────────

function ThemeSelector() {
  const { theme, setLight, setDark } = useTheme();

  const options = [
    { key: "light", label: "Light", icon: Sun, desc: "Classic bright interface" },
    { key: "dark",  label: "Dark",  icon: Moon, desc: "Easy on the eyes at night" },
  ];

  return (
    <div className="theme-options">
      {options.map(({ key, label, icon: Icon, desc }) => {
        const active = theme === key;
        return (
          <button
            key={key}
            onClick={key === "light" ? setLight : setDark}
            className={`theme-option-btn ${active ? "theme-option-active" : ""}`}
            aria-pressed={active}
          >
            <div className={`theme-option-icon ${key === "dark" ? "dark-icon" : "light-icon"}`}>
              <Icon size={22} />
            </div>
            <div className="theme-option-text">
              <span className="theme-option-label">{label}</span>
              <span className="theme-option-desc">{desc}</span>
            </div>
            {active && (
              <span className="theme-option-check">
                <Check size={14} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Change Password Form (Admin Only) ───────────────────────────────────────

function ChangePasswordForm() {
  const { user } = useFirebase();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = (() => {
    if (!newPw) return 0;
    let s = 0;
    if (newPw.length >= 8) s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPw || !newPw || !confirmPw) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPw === currentPw) {
      toast.error("New password must be different from current password.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPw);
      toast.success("Password changed successfully!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        toast.error("Current password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        toast.error("Password is too weak.");
      } else if (err.code === "auth/requires-recent-login") {
        toast.error("Session expired. Please log out and log back in before changing your password.");
      } else {
        toast.error("Failed to change password. Please try again.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pw-form" noValidate>
      <PasswordInput
        id="current-pw"
        label="Current Password"
        value={currentPw}
        onChange={e => setCurrentPw(e.target.value)}
        placeholder="Enter your current password"
      />
      <PasswordInput
        id="new-pw"
        label="New Password"
        value={newPw}
        onChange={e => setNewPw(e.target.value)}
        placeholder="At least 8 characters"
      />

      {/* Strength meter */}
      {newPw && (
        <div className="pw-strength">
          <div className="pw-strength-bars">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="pw-strength-bar"
                style={{ background: i <= strength ? strengthColor : undefined }}
              />
            ))}
          </div>
          <span className="pw-strength-label" style={{ color: strengthColor }}>
            {strengthLabel}
          </span>
        </div>
      )}

      <PasswordInput
        id="confirm-pw"
        label="Confirm New Password"
        value={confirmPw}
        onChange={e => setConfirmPw(e.target.value)}
        placeholder="Re-enter new password"
      />

      {confirmPw && newPw !== confirmPw && (
        <p className="pw-mismatch">Passwords do not match</p>
      )}

      <button type="submit" className="pw-submit-btn" disabled={loading}>
        {loading ? (
          <span className="pw-btn-loading">
            <span className="pw-spinner" /> Updating…
          </span>
        ) : (
          <>
            <ShieldCheck size={16} />
            Update Password
          </>
        )}
      </button>
    </form>
  );
}

// ─── Profile Customization ───────────────────────────────────────────────────
function ProfileCustomization() {
  const { updateOwnAvatar, updateOwnProfile } = useFirebase();
  const { userAvatar, userProfileName } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [profileName, setProfileName] = useState(userProfileName || "");
  const fileInputRef = React.useRef(null);

  // Update local state when context changes
  React.useEffect(() => {
    setProfileName(userProfileName || "");
  }, [userProfileName]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName) {
      toast.error("Profile name is required.");
      return;
    }
    setUpdating(true);
    const res = await updateOwnProfile({ profileName });
    if (res.success) {
      toast.success("Profile name updated!");
    } else {
      toast.error(res.error || "Failed to update profile name");
    }
    setUpdating(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => setUpdating(true);
    reader.onload = async (event) => {
      const base64 = event.target.result;
      const res = await updateOwnAvatar(base64);
      if (res.success) {
        toast.success("Profile photo uploaded!");
      } else {
        toast.error("Failed to save photo.");
      }
      setUpdating(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-custom-container">
      <div className="photo-upload-section">
        <div className="main-avatar-wrapper">
          <div className="avatar-preview-lg">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="avatar-placeholder-lg">{(profileName?.[0] || 'A')}</div>
            )}
            <button 
              className="change-photo-badge"
              onClick={() => fileInputRef.current?.click()}
              title="Change Photo"
            >
              <Camera size={14} />
            </button>
          </div>
          
          <div className="upload-info">
            <h3 className="upload-title">{profileName || "User Identity"}</h3>
            <p className="upload-hint">JPG, PNG or GIF. Max 2MB.</p>
            <button 
              className="upload-trigger-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={updating}
            >
              <Upload size={14} />
              {updating ? 'Uploading...' : 'Change Identity Photo'}
            </button>
          </div>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          accept="image/*"
        />
      </div>

      <Separator className="my-2 bg-slate-100 dark:bg-slate-800" />

      <form onSubmit={handleUpdateProfile} className="profile-name-form">
        <div className="settings-field">
          <label className="field-label">Profile Identity Name</label>
          <input 
            type="text" 
            value={profileName} 
            onChange={e => setProfileName(e.target.value)} 
            className="settings-input"
            placeholder="Your profile display name"
          />
        </div>
        <button type="submit" className="save-profile-btn" disabled={updating}>
          Update Identity
        </button>
      </form>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function Settings({ onLogout, onNavigate, currentPage }) {
  const { isAdmin } = useAuth();

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <style>{styles}</style>

      <div className="settings-page">
        {/* Header */}
        <div className="settings-header">
          <div>
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">Manage your preferences and account security.</p>
          </div>
        </div>

        {/* Body */}
        <div className="settings-body">
          {/* ── Profile Customization ─────────────────────── */}
          <SectionCard
            icon={UserIcon}
            iconColor="#10b981"
            title="Profile Identity"
            description="Customize your administrative profile with a cartoon avatar."
          >
            <ProfileCustomization />
          </SectionCard>

          {/* ── Appearance ────────────────────────────────────── */}
          <SectionCard
            icon={Palette}
            iconColor="#6366f1"
            title="Appearance"
            description="Choose how the interface looks for you."
          >
            <ThemeSelector />
          </SectionCard>

          {/* ── Change Password (admin only) ───────────────────── */}
          {isAdmin && (
            <SectionCard
              icon={Lock}
              iconColor="#3b82f6"
              title="Change Password"
              description="Update your administrator account password. You'll need your current password to make changes."
            >
              <ChangePasswordForm />
            </SectionCard>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ─── Styles (scoped via class prefixes) ─────────────────────────────────────

const styles = `
/* === Page Container === */
.settings-page {
  min-height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: var(--settings-bg, #f8fafc);
}

/* dark mode overrides */
:root.dark .settings-page { --settings-bg: #0f172a; }
:root.dark .settings-card { background: #1e293b; border-color: #334155; }
:root.dark .settings-card-header { border-bottom-color: #334155; }
:root.dark .settings-section-title { color: #f1f5f9; }
:root.dark .settings-section-desc  { color: #94a3b8; }
:root.dark .settings-title          { color: #f1f5f9; }
:root.dark .settings-subtitle       { color: #94a3b8; }
:root.dark .settings-header         { background: #1e293b; border-bottom-color: #334155; }
:root.dark .theme-option-btn        { background: #0f172a; border-color: #334155; color: #94a3b8; }
:root.dark .theme-option-btn:hover  { border-color: #6366f1; background: #1e293b; }
:root.dark .theme-option-active     { border-color: #6366f1 !important; background: #1e293b !important; color: #f1f5f9 !important; }
:root.dark .theme-option-label      { color: #f1f5f9; }
:root.dark .theme-option-desc       { color: #64748b; }
:root.dark .pw-label                { color: #cbd5e1; }
:root.dark .pw-input                { background: #0f172a; border-color: #334155; color: #f1f5f9; }
:root.dark .pw-input:focus          { border-color: #3b82f6; }
:root.dark .pw-input::placeholder   { color: #475569; }
:root.dark .pw-toggle               { color: #64748b; }
:root.dark .pw-toggle:hover         { color: #94a3b8; }
:root.dark .pw-strength-bar         { background: #334155; }

/* Header */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.settings-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.settings-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 4px 0 0;
}

/* Body */
.settings-body {
  padding: 28px 32px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1200px;
}

/* Card */
.settings-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
}
.settings-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }

.settings-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid #f1f5f9;
}
.settings-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.settings-section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}
.settings-section-desc {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 3px 0 0;
}
.settings-card-body {
  padding: 20px 22px;
  height: 100%;
}

@media (max-width: 1200px) {
  .settings-body { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 800px) {
  .settings-body { grid-template-columns: 1fr; }
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.theme-option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
  position: relative;
  color: #475569;
}
.theme-option-btn:hover {
  border-color: #6366f1;
  background: #eef2ff;
}
.theme-option-active {
  border-color: #6366f1 !important;
  background: #eef2ff !important;
  color: #1e293b !important;
}
.theme-option-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.light-icon { background: #fef9c3; color: #ca8a04; }
.dark-icon  { background: #1e293b; color: #818cf8; }
.theme-option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.theme-option-label {
  font-size: 0.88rem;
  font-weight: 600;
}
.theme-option-desc {
  font-size: 0.75rem;
  color: #94a3b8;
}
.theme-option-check {
  position: absolute;
  top: 8px;
  right: 10px;
  background: #6366f1;
  color: #fff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Password Form ── */
.pw-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pw-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pw-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
}
.pw-input-wrap {
  position: relative;
}
.pw-input {
  width: 100%;
  padding: 10px 40px 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #f8fafc;
  color: #0f172a;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
  box-sizing: border-box;
}
.pw-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  background: #fff;
}
.pw-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.15s;
}
.pw-toggle:hover { color: #374151; }

/* Strength meter */
.pw-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: -6px;
}
.pw-strength-bars {
  display: flex;
  gap: 4px;
  flex: 1;
}
.pw-strength-bar {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: #e2e8f0;
  transition: background 0.3s;
}
.pw-strength-label {
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

/* Mismatch */
.pw-mismatch {
  font-size: 0.78rem;
  color: #ef4444;
  margin: -8px 0 0;
}

/* Submit */
.pw-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 22px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 2px 8px rgba(59,130,246,0.3);
  margin-top: 4px;
  align-self: flex-start;
}
.pw-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 14px rgba(59,130,246,0.4);
  transform: translateY(-1px);
}
.pw-submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}
.pw-btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pw-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 600px) {
  .settings-header { padding: 16px 20px; }
  .settings-body   { padding: 20px 16px; }
  .theme-options   { grid-template-columns: 1fr; }
  .pw-submit-btn   { width: 100%; }
}

/* ── Avatar Customization ── */
.avatar-grid-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.current-avatar-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: var(--active-bg, #f1f5f9);
  border-radius: 12px;
  gap: 10px;
}
:root.dark .current-avatar-preview { --active-bg: #1e293b; }
.preview-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.preview-avatar {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: #fff;
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder {
  font-size: 2rem;
  font-weight: 900;
  color: #3b82f6;
}

.avatar-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}
.avatar-choice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}
:root.dark .avatar-choice-btn { background: #0f172a; }
.avatar-choice-btn:hover {
  background: #f0f9ff;
  border-color: #7dd3fc;
  transform: translateY(-2px);
}
.avatar-choice-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59,130,246,0.15);
}
.avatar-choice-btn img {
  width: 50px;
  height: 50px;
}
.choice-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
}

/* ── Name Edit ── */
.profile-custom-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.profile-name-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.name-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.settings-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #f8fafc;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
}
:root.dark .settings-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
.settings-input:focus {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}
:root.dark .settings-input:focus { background: #0f172a; border-color: #3b82f6; }

.save-profile-btn {
  padding: 10px 18px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}
.save-profile-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}
.save-profile-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Photo Upload ── */
.profile-custom-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.main-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
}
.avatar-preview-lg {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 20px;
  background: #f1f5f9;
  border: 4px solid #fff;
  box-shadow: 0 4px 14px rgba(0,0,0,0.08);
  overflow: hidden;
  flex-shrink: 0;
}
:root.dark .avatar-preview-lg { background: #0f172a; border-color: #1e293b; }
.avatar-placeholder-lg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 900;
  color: #3b82f6;
}
.change-photo-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #3b82f6;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 8px 0 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: -2px -2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s;
}
.change-photo-badge:hover { background: #2563eb; }

.upload-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.upload-title {
  font-size: 1rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}
:root.dark .upload-title { color: #f1f5f9; }
.upload-hint {
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 2px;
}
.upload-trigger-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
:root.dark .upload-trigger-btn { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.upload-trigger-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #f0f9ff;
}
:root.dark .upload-trigger-btn:hover { background: #1e293b; }

.profile-name-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.settings-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #f8fafc;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
}
:root.dark .settings-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.settings-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.save-profile-btn {
  padding: 11px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
  box-shadow: 0 2px 8px rgba(59,130,246,0.25);
}
.save-profile-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59,130,246,0.35);
}
`;