import pandas as pd
import json

# Load the CSV files
action_df = pd.read_csv('csv/Action.csv')
status_df = pd.read_csv('csv/Status.csv')
item_df = pd.read_csv('csv/Item.csv')

# Extract the first two columns and remove the first three rows
action_data = action_df.iloc[3:, :2]
status_data = status_df.iloc[3:, :2]
item_data = item_df.iloc[3:, :2]

# Rename columns for better JSON readability
action_data.columns = ['ID', 'Name']
status_data.columns = ['ID', 'Name']
item_data.columns = ['ID', 'Name']

# Convert to JSON format (array)
action_json = action_data.to_json(orient='records')
status_json = status_data.to_json(orient='records')
item_json = item_data.to_json(orient='records')

# Save JSON files
with open('json/Action.json', 'w') as action_file:
    json.dump(json.loads(action_json), action_file, indent=4)

with open('json/Status.json', 'w') as status_file:
    json.dump(json.loads(status_json), status_file, indent=4)

with open('json/Item.json', 'w') as status_file:
    json.dump(json.loads(item_json), status_file, indent=4)
