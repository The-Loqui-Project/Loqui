import { generateResourcePack } from "./translation-packs";

/**
 * Test file for resource pack generation
 * Run with: npx ts-node ./util/jobs/test-resource-pack.ts
 */
async function testResourcePackGeneration() {
  console.log("Testing resource pack generation...");

  // Mock project ID
  const projectId = "test-project";

  // Mock version IDs
  const versionIds = ["test-version-1", "test-version-2"];

  // Mock translation data
  // Format: { "lang-code": { "key": "translation value", ... }, ... }
  const translationFiles = {
    en_us: {
      "minecraft:block.stone": "Stone",
      "minecraft:block.dirt": "Dirt",
      "mymod:item.special_sword": "Special Sword",
    },
    fr_fr: {
      "minecraft:block.stone": "Pierre",
      "minecraft:block.dirt": "Terre",
      "mymod:item.special_sword": "Épée Spéciale",
    },
    es_es: {
      "minecraft:block.stone": "Piedra",
      "minecraft:block.dirt": "Tierra",
      "mymod:item.special_sword": "Espada Especial",
    },
  };

  try {
    const packPath = await generateResourcePack(
      projectId,
      versionIds,
      translationFiles,
    );
    console.log("Resource pack generated successfully at:", packPath);
  } catch (error) {
    console.error("Error generating resource pack:", error);
  }
}

// Run the test
testResourcePackGeneration().catch(console.error);
