ALTER TABLE "string_reports" RENAME COLUMN "user_id" TO "reporter_id";--> statement-breakpoint
ALTER TABLE "string_reports" RENAME COLUMN "resolved_by" TO "resolved_by_id";--> statement-breakpoint
ALTER TABLE "string_reports" RENAME COLUMN "moderator_notes" TO "resolution_note";--> statement-breakpoint
ALTER TABLE "string_reports" DROP CONSTRAINT "string_reports_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "string_reports" DROP CONSTRAINT "string_reports_resolved_by_user_id_fk";
--> statement-breakpoint
DROP INDEX "string_reports_user_id_idx";--> statement-breakpoint
ALTER TABLE "string_reports" ALTER COLUMN "status" SET DATA TYPE REPORT_STATUS;--> statement-breakpoint
ALTER TABLE "string_reports" ALTER COLUMN "status" SET DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "string_reports" ADD COLUMN "priority" "REPORT_PRIORITY" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "string_reports" ADD CONSTRAINT "string_reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_reports" ADD CONSTRAINT "string_reports_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "string_reports_reporter_id_idx" ON "string_reports" USING btree ("reporter_id");--> statement-breakpoint
ALTER TABLE "string_reports" DROP COLUMN "updated_at";