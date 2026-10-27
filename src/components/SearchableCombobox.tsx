import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, X, Clock, Sparkles } from 'lucide-react';

interface SearchableComboboxProps {
  id?: string;
  label?: string;
  required?: boolean;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  customOptions?: string[]; // รายการที่เคยกรอก
  presetOptions?: string[]; // รายการแนะนำมาตรฐาน
  onDeleteCustomOption?: (option: string) => void;
  helperText?: string;
  placement?: 'bottom' | 'top' | 'auto';
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  id,
  label,
  required = false,
  icon,
  value,
  onChange,
  placeholder = 'พิมพ์หรือเลือก...',
  customOptions = [],
  presetOptions = [],
  onDeleteCustomOption,
  helperText,
  placement = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(placement === 'top');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute placement direction
  useEffect(() => {
    if (placement === 'top') {
      setOpenUpward(true);
      return;
    }
    if (placement === 'bottom') {
      setOpenUpward(false);
      return;
    }
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If space below is less than 280px and space above has more room, open upward
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen, placement]);

  // Filter options based on typed input
  const query = value.trim().toLowerCase();

  const filteredCustom = useMemo(() => {
    if (!query) return customOptions;
    return customOptions.filter((opt) => opt.toLowerCase().includes(query));
  }, [customOptions, query]);

  const filteredPreset = useMemo(() => {
    // Exclude anything already in customOptions
    const customSet = new Set(customOptions.map((c) => c.trim().toLowerCase()));
    const remaining = presetOptions.filter((opt) => !customSet.has(opt.trim().toLowerCase()));
    if (!query) return remaining;
    return remaining.filter((opt) => opt.toLowerCase().includes(query));
  }, [presetOptions, customOptions, query]);

  const hasOptions = filteredCustom.length > 0 || filteredPreset.length > 0;
  const isExactMatch =
    customOptions.some((o) => o.trim().toLowerCase() === query) ||
    presetOptions.some((o) => o.trim().toLowerCase() === query);

  const handleSelectOption = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    inputRef.current?.focus();
    setIsOpen(true);
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{label}</span>
            {required && <span className="text-red-500 font-bold">*</span>}
          </label>
          {helperText && <span className="text-[11px] text-slate-400 font-normal">{helperText}</span>}
        </div>
      )}

      {/* Input container matching image_fae5a27b.png */}
      <div
        className={`relative flex items-center bg-white border rounded-lg transition-all shadow-2xs ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20'
            : 'border-slate-300 hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}
      >
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none shrink-0 flex items-center">
            {icon}
          </div>
        )}

        {/* Text Input for Typing freely */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full text-sm bg-transparent py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none ${
            icon ? 'pl-9' : 'pl-3'
          } ${value ? 'pr-16' : 'pr-9'}`}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="ล้างข้อความ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dropdown Toggle Chevron Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          title={isOpen ? 'ปิดรายการตัวเลือก' : 'เปิดรายการตัวเลือก'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Dropdown Menu with Smart Upward/Downward placement */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {/* Custom typed option if doesn't match */}
          {value.trim() && !isExactMatch && (
            <div className="p-1.5 bg-blue-50/50">
              <button
                type="button"
                onClick={() => handleSelectOption(value.trim())}
                className="w-full text-left px-3 py-2 text-xs sm:text-sm font-medium text-blue-700 hover:bg-blue-100/70 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="truncate">
                  ➕ ใช้ข้อความใหม่: <strong className="text-slate-900 font-semibold">"{value}"</strong>
                </span>
                <span className="text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200 shrink-0 ml-2">
                  กำหนดเอง
                </span>
              </button>
            </div>
          )}

          {/* Section 1: Previously entered items (ที่เคยกรอก) */}
          {filteredCustom.length > 0 && (
            <div className="p-1.5">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>ประวัติที่เคยกรอก</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-200 font-normal">
                  {filteredCustom.length}
                </span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {filteredCustom.map((item, idx) => {
                  const isSelected = item.trim().toLowerCase() === value.trim().toLowerCase();
                  return (
                    <div
                      key={`custom-${idx}-${item.slice(0, 10)}`}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      onClick={() => handleSelectOption(item)}
                    >
                      <span className="truncate flex-1 pr-2">{item}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                        {onDeleteCustomOption && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomOption(item);
                            }}
                            title="ลบออกจากประวัติ"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Standard presets (ค่ามาตรฐานแนะนำ) */}
          {filteredPreset.length > 0 && (
            <div className="p-1.5">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>ค่ามาตรฐานแนะนำ</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {filteredPreset.map((item, idx) => {
                  const isSelected = item.trim().toLowerCase() === value.trim().toLowerCase();
                  return (
                    <div
                      key={`preset-${idx}-${item.slice(0, 10)}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      onClick={() => handleSelectOption(item)}
                    >
                      <span className="truncate flex-1 pr-2">{item}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasOptions && !value.trim() && (
            <div className="px-4 py-6 text-center text-xs text-slate-400">
              ไม่มีข้อมูลตัวเลือก เริ่มพิมพ์ข้อความได้ทันที
            </div>
          )}
        </div>
      )}
    </div>
  );
};
