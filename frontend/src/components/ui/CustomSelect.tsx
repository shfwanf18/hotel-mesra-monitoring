import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function CustomSelect({ value, onChange, options, className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={cn("relative w-full", className)} ref={ref}>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.015, borderColor: 'rgba(59, 130, 246, 0.3)' }}
        whileTap={{ scale: 0.985 }}
        className={cn(
          "inline-flex w-full items-center justify-between gap-x-3",
          "h-[42px]",
          "rounded-full",
          "bg-white/[0.03] backdrop-blur-xl",
          "border border-white/[0.08]",
          "shadow-inner shadow-black/10",
          "text-xs font-semibold text-white tracking-tight",
          "transition-colors duration-300",
          "hover:bg-white/[0.05]",
          "cursor-pointer select-none",
          isOpen && [
            "border-accent/40",
            "bg-white/[0.06]",
            "shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
          ]
        )}
        style={{ paddingLeft: '20px', paddingRight: '20px' }}
      >
        <span className="truncate text-left pr-2 leading-none">
          {selectedOption.label}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-slate-500 transition-transform duration-300",
            isOpen && "rotate-180 text-accent"
          )}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0, y: -12, scale: 0.95 },
              visible: { 
                opacity: 1, y: 0, scale: 1,
                transition: { 
                  type: 'spring', damping: 25, stiffness: 350,
                  staggerChildren: 0.04
                }
              }
            }}
            className="absolute left-0 top-full z-50 mt-2 w-full"
            style={{ transformOrigin: 'top center' }}
          >
            <div
              className={cn(
                "overflow-hidden rounded-2xl",
                "border border-white/[0.06]",
                "bg-[#101828]/95 backdrop-blur-2xl",
                "shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
                "p-1.5"
              )}
              style={{ padding: '6px' }}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;

                return (
                  <motion.button
                    key={opt.value}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    whileHover={{ scale: 1.015, backgroundColor: 'rgba(255,255,255,0.06)' }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl",
                      "px-3.5 py-2.5",
                      "text-xs font-semibold text-left tracking-wide",
                      "transition-colors duration-200 cursor-pointer select-none",
                      isSelected
                        ? "bg-accent/10 text-accent border border-accent/20"
                        : "text-slate-200 border border-transparent hover:bg-white/[0.05] hover:text-white"
                    )}
                    style={{ padding: '10px 14px' }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                      >
                        <Check size={14} className="text-accent" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
