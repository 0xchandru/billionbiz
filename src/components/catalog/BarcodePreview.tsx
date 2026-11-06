import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

export const BarcodePreview: React.FC<{ value: string; compact?: boolean }> = ({ value, compact = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [invalid, setInvalid] = useState(false);
  const normalizedValue = value.trim();

  useEffect(() => {
    if (!svgRef.current || !normalizedValue) {
      setInvalid(false);
      return;
    }
    try {
      JsBarcode(svgRef.current, normalizedValue, {
        format: 'CODE128',
        displayValue: true,
        font: 'monospace',
        fontSize: compact ? 10 : 12,
        height: compact ? 36 : 52,
        margin: compact ? 4 : 8,
        background: '#ffffff',
        lineColor: '#0f172a',
        textMargin: 3,
      });
      setInvalid(false);
    } catch {
      svgRef.current.replaceChildren();
      setInvalid(true);
    }
  }, [normalizedValue, compact]);

  if (!normalizedValue) return null;

  return (
    <div className="inline-flex max-w-full flex-col items-center rounded-md border border-slate-200 bg-white px-2 py-1" aria-label={`Barcode preview for ${normalizedValue}`}>
      <svg ref={svgRef} role="img" aria-label={`Code 128 barcode ${normalizedValue}`} className="max-w-full" />
      {invalid && <span className="text-[10px] text-rose-600">This barcode value can’t be rendered.</span>}
    </div>
  );
};
