import type { PetSize, Sex, SignalStrength, Species, UpdateIntervalSec } from '@/api/types';

export const speciesLabel: Record<Species, string> = { dog: 'Cachorro', cat: 'Gato', other: 'Outro' };
export const sexLabel: Record<Sex, string> = { male: 'Macho', female: 'Fêmea' };
export const sizeLabel: Record<PetSize, string> = { S: 'Pequeno', M: 'Médio', L: 'Grande' };
export const sizeShort: Record<PetSize, string> = { S: 'P', M: 'M', L: 'G' };
export const signalLabel: Record<SignalStrength, string> = {
  strong: 'Forte',
  medium: 'Médio',
  weak: 'Fraco',
  none: 'Sem sinal',
};

export const intervalOptions: { value: UpdateIntervalSec; short: string; long: string }[] = [
  { value: 30, short: '30 s', long: '30 segundos' },
  { value: 60, short: '1 min', long: '1 minuto' },
  { value: 300, short: '5 min', long: '5 minutos' },
];

export function intervalLong(v: UpdateIntervalSec): string {
  return intervalOptions.find((o) => o.value === v)?.long ?? `${v} s`;
}

/** "Agora", "Há 1 min", "Há 25 min", "Há 2 h", "Há 3 dias". */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return 'Agora';
  const m = Math.round(s / 60);
  if (m < 60) return `Há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `Há ${h} h`;
  const d = Math.round(h / 24);
  return `Há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

export function formatMeters(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
  return `${Math.round(m / 10) * 10} m`;
}

/** Idade a partir de YYYY-MM-DD: "4 anos", "8 meses". */
export function ageLabel(birthDate: string | null, now = new Date()): string | null {
  if (!birthDate) return null;
  const b = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(b.getTime())) return null;
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 12) return `${Math.max(months, 0)} ${months === 1 ? 'mês' : 'meses'}`;
  const y = Math.floor(months / 12);
  return `${y} ${y === 1 ? 'ano' : 'anos'}`;
}

/** dd/mm/aaaa ⇄ YYYY-MM-DD */
export function brDateToIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}
export function isoToBrDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Máscara simples de digitação dd/mm/aaaa. */
export function maskBrDate(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** (00) 00000-0000 */
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** CT-0000-0000 */
export function maskCollarCode(v: string): string {
  const d = v.toUpperCase().replace(/^CT-?/, '').replace(/[^0-9A-Z]/g, '').slice(0, 8);
  if (!d) return '';
  if (d.length <= 4) return `CT-${d}`;
  return `CT-${d.slice(0, 4)}-${d.slice(4)}`;
}
export const collarCodeValid = (v: string) => /^CT-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(v);

export function parseDecimal(v: string): number | null {
  const n = Number(v.replace(',', '.'));
  return v.trim() && Number.isFinite(n) ? n : null;
}
export function formatDecimal(n: number | null): string {
  return n === null ? '' : String(n).replace('.', ',');
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';
export const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();
