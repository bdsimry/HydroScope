import pandas as pd

# Load the datasets
freshwater_use = pd.read_csv(r"C:\xampp\htdocs\COS30045\COS30045_Data_Visualisation_Group_9_clone\freshwater_use.csv")
freshwater_resources = pd.read_csv(r"C:\xampp\htdocs\COS30045\COS30045_Data_Visualisation_Group_9_clone\freshwater_resources.csv")
freshwater_abstractions = pd.read_csv(r"C:\xampp\htdocs\COS30045\COS30045_Data_Visualisation_Group_9_clone\freshwater_abstractions.csv")

# List of European countries to filter for
european_countries = [
    'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium', 'Bosnia and Herzegovina',
    'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Georgia',
    'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania',
    'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway',
    'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
    'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'
]

# Filter data to include only from 1990 onwards
freshwater_resources = freshwater_resources[freshwater_resources['TIME_PERIOD'] >= 1990]
freshwater_abstractions = freshwater_abstractions[freshwater_abstractions['TIME_PERIOD'] >= 1990]

# Filter the datasets to keep only relevant columns
freshwater_use_filtered = freshwater_use[['Reference area', 'TIME_PERIOD', 'OBS_VALUE', 'Measure']]
freshwater_resources_filtered = freshwater_resources[['Reference area', 'TIME_PERIOD', 'OBS_VALUE', 'Measure']]
freshwater_abstractions_filtered = freshwater_abstractions[['Reference area', 'TIME_PERIOD', 'OBS_VALUE', 'Measure']]

# Rename columns to be consistent across the datasets
freshwater_use_filtered.rename(columns={'Reference area': 'Country', 'TIME_PERIOD': 'Year', 'OBS_VALUE': 'OBS_VALUE_use', 'Measure': 'Measure_use'}, inplace=True)
freshwater_resources_filtered.rename(columns={'Reference area': 'Country', 'TIME_PERIOD': 'Year', 'OBS_VALUE': 'OBS_VALUE_resources', 'Measure': 'Measure_resource'}, inplace=True)
freshwater_abstractions_filtered.rename(columns={'Reference area': 'Country', 'TIME_PERIOD': 'Year', 'OBS_VALUE': 'OBS_VALUE_abstraction', 'Measure': 'Measure_abstraction'}, inplace=True)

# Filter for European countries in each dataset
freshwater_use_filtered = freshwater_use_filtered[freshwater_use_filtered['Country'].isin(european_countries)]
freshwater_resources_filtered = freshwater_resources_filtered[freshwater_resources_filtered['Country'].isin(european_countries)]
freshwater_abstractions_filtered = freshwater_abstractions_filtered[freshwater_abstractions_filtered['Country'].isin(european_countries)]

# Group similar categories for 'Measure_use' based on your original mapping
measure_use_mapping = {
    'Mining and quarrying': 'Industry',
    'Industrial activities': 'Industry',
    'Industry and construction': 'Industry',
    'Agriculture, forestry, fishing': 'Agriculture',
    'Services': 'Services',
    'Total manufacturing': 'Industry',
    'Chemicals, refined petroleum etc': 'Industry',
    'Public water supply': 'Domestic/Public Use',
    'Basic metals': 'Industry',
    'Textile': 'Industry',
    'Electricity production': 'Energy Production',
    'Households': 'Domestic/Public Use',
    'Other manufacturing industries': 'Industry',
    'Transport vehicles and equipment': 'Industry',
    'Food processing industry': 'Industry',
    'Construction': 'Industry',
    'Paper products': 'Industry'
}

# Apply the mapping to 'freshwater_use_filtered'
freshwater_use_filtered['Measure_group'] = freshwater_use_filtered['Measure_use'].map(measure_use_mapping)

# Aggregate data for 'freshwater_use_filtered' by 'Country', 'Year', and 'Measure_group'
measure_group_data = freshwater_use_filtered.groupby(['Country', 'Year', 'Measure_group'], as_index=False).agg({
    'OBS_VALUE_use': 'sum'
})

# Aggregate data for resources and abstractions by 'Country', 'Year', and 'Measure'
resources_measure_data = freshwater_resources_filtered.groupby(['Country', 'Year', 'Measure_resource'], as_index=False).agg({
    'OBS_VALUE_resources': 'sum'
})

# Group similar categories for 'Measure_abstraction' based on new mapping
measure_abstraction_mapping = {
    'Agriculture, forestry, fishing': 'Agriculture & Fisheries',
    'Aquaculture': 'Agriculture & Fisheries',
    'Irrigation': 'Agriculture & Fisheries',
    'Manufacturing industry': 'Industry & Manufacturing',
    'Mining and quarrying': 'Industry & Manufacturing',
    'Construction': 'Industry & Manufacturing',
    'Private households': 'Domestic & Public Use',
    'Public water supply': 'Domestic & Public Use',
    'Services': 'Services'
}

# Apply the mapping to 'freshwater_abstractions_filtered'
freshwater_abstractions_filtered['Measure_group'] = freshwater_abstractions_filtered['Measure_abstraction'].map(measure_abstraction_mapping)

# Aggregate data for 'freshwater_abstractions_filtered' by 'Country', 'Year', and 'Measure_group'
abstractions_grouped_data = freshwater_abstractions_filtered.groupby(['Country', 'Year', 'Measure_group'], as_index=False).agg({
    'OBS_VALUE_abstraction': 'sum'
})

# Save the aggregated data to CSV files
measure_group_data.to_csv(r"C:\xampp\htdocs\COS30045\COS30045_Data_Visualisation_Group_9_clone\usage_measure_group_data.csv", index=False)
resources_measure_data.to_csv(r"C:\xampp\htdocs\COS30045\COS30045_Data_Visualisation_Group_9_clone\resources_measure_data.csv", index=False)
abstractions_grouped_data.to_csv(r"C:\xampp\htdocs\COS30045\COS30045_Data_Visualisation_Group_9_clone\abstractions_measure_data.csv", index=False)

# Print a message confirming the export
print("CSV files with grouped data have been saved successfully.")
