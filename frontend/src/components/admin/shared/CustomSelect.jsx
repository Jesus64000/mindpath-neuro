import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ options, value, onChange, placeholder = "Seleccionar...", className = "", label = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1.5 tracking-widest pl-1">{label}</label>}
            
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-slate-200 transition-all hover:border-mindpath-primary/50 focus:outline-none focus:ring-4 focus:ring-mindpath-primary/10 ${isOpen ? 'border-mindpath-primary ring-4 ring-mindpath-primary/10' : ''}`}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[110] w-full mt-2 bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-slideUp">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-mindpath-primary/10 ${
                                    value === option.value 
                                    ? 'text-mindpath-primary bg-mindpath-primary/5 font-bold' 
                                    : 'text-gray-600 dark:text-slate-400 hover:text-mindpath-primary'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
