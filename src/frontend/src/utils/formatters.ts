export function epochToDate(epochNs: bigint): Date {
  return new Date(Number(epochNs / 1_000_000n));
}

export function formatDateTime(epochNs: bigint): string {
  const d = epochToDate(epochNs);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

export function formatDuration(entryNs: bigint, exitNs: bigint): string {
  const diffMs = Number((exitNs - entryNs) / 1_000_000n);
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function formatCost(paise: bigint): string {
  const rupees = Number(paise) / 100;
  return `\u20B9${rupees.toFixed(2)}`;
}

export function formatVehicleType(type: string): string {
  return type === "twoWheeler" ? "2-Wheeler" : "4-Wheeler";
}

export function getElapsedTime(entryNs: bigint): string {
  const now = BigInt(Date.now()) * 1_000_000n;
  return formatDuration(entryNs, now);
}
