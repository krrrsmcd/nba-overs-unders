// The 30 NBA teams. `id` is the standard 3-letter abbreviation and is the
// natural key used everywhere in the app. Colors are plain hex values used to
// style team tiles (no logos).

export type Conference = "East" | "West";

export interface TeamSeed {
  id: string;
  city: string;
  name: string;
  conference: Conference;
  primaryColor: string;
  secondaryColor: string;
  /** Preseason sportsbook win totals (see WIN_TOTAL_SOURCES). */
  winTotals: Record<WinTotalBook, number>;
}

export type WinTotalBook = "betmgm" | "fanduel" | "caesars";

/** Where each book's line came from. BetMGM is the one shown on draft cards. */
export const WIN_TOTAL_SOURCES: { book: WinTotalBook; name: string; asOf: string; url: string }[] = [
  {
    book: "betmgm",
    name: "BetMGM",
    asOf: "Oct 7, 2026",
    url: "https://sports.betmgm.com/en/blog/nba/nba-odds-predictions-season-win-totals-bm23/",
  },
  {
    book: "fanduel",
    name: "FanDuel",
    asOf: "Oct 5, 2026",
    url: "https://github.com/Jsachse24/nba-win-totals",
  },
  {
    book: "caesars",
    name: "Caesars",
    asOf: "Oct 5, 2026",
    url: "https://github.com/Jsachse24/nba-win-totals",
  },
];

export const GAMES_PER_TEAM = 82;

