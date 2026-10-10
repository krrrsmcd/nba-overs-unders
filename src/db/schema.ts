import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export * from "./auth-schema";

const ts = (name: string) => timestamp(name, { withTimezone: true });

/** A league of 2, 3 or 5 players drafting all 30 teams. */
export const leagues = pgTable(
  "leagues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    size: integer("size").notNull(),
    // setup -> drafting -> complete
    status: text("status", { enum: ["setup", "drafting", "complete"] })
      .notNull()
      .default("setup"),
    orderMode: text("order_mode", { enum: ["random", "custom"] }),
    // Shared join link: /join/<inviteCode>
    inviteCode: text("invite_code").notNull().unique(),
    season: integer("season").notNull().default(2026),
    createdAt: ts("created_at").notNull().defaultNow(),
    draftStartedAt: ts("draft_started_at"),
  },
  (t) => [check("leagues_size_check", sql`${t.size} in (2, 3, 5)`)],
);

/** A signed-in user's team in a league. Created when they join via the league invite link. */
export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    teamName: text("team_name"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isCommissioner: boolean("is_commissioner").notNull().default(false),
    draftPosition: integer("draft_position"),
    firstSeenAt: ts("first_seen_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("players_league_position_unique").on(t.leagueId, t.draftPosition),
    unique("players_league_user_unique").on(t.leagueId, t.userId),
    index("players_league_idx").on(t.leagueId),
  ],
);

/** The 30 NBA teams, keyed by abbreviation. */
export const nbaTeams = pgTable("nba_teams", {
  id: text("id").primaryKey(),
  city: text("city").notNull(),
  name: text("name").notNull(),
  conference: text("conference", { enum: ["East", "West"] }).notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
});

/** One confirmed, final draft pick. */
export const picks = pgTable(
  "picks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    pickNumber: integer("pick_number").notNull(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    nbaTeamId: text("nba_team_id")
      .notNull()
      .references(() => nbaTeams.id),
    side: text("side", { enum: ["W", "L"] }).notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("picks_league_pick_unique").on(t.leagueId, t.pickNumber),
    unique("picks_league_team_unique").on(t.leagueId, t.nbaTeamId),
    check("picks_pick_number_check", sql`${t.pickNumber} between 1 and 30`),
  ],
);

/** NBA games synced from the external data source. */
export const games = pgTable(
  "games",
  {
    // "<source>:<source game id>", e.g. "bdl:18447073"
    id: text("id").primaryKey(),
    gameDate: date("game_date").notNull(), // US Eastern calendar date
    tipoffAt: ts("tipoff_at"),
    homeTeamId: text("home_team_id")
      .notNull()
      .references(() => nbaTeams.id),
    awayTeamId: text("away_team_id")
      .notNull()
      .references(() => nbaTeams.id),
    homeScore: integer("home_score").notNull().default(0),
    awayScore: integer("away_score").notNull().default(0),
    status: text("status", { enum: ["scheduled", "in_progress", "final", "postponed"] }).notNull(),
    postseason: boolean("postseason").notNull().default(false),
    // Only regular-season games count (excludes play-in, playoffs, NBA Cup final).
    counts: boolean("counts").notNull().default(true),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("games_date_idx").on(t.gameDate)],
);

/** Single-row table tracking score sync state; also used as the sync lock. */
export const syncState = pgTable("sync_state", {
  id: integer("id").primaryKey().default(1),
  lastSyncedAt: ts("last_synced_at"),
  lastCompleteDate: date("last_complete_date"),
  seasonOpenerAt: ts("season_opener_at"),
  lockedUntil: ts("locked_until"),
});
