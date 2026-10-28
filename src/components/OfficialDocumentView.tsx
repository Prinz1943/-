import React from 'react';
import { Executive, ScheduleItem, DocumentSettings, CategoryType } from '../types/schedule';
import { LopburiEmblem } from './LopburiEmblem';
import { formatThaiDateTitle, formatTimeDisplay, isToday, formatDocumentStatusTimestamp, toThaiNumerals, toArabicNumerals } from '../utils/thaiDate';
import { Edit2, Plus, Trash2, Printer, Copy, Check, FileDown, Eye, UserPlus, Loader2, Lock, LayoutGrid, Settings } from 'lucide-react';
import { exportDocumentToPdf } from '../utils/pdfGenerator';

interface OfficialDocumentViewProps {
  category: CategoryType | 'all';
  date: string;
  executives: Executive[];
  schedules: ScheduleItem[];
  settings: DocumentSettings;
  isAdmin: boolean;
  onPromptLogin: () => void;
  onEditSchedule: (item: ScheduleItem) => void;
  onDeleteSchedule: (id: string) => void;
  onAddSchedule: (prefill?: Partial<ScheduleItem>) => void;
  onEditExecutive: (exec: Executive) => void;
  onDeleteExecutive: (id: string) => void;
  onAddExecutive: (category: CategoryType) => void;
  onSwitchView?: (view: 'document' | 'cards') => void;
  onOpenSettings?: () => void;
  onUpdateSettings?: (settings: DocumentSettings) => void;
}

