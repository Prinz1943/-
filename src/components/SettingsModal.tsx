import React, { useRef } from 'react';
import { DocumentSettings, Executive, ScheduleItem } from '../types/schedule';
import { INITIAL_EXECUTIVES, INITIAL_SCHEDULES, INITIAL_SETTINGS } from '../data/initialData';
import { X, Settings, RotateCcw, Download, Upload, Shield, Type, Sliders, FileText, Cloud } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DocumentSettings;
  onUpdateSettings: (settings: DocumentSettings) => void;
  executives: Executive[];
  schedules: ScheduleItem[];
  onRestoreData: (execs: Executive[], scheds: ScheduleItem[], setts: DocumentSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  executives,
  schedules,
  onRestoreData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notificationMsg, setNotificationMsg] = React.useState('');

  if (!isOpen) return null;

  const handleResetToSample = () => {
    onRestoreData(INITIAL_EXECUTIVES, INITIAL_SCHEDULES, INITIAL_SETTINGS);
    setNotificationMsg('รีเซ็ตข้อมูลเริ่มต้นเรียบร้อยแล้ว');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleExportJSON = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      province: 'Lopburi',
      settings,
      executives,
      schedules,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lopburi-schedule-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.executives && parsed.schedules) {
          onRestoreData(
            parsed.executives,
            parsed.schedules,
            parsed.settings || settings
          );
          setNotificationMsg('นำเข้าข้อมูลสำเร็จแล้ว!');
          setTimeout(() => onClose(), 800);
        } else {
          setNotificationMsg('ไฟล์ไม่ถูกต้อง รูปแบบโครงสร้างข้อมูลไม่ตรงกัน');
        }
      } catch (err) {
        setNotificationMsg('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">ตั้งค่าระบบและจัดพิมพ์</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Settings */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-blue-600" /> รูปแบบตัวเลขและเอกสารราชการ
            </h4>

            {/* Thai Numerals Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  ใช้เลขไทย (๑ ๒ ๓) ในเอกสาร
                </div>
                <div className="text-xs text-slate-500">
                  แปลงวัน เดือน ปี พ.ศ. และเวลาเป็นเลขไทยตามแบบฟอร์มหนังสือราชการ
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useThaiNumerals}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, useThaiNumerals: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Page Orientation Setting (แนวตั้ง / แนวนอน) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  ทิศทางหน้ากระดาษและตาราง (A4 Orientation)
                </div>
                <div className="text-xs text-slate-500">
                  เลือกทิศทางเอกสารสำหรับการแสดงผลบนหน้าจอ การพิมพ์ และการบันทึก PDF
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, orientation: 'portrait' })}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                    (settings.orientation ?? 'portrait') === 'portrait'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">📄</span>
                  <div className="text-left">
                    <div className="font-bold">แนวตั้ง (Portrait)</div>
                    <div className="text-[10px] text-slate-500">มาตรฐานตามที่ระบุ</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, orientation: 'landscape' })}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                    settings.orientation === 'landscape'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">📑</span>
                  <div className="text-left">
                    <div className="font-bold">แนวนอน (Landscape)</div>
                    <div className="text-[10px] text-slate-500">แบบตารางกว้าง</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Seal visibility */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  แสดงตราประจำจังหวัดลพบุรี
                </div>
                <div className="text-xs text-slate-500">
                  แสดงตราสัญลักษณ์รูปพระนารายณ์สถิตหน้าพระปรางค์สามยอดด้านบนเอกสาร
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showSeal}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, showSeal: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Seal Size */}
            {settings.showSeal && (
              <>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>ขนาดตราสัญลักษณ์</span>
                    <span>{settings.sealSize} px</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="140"
                    value={settings.sealSize}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, sealSize: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Active Seal Preview */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <img
                        src={settings.customSealUrl || '/assets/lopburi-seal.jpg'}
                        alt="ตราสัญลักษณ์ประจำจังหวัดลพบุรี"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        ตราประจำจังหวัดลพบุรี (รูปทางการ)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        พระบรมราชานุสาวรีย์สมเด็จพระนารายณ์มหาราช สถิตหน้าพระปรางค์สามยอด
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        ...settings,
                        customSealUrl: '/assets/lopburi-seal.jpg',
                      });
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
                  >
                    ใช้ตราทางการ
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Admin Passcode Security Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" /> ความปลอดภัยและรหัสผ่านเจ้าหน้าที่ (Admin)
            </h4>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  รหัสผ่านสำหรับเพิ่มและแก้ไขข้อมูล
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  กำหนดรหัสผ่านสำหรับเจ้าหน้าที่สำนักงานจังหวัด เพื่อป้องกันบุคคลทั่วไปแก้ไขข้อมูล
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={settings.adminPasscode || '1567'}
                    id="adminPasscodeInput"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    placeholder="รหัสผ่านเจ้าหน้าที่"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('adminPasscodeInput') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        onUpdateSettings({ ...settings, adminPasscode: input.value.trim() });
                        setNotificationMsg(`บันทึกรหัสผ่านใหม่ "${input.value.trim()}" เรียบร้อยแล้ว`);
                      }
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium bg-blue-700 text-white hover:bg-blue-800 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    บันทึกรหัสใหม่
                  </button>
                </div>
                {notificationMsg && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg mt-2 font-medium">
                    {notificationMsg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Footer Section (ส่วนล่างของเอกสารราชการตามภาพ) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" /> ส่วนล่างของตารางเอกสาร (Footer)
            </h4>

            {/* Toggle show footer */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  แสดงแถบส่วนล่างในตารางเอกสาร
                </div>
                <div className="text-xs text-slate-500">
                  แสดงช่อง "จัดทำโดย" และ "สถานะวันเวลา" ด้านล่างของตาราง
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showDocumentFooter !== false}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, showDocumentFooter: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {settings.showDocumentFooter !== false && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                {/* Prepared By text */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-800">
                      ข้อความ "จัดทำโดย :"
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          preparedByText:
                            'กลุ่มงานอำนวยการ สำนักงานจังหวัดลพบุรี (นายเจริญชัย สีตะระโส ผู้อำนวยการกลุ่มงานอำนวยการ โทร. ๐๘๖-๐๓๘๒๗๔๕)',
                        })
                      }
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      คืนค่ามาตรฐาน
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={
                      settings.preparedByText ??
                      'กลุ่มงานอำนวยการ สำนักงานจังหวัดลพบุรี (นายเจริญชัย สีตะระโส ผู้อำนวยการกลุ่มงานอำนวยการ โทร. ๐๘๖-๐๓๘๒๗๔๕)'
                    }
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, preparedByText: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sarabun"
                    placeholder="กลุ่มงานอำนวยการ สำนักงานจังหวัดลพบุรี (นายเจริญชัย สีตะระโส ผู้อำนวยการกลุ่มงานอำนวยการ โทร. ๐๘๖-๐๓๘๒๗๔๕)"
                  />
                </div>

                {/* Status Timestamp Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    รูปแบบ "สถานะ :"
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          statusTimestampOption: 'auto',
                        })
                      }
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                        settings.statusTimestampOption !== 'custom'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>บันทึกวันและเวลาปัจจุบันตอนกดบันทึก (แนะนำ)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        (เช่น ๒๘ ตุลาคม ๒๕๖๙ เวลา ๑๕.๒๒ น. ตามเวลาที่กดบันทึกล่าสุด)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          statusTimestampOption: 'custom',
                        })
                      }
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                        settings.statusTimestampOption === 'custom'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>กำหนดข้อความสถานะเอง</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        ระบุวันที่หรือเวลาที่ต้องการเจาะจง
                      </div>
                    </button>
                  </div>

                  {settings.statusTimestampOption === 'custom' && (
                    <input
                      type="text"
                      value={settings.customStatusTime || ''}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, customStatusTime: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sarabun mt-1"
                      placeholder="เช่น ๒๐ ตุลาคม ๒๕๖๙ เวลา ๑๖.๓๐ น."
                    />
                  )}
                </div>

                {/* Print Footer Text */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-800">
                      ข้อความระบุระบบใต้ตาราง (พิมพ์จาก...):
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          printFooterText: 'พิมพ์จาก: ระบบนัดหมายงานผู้บริหารจังหวัดลพบุรี',
                        })
                      }
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      คืนค่ามาตรฐาน
                    </button>
                  </div>
                  <input
                    type="text"
                    value={
                      settings.printFooterText ??
                      'พิมพ์จาก: ระบบนัดหมายงานผู้บริหารจังหวัดลพบุรี'
                    }
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, printFooterText: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sarabun"
                    placeholder="พิมพ์จาก: ระบบนัดหมายงานผู้บริหารจังหวัดลพบุรี"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Backup & Restore */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" /> การจัดเก็บข้อมูลและคลาวด์ (Cloud Persistence)
            </h4>

            {/* Firebase Cloud Sync Info */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Cloud className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>เชื่อมต่อ Google Cloud Firestore สำเร็จ</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                  ข้อมูลวาระงาน ทำเนียบผู้บริหาร และการตั้งค่าเอกสารจะถูกบันทึกลงฐานข้อมูล Firebase คลาวด์อัตโนมัติแบบเรียลไทม์
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">สำรองข้อมูล (JSON)</div>
                  <div className="text-[11px] text-slate-500">บันทึกไฟล์เก็บไว้ในเครื่อง</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">นำเข้าข้อมูล (JSON)</div>
                  <div className="text-[11px] text-slate-500">กู้คืนจากไฟล์ที่เคยสำรองไว้</div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </div>

            {/* Reset to template */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetToSample}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                รีเซ็ตเป็นข้อมูลตัวอย่างตามภาพ (วันศุกร์ที่ ๑๖ ตุลาคม ๒๕๖๙)
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-900"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
