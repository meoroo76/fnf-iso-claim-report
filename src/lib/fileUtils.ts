export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function claimNoFor(styleCode: string, date: string): string {
  const d = date.replace(/-/g, '').slice(2);
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `CLM-${d}-${styleCode.slice(0, 6).toUpperCase()}-${rnd}`;
}
