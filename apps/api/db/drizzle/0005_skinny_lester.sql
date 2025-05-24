CREATE TABLE "translation_pack" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL,
	"modrinth_pack_id" varchar(255),
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "version_translation_pack_status" (
	"version_id" varchar(255) NOT NULL,
	"language_code" varchar(10) NOT NULL,
	"needs_release" boolean DEFAULT true NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "version_translation_pack_status_version_id_language_code_pk" PRIMARY KEY("version_id","language_code")
);
--> statement-breakpoint
ALTER TABLE "translation_pack" ADD CONSTRAINT "translation_pack_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_translation_pack_status" ADD CONSTRAINT "version_translation_pack_status_version_id_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_translation_pack_status" ADD CONSTRAINT "version_translation_pack_status_language_code_language_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;