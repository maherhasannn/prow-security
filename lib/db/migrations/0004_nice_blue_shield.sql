DO $$ BEGIN
 CREATE TYPE "public"."company_size" AS ENUM('1', '2-10', '10-100', '100+');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "role_title" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "company_size" "company_size";