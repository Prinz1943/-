import React, { useState, useEffect } from 'react';
import { Executive, CategoryType } from '../types/schedule';
import { PRESET_EXECUTIVES, COMMON_EXECUTIVE_POSITIONS } from '../data/initialData';
import { UserCheck, X, Save, Trash2, Sparkles, Check } from 'lucide-react';

interface ExecutiveEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (execData: { id?: string; name: string; position: string; category: CategoryType }) => void;
  onDelete?: (id: string) => void;
  editingExecutive: Executive | null;
  defaultCategory?: CategoryType;
}

export const ExecutiveEditModal: React.FC<ExecutiveEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingExecutive,
  defaultCategory = 'high_executives',
}) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [category, setCategory] = useState<CategoryType>(defaultCategory);
  const [selectedPresetKey, setSelectedPresetKey] = useState('');

  useEffect(() => {
    if (editingExecutive) {
      setName(editingExecutive.name);
      setPosition(editingExecutive.position);
      setCategory(editingExecutive.category);
      setSelectedPresetKey('');
    } else {
      setName('');
      setPosition(
        defaultCategory === 'high_executives'
          ? 'รองผู้ว่าราชการจังหวัดลพบุรี'
          : 'ผู้อำนวยการกลุ่มงานอำนวยการ'
      );
      setCategory(defaultCategory);
      setSelectedPresetKey('');
    }
  }, [editingExecutive, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetName: string, presetPos: string, presetCat: CategoryType) => {
    setName(presetName);
    setPosition(presetPos);
    setCategory(presetCat);
    setSelectedPresetKey(`${presetName}-${presetPos}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingExecutive ? editingExecutive.id : undefined,
      name: name.trim(),
      position: position.trim(),
      category,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!editingExecutive || !onDelete) return;
    onDelete(editingExecutive.id);
    onClose();
  };

  const filteredPresets = PRESET_EXECUTIVES.filter((p) => p.category === category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">
              {editingExecutive ? 'แก้ไขข้อมูลผู้บริหาร' : 'เพิ่มผู้บริหารใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Preset Selector Dropdown */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-1.5 shadow-2xs">
            <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>เลือกจากรายชื่อมาตรฐานที่กำหนดไว้ (คลิกเพื่อเลือกอัตโนมัติ) :</span>
            </label>
            <select
              value={selectedPresetKey}
              onChange={(e) => {
                const key = e.target.value;
                if (!key) return;
                const found = PRESET_EXECUTIVES.find((p) => `${p.name}-${p.position}` === key);
                if (found) {
                  handleSelectPreset(found.name, found.position, found.category);
                }
              }}
              className="w-full text-xs bg-white border border-blue-300 rounded-lg p-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="">-- แตะเพื่อเลือกรายชื่อผู้บริหารจังหวัดลพบุรี --</option>
              <optgroup label="🏛️ วาระงานผู้บริหารระดับสูงของจังหวัดลพบุรี">
                {PRESET_EXECUTIVES.filter((p) => p.category === 'high_executives').map((p, idx) => (
                  <option key={`high-${idx}`} value={`${p.name}-${p.position}`}>
                    {p.name} — {p.position}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🏢 วาระงานผู้บริหารของสำนักงานจังหวัดลพบุรี">
                {PRESET_EXECUTIVES.filter((p) => p.category === 'provincial_office').map((p, idx) => (
                  <option key={`po-${idx}`} value={`${p.name}-${p.position}`}>
                    {p.name} — {p.position}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              หมวดหมู่สังกัด <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="high_executives">ผู้บริหารระดับสูงของจังหวัดลพบุรี</option>
              <option value="provincial_office">ผู้บริหารของสำนักงานจังหวัดลพบุรี</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                ชื่อ-นามสกุล (พร้อมคำนำหน้า) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-blue-600 font-medium">เลือกจากปุ่มด้านล่างได้ทันที</span>
            </div>
            <input
              type="text"
              list="preset-executive-names-datalist"
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                const matched = PRESET_EXECUTIVES.find((p) => p.name === val);
                if (matched) {
                  setPosition(matched.position);
                  setCategory(matched.category);
                }
              }}
              required
              placeholder="เช่น นายวีรพงศ์ ฤทธิ์รอด หรือ นายพิษณุ ประภาธนานันท์"
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
            <datalist id="preset-executive-names-datalist">
              {PRESET_EXECUTIVES.map((p, idx) => (
                <option key={idx} value={p.name}>
                  {p.position} ({p.category === 'high_executives' ? 'ผู้บริหารระดับสูง' : 'สำนักงานจังหวัด'})
                </option>
              ))}
            </datalist>

            {/* Quick Clickable Chips for Names in current category */}
            <div className="mt-2 space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">กดเพื่อเลือกรายชื่อทันที:</div>
              <div className="flex flex-wrap gap-1.5">
                {filteredPresets.map((p, idx) => {
                  const isCurrent = name === p.name;
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectPreset(p.name, p.position, p.category)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800'
                      }`}
                    >
                      {isCurrent && <Check className="w-3 h-3 text-white" />}
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                ตำแหน่ง <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">เลือกตำแหน่งด่วนด้านล่างได้</span>
            </div>
            <input
              type="text"
              list="preset-executive-positions-datalist"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
              placeholder="เช่น ปลัดจังหวัดลพบุรี หรือ ผู้อำนวยการกลุ่มงานอำนวยการ"
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <datalist id="preset-executive-positions-datalist">
              {COMMON_EXECUTIVE_POSITIONS.map((pos, idx) => (
                <option key={idx} value={pos} />
              ))}
            </datalist>

            {/* Quick Clickable Chips for Positions */}
            <div className="flex flex-wrap gap-1 mt-2">
              {COMMON_EXECUTIVE_POSITIONS.map((pos, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPosition(pos)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    position === pos
                      ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {editingExecutive && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบผู้บริหารท่านนี้
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {editingExecutive ? 'บันทึกการแก้ไข' : 'เพิ่มผู้บริหาร'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
