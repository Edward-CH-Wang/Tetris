// Safe helpers for Firestore Timestamp / Date / string / number

export function isTimestamp(v: any): v is { toDate: () => Date; seconds: number } {
  return v && typeof v === 'object' && typeof (v as any).toDate === 'function' && typeof (v as any).seconds === 'number';
}

export function toDateSafe(v: any): Date {
  if (v == null) return new Date(NaN);
  if (isTimestamp(v)) return v.toDate();      // Firestore Timestamp -> Date
  if (v instanceof Date) return v;
  return new Date(v);                          // string or number -> Date
}

export function toIsoSafe(v: any): string {
  const d = toDateSafe(v);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export function toMsSafe(v: any): number {
  const d = toDateSafe(v);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

// Recursively convert all Timestamp fields inside an object to Date
export function fixTimestamps<T>(obj: T): T {
  if (obj == null) return obj;
  if (isTimestamp(obj)) return toDateSafe(obj) as any;
  if (Array.isArray(obj)) return obj.map(fixTimestamps) as any;
  if (typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) out[k] = fixTimestamps(v);
    return out as T;
  }
  return obj;
}