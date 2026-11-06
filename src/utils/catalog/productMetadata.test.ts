import { describe, expect, it } from 'vitest';
import { formatProductSpecifications, formatSizeChart, parseProductSpecifications, parseSizeChart } from './productMetadata';

describe('product metadata parsing', () => {
  it('parses unique product specifications and round trips them', () => {
    const value = parseProductSpecifications('Material: Cotton\nCare: Machine wash');
    expect(value).toEqual({ Material: 'Cotton', Care: 'Machine wash' });
    expect(parseProductSpecifications(formatProductSpecifications(value))).toEqual(value);
    expect(() => parseProductSpecifications('Material: Cotton\nmaterial: Linen')).toThrow('unique');
  });

  it('parses and formats a size chart table', () => {
    const value = parseSizeChart('Size | Chest | Length\nS | 86 cm | 60 cm\nM | 92 cm | 64 cm');
    expect(value).toEqual({
      columns: ['Size', 'Chest', 'Length'],
      rows: [
        { Size: 'S', Chest: '86 cm', Length: '60 cm' },
        { Size: 'M', Chest: '92 cm', Length: '64 cm' },
      ],
    });
    expect(parseSizeChart(formatSizeChart(value))).toEqual(value);
    expect(() => parseSizeChart('Size | Chest\nS')).toThrow('row 2');
  });
});
