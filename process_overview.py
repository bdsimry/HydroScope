import pandas as pd

# File paths
abstraction_file = "abstractions_measure_data.csv"
resources_file = "resources_measure_data.csv"
usage_file = "usage_measure_group_data.csv"

# Load data from each CSV
abstraction_df = pd.read_csv(abstraction_file)
resources_df = pd.read_csv(resources_file)
usage_df = pd.read_csv(usage_file)

# Ensure all numerical columns are converted to numeric
abstraction_df['OBS_VALUE_abstraction'] = pd.to_numeric(abstraction_df['OBS_VALUE_abstraction'], errors='coerce')
resources_df['OBS_VALUE_resources'] = pd.to_numeric(resources_df['OBS_VALUE_resources'], errors='coerce')
usage_df['OBS_VALUE_use'] = pd.to_numeric(usage_df['OBS_VALUE_use'], errors='coerce')

# Aggregate the abstraction data by 'Measure_abstraction' and 'Year'
aggregated_abstraction = abstraction_df.groupby(['Measure_group', 'Year'], as_index=False).agg({
    'OBS_VALUE_abstraction': 'sum'
})

# Aggregate the resources data by 'Measure_resource' and 'Year'
aggregated_resources = resources_df.groupby(['Measure_resource', 'Year'], as_index=False).agg({
    'OBS_VALUE_resources': 'sum'
})

# Aggregate the usage data by 'Measure_use' and 'Year'
aggregated_usage = usage_df.groupby(['Measure_group', 'Year'], as_index=False).agg({
    'OBS_VALUE_use': 'sum'
})

# Save each aggregated DataFrame to a separate CSV file
abstraction_output_file = "europe_abstractions_aggregated.csv"
resources_output_file = "europe_resources_aggregated.csv"
usage_output_file = "europe_usage_aggregated.csv"

aggregated_abstraction.to_csv(abstraction_output_file, index=False)
aggregated_resources.to_csv(resources_output_file, index=False)
aggregated_usage.to_csv(usage_output_file, index=False)

# Display the first few rows of each aggregated DataFrame (optional)
print("Aggregated Abstraction Data:")
print(aggregated_abstraction.head())
print("\nAggregated Resources Data:")
print(aggregated_resources.head())
print("\nAggregated Usage Data:")
print(aggregated_usage.head())
