import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { getAdminAccessLogs } from "../utils/adminLogger";
import { getUserActivityLogs } from "../utils/universalLogger";
import {
  ScrollText,
  RefreshCw,
  Search,
  Filter,
  Download,
  ChevronDown,
  LogIn,
  LogOut,
  Navigation,
  Shield,
  User,
  Settings,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_META = {
  USER_LOGIN:         { label: "Login",           theme: "emerald", icon: LogIn },
  USER_LOGOUT:        { label: "Logout",          theme: "red",     icon: LogOut },
  ADMIN_LOGIN:        { label: "Admin Login",     theme: "blue",    icon: Shield },
  ADMIN_LOGOUT:       { label: "Admin Logout",    theme: "red",     icon: Shield },
  PAGE_NAVIGATION:    { label: "Navigation",      theme: "indigo",  icon: Navigation },
  REPORT_ACCESS:      { label: "Report Access",   theme: "sky",     icon: BarChart3 },
  SETTINGS_CHANGE:    { label: "Settings Change", theme: "orange",  icon: Settings },
  USER_MANAGEMENT_CREATE_USER: { label: "User Created",  theme: "emerald", icon: User },
  USER_MANAGEMENT_UPDATE_USER: { label: "User Updated",  theme: "amber",   icon: User },
  USER_MANAGEMENT_DELETE_USER: { label: "User Deleted",  theme: "red",     icon: User },
  DATA_ACCESS:        { label: "Data Access",     theme: "slate",   icon: FileText },
};

const getActionMeta = (action) => {
  if (!action) return { label: action, theme: "slate", icon: Activity };
  // Exact match
  if (ACTION_META[action]) return ACTION_META[action];
  // Prefix match
  for (const key of Object.keys(ACTION_META)) {
    if (action.startsWith(key.split("_")[0])) return ACTION_META[key] || {};
  }
  return { label: action.replace(/_/g, " "), theme: "slate", icon: Activity };
};

const formatTimestamp = (ts) => {
  if (!ts) return "—";
  let date;
  if (ts?.toDate) date = ts.toDate();
  else if (ts?.seconds) date = new Date(ts.seconds * 1000);
  else date = new Date(ts);
  if (isNaN(date)) return "—";
  return date.toLocaleString("en-PH", {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true,
  });
};

const formatTimestampRelative = (ts) => {
  if (!ts) return "—";
  let date;
  if (ts?.toDate) date = ts.toDate();
  else if (ts?.seconds) date = new Date(ts.seconds * 1000);
  else date = new Date(ts);
  if (isNaN(date)) return "—";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatTimestamp(ts);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBadge({ action }) {
  const meta = getActionMeta(action);
  const Icon = meta.icon || Activity;
  return (
    <span className={`log-badge log-color-${meta.theme || 'slate'}`}>
      <Icon size={11} />
      {meta.label || action}
    </span>
  );
}

function LogRow({ log, source }) {
  const user = log.userInfo || {};
  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email || "Unknown";

  return (
    <tr className="log-row">
      <td className="log-cell log-cell-time">
        <div className="log-time-main">{formatTimestampRelative(log.timestamp)}</div>
        <div className="log-time-sub">{formatTimestamp(log.timestamp)}</div>
      </td>
      <td className="log-cell">
        <ActionBadge action={log.action} />
      </td>
      <td className="log-cell">
        <div className="log-user-name">{displayName}</div>
        <div className="log-user-email">{user.email}</div>
        {user.municipality && <div className="log-user-muni opacity-70 text-[10px] font-medium tracking-wide text-slate-500 uppercase mt-0.5 dark:text-slate-400">{user.municipality}</div>}
      </td>
      <td className="log-cell log-cell-access">
        <span className="log-access-chip">{user.accessLevel || user.role || "—"}</span>
      </td>
      <td className="log-cell log-cell-page">
        <span className="log-page">{log.page || "—"}</span>
      </td>
      <td className="log-cell log-cell-source">
        <span className={`log-source-chip ${source === "admin" ? "log-source-admin" : "log-source-user"}`}>
          {source === "admin" ? "Admin" : "Activity"}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Logs({ onLogout, onNavigate, currentPage }) {
  const { isAdmin } = useAuth();

  const [adminLogs, setAdminLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all"); // "all" | "admin" | "activity"
  const [actionFilter, setActionFilter] = useState("all");
  const [municipalityFilter, setMunicipalityFilter] = useState("all");
  const [limitCount, setLimitCount] = useState(100);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aLogs, uLogs] = await Promise.all([
        getAdminAccessLogs(limitCount),
        getUserActivityLogs(limitCount),
      ]);
      setAdminLogs(aLogs.map(l => ({ ...l, _source: "admin" })));
      setActivityLogs(uLogs.map(l => ({ ...l, _source: "activity" })));
      setLastRefreshed(new Date());
    } catch (e) {
      setError("Failed to load logs. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [limitCount]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Merge and sort all logs by timestamp desc
  const allLogs = [...adminLogs, ...activityLogs].sort((a, b) => {
    const getMs = (ts) => {
      if (!ts) return 0;
      if (ts?.toDate) return ts.toDate().getTime();
      if (ts?.seconds) return ts.seconds * 1000;
      return new Date(ts).getTime();
    };
    return getMs(b.timestamp) - getMs(a.timestamp);
  });

  // Deduplicate: same user + action + page within 2 seconds = same event
  const deduped = allLogs.filter((log, idx, arr) => {
    if (idx === 0) return true;
    const prev = arr[idx - 1];
    const getMs = (ts) => {
      if (!ts) return 0;
      if (ts?.toDate) return ts.toDate().getTime();
      if (ts?.seconds) return ts.seconds * 1000;
      return new Date(ts).getTime();
    };
    const timeDiff = Math.abs(getMs(log.timestamp) - getMs(prev.timestamp));
    const sameUser = log.userInfo?.email === prev.userInfo?.email;
    const sameAction = log.action === prev.action;
    const samePage = log.page === prev.page;
    return !(timeDiff < 2000 && sameUser && sameAction && samePage);
  });

  // Unique actions and municipalities for filter dropdown
  const uniqueActions = [...new Set(deduped.map(l => l.action))].sort();
  const uniqueMunicipalities = [...new Set(deduped.map(l => l.userInfo?.municipality).filter(Boolean))].sort();

  // Apply filters
  const filtered = deduped.filter(log => {
    if (sourceFilter !== "all" && log._source !== sourceFilter) return false;
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    
    const userMuni = log.userInfo?.municipality || "";
    if (municipalityFilter !== "all" && userMuni !== municipalityFilter) return false;
    
    if (search) {
      const q = search.toLowerCase();
      const user = log.userInfo || {};
      const haystack = [
        user.email, user.firstName, user.lastName, user.username,
        user.municipality, log.action, log.page, log.url
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ["Timestamp", "Action", "User Email", "Name", "Access Level", "Page", "Municipality", "Source"].join(","),
      ...filtered.map(l => {
        const u = l.userInfo || {};
        return [
          formatTimestamp(l.timestamp),
          l.action || "",
          u.email || "",
          `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          u.accessLevel || "",
          l.page || "",
          u.municipality || "",
          l._source || "",
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
      }),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ipatroller-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const loginCount = deduped.filter(l => l.action === "USER_LOGIN" || l.action === "ADMIN_LOGIN").length;
  const todayCount = deduped.filter(l => {
    const getMs = (ts) => ts?.toDate ? ts.toDate().getTime() : ts?.seconds ? ts.seconds * 1000 : 0;
    return Date.now() - getMs(l.timestamp) < 86400000;
  }).length;

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <style>{styles}</style>

      <div className="logs-page">
        {/* ── Header ── */}
        <div className="logs-header">
          <div className="logs-header-left">
            <div className="logs-header-icon">
              <ScrollText size={20} />
            </div>
            <div>
              <h1 className="logs-title">System Logs</h1>
              <p className="logs-subtitle">
                {lastRefreshed
                  ? `Last updated ${formatTimestampRelative({ toDate: () => lastRefreshed })}`
                  : "Loading…"}
              </p>
            </div>
          </div>
          <div className="logs-header-actions">
            <button className="logs-btn logs-btn-outline" onClick={exportCSV} disabled={loading || filtered.length === 0}>
              <Download size={15} />
              Export CSV
            </button>
            <button className="logs-btn logs-btn-primary" onClick={fetchLogs} disabled={loading}>
              <RefreshCw size={15} className={loading ? "logs-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="logs-stats">
          <div className="logs-stat-card">
            <div className="logs-stat-icon log-color-blue ml-0 p-0 border-none bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <ScrollText size={18} />
            </div>
            <div>
              <div className="logs-stat-num">{deduped.length.toLocaleString()}</div>
              <div className="logs-stat-label">Total Logs</div>
            </div>
          </div>
          <div className="logs-stat-card">
            <div className="logs-stat-icon log-color-emerald ml-0 p-0 border-none bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Activity size={18} />
            </div>
            <div>
              <div className="logs-stat-num">{todayCount.toLocaleString()}</div>
              <div className="logs-stat-label">Last 24 Hours</div>
            </div>
          </div>
          <div className="logs-stat-card">
            <div className="logs-stat-icon log-color-indigo ml-0 p-0 border-none bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <LogIn size={18} />
            </div>
            <div>
              <div className="logs-stat-num">{loginCount.toLocaleString()}</div>
              <div className="logs-stat-label">Login Events</div>
            </div>
          </div>
          <div className="logs-stat-card">
            <div className="logs-stat-icon log-color-purple ml-0 p-0 border-none bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <CheckCircle size={18} />
            </div>
            <div>
              <div className="logs-stat-num">{filtered.length.toLocaleString()}</div>
              <div className="logs-stat-label">Showing</div>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="logs-filters">
          <div className="logs-search-wrap">
            <Search size={15} className="logs-search-icon" />
            <input
              className="logs-search"
              placeholder="Search by user, action, page…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="logs-filter-group">
            <Filter size={14} className="logs-filter-icon" />
            <select className="logs-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
              <option value="all">All Sources</option>
              <option value="admin">Admin Logs</option>
              <option value="activity">Activity Logs</option>
            </select>
          </div>
          <div className="logs-filter-group">
            <select className="logs-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="all">All Actions</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div className="logs-filter-group">
            <select className="logs-select" value={municipalityFilter} onChange={e => setMunicipalityFilter(e.target.value)}>
              <option value="all">All Municipalities</option>
              {uniqueMunicipalities.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="logs-filter-group">
            <select className="logs-select" value={limitCount} onChange={e => { setLimitCount(Number(e.target.value)); }}>
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
              <option value={250}>Last 250</option>
              <option value={500}>Last 500</option>
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="logs-table-wrap">
          {loading ? (
            <div className="logs-empty">
              <div className="logs-spinner" />
              <p>Loading logs…</p>
            </div>
          ) : error ? (
            <div className="logs-empty logs-empty-error">
              <AlertCircle size={32} color="#ef4444" />
              <p>{error}</p>
              <button className="logs-btn logs-btn-primary" onClick={fetchLogs}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="logs-empty">
              <ScrollText size={40} color="#334155" />
              <p>No logs match your filters.</p>
            </div>
          ) : (
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Access Level</th>
                  <th>Page</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <LogRow key={log.id} log={log} source={log._source} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="logs-footer">
          Showing <strong>{filtered.length}</strong> of <strong>{deduped.length}</strong> total log entries
        </div>
      </div>
    </Layout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
.logs-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #f8fafc;
}
:root.dark .logs-page { background: #0f172a; }

/* Header */
.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 28px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
  gap: 12px;
  flex-wrap: wrap;
}
:root.dark .logs-header { background: #1e293b; border-bottom-color: #334155; }

.logs-header-left { display: flex; align-items: center; gap: 12px; }

.logs-header-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex; align-items: center; justify-content: center;
  color: #3b82f6;
  flex-shrink: 0;
}
:root.dark .logs-header-icon { background: #172554; }

.logs-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0; }
.logs-subtitle { font-size: 0.75rem; color: #64748b; margin: 2px 0 0; }
:root.dark .logs-title { color: #f1f5f9; }
:root.dark .logs-subtitle { color: #64748b; }

.logs-header-actions { display: flex; align-items: center; gap: 8px; }

/* Buttons */
.logs-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.18s ease;
}
.logs-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.logs-btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 2px 6px rgba(59,130,246,0.3);
}
.logs-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 12px rgba(59,130,246,0.4);
  transform: translateY(-1px);
}
.logs-btn-outline {
  background: #fff;
  color: #374151;
  border: 1.5px solid #e2e8f0;
}
.logs-btn-outline:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; }
:root.dark .logs-btn-outline { background: #1e293b; color: #94a3b8; border-color: #334155; }
:root.dark .logs-btn-outline:hover:not(:disabled) { border-color: #3b82f6; color: #60a5fa; }

/* Stat Cards */
.logs-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  padding: 20px 28px 0;
}
@media (max-width: 768px) { .logs-stats { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .logs-stats { grid-template-columns: 1fr; } }

.logs-stat-card {
  display: flex; align-items: center; gap: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: box-shadow 0.2s;
}
.logs-stat-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.07); }
:root.dark .logs-stat-card { background: #1e293b; border-color: #334155; }

.logs-stat-icon {
  width: 42px; height: 42px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.logs-stat-num { font-size: 1.4rem; font-weight: 800; color: #0f172a; line-height: 1; }
.logs-stat-label { font-size: 0.72rem; color: #64748b; margin-top: 3px; font-weight: 500; }
:root.dark .logs-stat-num { color: #f1f5f9; }

/* Filters */
.logs-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  flex-wrap: wrap;
}

.logs-search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}
.logs-search-icon {
  position: absolute;
  left: 11px; top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}
.logs-search {
  width: 100%;
  padding: 9px 14px 9px 34px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 0.85rem;
  background: #fff;
  color: #0f172a;
  outline: none;
  transition: border-color 0.18s;
  box-sizing: border-box;
}
.logs-search:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
:root.dark .logs-search { background: #0f172a; border-color: #334155; color: #f1f5f9; }
:root.dark .logs-search::placeholder { color: #475569; }

.logs-filter-group { display: flex; align-items: center; gap: 6px; }
.logs-filter-icon { color: #94a3b8; flex-shrink: 0; }

.logs-select {
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 0.82rem;
  background: #fff;
  color: #374151;
  outline: none;
  cursor: pointer;
  transition: border-color 0.18s;
}
.logs-select:focus { border-color: #3b82f6; }
:root.dark .logs-select { background: #0f172a; border-color: #334155; color: #e2e8f0; }

/* Table */
.logs-table-wrap {
  flex: 1;
  overflow: auto;
  margin: 0 28px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}
:root.dark .logs-table-wrap { background: #1e293b; border-color: #334155; }

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
}
.logs-table thead tr {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
:root.dark .logs-table thead tr { background: #0f172a; border-bottom-color: #334155; }

.logs-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  white-space: nowrap;
}

.log-row {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.12s;
}
.log-row:hover { background: #f8fafc; }
:root.dark .log-row { border-bottom-color: #1e3a5f22; }
:root.dark .log-row:hover { background: #334155; }

.log-detail-row { background: #f0f9ff; }
:root.dark .log-detail-row { background: #0f172a; }

.log-cell {
  padding: 12px 14px;
  vertical-align: middle;
  color: #374151;
}
:root.dark .log-cell { color: #cbd5e1; }

.log-cell-time { min-width: 120px; }
.log-cell-access { white-space: nowrap; }
.log-cell-page { max-width: 140px; }
.log-cell-chevron { width: 30px; text-align: center; }
.log-cell-source { white-space: nowrap; }

.log-time-main { font-size: 0.8rem; font-weight: 600; color: #1e293b; }
.log-time-sub { font-size: 0.7rem; color: #94a3b8; margin-top: 1px; }
:root.dark .log-time-main { color: #e2e8f0; }

/* Badge */
.log-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  white-space: nowrap;
}

.log-color-emerald { background: #d1fae5; color: #059669; border-color: #a7f3d0; }
:root.dark .log-color-emerald { background: rgba(5, 46, 22, 0.6); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }

.log-color-amber { background: #fef3c7; color: #d97706; border-color: #fde68a; }
:root.dark .log-color-amber { background: rgba(69, 26, 3, 0.6); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }

.log-color-blue { background: #dbeafe; color: #2563eb; border-color: #bfdbfe; }
:root.dark .log-color-blue { background: rgba(23, 37, 84, 0.6); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }

.log-color-purple { background: #f3e8ff; color: #9333ea; border-color: #e9d5ff; }
:root.dark .log-color-purple { background: rgba(46, 16, 101, 0.6); color: #a78bfa; border-color: rgba(167, 139, 250, 0.2); }

.log-color-indigo { background: #e0e7ff; color: #4f46e5; border-color: #c7d2fe; }
:root.dark .log-color-indigo { background: rgba(30, 27, 75, 0.6); color: #6366f1; border-color: rgba(99, 102, 241, 0.2); }

.log-color-sky { background: #e0f2fe; color: #0284c7; border-color: #bae6fd; }
:root.dark .log-color-sky { background: rgba(12, 74, 110, 0.6); color: #0ea5e9; border-color: rgba(14, 165, 233, 0.2); }

.log-color-orange { background: #ffedd5; color: #ea580c; border-color: #fed7aa; }
:root.dark .log-color-orange { background: rgba(67, 20, 7, 0.6); color: #f97316; border-color: rgba(249, 115, 22, 0.2); }

.log-color-red { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
:root.dark .log-color-red { background: rgba(76, 5, 25, 0.6); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }

.log-color-slate { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
:root.dark .log-color-slate { background: rgba(30, 41, 59, 0.6); color: #94a3b8; border-color: rgba(148, 163, 184, 0.2); }

.log-user-name { font-weight: 600; color: #1e293b; font-size: 0.83rem; }
.log-user-email { font-size: 0.72rem; color: #94a3b8; margin-top: 1px; }
:root.dark .log-user-name { color: #f1f5f9; }

.log-access-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #eff6ff;
  color: #3b82f6;
  letter-spacing: 0.04em;
}
:root.dark .log-access-chip { background: #172554; color: #60a5fa; }

.log-page {
  font-size: 0.78rem;
  color: #6366f1;
  font-weight: 500;
  font-family: monospace;
}
:root.dark .log-page { color: #a78bfa; }

.log-source-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 600;
}
.log-source-admin { background: #fef3c7; color: #92400e; }
.log-source-user  { background: #f0fdf4; color: #166534; }
:root.dark .log-source-admin { background: #451a03; color: #fbbf24; }
:root.dark .log-source-user  { background: #052e16; color: #34d399; }

.log-chevron { color: #94a3b8; transition: transform 0.2s; }
.log-chevron-open { transform: rotate(180deg); }

/* Detail row */
.log-detail-cell { padding: 14px 20px; border-bottom: 1px solid #e2e8f0; }
:root.dark .log-detail-cell { border-bottom-color: #334155; }

.log-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 768px) { .log-detail-grid { grid-template-columns: repeat(2, 1fr); } }

.log-detail-item { display: flex; flex-direction: column; gap: 3px; }
.log-detail-full { grid-column: 1 / -1; }
.log-detail-key {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}
.log-detail-val { font-size: 0.8rem; color: #1e293b; font-weight: 500; }
:root.dark .log-detail-val { color: #e2e8f0; }
.log-detail-mono { font-family: monospace; font-size: 0.75rem; }
.log-detail-break { word-break: break-all; }
.log-detail-pre {
  font-family: monospace;
  font-size: 0.75rem;
  background: #f1f5f9;
  color: #334155;
  padding: 10px;
  border-radius: 6px;
  overflow: auto;
  margin: 0;
  max-height: 120px;
}
:root.dark .log-detail-pre { background: #0f172a; color: #94a3b8; }

/* Empty / Loading */
.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
  font-size: 0.9rem;
}
.logs-empty-error { color: #ef4444; }
.logs-spinner {
  width: 32px; height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
:root.dark .logs-spinner { border-color: #334155; border-top-color: #3b82f6; }
@keyframes spin { to { transform: rotate(360deg); } }

.logs-spin { animation: spin 0.7s linear infinite; }

/* Footer */
.logs-footer {
  padding: 12px 28px;
  font-size: 0.78rem;
  color: #64748b;
  text-align: right;
}
:root.dark .logs-footer { color: #475569; }

/* Responsive */
@media (max-width: 640px) {
  .logs-header { padding: 14px 16px; }
  .logs-stats, .logs-filters { padding-left: 16px; padding-right: 16px; }
  .logs-table-wrap { margin: 0 16px 16px; }
  .logs-footer { padding: 10px 16px; }
  .log-cell-access, .log-cell-source { display: none; }
}
`;
