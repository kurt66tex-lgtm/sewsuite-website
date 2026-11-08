// Correct display-only UTF-8 text that was double-decoded as Windows-1252
// in the historical Base44 public catalog import. Do not mutate source records.
const replacements = [
  ['â€™', '’'], ['â€˜', '‘'], ['â€œ', '“'], ['â€�', '”'],
  ['â€\u009d', '”'], ['â€”', '—'], ['â€“', '–'], ['â€¦', '…'],
  ['â€¢', '•'], ['â€‹', ''], ['Ã©', 'é'], ['Ã¨', 'è'],
  ['Ã¡', 'á'], ['Ã³', 'ó'], ['Ã±', 'ñ'], ['Ã­', 'í'],
  ['Ãº', 'ú'], ['Ã¢', 'â'], ['Ã¼', 'ü'], ['Ã®', 'î'],
  ['Ã§', 'ç'], ['Ã„', 'Ä'], ['Ã‰', 'É'],
  ['Â®', '®'], ['Â©', '©'], ['Â°', '°'], ['Â ', ' ']
];

function repairString(value) {
  let corrected=value;
  for (const [broken,valid] of replacements) corrected=corrected.split(broken).join(valid);
  return corrected;
}

export function repairDisplayText(value) {
  if(typeof value==='string')return repairString(value);
  if(Array.isArray(value))return value.map(repairDisplayText);
  if(value && typeof value==='object')
    return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,repairDisplayText(item)]));
  return value;
}
