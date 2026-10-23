export interface ResistorBand {
  color: string;
  name: string;
  textColor: string;
}

const DIGIT_COLORS: Record<number, { color: string; name: string; text: string }> = {
  0: { color: '#000000', name: 'Svart', text: '#ffffff' },
  1: { color: '#8b4513', name: 'Brun', text: '#ffffff' },
  2: { color: '#dc2626', name: 'Rød', text: '#ffffff' },
  3: { color: '#f97316', name: 'Oransje', text: '#ffffff' },
  4: { color: '#eab308', name: 'Gul', text: '#000000' },
  5: { color: '#16a34a', name: 'Grønn', text: '#ffffff' },
  6: { color: '#2563eb', name: 'Blå', text: '#ffffff' },
  7: { color: '#9333ea', name: 'Fiolett', text: '#ffffff' },
  8: { color: '#6b7280', name: 'Grå', text: '#ffffff' },
  9: { color: '#ffffff', name: 'Hvit', text: '#000000' },
};

export function getResistorColorBands(resistance: number): ResistorBand[] {
  if (resistance <= 0) {
    return [
      { color: '#000000', name: 'Svart', textColor: '#fff' },
      { color: '#000000', name: 'Svart', textColor: '#fff' },
      { color: '#000000', name: 'Svart', textColor: '#fff' },
      { color: '#d4af37', name: 'Gull (5%)', textColor: '#000' },
    ];
  }

  // Get significant digits
  const str = Math.round(resistance).toString();
  const digit1 = parseInt(str[0] || '0', 10);
  const digit2 = parseInt(str[1] || '0', 10);
  const multiplier = Math.max(0, str.length - 2);

  const band1 = DIGIT_COLORS[digit1] || DIGIT_COLORS[1];
  const band2 = DIGIT_COLORS[digit2] || DIGIT_COLORS[0];
  const band3 = DIGIT_COLORS[multiplier] || DIGIT_COLORS[0];
  const band4 = { color: '#d4af37', name: 'Gull (5%)', text: '#000000' };

  return [
    { color: band1.color, name: band1.name, textColor: band1.text },
    { color: band2.color, name: band2.name, textColor: band2.text },
    { color: band3.color, name: band3.name, textColor: band3.text },
    { color: band4.color, name: band4.name, textColor: band4.text },
  ];
}

export function formatResistance(ohms: number): string {
  if (ohms >= 1_000_000) {
    return `${(ohms / 1_000_000).toFixed(ohms % 1_000_000 === 0 ? 0 : 1)} MΩ`;
  }
  if (ohms >= 1_000) {
    return `${(ohms / 1_000).toFixed(ohms % 1_000 === 0 ? 0 : 1)} kΩ`;
  }
  return `${ohms} Ω`;
}
