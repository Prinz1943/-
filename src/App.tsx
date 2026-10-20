import React, { useState, useEffect } from 'react';
import {
  Executive,
  ScheduleItem,
  CategoryType,
  DocumentSettings,
} from './types/schedule';
import {
  INITIAL_EXECUTIVES,
  INITIAL_SCHEDULES,
  INITIAL_SETTINGS,
} from './data/initialData';
import { formatThaiDateTitle, getTodayString } from './utils/thaiDate';
import { LopburiEmblem } from './components/LopburiEmblem';
import { OfficialDocumentView } from './components/OfficialDocumentView';
import { CardTimelineView } from './components/CardTimelineView';
import { ScheduleModal } from './components/ScheduleModal';
import { ExecutiveManagerModal } from './components/ExecutiveManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { ShareSummaryModal } from './components/ShareSummaryModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ExecutiveEditModal } from './components/ExecutiveEditModal';
import { ConfirmModal } from './components/ConfirmModal';
import { exportDocumentToPdf } from './utils/pdfGenerator';

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Plus,
  Users,
  Settings,
  FileText,
  LayoutGrid,
  Share2,
  Sparkles,
  RotateCcw,
  Lock,
  LogOut,
  ShieldCheck,
  FileDown,
  Loader2,
} from 'lucide-react';

const STORAGE_KEY_EXECS = 'lopburi_schedule_executives_v1';
const STORAGE_KEY_SCHEDS = 'lopburi_schedule_items_v1';
const STORAGE_KEY_SETTINGS = 'lopburi_schedule_settings_v1';
const STORAGE_KEY_ADMIN_AUTH = 'lopburi_admin_auth_v1';


