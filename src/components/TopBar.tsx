import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

interface BackProps {
  to: string;
  label?: string;
  variant?: 'chip' | 'white' | 'float';
}

export function BackButton({ to, label = 'Voltar', variant = 'chip' }: BackProps) {
  const cls = variant === 'white' ? 'icon-btn icon-btn--white' : variant === 'float' ? 'icon-btn icon-btn--float' : 'icon-btn';
  return (
    <Link to={to} aria-label={label} className={cls}>
      <Icon name="back" size={22} />
    </Link>
  );
}

interface TopBarProps {
  back: string;
  backVariant?: BackProps['variant'];
  title?: ReactNode;
  action?: ReactNode;
}

/** Voltar · título central · ação à direita (ou espaço vazio para equilibrar). */
export function TopBar({ back, backVariant, title, action }: TopBarProps) {
  return (
    <div className="topbar">
      <BackButton to={back} variant={backVariant} />
      {typeof title === 'string' ? <span className="title-bar">{title}</span> : title}
      {action ?? <div className="topbar__side" />}
    </div>
  );
}

/** Voltar + "PASSO X DE Y" com barras de progresso. */
export function StepHeader({ back, step, total }: { back: string; step: number; total: number }) {
  return (
    <div className="row" style={{ gap: 12 }}>
      <BackButton to={back} />
      <div className="steps">
        <span className="eyebrow">
          Passo {step} de {total}
        </span>
        <div className="steps__bars" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={`steps__bar ${i < step ? 'steps__bar--on' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
