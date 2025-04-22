CREATE TABLE "project_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL,
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
ALTER TABLE "project_reports" ADD CONSTRAINT "project_reports_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_reports" ADD CONSTRAINT "project_reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_reports" ADD CONSTRAINT "project_reports_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_reports_project_id_idx" ON "project_reports" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_reports_reporter_id_idx" ON "project_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "project_reports_status_idx" ON "project_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_reports_created_at_idx" ON "project_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "proposal_report_proposal_id_idx" ON "proposal_report" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "proposal_report_reporter_id_idx" ON "proposal_report" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "proposal_report_status_idx" ON "proposal_report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proposal_report_created_at_idx" ON "proposal_report" USING btree ("created_at");