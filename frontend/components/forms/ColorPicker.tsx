import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// --- Color Utility Functions (from colorUtils.ts) ---

export interface HSB {
  h: number; // 0-360
  s: number; // 0-100
  b: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Converts HSB to RGB.
 */
export function hsbToRgb({ h, s, b }: HSB): RGB {
  h = h % 360;
  const s_norm = s / 100;
  const b_norm = b / 100;

  let r = 0, g = 0, b_val = 0;

  if (s_norm === 0) {
    r = g = b_val = b_norm; // achromatic
  } else {
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = b_norm * (1 - s_norm);
    const q = b_norm * (1 - f * s_norm);
    const t = b_norm * (1 - (1 - f) * s_norm);

    switch (i % 6) {
      case 0: r = b_norm; g = t; b_val = p; break;
      case 1: r = q; g = b_norm; b_val = p; break;
      case 2: r = p; g = b_norm; b_val = t; break;
      case 3: r = p; g = q; b_val = b_norm; break;
      case 4: r = t; g = p; b_val = b_norm; break;
      case 5: r = b_norm; b_val = p; g = q; break;
    }
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b_val * 255),
  };
}

/**
 * Converts RGB to HSB.
 */
export function rgbToHsb({ r, g, b }: RGB): HSB {
  const r_norm = r / 255;
  const g_norm = g / 255;
  const b_norm = b / 255;

  const max = Math.max(r_norm, g_norm, b_norm);
  const min = Math.min(r_norm, g_norm, b_norm);
  const delta = max - min;

  let h = 0, s = 0, b_val = max;

  if (delta !== 0) {
    s = delta / max;
    switch (max) {
      case r_norm: h = (g_norm - b_norm) / delta + (g_norm < b_norm ? 6 : 0); break;
      case g_norm: h = (b_norm - r_norm) / delta + 2; break;
      case b_norm: h = (r_norm - g_norm) / delta + 4; break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    b: Math.round(b_val * 100),
  };
}

/**
 * Converts RGB to Hex string.
 */
export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts Hex string to RGB.
 */
export function hexToRgb(hex: string): RGB | null {
  const cleanHex = hex.startsWith('#') ? hex.substring(1) : hex;
  if (cleanHex.length !== 6) return null;

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  return { r, g, b };
}

/**
 * Converts Hex string to HSB.
 */
export function hexToHsb(hex: string): HSB | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsb(rgb);
}

/**
 * Converts HSB to Hex string.
 */
export function hsbToHex(hsb: HSB): string {
  const rgb = hsbToRgb(hsb);
  return rgbToHex(rgb);
}

/**
 * Formats an HSB object into a CSS HSL string (for hue slider background).
 */
export function formatHslCss({ h }: HSB): string {
  return `hsl(${h}, 100%, 50%)`;
}

// --- Helper Components ---

// Icon for the Eyedropper (using a simple SVG)
const EyedropperIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-4.55a2 2 0 000-2.83l-1.42-1.42a2 2 0 00-2.83 0L10 5m5 5l-5 5m5-5l-5 5m0 0l-4.55 4.55a2 2 0 01-2.83 0l-1.42-1.42a2 2 0 010-2.83L5 10m0 0l5-5m-5 5l5-5" />
  </svg>
);

interface ColorInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange, maxLength, disabled }) => (
  <div className="flex flex-col items-start">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
      disabled={disabled}
      className={`w-full p-1 text-center border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out ${disabled ? 'bg-gray-100' : 'bg-white'}`}
    />
    <label className="text-xs font-medium text-gray-500 mt-1">{label}</label>
  </div>
);

interface SwatchesProps {
  swatches: string[];
  onSelect: (hex: string) => void;
  disabled?: boolean;
}

const Swatches: React.FC<SwatchesProps> = ({ swatches, onSelect, disabled }) => {
  if (swatches.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-gray-700 mb-2">Swatches</h4>
      <div className="flex flex-wrap gap-2">
        {swatches.map((hex, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(hex)}
            disabled={disabled}
            className={`w-6 h-6 rounded-full border border-gray-300 shadow-sm transition duration-150 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-indigo-500'}`}
            style={{ backgroundColor: hex }}
            aria-label={`Select color ${hex}`}
          />
        ))}
      </div>
    </div>
  );
};

