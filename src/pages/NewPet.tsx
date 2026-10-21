import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { Icon } from '@/components/Icon';
import { PetFormFields, emptyPetForm, formToPayload, usePetForm, validatePetForm } from '@/components/PetForm';
import { FormError } from '@/components/States';
import { StepHeader } from '@/components/TopBar';
import { useSubmit } from '@/hooks/useSubmit';
import { onboardingDraft } from '@/utils/onboarding';

export default function NewPet() {
  const navigate = useNavigate();
  const [draft] = useState(() => onboardingDraft.get());
  const { values, set } = usePetForm(emptyPetForm());
  const { pending, error, run, fieldErrors, setFieldErrors } = useSubmit();

  if (!draft) return <Navigate to="/coleiras/nova" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const errs = validatePetForm(values);
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    const pet = await run(async () => {
      const created = await api.createPet({ ...formToPayload(values), collarId: draft.collar.id, safeArea: draft.safeArea });
      if (values.photo) await api.uploadPetPhoto(created.id, values.photo).catch(() => undefined);
      return created;
    });
    if (!pet) return;
    onboardingDraft.set(null);
    navigate('/', { replace: true });
  }

  return (
    <form className="screen screen--gap-lg" onSubmit={onSubmit} noValidate>
      <StepHeader back="/coleiras/nova" step={2} total={2} />

      <div className="stack stack-4">
        <h1 className="title-xl">Quem vai usar a coleira?</h1>
        <p className="lead">Esses dados ajudam a identificar seu pet se ele se perder.</p>
      </div>

      <div className="alert alert--info">
        <Icon name="check" color="var(--blue)" />
        <span>
          Coleira <strong>{draft.collar.code}</strong> vinculada
        </span>
      </div>

      <FormError message={error} />

      <PetFormFields layout="new" values={values} set={set} errors={fieldErrors} />

      <div className="spacer" />

      <button type="submit" className="btn btn--accent" disabled={pending}>
        <Icon name="pin" />
        {pending ? 'Salvando…' : 'Salvar e começar a rastrear'}
      </button>
    </form>
  );
}
