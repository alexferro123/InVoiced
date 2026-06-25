interface FileEntry {
  base64:   string;
  mimeType: string;
  fileName: string;
}

export const fileStore: Record<string, FileEntry> = {};

export const storeFile = (
  id: string,
  b64: string,
  mime: string,
  name: string,
): void => {
  fileStore[id] = { base64: b64, mimeType: mime, fileName: name };
};

// Removes binary data before persisting invoices to storage
export const stripFiles = (arr: any[]): any[] =>
  arr.map(({ base64: _b, mimeType: _m, ...rest }) => ({
    ...rest,
    hasFile: !!_b,
    receipt: rest.receipt
      ? { ...rest.receipt, base64: undefined, hasFile: !!rest.receipt?.base64 }
      : rest.receipt,
  }));
