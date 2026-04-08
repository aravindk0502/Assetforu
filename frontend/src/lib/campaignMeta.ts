import { parseCampaignImages } from '@/lib/campaignImages';

export type CampaignLandMeta = {
  city?: string;
  state?: string;
  country?: string;
  priceLabel?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  mapUrl?: string;
};

export type CampaignMeta = {
  text: string;
  images: string[];
  land?: CampaignLandMeta;
};

export function parseCampaignMeta(descriptionRaw: unknown, imageUrlRaw?: unknown): CampaignMeta {
  const fallbackImages = parseCampaignImages(imageUrlRaw);
  if (typeof descriptionRaw !== 'string') {
    return { text: '', images: fallbackImages };
  }

  const textRaw = descriptionRaw.trim();
  if (!textRaw) return { text: '', images: fallbackImages };

  if (textRaw.startsWith('{')) {
    try {
      const parsed = JSON.parse(textRaw) as Partial<CampaignMeta> & { description?: string; text?: string };
      const text = String(parsed.text ?? parsed.description ?? '').trim() || textRaw;
      const images = Array.isArray(parsed.images) ? parsed.images.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];
      const land = parsed.land && typeof parsed.land === 'object' ? (parsed.land as CampaignLandMeta) : undefined;
      return { text, images: images.length ? images : fallbackImages, land };
    } catch {
      // fall through
    }
  }

  return { text: textRaw, images: fallbackImages };
}

export function buildCampaignDescription(meta: { text: string; images: string[]; land?: CampaignLandMeta }) {
  return JSON.stringify({
    text: meta.text,
    images: (meta.images || []).filter(Boolean).slice(0, 5),
    land: meta.land || undefined,
  });
}

