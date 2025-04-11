import db from "../../index";
import { language } from "../../schema/schema";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedLanguages() {
  try {
    // Read data from the data.json file
    const dataPath = path.resolve(__dirname, "data/data.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const languages = JSON.parse(rawData);

    // Insert each language from the JSON data into the database
    for (const lang of languages) {
      console.log(
        `Seeding language: ${lang.name}, ${lang.native_name}, ${lang.code}`,
      );
      await db.insert(language).values({
        code: lang.code,
        name: lang.name,
        nativeName: lang.native_name,
      });
    }

    console.log("Languages seeded successfully!");
  } catch (error) {
    console.error("Error seeding languages:", error);
  }
}
