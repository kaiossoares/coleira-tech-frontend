import { useEffect, useRef, useState } from 'react';
import type { Pet, PetSize, PetUpdate, Sex, Species } from '@/api/types';
import { Segmented } from './Segmented';
import { TextArea, TextField, Optional } from './Field';
import { Icon } from './Icon';
import { brDateToIso, formatDecimal, isoToBrDate, maskBrDate, parseDecimal, sizeShort } from '@/utils/format';

export interface PetFormValues {
  name: string;
  species: Species;
  breed: string;
  color: string;
  colorHex: string | null;
  sex: Sex;
  size: PetSize;
  birth: string; // dd/mm/aaaa
  weight: string; // "32,5"
  notes: string;
  photo: File | null;
}

export const COLOR_SWATCHES = [
  { label: 'Preto', hex: '#1D1D1F' },
  { label: 'Branco', hex: '#F7F5F0' },
  { label: 'Caramelo', hex: '#C98B4A' },
  { label: 'Marrom', hex: '#6B4428' },
  { label: 'Cinza', hex: '#8E939B' },
  { label: 'Dourado', hex: '#E2B565' },
];

export const BREED_SUGGESTIONS = [
  'SRD (vira-lata)',
  'Golden Retriever',
  'Labrador',
  'Shih Tzu',
  'Yorkshire',
  'Poodle',
  'Bulldog Francês',
  'Pinscher',
  'Border Collie',
  'Siamês',
  'Persa',
  'Maine Coon',
];

export function emptyPetForm(): PetFormValues {
  return { name: '', species: 'dog', breed: '', color: '', colorHex: null, sex: 'male', size: 'M', birth: '', weight: '', notes: '', photo: null };
}

export function petToForm(p: Pet): PetFormValues {
  return {
    name: p.name,
    species: p.species,
    breed: p.breed,
    color: p.color,
    colorHex: p.colorHex,
    sex: p.sex,
    size: p.size,
    birth: isoToBrDate(p.birthDate),
    weight: formatDecimal(p.weightKg),
    notes: p.notes ?? '',
    photo: null,
  };
}

export function validatePetForm(v: PetFormValues): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.name.trim()) e.name = 'Informe o nome.';
  if (v.birth && !brDateToIso(v.birth)) e.birth = 'Data inválida.';
  if (v.weight && (parseDecimal(v.weight) === null || parseDecimal(v.weight)! <= 0)) e.weight = 'Peso inválido.';
  return e;
}

/** Converte o formulário no payload da API. */
export function formToPayload(v: PetFormValues): Required<PetUpdate> {
  return {
    name: v.name.trim(),
    species: v.species,
    breed: v.breed.trim(),
    color: v.color.trim(),
    colorHex: v.colorHex,
    sex: v.sex,
    size: v.size,
    birthDate: v.birth ? brDateToIso(v.birth) : null,
    weightKg: parseDecimal(v.weight),
    notes: v.notes.trim() || null,
  };
}

type Setter = <K extends keyof PetFormValues>(k: K, val: PetFormValues[K]) => void;

interface Props {
  values: PetFormValues;
  set: Setter;
  errors: Record<string, string>;
  /** "new": layout do cadastro (foto ao lado, chips de cor). "edit": foto centralizada, raça/cor lado a lado. */
  layout: 'new' | 'edit';
  currentPhotoUrl?: string | null;
}

