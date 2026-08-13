ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;
--> statement-breakpoint
CREATE INDEX "idx_users_deleted_at" ON "user" USING btree ("deleted_at");
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "created_by_id" text;
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_api_keys_created_by" ON "api_keys" USING btree ("created_by_id");
