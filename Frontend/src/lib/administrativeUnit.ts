export function getAdministrativeUnitLabel(type?: string | null, name?: string | null) {
  const cleanName = name?.trim();
  const normalizedType = type?.trim().toLowerCase();

  if (
    normalizedType === "commune" ||
    normalizedType === "xã" ||
    normalizedType === "xa" ||
    normalizedType?.includes("xã") ||
    normalizedType?.includes(" xa ") ||
    normalizedType?.includes("commune")
  ) {
    return cleanName ? `UBND Xã ${cleanName}` : "UBND Xã";
  }

  if (
    normalizedType === "ward" ||
    normalizedType === "phường" ||
    normalizedType === "phuong" ||
    normalizedType?.includes("phường") ||
    normalizedType?.includes("phuong") ||
    normalizedType?.includes("ward")
  ) {
    return cleanName ? `UBND Phường ${cleanName}` : "UBND Phường";
  }

  return cleanName ? `UBND ${cleanName}` : "UBND";
}

export function getAdministrativeUnitName(name?: string | null, fallback?: string | null) {
  const source = name?.trim() || fallback?.trim() || "";
  return source
    .replace(/^UBND\s+/i, "")
    .replace(/^(Phường|Phuong|Xã|Xa|Commune|Ward)\s+/i, "")
    .trim();
}
