<!-- PROJECT LOGO / HEADER -->
# HydroScope: A Deep Dive into Europe's Water Dynamics

<!-- BADGES -->
![Language](https://img.shields.io/badge/Language-JavaScript%20%7C%20Python%20%7C%20HTML%20%7C%20CSS-blue)
![Library](https://img.shields.io/badge/Library-D3.js-orange)
[![Live Demo](https://img.shields.io/badge/Demo-Live%20Website-brightgreen)](https://hydro-scope.vercel.app/)

<!-- INTRODUCTION -->
## 🌊 Overview
**HydroScope** is an interactive data visualization platform designed to analyze water stress, usage patterns, and resource availability across Europe from 1990 to 2022. This project was developed for the **COS30045 Data Visualisation** coursework to help policymakers and environmentalists identify regional disparities and promote sustainable water management.

<!-- KEY FEATURES -->
## 🚀 Key Features
*   **Interactive Water Stress Map:** A choropleth map showing the usage-to-abstraction ratio. Hover for details and click on a country to trigger a **dynamic pie chart** breakdown.
*   **Multi-View Comparisons:** Toggle between **Stacked** and **Percent-Stacked** bar charts to analyze sectoral water usage and abstractions.
*   **Temporal Trends:** Interactive **Stacked Area** and **Line charts** that track Europe-wide resources and consumption over three decades.
*   **Dynamic UI Elements:** Includes a year slider (1990–2022), "Sort Descending" functionality, and category filters (Agriculture, Industry, Domestic, etc.).
*   **Responsive Animations:** Smooth transitions and ease-in effects implemented via D3.js for a premium user experience.

<!-- TECH STACK -->
## 🛠️ Tech Stack
<!-- FRONTEND -->
*   **Visualisation:** [D3.js v7](https://d3js.org/)
*   **Web:** HTML5, CSS3, JavaScript (ES6)
<!-- BACKEND / DATA -->
*   **Data Processing:** Python (Pandas & NumPy)
*   **Deployment:** Vercel

<!-- DATA SOURCE & PROCESSING -->
## 📊 Data Pipeline
The data is sourced from the **OECD (Organisation for Economic Co-operation and Development)**.

1.  **Cleaning:** Handled via Python scripts (`process_water_stress.py`, etc.) to remove irrelevant indicators and non-European entries.
2.  **Transformation:** Standardized units to cubic meters ($m^3$) and mapped 20+ specific OECD measures into 5 major categories.
3.  **Calculation:** Derived the **Water Stress Ratio** by dividing observed water usage by total water abstractions.

<!-- REPOSITORY STRUCTURE -->
## 📂 Project Structure
<!-- This section helps users navigate your files -->
```text
├── index.html              # Landing Page & Introduction
├── aboutus.html            # Team & Project Objectives
├── EuropeOverview.html     # Europe-wide trends (Area/Line charts)
├── combined_barcharts.html # Country comparisons (Stacked bars)
├── choropleth.html         # Geospatial Water Stress Map
├── style.css               # Custom styling and animations
├── *.js                    # D3.js visualization logic
├── /python                 # ETL scripts for data cleaning
└── /data                   # Processed CSVs and Europe GeoJSON

<!-- SETUP INSTRUCTIONS -->
🚀 Local Setup
To run this project locally, you need a local web server to allow D3 to load the CSV files (due to CORS policies).
Clone the repo:
code
Bash
git clone https://github.com/bdsimry/HydroScope.git
Start a local server:
If you have Python: python -m http.server 8000
If you have Live Server (VS Code): Click "Go Live".
Open in Browser: Navigate to http://localhost:8000
