import pandas as pd

# Load the CSV file
data = pd.read_csv('european_water_usage_vs_resources.csv')

# Get unique values from the 'Measure' column
unique_measures = data['Measure_group'].unique()

# Print the unique measure types
print(unique_measures)
