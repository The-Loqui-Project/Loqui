CREATE TABLE "string_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"string_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"moderator_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "string_reports" ADD CONSTRAINT "string_reports_string_id_item_id_fk" FOREIGN KEY ("string_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_reports" ADD CONSTRAINT "string_reports_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_reports" ADD CONSTRAINT "string_reports_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "string_reports_string_id_idx" ON "string_reports" USING btree ("string_id");--> statement-breakpoint
CREATE INDEX "string_reports_user_id_idx" ON "string_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "string_reports_status_idx" ON "string_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "string_reports_created_at_idx" ON "string_reports" USING btree ("created_at");