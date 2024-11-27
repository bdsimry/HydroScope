d3.csv("resources_measure_data.csv").then(data => {
    // Parse and clean data
    data.forEach(d => {
        d.OBS_VALUE_resources = +d.OBS_VALUE_resources;
        d.Year = +d.Year;
    });

    // Get the years from the data
    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);

    // Set initial year to the maximum year (last year in the array)
    let currentYear = years[years.length - 1]; 
    let isDescending = false; // To track the sorting order

    // Set up chart dimensions and margins
    const margin = { top: 30, right: 40, bottom: 80, left: 120 },
            width = 1200 - margin.left - margin.right,
            height = 700 - margin.top - margin.bottom;

    // Create SVG container for the chart with viewBox and preserveAspectRatio
    const svg = d3.select("#waterResourcesChart")
                    .append("svg")
                    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
                    .attr("preserveAspectRatio", "xMidYMid meet")
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up scales
    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleBand().range([0, height]).padding(0.2);

    // Create tooltip for hover effects
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Define a common color for all bars and a highlight color for the highest value
    const commonColor = "#ADB9E3";  // Blue color for all bars
    const highlightColor = "#C52233"; // Red color for the highest bar

    function updateChart(year) {
        // Filter data for the selected year
        const filteredData = data.filter(d => d.Year === year);
        const countryData = d3.rollup(filteredData,
            v => d3.sum(v, d => d.OBS_VALUE_resources),
            d => d.Country
        );

        // Convert map data to an array for easier manipulation
        const chartData = Array.from(countryData, ([country, totalResources]) => ({ country, totalResources }));

        // Sort data in descending order if needed
        const sortedData = isDescending ? chartData.sort((a, b) => b.totalResources - a.totalResources) : chartData;

        // Add padding to the max value for better visualization
        const maxResourceValue = d3.max(sortedData, d => d.totalResources);
        x.domain([0, maxResourceValue * 1.1]); // Increase by 10% for padding

        // Set the y-axis domain based on the countries
        y.domain(sortedData.map(d => d.country));

        // Remove previous chart elements to refresh data
        svg.selectAll("*").remove();

        // Find the country with the highest totalResources value
        const maxCountry = sortedData.reduce((prev, current) => (prev.totalResources > current.totalResources) ? prev : current);

        // Create bars for the chart with animation
        const bars = svg.selectAll(".bar")
            .data(sortedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d.country))
            .attr("width", 0) // Initial width set to 0 for animation
            .attr("height", y.bandwidth())
            .attr("fill", d => d === maxCountry ? highlightColor : commonColor) // Highlight the highest bar
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", 0.8);

                // Display the country and the corresponding total resource value in m³
                tooltip.html(`${d.country}: ${d.totalResources.toFixed(2)} cubic meters`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .transition() // Add transition for animation
            .duration(500) // Duration of the animation
            .attr("width", d => x(d.totalResources)) // Animate width from 0 to the correct value
            .ease(d3.easeLinear); // Ease effect for smoother animation

        // Add text labels at the end of each bar with animation
        svg.selectAll(".label")
            .data(sortedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", 0) // Start at 0 (before the bar starts)
            .attr("y", d => y(d.country) + y.bandwidth() / 2 + 4) // Centered in the bar
            .text("0") // Start with 0
            .style("font-size", "16px")
            .style("fill", "#333")
            .transition() // Add transition for label animation
            .duration(500) // Duration of the animation
            .attr("x", d => x(d.totalResources) + 5) // Position slightly beyond the bar end as the bar grows
            .ease(d3.easeLinear)  // Smooth animation
            .tween("text", function(d) {
                const i = d3.interpolate(0, d.totalResources); // Interpolate from 0 to the final value
                return function(t) {
                    this.textContent = `${i(t).toFixed(2)} m³`; // Update text incrementally
                };
            });

        // Add x-axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(10).tickFormat(d => d.toFixed(2)))
            .style("font-size", "16px");

        // X-axis label
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 60) // Position below x-axis
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Volume of Water (m³)");

        // Add y-axis
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .style("font-size", "16px");

        // Y-axis label
        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", -100)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .style("font-size", "16px")
            .text("European Countries");


            // Update the chart title in the HTML
        d3.select("#ResourcechartTitle")
            .text(`Total Water Resources Available for Use in ${year}`);

    }

    // Initialize slider
    const slider = document.getElementById("year_Slider");
    const yearLabel = document.getElementById("ResourcesyearLabel");

    // Set the slider min, max, and initial value (maximum year)
    slider.min = Math.min(...years);
    slider.max = Math.max(...years);
    slider.value = years[years.length - 1]; // Set the slider value to the max year

    // Display the initial year in the label
    yearLabel.textContent = years[years.length - 1]; // Show the maximum year

    // Initial chart update
    updateChart(currentYear);

    // Slider event listener to update the chart
    d3.select("#year_Slider").on("input", function() {
        currentYear = +this.value; // Get the selected year from the slider
        d3.select("#ResourcesyearLabel").text(currentYear); // Update the label to show the selected year
        updateChart(currentYear); // Update the chart based on the selected year
    });

    // Event listener for the 'Sort Button'
    document.getElementById("sortResourcesButton").addEventListener("click", function() {
        isDescending = !isDescending; // Toggle sorting order
        this.classList.toggle("active", isDescending); // Toggle the active class on the button
        updateChart(currentYear); // Update the chart with the current sorting order
    });

    // Event listener for the 'Water Abstractions' button
    document.querySelector(".visualization-btn:nth-child(2)").addEventListener("click", function() {
        // Ensure the 'Water Abstractions' chart is displayed
        const chartContainer = document.getElementById('waterResourcesChart'); // or use your actual chart container ID
        chartContainer.style.display = 'block';  // Display the chart (if it's hidden initially)

        // Ensure the chart is updated with the correct year from the slider
        const currentYear = +document.querySelector("#year_Slider").value;  // Get current value from the slider

        // Trigger the chart update and animation for 'Water Abstractions'
        updateChart(currentYear);  // Update the chart dynamically with animation based on the current slider value
    });

});
