import React, { useState } from 'react';
import { Executive, ScheduleItem, CategoryType } from '../types/schedule';
import { formatThaiDateTitle, formatTimeDisplay } from '../utils/thaiDate';
import { X, Copy, Check, MessageSquare, Send } from 'lucide-react';

interface ShareSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  category: CategoryType | 'all';
  executives: Executive[];
  schedules: ScheduleItem[];
  useThaiNumerals: boolean;
}

export const ShareSummaryModal: React.FC<ShareSummaryModalProps> = ({
  isOpen,
  onClose,
  date,
  category,
  executives,
  schedules,
  useThaiNumerals,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formattedDate = formatThaiDateTitle(date, useThaiNumerals);

  const generateSummaryText = () => {
    let output = '';

    const addSection = (cat: CategoryType, title: string) => {
      const catExecs = executives
        .filter((e) => e.category === cat)
        .sort((a, b) => a.order - b.order);

      const itemsInCat = schedules.filter((s) => s.category === cat && s.date === date);
      if (itemsInCat.length === 0) return;

      output += `🏛️ ${title}\n`;
      output += `📅 ประจำ${formattedDate}\n`;
      output += `═══════════════════════════\n`;

      catExecs.forEach((exec) => {
        const items = schedules
          .filter((s) => s.category === cat && s.executiveId === exec.id && s.date === date)
          .sort((a, b) => a.time.localeCompare(b.time));

        if (items.length > 0) {
          output += `\n🔹 ${exec.name}\n   ${exec.position}\n`;
          items.forEach((item, idx) => {
            const timeStr = formatTimeDisplay(item.time, useThaiNumerals);
            output += `   ${idx + 1}) เวลา ${timeStr}\n`;
            output += `      • วาระ: ${item.agenda}\n`;
            output += `      • สถานที่: ${item.location}\n`;
            output += `      • การแต่งกาย: ${item.dressCode}\n`;
            output += `      • หน่วยงาน: ${item.department}\n`;
          });
        }
      });
      output += `\n`;
    };

    if (category === 'all' || category === 'high_executives') {
      addSection('high_executives', 'วาระงานผู้บริหารระดับสูงของจังหวัดลพบุรี');
    }
    if (category === 'all' || category === 'provincial_office') {
      addSection('provincial_office', 'วาระงานผู้บริหารของสำนักงานจังหวัดลพบุรี');
    }

    if (!output.trim()) {
      output = `📋 วาระงานผู้บริหาร จังหวัดลพบุรี\n📅 ประจำ${formattedDate}\n\n- ยังไม่มีวาระงานที่บันทึกไว้ในวันนี้ -`;
    }

    return output;
  };

  const summaryText = generateSummaryText();

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-semibold">ข้อความสรุปวาระงาน (สำหรับส่ง LINE)</h3>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            คัดลอกข้อความด้านล่างนี้เพื่อส่งแจ้งในกลุ่ม LINE กลุ่มหัวหน้าส่วนราชการ หรือกลุ่มประสานงานวาระผู้บริหาร
          </p>

          <textarea
            readOnly
            value={summaryText}
            rows={12}
            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 leading-relaxed select-all"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {copied ? '✅ คัดลอกลงคลิปบอร์ดแล้ว!' : 'คลิกปุ่มเพื่อคัดลอกทั้งหมด'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
