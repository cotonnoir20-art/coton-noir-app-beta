/** Grille calendrier 7 colonnes — largeur fixe pour que flexWrap fonctionne aussi en PWA/web. */
export const CALENDAR_COLS = 7;
export const CALENDAR_CELL_MARGIN = 3;

export function getCalendarGridMetrics(innerWidth: number) {
  const cellSize = Math.floor(
    (innerWidth - CALENDAR_COLS * CALENDAR_CELL_MARGIN * 2) / CALENDAR_COLS,
  );
  const cellOuter = cellSize + CALENDAR_CELL_MARGIN * 2;
  const gridWidth = CALENDAR_COLS * cellOuter;
  return { cellSize, gridWidth, cellMargin: CALENDAR_CELL_MARGIN };
}

export const calendarCellStyle = {
  flexGrow: 0,
  flexShrink: 0,
} as const;
