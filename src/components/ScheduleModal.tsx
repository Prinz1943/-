import React, { useState, useEffect } from 'react';
import { ScheduleItem, Executive, CategoryType } from '../types/schedule';
import { COMMON_DRESS_CODES, COMMON_LOCATIONS, COMMON_DEPARTMENTS } from '../data/initialData';
import { getCurrentThaiTime, getCurrentExactThaiTime, getTodayString } from '../utils/thaiDate';
import { X, Clock, MapPin, Shirt, Building2, UserCheck, Calendar, FileText, Trash2, Zap } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<ScheduleItem>) => void;
  onDelete?: (id: string) => void;
  editingItem?: ScheduleItem | null;
  executives: Executive[];
  defaultDate: string;
  defaultCategory?: CategoryType;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingItem,
  executives,
  defaultDate,
  defaultCategory = 'high_executives',
}) => {
  const [executiveId, setExecutiveId] = useState('');
  const [date, setDate] = useState(defaultDate || getTodayString());
  const [time, setTime] = useState(() => getCurrentThaiTime(false, true));
  const [agenda, setAgenda] = useState('');
  const [location, setLocation] = useState('');
  const [dressCode, setDressCode] = useState('ชุดสุภาพ');
  const [department, setDepartment] = useState('สำนักงานจังหวัดลพบุรี (กลุ่มงานอำนวยการ)');

  useEffect(() => {
    if (editingItem) {
      setExecutiveId(editingItem.executiveId);
      setDate(editingItem.date);
      setTime(editingItem.time);
      setAgenda(editingItem.agenda);
      setLocation(editingItem.location);
      setDressCode(editingItem.dressCode);
      setDepartment(editingItem.department);
    } else {
      // Pick first executive matching default category
      const defaultExec = executives.find((e) => e.category === defaultCategory) || executives[0];
      setExecutiveId(defaultExec ? defaultExec.id : '');
      setDate(defaultDate || getTodayString());
      // Suggest current time for new schedules
      setTime(getCurrentThaiTime(false, true));
      setAgenda('');
      setLocation('ห้องประชุมทานตะวัน ชั้น ๕ ศาลากลางจังหวัดลพบุรี อ.เมืองลพบุรี จ.ลพบุรี');
      setDressCode('ชุดสุภาพไว้ทุกข์');
      setDepartment('สำนักงานจังหวัดลพบุรี (กลุ่มงานอำนวยการ)');
    }
  }, [editingItem, isOpen, defaultDate, defaultCategory, executives]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedExec = executives.find((e) => e.id === executiveId);
    if (!selectedExec) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">
              {editingItem ? 'แก้ไขวาระงานผู้บริหาร' : 'เพิ่มวาระงานผู้บริหารใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Executive & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                ผู้บริหาร <span className="text-red-500">*</span>
              </label>
              <select
                value={executiveId}
                onChange={(e) => setExecutiveId(e.target.value)}
                required
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 cursor-pointer shadow-2xs"
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  วันที่ <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDate(getTodayString())}
                  className="text-[11px] text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-0.5"
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
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Time & Quick chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                เวลา <span className="text-red-500">*</span> (เช่น ๐๙.๓๐ น. หรือ 09.30 น.)
              </label>
              <button
                type="button"
                onClick={() => setTime(getCurrentExactThaiTime(false))}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 transition-colors"
                title="ใส่เวลาปัจจุบันขณะนี้"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                ใช้เวลาปัจจุบัน ({exactNow})
              </button>
            </div>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="09.30 น."
              required
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 mr-1">เลือกเวลาด่วน:</span>
              <button
                type="button"
                onClick={() => setTime(exactNow)}
                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors border border-emerald-300 flex items-center gap-0.5"
                title="ตั้งเวลาตามเวลาปัจจุบันขณะนี้"
              >
                <Zap className="w-3 h-3 text-amber-600" />
                ขณะนี้ ({exactNow})
              </button>
              {quickTimes.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTime(t)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors border border-slate-200"
                >
                  {t}
                </button>
              ))}
            </div>
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
              onChange={(e) => setAgenda(e.target.value)}
              required
              placeholder="เช่น ประธานการประชุมคณะกรรมการอำนวยการจัดกิจกรรม..."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sarabun whitespace-pre-line"
            />
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-500" />
                สถานที่ <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">กด Enter เพื่อขึ้นบรรทัดใหม่ได้</span>
            </div>
            <textarea
              rows={2}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="เช่น ห้องประชุมทานตะวัน ชั้น ๕&#10;ศาลากลางจังหวัดลพบุรี อ.เมืองลพบุรี จ.ลพบุรี"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sarabun whitespace-pre-line"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_LOCATIONS.slice(0, 3).map((loc) => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 truncate max-w-xs transition-colors"
                >
                  {loc.split(' ')[0]} {loc.split(' ')[1] || ''}
                </button>
              ))}
            </div>
          </div>

          {/* Dress Code & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Shirt className="w-4 h-4 text-amber-500" />
                  การแต่งกาย
                </label>
                <span className="text-[10px] text-slate-400">กด Enter ตัดคำได้</span>
              </div>
              <textarea
                rows={2}
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                placeholder="เช่น ชุดผ้าไทย โทนสี&#10;ม่วง / สีเหลือง"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sarabun whitespace-pre-line"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_DRESS_CODES.slice(0, 3).map((dc) => (
                  <button
                    type="button"
                    key={dc}
                    onClick={() => setDressCode(dc)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    {dc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  หน่วยงานผู้รับผิดชอบ
                </label>
                <span className="text-[10px] text-slate-400">กด Enter ตัดคำได้</span>
              </div>
              <textarea
                rows={2}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น สำนักงานจังหวัดลพบุรี&#10;(กลุ่มงานอำนวยการ)"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sarabun whitespace-pre-line"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_DEPARTMENTS.slice(0, 2).map((dept) => (
                  <button
                    type="button"
                    key={dept}
                    onClick={() => setDepartment(dept)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 truncate max-w-[200px] transition-colors"
                  >
                    {dept.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {editingItem && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingItem.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบวาระงานนี้
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
              >
                {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มวาระงาน'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
