import json
import re
from traceback import print_exc

# Column definitions
COLUMNS_DEFINITIONS = ["nr_je", "nr_be", "native_name", "name", "code", "iso639-3_code", "official_language_in",
                       "added_je", "added_be"]

try:
    with open("seeding-data-input.txt", "r", encoding="utf-8") as f:
        rows = f.readlines()  # Read lines into a list
except Exception as e:
    print(f"Error reading file seeding-data-input.txt: {e}")
    print_exc()
    exit(1)

processed_rows = []

for i, row in enumerate(rows):
    row = row.strip()  # Strip leading/trailing whitespaces (including newlines)
    print(f"Row {i + 1}: {row}")

    columns = row.split('\t')  # Split by tabs
    if len(columns) >= len(COLUMNS_DEFINITIONS):
        columns = columns[:len(COLUMNS_DEFINITIONS)]
        row_dict = dict(zip(COLUMNS_DEFINITIONS, columns))

        # Remove content in parentheses and strip whitespace from 'native_name'
        if "native_name" in row_dict:
            row_dict["native_name"] = re.sub(r"\(.*?\)", "", row_dict["native_name"]).strip()

        # Discard unneeded columns
        for column in ["added_je", "added_be", "official_language_in", "nr_je", "nr_be", "iso639-3_code"]:
            if column in row_dict:
                del row_dict[column]

        processed_rows.append(row_dict)
    else:
        print(f"Skipping row {i + 1} due to incorrect format: {row}")

# Save as JSON
output_file = "data.json"
try:
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(processed_rows, f, indent=4, ensure_ascii=False)
    print(f"Data successfully saved to {output_file}")
except Exception as e:
    print(f"Error saving file {output_file}: {e}")
    print_exc()
