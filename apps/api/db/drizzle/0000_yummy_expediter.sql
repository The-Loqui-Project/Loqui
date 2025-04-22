CREATE TYPE "public"."PROPOSAL_STATUS" AS ENUM('removed', 'inaccurate', 'pending', 'accurate');--> statement-breakpoint
CREATE TYPE "public"."REPORT_PRIORITY" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."REPORT_STATUS" AS ENUM('open', 'investigating', 'resolved', 'invalid');--> statement-breakpoint
CREATE TYPE "public"."USER_ROLE" AS ENUM('translator', 'approved', 'moderator', 'admin');--> statement-breakpoint
CREATE TABLE "approved_user_languages" (
	"user_id" varchar(255) NOT NULL,
	"language_code" varchar(10) NOT NULL,
	CONSTRAINT "approved_user_languages_user_id_language_code_pk" PRIMARY KEY("user_id","language_code")
);
--> statement-breakpoint
CREATE TABLE "item" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "language" (
	"code" varchar(10) NOT NULL,
	"name" text NOT NULL,
	"native_name" text NOT NULL,
	"suggestion_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "language_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"opt-in" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "proposal" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"note" text,
	"status" "PROPOSAL_STATUS" NOT NULL,
	"translation_id" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"approvals" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"reporter_id" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"priority" "REPORT_PRIORITY" DEFAULT 'medium' NOT NULL,
	"status" "REPORT_STATUS" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_by_id" varchar(255),
	"resolved_at" timestamp with time zone,
	"resolution_note" text
);
--> statement-breakpoint
CREATE TABLE "proposal_vote" (
	"proposal_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"is_upvote" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_vote_proposal_id_user_id_pk" PRIMARY KEY("proposal_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "translation" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"language_code" varchar(10) NOT NULL,
	"user_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"role" "USER_ROLE" DEFAULT 'translator' NOT NULL,
	"reputation" integer DEFAULT 1 NOT NULL,
	"banned" timestamp
);
--> statement-breakpoint
CREATE TABLE "version" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "version_to_item" (
	"version_id" varchar(255) NOT NULL,
	"item_id" integer NOT NULL,
	CONSTRAINT "version_to_item_version_id_item_id_pk" PRIMARY KEY("version_id","item_id")
);
--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_translation_id_translation_id_fk" FOREIGN KEY ("translation_id") REFERENCES "public"."translation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_report" ADD CONSTRAINT "proposal_report_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_report" ADD CONSTRAINT "proposal_report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_report" ADD CONSTRAINT "proposal_report_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_vote" ADD CONSTRAINT "proposal_vote_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_vote" ADD CONSTRAINT "proposal_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_language_code_language_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."language"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version" ADD CONSTRAINT "version_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;