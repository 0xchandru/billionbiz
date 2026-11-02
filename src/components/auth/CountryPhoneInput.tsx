import React, { useState, useEffect, useRef } from 'react';
import { Mail, ChevronDown, Check } from 'lucide-react';

export interface Country {
  code: string;
  iso: string;
  flag: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: '+91', iso: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+1', iso: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+44', iso: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+971', iso: 'AE', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+65', iso: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+61', iso: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', iso: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', iso: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+966', iso: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+81', iso: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+60', iso: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+1', iso: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+31', iso: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+34', iso: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+39', iso: 'IT', flag: '🇮🇹', name: 'Italy' },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string, isEmail: boolean, formattedValue: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  placeholder = 'name@business.com or mobile number',
  autoFocus = false,
  disabled = false,
  className = ''
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default India
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if input is email or phone
  const hasLetters = /[a-zA-Z@]/.test(value);
  const isEmail = hasLetters || value.includes('@');

  // Detect country code from user typing
  useEffect(() => {
    if (!isEmail && value.length > 0) {
      const trimmed = value.trim();
      for (const country of COUNTRIES) {
        if (trimmed.startsWith(country.code)) {
          setSelectedCountry(country);
          break;
        }
      }
    }
  }, [value, isEmail]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const isNowEmail = /[a-zA-Z@]/.test(raw) || raw.includes('@');

    let formatted = raw.trim();
    if (!isNowEmail && raw.length > 0) {
      // If user typed raw digits without +, prepend selected country code
      const cleanDigits = raw.replace(/[^0-9+]/g, '');
      if (cleanDigits.startsWith('+')) {
        formatted = cleanDigits;
      } else {
        formatted = `${selectedCountry.code}${cleanDigits}`;
      }
    }

    onChange(raw, isNowEmail, formatted);
  };

  const selectCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);

    // If already typed numbers, reformat with new country code
    if (!isEmail && value.length > 0) {
      const cleanDigits = value.replace(/[^0-9]/g, '');
      // Strip old country code digits if present
      let phoneBody = cleanDigits;
      for (const c of COUNTRIES) {
        const codeDigits = c.code.replace('+', '');
        if (cleanDigits.startsWith(codeDigits)) {
          phoneBody = cleanDigits.slice(codeDigits.length);
          break;
        }
      }
      const newValue = `${country.code} ${phoneBody}`.trim();
      onChange(newValue, false, `${country.code}${phoneBody}`);
    }

    inputRef.current?.focus();
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden">
        {/* Left Side: Country Selector or Mail Icon */}
        {isEmail ? (
          <div className="pl-3.5 pr-2 flex items-center justify-center text-gray-400">
            <Mail className="w-5 h-5" />
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 pl-3.5 pr-2 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700 transition text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <span className="text-lg leading-none">{selectedCountry.flag}</span>
              <span>{selectedCountry.code}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Country Dropdown */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto py-1">
                <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country or code..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                {filteredCountries.map((c) => (
                  <button
                    key={`${c.iso}-${c.code}`}
                    type="button"
                    onClick={() => selectCountry(c)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/60 transition text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{c.flag}</span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <span>{c.code}</span>
                      {selectedCountry.iso === c.iso && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Field */}
        <input
          ref={inputRef}
          type={isEmail ? 'email' : 'tel'}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className="w-full px-3.5 py-3 text-sm text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {isEmail ? 'Entering Email address' : `Detected mobile number (${selectedCountry.name})`}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
          {isEmail ? 'OTP via Email' : 'OTP via SMS'}
        </span>
      </div>
    </div>
  );
};
