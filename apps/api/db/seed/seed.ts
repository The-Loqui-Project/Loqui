import { seedLanguages } from "./lang/seed-languages";

export async function seed() {
  await seedLanguages();
  console.log("Seed complete!");
}
