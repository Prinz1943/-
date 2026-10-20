import React, { useState, useEffect } from 'react';
import { Executive, CategoryType } from '../types/schedule';
import { UserCheck, X, Save, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    if (editingExecutive) {
      setName(editingExecutive.name);
      setPosition(editingExecutive.position);
      setCategory(editingExecutive.category);
    } else {
      setName('');
      setPosition(
        defaultCategory === 'high_executives'
          ? 'รองผู้ว่าราชการจังหวัดลพบุรี'
          : 'ผู้อำนวยการกลุ่มงาน'
      );
      setCategory(defaultCategory);
    }
  }, [editingExecutive, defaultCategory, isOpen]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">
              {editingExecutive ? 'แก้ไขข้อมูลผู้บริหาร' : 'เพิ่มผู้บริหารใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              หมวดหมู่สังกัด <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="high_executives">ผู้บริหารระดับสูงของจังหวัดลพบุรี</option>
              <option value="provincial_office">ผู้บริหารของสำนักงานจังหวัดลพบุรี</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ชื่อ-นามสกุล (พร้อมคำนำหน้า) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="เช่น นายวีรพงศ์ ฤทธิ์รอด"
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ตำแหน่ง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
              placeholder="เช่น ผู้ว่าราชการจังหวัดลพบุรี หรือ รองผู้ว่าราชการจังหวัดลพบุรี"
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
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
