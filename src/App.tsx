import React, { useState } from 'react';
import { FeeDataProvider } from './context/FeeDataContext';
import { RouteState, Student } from './types';
import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ClassesView } from './components/classes/ClassesView';
import { ClassDetailsView } from './components/classes/ClassDetailsView';
import { StudentsDirectoryView } from './components/students/StudentsDirectoryView';
import { SettingsView } from './components/settings/SettingsView';
import { PaymentModal } from './components/payment/PaymentModal';
import { UnpaidConfirmModal } from './components/payment/UnpaidConfirmModal';
import { StudentDetailModal } from './components/students/StudentDetailModal';
import { AddEditStudentModal } from './components/students/AddEditStudentModal';
import { ToastContainer } from './components/ui/Toast';

const AppContent: React.FC = () => {
  const [route, setRoute] = useState<RouteState>({ tab: 'dashboard' });

  // Modals state
  const [paymentState, setPaymentState] = useState<{ student: Student; month?: string } | null>(null);
  const [unpaidState, setUnpaidState] = useState<{ student: Student; month?: string } | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [addEditState, setAddEditState] = useState<{
    isOpen: boolean;
    student?: Student | null;
    defaultClassId?: string;
  }>({ isOpen: false });

  const handleNavigate = (newRoute: RouteState) => {
    setRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddStudent = (classId?: string) => {
    setAddEditState({
      isOpen: true,
      student: null,
      defaultClassId: classId,
    });
  };

  const handleOpenEditStudent = (student: Student) => {
    setAddEditState({
      isOpen: true,
      student,
    });
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col md:flex-row antialiased selection:bg-slate-700 selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={route.tab}
        onNavigate={handleNavigate}
        onOpenAddStudent={() => handleOpenAddStudent()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopBar
          route={route}
          onNavigate={handleNavigate}
          onOpenAddStudent={() => handleOpenAddStudent()}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 pb-32 md:pb-12">
          {route.tab === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenAddStudent={() => handleOpenAddStudent()}
            />
          )}

          {route.tab === 'classes' && (
            <>
              {route.classId ? (
                <ClassDetailsView
                  classId={route.classId}
                  onNavigate={handleNavigate}
                  onOpenPayment={(s) => setPaymentState({ student: s })}
                  onOpenUnpaid={(s) => setUnpaidState({ student: s })}
                  onOpenStudentDetail={(s) => setDetailStudent(s)}
                  onOpenAddStudent={(cId) => handleOpenAddStudent(cId)}
                />
              ) : (
                <ClassesView onNavigate={handleNavigate} />
              )}
            </>
          )}

          {route.tab === 'students' && (
            <StudentsDirectoryView
              onOpenPayment={(s, month) => setPaymentState({ student: s, month })}
              onOpenUnpaid={(s, month) => setUnpaidState({ student: s, month })}
              onOpenStudentDetail={(s) => setDetailStudent(s)}
              onOpenAddStudent={(cId) => handleOpenAddStudent(cId)}
            />
          )}

          {route.tab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav
        currentTab={route.tab}
        onNavigate={handleNavigate}
      />

      {/* Payment Bottom Sheet / Modal */}
      {paymentState && (
        <PaymentModal
          student={paymentState.student}
          initialMonth={paymentState.month}
          onClose={() => setPaymentState(null)}
          onSuccess={() => {
            if (detailStudent && detailStudent.id === paymentState.student.id) {
              setDetailStudent(null);
            }
          }}
        />
      )}

      {/* Unpaid Confirmation Modal */}
      {unpaidState && (
        <UnpaidConfirmModal
          student={unpaidState.student}
          month={unpaidState.month}
          onClose={() => setUnpaidState(null)}
          onSuccess={() => {
            if (detailStudent && detailStudent.id === unpaidState.student.id) {
              setDetailStudent(null);
            }
          }}
        />
      )}

      {/* Student Details Modal */}
      {detailStudent && (
        <StudentDetailModal
          student={detailStudent}
          onClose={() => setDetailStudent(null)}
          onOpenPayment={(s, month) => {
            setDetailStudent(null);
            setPaymentState({ student: s, month });
          }}
          onOpenUnpaid={(s, month) => {
            setDetailStudent(null);
            setUnpaidState({ student: s, month });
          }}
          onOpenEdit={(s) => {
            setDetailStudent(null);
            handleOpenEditStudent(s);
          }}
        />
      )}

      {/* Add / Edit Student Modal */}
      {addEditState.isOpen && (
        <AddEditStudentModal
          student={addEditState.student}
          defaultClassId={addEditState.defaultClassId}
          onClose={() => setAddEditState({ isOpen: false })}
          onSuccess={() => {
            setAddEditState({ isOpen: false });
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <FeeDataProvider>
      <AppContent />
    </FeeDataProvider>
  );
}
