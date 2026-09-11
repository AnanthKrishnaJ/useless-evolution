const prefixes = ['Blob', 'Flum', 'Glorp', 'Sniv', 'Cram', 'Blorb', 'Zorp', 'Quib', 'Glub', 'Frip'];
const suffixes = ['us', 'io', 'um', 'ax', 'on', 'en', 'is', 'a', 'or', 'ix'];
const traits = ['Fastus', 'Lazius', 'Dancius', 'Angrius', 'Biggus', 'Smallus', 'Rockhatus', 'Dramatus'];

export function generateSpeciesName(baseName?: string, primaryTrait?: string): string {
  if (!baseName) {
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }
  
  if (primaryTrait) {
    // Determine the trait word
    let word = 'Oddus';
    if (primaryTrait === 'speed') word = 'Fastus';
    if (primaryTrait === 'laziness') word = 'Lazius';
    if (primaryTrait === 'danceTendency') word = 'Dancius';
    if (primaryTrait === 'aggression') word = 'Angrius';
    if (primaryTrait === 'size') word = 'Biggus';
    if (primaryTrait === 'rockHatred') word = 'Rockhatus';
    if (primaryTrait === 'dramaLevel') word = 'Dramatus';
    
    return `${baseName.split(' ')[0]} ${word}`;
  }
  
  return baseName;
}

// HSL to Hex to ensure nice colors
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
