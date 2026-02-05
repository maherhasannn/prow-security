DO $$ BEGIN
 CREATE TYPE "public"."billing_interval" AS ENUM('monthly', 'yearly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_method_type" AS ENUM('credit_card', 'debit_card', 'ach');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_plan_type" AS ENUM('free', 'starter', 'professional', 'enterprise');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'paused');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "billing_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text DEFAULT 'US',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_customers_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid,
	"organization_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"raw_payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"billing_customer_id" uuid NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"elavon_token" text NOT NULL,
	"card_last4" text,
	"card_brand" text,
	"exp_month" integer,
	"exp_year" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid,
	"payment_method_id" uuid,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"elavon_transaction_id" text,
	"elavon_approval_code" text,
	"description" text,
	"failure_reason" text,
	"refunded_amount" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "subscription_plan_type" NOT NULL,
	"description" text,
	"price_monthly" integer NOT NULL,
	"price_yearly" integer NOT NULL,
	"max_seats" integer NOT NULL,
	"max_workspaces" integer NOT NULL,
	"max_documents" integer NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"billing_interval" "billing_interval" DEFAULT 'monthly' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"canceled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_billing_customer_id_billing_customers_id_fk" FOREIGN KEY ("billing_customer_id") REFERENCES "public"."billing_customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_customers_org_id_idx" ON "billing_customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_events_payment_id_idx" ON "payment_events" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_events_org_id_idx" ON "payment_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_events_event_type_idx" ON "payment_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_org_id_idx" ON "payment_methods" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_billing_customer_id_idx" ON "payment_methods" USING btree ("billing_customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_org_id_idx" ON "payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_subscription_id_idx" ON "payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_elavon_txn_idx" ON "payments" USING btree ("elavon_transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_org_id_idx" ON "subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_plan_id_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" USING btree ("status");