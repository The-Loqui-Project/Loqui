ALTER TABLE "language" ALTER COLUMN "code" SET DATA TYPE varchar(7);--> statement-breakpoint
ALTER TABLE "language" ADD COLUMN "iso_code" varchar(10);--> statement-breakpoint
ALTER TABLE "language" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "language" ADD COLUMN "native_region" text;--> statement-breakpoint
ALTER TABLE "language" ADD COLUMN "note" text;