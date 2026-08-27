import React, { useState, useMemo } from 'react';
import { useFeeData } from '../../context/FeeDataContext';
import { Student } from '../../types';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
  User,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';

interface StudentsDirectoryViewProps {
  onOpenPayment: (student: Student, month?: string) => void;
  onOpenUnpaid: (student: Student, month?: string) => void;
  onOpenStudentDetail: (student: Student) => void;
  onOpenAddStudent: (classId?: string) => void;
}

export const StudentsDirectoryView: React.FC<StudentsDirectoryViewProps> = ({
  onOpenPayment,
  onOpenStudentDetail,
  onOpenAddStudent,
}) => {
  const { classes, students, activeMonth, monthsList, getStudentMonthRecord } = useFeeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CLEARED'>('ALL');

  // Compute pending status for any student based on academic months up to current activeMonth
  const getStudentDueInfo = useMemo(() => {
    const activeIdx = monthsList.indexOf(activeMonth);
    const dueMonthsRange = activeIdx >= 0 ? monthsList.slice(0, activeIdx + 1) : monthsList;

    return (student: Student) => {
      const pendingMonths = dueMonthsRange.filter(
        (m) => getStudentMonthRecord(student, m).feeStatus !== 'PAID'
      );
      const isPending = pendingMonths.length > 0;
      return {
        pendingMonths,
        pendingCount: pendingMonths.length,
        isPending,
        isCleared: !isPending,
      };
    };
  }, [monthsList, activeMonth, getStudentMonthRecord]);

  // Overall counts
  const summary = useMemo(() => {
    let pendingCount = 0;
    let clearedCount = 0;

    students.forEach((s) => {
      const info = getStudentDueInfo(s);
      if (info.isPending) {
        pendingCount += 1;
      } else {
        clearedCount += 1;
      }
    });

    return {
      total: students.length,
      pending: pendingCount,
      cleared: clearedCount,
    };
  }, [students, getStudentDueInfo]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return students.filter((s) => {
      // Class filter
      if (selectedClassId !== 'ALL' && s.classId !== selectedClassId) return false;

      const dueInfo = getStudentDueInfo(s);

      // Status filter
      if (statusFilter === 'PENDING' && !dueInfo.isPending) return false;
      if (statusFilter === 'CLEARED' && dueInfo.isPending) return false;

      // Search query
      if (query) {
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesClass =
          `class ${s.className}`.toLowerCase().includes(query) ||
          s.className.toLowerCase().includes(query);
        if (!matchesName && !matchesClass) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedClassId, statusFilter, getStudentDueInfo]);

  return (
    <div className="space-y-3.5 pb-20 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white/45 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/60 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
              Student Directory
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Live dues tracking and payment status across all students
            </p>
          </div>

          <button
            id="students-dir-add-student-btn"
            onClick={() => onOpenAddStudent(selectedClassId !== 'ALL' ? selectedClassId : undefined)}
            className="min-h-[42px] px-3.5 sm:px-4 py-2 bg-[#334155] hover:bg-slate-700 active:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
          <div className="px-3 py-1.5 rounded-xl bg-white/70 border border-white/80 text-xs text-slate-700 flex items-center gap-1.5 shadow-xs flex-shrink-0">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Total:</span>
            <strong className="text-slate-900 font-bold">{summary.total}</strong>
          </div>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs flex-shrink-0 active:scale-95 border ${
              statusFilter === 'PENDING'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-rose-50/80 text-rose-800 border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pending Fees:</span>
            <strong className="font-bold">{summary.pending}</strong>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'CLEARED' ? 'ALL' : 'CLEARED')}
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs flex-shrink-0 active:scale-95 border ${
              statusFilter === 'CLEARED'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cleared:</span>
            <strong className="font-bold">{summary.cleared}</strong>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/60 p-3.5 sm:p-4 shadow-xl space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-student-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name or class..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-white/90 bg-white/80 backdrop-blur-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white text-[#0f172a] placeholder:text-[#64748b] shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Row: Class and Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Class Select */}
          <div className="w-full sm:w-48 flex-shrink-0">
            <select
              id="global-class-filter-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-white/90 text-xs font-semibold bg-white/80 backdrop-blur-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-xs"
            >
              <option value="ALL">All Classes ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`min-h-[38px] py-1 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white/70 text-slate-600 hover:bg-white border border-white/80'
              }`}
            >
              All ({summary.total})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`min-h-[38px] py-1 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                statusFilter === 'PENDING'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50/70 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              Pending ({summary.pending})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('CLEARED')}
              className={`min-h-[38px] py-1 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                statusFilter === 'CLEARED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              Cleared ({summary.cleared})
            </button>
          </div>
        </div>
      </div>

      {/* Results Subtitle */}
      <div className="flex items-center justify-between text-xs text-[#64748b] px-1">
        <span>
          Showing <strong>{filteredStudents.length}</strong> of {students.length} students
        </span>
        {(selectedClassId !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedClassId('ALL');
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-slate-700 hover:text-slate-900"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Directory List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-8 text-center space-y-2 shadow-xl">
          <div className="w-11 h-11 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-slate-500 mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0f172a]">No students found</h3>
            <p className="text-xs text-[#64748b] mt-0.5 max-w-xs mx-auto">
              Try adjusting your search query or reset the class & status filters.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Clean Cards */}
          <div className="space-y-2.5 lg:hidden">
            {filteredStudents.map((student) => {
              const dueInfo = getStudentDueInfo(student);
              const isPending = dueInfo.isPending;

              return (
                <div
                  key={student.id}
                  id={`student-card-${student.id}`}
                  className={`bg-white/60 backdrop-blur-md rounded-2xl border p-3.5 shadow-xs transition-all active:scale-[0.99] ${
                    isPending
                      ? 'border-rose-200/80 bg-rose-50/20'
                      : 'border-white/90 bg-white/60'
                  }`}
                >
                  {/* Top Row: Student Name, Class, & Pending Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onOpenStudentDetail(student)}
                    >
                      <h4 className="text-sm font-bold text-[#0f172a] leading-snug">
                        {student.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200/70 text-slate-700 shadow-2xs">
                          {student.className}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Pending Months Status Badge */}
                    <div className="flex-shrink-0">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100/90 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          {dueInfo.pendingCount} {dueInfo.pendingCount === 1 ? 'Month' : 'Months'} Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Fees Cleared
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Pending Months Breakdown */}
                  <div className="mt-2 text-xs">
                    {isPending ? (
                      <div className="flex items-center gap-1.5 text-rose-900 bg-rose-50/80 border border-rose-100/80 px-2.5 py-1.5 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span className="text-[11px] leading-tight font-medium truncate">
                          Due: <strong className="font-semibold">{dueInfo.pendingMonths.join(', ')}</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-800 font-medium px-0.5">
                        ✓ All fees paid up to date ({activeMonth})
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenStudentDetail(student)}
                      className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-white/80 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" /> Details
                    </button>

                    <div>
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => onOpenPayment(student, dueInfo.pendingMonths[0])}
                          className="min-h-[40px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Pay Fees
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenPayment(student, activeMonth)}
                          className="min-h-[40px] px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200/80 shadow-2xs active:scale-95 transition-all"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" /> Advance
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Clean Table */}
          <div className="hidden lg:block bg-white/45 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/50 border-b border-white/60 text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                <tr>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Class</th>
                  <th className="px-6 py-3.5">Status & Dues</th>
                  <th className="px-6 py-3.5">Pending Months</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filteredStudents.map((student) => {
                  const dueInfo = getStudentDueInfo(student);
                  const isPending = dueInfo.isPending;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => onOpenStudentDetail(student)}
                          className="font-bold text-[#0f172a] hover:text-slate-700 text-left"
                        >
                          {student.name}
                        </button>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-700 font-medium">
                        <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200/80 text-slate-800 shadow-2xs font-semibold">
                          {student.className}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            {dueInfo.pendingCount} {dueInfo.pendingCount === 1 ? 'Month' : 'Months'} Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Fees Cleared
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        {isPending ? (
                          <span className="text-rose-900 font-medium bg-rose-50/70 border border-rose-200/50 px-2.5 py-1 rounded-md inline-block">
                            {dueInfo.pendingMonths.join(', ')}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">
                            Paid up to date ({activeMonth})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenStudentDetail(student)}
                            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-xs active:scale-95 transition-all"
                          >
                            Details
                          </button>
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => onOpenPayment(student, dueInfo.pendingMonths[0])}
                              className="min-h-[36px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Pay Fees
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenPayment(student, activeMonth)}
                              className="min-h-[36px] px-3 py-1.5 bg-white/70 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200/80 shadow-2xs active:scale-95 transition-all"
                            >
                              <Sparkles className="w-3 h-3 text-indigo-600" /> Advance
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
