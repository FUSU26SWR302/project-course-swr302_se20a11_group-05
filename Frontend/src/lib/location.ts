export interface GpsLocation {
  latitude: number;
  longitude: number;
}

const GPS_LOCATION_KEY = "dn_gps_location_v1";

export function getStoredGpsLocation(): GpsLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(GPS_LOCATION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<GpsLocation>;
    if (isValidCoordinate(parsed.latitude, parsed.longitude)) {
      return {
        latitude: parsed.latitude as number,
        longitude: parsed.longitude as number,
      };
    }
  } catch {
    localStorage.removeItem(GPS_LOCATION_KEY);
  }

  return null;
}

export function storeGpsLocation(location: GpsLocation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GPS_LOCATION_KEY, JSON.stringify(location));
}

export function clearGpsLocation() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GPS_LOCATION_KEY);
}

export function requestCurrentGpsLocation(): Promise<GpsLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("GEOLOCATION_UNSUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        storeGpsLocation(location);
        resolve(location);
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export function getGpsErrorMessage(error: unknown, required = false): string {
  if (required) {
    return "Location permission is required to submit feedback.";
  }

  if (isGeolocationPositionError(error)) {
    if (error.code === error.PERMISSION_DENIED) {
      return "Location permission was denied.";
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      return "Location is currently unavailable.";
    }
    if (error.code === error.TIMEOUT) {
      return "GPS request timed out.";
    }
  }

  if (error instanceof Error && error.message === "GEOLOCATION_UNSUPPORTED") {
    return "Your browser does not support GPS.";
  }

  return "Could not get your current location.";
}

function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function isGeolocationPositionError(error: unknown): error is GeolocationPositionError {
  return (
    typeof GeolocationPositionError !== "undefined" && error instanceof GeolocationPositionError
  );
}
