import React, { useState, useMemo } from 'react';
import { useFeeData } from '../../context/FeeDataContext';
import { Student, RouteState } from '../../types';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowLeft,
  Check,
  Undo2,
  CreditCard,
  User,
  Users,
} from 'lucide-react';

interface ClassDetailsViewProps {
  classId: string;
  onNavigate: (route: RouteState) => void;
  onOpenPayment: (student: Student) => void;
  onOpenUnpaid: (student: Student) => void;
  onOpenStudentDetail: (student: Student) => void;
  onOpenAddStudent: (classId: string) => void;
}

type FilterStatus = 'ALL' | 'PAID' | 'UNPAID';

export const ClassDetailsView: React.FC<ClassDetailsViewProps> = ({
  classId,
  onNavigate,
  onOpenPayment,
  onOpenUnpaid,
  onOpenStudentDetail,
  onOpenAddStudent,
}) => {
  const { classes, students, getClassStats, activeMonth, getStudentMonthRecord, toggleExamFeeStatus } = useFeeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  const currentClass = classes.find((c) => c.id === classId);

  // Class specific stats for activeMonth
  const classStats = getClassStats(classId, activeMonth);

  // Class students
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === classId);
  }, [students, classId]);

  // Filtered & Searched students
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return classStudents.filter((student) => {
      const monthRec = getStudentMonthRecord(student, activeMonth);
      const isPaid = monthRec.feeStatus === 'PAID';

      // Filter by status
      if (statusFilter === 'PAID' && !isPaid) return false;
      if (statusFilter === 'UNPAID' && isPaid) return false;

      // Filter by search query (name)
      if (query) {
        const matchesName = student.name.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      return true;
    }).sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }, [classStudents, searchQuery, statusFilter, activeMonth, getStudentMonthRecord]);

  if (!currentClass) {
    return (
      <div className="p-8 text-center bg-white/60 backdrop-blur-md rounded-3xl border border-white/60">
        <h3 className="text-lg font-bold text-slate-800">Class Not Found</h3>
        <button
          onClick={() => onNavigate({ tab: 'classes' })}
          className="mt-4 px-4 py-2 bg-[#334155] text-white rounded-xl text-sm font-semibold"
        >
          Return to Classes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-200">
      {/* Class Header Card */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            id="back-to-classes-link"
            onClick={() => onNavigate({ tab: 'classes' })}
            className="text-xs font-semibold text-[#334155] hover:text-[#0f172a] bg-white/60 hover:bg-white/90 border border-white/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Classes
          </button>

          <button
            id="add-student-to-class-btn"
            onClick={() => onOpenAddStudent(currentClass.id)}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#334155] hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Student
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#334155] text-white">
                {activeMonth} Fee
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/80 text-slate-800 border border-white/60">
                {classStats.total} Students
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] mt-1.5">
              {currentClass.name}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black text-[#0f172a]">{classStats.percentage}%</div>
              <div className="text-xs font-semibold text-emerald-700">{activeMonth} Paid</div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-white/60 border-t-emerald-500 bg-white/50 flex items-center justify-center font-bold text-xs text-[#0f172a] shadow-xs">
              {classStats.paid}/{classStats.total}
            </div>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-4 w-full h-2.5 bg-white/60 rounded-full overflow-hidden border border-white/40">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${classStats.percentage}%` }}
          />
        </div>

        {/* Metric Summary Pill Row */}
        <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-white/50 text-center">
          <div className="bg-white/50 border border-white/60 p-2.5 rounded-2xl">
            <div className="text-[11px] text-[#64748b] font-medium">Total Students</div>
            <div className="text-sm sm:text-base font-bold text-[#0f172a]">{classStats.total}</div>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-2xl">
            <div className="text-[11px] text-emerald-800 font-medium">{activeMonth} Paid</div>
            <div className="text-sm sm:text-base font-bold text-emerald-700">{classStats.paid}</div>
          </div>
          <div className="bg-rose-50/70 border border-rose-100 p-2.5 rounded-2xl">
            <div className="text-[11px] text-rose-800 font-medium">{activeMonth} Unpaid</div>
            <div className="text-sm sm:text-base font-bold text-rose-700">{classStats.unpaid}</div>
          </div>
        </div>
      </div>

      {/* Instant Search & Filter Controls */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-4 shadow-xl space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="class-student-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔎 Search student name..."
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

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            id="filter-status-all"
            onClick={() => setStatusFilter('ALL')}
            className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 ${
              statusFilter === 'ALL'
                ? 'bg-[#334155] text-white shadow-md'
                : 'bg-white/60 text-[#64748b] hover:bg-white/90 border border-white/70'
            }`}
          >
            <span>All</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-white/20">
              {classStudents.length}
            </span>
          </button>

          <button
            id="filter-status-paid"
            onClick={() => setStatusFilter('PAID')}
            className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 ${
              statusFilter === 'PAID'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paid ({activeMonth})</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-700/20">
              {classStats.paid}
            </span>
          </button>

          <button
            id="filter-status-unpaid"
            onClick={() => setStatusFilter('UNPAID')}
            className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 ${
              statusFilter === 'UNPAID'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-rose-50/80 text-rose-800 hover:bg-rose-100 border border-rose-200/50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unpaid ({activeMonth})</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-rose-700/20">
              {classStats.unpaid}
            </span>
          </button>
        </div>
      </div>

      {/* Student List Count / Results Indicator */}
      <div className="flex items-center justify-between text-xs text-[#64748b] px-1">
        <span>
          Showing <strong>{filteredStudents.length}</strong> of {classStudents.length} students ({activeMonth})
        </span>
        {searchQuery && (
          <span className="text-[#334155] font-semibold">Filtered by: "{searchQuery}"</span>
        )}
      </div>

      {/* Student List View */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-8 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-slate-500 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">No students found</h3>
            <p className="text-xs text-[#64748b] mt-1 max-w-xs mx-auto">
              No students in {currentClass.name} match your current filter and search query for {activeMonth}.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="px-4 py-2 bg-white/80 text-[#334155] font-bold text-xs rounded-xl border border-white shadow-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Mobile & Tablet Card List (< 1024px) */}
          <div className="space-y-2.5 lg:hidden">
            {filteredStudents.map((student) => {
              const monthRecord = getStudentMonthRecord(student, activeMonth);
              const isPaid = monthRecord.feeStatus === 'PAID';
              return (
                <div
                  key={student.id}
                  id={`student-row-mobile-${student.id}`}
                  className={`bg-white/50 backdrop-blur-md rounded-2xl border transition-all p-4 shadow-sm ${
                    isPaid ? 'border-white/80 hover:bg-white/80' : 'border-rose-200/80 bg-rose-50/30 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Student Info */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onOpenStudentDetail(student)}
                    >
                      <h4 className="text-sm font-bold text-[#0f172a] leading-tight hover:text-[#334155] transition-colors">
                        {student.name}
                      </h4>

                      {/* Payment Subtext */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                            <CreditCard className="w-3 h-3 text-emerald-700" />
                            {monthRecord.paymentMode?.replace('_', ' ')} • {monthRecord.paymentDate}
                          </span>
                        ) : (
                          <span className="text-rose-800 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-700" /> {activeMonth} Fee Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
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

                  {/* July Special Exam Fee Row (Mobile - only for July) */}
                  {activeMonth === 'July' && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/60 flex items-center justify-between gap-2 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700">Exam Fees:</span>
                        {monthRecord.examFeeStatus === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <CheckCircle2 className="w-3 h-3 text-purple-700" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-700" /> Unpaid
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExamFeeStatus(student.id, 'July')}
                        className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center gap-1 ${
                          monthRecord.examFeeStatus === 'PAID'
                            ? 'text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs'
                            : 'text-white bg-purple-600 hover:bg-purple-700 shadow-xs'
                        }`}
                      >
                        {monthRecord.examFeeStatus === 'PAID' ? (
                          <>
                            <Undo2 className="w-3 h-3" /> Revert
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" /> Mark Paid
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Direct Action Row */}
                  <div className="mt-3 pt-2.5 border-t border-white/50 flex items-center justify-between gap-2">
                    <button
                      id={`view-detail-btn-${student.id}`}
                      onClick={() => onOpenStudentDetail(student)}
                      className="min-h-[44px] px-3 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" /> Details
                    </button>

                    <div>
                      {!isPaid ? (
                        <button
                          id={`mark-paid-mobile-btn-${student.id}`}
                          onClick={() => onOpenPayment(student)}
                          className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <Check className="w-4 h-4 stroke-[3]" /> Mark {activeMonth} Paid
                        </button>
                      ) : (
                        <button
                          id={`mark-unpaid-mobile-btn-${student.id}`}
                          onClick={() => onOpenUnpaid(student)}
                          className="min-h-[44px] px-3 py-1.5 bg-white/70 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/80 hover:border-rose-200"
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

          {/* Desktop Table View (>= 1024px) */}
          <div className="hidden lg:block bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/40 border-b border-white/60 text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">{activeMonth} Fee</th>
                  {activeMonth === 'July' && (
                    <th className="px-6 py-4">Exam Fees</th>
                  )}
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
                      id={`student-row-desktop-${student.id}`}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onOpenStudentDetail(student)}
                          className="font-bold text-[#0f172a] hover:text-[#334155] text-left cursor-pointer"
                        >
                          {student.name}
                        </button>
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
                      {activeMonth === 'July' && (
                        <td className="px-6 py-4">
                          {monthRecord.examFeeStatus === 'PAID' ? (
                            <button
                              type="button"
                              onClick={() => toggleExamFeeStatus(student.id, 'July')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200/80 hover:bg-purple-200/80 transition-all cursor-pointer shadow-2xs group"
                              title="Click to toggle Exam Fee status"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                              <span>PAID</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleExamFeeStatus(student.id, 'July')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200/80 hover:bg-amber-200/80 transition-all cursor-pointer shadow-2xs group"
                              title="Click to mark Exam Fee as Paid"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                              <span>UNPAID</span>
                            </button>
                          )}
                        </td>
                      )}
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
                            id={`details-desktop-btn-${student.id}`}
                            onClick={() => onOpenStudentDetail(student)}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white border border-white/80 text-xs font-semibold text-slate-700 shadow-xs"
                          >
                            Details
                          </button>
                          {!isPaid ? (
                            <button
                              id={`mark-paid-desktop-btn-${student.id}`}
                              onClick={() => onOpenPayment(student)}
                              className="min-h-[38px] px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Mark as Paid
                            </button>
                          ) : (
                            <button
                              id={`mark-unpaid-desktop-btn-${student.id}`}
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
