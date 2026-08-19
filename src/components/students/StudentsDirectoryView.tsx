import React, { useState, useMemo } from 'react';
import { useFeeData } from '../../context/FeeDataContext';
import { Student } from '../../types';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  Check,
  Undo2,
  CreditCard,
  User,
  Users,
} from 'lucide-react';

interface StudentsDirectoryViewProps {
  onOpenPayment: (student: Student) => void;
  onOpenUnpaid: (student: Student) => void;
  onOpenStudentDetail: (student: Student) => void;
  onOpenAddStudent: (classId?: string) => void;
}

export const StudentsDirectoryView: React.FC<StudentsDirectoryViewProps> = ({
  onOpenPayment,
  onOpenUnpaid,
  onOpenStudentDetail,
  onOpenAddStudent,
}) => {
  const { classes, students, settings, getOverallStats, activeMonth, getStudentMonthRecord } = useFeeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  const stats = getOverallStats(activeMonth);

  // Filtered students
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return students.filter((s) => {
      // Class filter
      if (selectedClassId !== 'ALL' && s.classId !== selectedClassId) return false;

      const monthRec = getStudentMonthRecord(s, activeMonth);
      const isPaid = monthRec.feeStatus === 'PAID';

      // Status filter
      if (statusFilter === 'PAID' && !isPaid) return false;
      if (statusFilter === 'UNPAID' && isPaid) return false;

      // Search query
      if (query) {
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesClass = `class ${s.className}`.toLowerCase().includes(query) || s.className.toLowerCase().includes(query);
        if (!matchesName && !matchesClass) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedClassId, statusFilter, activeMonth, getStudentMonthRecord]);

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-white/60 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Student Directory</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#334155] text-xs font-bold text-white shadow-xs">
              {activeMonth} Register
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/70 text-xs font-bold text-slate-800 border border-white/60">
              {students.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
            Search, filter, and record {activeMonth} fee payment for any student across all classes
          </p>
        </div>

        <button
          id="students-dir-add-student-btn"
          onClick={() => onOpenAddStudent(selectedClassId !== 'ALL' ? selectedClassId : undefined)}
          className="min-h-[44px] px-4 py-2 bg-[#334155] hover:bg-slate-700 active:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-4 sm:p-5 shadow-xl space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-student-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔎 Search by student name or class across entire school..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white text-[#0f172a] placeholder:text-[#64748b] shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 px-2 py-0.5 rounded-lg border border-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dropdown Filters (Class & Status) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Class Select */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
              Class
            </label>
            <select
              id="global-class-filter-select"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-white/80 text-xs font-semibold bg-white/70 backdrop-blur-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-xs"
            >
              <option value="ALL">All Classes ({classes.length} Classes)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select / Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
              {activeMonth} Fee Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`min-h-[42px] py-1 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  statusFilter === 'ALL'
                    ? 'bg-[#334155] text-white shadow-md'
                    : 'bg-white/60 text-[#64748b] hover:bg-white/90 border border-white/70'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PAID')}
                className={`min-h-[42px] py-1 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  statusFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('UNPAID')}
                className={`min-h-[42px] py-1 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  statusFilter === 'UNPAID'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-rose-50/80 text-rose-800 hover:bg-rose-100 border border-rose-200/50'
                }`}
              >
                Unpaid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#64748b] px-1">
        <span>
          Showing <strong>{filteredStudents.length}</strong> of {students.length} students ({activeMonth})
        </span>
        {(selectedClassId !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedClassId('ALL');
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-[#334155] hover:text-[#0f172a]"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Directory List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-8 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-slate-500 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">No matching students</h3>
            <p className="text-xs text-[#64748b] mt-1 max-w-xs mx-auto">
              Try adjusting your search query or reset class and status filters for {activeMonth}.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-2.5 lg:hidden">
            {filteredStudents.map((student) => {
              const monthRecord = getStudentMonthRecord(student, activeMonth);
              const isPaid = monthRecord.feeStatus === 'PAID';
              return (
                <div
                  key={student.id}
                  id={`global-student-card-${student.id}`}
                  className={`bg-white/50 backdrop-blur-md rounded-2xl border p-4 shadow-sm transition-all ${
                    isPaid ? 'border-white/80 hover:bg-white/80' : 'border-rose-200/80 bg-rose-50/30 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onOpenStudentDetail(student)}
                    >
                      <h4 className="text-sm font-bold text-[#0f172a] leading-tight">
                        {student.name}
                      </h4>

                      <div className="mt-1.5 flex items-center gap-2 text-xs text-[#64748b]">
                        <span className="font-medium bg-white/70 text-slate-800 px-2 py-0.5 rounded-md border border-white/60">
                          {student.className}
                        </span>
                        {isPaid ? (
                          <span className="text-emerald-800 font-medium">
                            {monthRecord.paymentMode?.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-rose-800 font-semibold">{activeMonth} Unpaid</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200/60">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> UNPAID
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/50 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenStudentDetail(student)}
                      className="min-h-[44px] px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" /> Details
                    </button>

                    <div>
                      {!isPaid ? (
                        <button
                          onClick={() => onOpenPayment(student)}
                          className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Mark {activeMonth} Paid
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenUnpaid(student)}
                          className="min-h-[44px] px-3 py-1.5 bg-white/70 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border border-white/80 hover:border-rose-200"
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Revert Unpaid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/40 border-b border-white/60 text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">{activeMonth} Fee Status</th>
                  <th className="px-6 py-4">Payment Details</th>
                  <th className="px-6 py-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filteredStudents.map((student) => {
                  const monthRecord = getStudentMonthRecord(student, activeMonth);
                  const isPaid = monthRecord.feeStatus === 'PAID';
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onOpenStudentDetail(student)}
                          className="font-bold text-[#0f172a] hover:text-[#334155] text-left"
                        >
                          {student.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 font-medium">
                        {student.className}
                      </td>
                      <td className="px-6 py-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200/60">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> UNPAID
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#64748b]">
                        {isPaid ? (
                          <div>
                            <span className="font-semibold text-slate-800">
                              {monthRecord.paymentMode?.replace('_', ' ')}
                            </span>
                            <span className="text-[#64748b] ml-1.5">• {monthRecord.paymentDate}</span>
                          </div>
                        ) : (
                          <span className="text-rose-800 font-medium">Pending for {activeMonth}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenStudentDetail(student)}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white border border-white/80 text-xs font-semibold text-slate-700 shadow-xs"
                          >
                            Details
                          </button>
                          {!isPaid ? (
                            <button
                              onClick={() => onOpenPayment(student)}
                              className="min-h-[38px] px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Mark as Paid
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenUnpaid(student)}
                              className="min-h-[38px] px-3 py-1.5 bg-white/60 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-white/80 hover:border-rose-200 transition-colors"
                            >
                              <Undo2 className="w-3 h-3" /> Revert Unpaid
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
