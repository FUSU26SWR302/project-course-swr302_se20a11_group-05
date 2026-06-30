export function getLoginLockoutSeconds(message: string): number | null {
  const secondsMatch = message.match(/(\d+)\s*second/i) ?? message.match(/(\d+)\s*gi[aâ]y/i);
  if (secondsMatch) {
    return Math.max(1, Number(secondsMatch[1]));
  }

  const minutesMatch = message.match(/(\d+)\s*minute/i) ?? message.match(/(\d+)\s*ph[uú]t/i);
  if (minutesMatch) {
    return Math.max(1, Number(minutesMatch[1]) * 60);
  }

  return null;
}

export function formatLoginLockoutCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function buildLoginLockoutMessage(totalSeconds: number): string {
  return `Too many failed login attempts. Please try again in ${formatLoginLockoutCountdown(totalSeconds)}.`;
}
