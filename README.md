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

<!-- LIVE ACCESS SECTION -->
## 🌐 Live Access
The easiest way to view the project is via our hosted website:
https://hydro-scope.vercel.app/

<!-- SETUP INSTRUCTIONS -->
## ⚙️ Local Setup
To run this project locally, a local web server is required to allow D3.js to load the external CSV data files due to browser security (CORS) policies.

<!-- STEP 1: CLONING THE REPOSITORY -->
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/bdsimry/HydroScope.git
    ```

<!-- STEP 2: STARTING A LOCAL SERVER -->
2.  **Start a local server:**
    *   **Python:** Open your terminal in the project folder and run:
        ```bash
        python -m http.server 8000
        ```
    *   **VS Code:** Install the "Live Server" extension, then right-click `index.html` and select **"Open with Live Server"**.

<!-- STEP 3: ACCESSING THE SITE -->
3.  **Open in Browser:** 
    Navigate to `http://localhost:8000` or the address provided by your local server.
