import pandas as pd

# Load both datasets
freshwater_use = pd.read_csv(r"C:\xampp\htdocs\COS30045\COS30045_Data_Visualisation_Group_9_clone\freshwater_use.csv")
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

# ISO3 code mapping for European countries
country_iso3_mapping = {
    'Albania': 'ALB', 'Andorra': 'AND', 'Armenia': 'ARM', 'Austria': 'AUT', 'Azerbaijan': 'AZE', 'Belarus': 'BLR',
    'Belgium': 'BEL', 'Bosnia and Herzegovina': 'BIH', 'Bulgaria': 'BGR', 'Croatia': 'HRV', 'Cyprus': 'CYP',
    'Czech Republic': 'CZE', 'Denmark': 'DNK', 'Estonia': 'EST', 'Finland': 'FIN', 'France': 'FRA', 'Georgia': 'GEO',
    'Germany': 'DEU', 'Greece': 'GRC', 'Hungary': 'HUN', 'Iceland': 'ISL', 'Ireland': 'IRL', 'Italy': 'ITA',
    'Latvia': 'LVA', 'Liechtenstein': 'LIE', 'Lithuania': 'LTU', 'Luxembourg': 'LUX', 'Malta': 'MLT', 'Moldova': 'MDA',
    'Monaco': 'MCO', 'Montenegro': 'MNE', 'Netherlands': 'NLD', 'North Macedonia': 'MKD', 'Norway': 'NOR', 'Poland': 'POL',
    'Portugal': 'PRT', 'Romania': 'ROU', 'Russia': 'RUS', 'San Marino': 'SMR', 'Serbia': 'SRB', 'Slovakia': 'SVK',
    'Slovenia': 'SVN', 'Spain': 'ESP', 'Sweden': 'SWE', 'Switzerland': 'CHE', 'Ukraine': 'UKR', 'United Kingdom': 'GBR',
    'Vatican City': 'VAT'
}

# Rename columns in both datasets for consistency
freshwater_use.rename(columns={'Reference area': 'Country', 'TIME_PERIOD': 'Year', 'Measure': 'Measure_use', 'OBS_VALUE': 'OBS_VALUE_use'}, inplace=True)
freshwater_abstractions.rename(columns={'Reference area': 'Country', 'TIME_PERIOD': 'Year', 'Measure': 'Measure_abstractions', 'OBS_VALUE': 'OBS_VALUE_abstractions'}, inplace=True)

# Convert 'Year' column in both datasets to numeric, handling errors
freshwater_use['Year'] = pd.to_numeric(freshwater_use['Year'], errors='coerce')
freshwater_abstractions['Year'] = pd.to_numeric(freshwater_abstractions['Year'], errors='coerce')

# Filter out any data in freshwater_abstractions before 1990b
freshwater_abstractions = freshwater_abstractions[freshwater_abstractions['Year'] >= 1990]

# Keep only the necessary columns in both datasets
freshwater_use_filtered = freshwater_use[['Country', 'Year', 'OBS_VALUE_use', 'Measure_use']]
freshwater_abstractions_filtered = freshwater_abstractions[['Country', 'Year', 'OBS_VALUE_abstractions']]

# Aggregate OBS_VALUE_abstractions across all Measure_abstractions for each Country and Year
freshwater_abstractions_aggregated = freshwater_abstractions_filtered.groupby(['Country', 'Year'], as_index=False).agg({
    'OBS_VALUE_abstractions': 'sum'
})

# Merge datasets on 'Country' and 'Year' using the aggregated abstractions data
merged_data = pd.merge(
    freshwater_use_filtered,
    freshwater_abstractions_aggregated,
    on=['Country', 'Year'],  # Merge by Country and Year
    how='inner'  # Inner join to keep only matched records
)

# Filter the merged data for European countries
merged_european_data = merged_data[merged_data['Country'].isin(european_countries)]

# Create a mapping for Measure_use to group them into broader categories
measure_group_mapping = {
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

# Apply the mapping to create a new column 'Measure_group'
merged_european_data['Measure_group'] = merged_european_data['Measure_use'].map(measure_group_mapping)

# 1. Aggregate total OBS_VALUE_use across all Measure_group for each Country and Year
measure_group_data = merged_european_data.groupby(['Country', 'Year', 'Measure_group'], as_index=False).agg({
    'OBS_VALUE_use': 'sum'
})

# Calculate the ratio for each Measure_group
measure_group_data = pd.merge(
    measure_group_data,
    freshwater_abstractions_aggregated,
    on=['Country', 'Year'],
    how='inner'
)
measure_group_data['usage_to_abstractions_ratio'] = measure_group_data['OBS_VALUE_use'] / measure_group_data['OBS_VALUE_abstractions']

# 2. Calculate the total usage for each country and year across all Measure_groups
total_aggregated_use = merged_european_data.groupby(['Country', 'Year'], as_index=False).agg({
    'OBS_VALUE_use': 'sum'
})

# Merge with aggregated abstractions data to calculate the total ratio
total_aggregated_data = pd.merge(
    total_aggregated_use,
    freshwater_abstractions_aggregated,
    on=['Country', 'Year'],
    how='inner'
)

# Calculate the total ratio across all Measure_groups
total_aggregated_data['usage_to_abstractions_ratio'] = total_aggregated_data['OBS_VALUE_use'] / total_aggregated_data['OBS_VALUE_abstractions']

# Add 'Measure_group' as 'Total' to signify aggregated usage
total_aggregated_data['Measure_group'] = 'Total'

# Concatenate the measure group data with the total aggregated data
final_combined_data = pd.concat([measure_group_data, total_aggregated_data], ignore_index=True)

# Add ISO3 codes to the final_combined_data DataFrame
final_combined_data['ISO3'] = final_combined_data['Country'].map(country_iso3_mapping)

# Sort the final combined data by Country and Year in alphabetical order
final_combined_data = final_combined_data.sort_values(by=['Country', 'Year']).reset_index(drop=True)

# Display the final dataframe with grouped Measure_use
print(final_combined_data.head())

# Save the final dataframe to a new CSV file
final_combined_data.to_csv("water_stress.csv", index=False)