import type { Collar, SafeAreaInput } from '@/api/types';

/** Rascunho do fluxo Cadastrar coleira → Cadastrar animal (sobrevive a recarregar a página). */
export interface OnboardingDraft {
  collar: Collar;
  safeArea: SafeAreaInput;
}

const KEY = 'coleira.onboarding';

export const onboardingDraft = {
  get(): OnboardingDraft | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as OnboardingDraft) : null;
    } catch {
      return null;
    }
  },
  set(d: OnboardingDraft | null) {
    try {
      if (d) sessionStorage.setItem(KEY, JSON.stringify(d));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* ignora */
    }
  },
};
