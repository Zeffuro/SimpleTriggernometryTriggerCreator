import pandas as pd
import json
import os

def process_folder(folder_name, prefix=""):
    files = ['Action', 'Status', 'Item']
    for f in files:
        path = f"{folder_name}/{f}.csv"
        if os.path.exists(path):
            df = pd.read_csv(path)
            data = df.iloc[3:, :2]
            data.columns = ['ID', 'Name']
            
            # Save as Action.json (Global) or TC_Action.json
            output_filename = f"json/{prefix}{f}.json"
            data.to_json(output_filename, orient='records', indent=4, force_ascii=False)
            print(f"Generated {output_filename}")

os.makedirs('json', exist_ok=True)

# Process Global (into standard names)
process_folder('csv', prefix="")
# Process TC (into TC_ prefixed names)
process_folder('tc', prefix="TC_")
