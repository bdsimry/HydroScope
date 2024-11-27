d3.csv('water_stress.csv').then(function(data) {
    // Filter and process data
    data = data.filter(d => d.usage_to_abstractions_ratio && d.Country && d.Measure_group === "Total" && d.usage_to_abstractions_ratio <= 1);
    data.forEach(d => {
        d.usage_to_abstractions_ratio = +d.usage_to_abstractions_ratio;
        d.Year = +d.Year; // Ensure Year is treated as a number
    });

    // Get years and sort them
    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);

    // Set initial year to the maximum year (last value in the array)
    let currentYear = years[years.length - 1];

    // Set up chart dimensions and margins
    const margin = { top: 20, right: 50, bottom: 80, left: 120 };
    const width = 1500 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG container with viewBox and preserveAspectRatio
    const svg = d3.select("#top5Chart")
                    .append("svg")
                    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
                    .attr("preserveAspectRatio", "xMidYMid meet")
                    .append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const x = d3.scaleBand().range([0, width]).padding(0.2);
    const y = d3.scaleLinear().range([height, 0]);

    // Create tooltip for hover effects
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

        function updateChart(year) {
            // Filter data for the selected year
            const filteredData = data.filter(d => d.Year === year);
        
            // Find top 5 countries with the highest "Usage to Abstractions Ratio"
            const countryMaxUsage = {};
            filteredData.forEach(d => {
                if (!countryMaxUsage[d.Country] || d.usage_to_abstractions_ratio > countryMaxUsage[d.Country].usage_to_abstractions_ratio) {
                    countryMaxUsage[d.Country] = d;
                }
            });
        
            const topCountries = Object.values(countryMaxUsage);
            const top5 = topCountries.sort((a, b) => b.usage_to_abstractions_ratio - a.usage_to_abstractions_ratio)
                                     .slice(0, 5);
        
            // Update scales
            x.domain(top5.map(d => d.Country));
            y.domain([0, d3.max(top5, d => d.usage_to_abstractions_ratio)]).nice();
        
            // Remove any previous chart elements
            svg.selectAll("*").remove();
        
            // Find the country with the highest totalResources value
            const maxCountry = top5.reduce((prev, current) => (prev.usage_to_abstractions_ratio > current.usage_to_abstractions_ratio) ? prev : current);
        
            // Create bars with animation
            const bars = svg.selectAll(".bar")
                .data(top5)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.Country))
                .attr("y", height) // Set initial position to the bottom (height)
                .attr("width", x.bandwidth())
                .attr("height", 0) // Initial height set to 0
                .attr("fill", "#81AE9D")
                .on("mouseover", function(event, d) {
                    tooltip.transition().duration(200).style("opacity", 0.8);
                    tooltip.html(`${d.Country}: ${d.usage_to_abstractions_ratio.toFixed(2)}`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition().duration(500).style("opacity", 0);
                })
                .transition() // Add transition to animate bars
                .duration(1000) // Duration of the animation
                .attr("y", d => y(d.usage_to_abstractions_ratio)) // Animate to correct y position
                .attr("height", d => height - y(d.usage_to_abstractions_ratio)) // Animate to correct height
                .ease(d3.easeLinear);  // Smooth animation
        
            // Update the chart title
            d3.select("#chartTitle")
                .text(`Top 5 Countries by Water Stress Ratio in ${year}`);
        
            // Create labels with animation
            const labels = svg.selectAll(".label")
                .data(top5)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("x", d => x(d.Country) + x.bandwidth() / 2)
                .attr("y", height) // Set initial y position to the bottom (height)
                .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .text(d => "0") // Initial text value
                .transition() // Add transition to animate label text
                .duration(1000) // Match the bar animation duration
                .tween("text", function(d) {
                    const i = d3.interpolate(0, d.usage_to_abstractions_ratio);
                    return function(t) {
                        this.textContent = i(t).toFixed(2); // Increment the label value as the bar grows
                    };
                })
                .ease(d3.easeLinear)  // Smooth animation
                .attr("y", d => y(d.usage_to_abstractions_ratio) - 5); // Animate to the correct y position above the bar
        
            // Add x-axis
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "middle") // Align text in the center
                .style("font-size", "18px");
        
            // Add y-axis
            svg.append("g")
                .call(d3.axisLeft(y).ticks(6))
                .style("font-size", "18px");
        
            // Add x-axis label
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + 60)
                .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .text("Country");
        
            // Add y-axis label
            svg.append("text")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 30)
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .style("font-size", "18px")
                .text("Water Stress Ratio Ratio");
        }
        

    // Set the initial year to the last year (maximum)
    const initialYear = years[years.length - 1]; 
    updateChart(initialYear);

    // Slider setup
    const yearSlider = d3.select("#top5Slider")
        .attr("min", years[0]) // Set the slider min to the first year
        .attr("max", years[years.length - 1]) // Set the slider max to the last year
        .attr("value", initialYear); // Set the slider initial value to the last year

    d3.select("#top5Label").text(initialYear); // Set the label to show the initial year

    // Slider event listener to update the chart
    yearSlider.on("input", function() {
        const selectedYear = +this.value;
        d3.select("#top5Label").text(selectedYear); // Update the label for the selected year
        updateChart(selectedYear); // Update the chart based on the selected year
    });

}).catch(function(error) {
    console.error("Error loading or processing data:", error);
});

