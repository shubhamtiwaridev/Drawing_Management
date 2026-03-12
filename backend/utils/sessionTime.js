function to24h(hour12, meridiem) {
  let h = Number(hour12);
  if (!Number.isFinite(h)) return null;

  // ✅ FIX: hour must be 1..12 (not 0 or 13 etc.)
  if (h < 1 || h > 12) return null;

  h = h % 12;
  if (String(meridiem || "").toUpperCase() === "PM") h += 12;
  return h;
}

export function parseUiDateTime(obj) {
  if (!obj || typeof obj !== "object") return null;

  const dateStr = String(obj.date || "");
  const timeStr = String(obj.time || "");
  const mer = String(obj.meridiem || "AM").toUpperCase();

  if (dateStr.length !== 10 || timeStr.length !== 5) return null;

  const [ddS, mmS, yyyyS] = dateStr.split("/");
  const [hhS, minS] = timeStr.split(":");

  const dd = Number(ddS);
  const mm = Number(mmS);
  const yyyy = Number(yyyyS);
  const hh12 = Number(hhS);
  const min = Number(minS);

  if (
    !Number.isFinite(dd) ||
    !Number.isFinite(mm) ||
    !Number.isFinite(yyyy) ||
    !Number.isFinite(hh12) ||
    !Number.isFinite(min)
  )
    return null;

  if (yyyyS.length !== 4) return null;
  if (dd < 1 || dd > 31) return null;
  if (mm < 1 || mm > 12) return null;
  if (min < 0 || min > 59) return null;

  const hh = to24h(hh12, mer);
  if (hh === null) return null;

  const d = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);

  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }

  return d;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
