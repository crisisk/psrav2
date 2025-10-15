import React, { useState, useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

// Define the props for the component
interface QRCodeGeneratorProps {
  initialValue?: string;
  size?: number;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
}

// Sevensa-inspired color palette (placeholder, assuming a professional blue/gray scheme)
const SEVENSA_PRIMARY = '#1a73e8'; // A more vibrant, professional blue (Google Blue-like)
const SEVENSA_SECONDARY = '#5f6368'; // A darker, professional gray

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  initialValue = 'https://www.sevensa.com',
  size = 256,
  fgColor = SEVENSA_PRIMARY,
  level = 'H',
  includeMargin = true,
}) => {
  const [value, setValue] = useState<string>(initialValue);
  const [qrSize, setQrSize] = useState<number>(size);
  const [qrColor, setQrColor] = useState<string>(fgColor);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Function to handle the download
  const handleDownload = useCallback(() => {
    if (qrCodeRef.current === null) {
      return;
    }

    // Find the SVG element within the ref
    const svgElement = qrCodeRef.current.querySelector('svg');
    if (svgElement) {
      // html-to-image works best on the container element
      toPng(qrCodeRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `qrcode-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Could not download QR code image', err);
        });
    }
  }, []);

  // State for customization options
  const [customValue, setCustomValue] = useState<string>(initialValue);
  const [customColor, setCustomColor] = useState<string>(fgColor);

  // Handler to update the QR code
  const handleGenerate = useCallback(() => {
    setValue(customValue);
    setQrColor(customColor);
  }, [customValue, customColor]);

  // Download logic will be implemented in the next phase

  return (
    <div className="p-6 bg-white shadow-2xl rounded-xl max-w-lg mx-auto transition-all duration-500 ease-in-out">
      <h2 className="text-2xl font-extrabold text-center mb-6 text-gray-800 tracking-tight">
        <span className="text-blue-600">Sevensa</span> QR Code Generator
      </h2>

      {/* Input and Customization Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="qr-content" className="block text-sm font-medium text-gray-700">
            QR Code Content (URL or Text) <span className="text-red-500">*</span>
          </label>
          <input
            id="qr-content"
            required
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="e.g., https://www.sevensa.com"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition duration-300 ease-in-out"
            aria-label="QR Code Content Input"
          />
        </div>

        <div>
          <label htmlFor="qr-color" className="block text-sm font-medium text-gray-700">
            QR Code Color
          </label>
          <div className="flex mt-1">
            <input
              id="qr-color"
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-10 h-10 p-1 border border-gray-300 rounded-md cursor-pointer"
              aria-label="QR Code Color Picker"
            />
            <span className="ml-3 self-center text-sm text-gray-600">{customColor}</span>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Generate QR Code
        </button>
      </div>

      {/* QR Code Display Area */}
      <div
        ref={qrCodeRef}
        className="flex justify-center items-center p-4 border-4 border-blue-100 rounded-lg bg-white shadow-inner transition-all duration-500 ease-in-out"
        role="img"
        aria-label={`QR Code for ${value}`}
      >
        <QRCodeSVG
          value={value}
          size={qrSize}
          level={level}
          includeMargin={includeMargin}
          fgColor={qrColor}
          className="transition-all duration-500 ease-in-out"
          // Add a title for accessibility
          title={`QR Code for ${value}`}
        />
      </div>

      {/* Download Button */}
      <div className="mt-6">
        <button
          onClick={handleDownload}
          disabled={!value}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] ${
            value
              ? 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          aria-label="Download QR Code as PNG"
        >
          Download QR Code (PNG)
        </button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;