// d3.csv('water_stress.csv').then(function(data) {
//     // Filter and process data
//     data = data.filter(d => d.usage_to_abstractions_ratio && d.Country && d.Measure_group === "Total");
//     data.forEach(d => {
//         d.usage_to_abstractions_ratio = +d.usage_to_abstractions_ratio;
//         d.Year = +d.Year; // Ensure Year is treated as a number
//     });

//     // Get years and sort them
//     const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);

//     // Set initial year to the maximum year (last value in the array)
//     let currentYear = years[years.length - 1];

//     // Set up chart dimensions and margins
//     const margin = { top: 50, right: 40, bottom: 60, left: 100 };
//     const width = 1000 - margin.left - margin.right;
//     const height = 600 - margin.top - margin.bottom;

//     // Create SVG container for the donut chart
//     const svg = d3.select("#top5Chart")
//                     .append("svg")
//                     .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
//                     .attr("preserveAspectRatio", "xMidYMid meet")
//                     .append("g")
//                     .attr("transform", `translate(${width / 2}, ${height / 2})`); // Center the donut chart in the SVG

//     // Create color scale for slices
//     const color = d3.scaleOrdinal(d3.schemeCategory10);

//     // Create a legend container in HTML
//     const legendContainer = d3.select("#legendContainer");

//     // Function to update the donut chart
//     function updateChart(year) {
//         // Filter data for the selected year
//         const filteredData = data.filter(d => d.Year === year);

//         // Find top 5 countries with the highest "Usage to Abstractions Ratio"
//         const countryMaxUsage = {};
//         filteredData.forEach(d => {
//             if (!countryMaxUsage[d.Country] || d.usage_to_abstractions_ratio > countryMaxUsage[d.Country].usage_to_abstractions_ratio) {
//                 countryMaxUsage[d.Country] = d;
//             }
//         });

//         const topCountries = Object.values(countryMaxUsage);
//         const top5 = topCountries.sort((a, b) => b.usage_to_abstractions_ratio - a.usage_to_abstractions_ratio)
//                                  .slice(0, 5);

//         // Create a pie chart layout
//         const pie = d3.pie().value(d => d.usage_to_abstractions_ratio);

//         // Create arc generator
//         const arc = d3.arc()
//                       .innerRadius(100) // Inner radius for donut shape
//                       .outerRadius(200); // Outer radius for donut shape

//         // Remove any previous chart elements
//         svg.selectAll("*").remove();
//         legendContainer.html(""); // Clear the previous legend

//         // Create pie chart slices (donut chart)
//         const arcs = svg.selectAll(".arc")
//                         .data(pie(top5))
//                         .enter()
//                         .append("g")
//                         .attr("class", "arc");

//         // Draw the slices
//         arcs.append("path")
//             .attr("d", arc)
//             .attr("fill", d => color(d.data.Country))
//             .on("mouseover", function(event, d) {
//                 tooltip.transition().duration(200).style("opacity", 0.8);
//                 tooltip.html(`${d.data.Country}: ${d.data.usage_to_abstractions_ratio.toFixed(4)}`)
//                     .style("left", (event.pageX + 5) + "px")
//                     .style("top", (event.pageY - 28) + "px");
//             })
//             .on("mouseout", function() {
//                 tooltip.transition().duration(500).style("opacity", 0);
//             });

//         // Create the title inside the donut
//         svg.append("text")
//             .attr("x", 0)
//             .attr("y", 0)
//             .attr("text-anchor", "middle")
//             .style("font-size", "18px")
//             .style("font-weight", "bold")
//             .text(`Top 5 Countries by Usage to Abstractions Ratio in ${year}`);

//         // Add the percentage text in the middle (tooltips on hover)
//         arcs.append("text")
//             .attr("transform", function(d) { return `translate(${arc.centroid(d)})`; })
//             .attr("text-anchor", "middle")
//             .style("font-size", "12px")
//             .style("fill", "white")
//             .text(d => `${d.data.usage_to_abstractions_ratio.toFixed(4)}`);

//         // Create tooltip for hover effects
//         const tooltip = d3.select("body")
//                           .append("div")
//                           .attr("class", "tooltip")
//                           .style("opacity", 0);

//         // Update the legend for this year
//         top5.forEach(function(d, i) {
//             // Create legend items
//             const legendItem = legendContainer.append("div")
//                 .attr("class", "legend-item")
//                 .style("display", "flex")
//                 .style("align-items", "center");

//             // Create color box for the legend
//             legendItem.append("div")
//                 .attr("class", "legend-color-box")
//                 .style("width", "20px")
//                 .style("height", "20px")
//                 .style("background-color", color(d.Country))
//                 .style("margin-right", "8px");

//             // Append country name to the legend
//             legendItem.append("span")
//                 .text(d.Country)
//                 .style("font-size", "12px");
//         });
//     }

//     // Initial chart update
//     const initialYear = years[years.length - 1]; 
//     updateChart(initialYear);

//     // Slider setup
//     const yearSlider = d3.select("#top5Slider")
//         .attr("min", years[0]) // Set the slider min to the first year
//         .attr("max", years[years.length - 1]) // Set the slider max to the last year
//         .attr("value", initialYear); // Set the slider initial value to the last year

//     d3.select("#top5Label").text(initialYear); // Set the label to show the initial year

//     // Slider event listener to update the chart
//     yearSlider.on("input", function() {
//         const selectedYear = +this.value;
//         d3.select("#top5Label").text(selectedYear); // Update the label for the selected year
//         updateChart(selectedYear); // Update the chart based on the selected year
//     });

// }).catch(function(error) {
//     console.error("Error loading or processing data:", error);
// });
