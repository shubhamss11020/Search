export interface ExtensionSettings {
  apiBaseUrl: string;
  token: string | null;
  minMatchScore: number;
  autoExtract: boolean;
  activeLlm: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  apiBaseUrl: 'http://127.0.0.1:8000/api/v1',
  token: null,
  minMatchScore: 70,
  autoExtract: true,
  activeLlm: 'gemini'
};

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['settings'], (result) => {
        resolve({ ...DEFAULT_SETTINGS, ...(result.settings || {}) });
      });
    } else {
      const local = localStorage.getItem('assistant_settings');
      resolve(local ? { ...DEFAULT_SETTINGS, ...JSON.parse(local) } : DEFAULT_SETTINGS);
    }
  });
}

export async function saveSettings(newSettings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ settings: updated }, () => resolve());
    } else {
      localStorage.setItem('assistant_settings', JSON.stringify(updated));
      resolve();
    }
  });
}

export async function getAuthToken(): Promise<string | null> {
  const settings = await getSettings();
  return settings.token;
}

export async function setAuthToken(token: string | null): Promise<void> {
  await saveSettings({ token });
}
