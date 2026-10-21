import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  compact?: boolean;
  /** Ícone à esquerda e/ou elemento à direita (renderiza o campo com wrapper). */
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function TextField({ label, hint, error, compact, leading, trailing, className, id, ...input }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint || error ? `${fieldId}-hint` : undefined;
  const control =
    leading || trailing ? (
      <div className={`input-wrap ${trailing ? 'input-wrap--trail' : ''}`} data-invalid={error ? 'true' : undefined}>
        {leading}
        <input id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={hintId} {...input} />
        {trailing}
      </div>
    ) : (
      <input
        id={fieldId}
        className={`input ${compact ? 'input--compact' : ''} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={hintId}
        {...input}
      />
    );
  return (
    <div className="field">
      <label htmlFor={fieldId} className="field__label">
        {label}
      </label>
      {control}
      {error ? (
        <span id={hintId} className="field__error">
          {error}
        </span>
      ) : (
        hint && (
          <span id={hintId} className="field__hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
}

export function TextArea({ label, id, ...rest }: AreaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="field">
      <label htmlFor={fieldId} className="field__label">
        {label}
      </label>
      <textarea id={fieldId} className="input" rows={3} {...rest} />
    </div>
  );
}

export const Optional = () => <span className="opt">(opcional)</span>;
