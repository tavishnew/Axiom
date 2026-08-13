CREATE TABLE "audit_logs" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" text NOT NULL,
  "actor_id" text NOT NULL,
  "action" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_audit_logs_organization_created_at" ON "audit_logs" USING btree ("organization_id","created_at" DESC NULLS LAST);
--> statement-breakpoint
CREATE INDEX "idx_audit_logs_organization_action" ON "audit_logs" USING btree ("organization_id","action");
--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor_created_at" ON "audit_logs" USING btree ("actor_id","created_at" DESC NULLS LAST);
--> statement-breakpoint
CREATE INDEX "idx_audit_logs_target" ON "audit_logs" USING btree ("organization_id","target_type","target_id");
