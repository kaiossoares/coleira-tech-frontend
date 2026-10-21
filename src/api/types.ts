/**
 * Modelos de domínio compartilhados entre o app e o backend.
 * Este arquivo é o contrato: o backend deve devolver exatamente estes formatos
 * (JSON, camelCase, datas em ISO 8601). Veja docs/API.md.
 */

export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  acceptedTerms: boolean;
}

// ---------- Coleira ----------

/** Intervalos de atualização suportados pelo hardware, em segundos. */
export type UpdateIntervalSec = 30 | 60 | 300;

export type SignalStrength = 'strong' | 'medium' | 'weak' | 'none';

export interface Collar {
  id: ID;
  /** Código impresso na etiqueta da coleira, formato CT-0000-0000. */
  code: string;
  nickname: string | null;
  updateIntervalSec: UpdateIntervalSec;
  notifySignalLoss: boolean;
  notifyLowBattery: boolean;
  /** 0–100, null se nunca reportou. */
  batteryPct: number | null;
  signal: SignalStrength;
  firmwareVersion: string | null;
  /** Animal ao qual a coleira está vinculada (null = livre). */
  petId: ID | null;
}

export interface CollarInput {
  code: string;
  nickname?: string | null;
  updateIntervalSec: UpdateIntervalSec;
  notifySignalLoss: boolean;
  notifyLowBattery: boolean;
}

export type CollarUpdate = Partial<Omit<CollarInput, 'code'>>;

// ---------- Localização / área segura ----------

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationFix extends LatLng {
  /** ISO 8601 do momento em que a coleira registrou a posição. */
  recordedAt: string;
  /** Endereço legível (geocodificação reversa feita pelo backend), opcional. */
  address?: string | null;
}

export interface SafeArea {
  label: string;
  address: string | null;
  center: LatLng;
  radiusM: number;
  alertOnExit: boolean;
}

export type SafeAreaInput = Partial<SafeArea>;

// ---------- Animal ----------

export type Species = 'dog' | 'cat' | 'other';
export type Sex = 'male' | 'female';
export type PetSize = 'S' | 'M' | 'L';

export interface Pet {
  id: ID;
  name: string;
  species: Species;
  breed: string;
  color: string;
  /** Cor de amostra escolhida nos chips (hex), opcional. */
  colorHex: string | null;
  sex: Sex;
  size: PetSize;
  /** Data de nascimento, YYYY-MM-DD. */
  birthDate: string | null;
  weightKg: number | null;
  notes: string | null;
  photoUrl: string | null;
  collarId: ID | null;
}

export type PetInput = Omit<Pet, 'id' | 'photoUrl' | 'collarId'> & {
  collarId: ID;
  safeArea?: SafeAreaInput;
};

export type PetUpdate = Partial<Omit<Pet, 'id' | 'collarId' | 'photoUrl'>>;

/** Status de rastreamento exibido nos cartões e no detalhe. */
export type TrackingStatus = 'tracking' | 'outside' | 'no_signal';

/**
 * Visão agregada usada pela tela inicial e pelo detalhe.
 * O backend monta isto (GET /pets, GET /pets/:id).
 */
export interface PetOverview {
  pet: Pet;
  collar: Collar | null;
  safeArea: SafeArea | null;
  lastLocation: LocationFix | null;
  status: TrackingStatus;
  /** Distância (m) entre a última posição e o centro da área segura. */
  distanceFromCenterM: number | null;
}