function usePreview(file: File | null, fallback: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(fallback ?? null);
  useEffect(() => {
    if (!file) {
      setUrl(fallback ?? null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, fallback]);
  return url;
}

export function PetFormFields({ values: v, set, errors, layout, currentPhotoUrl }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = usePreview(v.photo, currentPhotoUrl);
  const pickPhoto = () => fileRef.current?.click();
  const initialLetter = (v.name.trim()[0] ?? '').toUpperCase();

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) set('photo', f);
        e.target.value = '';
      }}
    />
  );

  const photo =
    layout === 'new' ? (
      <div className="row" style={{ gap: 16 }}>
        <button
          type="button"
          aria-label="Adicionar foto do animal"
          onClick={pickPhoto}
          style={{ width: 88, height: 88, borderRadius: '50%', border: preview ? 0 : '2px dashed var(--blue-dash)', background: 'var(--blue-wash-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', flexShrink: 0, padding: 0, color: 'var(--blue)' }}
        >
          {preview ? (
            <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            <Icon name="camera" size={30} strokeWidth={1.8} />
          )}
          <span style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: '50%', background: 'var(--orange)', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Icon name="plus" size={14} strokeWidth={3} />
          </span>
        </button>
        <div className="stack stack-2">
          <span className="strong-15">Foto do pet</span>
          <span className="text-13 muted">Aparece no mapa e no cartão da coleira.</span>
        </div>
        {fileInput}
      </div>
    ) : (
      <div className="stack" style={{ alignItems: 'center', gap: 10, padding: '6px 0' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--blue-soft)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, position: 'relative' }}>
          {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initialLetter}
          <span style={{ position: 'absolute', right: -2, bottom: -2, width: 34, height: 34, borderRadius: '50%', background: 'var(--blue)', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Icon name="camera" size={16} strokeWidth={2.2} />
          </span>
        </div>
        <button type="button" className="link-btn" style={{ height: 36, padding: '0 12px' }} onClick={pickPhoto}>
          Trocar foto
        </button>
        {fileInput}
      </div>
    );

  const species = (
    <Segmented
      label="Espécie"
      value={v.species}
      onChange={(x) => set('species', x)}
      options={[
        { value: 'dog', label: 'Cachorro' },
        { value: 'cat', label: 'Gato' },
        { value: 'other', label: 'Outro' },
      ]}
    />
  );

  const breedList = (
    <datalist id="breeds">
      {BREED_SUGGESTIONS.map((b) => (
        <option key={b} value={b} />
      ))}
    </datalist>
  );

  const sexSize = (
    <div className="grid-2">
      <Segmented
        label="Sexo"
        size="sm"
        value={v.sex}
        onChange={(x) => set('sex', x)}
        options={[
          { value: 'male', label: 'Macho' },
          { value: 'female', label: 'Fêmea' },
        ]}
      />
      <Segmented
        label="Porte"
        size="sm"
        value={v.size}
        onChange={(x) => set('size', x)}
        options={(['S', 'M', 'L'] as const).map((s) => ({ value: s, label: sizeShort[s] }))}
      />
    </div>
  );

  const birthWeight = (
    <div className="grid-2">
      <TextField label="Nascimento" compact inputMode="numeric" placeholder="dd/mm/aaaa" value={v.birth} onChange={(e) => set('birth', maskBrDate(e.target.value))} error={errors.birth} />
      <TextField label="Peso (kg)" compact inputMode="decimal" placeholder="0,0" value={v.weight} onChange={(e) => set('weight', e.target.value.replace(/[^\d,.]/g, ''))} error={errors.weight} />
    </div>
  );

  if (layout === 'edit') {
    return (
      <>
        {photo}
        <TextField label="Nome" value={v.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        {species}
        <div className="grid-2">
          <TextField label="Raça" compact list="breeds" value={v.breed} onChange={(e) => set('breed', e.target.value)} />
          <TextField label="Cor" compact value={v.color} onChange={(e) => set('color', e.target.value)} />
        </div>
        {breedList}
        {sexSize}
        {birthWeight}
        <TextArea label="Observações" value={v.notes} onChange={(e) => set('notes', e.target.value)} />
      </>
    );
  }

  return (
    <>
      {photo}
      <TextField label="Nome" placeholder="Ex.: Thor" value={v.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      {species}
      <TextField
        label="Raça"
        list="breeds"
        placeholder="Ex.: Golden Retriever, SRD…"
        value={v.breed}
        onChange={(e) => set('breed', e.target.value)}
        trailing={<Icon name="chevronDown" color="var(--muted)" style={{ marginRight: 6 }} />}
      />
      {breedList}
      <div className="field">
        <TextField label="Cor da pelagem" placeholder="Ex.: caramelo com mancha branca" value={v.color} onChange={(e) => set('color', e.target.value)} />
        <div className="swatches" role="group" aria-label="Cor principal">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c.hex}
              type="button"
              className="swatch"
              aria-label={c.label}
              aria-pressed={v.colorHex === c.hex}
              style={{ background: c.hex }}
              onClick={() => {
                const on = v.colorHex === c.hex;
                set('colorHex', on ? null : c.hex);
                if (!on && !v.color.trim()) set('color', c.label);
              }}
            />
          ))}
        </div>
      </div>
      {sexSize}
      {birthWeight}
      <TextArea
        label={
          <>
            Observações <Optional />
          </>
        }
        placeholder="Temperamento, alergias, medicamentos, se é castrado…"
        value={v.notes}
        onChange={(e) => set('notes', e.target.value)}
      />
    </>
  );
}

export function usePetForm(initial: PetFormValues) {
  const [values, setValues] = useState(initial);
  const set: Setter = (k, val) => setValues((f) => ({ ...f, [k]: val }));
  return { values, setValues, set };
}
