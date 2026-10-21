import { useId, type KeyboardEvent, type ReactNode } from 'react';

interface Option<T> {
  value: T;
  label: ReactNode;
}

interface Props<T> {
  label: ReactNode;
  /** Tamanho visual do rótulo: "field" (13px) ou "section" (15px, negrito). */
  labelStyle?: 'field' | 'section';
  options: Option<T>[];
  value: T;
  onChange(v: T): void;
  size?: 'md' | 'sm';
  hint?: ReactNode;
}

/** Grupo de rádio segmentado (Cachorro/Gato/Outro, Macho/Fêmea, 30 s/1 min/5 min). */
export function Segmented<T extends string | number>({ label, labelStyle = 'field', options, value, onChange, size = 'md', hint }: Props<T>) {
  const id = useId();
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = options[(i + dir + options.length) % options.length];
    onChange(next.value);
    const group = (e.currentTarget as HTMLElement).parentElement;
    (group?.children[(i + dir + options.length) % options.length] as HTMLElement | undefined)?.focus();
  };
  return (
    <div className="field">
      <span id={id} className={labelStyle === 'section' ? 'strong-15' : 'field__label'}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className={`segmented ${size === 'sm' ? 'segmented--sm' : ''}`}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o, i) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            tabIndex={o.value === value ? 0 : -1}
            className="segmented__opt"
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

/** Chips de raio da área segura (50 m, 100 m, 200 m, 500 m). */
export function RadiusChips({ value, onChange, options = [50, 100, 200, 500] }: { value: number; onChange(v: number): void; options?: number[] }) {
  return (
    <div className="chips" role="radiogroup" aria-label="Raio da área segura">
      {options.map((v) => (
        <button key={v} type="button" role="radio" aria-checked={v === value} className="chip" onClick={() => onChange(v)}>
          {v} m
        </button>
      ))}
    </div>
  );
}
