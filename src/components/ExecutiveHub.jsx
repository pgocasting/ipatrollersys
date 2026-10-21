import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Car,
  Shield,
  Building2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MapPin,
  Activity,
  Calendar,
  Search,
  X,
  Clock,
  Info
} from 'lucide-react';

export default function ExecutiveHub({
  activeTab,
  setActiveTab,
  activeCount,
  warningCount,
  inactiveCount,
  totalMunicipalities,
  activePercentage,
  ipatrollerPatrolData = [],
  getTotalYesterdayPatrols,
  getDashboardReferenceDate,
  municipalitiesByDistrict = {},
  commandCenterData = { barangays: [], concernTypes: [], totalReports: 0 },
  userMunicipality,
  getCurrentMonthIncidentsCount,
  getIncidentBreakdown,
  getRecentIncidentsList,
  currentMonthYearLabel,
  districtStats = [],
  onNavigate,
  ipatrollerSearch,
  setIpatrollerSearch,
  ipatrollerDistrictFilter,
  setIpatrollerDistrictFilter,
  commandCenterSearch,
  setCommandCenterSearch,
  commandCenterDistrictFilter,
  setCommandCenterDistrictFilter,
  incidentsSearch,
  setIncidentsSearch,
  incidentsSeverityFilter,
  setIncidentsSeverityFilter,
  DAILY_ACTIVE_COUNT = 14,
  DAILY_WARNING_COUNT = 13,
  userAccessLevel,
  quarryData
}) {
  const refDateObj = getDashboardReferenceDate?.() || { date: new Date(), dayIndex: 0 };
  const refDate = refDateObj.date;
  const refIndex = refDateObj.dayIndex;
  const yesterdayPatrolTotal = getTotalYesterdayPatrols ? getTotalYesterdayPatrols() : 0;
  const incidentsCount = getCurrentMonthIncidentsCount ? getCurrentMonthIncidentsCount() : 0;
  const incidentBreakdown = getIncidentBreakdown ? getIncidentBreakdown() : { types: [], severity: [] };
  const recentIncidents = getRecentIncidentsList ? getRecentIncidentsList() : [];

  if (userAccessLevel === 'quarry-monitoring' && quarryData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Sites</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{quarryData.totalSites}</p>
          </Card>
          <Card className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Sites</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{quarryData.activeSites}</p>
          </Card>
          <Card className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">Compliant</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{quarryData.compliantSites}</p>
          </Card>
          <Card className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">Violations</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{quarryData.violations}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ========================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW HUB                             */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 pb-12">
          {/* Executive Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/3 -mb-6 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Executive Command Center • 1Bataan Peninsula
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Provincial Operations at a Glance
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Unified situational monitoring combining daily municipal patrol operations (14+ standard), barangay weekly report dispatches, and public safety incident logs.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="text-center px-3 border-r border-white/10">
                  <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Munis</p>
                </div>
                <div className="text-center px-3 border-r border-white/10">
                  <p className="text-2xl font-black text-blue-400">{yesterdayPatrolTotal}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Yesterday Patrols</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-2xl font-black text-rose-400">{incidentsCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Incidents</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Core KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. I-Patroller Card */}
            <Card 
              onClick={() => setActiveTab('ipatroller')}
              className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer rounded-2xl group overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patrol Compliance</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      {activeCount}<span className="text-base text-slate-400 font-medium">/{totalMunicipalities || 12}</span>
                    </h3>
                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                      {activePercentage ? activePercentage.toFixed(0) : 0}% Municipalities Active
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> {warningCount} Warning
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> {inactiveCount} Inactive
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>

            {/* 2. Yesterday Total Patrols */}
            <Card 
              onClick={() => setActiveTab('ipatroller')}
              className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer rounded-2xl group overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Patrols (Yesterday)</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      {yesterdayPatrolTotal.toLocaleString()}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target: 168 (14/day × 12 munis)
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Across 3 Districts</span>
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    View List <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Command Center Card */}
            <Card 
              onClick={() => setActiveTab('commandcenter')}
              className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-violet-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer rounded-2xl group overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Command Center</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      {commandCenterData.totalReports ? commandCenterData.totalReports.toLocaleString() : '0'}
                    </h3>
                    <p className="text-xs font-semibold text-violet-600 mt-0.5">
                      Total Barangay Reports
                    </p>
                  </div>
                  <div className="p-3 bg-violet-50 rounded-xl group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-violet-600" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{commandCenterData.barangays.length} Barangays • {commandCenterData.concernTypes.length} Types</span>
                  <ArrowRight className="w-3.5 h-3.5 text-violet-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>

            {/* 4. Incidents Card */}
            <Card 
              onClick={() => setActiveTab('incidents')}
              className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-rose-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer rounded-2xl group overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reported Incidents</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      {incidentsCount}
                    </h3>
                    <p className="text-xs font-semibold text-rose-600 mt-0.5">
                      Logged this month
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{incidentBreakdown.severity?.find(s => s.level === 'High')?.count || 0} High Priority</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3 Module Showcase Launcher Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Module 1: IPatroller */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50/30 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-3">
                  <Car className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">I-Patroller Operations</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Detailed monitoring of patrol quotas for all 12 Bataan municipalities. Inspect compliance levels, warning thresholds, and district breakdown.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Button 
                  onClick={() => setActiveTab('ipatroller')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl"
                >
                  Explore IPatroller Details
                </Button>
                {onNavigate && (
                  <Button 
                    onClick={() => onNavigate('ipatroller')}
                    variant="ghost" 
                    size="icon"
                    title="Open full page"
                    className="text-slate-400 hover:text-blue-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Module 2: Command Center */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-50 via-white to-violet-50/30 border border-violet-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Command Center Reports</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Registry of all barangay reports, classifications of concerns, public assistance, and municipal response tracking.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Button 
                  onClick={() => setActiveTab('commandcenter')}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-4 py-2 rounded-xl"
                >
                  Explore Command Center
                </Button>
                {onNavigate && (
                  <Button 
                    onClick={() => onNavigate('commandcenter')}
                    variant="ghost" 
                    size="icon"
                    title="Open full page"
                    className="text-slate-400 hover:text-violet-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Module 3: Incidents */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-rose-50/30 border border-rose-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Public Safety Incidents</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Incident tracking across traffic violations, accidents, disturbances, and emergency dispatches with severity grading.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Button 
                  onClick={() => setActiveTab('incidents')}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2 rounded-xl"
                >
                  Explore Incidents
                </Button>
                {onNavigate && (
                  <Button 
                    onClick={() => onNavigate('incidents')}
                    variant="ghost" 
                    size="icon"
                    title="Open full page"
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* District Distribution & Top Concern Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* District Distribution Matrix */}
            <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">District Patrol Performance</h3>
                    <p className="text-xs text-slate-500">Active municipalities by legislative district</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setActiveTab('ipatroller')} 
                  variant="ghost" 
                  className="text-xs text-blue-600 hover:bg-blue-50"
                >
                  Details →
                </Button>
              </div>

              <div className="space-y-3.5">
                {districtStats.map((dist, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-800">{dist.name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {dist.active} of {dist.total} Active ({dist.percentage}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${(dist.active / (dist.total || 4)) * 100}%` }}
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      ></div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="text-emerald-600 font-semibold">{dist.active} Active (≥14)</span>
                      <span className="text-amber-600 font-semibold">{dist.warning || 0} Warning (13)</span>
                      <span className="text-rose-600 font-semibold">{dist.inactive || 0} Inactive (≤12)</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Concerns Summary */}
            <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Top Reported Concern Categories</h3>
                    <p className="text-xs text-slate-500">Command Center active issue distribution</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setActiveTab('commandcenter')} 
                  variant="ghost" 
                  className="text-xs text-indigo-600 hover:bg-indigo-50"
                >
                  All Concerns →
                </Button>
              </div>

              <div className="space-y-3">
                {commandCenterData.concernTypes.slice(0, 5).map((concern, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[280px]">
                        #{idx + 1} {concern.type}
                      </span>
                      <Badge variant="secondary" className="font-bold text-[11px] bg-slate-100 text-slate-800">
                        {concern.count}
                      </Badge>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((concern.count / Math.max(...commandCenterData.concernTypes.slice(0, 5).map(c => c.count || 1))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: I-PATROLLER (WITH ALL DETAILS)                     */}
      {/* ========================================================= */}
      {activeTab === 'ipatroller' && (
        <div className="space-y-6 pb-12">
          {/* Toolbar & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search municipality (e.g. Hermosa, Balanga, Bagac)..."
                  value={ipatrollerSearch}
                  onChange={(e) => setIpatrollerSearch(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                />
                {ipatrollerSearch && (
                  <button 
                    onClick={() => setIpatrollerSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* District Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {['ALL', '1ST DISTRICT', '2ND DISTRICT', '3RD DISTRICT'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setIpatrollerDistrictFilter(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      ipatrollerDistrictFilter === d
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d === 'ALL' ? 'All Districts' : d.replace(' DISTRICT', '')}
                  </button>
                ))}
              </div>
            </div>

            {onNavigate && (
              <Button
                onClick={() => onNavigate('ipatroller')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 self-start md:self-auto"
              >
                <span>Full I-Patroller Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Status Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Active (≥14)</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">{activeCount}</p>
                </div>
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 mt-2 font-medium">Standard Target Achieved</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Warning (13)</p>
                  <p className="text-3xl font-black text-amber-600 mt-1">{warningCount}</p>
                </div>
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[11px] text-amber-700 mt-2 font-medium">Near Target Threshold</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">Inactive (≤12)</p>
                  <p className="text-3xl font-black text-rose-600 mt-1">{inactiveCount}</p>
                </div>
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[11px] text-rose-700 mt-2 font-medium">Follow-up Required</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Yesterday Patrols</p>
                  <p className="text-3xl font-black text-blue-600 mt-1">{yesterdayPatrolTotal}</p>
                </div>
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <Car className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[11px] text-blue-700 mt-2 font-medium">Province-wide total volume</p>
            </div>
          </div>

          {/* Comprehensive Municipalities Performance Table */}
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  All Municipalities Performance Registry
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing patrol counts for yesterday ({refDate.toDateString()}) vs Provincial benchmark (14 patrols/day)
                </p>
              </div>
              <Badge variant="outline" className="font-semibold text-slate-600 bg-white">
                12 Bataan Municipalities
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Municipality</th>
                      <th className="py-3 px-4">District</th>
                      <th className="py-3 px-4 text-center">Yesterday Patrols</th>
                      <th className="py-3 px-4">Status & Benchmark</th>
                      <th className="py-3 px-4">Daily Quota Progress</th>
                      <th className="py-3 px-4 text-right">Monthly Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {ipatrollerPatrolData
                      .filter(item => {
                        const matchesSearch = !ipatrollerSearch || item.municipality.toLowerCase().includes(ipatrollerSearch.toLowerCase());
                        const matchesDistrict = ipatrollerDistrictFilter === 'ALL' || item.district === ipatrollerDistrictFilter;
                        return matchesSearch && matchesDistrict;
                      })
                      .map((item, idx) => {
                        const yesterdayPatrols = (item.data && Array.isArray(item.data) && refIndex >= 0 && refIndex < item.data.length)
                          ? (item.data[refIndex] !== null && item.data[refIndex] !== undefined ? item.data[refIndex] : 0)
                          : 0;
                        const isAct = yesterdayPatrols >= DAILY_ACTIVE_COUNT;
                        const isWarn = yesterdayPatrols === DAILY_WARNING_COUNT;
                        const totalMonthly = item.data ? item.data.reduce((acc, v) => acc + (Number(v) || 0), 0) : 0;
                        const progressPercent = Math.min(Math.round((yesterdayPatrols / 14) * 100), 100);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <span>{item.municipality}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {item.district}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`text-base font-black ${
                                isAct ? 'text-emerald-600' : isWarn ? 'text-amber-600' : 'text-rose-600'
                              }`}>
                                {yesterdayPatrols}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {isAct ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  ACTIVE (≥14)
                                </span>
                              ) : isWarn ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  WARNING (13)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  INACTIVE (≤12)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 min-w-[180px]">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                                  <span>{yesterdayPatrols}/14 patrols</span>
                                  <span>{progressPercent}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isAct ? 'bg-emerald-500' : isWarn ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                              {totalMonthly.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* District Cards Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.entries(municipalitiesByDistrict).map(([distName, munis], idx) => {
              const distItems = ipatrollerPatrolData.filter(item => item.district === distName);
              const activeMunis = distItems.filter(item => {
                const count = (item.data && Array.isArray(item.data) && refIndex >= 0 && refIndex < item.data.length)
                  ? (item.data[refIndex] || 0) : 0;
                return count >= DAILY_ACTIVE_COUNT;
              });

              return (
                <Card key={idx} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-900 text-sm">{distName}</h4>
                    <Badge className="bg-blue-100 text-blue-700 font-bold">
                      {activeMunis.length}/{munis.length} Active
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {munis.map((muniName, mIdx) => {
                      const item = ipatrollerPatrolData.find(d => d.municipality === muniName && d.district === distName);
                      const count = (item && item.data && Array.isArray(item.data) && refIndex >= 0 && refIndex < item.data.length)
                        ? (item.data[refIndex] !== null && item.data[refIndex] !== undefined ? item.data[refIndex] : 0) : 0;
                      const isAct = count >= DAILY_ACTIVE_COUNT;
                      const isWarn = count === DAILY_WARNING_COUNT;

                      return (
                        <div key={mIdx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                          <span className="font-semibold text-slate-800">{muniName}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{count} patrols</span>
                            <span className={`w-2 h-2 rounded-full ${
                              isAct ? 'bg-emerald-500' : isWarn ? 'bg-amber-500' : 'bg-rose-500'
                            }`}></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Guide Card */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-bold">Understanding Provincial Patrol Standards:</p>
                <p className="text-blue-800">
                  • <strong className="text-emerald-700 font-bold">Active (14+ Patrols):</strong> Fully compliant with daily provincial minimum target.
                </p>
                <p className="text-blue-800">
                  • <strong className="text-amber-700 font-bold">Warning (13 Patrols):</strong> Just 1 patrol short of standard.
                </p>
                <p className="text-blue-800">
                  • <strong className="text-rose-700 font-bold">Inactive (0–12 Patrols or No Entry):</strong> Under-target; requires follow-up.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: COMMAND CENTER                                     */}
      {/* ========================================================= */}
      {activeTab === 'commandcenter' && (
        <div className="space-y-6 pb-12">
          {/* Toolbar & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search barangay or municipality..."
                  value={commandCenterSearch}
                  onChange={(e) => setCommandCenterSearch(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                />
                {commandCenterSearch && (
                  <button 
                    onClick={() => setCommandCenterSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {['ALL', '1ST DISTRICT', '2ND DISTRICT', '3RD DISTRICT'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setCommandCenterDistrictFilter(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      commandCenterDistrictFilter === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d === 'ALL' ? 'All Districts' : d.replace(' DISTRICT', '')}
                  </button>
                ))}
              </div>
            </div>

            {onNavigate && (
              <Button
                onClick={() => onNavigate('commandcenter')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 self-start md:self-auto"
              >
                <span>Full Command Center Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Command Center Stats Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
              <p className="text-xs font-bold text-violet-800 uppercase tracking-wide">Total Reports</p>
              <p className="text-3xl font-black text-violet-600 mt-1">{commandCenterData.totalReports ? commandCenterData.totalReports.toLocaleString() : '0'}</p>
              <p className="text-[11px] text-violet-700 mt-1 font-medium">Weekly report entries</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Registered Barangays</p>
              <p className="text-3xl font-black text-blue-600 mt-1">{commandCenterData.barangays.length}</p>
              <p className="text-[11px] text-blue-700 mt-1 font-medium">Active coverage across Bataan</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Concern Types</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{commandCenterData.concernTypes.length}</p>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">Classified issue categories</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Coverage</p>
              <p className="text-xl font-black text-slate-900 mt-1">{userMunicipality || 'All Municipalities'}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Provincial jurisdiction</p>
            </div>
          </div>

          {/* 2-Column Command Center Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: All Barangays Registry */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">All Barangays Registry</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Barangay report counts & activity</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold">
                  {commandCenterData.barangays.length} Barangays
                </Badge>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
                  {commandCenterData.barangays
                    .filter(b => {
                      const name = (b.name || b.barangay || '').toLowerCase();
                      const muni = (b.municipality || '').toLowerCase();
                      const search = commandCenterSearch.toLowerCase();
                      const matchesSearch = !search || name.includes(search) || muni.includes(search);
                      const matchesDistrict = commandCenterDistrictFilter === 'ALL' || b.district === commandCenterDistrictFilter;
                      return matchesSearch && matchesDistrict;
                    })
                    .map((barangay, bIdx) => (
                      <div key={bIdx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {barangay.name || barangay.barangay}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 ml-5 mt-0.5">
                            {barangay.municipality} • <span className="text-slate-400">{barangay.district}</span>
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end flex-shrink-0">
                          <Badge className={barangay.reports > 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}>
                            {barangay.reports} {barangay.reports === 1 ? 'Report' : 'Reports'}
                          </Badge>
                          <span className="text-[10px] text-slate-400 mt-1">
                            Last: {barangay.lastReport}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Column 2: Concern Types Ranking */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">All Concern Types Ranking</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Classified reports frequency</p>
                </div>
                <Badge variant="secondary" className="bg-violet-100 text-violet-700 font-bold">
                  {commandCenterData.concernTypes.length} Types
                </Badge>
              </CardHeader>
              <CardContent className="p-5 flex-1">
                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                  {commandCenterData.concernTypes.map((concern, cIdx) => (
                    <div key={cIdx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 uppercase tracking-wide truncate max-w-[300px]">
                          #{cIdx + 1} {concern.type}
                        </span>
                        <Badge className="bg-violet-600 text-white font-bold">
                          {concern.count}
                        </Badge>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-600 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((concern.count / Math.max(...commandCenterData.concernTypes.map(c => c.count || 1))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: INCIDENTS                                          */}
      {/* ========================================================= */}
      {activeTab === 'incidents' && (
        <div className="space-y-6 pb-12">
          {/* Toolbar & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search incident type, location, description..."
                  value={incidentsSearch}
                  onChange={(e) => setIncidentsSearch(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                />
                {incidentsSearch && (
                  <button 
                    onClick={() => setIncidentsSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {['ALL', 'High', 'Medium', 'Low'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setIncidentsSeverityFilter(sev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      incidentsSeverityFilter === sev
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sev === 'ALL' ? 'All Severity' : sev}
                  </button>
                ))}
              </div>
            </div>

            {onNavigate && (
              <Button
                onClick={() => onNavigate('incidents')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 self-start md:self-auto"
              >
                <span>Full Incidents Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Incidents Stats Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">Total Incidents</p>
              <p className="text-3xl font-black text-rose-600 mt-1">{incidentsCount}</p>
              <p className="text-[11px] text-rose-700 mt-1 font-medium">{currentMonthYearLabel}</p>
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wide">High Priority</p>
              <p className="text-3xl font-black text-red-600 mt-1">
                {incidentBreakdown.severity?.find(s => s.level === 'High')?.count || 0}
              </p>
              <p className="text-[11px] text-red-700 mt-1 font-medium">Critical response required</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Medium Priority</p>
              <p className="text-3xl font-black text-amber-600 mt-1">
                {incidentBreakdown.severity?.find(s => s.level === 'Medium')?.count || 0}
              </p>
              <p className="text-[11px] text-amber-700 mt-1 font-medium">Standard response level</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Low Priority</p>
              <p className="text-3xl font-black text-blue-600 mt-1">
                {incidentBreakdown.severity?.find(s => s.level === 'Low')?.count || 0}
              </p>
              <p className="text-[11px] text-blue-700 mt-1 font-medium">Advisory / Routine</p>
            </div>
          </div>

          {/* 2-Column Incidents Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Incident Categories */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-5">
              <h3 className="text-base font-bold text-slate-900 mb-1">Incident Types Breakdown</h3>
              <p className="text-xs text-slate-500 mb-4">Distribution by incident classification</p>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2">
                {incidentBreakdown.types?.map((type, tIdx) => (
                  <div key={tIdx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0"></span>
                      <span className="text-xs font-bold text-slate-800 truncate">{type.name}</span>
                    </div>
                    <Badge className="bg-rose-100 text-rose-700 font-bold ml-2">
                      {type.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Column 2: Recent Incidents Activity Feed */}
            <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Recent Incident Reports Stream</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Chronological incident feed</p>
                </div>
                <Badge variant="outline" className="font-semibold text-slate-600 bg-white">
                  Live Incident Feed
                </Badge>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                  {recentIncidents
                    .filter(inc => {
                      const query = incidentsSearch.toLowerCase();
                      const matchesSearch = !query || 
                        (inc.incidentType && inc.incidentType.toLowerCase().includes(query)) ||
                        (inc.description && inc.description.toLowerCase().includes(query)) ||
                        (inc.location && inc.location.toLowerCase().includes(query)) ||
                        (inc.municipality && inc.municipality.toLowerCase().includes(query));
                      const matchesSev = incidentsSeverityFilter === 'ALL' || 
                        (inc.priority && inc.priority.toLowerCase() === incidentsSeverityFilter.toLowerCase());
                      return matchesSearch && matchesSev;
                    })
                    .slice(0, 30)
                    .map((incident, incIdx) => {
                      const rawDate = incident.when || incident.date || incident.createdAt || incident.timestamp;
                      const incDate = rawDate ? new Date(rawDate.toDate ? rawDate.toDate() : rawDate) : null;
                      const isHigh = incident.priority === 'High';
                      const isMed = incident.priority === 'Medium';

                      return (
                        <div key={incIdx} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-900">
                                  {incident.incidentType || 'General Incident'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isHigh ? 'bg-red-100 text-red-700' : isMed ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {incident.priority || 'Medium'}
                                </span>
                                {incident.status && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                    {incident.status}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-2">
                                {incident.description || 'No description recorded'}
                              </p>

                              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {incident.location ? `${incident.location}, ` : ''}{incident.municipality || 'Bataan'}
                                </span>
                                {incDate && !isNaN(incDate.getTime()) && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {incDate.toLocaleDateString()} {incDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {recentIncidents.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">No recent incidents recorded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
