CREATE TYPE "public"."REPORT_PRIORITY" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."REPORT_STATUS" AS ENUM('open', 'investigating', 'resolved', 'invalid');--> statement-breakpoint
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
ALTER TABLE "proposal" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "proposal" ADD COLUMN "approvals" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "proposal_report" ADD CONSTRAINT "proposal_report_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_report" ADD CONSTRAINT "proposal_report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_report" ADD CONSTRAINT "proposal_report_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_vote" ADD CONSTRAINT "proposal_vote_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_vote" ADD CONSTRAINT "proposal_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;