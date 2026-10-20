import React, { useState, useEffect } from 'react';
import { ScheduleItem, Executive, CategoryType } from '../types/schedule';
import { COMMON_DRESS_CODES, COMMON_LOCATIONS, COMMON_DEPARTMENTS } from '../data/initialData';
import { X, Clock, MapPin, Shirt, Building2, UserCheck, Calendar, FileText, Trash2 } from 'lucide-react';

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
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('09.30 น.');
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
      setDate(defaultDate);
      setTime('09.30 น.');
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

  const quickTimes = ['08.30 น.', '09.00 น.', '09.30 น.', '10.00 น.', '13.00 น.', '13.30 น.', '15.00 น.', '16.00 น.'];

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
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <optgroup label="วาระงานผู้บริหารระดับสูงของจังหวัดลพบุรี">
                  {executives
                    .filter((e) => e.category === 'high_executives')
                    .map((exec) => (
                      <option key={exec.id} value={exec.id}>
                        {exec.name} ({exec.position})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="วาระงานผู้บริหารของสำนักงานจังหวัดลพบุรี">
                  {executives
                    .filter((e) => e.category === 'provincial_office')
                    .map((exec) => (
                      <option key={exec.id} value={exec.id}>
                        {exec.name} ({exec.position})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                วันที่ <span className="text-red-500">*</span>
              </label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              เวลา <span className="text-red-500">*</span> (เช่น ๐๙.๓๐ น. หรือ 09.30 น.)
            </label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              วาระงาน / กิจกรรม / การประชุม <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              required
              placeholder="เช่น ประธานการประชุมคณะกรรมการอำนวยการจัดกิจกรรม..."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" />
              สถานที่ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="เช่น ห้องประชุมทานตะวัน ชั้น ๕ ศาลากลางจังหวัดลพบุรี อ.เมืองลพบุรี จ.ลพบุรี"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_LOCATIONS.slice(0, 3).map((loc) => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 truncate max-w-xs text-left"
                >
                  {loc.split(' ')[0]}...
                </button>
              ))}
            </div>
          </div>

          {/* Dress Code & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Shirt className="w-4 h-4 text-amber-600" />
                การแต่งกาย <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                required
                placeholder="เช่น ชุดสุภาพไว้ทุกข์, ชุดจิตอาสา เสื้อสีดำ"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_DRESS_CODES.slice(0, 4).map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDressCode(d)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-500" />
                หน่วยงานรับผิดชอบ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                placeholder="เช่น สำนักงานจังหวัดลพบุรี (กลุ่มงานอำนวยการ)"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_DEPARTMENTS.slice(0, 3).map((dept) => (
                  <button
                    type="button"
                    key={dept}
                    onClick={() => setDepartment(dept)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 truncate max-w-[200px]"
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
            {editingItem && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  const idToDelete = editingItem.id;
                  onClose();
                  onDelete(idToDelete);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                title="ลบวาระงานนี้ออกจากตาราง"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบวาระงานนี้</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
              >
                {editingItem ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
