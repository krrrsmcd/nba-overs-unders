ALTER TABLE "players" ADD COLUMN "token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_token_unique" UNIQUE("token");