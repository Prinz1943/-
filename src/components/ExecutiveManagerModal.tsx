import React, { useState } from 'react';
import { Executive, CategoryType } from '../types/schedule';
import { X, Plus, Edit2, Trash2, Users, ArrowUp, ArrowDown } from 'lucide-react';

interface ExecutiveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  executives: Executive[];
  onSaveExecutives: (executives: Executive[]) => void;
}

export const ExecutiveManagerModal: React.FC<ExecutiveManagerModalProps> = ({
  isOpen,
  onClose,
  executives,
  onSaveExecutives,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryType>('high_executives');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');

  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');

  if (!isOpen) return null;

  const currentList = executives
    .filter((e) => e.category === activeTab)
    .sort((a, b) => a.order - b.order);

  const handleStartEdit = (exec: Executive) => {
    setEditingId(exec.id);
    setEditName(exec.name);
    setEditPosition(exec.position);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const updated = executives.map((e) =>
      e.id === editingId ? { ...e, name: editName.trim(), position: editPosition.trim() } : e
    );
    onSaveExecutives(updated);
    setEditingId(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const maxOrder = currentList.reduce((max, e) => Math.max(max, e.order), 0);
    const newExec: Executive = {
      id: `exec-${Date.now()}`,
      name: newName.trim(),
      position: newPosition.trim(),
      category: activeTab,
      order: maxOrder + 1,
    };
    onSaveExecutives([...executives, newExec]);
    setNewName('');
    setNewPosition('');
  };

  const handleDelete = (id: string) => {
    onSaveExecutives(executives.filter((e) => e.id !== id));
  };

  const handleMove = (id: string, direction: 'up' | 'down') => {
    const idx = currentList.findIndex((e) => e.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === currentList.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const itemA = currentList[idx];
    const itemB = currentList[targetIdx];

    const updated = executives.map((e) => {
      if (e.id === itemA.id) return { ...e, order: itemB.order };
      if (e.id === itemB.id) return { ...e, order: itemA.order };
      return e;
    });

    onSaveExecutives(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">จัดการทำเนียบผู้บริหาร</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('high_executives')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'high_executives'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ผู้บริหารระดับสูงจังหวัด
          </button>
          <button
            onClick={() => setActiveTab('provincial_office')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'provincial_office'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ผู้บริหารสำนักงานจังหวัด
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Executive List */}
          <div className="space-y-2">
            {currentList.map((exec, idx) => {
              const isEditing = editingId === exec.id;

              return (
                <div
                  key={exec.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 gap-3"
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="ชื่อ-นามสกุล"
                        className="text-xs bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={editPosition}
                        onChange={(e) => setEditPosition(e.target.value)}
                        placeholder="ตำแหน่ง"
                        className="text-xs bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{exec.name}</div>
                      <div className="text-xs text-slate-500">{exec.position}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded"
                        >
                          ยกเลิก
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleMove(exec.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="เลื่อนขึ้น"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(exec.id, 'down')}
                          disabled={idx === currentList.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="เลื่อนลง"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(exec)}
                          className="p-1 text-slate-400 hover:text-blue-600"
                          title="แก้ไขชื่อ/ตำแหน่ง"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exec.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Executive Form */}
          <form onSubmit={handleAdd} className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">เพิ่มผู้บริหารใหม่ในหมวดนี้</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ชื่อ-สกุล (เช่น นายสมหมาย ใจดี)"
                required
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder="ตำแหน่ง (เช่น รองผู้ว่าราชการจังหวัดลพบุรี)"
                required
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มผู้บริหาร
            </button>
          </form>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-900"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
