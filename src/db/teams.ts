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
}

export const NBA_TEAMS: TeamSeed[] = [
  { id: "ATL", city: "Atlanta", name: "Hawks", conference: "East", primaryColor: "#E03A3E", secondaryColor: "#C1D32F" },
  { id: "BOS", city: "Boston", name: "Celtics", conference: "East", primaryColor: "#007A33", secondaryColor: "#BA9653" },
  { id: "BKN", city: "Brooklyn", name: "Nets", conference: "East", primaryColor: "#000000", secondaryColor: "#FFFFFF" },
  { id: "CHA", city: "Charlotte", name: "Hornets", conference: "East", primaryColor: "#1D1160", secondaryColor: "#00788C" },
  { id: "CHI", city: "Chicago", name: "Bulls", conference: "East", primaryColor: "#CE1141", secondaryColor: "#000000" },
  { id: "CLE", city: "Cleveland", name: "Cavaliers", conference: "East", primaryColor: "#860038", secondaryColor: "#FDBB30" },
  { id: "DAL", city: "Dallas", name: "Mavericks", conference: "West", primaryColor: "#00538C", secondaryColor: "#B8C4CA" },
  { id: "DEN", city: "Denver", name: "Nuggets", conference: "West", primaryColor: "#0E2240", secondaryColor: "#FEC524" },
  { id: "DET", city: "Detroit", name: "Pistons", conference: "East", primaryColor: "#C8102E", secondaryColor: "#1D42BA" },
  { id: "GSW", city: "Golden State", name: "Warriors", conference: "West", primaryColor: "#1D428A", secondaryColor: "#FFC72C" },
  { id: "HOU", city: "Houston", name: "Rockets", conference: "West", primaryColor: "#CE1141", secondaryColor: "#C4CED4" },
  { id: "IND", city: "Indiana", name: "Pacers", conference: "East", primaryColor: "#002D62", secondaryColor: "#FDBB30" },
  { id: "LAC", city: "LA", name: "Clippers", conference: "West", primaryColor: "#C8102E", secondaryColor: "#1D428A" },
  { id: "LAL", city: "Los Angeles", name: "Lakers", conference: "West", primaryColor: "#552583", secondaryColor: "#FDB927" },
  { id: "MEM", city: "Memphis", name: "Grizzlies", conference: "West", primaryColor: "#5D76A9", secondaryColor: "#12173F" },
  { id: "MIA", city: "Miami", name: "Heat", conference: "East", primaryColor: "#98002E", secondaryColor: "#F9A01B" },
  { id: "MIL", city: "Milwaukee", name: "Bucks", conference: "East", primaryColor: "#00471B", secondaryColor: "#EEE1C6" },
  { id: "MIN", city: "Minnesota", name: "Timberwolves", conference: "West", primaryColor: "#0C2340", secondaryColor: "#78BE20" },
  { id: "NOP", city: "New Orleans", name: "Pelicans", conference: "West", primaryColor: "#0C2340", secondaryColor: "#C8102E" },
  { id: "NYK", city: "New York", name: "Knicks", conference: "East", primaryColor: "#006BB6", secondaryColor: "#F58426" },
  { id: "OKC", city: "Oklahoma City", name: "Thunder", conference: "West", primaryColor: "#007AC1", secondaryColor: "#EF3B24" },
  { id: "ORL", city: "Orlando", name: "Magic", conference: "East", primaryColor: "#0077C0", secondaryColor: "#C4CED4" },
  { id: "PHI", city: "Philadelphia", name: "76ers", conference: "East", primaryColor: "#006BB6", secondaryColor: "#ED174C" },
  { id: "PHX", city: "Phoenix", name: "Suns", conference: "West", primaryColor: "#1D1160", secondaryColor: "#E56020" },
  { id: "POR", city: "Portland", name: "Trail Blazers", conference: "West", primaryColor: "#E03A3E", secondaryColor: "#000000" },
  { id: "SAC", city: "Sacramento", name: "Kings", conference: "West", primaryColor: "#5A2D81", secondaryColor: "#63727A" },
  { id: "SAS", city: "San Antonio", name: "Spurs", conference: "West", primaryColor: "#000000", secondaryColor: "#C4CED4" },
  { id: "TOR", city: "Toronto", name: "Raptors", conference: "East", primaryColor: "#CE1141", secondaryColor: "#000000" },
  { id: "UTA", city: "Utah", name: "Jazz", conference: "West", primaryColor: "#4B2A85", secondaryColor: "#FFFFFF" },
  { id: "WAS", city: "Washington", name: "Wizards", conference: "East", primaryColor: "#002B5C", secondaryColor: "#E31837" },
];
