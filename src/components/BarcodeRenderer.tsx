import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
  background?: string;
  lineColor?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.8,
  height = 48,
  displayValue = true,
  fontSize = 12,
  className = '',
  background = 'transparent',
  lineColor = '#0f172a'
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      setError(null);
      JsBarcode(svgRef.current, value.trim(), {
        format,
        width,
        height,
        displayValue,
        fontSize,
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 4,
        background: background === 'transparent' ? undefined : background,
        lineColor,
        margin: 4
      });
    } catch (err: unknown) {
      // If specific format failed, fallback to CODE128
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, value.trim(), {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize,
            font: 'monospace',
            textAlign: 'center',
            textPosition: 'bottom',
            textMargin: 4,
            background: background === 'transparent' ? undefined : background,
            lineColor,
            margin: 4
          });
        }
      } catch (fallbackErr) {
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Invalid barcode value');
      }
    }
  }, [value, format, width, height, displayValue, fontSize, background, lineColor]);

  if (error) {
    return (
      <div className={`text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 text-center font-mono ${className}`}>
        {value}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
};
