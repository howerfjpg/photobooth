import { getApiUrl } from './apiClient';
import { KioskConfig, PhotoboothSession, CapturedPhoto } from '../types';

export const kioskService = {
  async getConfig(): Promise<KioskConfig> {
    const res = await fetch(getApiUrl('/api/config'));
    if (!res.ok) throw new Error("Error fetching config");
    return res.json();
  },

  async updateConfig(updates: Partial<KioskConfig>): Promise<{ success: boolean; config: KioskConfig }> {
    const res = await fetch(getApiUrl('/api/config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async createSession(): Promise<{ success: boolean; session: PhotoboothSession }> {
    const res = await fetch(getApiUrl('/api/sessions/create'), { method: 'POST' });
    return res.json();
  },

  async savePhotos(
    sessionId: string, 
    photos: CapturedPhoto[], 
    compositeUrl: string | null, 
    filterApplied: string
  ): Promise<any> {
    const res = await fetch(getApiUrl(`/api/sessions/${sessionId}/photos`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos, compositeUrl, filterApplied }),
    });
    return res.json();
  },

  async getAdminSessions(): Promise<any> {
    const res = await fetch(getApiUrl('/api/admin/sessions'));
    return res.json();
  },

  async refillPaper(): Promise<any> {
    const res = await fetch(getApiUrl('/api/admin/refill-paper'), { method: 'POST' });
    return res.json();
  }
};
