export interface ReverseGeocodeResult {
  address: string;
}

interface NominatimReverseResponse {
  display_name?: string;
  error?: string;
}

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1",
    "accept-language": "vi",
  });

  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("REVERSE_GEOCODING_FAILED");
  }

  const data = (await response.json()) as NominatimReverseResponse;
  const address = data.display_name?.trim();

  if (!address || data.error) {
    throw new Error("ADDRESS_NOT_FOUND");
  }

  return { address };
}