export const OfficialDocumentView: React.FC<OfficialDocumentViewProps> = ({
  category,
  date,
  executives,
  schedules,
  settings,
  isAdmin,
  onPromptLogin,
  onEditSchedule,
  onDeleteSchedule,
  onAddSchedule,
  onEditExecutive,
  onDeleteExecutive,
  onAddExecutive,
  onSwitchView,
  onOpenSettings,
  onUpdateSettings,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const [downloadNotice, setDownloadNotice] = React.useState('');
  const [liveDate, setLiveDate] = React.useState<Date>(new Date());

  React.useEffect(() => {
    // Keep live time current
    const timer = setInterval(() => {
      setLiveDate(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);


  // Determine which sections to render
  const sectionsToRender: { id: CategoryType; title: string }[] = [];
  if (category === 'all' || category === 'high_executives') {
    sectionsToRender.push({
      id: 'high_executives',
      title: 'วาระงานผู้บริหารระดับสูงของจังหวัดลพบุรี',
    });
  }
  if (category === 'all' || category === 'provincial_office') {
    sectionsToRender.push({
      id: 'provincial_office',
      title: 'วาระงานผู้บริหารของสำนักงานจังหวัดลพบุรี',
    });
  }

  const isPortrait = (settings.orientation ?? 'portrait') === 'portrait';

  const handleDownloadPdf = async () => {
    const ids = sectionsToRender.map((s) => `document-sheet-${s.id}`);
    const catName = category === 'provincial_office' ? 'สำนักงานจังหวัด' : (category === 'all' ? 'รวมทั้งหมด' : 'ผู้บริหารระดับสูง');
    const fileName = `วาระงาน${catName}_จังหวัดลพบุรี_${date}.pdf`;
    setDownloadNotice('กำลังสร้างไฟล์ PDF และดาวน์โหลดลงเครื่อง...');
    const ok = await exportDocumentToPdf(ids, fileName, setIsExportingPdf, settings.orientation ?? 'portrait');
    if (ok) {
      setDownloadNotice(`ดาวน์โหลดไฟล์ "${fileName}" ลงในเครื่องเรียบร้อยแล้ว`);
    } else {
      setDownloadNotice('ไม่สามารถดาวน์โหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    }
    setTimeout(() => {
      setDownloadNotice('');
    }, 5000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = (targetCategory: CategoryType, title: string) => {
    const formattedDate = formatThaiDateTitle(date, settings.useThaiNumerals);
    const catExecs = executives
      .filter((e) => e.category === targetCategory)
      .sort((a, b) => a.order - b.order);

    let text = `📋 ${title}\n📅 ${formattedDate}\n------------------------\n`;

    catExecs.forEach((exec) => {
      const items = schedules
        .filter((s) => s.category === targetCategory && s.executiveId === exec.id && s.date === date)
        .sort((a, b) => a.time.localeCompare(b.time));

      if (items.length > 0) {
        text += `\n👤 ${exec.name} (${exec.position})\n`;
        items.forEach((item, idx) => {
          text += `  ${idx + 1}. เวลา: ${item.time}\n`;
          text += `     วาระงาน: ${item.agenda}\n`;
          text += `     สถานที่: ${item.location}\n`;
          text += `     การแต่งกาย: ${item.dressCode}\n`;
          text += `     หน่วยงาน: ${item.department}\n`;
        });
      }
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = formatThaiDateTitle(date, settings.useThaiNumerals);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Top Action Toolbar (hidden on print) */}
      <div className="no-print bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>แบบฟอร์มทางการ ({isPortrait ? 'A4 แนวตั้ง' : 'A4 แนวนอน'})</span>
          </span>

          {/* Orientation Toggle: 📄 แนวตั้ง / 📑 แนวนอน */}
          {onUpdateSettings && (
            <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, orientation: 'portrait' })}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  isPortrait
                    ? 'bg-white text-blue-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
                title="ปรับตารางเป็นแนวตั้ง (A4 Portrait)"
              >
                <span>📄 แนวตั้ง</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, orientation: 'landscape' })}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  !isPortrait
                    ? 'bg-white text-blue-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
                title="ปรับตารางเป็นแนวนอน (A4 Landscape)"
              >
                <span>📑 แนวนอน</span>
              </button>
            </div>
          )}
          {isToday(date) ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              วาระงานวันนี้ (ปัจจุบัน)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
              วันที่: {formatThaiDateTitle(date, settings.useThaiNumerals)}
            </span>
          )}
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              สถานะ: เจ้าหน้าที่
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              บุคคลทั่วไป (ดูเท่านั้น)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {isAdmin ? (
            <button
              onClick={() => onAddSchedule()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มวาระใหม่</span>
            </button>
          ) : (
            <button
              onClick={onPromptLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>เข้าสู่ระบบแก้ไข</span>
            </button>
          )}

          <button
            onClick={() => handleCopyText(
              category === 'provincial_office' ? 'provincial_office' : 'high_executives',
              category === 'provincial_office'
                ? 'วาระงานผู้บริหารของสำนักงานจังหวัดลพบุรี'
                : 'วาระงานผู้บริหารระดับสูงของจังหวัดลพบุรี'
            )}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300 cursor-pointer"
            title="คัดลอกข้อความสรุปสำหรับส่ง LINE หรือบันทึกข้อความ"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'ส่ง LINE'}</span>
          </button>

          {/* Download PDF button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg bg-rose-700 hover:bg-rose-800 active:scale-95 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="ดาวน์โหลดและบันทึกไฟล์เป็น PDF โดยตรง"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'กำลังสร้าง...' : 'บันทึก PDF'}</span>
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
            title="เปิดหน้าต่างพิมพ์ของเบราว์เซอร์"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Direct PDF Download Notice */}
      {downloadNotice && (
        <div className="no-print -mt-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3 flex items-center gap-2.5 shadow-xs text-xs font-medium animate-in fade-in duration-200">
          <FileDown className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Mobile Hint Banner for Table Scrolling or Switch to Card View */}
      <div className="no-print sm:hidden -mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">📱</span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-blue-900 leading-tight">
              ตารางกว้าง เลื่อนซ้าย-ขวาได้
            </p>
            <p className="text-[11px] text-blue-700 truncate">
              หรือสลับเป็นมุมมองการ์ดเพื่ออ่านสบายตา
            </p>
          </div>
        </div>
        {onSwitchView && (
          <button
            onClick={() => onSwitchView('cards')}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>ดูแบบการ์ด</span>
          </button>
        )}
      </div>

      {/* Render Document Sheets */}
      {sectionsToRender.map((section, sectionIdx) => {
        const catExecs = executives
          .filter((e) => e.category === section.id)
          .sort((a, b) => a.order - b.order);

        // Group schedules for each executive
        const execRowsData = catExecs.map((exec) => {
          const items = schedules
            .filter((s) => s.category === section.id && s.executiveId === exec.id && s.date === date)
            .sort((a, b) => a.time.localeCompare(b.time));
          return { exec, items };
        });

        const hasAnySchedule = execRowsData.some((g) => g.items.length > 0);

        return (
          <div
            key={section.id}
            id={`document-sheet-${section.id}`}
            className={`official-document-sheet bg-white ${
              isPortrait ? 'max-w-4xl p-3.5 sm:p-7 md:p-8' : 'max-w-6xl p-3.5 sm:p-8 md:p-12'
            } shadow-sm rounded-lg border border-slate-300 mx-auto font-sarabun text-black ${
              sectionIdx > 0 ? 'page-break-before print:mt-8' : ''
            }`}
            style={{ minHeight: '600px', backgroundColor: '#ffffff' }}
          >
            {/* Header: Seal Emblem */}
            {settings.showSeal && (
              <div className="mb-3 text-center">
                <LopburiEmblem
                  size={settings.sealSize || 84}
                  customUrl={settings.customSealUrl}
                />
              </div>
            )}

            {/* Document Title & Date */}
            <div className="text-center mb-5 sm:mb-6 space-y-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-black leading-snug">
                {section.title}
              </h1>
              <p className="text-base sm:text-lg md:text-xl font-bold text-black">
                {formattedDate}
              </p>
            </div>

            {/* Official Table Matching Images with smooth mobile horizontal scroll and min-width */}
            <div className="overflow-x-auto -mx-1 sm:mx-0 pb-2 scrollbar-thin">
              <table className={`official-table bg-white ${isPortrait ? 'min-w-[650px]' : 'min-w-[820px]'} w-full border-collapse border-2 border-black text-[13px] sm:text-[13.5px] leading-snug`}>
                <thead>
                  <tr className="bg-white">
                    <th className="border-2 border-black px-2 py-2 font-bold text-center w-[20.5%] min-w-[125px] align-middle">
                      <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                        <span>ผู้บริหาร</span>
                        {isAdmin && (
                          <button
                            onClick={() => onAddExecutive(section.id)}
                            className="no-print p-0.5 px-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] sm:text-[11px] font-normal inline-flex items-center gap-0.5 transition-colors"
                            title="เพิ่มผู้บริหารใหม่ในตารางนี้"
                          >
                            <UserPlus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">เพิ่ม</span>
                          </button>
                        )}
                      </div>
                    </th>
                    <th className="border-2 border-black px-1 py-2 font-bold text-center w-[5.5%] min-w-[38px] max-w-[50px] align-middle text-[11.5px] sm:text-[12px] whitespace-nowrap">
                      เวลา
                    </th>
                    <th className="border-2 border-black px-2.5 py-2 font-bold text-center w-[38%] min-w-[170px] align-middle">
                      วาระงาน
                    </th>
                    <th className="border-2 border-black px-1.5 py-2 font-bold text-center w-[16%] min-w-[95px] align-middle">
                      สถานที่
                    </th>
                    <th className="border-2 border-black px-1.5 py-2 font-bold text-center w-[10%] min-w-[70px] align-middle">
                      การแต่งกาย
                    </th>
                    <th className="border-2 border-black px-1.5 py-2 font-bold text-center w-[10%] min-w-[70px] align-middle">
                      หน่วยงาน
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {execRowsData.map(({ exec, items }) => {
                    if (items.length === 0) {
                      // Executive has no item today
                      return (
                        <tr key={`empty-${exec.id}`} className="bg-white">
                          {/* Executive column */}
                          <td className="border-2 border-black px-2 py-2.5 align-top font-sarabun text-left bg-white w-[20.5%] min-w-[125px]">
                            <div className="font-semibold text-black text-[13px] sm:text-[13.5px] whitespace-nowrap leading-tight">{exec.name}</div>
                            <div className="text-slate-800 text-[11.5px] sm:text-[12px] leading-tight mt-0.5">{exec.position}</div>
                            {isAdmin && (
                              <div className="no-print mt-2 pt-1 border-t border-slate-200 flex flex-wrap items-center gap-1">
                                <button
                                  onClick={() => onEditExecutive(exec)}
                                  title="แก้ไขชื่อหรือตำแหน่งผู้บริหารท่านนี้"
                                  className="text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-sans inline-flex items-center gap-0.5 transition-colors"
                                >
                                  <Edit2 className="w-2.5 h-2.5" /> แก้ไข
                                </button>
                                <button
                                  onClick={() => onAddSchedule({
                                    executiveId: exec.id,
                                    category: section.id,
                                    date,
                                  })}
                                  title="เพิ่มวาระงานให้ผู้บริหารท่านนี้"
                                  className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 font-sans inline-flex items-center gap-0.5 transition-colors"
                                >
                                  <Plus className="w-2.5 h-2.5" /> วาระ
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteExecutive(exec.id);
                                  }}
                                  title="ลบผู้บริหารท่านนี้ออกจากตาราง"
                                  className="text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 px-1.5 py-0.5 rounded border border-rose-200 font-sans inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-2.5 h-2.5" /> ลบ
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="border-2 border-black px-1 py-2 text-center text-slate-400 font-sarabun text-xs bg-white w-[5.5%] min-w-[38px] max-w-[50px] whitespace-nowrap">-</td>
                          <td className="border-2 border-black px-2.5 py-2.5 text-center text-slate-400 font-sarabun italic bg-white">
                            - ไม่มีวาระงาน -
                            {isAdmin && (
                              <div className="no-print mt-1">
                                <button
                                  onClick={() => onAddSchedule({
                                    executiveId: exec.id,
                                    category: section.id,
                                    date,
                                  })}
                                  className="text-xs text-blue-600 hover:underline font-sans not-italic inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> เพิ่มวาระงาน
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="border-2 border-black px-1.5 py-2 text-center text-slate-400 font-sarabun bg-white">-</td>
                          <td className="border-2 border-black px-1.5 py-2 text-center text-slate-400 font-sarabun bg-white">-</td>
                          <td className="border-2 border-black px-1.5 py-2 text-center text-slate-400 font-sarabun bg-white">-</td>
                        </tr>
                      );
                    }

                    // Executive has 1 or more items: use rowspan for first item
                    return items.map((item, idx) => {
                      const isFirstRow = idx === 0;
                      return (
                        <tr key={item.id} className="bg-white group">
                          {/* Executive cell (spans items.length rows) */}
                          {isFirstRow && (
                            <td
                              rowSpan={items.length}
                              className="border-2 border-black px-2 py-2.5 align-top font-sarabun text-left bg-white w-[20.5%] min-w-[125px]"
                            >
                              <div className="font-semibold text-black text-[13px] sm:text-[13.5px] whitespace-nowrap leading-tight">{exec.name}</div>
                              <div className="text-slate-900 text-[11.5px] sm:text-[12px] leading-tight mt-0.5">{exec.position}</div>
                              {isAdmin && (
                                <div className="no-print mt-2 pt-1 border-t border-slate-200 flex flex-wrap items-center gap-1">
                                  <button
                                    onClick={() => onEditExecutive(exec)}
                                    title="แก้ไขชื่อหรือตำแหน่งผู้บริหารท่านนี้"
                                    className="text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-sans inline-flex items-center gap-0.5 transition-colors"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" /> แก้ไข
                                  </button>
                                  <button
                                    onClick={() => onAddSchedule({
                                      executiveId: exec.id,
                                      category: section.id,
                                      date,
                                    })}
                                    title="เพิ่มวาระงานให้ผู้บริหารท่านนี้"
                                    className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 font-sans inline-flex items-center gap-0.5 transition-colors"
                                  >
                                    <Plus className="w-2.5 h-2.5" /> วาระ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteExecutive(exec.id);
                                    }}
                                    title="ลบผู้บริหารท่านนี้ออกจากตาราง"
                                    className="text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 px-1.5 py-0.5 rounded border border-rose-200 font-sans inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" /> ลบ
                                  </button>
                                </div>
                              )}
                            </td>
                          )}

                          {/* Time (บีบช่องเวลาแน่นกระชับพิเศษ) */}
                          <td className="border-2 border-black px-1 py-2 text-center align-top font-sarabun font-semibold text-[11.5px] sm:text-[12px] whitespace-nowrap leading-tight tracking-tighter w-[5.5%] min-w-[38px] max-w-[50px]">
                            {formatTimeDisplay(item.time, settings.useThaiNumerals)}
                          </td>

                          {/* Agenda */}
                          <td className="border-2 border-black px-2.5 py-2 align-top font-sarabun text-left leading-relaxed">
                            <div className="whitespace-pre-line break-words [overflow-wrap:anywhere] [word-break:break-word] text-black">
                              {item.agenda}
                            </div>
                            {/* Action buttons for editing/deleting */}
                            {isAdmin ? (
                              <div className="no-print mt-2 flex flex-wrap items-center gap-1.5 text-xs font-sans">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditSchedule(item);
                                  }}
                                  className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 px-2 py-0.5 rounded-md border border-blue-200 font-medium transition-colors cursor-pointer shadow-2xs"
                                  title="แก้ไขวาระงานนี้"
                                >
                                  <Edit2 className="w-3 h-3 text-blue-600" />
                                  <span>แก้ไข</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSchedule(item.id);
                                  }}
                                  className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 px-2 py-0.5 rounded-md border border-rose-200 font-medium transition-colors cursor-pointer shadow-2xs"
                                  title="ลบวาระงานนี้ออกจากตาราง"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-600" />
                                  <span>ลบ</span>
                                </button>
                              </div>
                            ) : (
                              <div className="no-print mt-1.5">
                                <button
                                  type="button"
                                  onClick={onPromptLogin}
                                  className="text-[11px] text-slate-400 hover:text-blue-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  title="เข้าสู่ระบบเจ้าหน้าที่เพื่อแก้ไขหรือลบวาระงาน"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>เข้าสู่ระบบเพื่อแก้ไข/ลบ</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Location */}
                          <td className="border-2 border-black px-1.5 py-2 text-center align-top font-sarabun leading-relaxed">
                            <div className="whitespace-pre-line break-words [overflow-wrap:anywhere] [word-break:break-word] text-black text-[12.5px] sm:text-[13px]">
                              {item.location}
                            </div>
                          </td>

                          {/* Dress Code */}
                          <td className="border-2 border-black px-1.5 py-2 text-center align-top font-sarabun leading-relaxed">
                            <div className="whitespace-pre-line break-words [overflow-wrap:anywhere] [word-break:break-word] text-black text-[12.5px] sm:text-[13px]">
                              {item.dressCode}
                            </div>
                          </td>

                          {/* Department */}
                          <td className="border-2 border-black px-1.5 py-2 text-center align-top font-sarabun leading-relaxed">
                            <div className="whitespace-pre-line break-words [overflow-wrap:anywhere] [word-break:break-word] text-black text-[12.5px] sm:text-[13px]">
                              {item.department}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })}

                  {/* Bottom Document Table Footer Row (ส่วนล่างตามภาพที่ ๑) */}
                  {settings.showDocumentFooter !== false && (
                    <tr className="bg-white">
                      <td
                        colSpan={6}
                        className="border-2 border-black px-3 sm:px-4 py-2.5 font-sarabun text-black text-left text-[13.5px] sm:text-[14.5px] leading-relaxed"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex flex-wrap items-baseline gap-1">
                            <span className="font-bold shrink-0">จัดทำโดย :</span>
                            <span className="text-black font-normal">
                              {settings.useThaiNumerals
                                ? toThaiNumerals(
                                    settings.preparedByText ||
                                      'กลุ่มงานอำนวยการ สำนักงานจังหวัดลพบุรี (นายเจริญชัย สีตะระโส ผู้อำนวยการกลุ่มงานอำนวยการ โทร. ๐๘๖-๐๓๘๒๗๔๕)'
                                  )
                                : toArabicNumerals(
                                    settings.preparedByText ||
                                      'กลุ่มงานอำนวยการ สำนักงานจังหวัดลพบุรี (นายเจริญชัย สีตะระโส ผู้อำนวยการกลุ่มงานอำนวยการ โทร. 086-0382745)'
                                  )}
                            </span>
                            {isAdmin && onOpenSettings && (
                              <button
                                type="button"
                                onClick={onOpenSettings}
                                className="no-print ml-2 text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="แก้ไขข้อความส่วนท้ายในหน้าตั้งค่า"
                              >
                                <Edit2 className="w-2.5 h-2.5" /> แก้ไขส่วนท้าย
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap items-baseline gap-1 pl-6 sm:pl-10 text-black">
                            <span className="font-bold shrink-0">สถานะ :</span>
                            <span className="text-black font-normal">
                              {formatDocumentStatusTimestamp(
                                date,
                                settings.useThaiNumerals,
                                settings.statusTimestampOption === 'custom' ? settings.customStatusTime : undefined,
                                liveDate
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Note / Legend Footer if needed */}
            {!hasAnySchedule && (
              <div className="text-center py-6 text-slate-500 font-sarabun no-print">
                ยังไม่มีข้อมูลวาระงานในวันดังกล่าว กด "เพิ่มวาระงานใหม่" เพื่อเริ่มต้นกรอกข้อมูล
              </div>
            )}

            {/* Document Source Footer (ส่วนล่างตามภาพที่ ๒ - แสดงทั้งบนหน้าจอและพิมพ์) */}
            <div className="text-right text-[12px] sm:text-[13px] text-slate-800 font-sarabun mt-2.5 font-normal">
              {settings.printFooterText || 'พิมพ์จาก: ระบบนัดหมายงานผู้บริหารจังหวัดลพบุรี'}
            </div>
          </div>
        );
      })}
    </div>
  );
};
