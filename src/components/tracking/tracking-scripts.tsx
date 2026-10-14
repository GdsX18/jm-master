import React from 'react';
import prisma from '@/lib/prisma';
import { ConsentTracking, type TrackingSettings } from './consent-tracking';

// Lê as tags configuradas no painel e só as carrega após o consentimento de cookies (LGPD)
export async function TrackingScripts() {
  let settings: TrackingSettings | null = null;
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: 'default' },
    });
    if (row) {
      settings = {
        gtmId: row.gtmId?.trim() || '',
        gaId: row.gaId?.trim() || '',
        metaPixelId: row.metaPixelId?.trim() || '',
        tiktokPixelId: row.tiktokPixelId?.trim() || '',
        customHeaderScript: row.customHeaderScript?.trim() || '',
        customBodyScript: row.customBodyScript?.trim() || '',
      };
    }
  } catch (e) {
    // Silencioso caso ocorra durante build offline
  }

  return <ConsentTracking settings={settings} />;
}
