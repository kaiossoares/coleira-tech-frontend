import type {
  AuthSession,
  Collar,
  CollarInput,
  CollarUpdate,
  ID,
  LoginInput,
  Pet,
  PetInput,
  PetOverview,
  PetUpdate,
  RegisterInput,
  SafeArea,
  SafeAreaInput,
  User,
} from './types';

/**
 * Tudo o que o app precisa do backend. Há duas implementações:
 * - `httpApi` (http.ts): REST real, ver docs/API.md
 * - `mockApi` (mock.ts): dados locais para desenvolver sem servidor
 */
export interface ApiClient {
  // Autenticação
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  me(): Promise<User>;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;

  // Animais (visão agregada com coleira, área e posição)
  listPets(): Promise<PetOverview[]>;
  getPet(petId: ID): Promise<PetOverview>;
  createPet(input: PetInput): Promise<Pet>;
  updatePet(petId: ID, input: PetUpdate): Promise<Pet>;
  deletePet(petId: ID): Promise<void>;
  uploadPetPhoto(petId: ID, file: File): Promise<Pet>;

  // Área segura
  updateSafeArea(petId: ID, input: SafeAreaInput): Promise<SafeArea>;

  // Coleiras
  claimCollar(input: CollarInput): Promise<Collar>;
  updateCollar(collarId: ID, input: CollarUpdate): Promise<Collar>;
  /** Desvincula a coleira do animal e da conta. */
  releaseCollar(collarId: ID): Promise<void>;
  /** Vincula uma coleira (já reivindicada) a um animal, substituindo a anterior. */
  attachCollar(petId: ID, collarId: ID): Promise<Pet>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
