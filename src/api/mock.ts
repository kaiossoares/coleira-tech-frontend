/**
 * Backend falso para desenvolver o front sem servidor.
 * Persiste em localStorage. Conta de demonstração com 3 animais:
 *   demo@coleira.tech / 12345678
 * Contas novas criadas em "Criar conta" começam vazias.
 */
import { ApiError, type ApiClient } from './client';
import { tokenStore } from './token';
import type {
  Collar,
  ID,
  LocationFix,
  Pet,
  PetOverview,
  SafeArea,
  User,
} from './types';
import { deriveStatus } from '@/utils/status';
import { moveM } from '@/utils/geo';

interface Db {
  users: (User & { password: string })[];
  sessions: Record<string, ID>;
  pets: (Pet & { ownerId: ID })[];
  collars: (Collar & { ownerId: ID })[];
  areas: Record<ID, SafeArea>;
  fixes: Record<ID, LocationFix>;
}

const KEY = 'coleira.mockdb.v1';
const HOME = { lat: -23.5617, lng: -46.6559 };

const uid = () => Math.random().toString(36).slice(2, 10);
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

function seed(): Db {
  const owner = 'u_demo';
  const area = (radiusM: number): SafeArea => ({
    label: 'Casa',
    address: null,
    center: HOME,
    radiusM,
    alertOnExit: true,
  });
  const collar = (id: ID, code: string, nickname: string | null, battery: number, petId: ID, signal: Collar['signal']) => ({
    id,
    code,
    nickname,
    updateIntervalSec: 30 as const,
    notifySignalLoss: true,
    notifyLowBattery: true,
    batteryPct: battery,
    signal,
    firmwareVersion: '1.4.2',
    petId,
    ownerId: owner,
  });
  return {
    users: [{ id: owner, name: 'Letícia Souza', email: 'demo@coleira.tech', phone: '(11) 90000-0000', password: '12345678' }],
    sessions: {},
    pets: [
      {
        id: 'p_thor', ownerId: owner, name: 'Thor', species: 'dog', breed: 'Golden Retriever', color: 'Caramelo',
        colorHex: '#C98B4A', sex: 'male', size: 'L', birthDate: '2022-03-10', weightKg: 32,
        notes: 'Dócil, castrado. Tem medo de fogos de artifício.', photoUrl: null, collarId: 'c_thor',
      },
      {
        id: 'p_mel', ownerId: owner, name: 'Mel', species: 'dog', breed: 'Vira-lata', color: 'Preta e branca',
        colorHex: '#1D1D1F', sex: 'female', size: 'M', birthDate: '2020-07-02', weightKg: 14,
        notes: null, photoUrl: null, collarId: 'c_mel',
      },
      {
        id: 'p_bidu', ownerId: owner, name: 'Bidu', species: 'cat', breed: 'Siamês', color: 'Creme',
        colorHex: '#F7F5F0', sex: 'male', size: 'S', birthDate: '2021-11-20', weightKg: 4.5,
        notes: null, photoUrl: null, collarId: 'c_bidu',
      },
    ],
    collars: [
      collar('c_thor', 'CT-4821-7730', 'Coleira azul', 82, 'p_thor', 'strong'),
      collar('c_mel', 'CT-1934-0082', null, 54, 'p_mel', 'medium'),
      collar('c_bidu', 'CT-7710-5521', null, 9, 'p_bidu', 'none'),
    ],
    areas: { p_thor: area(100), p_mel: area(100), p_bidu: area(50) },
    fixes: {
      p_thor: { ...moveM(HOME, 20, -22), recordedAt: minsAgo(0), address: 'Rua Exemplo, 100' },
      p_mel: { ...moveM(HOME, 270, -40), recordedAt: minsAgo(1), address: 'Av. Exemplo, 900' },
      p_bidu: { ...moveM(HOME, 10, -15), recordedAt: minsAgo(25), address: null },
    },
  };
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* ignora */
  }
  const db = seed();
  save(db);
  return db;
}
function save(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignora */
  }
}

const delay = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const strip = <T extends { ownerId?: ID; password?: string }>(o: T) => {
  const { ownerId: _o, password: _p, ...rest } = o;
  return rest as Omit<T, 'ownerId' | 'password'>;
};

function currentUserId(db: Db): ID {
  const token = tokenStore.get();
  const id = token ? db.sessions[token] : undefined;
  if (!id) throw new ApiError('Sessão expirada. Entre novamente.', 401);
  return id;
}

function ownPet(db: Db, petId: ID) {
  const userId = currentUserId(db);
  const pet = db.pets.find((p) => p.id === petId && p.ownerId === userId);
  if (!pet) throw new ApiError('Animal não encontrado.', 404);
  return pet;
}

function ownCollar(db: Db, collarId: ID) {
  const userId = currentUserId(db);
  const c = db.collars.find((x) => x.id === collarId && x.ownerId === userId);
  if (!c) throw new ApiError('Coleira não encontrada.', 404);
  return c;
}

/** Simula a coleira reportando: animais com sinal ganham posição "agora". */
function tick(db: Db) {
  for (const c of db.collars) {
    if (!c.petId || c.signal === 'none') continue;
    const f = db.fixes[c.petId];
    if (!f) continue;
    const j = () => (Math.random() - 0.5) * 6;
    db.fixes[c.petId] = { ...f, ...moveM(f, j(), j()), recordedAt: new Date().toISOString() };
  }
}

function overview(db: Db, pet: Db['pets'][number]): PetOverview {
  const collar = db.collars.find((c) => c.id === pet.collarId) ?? null;
  const safeArea = db.areas[pet.id] ?? null;
  const lastLocation = db.fixes[pet.id] ?? null;
  return {
    pet: strip(pet),
    collar: collar && strip(collar),
    safeArea,
    lastLocation,
    ...deriveStatus(collar, safeArea, lastLocation),
  };
}

