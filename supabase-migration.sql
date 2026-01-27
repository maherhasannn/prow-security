-- Migration: Add workspace mode and notes table
-- Run this in Supabase SQL Editor

-- Create workspace_mode enum
DO $$ BEGIN
 CREATE TYPE "public"."workspace_mode" AS ENUM('secure', 'internet-enabled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create workspace_note_type enum
DO $$ BEGIN
 CREATE TYPE "public"."workspace_note_type" AS ENUM('ai-generated', 'user-added');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add mode column to workspaces table
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "mode" "workspace_mode" DEFAULT 'secure' NOT NULL;

-- Create workspace_notes table
CREATE TABLE IF NOT EXISTS "workspace_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content" text NOT NULL,
	"type" "workspace_note_type" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "workspace_notes" ADD CONSTRAINT "workspace_notes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS "workspace_notes_workspace_id_idx" ON "workspace_notes" USING btree ("workspace_id");