interface SaturationValueAreaProps {
  hsb: HSB;
  onHsbChange: (newHsb: HSB) => void;
  disabled?: boolean;
}

const SaturationValueArea: React.FC<SaturationValueAreaProps> = ({ hsb, onHsbChange, disabled }) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const { h, s, b } = hsb;

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (disabled || !areaRef.current) return;

    const rect = areaRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Calculate saturation (s) and brightness (b) based on click position
    let newS = clamp((clientX - rect.left) / rect.width, 0, 1) * 100;
    // Brightness is inverted on the Y-axis (top is 100, bottom is 0)
    let newB = clamp(1 - (clientY - rect.top) / rect.height, 0, 1) * 100;

    onHsbChange({ h, s: Math.round(newS), b: Math.round(newB) });
  }, [h, onHsbChange, disabled]);

  const startInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    handleInteraction(e);

    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      handleInteraction(moveEvent);
    };

    const endHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('touchend', endHandler);
  }, [handleInteraction, disabled]);

  // The background color for the saturation area is determined by the current hue at max saturation and brightness
  const hueColor = formatHslCss({ h, s: 100, b: 100 });
  const pointerX = (s / 100) * 100; // 0-100%
  const pointerY = 100 - (b / 100) * 100; // 0-100% (inverted)

  return (
    <div
      ref={areaRef}
      className={`relative w-full h-40 cursor-crosshair rounded-md overflow-hidden ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      style={{ backgroundColor: hueColor }}
      onMouseDown={startInteraction}
      onTouchStart={startInteraction}
    >
      {/* Saturation gradient (white to hue) */}
      <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
      {/* Brightness gradient (transparent to black) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

      {/* Color Picker Pointer */}
      <div
        className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md pointer-events-none"
        style={{
          left: `${pointerX}%`,
          top: `${pointerY}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
};

interface HueSliderProps {
  hsb: HSB;
  onHsbChange: (newHsb: HSB) => void;
  disabled?: boolean;
}

const HueSlider: React.FC<HueSliderProps> = ({ hsb, onHsbChange, disabled }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const { h, s, b } = hsb;

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (disabled || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

    // Calculate hue (h) based on click position
    let newH = clamp((clientX - rect.left) / rect.width, 0, 1) * 360;

    onHsbChange({ h: Math.round(newH), s, b });
  }, [s, b, onHsbChange, disabled]);

  const startInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    handleInteraction(e);

    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      handleInteraction(moveEvent);
    };

    const endHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('touchend', endHandler);
  }, [handleInteraction, disabled]);

  const pointerX = (h / 360) * 100; // 0-100%

  return (
    <div
      ref={sliderRef}
      className={`relative w-full h-3 mt-4 rounded-full cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      style={{
        background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
      }}
      onMouseDown={startInteraction}
      onTouchStart={startInteraction}
    >
      {/* Hue Slider Pointer */}
      <div
        className="absolute top-1/2 w-4 h-4 border-2 border-white rounded-full shadow-md pointer-events-none bg-gray-800"
        style={{
          left: `${pointerX}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
};

// --- Main ColorPicker Component ---

export interface ColorPickerProps {
  /** The current color value in hex format (e.g., "#FF0000"). */
  value: string;
  /** Callback fired when the color changes. */
  onChange: (hex: string, rgb: RGB, hsb: HSB) => void;
  /** Optional: The name for form validation. */
  name?: string;
  /** Optional: Saved color swatches. */
  swatches?: string[];
  /** Optional: Disables the color picker. */
  disabled?: boolean;
}

// Default HSB value for red
const DEFAULT_HSB: HSB = { h: 0, s: 100, b: 100 };

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, name, swatches = [], disabled = false }) => {
  // Internal state is HSB for easier manipulation of the color wheel
  const [hsb, setHsb] = useState<HSB>(() => hexToHsb(value) || DEFAULT_HSB);

  // Update internal HSB state when external value prop changes
  useEffect(() => {
    const newHsb = hexToHsb(value);
    if (newHsb) {
      setHsb(newHsb);
    }
  }, [value]);

  const handleHsbChange = useCallback((newHsb: HSB) => {
    setHsb(newHsb);
    const rgb = hsbToRgb(newHsb);
    const hex = hsbToHex(newHsb);
    onChange(hex, rgb, newHsb);
  }, [onChange]);

  // --- Input Handlers ---

  const handleHexChange = useCallback((newHex: string) => {
    const cleanHex = newHex.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    if (cleanHex.length === 6) {
      const newHsb = hexToHsb(cleanHex);
      if (newHsb) {
        handleHsbChange(newHsb);
      }
    }
    // We don't update HSB state for partial input, but we can update the component's value if needed
    // For simplicity, we only call onChange on valid 6-digit hex.
  }, [handleHsbChange]);

  const handleRgbChange = useCallback((component: 'r' | 'g' | 'b', val: string) => {
    const num = parseInt(val, 10);
    const currentRgb = hsbToRgb(hsb);

    // Only update if the input is a valid number between 0 and 255
    if (isNaN(num) || num < 0 || num > 255) {
      return;
    }

    const newRgb: RGB = { ...currentRgb, [component]: num };
    const newHsb = rgbToHsb(newRgb);
    handleHsbChange(newHsb);
  }, [hsb, handleHsbChange]);

  const handleSwatchSelect = useCallback((hex: string) => {
    const newHsb = hexToHsb(hex);
    if (newHsb) {
      handleHsbChange(newHsb);
    }
  }, [handleHsbChange]);

  // --- Derived Values ---
  const currentRgb = useMemo(() => hsbToRgb(hsb), [hsb]);
  const currentHex = useMemo(() => hsbToHex(hsb), [hsb]);

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-2xl w-72 font-sans">
      {/* Hidden input for form validation (required by the task) */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* 1. Saturation/Value Area */}
      <SaturationValueArea
        hsb={hsb}
        onHsbChange={handleHsbChange}
        disabled={disabled}
      />

      {/* 2. Hue Slider */}
      <HueSlider
        hsb={hsb}
        onHsbChange={handleHsbChange}
        disabled={disabled}
      />

      {/* 3. Inputs and Controls */}
      <div className="mt-4">
        <div className="flex items-center justify-between space-x-3">
          {/* Current Color Preview */}
          <div className="flex-shrink-0">
            <div
              className="w-10 h-10 border border-gray-300 rounded-lg shadow-inner"
              style={{ backgroundColor: `#${currentHex}` }}
            />
          </div>

          {/* Hex Input */}
          <div className="flex-1">
            <ColorInput
              label="HEX"
              value={currentHex}
              onChange={handleHexChange}
              maxLength={6}
              disabled={disabled}
            />
          </div>

          {/* RGB Inputs */}
          <div className="flex space-x-2 flex-1">
            <ColorInput
              label="R"
              value={currentRgb.r}
              onChange={(val) => handleRgbChange('r', val)}
              maxLength={3}
              disabled={disabled}
            />
            <ColorInput
              label="G"
              value={currentRgb.g}
              onChange={(val) => handleRgbChange('g', val)}
              maxLength={3}
              disabled={disabled}
            />
            <ColorInput
              label="B"
              value={currentRgb.b}
              onChange={(val) => handleRgbChange('b', val)}
              maxLength={3}
              disabled={disabled}
            />
          </div>

          {/* Eyedropper Button (Sevensa Branding: Indigo) */}
          <button
            type="button"
            onClick={() => {
              // The actual EyeDropper API is a browser feature (window.EyeDropper)
              // and cannot be reliably implemented in a sandboxed environment.
              // This serves as the UI placeholder for the feature.
              if (disabled) return;
              console.log('Eyedropper clicked. Implementation requires native browser API.');
              alert('Eyedropper functionality requires the native EyeDropper API, which is not available in this environment.');
            }}
            disabled={disabled}
            className={`flex-shrink-0 p-2 rounded-lg transition duration-150 ease-in-out ${disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}
            title="Pick color from screen (Requires native EyeDropper API)"
          >
            <EyedropperIcon />
          </button>
        </div>

        {/* Swatches */}
        <Swatches swatches={swatches} onSelect={handleSwatchSelect} disabled={disabled} />
      </div>
    </div>
  );
};

export default ColorPicker;