function startSession(db: Db, user: Db['users'][number]) {
  const token = `mock_${uid()}`;
  db.sessions[token] = user.id;
  save(db);
  return { token, user: strip(user) };
}

export const mockApi: ApiClient = {
  async login({ email, password }) {
    const db = load();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) throw new ApiError('E-mail ou senha incorretos.', 401);
    return delay(startSession(db, user));
  },

  async register(input) {
    const db = load();
    if (db.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
      throw new ApiError('Já existe uma conta com este e-mail.', 409, 'email_taken', { email: 'E-mail já cadastrado.' });
    }
    const user = { id: `u_${uid()}`, name: input.name.trim(), email: input.email.trim(), phone: input.phone, password: input.password };
    db.users.push(user);
    return delay(startSession(db, user));
  },

  async me() {
    const db = load();
    const id = currentUserId(db);
    return delay(strip(db.users.find((u) => u.id === id)!), 50);
  },

  async logout() {
    const db = load();
    const token = tokenStore.get();
    if (token) delete db.sessions[token];
    save(db);
  },

  async requestPasswordReset() {
    return delay(undefined);
  },

  async listPets() {
    const db = load();
    const id = currentUserId(db);
    tick(db);
    save(db);
    return delay(db.pets.filter((p) => p.ownerId === id).map((p) => overview(db, p)));
  },

  async getPet(petId) {
    const db = load();
    tick(db);
    save(db);
    return delay(overview(db, ownPet(db, petId)));
  },

  async createPet({ safeArea, collarId, ...input }) {
    const db = load();
    const ownerId = currentUserId(db);
    const collar = ownCollar(db, collarId);
    const pet = { ...input, id: `p_${uid()}`, ownerId, photoUrl: null, collarId };
    db.pets.push(pet);
    collar.petId = pet.id;
    const center = safeArea?.center ?? HOME;
    db.areas[pet.id] = {
      label: safeArea?.label ?? 'Casa',
      address: safeArea?.address ?? null,
      center,
      radiusM: safeArea?.radiusM ?? 100,
      alertOnExit: safeArea?.alertOnExit ?? true,
    };
    db.fixes[pet.id] = { ...moveM(center, 8, -6), recordedAt: new Date().toISOString(), address: null };
    collar.batteryPct = 100;
    collar.signal = 'strong';
    save(db);
    return delay(strip(pet));
  },

  async updatePet(petId, input) {
    const db = load();
    const pet = ownPet(db, petId);
    Object.assign(pet, input);
    save(db);
    return delay(strip(pet));
  },

  async deletePet(petId) {
    const db = load();
    const pet = ownPet(db, petId);
    db.pets = db.pets.filter((p) => p.id !== pet.id);
    for (const c of db.collars) if (c.petId === pet.id) c.petId = null;
    delete db.areas[pet.id];
    delete db.fixes[pet.id];
    save(db);
    return delay(undefined);
  },

  async uploadPetPhoto(petId, file) {
    const db = load();
    const pet = ownPet(db, petId);
    pet.photoUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new ApiError('Não foi possível ler a foto.', 400));
      r.readAsDataURL(file);
    });
    save(db);
    return delay(strip(pet));
  },

  async updateSafeArea(petId, input) {
    const db = load();
    ownPet(db, petId);
    const prev = db.areas[petId] ?? { label: 'Casa', address: null, center: HOME, radiusM: 100, alertOnExit: true };
    db.areas[petId] = { ...prev, ...input };
    save(db);
    return delay(db.areas[petId]);
  },

  async claimCollar(input) {
    const db = load();
    const ownerId = currentUserId(db);
    const existing = db.collars.find((c) => c.code === input.code);
    if (existing && existing.ownerId !== ownerId) {
      throw new ApiError('Esta coleira já está vinculada a outra conta.', 409, 'collar_taken', { code: 'Coleira já em uso.' });
    }
    if (existing?.petId) {
      throw new ApiError('Esta coleira já está em uso por outro animal.', 409, 'collar_in_use', { code: 'Coleira já em uso.' });
    }
    const collar = existing ?? {
      id: `c_${uid()}`,
      code: input.code,
      nickname: null,
      updateIntervalSec: 30 as const,
      notifySignalLoss: true,
      notifyLowBattery: true,
      batteryPct: null,
      signal: 'none' as const,
      firmwareVersion: '1.4.2',
      petId: null,
      ownerId,
    };
    Object.assign(collar, { ...input, nickname: input.nickname || null });
    if (!existing) db.collars.push(collar);
    save(db);
    return delay(strip(collar));
  },

  async updateCollar(collarId, input) {
    const db = load();
    const c = ownCollar(db, collarId);
    Object.assign(c, input);
    save(db);
    return delay(strip(c));
  },

  async releaseCollar(collarId) {
    const db = load();
    const c = ownCollar(db, collarId);
    for (const p of db.pets) if (p.collarId === c.id) p.collarId = null;
    db.collars = db.collars.filter((x) => x.id !== c.id);
    save(db);
    return delay(undefined);
  },

  async attachCollar(petId, collarId) {
    const db = load();
    const pet = ownPet(db, petId);
    const next = ownCollar(db, collarId);
    if (pet.collarId && pet.collarId !== collarId) {
      db.collars = db.collars.filter((x) => x.id !== pet.collarId);
    }
    pet.collarId = next.id;
    next.petId = pet.id;
    next.signal = 'strong';
    next.batteryPct ??= 100;
    const f = db.fixes[pet.id];
    if (f) db.fixes[pet.id] = { ...f, recordedAt: new Date().toISOString() };
    save(db);
    return delay(strip(pet));
  },
};
