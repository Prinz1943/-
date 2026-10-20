import React, { useState } from 'react';
import { Executive, ScheduleItem, CategoryType } from '../types/schedule';
import { formatTimeDisplay, formatThaiDateTitle } from '../utils/thaiDate';
import {
  Clock,
  MapPin,
  Shirt,
  Building2,
  Edit2,
  Trash2,
  Plus,
  Search,
  UserCheck,
  Calendar,
  Filter,
  CheckCircle2,
} from 'lucide-react';

interface CardTimelineViewProps {
  category: CategoryType | 'all';
  date: string;
  executives: Executive[];
  schedules: ScheduleItem[];
  useThaiNumerals: boolean;
  isAdmin: boolean;
  onPromptLogin: () => void;
  onEditSchedule: (item: ScheduleItem) => void;
  onDeleteSchedule: (id: string) => void;
  onAddSchedule: (prefill?: Partial<ScheduleItem>) => void;
  onEditExecutive?: (exec: Executive) => void;
  onDeleteExecutive?: (id: string) => void;
}

export const CardTimelineView: React.FC<CardTimelineViewProps> = ({
  category,
  date,
  executives,
  schedules,
  useThaiNumerals,
  isAdmin,
  onPromptLogin,
  onEditSchedule,
  onDeleteSchedule,
  onAddSchedule,
  onEditExecutive,
  onDeleteExecutive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecId, setSelectedExecId] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Filter schedules
  const filteredSchedules = schedules.filter((item) => {
    if (item.date !== date) return false;
    if (category !== 'all' && item.category !== category) return false;
    if (selectedExecId !== 'all' && item.executiveId !== selectedExecId) return false;
    if (selectedDept !== 'all' && item.department !== selectedDept) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const exec = executives.find((e) => e.id === item.executiveId);
      const matchAgenda = item.agenda.toLowerCase().includes(q);
      const matchLocation = item.location.toLowerCase().includes(q);
      const matchDress = item.dressCode.toLowerCase().includes(q);
      const matchDept = item.department.toLowerCase().includes(q);
      const matchExec = exec ? exec.name.toLowerCase().includes(q) || exec.position.toLowerCase().includes(q) : false;
      return matchAgenda || matchLocation || matchDress || matchDept || matchExec;
    }

    return true;
  });

  // Sort by time
  const sortedSchedules = [...filteredSchedules].sort((a, b) => a.time.localeCompare(b.time));

  // Extract unique departments for filter
  const departments = Array.from(new Set(schedules.map((s) => s.department))).filter(Boolean);

  // Group by executive or show chronological timeline
  const [viewGrouping, setViewGrouping] = useState<'by_executive' | 'chronological'>('by_executive');

  const execMap = new Map<string, Executive>(executives.map((e) => [e.id, e]));

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาวาระงาน, สถานที่, การแต่งกาย, ผู้บริหาร หรือหน่วยงาน..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Executive */}
            <select
              value={selectedExecId}
              onChange={(e) => setSelectedExecId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">ผู้บริหารทั้งหมด</option>
              {executives
                .filter((e) => category === 'all' || e.category === category)
                .map((exec) => (
                  <option key={exec.id} value={exec.id}>
                    {exec.name} ({exec.position})
                  </option>
                ))}
            </select>

            {/* Filter by Department */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">หน่วยงานทั้งหมด</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Toggle grouping */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                onClick={() => setViewGrouping('by_executive')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewGrouping === 'by_executive'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แยกตามผู้บริหาร
              </button>
              <button
                onClick={() => setViewGrouping('chronological')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewGrouping === 'chronological'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เรียงตามเวลา
              </button>
            </div>

            {isAdmin ? (
              <button
                onClick={() => onAddSchedule()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มวาระงาน
              </button>
            ) : (
              <button
                onClick={onPromptLogin}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-xs ml-auto"
              >
                เข้าสู่ระบบแก้ไข
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedSchedules.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-800">ไม่พบวาระงานตามเงื่อนไขที่เลือก</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {isAdmin
              ? 'ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มวาระงาน" เพื่อลงบันทึกนัดหมายใหม่'
              : 'ยังไม่มีกำหนดการหรือวาระงานในวันและเงื่อนไขที่เลือก'}
          </p>
          {isAdmin && (
            <button
              onClick={() => onAddSchedule()}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              ลงบันทึกวาระงาน
            </button>
          )}
        </div>
      )}

      {/* Render by Executive */}
      {viewGrouping === 'by_executive' && sortedSchedules.length > 0 && (
        <div className="space-y-6">
          {executives
            .filter((e) => category === 'all' || e.category === category)
            .filter((e) => selectedExecId === 'all' || e.id === selectedExecId)
            .map((exec) => {
              const execSchedules = sortedSchedules.filter((s) => s.executiveId === exec.id);
              if (execSchedules.length === 0 && selectedExecId !== 'all') {
                return null;
              }

              return (
                <div
                  key={exec.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  {/* Executive Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm border border-amber-300">
                        {exec.name.slice(0, 3)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                          {exec.name}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                            {exec.category === 'high_executives' ? 'ผู้บริหารระดับสูง' : 'สำนักงานจังหวัด'}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">{exec.position}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        {execSchedules.length} วาระงาน
                      </span>
                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          {onEditExecutive && (
                            <button
                              onClick={() => onEditExecutive(exec)}
                              className="text-xs text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-flex items-center gap-1 font-medium transition-colors"
                              title="แก้ไขชื่อหรือตำแหน่งผู้บริหาร"
                            >
                              <Edit2 className="w-3 h-3" /> แก้ไขผู้บริหาร
                            </button>
                          )}
                          <button
                            onClick={() => onAddSchedule({ executiveId: exec.id, category: exec.category, date })}
                            className="text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1 font-medium transition-colors"
                            title="เพิ่มวาระงานให้ผู้บริหารท่านนี้"
                          >
                            <Plus className="w-3 h-3" /> เพิ่มวาระ
                          </button>
                          {onDeleteExecutive && (
                            <button
                              onClick={() => onDeleteExecutive(exec.id)}
                              className="text-xs text-rose-700 hover:text-rose-900 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 inline-flex items-center font-medium transition-colors"
                              title="ลบผู้บริหารท่านนี้"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule items for this executive */}
                  <div className="p-6">
                    {execSchedules.length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-2">ไม่มีวาระงานสำหรับวันนี้</p>
                    ) : (
                      <div className="space-y-4">
                        {execSchedules.map((item, idx) => (
                          <div
                            key={item.id}
                            className="relative pl-6 pb-4 last:pb-0 border-l-2 border-blue-200 last:border-transparent group"
                          >
                            {/* Timeline node */}
                            <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />

                            <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all group-hover:border-blue-200 group-hover:shadow-xs">
                              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-blue-600 text-white shadow-2xs font-sarabun">
                                    <Clock className="w-3 h-3" />
                                    {formatTimeDisplay(item.time, useThaiNumerals)}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                    <Shirt className="w-3 h-3 text-amber-600" />
                                    {item.dressCode}
                                  </span>
                                </div>

                                {isAdmin && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditSchedule(item);
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                      title="แก้ไขวาระงานนี้"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSchedule(item.id);
                                      }}
                                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                      title="ลบวาระงานนี้"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <p className="text-sm font-medium text-slate-900 font-sarabun leading-relaxed mb-3">
                                {item.agenda}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                                <div className="flex items-center gap-1.5 text-slate-700">
                                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.department}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Render Chronological Timeline */}
      {viewGrouping === 'chronological' && sortedSchedules.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          {sortedSchedules.map((item) => {
            const exec = execMap.get(item.executiveId);
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-blue-700 text-white font-sarabun">
                      <Clock className="w-3 h-3" />
                      {formatTimeDisplay(item.time, useThaiNumerals)}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {exec ? `${exec.name} (${exec.position})` : 'ไม่ระบุผู้บริหาร'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {item.dressCode}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-800 font-sarabun">
                    {item.agenda}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3 h-3 text-red-500" /> {item.location}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Building2 className="w-3 h-3 text-slate-400" /> {item.department}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSchedule(item);
                      }}
                      className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-xs inline-flex items-center gap-1 font-medium cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" /> แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSchedule(item.id);
                      }}
                      className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 text-xs inline-flex items-center gap-1 font-medium cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" /> ลบ
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
