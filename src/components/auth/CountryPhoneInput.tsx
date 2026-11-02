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
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      <div className="auth-input-wrapper">
        {/* Left Side: Country Selector or Mail Icon */}
        {isEmail ? (
          <div className="auth-input-icon">
            <Mail className="w-5 h-5" style={{ width: 18, height: 18, color: '#94a3b8' }} />
          </div>
        ) : (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="country-select-btn"
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{selectedCountry.flag}</span>
              <span>{selectedCountry.code}</span>
              <ChevronDown style={{ width: 14, height: 14, color: '#94a3b8' }} />
            </button>

            {/* Country Dropdown */}
            {isDropdownOpen && (
              <div className="country-dropdown-menu">
                <div className="country-search-box">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country or code..."
                    className="country-search-input"
                    autoFocus
                  />
                </div>
                {filteredCountries.map((c) => (
                  <button
                    key={`${c.iso}-${c.code}`}
                    type="button"
                    onClick={() => selectCountry(c)}
                    className="country-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                      <span style={{ color: '#0f172a', fontWeight: 500 }}>{c.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.75rem' }}>
                      <span>{c.code}</span>
                      {selectedCountry.iso === c.iso && (
                        <Check style={{ width: 14, height: 14, color: '#2563eb' }} />
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
          className="auth-input"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', padding: '0 0.25rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
          {isEmail ? 'Entering Email address' : `Detected mobile (${selectedCountry.name})`}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>
          {isEmail ? 'Code via Email' : 'Code via SMS'}
        </span>
      </div>
    </div>
  );
};

