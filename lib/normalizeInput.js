function normalizeInput(input) {
  if (typeof input !== 'string') return input;
  let s = input;
  s = s.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, "");
  s = s.normalize("NFKC");
  s = normalizeHomoglyphs(s);
  return s;
}

function normalizeHomoglyphs(input) {
  let s = input;
  for (const [from, to] of HOMOGLYPH_MAP) {
    s = s.replace(new RegExp(from, "g"), to);
  }
  return s;
}

const HOMOGLYPH_MAP = [
  [String.fromCharCode(0x0430), "a"],
  [String.fromCharCode(0x0435), "e"],
  [String.fromCharCode(0x043E), "o"],
  [String.fromCharCode(0x0440), "p"],
  [String.fromCharCode(0x0441), "c"],
  [String.fromCharCode(0x0443), "y"],
  [String.fromCharCode(0x0445), "x"],
  [String.fromCharCode(0x0456), "i"],
  [String.fromCharCode(0x0458), "j"],
  [String.fromCharCode(0x0455), "s"],
  [String.fromCharCode(0x0454), "e"],
  [String.fromCharCode(0x0457), "i"],
  [String.fromCharCode(0x0451), "e"],

  [String.fromCharCode(0x03B1), "a"],
  [String.fromCharCode(0x03B5), "e"],
  [String.fromCharCode(0x03BF), "o"],
  [String.fromCharCode(0x03C1), "p"],
  [String.fromCharCode(0x03C4), "t"],
  [String.fromCharCode(0x03C5), "u"],
  [String.fromCharCode(0x03C7), "x"],
  [String.fromCharCode(0x03BA), "k"],
  [String.fromCharCode(0x03B2), "b"],
];

module.exports = { normalizeInput };
