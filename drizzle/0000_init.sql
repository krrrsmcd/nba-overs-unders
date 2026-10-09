CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"game_date" date NOT NULL,
	"tipoff_at" timestamp with time zone,
	"home_team_id" text NOT NULL,
	"away_team_id" text NOT NULL,
	"home_score" integer DEFAULT 0 NOT NULL,
	"away_score" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"postseason" boolean DEFAULT false NOT NULL,
	"counts" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"status" text DEFAULT 'setup' NOT NULL,
	"order_mode" text,
	"season" integer DEFAULT 2026 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"draft_started_at" timestamp with time zone,
	CONSTRAINT "leagues_size_check" CHECK ("leagues"."size" in (2, 3, 5))
);
--> statement-breakpoint
CREATE TABLE "nba_teams" (
	"id" text PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"name" text NOT NULL,
	"conference" text NOT NULL,
	"primary_color" text NOT NULL,
	"secondary_color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "picks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"pick_number" integer NOT NULL,
	"player_id" uuid NOT NULL,
	"nba_team_id" text NOT NULL,
	"side" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "picks_league_pick_unique" UNIQUE("league_id","pick_number"),
	CONSTRAINT "picks_league_team_unique" UNIQUE("league_id","nba_team_id"),
	CONSTRAINT "picks_pick_number_check" CHECK ("picks"."pick_number" between 1 and 30)
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"team_name" text,
	"token_hash" text NOT NULL,
	"is_commissioner" boolean DEFAULT false NOT NULL,
	"draft_position" integer,
	"first_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "players_league_position_unique" UNIQUE("league_id","draft_position")
);
--> statement-breakpoint
CREATE TABLE "sync_state" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_complete_date" date,
	"season_opener_at" timestamp with time zone,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_home_team_id_nba_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."nba_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_away_team_id_nba_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."nba_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_nba_team_id_nba_teams_id_fk" FOREIGN KEY ("nba_team_id") REFERENCES "public"."nba_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "games_date_idx" ON "games" USING btree ("game_date");--> statement-breakpoint
CREATE INDEX "players_league_idx" ON "players" USING btree ("league_id");