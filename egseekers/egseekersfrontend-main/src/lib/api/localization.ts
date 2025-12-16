import { api } from './api';

export interface Locale {
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  isDefault: boolean;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousand: string;
    precision: number;
  };
}

export interface Translation {
  key: string;
  value: string;
  locale: string;
  namespace: string;
  isOverridden: boolean;
  lastUpdated: string;
}

export interface TranslationNamespace {
  name: string;
  description: string;
  totalKeys: number;
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export const localizationApi = {
  async getLocales(): Promise<Locale[]> {
    const { data } = await api.get('/localization/locales');
    return data;
  },

  async updateLocale(
    code: string,
    updates: Partial<Omit<Locale, 'code'>>
  ): Promise<Locale> {
    const { data } = await api.patch(`/localization/locales/${code}`, updates);
    return data;
  },

  async setDefaultLocale(code: string): Promise<void> {
    await api.post(`/localization/locales/${code}/default`);
  },

  async getTranslations(
    locale: string,
    namespace?: string
  ): Promise<Translation[]> {
    const { data } = await api.get('/localization/translations', {
      params: { locale, namespace }
    });
    return data;
  },

  async updateTranslation(
    locale: string,
    key: string,
    value: string,
    namespace: string
  ): Promise<Translation> {
    const { data } = await api.patch('/localization/translations', {
      locale,
      key,
      value,
      namespace
    });
    return data;
  },

  async getNamespaces(): Promise<TranslationNamespace[]> {
    const { data } = await api.get('/localization/namespaces');
    return data;
  },

  async importTranslations(
    locale: string,
    namespace: string,
    file: File
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('locale', locale);
    formData.append('namespace', namespace);

    const { data } = await api.post('/localization/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async exportTranslations(
    locale: string,
    namespace?: string
  ): Promise<Blob> {
    const { data } = await api.get('/localization/export', {
      params: { locale, namespace },
      responseType: 'blob'
    });
    return data;
  },

  async getMissingTranslations(locale: string): Promise<{
    namespace: string;
    keys: string[];
  }[]> {
    const { data } = await api.get(`/localization/missing/${locale}`);
    return data;
  },

  async validateTranslations(locale: string): Promise<{
    valid: boolean;
    errors: { key: string; error: string }[];
  }> {
    const { data } = await api.post(`/localization/validate/${locale}`);
    return data;
  },

  async getCurrencies(): Promise<{
    code: string;
    name: string;
    symbol: string;
  }[]> {
    const { data } = await api.get('/localization/currencies');
    return data;
  },

  async getTimezones(): Promise<{
    code: string;
    name: string;
    offset: string;
  }[]> {
    const { data } = await api.get('/localization/timezones');
    return data;
  }
}; 