export const NBA_TEAMS: TeamSeed[] = [
  { id: "ATL", city: "Atlanta", name: "Hawks", conference: "East", primaryColor: "#E03A3E", secondaryColor: "#C1D32F", winTotals: { betmgm: 43.5, fanduel: 43.5, caesars: 43.5 } },
  { id: "BOS", city: "Boston", name: "Celtics", conference: "East", primaryColor: "#007A33", secondaryColor: "#BA9653", winTotals: { betmgm: 51.5, fanduel: 50.5, caesars: 50.5 } },
  { id: "BKN", city: "Brooklyn", name: "Nets", conference: "East", primaryColor: "#000000", secondaryColor: "#FFFFFF", winTotals: { betmgm: 24.5, fanduel: 24.5, caesars: 24.5 } },
  { id: "CHA", city: "Charlotte", name: "Hornets", conference: "East", primaryColor: "#1D1160", secondaryColor: "#00788C", winTotals: { betmgm: 39.5, fanduel: 38.5, caesars: 39.5 } },
  { id: "CHI", city: "Chicago", name: "Bulls", conference: "East", primaryColor: "#CE1141", secondaryColor: "#000000", winTotals: { betmgm: 29.5, fanduel: 29.5, caesars: 29.5 } },
  { id: "CLE", city: "Cleveland", name: "Cavaliers", conference: "East", primaryColor: "#860038", secondaryColor: "#FDBB30", winTotals: { betmgm: 47.5, fanduel: 48.5, caesars: 48.5 } },
  { id: "DAL", city: "Dallas", name: "Mavericks", conference: "West", primaryColor: "#00538C", secondaryColor: "#B8C4CA", winTotals: { betmgm: 34.5, fanduel: 33.5, caesars: 33.5 } },
  { id: "DEN", city: "Denver", name: "Nuggets", conference: "West", primaryColor: "#0E2240", secondaryColor: "#FEC524", winTotals: { betmgm: 49.5, fanduel: 47.5, caesars: 48.5 } },
  { id: "DET", city: "Detroit", name: "Pistons", conference: "East", primaryColor: "#C8102E", secondaryColor: "#1D42BA", winTotals: { betmgm: 49.5, fanduel: 48.5, caesars: 49.5 } },
  { id: "GSW", city: "Golden State", name: "Warriors", conference: "West", primaryColor: "#1D428A", secondaryColor: "#FFC72C", winTotals: { betmgm: 40.5, fanduel: 37.5, caesars: 37.5 } },
  { id: "HOU", city: "Houston", name: "Rockets", conference: "West", primaryColor: "#CE1141", secondaryColor: "#C4CED4", winTotals: { betmgm: 47.5, fanduel: 47.5, caesars: 48.5 } },
  { id: "IND", city: "Indiana", name: "Pacers", conference: "East", primaryColor: "#002D62", secondaryColor: "#FDBB30", winTotals: { betmgm: 43.5, fanduel: 43.5, caesars: 43.5 } },
  { id: "LAC", city: "LA", name: "Clippers", conference: "West", primaryColor: "#C8102E", secondaryColor: "#1D428A", winTotals: { betmgm: 28.5, fanduel: 28.5, caesars: 28.5 } },
  { id: "LAL", city: "Los Angeles", name: "Lakers", conference: "West", primaryColor: "#552583", secondaryColor: "#FDB927", winTotals: { betmgm: 46.5, fanduel: 44.5, caesars: 45.5 } },
  { id: "MEM", city: "Memphis", name: "Grizzlies", conference: "West", primaryColor: "#5D76A9", secondaryColor: "#12173F", winTotals: { betmgm: 29.5, fanduel: 29.5, caesars: 29.5 } },
  { id: "MIA", city: "Miami", name: "Heat", conference: "East", primaryColor: "#98002E", secondaryColor: "#F9A01B", winTotals: { betmgm: 46.5, fanduel: 45.5, caesars: 46.5 } },
  { id: "MIL", city: "Milwaukee", name: "Bucks", conference: "East", primaryColor: "#00471B", secondaryColor: "#EEE1C6", winTotals: { betmgm: 25.5, fanduel: 25.5, caesars: 26.5 } },
  { id: "MIN", city: "Minnesota", name: "Timberwolves", conference: "West", primaryColor: "#0C2340", secondaryColor: "#78BE20", winTotals: { betmgm: 48.5, fanduel: 47.5, caesars: 49.5 } },
  { id: "NOP", city: "New Orleans", name: "Pelicans", conference: "West", primaryColor: "#0C2340", secondaryColor: "#C8102E", winTotals: { betmgm: 27.5, fanduel: 28.5, caesars: 29.5 } },
  { id: "NYK", city: "New York", name: "Knicks", conference: "East", primaryColor: "#006BB6", secondaryColor: "#F58426", winTotals: { betmgm: 52.5, fanduel: 51.5, caesars: 51.5 } },
  { id: "OKC", city: "Oklahoma City", name: "Thunder", conference: "West", primaryColor: "#007AC1", secondaryColor: "#EF3B24", winTotals: { betmgm: 62.5, fanduel: 61.5, caesars: 61.5 } },
  { id: "ORL", city: "Orlando", name: "Magic", conference: "East", primaryColor: "#0077C0", secondaryColor: "#C4CED4", winTotals: { betmgm: 43.5, fanduel: 43.5, caesars: 43.5 } },
  { id: "PHI", city: "Philadelphia", name: "76ers", conference: "East", primaryColor: "#006BB6", secondaryColor: "#ED174C", winTotals: { betmgm: 50.5, fanduel: 50.5, caesars: 50.5 } },
  { id: "PHX", city: "Phoenix", name: "Suns", conference: "West", primaryColor: "#1D1160", secondaryColor: "#E56020", winTotals: { betmgm: 40.5, fanduel: 39.5, caesars: 39.5 } },
  { id: "POR", city: "Portland", name: "Trail Blazers", conference: "West", primaryColor: "#E03A3E", secondaryColor: "#000000", winTotals: { betmgm: 42.5, fanduel: 41.5, caesars: 41.5 } },
  { id: "SAC", city: "Sacramento", name: "Kings", conference: "West", primaryColor: "#5A2D81", secondaryColor: "#63727A", winTotals: { betmgm: 21.5, fanduel: 20.5, caesars: 21.5 } },
  { id: "SAS", city: "San Antonio", name: "Spurs", conference: "West", primaryColor: "#000000", secondaryColor: "#C4CED4", winTotals: { betmgm: 59.5, fanduel: 60.5, caesars: 60.5 } },
  { id: "TOR", city: "Toronto", name: "Raptors", conference: "East", primaryColor: "#CE1141", secondaryColor: "#000000", winTotals: { betmgm: 46.5, fanduel: 46.5, caesars: 46.5 } },
  { id: "UTA", city: "Utah", name: "Jazz", conference: "West", primaryColor: "#4B2A85", secondaryColor: "#FFFFFF", winTotals: { betmgm: 37.5, fanduel: 37.5, caesars: 38.5 } },
  { id: "WAS", city: "Washington", name: "Wizards", conference: "East", primaryColor: "#002B5C", secondaryColor: "#E31837", winTotals: { betmgm: 34.5, fanduel: 33.5, caesars: 35.5 } },
];
