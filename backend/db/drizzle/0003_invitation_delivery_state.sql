DO $$ BEGIN
  CREATE TYPE "invitation_status" AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "invitation_delivery_status" AS ENUM ('pending', 'sent', 'failed', 'configuration_error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "invitations" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "role" text DEFAULT 'member' NOT NULL,
  "organization_id" text NOT NULL,
  "invited_by_id" text,
  "token_hash" text NOT NULL,
  "status" "invitation_status" DEFAULT 'pending' NOT NULL,
  "delivery_status" "invitation_delivery_status" DEFAULT 'pending' NOT NULL,
  "delivery_error" text,
  "provider_message_id" text,
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "accepted_by_id" text,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash")
);

ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "delivery_status" "invitation_delivery_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "delivery_error" text;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "provider_message_id" text;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "accepted_by_id" text;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp;

DO $$ BEGIN
  ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_user_id_fk"
    FOREIGN KEY ("invited_by_id") REFERENCES "user"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_id_user_id_fk"
    FOREIGN KEY ("accepted_by_id") REFERENCES "user"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "idx_invitations_org_email" ON "invitations" USING btree ("organization_id", "email");
CREATE INDEX IF NOT EXISTS "idx_invitations_token_hash" ON "invitations" USING btree ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_invitations_org_status" ON "invitations" USING btree ("organization_id", "status");
CREATE INDEX IF NOT EXISTS "idx_invitations_org_delivery" ON "invitations" USING btree ("organization_id", "delivery_status");
CREATE INDEX IF NOT EXISTS "idx_invitations_org_expires" ON "invitations" USING btree ("organization_id", "expires_at");
