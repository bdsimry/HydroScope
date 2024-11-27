d3.csv("abstractions_measure_data.csv").then(data => {
    data.forEach(d => {
        d.OBS_VALUE_abstraction = +d.OBS_VALUE_abstraction;
        d.Year = +d.Year;
    });

    data = data.filter(d => d.Year >= 1990 && d.Measure_group !== "Total");
    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);

    const margin = { top: 30, right: 80, bottom: 80, left: 120 },
            width = 1200 - margin.left - margin.right,
            height = 700 - margin.top - margin.bottom;

    const svg = d3.select("#waterAbstractionChart")
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const customColors = ["#26547C", "#EF476F", "#45B69C", "#88498F"];
    const measureGroups = [...new Set(data.map(d => d.Measure_group))]; // Get unique measure groups
    const color = d3.scaleOrdinal()
        .domain(measureGroups)
        .range(customColors);

    const y = d3.scaleBand().range([0, height]).padding(0.2);
    const x = d3.scaleLinear().range([0, width]);

    const tooltip = d3.select("body")
                        .append("div")
                        .attr("class", "tooltip");

    let isPercentStacked = false;
    let activeGroups = new Set(measureGroups); // Track active Measure_groups
    let isDescending = false; // Track sorting order

    // Modify the updateChart function to include bar animations
    function updateChart(year) {
        const filteredData = data.filter(d => d.Year === year && activeGroups.has(d.Measure_group));
        const groupedData = d3.groups(filteredData, d => d.Country, d => d.Measure_group);

        const maxCumulativeValue = d3.max(
            groupedData.map(([country, values]) => {
                return d3.sum(values.map(([_, records]) => records[0].OBS_VALUE_abstraction));
            })
        );

        // Sort data if descending order is enabled
        const sortedData = isDescending
        ? groupedData.sort((a, b) => {
            const totalA = d3.sum(a[1].map(([_, records]) => records[0].OBS_VALUE_abstraction));
            const totalB = d3.sum(b[1].map(([_, records]) => records[0].OBS_VALUE_abstraction));
            return totalB - totalA;
        })
        : groupedData;

        const sortedCountries = sortedData.map(([country]) => country);
    
        y.domain(sortedCountries);
        x.domain([0, isPercentStacked ? 100 : maxCumulativeValue]).nice();

        svg.selectAll("*").remove();  // Clear the existing SVG content

        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .style("font-size", "16px");

        const xAxisLabel = isPercentStacked ? "Percentage of Water (%)" : "Volume of Water (m³)";
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(xAxisLabel);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(10).tickFormat(d => isPercentStacked ? d.toFixed(2) + "%" : d.toFixed(2)))
            .style("font-size", "16px");

        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", -100)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .style("font-size", "16px")
            .text("European Countries");

        groupedData.forEach(([country, values]) => {
            let cumulative = 0;
            let totalValue = d3.sum(values.map(([_, records]) => records[0].OBS_VALUE_abstraction));

            values.forEach(([measure_group, records]) => {
                let barValue = records[0].OBS_VALUE_abstraction;
                let percentage = 0;

                if (isPercentStacked) {
                    barValue = (barValue / totalValue) * 100;
                    percentage = barValue.toFixed(2);
                }

                const bar = svg.append("rect")
                    .data(records)
                    .attr("y", y(country))
                    .attr("x", x(0))  // Start the bars from the left (x(0))
                    .attr("height", y.bandwidth())
                    .attr("width", 0)  // Start with width 0 for animation
                    .attr("fill", color(measure_group))
                    .on("mouseover", function (event, d) {
                        tooltip.transition().duration(200).style("opacity", 0.8);
                        
                        // Show actual value in cubic meters for both stacked and percent stacked charts
                        const valueInM3 = d.OBS_VALUE_abstraction.toFixed(2) + "  cubic meters"; // Actual value in m³
                        
                        tooltip.html(`${measure_group}: ${valueInM3}`)
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function () {
                        tooltip.transition().duration(500).style("opacity", 0);
                    });


                bar.transition()
                    .duration(500)  // Animation duration
                    .attr("x", x(cumulative))  // Move the bar to the correct X position
                    .attr("width", x(barValue) - x(0))  // Animate the width
                    .ease(d3.easeLinear);  // Smooth animation

                cumulative += barValue;

                if (isPercentStacked) {
                    if (x(cumulative) - x(cumulative - barValue) > 30) {
                        svg.append("text")
                            .attr("x", x(cumulative) - (x(cumulative) - x(cumulative - barValue)) / 2)
                            .attr("y", y(country) + y.bandwidth() / 2)
                            .attr("dy", ".35em")
                            .attr("text-anchor", "middle")
                            .style("fill", "white")
                            .style("font-size", "12px")
                            .text(`${percentage}%`);
                    }
                }
            });

            if (!isPercentStacked) {
                // Start with an empty label and animate it along with the bar
                svg.append("text")
                    .attr("x", x(0) + 5)  // Start position at x(0) with a little offset
                    .attr("y", y(country) + y.bandwidth() / 2)  // Position the text in the center of the band
                    .attr("dy", ".35em")
                    .attr("text-anchor", "start")
                    .style("fill", "black")
                    .style("font-size", "16px")
                    .text("")  // Start with empty text, it will animate
                    .transition()  // Apply the transition for the text update
                    .duration(500)
                    .tween("text", function() {
                        const i = d3.interpolate(0, totalValue);  // Interpolate from 0 to totalValue
                        return function(t) {
                            this.textContent = i(t).toFixed(2) + " m³";  // Update text content during the animation
                        };
                    })
                    .ease(d3.easeLinear)  // Smooth animation
                    .attr("x", function() {
                        return x(cumulative) + 5;  // The label's position will grow as the bar grows
                    })
                    .attr("width", function() {
                        return x(cumulative + totalValue);  // Animate the label's width to match the bar
                    });
            }         
        });

        // Update the chart title in the HTML
        d3.select("#AbstractchartTitle")
            .text(`Water Abstractions Across European Countries in ${year}`);

        // Generate legend
        const legend = d3.select("#legendAbstraction");
        legend.html("");

        measureGroups.forEach(function (measure) {
            const legendItem = legend.append("div")
                .attr("class", "legend-item")
                .style("cursor", "pointer")
                .on("click", function () {
                    if (activeGroups.has(measure)) {
                        activeGroups.delete(measure);
                        d3.select(this).style("opacity", 0.5);
                    } else {
                        activeGroups.add(measure);
                        d3.select(this).style("opacity", 1);
                    }
                    updateChart(year);
                });

            legendItem.append("div")
                .attr("class", "legend-color-box")
                .style("background-color", color(measure));

            legendItem.append("span").text(measure);
        });
    }
    
    // Set the default active button to 'stackedButton' when the page loads
    document.getElementById("abstraction_stackedButton").classList.add("active");

    updateChart(years[years.length - 1]);

    const slider = document.getElementById("yearAbstractionSlider");
    const yearLabel = document.getElementById("AbsyearLabel");

    // Set the min, max, and initial value for the slider
    slider.min = Math.min(...years);
    slider.max = Math.max(...years);
    slider.value = years[years.length - 1]; // Set initial value to the maximum year

    // Display the initial year in the label
    yearLabel.textContent = years[years.length - 1]; // Show the maximum year

    slider.addEventListener("input", function () {
        const selectedYear = +this.value;
        yearLabel.textContent = selectedYear;
        updateChart(selectedYear);
    });

    document.getElementById("abstraction_stackedButton").addEventListener("click", function () {
        // Set the state for the chart
        isPercentStacked = false;

        // Update the chart
        updateChart(+slider.value);

        // Toggle the 'active' class
        this.classList.add("active");
        document.getElementById("abstraction_percentStackedButton").classList.remove("active");
    });

    document.getElementById("abstraction_percentStackedButton").addEventListener("click", function () {
        // Set the state for the chart
        isPercentStacked = true;

        // Update the chart
        updateChart(+slider.value);

        // Toggle the 'active' class
        this.classList.add("active");
        document.getElementById("abstraction_stackedButton").classList.remove("active");
    });

    // Event listener for the 'Water Abstractions' button
    document.querySelector(".visualization-btn:nth-child(3)").addEventListener("click", function() {
        // Trigger the chart update and animation for 'Water Abstractions'
        showChart('waterAbstractionChart');  // Update to display 'Water Abstractions' chart
        updateChart(+slider.value);  // Use the current slider value to update the chart dynamically
    });

    // Add event listener to the sorting button
    document.getElementById("sortAbstractionButton").addEventListener("click", function () {
        // Toggle sorting order
        isDescending = !isDescending;

        // Toggle the active class on the button
        this.classList.toggle("active", isDescending);

        // Update the chart with the current sorting state
        updateChart(+slider.value); // Assuming slider is used to select the year
    });
});