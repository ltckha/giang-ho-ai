export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;
export const HOURS_PER_WEEK = HOURS_PER_DAY * DAYS_PER_WEEK; // 168 giờ trong game = 1 tuần

export const WORLD_TICK_HOURS = 6; // Mỗi 6 giờ trong game các bang hội AI ra 1 quyết định
export const SIEGE_DAY_OF_WEEK = 7; // Ngày thứ 7 hằng tuần là ngày Công Thành
export const SIEGE_START_HOUR = 18;
export const SIEGE_RESOLVE_HOUR = 20;
export const SIEGE_END_HOUR = 22;

export interface WorldClockView {
  totalHours: number;
  week: number;
  dayOfWeek: number; // 1..7
  hourOfDay: number; // 0..23
  isSiegeWindow: boolean;
  hoursUntilNextSiege: number;
}

export interface ClockAdvanceResult {
  prevHours: number;
  nextHours: number;
  tickHoursReached: number[];
  siegeWeeksTriggered: number[];
}

export function decomposeWorldClock(totalHours: number): WorldClockView {
  const safeHours = Math.max(0, Math.floor(totalHours));
  const week = Math.floor(safeHours / HOURS_PER_WEEK) + 1;
  const hourInWeek = safeHours % HOURS_PER_WEEK;
  const dayOfWeek = Math.floor(hourInWeek / HOURS_PER_DAY) + 1;
  const hourOfDay = hourInWeek % HOURS_PER_DAY;
  const isSiegeWindow =
    dayOfWeek === SIEGE_DAY_OF_WEEK &&
    hourOfDay >= SIEGE_START_HOUR &&
    hourOfDay < SIEGE_END_HOUR;

  const siegeStartInWeek = (SIEGE_DAY_OF_WEEK - 1) * HOURS_PER_DAY + SIEGE_START_HOUR;
  let hoursUntilNextSiege = siegeStartInWeek - hourInWeek;
  if (hoursUntilNextSiege < 0) {
    hoursUntilNextSiege += HOURS_PER_WEEK;
  }
  if (isSiegeWindow) {
    hoursUntilNextSiege = 0;
  }

  return {
    totalHours: safeHours,
    week,
    dayOfWeek,
    hourOfDay,
    isSiegeWindow,
    hoursUntilNextSiege,
  };
}

/**
 * Tiến đồng hồ thế giới thêm `deltaHours` và liệt kê các mốc 6 giờ (tick bang hội)
 * cũng như các mốc Công Thành hằng tuần (Ngày 7, 20:00) đã đi qua.
 */
export function advanceWorldClock(totalHours: number, deltaHours: number): ClockAdvanceResult {
  const prevHours = Math.max(0, Math.floor(totalHours));
  const safeDelta = Math.max(0, Math.floor(deltaHours));
  const nextHours = prevHours + safeDelta;

  const tickHoursReached: number[] = [];
  const firstTick = Math.floor(prevHours / WORLD_TICK_HOURS) * WORLD_TICK_HOURS + WORLD_TICK_HOURS;
  for (let h = firstTick; h <= nextHours; h += WORLD_TICK_HOURS) {
    tickHoursReached.push(h);
  }

  const siegeWeeksTriggered: number[] = [];
  const siegeOffsetInWeek = (SIEGE_DAY_OF_WEEK - 1) * HOURS_PER_DAY + SIEGE_RESOLVE_HOUR;
  const startWeek = Math.floor(prevHours / HOURS_PER_WEEK) + 1;
  const endWeek = Math.floor(nextHours / HOURS_PER_WEEK) + 1;
  for (let w = startWeek; w <= endWeek; w++) {
    const siegeHour = (w - 1) * HOURS_PER_WEEK + siegeOffsetInWeek;
    if (siegeHour > prevHours && siegeHour <= nextHours) {
      siegeWeeksTriggered.push(w);
    }
  }

  return {
    prevHours,
    nextHours,
    tickHoursReached,
    siegeWeeksTriggered,
  };
}