export default function App() {
  // Initialize state from localStorage or defaults
  const [executives, setExecutives] = useState<Executive[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXECS);
      return saved ? JSON.parse(saved) : INITIAL_EXECUTIVES;
    } catch {
      return INITIAL_EXECUTIVES;
    }
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDS);
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });

  const [settings, setSettings] = useState<DocumentSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Selected date: default to '2026-10-16' (the date from the user's images)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-16');

  // Category tab: 'high_executives' | 'provincial_office' | 'all'
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'all'>('high_executives');

  // View mode: 'document' (official paper matching images) or 'cards' (interactive dashboard)
  const [viewMode, setViewMode] = useState<'document' | 'cards'>('document');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Executive direct edit/add modal state
  const [isExecEditModalOpen, setIsExecEditModalOpen] = useState(false);
  const [selectedExecForEdit, setSelectedExecForEdit] = useState<Executive | null>(null);
  const [execModalCategory, setExecModalCategory] = useState<CategoryType>('high_executives');

  const handleOpenAddExecutive = (cat: CategoryType) => {
    if (!isAdmin) {
      setIsLoginModalOpen(true);
      return;
    }
    setSelectedExecForEdit(null);
    setExecModalCategory(cat);
    setIsExecEditModalOpen(true);
  };

  const handleOpenEditExecutive = (exec: Executive) => {
    if (!isAdmin) {
      setIsLoginModalOpen(true);
      return;
    }
    setSelectedExecForEdit(exec);
    setExecModalCategory(exec.category);
    setIsExecEditModalOpen(true);
  };

  const handleSaveExecutive = (execData: {
    id?: string;
    name: string;
    position: string;
    category: CategoryType;
  }) => {
    if (execData.id) {
      setExecutives((prev) =>
        prev.map((e) =>
          e.id === execData.id
            ? { ...e, name: execData.name, position: execData.position, category: execData.category }
            : e
        )
      );
    } else {
      const maxOrder = executives
        .filter((e) => e.category === execData.category)
        .reduce((max, e) => Math.max(max, e.order), 0);

      const newExec: Executive = {
        id: `exec-${Date.now()}`,
        name: execData.name,
        position: execData.position,
        category: execData.category,
        order: maxOrder + 1,
      };
      setExecutives((prev) => [...prev, newExec]);
    }
  };

  // In-app confirmation dialog state (replaces window.confirm blocked by iframes)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยันลบ',
    onConfirm: () => {},
  });

  const handleDeleteExecutive = (id: string) => {
    if (!isAdmin) {
      setIsLoginModalOpen(true);
      return;
    }
    const execToDelete = executives.find((e) => e.id === id);
    const name = execToDelete ? execToDelete.name : 'ผู้บริหารท่านนี้';
    setConfirmState({
      isOpen: true,
      title: 'ยืนยันการลบผู้บริหาร',
      message: `ต้องการลบ "${name}" ออกจากทำเนียบผู้บริหารของตารางใช่หรือไม่?`,
      confirmText: 'ยืนยันลบ',
      onConfirm: () => {
        setExecutives((prev) => prev.filter((e) => e.id !== id));
      },
    });
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
  };

  const handleLogout = () => {
    setConfirmState({
      isOpen: true,
      title: 'ออกจากระบบเจ้าหน้าที่',
      message: 'ต้องการออกจากระบบเจ้าหน้าที่ (Admin) เพื่อกลับสู่โหมดอ่านอย่างเดียวหรือไม่?',
      confirmText: 'ออกจากระบบ',
      onConfirm: () => {
        setIsAdmin(false);
        localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
      },
    });
  };

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXECS, JSON.stringify(executives));
  }, [executives]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCHEDS, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Handlers for Schedule items
  const handleSaveSchedule = (itemData: Partial<ScheduleItem>) => {
    if (itemData.id) {
      // Edit existing
      setSchedules((prev) =>
        prev.map((s) => (s.id === itemData.id ? ({ ...s, ...itemData } as ScheduleItem) : s))
      );
    } else {
      // Add new
      const newItem: ScheduleItem = {
        id: `sch-${Date.now()}`,
        executiveId: itemData.executiveId || executives[0]?.id || 'exec-1',
        category: itemData.category || 'high_executives',
        date: itemData.date || selectedDate,
        time: itemData.time || '09.30 น.',
        agenda: itemData.agenda || '',
        location: itemData.location || '',
        dressCode: itemData.dressCode || '',
        department: itemData.department || '',
      };
      setSchedules((prev) => [...prev, newItem]);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (!isAdmin) {
      setIsLoginModalOpen(true);
      return;
    }
    const scheduleToDelete = schedules.find((s) => s.id === id);
    const agendaText = scheduleToDelete ? ` "${scheduleToDelete.agenda.slice(0, 40)}..."` : '';
    setConfirmState({
      isOpen: true,
      title: 'ยืนยันการลบวาระงาน',
      message: `ต้องการลบวาระงาน${agendaText} ใช่หรือไม่?`,
      confirmText: 'ยืนยันลบ',
      onConfirm: () => {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
      },
    });
  };

  const handleOpenAddSchedule = (prefill?: Partial<ScheduleItem>) => {
    if (prefill) {
      setEditingSchedule({
        id: '',
        executiveId: prefill.executiveId || '',
        category: prefill.category || (activeCategory === 'all' ? 'high_executives' : activeCategory),
        date: prefill.date || selectedDate,
        time: prefill.time || '09.30 น.',
        agenda: prefill.agenda || '',
        location: prefill.location || 'ห้องประชุมทานตะวัน ชั้น ๕ ศาลากลางจังหวัดลพบุรี อ.เมืองลพบุรี จ.ลพบุรี',
        dressCode: prefill.dressCode || 'ชุดสุภาพไว้ทุกข์',
        department: prefill.department || 'สำนักงานจังหวัดลพบุรี (กลุ่มงานอำนวยการ)',
      });
    } else {
      setEditingSchedule(null);
    }
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (item: ScheduleItem) => {
    setEditingSchedule(item);
    setIsScheduleModalOpen(true);
  };

  // Date step helpers
  const handleStepDate = (direction: 'prev' | 'next') => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + (direction === 'prev' ? -1 : 1));
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const handleRestoreSample = (
    execs: Executive[],
    scheds: ScheduleItem[],
    setts: DocumentSettings
  ) => {
    setExecutives(execs);
    setSchedules(scheds);
    setSettings(setts);
    setSelectedDate('2026-10-16');
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      // Determine element IDs to capture based on activeCategory
      const elementIds: string[] = [];
      if (activeCategory === 'all' || activeCategory === 'high_executives') {
        elementIds.push('document-sheet-high_executives');
      }
      if (activeCategory === 'all' || activeCategory === 'provincial_office') {
        elementIds.push('document-sheet-provincial_office');
      }

      // If in cards view, switch to document view for html2canvas capture
      if (viewMode === 'cards') {
        setViewMode('document');
        await new Promise((r) => setTimeout(r, 200));
      }

      const catName =
        activeCategory === 'provincial_office'
          ? 'สำนักงานจังหวัด'
          : activeCategory === 'all'
          ? 'รวมทั้งหมด'
          : 'ผู้บริหารระดับสูง';
      const fileName = `วาระงาน${catName}_จังหวัดลพบุรี_${selectedDate}.pdf`;

      await exportDocumentToPdf(elementIds, fileName, (status) => setIsExportingPdf(status));
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    // Specifically triggers the browser print dialog for the current document view
    window.print();
  };

  const formattedDateTitle = formatThaiDateTitle(selectedDate, settings.useThaiNumerals);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Banner Navigation (Hidden on print) */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="cursor-pointer" onClick={() => setSelectedDate('2026-10-16')} title="คลิกเพื่อกลับสู่วันที่ตามตัวอย่าง">
                <LopburiEmblem size={44} customUrl={settings.customSealUrl} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    ระบบตารางวาระงานผู้บริหาร
                  </h1>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                    จังหวัดลพบุรี
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  สำนักงานจังหวัดลพบุรี
                </p>
              </div>
            </div>

            {/* View Mode Toggle and Main Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Switch View Mode */}
              <div className="hidden sm:inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
                <button
                  onClick={() => setViewMode('document')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                    viewMode === 'document'
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  แบบฟอร์มทางการ
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  ไทม์ไลน์การ์ด
                </button>
              </div>

              {/* Thai / Arabic Numerals Quick Toggle */}
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    useThaiNumerals: !prev.useThaiNumerals,
                  }))
                }
                title="สลับการแสดงผลเลขไทย (๑ ๒ ๓) และเลขอารบิก (1 2 3)"
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              >
                {settings.useThaiNumerals ? 'เลขไทย ๑๒๓' : 'เลขอารบิก 123'}
              </button>

              {/* Save as PDF direct button */}
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                title="บันทึกทำเป็นไฟล์ PDF (A4 แนวนอน)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>{isExportingPdf ? 'สร้าง PDF...' : 'บันทึก PDF'}</span>
              </button>

              {/* Share LINE */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                title="คัดลอกข้อความสรุปสำหรับส่ง LINE"
                className="p-2 text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-slate-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Admin Actions vs Public Login */}
              {isAdmin ? (
                <>
                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    เจ้าหน้าที่ (Admin)
                  </div>

                  {/* Add Schedule Button */}
                  <button
                    onClick={() => handleOpenAddSchedule()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">เพิ่มวาระงาน</span>
                  </button>

                  {/* Manage Executives */}
                  <button
                    onClick={() => setIsExecModalOpen(true)}
                    title="จัดการทำเนียบผู้บริหาร"
                    className="p-2 text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    title="ตั้งค่าระบบและรหัสผ่าน"
                    className="p-2 text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    title="ออกจากระบบเจ้าหน้าที่"
                    className="p-2 text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-800 text-white hover:bg-blue-900 shadow-sm transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>เข้าสู่ระบบเจ้าหน้าที่</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sub-bar: Category Tabs & Date Navigator */}
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveCategory('high_executives')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeCategory === 'high_executives'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🏛️ ผู้บริหารระดับสูงของจังหวัด
              </button>
              <button
                onClick={() => setActiveCategory('provincial_office')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeCategory === 'provincial_office'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🏢 ผู้บริหารสำนักงานจังหวัด
              </button>
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeCategory === 'all'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📑 แสดงทั้งสองส่วน
              </button>
            </div>

            {/* Date Navigator & Picker */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
                <button
                  onClick={() => handleStepDate('prev')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  title="วันก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center px-2 gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => handleStepDate('next')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  title="วันถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <button
                onClick={() => setSelectedDate(getTodayString())}
                className="px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors shadow-2xs"
              >
                วันนี้
              </button>
              <button
                onClick={() => setSelectedDate('2026-10-16')}
                title="เปิดดูข้อมูลตัวอย่างตามรูปภาพผู้ใช้ วันที่ 16 ต.ค. 2569"
                className="px-2.5 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg transition-colors shadow-2xs"
              >
                ๑๖ ต.ค. ๒๕๖๙ (ตามภาพ)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={viewMode === 'document' ? 'block' : 'hidden print:block'}>
          <OfficialDocumentView
            category={activeCategory}
            date={selectedDate}
            executives={executives}
            schedules={schedules}
            settings={settings}
            isAdmin={isAdmin}
            onPromptLogin={() => setIsLoginModalOpen(true)}
            onEditSchedule={handleEditSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onAddSchedule={handleOpenAddSchedule}
            onEditExecutive={handleOpenEditExecutive}
            onDeleteExecutive={handleDeleteExecutive}
            onAddExecutive={handleOpenAddExecutive}
          />
        </div>
        {viewMode === 'cards' && (
          <div className="print:hidden">
            <CardTimelineView
              category={activeCategory}
              date={selectedDate}
              executives={executives}
              schedules={schedules}
              useThaiNumerals={settings.useThaiNumerals}
              isAdmin={isAdmin}
              onPromptLogin={() => setIsLoginModalOpen(true)}
              onEditSchedule={handleEditSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onAddSchedule={handleOpenAddSchedule}
              onEditExecutive={handleOpenEditExecutive}
              onDeleteExecutive={handleDeleteExecutive}
            />
          </div>
        )}
      </main>

      {/* Floating Action Buttons: Save as PDF & Print */}
      <aside className="no-print fixed bottom-6 right-6 z-50 flex flex-col sm:flex-row items-end sm:items-center gap-3">
        {/* Floating 'Save as PDF' Action Button */}
        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="group flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 hover:from-rose-600 hover:to-rose-800 active:scale-95 text-white font-medium text-sm rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 border border-rose-400/40 cursor-pointer focus:outline-none focus:ring-4 focus:ring-rose-500/30 disabled:opacity-50"
          title="บันทึกทำเป็นไฟล์ PDF โดยตรง (A4 แนวนอน)"
          aria-label="บันทึกทำเป็น PDF"
        >
          {isExportingPdf ? (
            <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
          ) : (
            <FileDown className="w-5 h-5 text-amber-300 transition-transform group-hover:-translate-y-0.5" />
          )}
          <span className="font-semibold tracking-wide">
            {isExportingPdf ? 'กำลังสร้าง PDF...' : 'บันทึกทำเป็น PDF'}
          </span>
          <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-normal hidden sm:inline-block">
            .pdf
          </span>
        </button>

        {/* Floating 'Print' Action Button */}
        <button
          onClick={handlePrint}
          className="group flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-blue-800 via-indigo-800 to-blue-900 hover:from-blue-700 hover:to-indigo-800 active:scale-95 text-white font-medium text-sm rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 border border-blue-400/30 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          title="พิมพ์เอกสารวาระงาน / บันทึกเป็น PDF (A4 แนวนอน)"
          aria-label="พิมพ์เอกสารวาระงาน"
        >
          <Printer className="w-5 h-5 text-amber-300 transition-transform group-hover:-translate-y-0.5" />
          <span className="font-semibold tracking-wide">พิมพ์เอกสาร (Print)</span>
          <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-normal hidden sm:inline-block">
            A4
          </span>
        </button>
      </aside>

      {/* Modals */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
        onDelete={handleDeleteSchedule}
        editingItem={editingSchedule}
        executives={executives}
        defaultDate={selectedDate}
        defaultCategory={activeCategory === 'all' ? 'high_executives' : activeCategory}
      />

      <ExecutiveManagerModal
        isOpen={isExecModalOpen}
        onClose={() => setIsExecModalOpen(false)}
        executives={executives}
        onSaveExecutives={setExecutives}
      />

      <ExecutiveEditModal
        isOpen={isExecEditModalOpen}
        onClose={() => {
          setIsExecEditModalOpen(false);
          setSelectedExecForEdit(null);
        }}
        onSave={handleSaveExecutive}
        onDelete={handleDeleteExecutive}
        editingExecutive={selectedExecForEdit}
        defaultCategory={execModalCategory}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        executives={executives}
        schedules={schedules}
        onRestoreData={handleRestoreSample}
      />

      <ShareSummaryModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        date={selectedDate}
        category={activeCategory}
        executives={executives}
        schedules={schedules}
        useThaiNumerals={settings.useThaiNumerals}
      />

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentPasscode={settings.adminPasscode || '1567'}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Footer (hidden on print) */}
      <footer className="no-print mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>
          ระบบจัดทำและเผยแพร่วาระงานผู้บริหาร จังหวัดลพบุรี • ศาลากลางจังหวัดลพบุรี
        </p>
        <p className="mt-1 text-slate-400">
          ตรงตามระเบียบงานสารบรรณและแบบฟอร์มทางราชการ รองรับการพิมพ์ A4 แนวนอน
        </p>
      </footer>
    </div>
  );
}
