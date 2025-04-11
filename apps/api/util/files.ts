import axios from "axios";
import AdmZip from "adm-zip";

export interface TranslationStrings {
  [key: string]: string;
}

/**
 * Downloads a JAR file from a URL and extracts it into memory.
 */
export default async function downloadJarAndExtractStrings(
  url: string,
): Promise<TranslationStrings | undefined> {
  try {
    console.log("Downloading " + url);
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const fileData = Buffer.from(response.data);
    const adm = new AdmZip(fileData);

    // TODO: Ignore assets/minecraft/**!
    const glob = /^assets\/[^\/]+\/lang\/en_us\.json$/;
    let translationStrings: TranslationStrings = {};

    adm.getEntries().forEach((entry) => {
      const path = entry.entryName;

      if (glob.test(path) && !path.startsWith("assets/minecraft/")) {
        const content = entry.getData().toString("utf8");
        const json = JSON.parse(content);

        const namespace = path.split("/")[1];
        for (const key in json) {
          translationStrings[`${namespace}:${key}`] = json[key];
        }
      }
    });

    return translationStrings;
  } catch (e) {
    console.error("Failed to download and extract strings from: " + url);
    return undefined;
  }
}
