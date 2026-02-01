DO $$ BEGIN
 CREATE TYPE "public"."work_product_type" AS ENUM('article', 'brief', 'memo', 'executive-summary', 'messaging-framework', 'decision-explanation');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"note_id" uuid,
	"title" text NOT NULL,
	"type" "work_product_type" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_notes" ADD COLUMN "title" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_products" ADD CONSTRAINT "work_products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_products" ADD CONSTRAINT "work_products_note_id_workspace_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."workspace_notes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_products" ADD CONSTRAINT "work_products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_products_workspace_id_idx" ON "work_products" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_products_note_id_idx" ON "work_products" USING btree ("note_id");