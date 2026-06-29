import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CreatableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  accentColor?: string;
  hasError?: boolean;
}

export function CreatableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select or type...',
  icon,
  className,
  accentColor = '#3b82f6',
  hasError
}: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset search to confirmed value if they clicked away
        setSearch(value);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase()) && opt !== ''
  );
  
  const isExactMatch = options.some(opt => opt.toLowerCase() === search.trim().toLowerCase());
  const showCreateOption = search.trim() !== '' && !isExactMatch;

  const handleSelect = (val: string) => {
    onChange(val);
    setSearch(val);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div className="relative group">
        {icon && (
          <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 pointer-events-none", hasError ? "text-red-500" : "text-muted group-focus-within:text-accent")}>
            {icon}
          </div>
        )}
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn("w-full h-[44px] bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border text-sm text-white placeholder-muted rounded-xl outline-none transition-all duration-300 pr-10", hasError ? "border-red-500/50" : "border-white/[0.08]")}
          style={{
            paddingLeft: icon ? '44px' : '16px',
            ['--tw-ring-color' as any]: hasError ? 'rgba(239,68,68,0.12)' : `${accentColor}40`,
            boxShadow: isOpen ? `0 0 0 3px var(--tw-ring-color)` : hasError ? `0 0 0 3px rgba(239,68,68,0.12)` : undefined,
            borderColor: hasError ? '#ef4444' : isOpen ? accentColor : undefined
          }}
        />
        <div 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted cursor-pointer transition-transform duration-200"
          style={{ transform: `translateY(-50%) ${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown size={16} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-panel/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-[220px] overflow-y-auto overflow-x-hidden"
            style={{ padding: '8px 4px' }}
          >
            {filteredOptions.length > 0 ? (
              <div className="flex flex-col gap-1">
                {filteredOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="w-full text-left text-sm text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between group"
                    style={{ padding: '10px 14px' }}
                  >
                    <span className="truncate">{opt}</span>
                    {value === opt && (
                      <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: accentColor, color: accentColor }} />
                    )}
                  </button>
                ))}
              </div>
            ) : !showCreateOption ? (
              <div className="text-xs text-muted text-center italic" style={{ padding: '12px 16px' }}>
                No options found.
              </div>
            ) : null}

            {showCreateOption && (
              <div className="mt-1 border-t border-white/10" style={{ paddingTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleSelect(search.trim())}
                  className="w-full text-left text-sm rounded-lg transition-colors flex items-center gap-2 group"
                  style={{ 
                    padding: '10px 14px',
                    color: accentColor, 
                    backgroundColor: `${accentColor}10` 
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${accentColor}25`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${accentColor}10`; }}
                >
                  <Plus size={14} className="group-hover:scale-125 transition-transform" />
                  <span className="truncate">Create "{search.trim()}"</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
