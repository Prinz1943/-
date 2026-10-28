import React, { useState, useEffect, useMemo } from 'react';
import { ScheduleItem, Executive, CategoryType } from '../types/schedule';
import { COMMON_DRESS_CODES, COMMON_LOCATIONS, COMMON_DEPARTMENTS } from '../data/initialData';
import { getCurrentThaiTime, getCurrentExactThaiTime, getTodayString } from '../utils/thaiDate';
import { SearchableCombobox } from './SearchableCombobox';
import {
  X,
  Clock,
  MapPin,
  Shirt,
  Building2,
  UserCheck,
  Calendar,
  FileText,
  Trash2,
  Zap,
  Plus,
  Eraser,
  CheckCircle2,
  History,
  Sparkles,
} from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<ScheduleItem>) => void;
  onDelete?: (id: string) => void;
  editingItem?: ScheduleItem | null;
  executives: Executive[];
  schedules?: ScheduleItem[];
  defaultDate: string;
  defaultCategory?: CategoryType;
}

const STORAGE_KEY_CUSTOM_LOCATIONS = 'lopburi_remembered_locations_v2';
const STORAGE_KEY_CUSTOM_DRESS = 'lopburi_remembered_dress_v2';
const STORAGE_KEY_CUSTOM_DEPTS = 'lopburi_remembered_depts_v2';

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingItem,
  executives,
  schedules = [],
  defaultDate,
  defaultCategory = 'high_executives',
}) => {
  const [executiveId, setExecutiveId] = useState('');
  const [date, setDate] = useState(defaultDate || getTodayString());
  const [time, setTime] = useState(() => getCurrentThaiTime(false, true));
  const [agenda, setAgenda] = useState('');
  const [location, setLocation] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [department, setDepartment] = useState('');

  // Temporary success notice banner after "บันทึกและเพิ่มวาระต่อ"
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Remembered custom items persisted in localStorage
  const [customLocations, setCustomLocations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_LOCATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customDressCodes, setCustomDressCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_DRESS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customDepartments, setCustomDepartments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_DEPTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Automatically sync initial values on modal open or item change
  useEffect(() => {
    if (editingItem) {
      setExecutiveId(editingItem.executiveId);
      setDate(editingItem.date);
      setTime(editingItem.time);
      setAgenda(editingItem.agenda);
      setLocation(editingItem.location);
      setDressCode(editingItem.dressCode);
      setDepartment(editingItem.department);
      setSuccessNotice(null);
      setValidationError(null);
    } else if (isOpen) {
      // Pick first executive matching default category
      const defaultExec = executives.find((e) => e.category === defaultCategory) || executives[0];
      setExecutiveId(defaultExec ? defaultExec.id : '');
      setDate(defaultDate || getTodayString());
      setTime(getCurrentThaiTime(false, true));
      setAgenda('');
      setLocation('');
      setDressCode('');
      setDepartment('');
      setSuccessNotice(null);
      setValidationError(null);
    }
  }, [editingItem, isOpen, defaultDate, defaultCategory, executives]);

  // Merge unique custom items from localStorage + schedules history
  const allCustomLocations = useMemo(() => {
    const fromSchedules = schedules
      .map((s) => s.location?.trim())
      .filter((l): l is string => Boolean(l && l.length > 0));
    return Array.from(new Set([...customLocations, ...fromSchedules]));
  }, [customLocations, schedules]);

  const allCustomDress = useMemo(() => {
    const fromSchedules = schedules
      .map((s) => s.dressCode?.trim())
      .filter((d): d is string => Boolean(d && d.length > 0));
    return Array.from(new Set([...customDressCodes, ...fromSchedules]));
  }, [customDressCodes, schedules]);

  const allCustomDepts = useMemo(() => {
    const fromSchedules = schedules
      .map((s) => s.department?.trim())
      .filter((d): d is string => Boolean(d && d.length > 0));
    return Array.from(new Set([...customDepartments, ...fromSchedules]));
  }, [customDepartments, schedules]);

  // Persist newly entered items into localStorage so they are remembered forever
  const persistRememberedValues = (newLoc: string, newDress: string, newDept: string) => {
    const trimmedLoc = newLoc.trim();
    const trimmedDress = newDress.trim();
    const trimmedDept = newDept.trim();

    if (trimmedLoc) {
      setCustomLocations((prev) => {
        const updated = Array.from(new Set([trimmedLoc, ...prev])).slice(0, 30);
        try {
          localStorage.setItem(STORAGE_KEY_CUSTOM_LOCATIONS, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }

    if (trimmedDress) {
      setCustomDressCodes((prev) => {
        const updated = Array.from(new Set([trimmedDress, ...prev])).slice(0, 30);
        try {
          localStorage.setItem(STORAGE_KEY_CUSTOM_DRESS, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }

    if (trimmedDept) {
      setCustomDepartments((prev) => {
        const updated = Array.from(new Set([trimmedDept, ...prev])).slice(0, 30);
        try {
          localStorage.setItem(STORAGE_KEY_CUSTOM_DEPTS, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  };

  if (!isOpen) return null;

  // Validate form
  const validate = (): boolean => {
    const selectedExec = executives.find((e) => e.id === executiveId);
    if (!selectedExec) {
      setValidationError('กรุณาเลือกผู้บริหาร');
      return false;
    }
    if (!time.trim()) {
      setValidationError('กรุณาระบุเวลา');
      return false;
    }
    if (!agenda.trim()) {
      setValidationError('กรุณากรอกวาระงาน / กิจกรรม / การประชุม');
      return false;
    }
    if (!location.trim()) {
      setValidationError('กรุณาระบุสถานที่');
      return false;
    }
    setValidationError(null);
    return true;
  };

  // 1. Standard Save & Close
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const selectedExec = executives.find((e) => e.id === executiveId);
    if (!selectedExec) return;

    // Save remembered values
    persistRememberedValues(location, dressCode, department);

    onSave({
      id: editingItem ? editingItem.id : undefined,
      executiveId,
      category: selectedExec.category,
      date,
      time: time.trim(),
      agenda: agenda.trim(),
      location: location.trim(),
      dressCode: dressCode.trim(),
      department: department.trim(),
    });
    onClose();
  };

  // 2. Save & Add Next (User feature: "เพิ่มปุ๋มเพิ่มวาระ และ ลบข้อความในช่อง อัตโนมัต")
  const handleSaveAndAddNext = () => {
    if (!validate()) return;

    const selectedExec = executives.find((e) => e.id === executiveId);
    if (!selectedExec) return;

    // Save remembered values
    persistRememberedValues(location, dressCode, department);

    // Trigger save
    onSave({
      id: editingItem ? editingItem.id : undefined,
      executiveId,
      category: selectedExec.category,
      date,
      time: time.trim(),
      agenda: agenda.trim(),
      location: location.trim(),
      dressCode: dressCode.trim(),
      department: department.trim(),
    });

    // Automatically clear fields so the user can immediately add the next agenda!
    setAgenda('');
    setLocation('');
    setDressCode('');
    setDepartment('');
    // Advance time or keep current
    setTime(getCurrentThaiTime(false, true));

    setSuccessNotice('✅ บันทึกวาระสำเร็จแล้ว และลบข้อความในช่องเรียบร้อย พร้อมเพิ่มวาระถัดไปได้ทันที');
    setTimeout(() => {
      setSuccessNotice(null);
    }, 4500);
  };

  // 3. Clear text in all fields manually
  const handleClearAllFields = () => {
    setAgenda('');
    setLocation('');
    setDressCode('');
    setDepartment('');
    setValidationError(null);
  };

  const exactNow = getCurrentExactThaiTime(false);
  const quickTimes = [
    '08.30 น.',
    '09.00 น.',
    '09.30 น.',
    '10.00 น.',
    '11.00 น.',
    '13.00 น.',
    '13.30 น.',
    '14.00 น.',
    '15.00 น.',
    '16.00 น.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl lg:max-w-4xl overflow-visible my-6 sm:my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 sm:px-8 py-4 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-semibold">
              {editingItem ? 'แก้ไขวาระงานผู้บริหาร' : 'เพิ่มวาระงานผู้บริหารใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Notice Banner */}
        {successNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 sm:px-8 py-3 flex items-center justify-between text-emerald-800 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs underline cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 sm:px-8 py-3 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 sm:space-y-7">
          {/* Executive - Full Width with generous whitespace and breathing room */}
          <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>ผู้บริหาร</span> <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {executives.find((e) => e.id === executiveId)?.category === 'high_executives'
                  ? '🏛️ ผู้บริหารระดับสูงของจังหวัด'
                  : '🏢 ผู้บริหารสำนักงานจังหวัด'}
              </span>
            </div>
            <select
              value={executiveId}
              onChange={(e) => {
                setExecutiveId(e.target.value);
                setValidationError(null);
              }}
              required
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 cursor-pointer shadow-2xs"
            >
              <optgroup label="🏛️ วาระงานผู้บริหารระดับสูงของจังหวัดลพบุรี">
                {executives
                  .filter((e) => e.category === 'high_executives')
                  .map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {exec.name} — {exec.position}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="🏢 วาระงานผู้บริหารของสำนักงานจังหวัดลพบุรี">
                {executives
                  .filter((e) => e.category === 'provincial_office')
                  .map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {exec.name} — {exec.position}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Date & Time in 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  วันที่ <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDate(getTodayString())}
                  className="text-[11px] text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  ใช้วันนี้ (ปัจจุบัน)
                </button>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
              />
            </div>

            {/* Time */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  เวลา <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setTime(getCurrentExactThaiTime(false))}
                  className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title="ใส่เวลาปัจจุบันขณะนี้"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  ขณะนี้ ({exactNow})
                </button>
              </div>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="09.30 น."
                required
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Quick times chips */}
          <div className="flex flex-wrap items-center gap-1.5 -mt-2">
            <span className="text-[11px] text-slate-500 mr-1">เลือกเวลาด่วน:</span>
            {quickTimes.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTime(t)}
                className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
              >
                {t}
              </button>
            ))}
          </div>

          {/* Agenda */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                วาระงาน / กิจกรรม / การประชุม <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-emerald-600 font-medium">กด Enter เพื่อตัดคำ/ขึ้นบรรทัดใหม่ได้อิสระ</span>
            </div>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => {
                setAgenda(e.target.value);
                setValidationError(null);
              }}
              required
              placeholder="เช่น ประธานการประชุมคณะกรรมการอำนวยการจัดกิจกรรม..."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sarabun whitespace-pre-line"
            />
          </div>

          {/* Location with Searchable Combobox matching image_fae5a27b.png */}
          <SearchableCombobox
            id="location"
            label="สถานที่"
            required
            multiline={true}
            rows={2}
            icon={<MapPin className="w-4 h-4 text-red-500" />}
            value={location}
            onChange={(val) => {
              setLocation(val);
              setValidationError(null);
            }}
            placeholder="เช่น ห้องประชุมทานตะวัน ชั้น ๕&#10;ศาลากลางจังหวัดลพบุรี อ.เมืองลพบุรี จ.ลพบุรี"
            customOptions={allCustomLocations}
            presetOptions={COMMON_LOCATIONS}
            placement="auto"
            onDeleteCustomOption={(opt) => {
              setCustomLocations((prev) => {
                const next = prev.filter((p) => p !== opt);
                try {
                  localStorage.setItem(STORAGE_KEY_CUSTOM_LOCATIONS, JSON.stringify(next));
                } catch {
                  // ignore
                }
                return next;
              });
            }}
            helperText="กด Enter ตัดคำ/ขึ้นบรรทัดใหม่ได้อิสระ"
          />

          {/* Dress Code & Department with Searchable Combobox */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Dress code */}
            <SearchableCombobox
              id="dressCode"
              label="การแต่งกาย / ชุด"
              multiline={true}
              rows={2}
              icon={<Shirt className="w-4 h-4 text-amber-500" />}
              value={dressCode}
              onChange={(val) => setDressCode(val)}
              placeholder="เช่น ชุดผ้าไทย โทนสีม่วง&#10;/ สีเหลือง"
              customOptions={allCustomDress}
              presetOptions={COMMON_DRESS_CODES}
              placement="top"
              onDeleteCustomOption={(opt) => {
                setCustomDressCodes((prev) => {
                  const next = prev.filter((p) => p !== opt);
                  try {
                    localStorage.setItem(STORAGE_KEY_CUSTOM_DRESS, JSON.stringify(next));
                  } catch {
                    // ignore
                  }
                  return next;
                });
              }}
              helperText="กด Enter ตัดคำได้อิสระ"
            />

            {/* Department matching image_fae5a27b.png */}
            <SearchableCombobox
              id="department"
              label="หน่วยงานผู้รับผิดชอบ"
              multiline={true}
              rows={2}
              icon={<Building2 className="w-4 h-4 text-indigo-500" />}
              value={department}
              onChange={(val) => setDepartment(val)}
              placeholder="เช่น สนง.พระพุทธศาสนาจังหวัดลพบุรี&#10;อ.เมืองลพบุรี จ.ลพบุรี"
              customOptions={allCustomDepts}
              presetOptions={COMMON_DEPARTMENTS}
              placement="top"
              onDeleteCustomOption={(opt) => {
                setCustomDepartments((prev) => {
                  const next = prev.filter((p) => p !== opt);
                  try {
                    localStorage.setItem(STORAGE_KEY_CUSTOM_DEPTS, JSON.stringify(next));
                  } catch {
                    // ignore
                  }
                  return next;
                });
              }}
              helperText="กด Enter ตัดคำได้อิสระ"
            />
          </div>

          {/* Form Actions with Add Next and Clear buttons */}
          <div className="pt-5 mt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {/* Left buttons: Delete (if editing) & Clear all fields */}
            <div className="flex items-center gap-2">
              {editingItem && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(editingItem.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบวาระงานนี้</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleClearAllFields}
                title="ลบข้อความที่พิมพ์อยู่ในช่องทั้งหมด เพื่อเริ่มพิมพ์ใหม่"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5 text-slate-500" />
                <span>ล้างข้อความในช่อง</span>
              </button>
            </div>

            {/* Right buttons: Cancel, Save & Add Next, Save and Close */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              {/* "+ บันทึกและเพิ่มวาระต่อ" button: Saves and automatically clears fields for the next agenda */}
              <button
                type="button"
                onClick={handleSaveAndAddNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="บันทึกวาระปัจจุบัน แล้วลบข้อความในช่องอัตโนมัติ เพื่อกรอกวาระต่อไปได้ทันทีโดยไม่ต้องเปิดหน้าต่างใหม่"
              >
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>บันทึกและเพิ่มวาระต่อ</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {editingItem ? 'บันทึกการแก้ไข' : 'บันทึกวาระงาน'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
