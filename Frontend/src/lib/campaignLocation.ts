import type { Campaign } from "@/lib/campaignStore";

export interface CampaignCoordinates {
  lat: number;
  lng: number;
  label: string;
  zoom: number;
}

const DA_NANG_CENTER: CampaignCoordinates = {
  lat: 16.0544,
  lng: 108.2022,
  label: "Đà Nẵng",
  zoom: 13,
};

const CAMPAIGN_COORDINATES_BY_ID: Record<string, CampaignCoordinates> = {
  "green-hoa-xuan": {
    lat: 15.9909,
    lng: 108.2214,
    label: "Hòa Xuân, Cẩm Lệ, Đà Nẵng",
    zoom: 15,
  },
  "beach-cleanup-my-khe": {
    lat: 16.0541,
    lng: 108.2477,
    label: "Bãi biển Mỹ Khê, Sơn Trà, Đà Nẵng",
    zoom: 16,
  },
  "drainage-restoration": {
    lat: 16.0665,
    lng: 108.2188,
    label: "Hải Châu 1, Đà Nẵng",
    zoom: 15,
  },
  "community-safety": {
    lat: 16.0699,
    lng: 108.1871,
    label: "Thanh Khê Đông, Đà Nẵng",
    zoom: 15,
  },
  "tree-planting": {
    lat: 16.0742,
    lng: 108.1495,
    label: "Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng",
    zoom: 15,
  },
  "illegal-ads-removal": {
    lat: 16.0025,
    lng: 108.2635,
    label: "Ngũ Hành Sơn, Đà Nẵng",
    zoom: 14,
  },
  "neighborhood-beautification": {
    lat: 16.0717,
    lng: 108.1508,
    label: "Liên Chiểu, Đà Nẵng",
    zoom: 14,
  },
  "public-facility-repair": {
    lat: 16.0159,
    lng: 108.2038,
    label: "Cẩm Lệ, Đà Nẵng",
    zoom: 14,
  },
};

const LOCATION_PATTERNS: Array<{ patterns: string[]; coordinates: CampaignCoordinates }> = [
  {
    patterns: ["xuan thieu", "xuan thieu beach"],
    coordinates: { lat: 16.1139, lng: 108.1503, label: "Bãi biển Xuân Thiều, Liên Chiểu, Đà Nẵng", zoom: 16 },
  },
  {
    patterns: ["my khe", "my an"],
    coordinates: { lat: 16.0541, lng: 108.2477, label: "Bãi biển Mỹ Khê, Sơn Trà, Đà Nẵng", zoom: 16 },
  },
  {
    patterns: ["29/3", "29-3", "hai chau 1", "hai chau"],
    coordinates: { lat: 16.0665, lng: 108.2188, label: "Hải Châu, Đà Nẵng", zoom: 15 },
  },
  {
    patterns: ["hoa xuan"],
    coordinates: { lat: 15.9909, lng: 108.2214, label: "Hòa Xuân, Cẩm Lệ, Đà Nẵng", zoom: 15 },
  },
  {
    patterns: ["hoa khanh bac", "hoa khanh"],
    coordinates: { lat: 16.0742, lng: 108.1495, label: "Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng", zoom: 15 },
  },
  {
    patterns: ["lien chieu"],
    coordinates: { lat: 16.0717, lng: 108.1508, label: "Liên Chiểu, Đà Nẵng", zoom: 14 },
  },
  {
    patterns: ["thanh khe dong", "thanh khe"],
    coordinates: { lat: 16.0699, lng: 108.1871, label: "Thanh Khê, Đà Nẵng", zoom: 14 },
  },
  {
    patterns: ["ngu hanh son", "ngu hanh"],
    coordinates: { lat: 16.0025, lng: 108.2635, label: "Ngũ Hành Sơn, Đà Nẵng", zoom: 14 },
  },
  {
    patterns: ["cam le"],
    coordinates: { lat: 16.0159, lng: 108.2038, label: "Cẩm Lệ, Đà Nẵng", zoom: 14 },
  },
  {
    patterns: ["son tra"],
    coordinates: { lat: 16.1063, lng: 108.2529, label: "Sơn Trà, Đà Nẵng", zoom: 14 },
  },
];

export function resolveCampaignCoordinates(campaign: Pick<Campaign, "id" | "locationText" | "ward" | "name">): CampaignCoordinates {
  const seeded = CAMPAIGN_COORDINATES_BY_ID[campaign.id];
  if (seeded) return seeded;

  return resolveCampaignCoordinatesFromText([campaign.locationText, campaign.ward, campaign.name].filter(Boolean).join(" "));
}

export function resolveCampaignCoordinatesFromText(value: string): CampaignCoordinates {
  const normalized = normalizeLocation(value);
  const matched = LOCATION_PATTERNS.find(({ patterns }) => patterns.some((pattern) => normalized.includes(pattern)));

  if (matched) return matched.coordinates;
  return {
    ...DA_NANG_CENTER,
    label: value.trim() ? `${value.trim()}, Đà Nẵng` : DA_NANG_CENTER.label,
  };
}

export function buildGoogleMapsEmbedUrl({ lat, lng, zoom }: CampaignCoordinates): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&hl=vi&output=embed`;
}

export function buildGoogleMapsSearchUrl({ lat, lng }: CampaignCoordinates): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function normalizeLocation(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
