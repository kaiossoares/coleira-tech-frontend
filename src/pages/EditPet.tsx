import { useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import { PetFormFields, emptyPetForm, formToPayload, petToForm, usePetForm, validatePetForm } from '@/components/PetForm';
import { ErrorState, FormError, Loading } from '@/components/States';
import { TopBar } from '@/components/TopBar';
import { useResource } from '@/hooks/useResource';
import { useSubmit } from '@/hooks/useSubmit';

export default function EditPet() {
  const { petId = '' } = useParams();
  const navigate = useNavigate();
  const res = useResource(() => api.getPet(petId), [petId]);
  const { values, setValues, set } = usePetForm(emptyPetForm());
  const { pending, error, run, fieldErrors, setFieldErrors } = useSubmit();
  const back = `/animais/${petId}`;

  useEffect(() => {
    if (res.data) setValues(petToForm(res.data.pet));
  }, [res.data, setValues]);

  async function save(e?: FormEvent) {
    e?.preventDefault();
    const errs = validatePetForm(values);
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    const ok = await run(async () => {
      await api.updatePet(petId, formToPayload(values));
      if (values.photo) await api.uploadPetPhoto(petId, values.photo);
      return true;
    });
    if (ok) navigate(back);
  }

  async function remove() {
    if (!window.confirm(`Remover ${res.data?.pet.name ?? 'este animal'}? A coleira ficará livre para outro pet.`)) return;
    const ok = await run(async () => {
      await api.deletePet(petId);
      return true;
    });
    if (ok) navigate('/', { replace: true });
  }

  if (res.loading && !res.data) return <div className="screen"><TopBar back={back} title="Editar animal" /><Loading /></div>;
  if (res.error && !res.data) return <div className="screen"><TopBar back={back} title="Editar animal" /><ErrorState message={res.error.message} onRetry={res.reload} /></div>;

  return (
    <form className="screen" onSubmit={save} noValidate>
      <TopBar
        back={back}
        title="Editar animal"
        action={
          <button type="submit" className="topbar__action" disabled={pending}>
            Salvar
          </button>
        }
      />

      <FormError message={error} />

      <PetFormFields layout="edit" values={values} set={set} errors={fieldErrors} currentPhotoUrl={res.data?.pet.photoUrl} />

      <div className="spacer" />

      <button type="submit" className="btn btn--primary" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar alterações'}
      </button>
      <button type="button" className="btn btn--danger-text" onClick={remove} disabled={pending}>
        Remover animal
      </button>
    </form>
  );
}
