
// Onboarding state management
const ONBOARDING_KEY = 'dailyhack_onboarding_completed';
const ONBOARDING_STEP_KEY = 'dailyhack_onboarding_step';

export const getOnboardingCompleted = (): boolean => {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setOnboardingCompleted = (completed: boolean): void => {
  try {
    localStorage.setItem(ONBOARDING_KEY, completed.toString());
  } catch {
    // Ignore localStorage errors
  }
};

export const getOnboardingStep = (): string => {
  try {
    return localStorage.getItem(ONBOARDING_STEP_KEY) || 'welcome';
  } catch {
    return 'welcome';
  }
};

export const setOnboardingStep = (step: string): void => {
  try {
    localStorage.setItem(ONBOARDING_STEP_KEY, step);
  } catch {
    // Ignore localStorage errors
  }
};

export const clearOnboardingState = (): void => {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
  } catch {
    // Ignore localStorage errors
  }
};
