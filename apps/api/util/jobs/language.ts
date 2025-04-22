import axios from "axios";
import db from "../../db";
import { language } from "../../db/schema/schema";

type LanguageEntry = {
  iso_code: string;
  native: {
    name: string;
    region: string;
  };
  english: {
    name: string;
    region: string;
    override_name?: boolean;
    override_region?: boolean;
  };
  note?: string;
};

export async function updateLanguages(url: string) {
  console.log(`Fetching language data from ${url}...`);
  let data: Record<string, LanguageEntry>;
  try {
    const res = await axios.get<Record<string, LanguageEntry>>(url, {
      responseType: "json",
      timeout: 10_000,
    });
    data = res.data;
  } catch (err: any) {
    console.error(`Failed to fetch language data: ${err.message}`);
    return;
  }

  try {
    await db.transaction(async (tx) => {
      for (const [code, entry] of Object.entries(data)) {
        const record = {
          code,
          isoCode: entry.iso_code,
          name: entry.english.name,
          region: entry.english.region,
          nativeName: entry.native.name,
          nativeRegion: entry.native.region,
          note: entry.note ?? "",
        };

        console.log(`– Upserting ${code} (${record.name})`);
        await tx
          .insert(language)
          .values(record)
          .onConflictDoUpdate({
            target: language.code,
            set: {
              isoCode: record.isoCode,
              name: record.name,
              region: record.region,
              nativeName: record.nativeName,
              nativeRegion: record.nativeRegion,
              note: record.note,
            },
          });
      }
    });

    console.log("All languages upserted successfully.");
  } catch (err) {
    console.error("Transaction failed:", err);
  }
}
