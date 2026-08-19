import React, { useState } from 'react';
import { useFeeData } from '../../context/FeeDataContext';
import { School, Database, Download, RotateCcw, Check, AlertTriangle, Users, BookOpen } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDefaultData,
    students,
    classes,
    getOverallStats,
    activeMonth,
    monthsList,
    getStudentMonthRecord,
    isCloudConnected,
    isSyncing,
  } = useFeeData();

  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [term, setTerm] = useState(settings.term || '');
  const [isSaved, setIsSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const stats = getOverallStats(activeMonth);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      schoolName: schoolName.trim() || 'School Fee Manager',
      academicYear: academicYear.trim() || '2026-2027',
      term: term.trim() || 'Regular Academic Session',
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Export Comprehensive CSV with all consolidated academic periods status
  const handleExportCSV = () => {
    const headers = [
      'Student Name',
      'Class',
      `${activeMonth} Status`,
      `${activeMonth} Payment Mode`,
      `${activeMonth} Payment Date`,
      ...monthsList.map((m) => `${m} Status`),
    ];

    const rows = students.map((s) => {
      const currentMonthRec = getStudentMonthRecord(s, activeMonth);
      const allMonthStatuses = monthsList.map((m) => getStudentMonthRecord(s, m).feeStatus);

      return [
        `"${s.name}"`,
        `"${s.className}"`,
        `"${currentMonthRec.feeStatus}"`,
        `"${currentMonthRec.paymentMode ? currentMonthRec.paymentMode.replace('_', ' ') : ''}"`,
        `"${currentMonthRec.paymentDate || ''}"`,
        ...allMonthStatuses.map((st) => `"${st}"`),
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `School_Fee_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Application Settings</h2>
        <p className="text-xs sm:text-sm text-[#64748b]">
          Configure school profile, academic session, and export fee registers
        </p>
      </div>

      {/* School Information Form */}
      <form onSubmit={handleSaveSettings} className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/50">
          <div className="w-8 h-8 rounded-xl bg-white/70 border border-white/80 text-slate-700 flex items-center justify-center shadow-xs">
            <School className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0f172a]">School & Academic Profile</h3>
            <p className="text-xs text-[#64748b]">Appears on navigation header and exported registers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
              School Name
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white text-[#0f172a] shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
              Academic Year
            </label>
            <input
              type="text"
              required
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2026-2027"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white text-[#0f172a] shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
              Session / Title
            </label>
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. Regular Academic Session"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white text-[#0f172a] shadow-xs"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-white/50 flex items-center justify-between">
          <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
            {isSaved && <><Check className="w-4 h-4" /> Settings updated successfully</>}
          </span>
          <button
            id="save-settings-btn"
            type="submit"
            className="min-h-[44px] px-5 py-2.5 bg-[#334155] hover:bg-slate-700 active:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* Database Verification & Status Card */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 border border-emerald-200/60 text-emerald-700 flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Live Firestore Database State</h3>
              <p className="text-xs text-[#64748b]">Real-time cloud synchronized • {activeMonth}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border shadow-xs ${
              isCloudConnected ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200' : 'bg-amber-50/90 text-amber-800 border-amber-200'
            }`}>
              {isSyncing ? 'Syncing...' : isCloudConnected ? '● Cloud Live' : '○ Offline Cache'}
            </span>
            <span className="px-2.5 py-1 bg-white/70 rounded-xl text-xs font-bold text-slate-800 border border-white/70 shadow-xs">
              {activeMonth}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center pt-2">
          <div className="p-3 bg-white/50 rounded-2xl border border-white/60">
            <div className="text-xs text-[#64748b] font-medium flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Classes
            </div>
            <div className="text-base font-black text-[#0f172a] mt-0.5">{classes.length}</div>
          </div>

          <div className="p-3 bg-white/50 rounded-2xl border border-white/60">
            <div className="text-xs text-[#64748b] font-medium flex items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5" /> Students
            </div>
            <div className="text-base font-black text-[#0f172a] mt-0.5">{stats.total}</div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <div className="text-xs text-emerald-800 font-medium">{activeMonth} Paid</div>
            <div className="text-base font-black text-emerald-700 mt-0.5">{stats.paid}</div>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100">
            <div className="text-xs text-rose-800 font-medium">{activeMonth} Unpaid</div>
            <div className="text-base font-black text-rose-700 mt-0.5">{stats.unpaid}</div>
          </div>
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="pb-2 border-b border-white/50">
          <h3 className="text-sm font-bold text-[#0f172a]">Data Management & Export</h3>
          <p className="text-xs text-[#64748b]">Export complete period-wise register or reset default records</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            id="export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="min-h-[44px] flex-1 px-4 py-2.5 rounded-xl border border-white/80 bg-white/60 hover:bg-white text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-700" /> Export Fee Register (CSV)
          </button>

          <button
            id="reset-data-btn"
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-rose-200/80 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Reset to Initial Data
          </button>
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Reset All Student Records?
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              This will re-seed student records across all academic periods and reset settings.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="min-h-[36px] px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-reset-seed-data-btn"
                type="button"
                onClick={async () => {
                  await resetToDefaultData();
                  setShowResetConfirm(false);
                }}
                className="min-h-[36px] px-4 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
