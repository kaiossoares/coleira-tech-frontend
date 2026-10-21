import { useId } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange(v: boolean): void;
}

export function ToggleRow({ title, subtitle, checked, onChange }: Props) {
  const id = useId();
  return (
    <div className="toggle-row">
      <label htmlFor={id}>
        <span className="toggle-row__title">{title}</span>
        {subtitle && <span className="toggle-row__sub">{subtitle}</span>}
      </label>
      <input id={id} className="switch" type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}
