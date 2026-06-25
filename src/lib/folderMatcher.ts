interface Folder { id: number; name: string; }
interface InvoiceHint { supplier?: string; description?: string; category?: string; }

export const matchFolder = (
  folders: Folder[],
  { supplier = "", description = "", category = "" }: InvoiceHint,
): Folder | null => {
  const hay = [supplier, description, category].join(" ").toLowerCase();
  let best: Folder | null = null;
  let bestScore = 0;

  for (const f of folders) {
    const words = f.name.toLowerCase().split(/[\s\-_/]+/).filter(w => w.length > 2);
    let score = 0;
    for (const w of words) { if (hay.includes(w)) score += w.length * 2; }
    if (score > bestScore) { bestScore = score; best = f; }
  }

  return bestScore >= 4 ? best : null;
};
