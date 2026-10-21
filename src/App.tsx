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
import {
  formatThaiDateTitle,
  getTodayString,
  isToday,
  formatLiveThaiClock,
  getCurrentThaiTime,
} from './utils/thaiDate';
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
  Clock,
  Zap,
  Cloud,
} from 'lucide-react';

import {
  db,
  handleFirestoreError,
  OperationType,
  seedInitialDataIfEmpty,
  saveScheduleToFirestore,
  deleteScheduleFromFirestore,
  saveExecutiveToFirestore,
  deleteExecutiveFromFirestore,
  saveSettingsToFirestore,
  batchSaveExecutivesToFirestore,
  batchRestoreDataToFirestore,
} from './firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

const STORAGE_KEY_EXECS = 'lopburi_schedule_executives_v1';
const STORAGE_KEY_SCHEDS = 'lopburi_schedule_items_v1';
const STORAGE_KEY_SETTINGS = 'lopburi_schedule_settings_v1';
const STORAGE_KEY_ADMIN_AUTH = 'lopburi_admin_auth_v1';


export default function App() {
  // Real-time live clock (updates every second)
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      if (saved) {
        const parsed: ScheduleItem[] = JSON.parse(saved);
        const today = getTodayString();
        const hasToday = parsed.some((s) => s.date === today);
        // If saved schedules only contain past dates (like 2026-10-16) and none for today,
        // clone the items to today's date so today is always populated
        if (!hasToday && parsed.some((s) => s.date === '2026-10-16')) {
          const todayClones: ScheduleItem[] = parsed
            .filter((s) => s.date === '2026-10-16')
            .map((s) => ({
              ...s,
              id: `today-${s.id}`,
              date: today,
            }));
          return [...parsed, ...todayClones];
        }
        return parsed;
      }
      return INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });

  const [settings, setSettings] = useState<DocumentSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          customSealUrl: parsed.customSealUrl || '/assets/lopburi-seal.jpg',
        };
      }
      return INITIAL_SETTINGS;
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

  // Real-time Firestore synchronization
  useEffect(() => {
    // Seed initial data if Firestore collections are empty
    seedInitialDataIfEmpty();

    // 1. Listen to executives collection
    const unsubExecs = onSnapshot(
      collection(db, 'executives'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedExecs: Executive[] = [];
          snapshot.forEach((d) => {
            loadedExecs.push(d.data() as Executive);
          });
          loadedExecs.sort((a, b) => a.order - b.order);
          setExecutives(loadedExecs);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'executives');
      }
    );

    // 2. Listen to schedules collection
    const unsubScheds = onSnapshot(
      collection(db, 'schedules'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedScheds: ScheduleItem[] = [];
          snapshot.forEach((d) => {
            loadedScheds.push(d.data() as ScheduleItem);
          });
          setSchedules(loadedScheds);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'schedules');
      }
    );

    // 3. Listen to settings/config document
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'config'),
      (snapshot) => {
        if (snapshot.exists()) {
          const loadedSettings = snapshot.data() as DocumentSettings;
          setSettings((prev) => ({
            ...prev,
            ...loadedSettings,
          }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/config');
      }
    );

    return () => {
      unsubExecs();
      unsubScheds();
      unsubSettings();
    };
  }, []);

  // Selected date: defaults to today's date (always current)
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayString());

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

  const handleSaveExecutive = async (execData: {
    id?: string;
    name: string;
    position: string;
    category: CategoryType;
  }) => {
    if (execData.id) {
      const updatedExec = {
        ...(executives.find((e) => e.id === execData.id) as Executive),
        ...execData,
      } as Executive;
      setExecutives((prev) =>
        prev.map((e) => (e.id === execData.id ? updatedExec : e))
      );
      await saveExecutiveToFirestore(updatedExec);
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
      await saveExecutiveToFirestore(newExec);
    }
  };

  const handleSaveExecutives = async (newExecs: Executive[]) => {
    setExecutives(newExecs);
    await batchSaveExecutivesToFirestore(newExecs);
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
      message: `ต้องการลบ "${name}" ออกจากทำเนียบผู้บริหารของตารางและคลาวด์ใช่หรือไม่?`,
      confirmText: 'ยืนยันลบ',
      onConfirm: async () => {
        setExecutives((prev) => prev.filter((e) => e.id !== id));
        await deleteExecutiveFromFirestore(id);
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

  // Save to localStorage as offline cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXECS, JSON.stringify(executives));
  }, [executives]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCHEDS, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Handlers for Schedule items (Syncs to Firestore)
  const handleSaveSchedule = async (itemData: Partial<ScheduleItem>) => {
    let targetItem: ScheduleItem;
    if (itemData.id) {
      targetItem = {
        ...(schedules.find((s) => s.id === itemData.id) as ScheduleItem),
        ...itemData,
      } as ScheduleItem;
      setSchedules((prev) =>
        prev.map((s) => (s.id === itemData.id ? targetItem : s))
      );
    } else {
      targetItem = {
        id: `sch-${Date.now()}`,
        executiveId: itemData.executiveId || executives[0]?.id || 'exec-1',
        category: itemData.category || (activeCategory === 'all' ? 'high_executives' : activeCategory),
        date: itemData.date || selectedDate,
        time: itemData.time || '09.30 น.',
        agenda: itemData.agenda || '',
        location: itemData.location || '',
        dressCode: itemData.dressCode || '',
        department: itemData.department || '',
      };
      setSchedules((prev) => [...prev, targetItem]);
    }
    await saveScheduleToFirestore(targetItem);
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
      message: `ต้องการลบวาระงาน${agendaText} จากคลาวด์ Firestore ใช่หรือไม่?`,
      confirmText: 'ยืนยันลบ',
      onConfirm: async () => {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        await deleteScheduleFromFirestore(id);
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
        time: prefill.time || getCurrentThaiTime(false, true),
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

  const handleUpdateSettings = async (newSettings: DocumentSettings) => {
    setSettings(newSettings);
    await saveSettingsToFirestore(newSettings);
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

  const handleRestoreSample = async (
    execs: Executive[],
    scheds: ScheduleItem[],
    setts: DocumentSettings
  ) => {
    setExecutives(execs);
    setSchedules(scheds);
    setSettings(setts);
    setSelectedDate('2026-10-16');
    await batchRestoreDataToFirestore(execs, scheds, setts);
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="cursor-pointer shrink-0" onClick={() => setSelectedDate(getTodayString())} title="คลิกเพื่อกลับสู่วันและเวลาปัจจุบัน">
                <LopburiEmblem size={38} customUrl={settings.customSealUrl} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight truncate sm:whitespace-normal">
                    วาระงานผู้บริหาร
                  </h1>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                    ลพบุรี
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                  สำนักงานจังหวัดลพบุรี
                </p>
              </div>
            </div>

            {/* Real-time Live Clock (Desktop) */}
            <div
              onClick={() => setSelectedDate(getTodayString())}
              title="เวลาปัจจุบันขณะนี้ (คลิกเพื่อแสดงวาระงานวันนี้)"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 text-xs cursor-pointer transition-colors shadow-2xs group shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 group-hover:text-blue-900">เวลาปัจจุบัน:</span>
              </div>
              <div className="flex items-center gap-1 font-mono font-bold text-slate-800 group-hover:text-blue-700">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{formatLiveThaiClock(currentTime, settings.useThaiNumerals, true)}</span>
              </div>
            </div>

            {/* Cloud Persistence Indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[11px] font-sans font-medium shrink-0"
              title="ข้อมูลวาระงานและผู้บริหารเชื่อมต่อและบันทึกอัตโนมัติบน Google Cloud Firestore"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xl:inline">คลาวด์ Firebase</span>
            </div>

            {/* View Mode Toggle and Main Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Switch View Mode: Accessible on all devices */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs shrink-0">
                <button
                  onClick={() => setViewMode('document')}
                  className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium transition-all ${
                    viewMode === 'document'
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="แบบฟอร์มทางการ (A4 แนวนอน)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">ตาราง</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="ไทม์ไลน์การ์ด (อ่านง่ายบนมือถือ)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">การ์ด</span>
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
                className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs shrink-0"
              >
                {settings.useThaiNumerals ? '๑๒๓' : '123'}
              </button>

              {/* Save as PDF direct button */}
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                title="บันทึกทำเป็นไฟล์ PDF (A4 แนวนอน)"
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{isExportingPdf ? 'สร้าง PDF...' : 'บันทึก PDF'}</span>
              </button>

              {/* Share LINE */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                title="คัดลอกข้อความสรุปสำหรับส่ง LINE"
                className="p-1.5 sm:p-2 text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-slate-200 transition-colors shrink-0"
              >
                <Share2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </button>

              {/* Admin Actions vs Public Login */}
              {isAdmin ? (
                <>
                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    เจ้าหน้าที่
                  </div>

                  {/* Add Schedule Button */}
                  <button
                    onClick={() => handleOpenAddSchedule()}
                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors shrink-0"
                    title="เพิ่มวาระงาน"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">เพิ่มวาระ</span>
                  </button>

                  {/* Manage Executives */}
                  <button
                    onClick={() => setIsExecModalOpen(true)}
                    title="จัดการทำเนียบผู้บริหาร"
                    className="p-1.5 sm:p-2 text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shrink-0"
                  >
                    <Users className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    title="ตั้งค่าระบบและรหัสผ่าน"
                    className="p-1.5 sm:p-2 text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shrink-0"
                  >
                    <Settings className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </button>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    title="ออกจากระบบเจ้าหน้าที่"
                    className="p-1.5 sm:p-2 text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors shrink-0"
                  >
                    <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-lg bg-blue-800 text-white hover:bg-blue-900 shadow-sm transition-colors shrink-0"
                  title="เข้าสู่ระบบเจ้าหน้าที่ (สำหรับแก้ไขวาระ)"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">เจ้าหน้าที่</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sub-bar: Category Tabs & Date Navigator */}
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Category Switcher Tabs: horizontal smooth scroll without wrap on mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5 -mx-3 px-3 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveCategory('high_executives')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  activeCategory === 'high_executives'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🏛️ ผู้บริหารระดับสูงของจังหวัด
              </button>
              <button
                onClick={() => setActiveCategory('provincial_office')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  activeCategory === 'provincial_office'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🏢 ผู้บริหารสำนักงานจังหวัด
              </button>
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  activeCategory === 'all'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📑 แสดงทั้งสองส่วน
              </button>
            </div>

            {/* Date Navigator & Picker: horizontal smooth scroll on mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5 -mx-3 px-3 sm:mx-0 sm:px-0">
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs shrink-0">
                <button
                  onClick={() => handleStepDate('prev')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  title="วันก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center px-1.5 sm:px-2 gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer w-[115px] sm:w-auto"
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

              {/* Today / Current Preset Button */}
              {isToday(selectedDate) ? (
                <button
                  onClick={() => setSelectedDate(getTodayString())}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg shadow-2xs flex items-center gap-1.5 shrink-0"
                  title="กำลังแสดงผลตามวันและเวลาปัจจุบัน"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <span>วันนี้ (ปัจจุบัน)</span>
                </button>
              ) : (
                <button
                  onClick={() => setSelectedDate(getTodayString())}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="คลิกเพื่อกลับมาแสดงผลวันและเวลาปัจจุบัน"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>กลับสู่วันนี้</span>
                </button>
              )}

              {/* Sample Date Button */}
              <button
                onClick={() => setSelectedDate('2026-10-16')}
                title="เปิดดูข้อมูลตัวอย่างตามรูปภาพผู้ใช้ วันที่ 16 ต.ค. 2569"
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-2xs shrink-0 ${
                  selectedDate === '2026-10-16'
                    ? 'bg-blue-800 text-white font-semibold'
                    : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                }`}
              >
                ๑๖ ต.ค. (ตัวอย่าง)
              </button>

              {/* Mobile live time indicator */}
              <div className="lg:hidden flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0 shadow-2xs">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>{formatLiveThaiClock(currentTime, settings.useThaiNumerals, false)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 sm:pb-8">
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
            onSwitchView={(mode) => setViewMode(mode)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
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
              settings={settings}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Desktop Floating Action Buttons (Hidden on mobile so it doesn't block content) */}
      <aside className="no-print hidden sm:flex fixed bottom-6 right-6 z-50 flex-row items-center gap-3">
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
          <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-normal">
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
          <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-normal">
            A4
          </span>
        </button>
      </aside>

      {/* Mobile Bottom Dock (Sleek, compact, does not obscure document content) */}
      <nav className="no-print sm:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setViewMode(viewMode === 'document' ? 'cards' : 'document')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            viewMode === 'cards' ? 'text-blue-700 font-bold' : 'text-slate-600'
          }`}
        >
          {viewMode === 'document' ? (
            <LayoutGrid className="w-4 h-4 text-blue-600" />
          ) : (
            <FileText className="w-4 h-4 text-blue-600" />
          )}
          <span>{viewMode === 'document' ? 'ดูแบบการ์ด' : 'ดูแบบตาราง'}</span>
        </button>

        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-rose-700 cursor-pointer disabled:opacity-50"
        >
          {isExportingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
          ) : (
            <FileDown className="w-4 h-4 text-rose-600" />
          )}
          <span>{isExportingPdf ? 'สร้าง PDF' : 'บันทึก PDF'}</span>
        </button>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-emerald-700 cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-emerald-600" />
          <span>แชร์ LINE</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-indigo-700 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-indigo-600" />
          <span>พิมพ์เอกสาร</span>
        </button>

        {isAdmin ? (
          <button
            onClick={() => handleOpenAddSchedule()}
            className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-emerald-700 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>เพิ่มวาระ</span>
          </button>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-blue-900 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-amber-500" />
            <span>เจ้าหน้าที่</span>
          </button>
        )}
      </nav>

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
        onSaveExecutives={handleSaveExecutives}
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
        onUpdateSettings={handleUpdateSettings}
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
