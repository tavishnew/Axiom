CREATE INDEX IF NOT EXISTS "idx_sessions_token_expires_at" ON "session" USING btree ("token", "expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "session" USING btree ("user_id");