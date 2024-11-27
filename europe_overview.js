function sanitizeKey(chartId, key) {
    return `${chartId}_${key.replace(/[\s&\/]/g, '_')}`;
}

function drawLineChart(data, svgId, measureColumn, valueColumn, chartId) {
    const parseYear = d3.timeParse("%Y");

    // Filter out data before 1990
    data = data.filter(d => {
        const year = parseYear(d.Year);
        return year >= new Date(1990, 0, 1); // Only include data from 1990 onwards
    });

    // Parse the remaining years and convert values to numbers
    data.forEach(d => {
        d.Year = parseYear(d.Year);
        d[valueColumn] = +d[valueColumn]; // Convert values to numbers
    });

    const margin = { top: 10, right: 150, bottom: 60, left: 90 };
    const width = 1000 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    const x = d3.scaleTime()
        .domain([new Date(1990, 0, 1), d3.max(data, d => d.Year)]) // Start from 1990
        .range([0, width - 1]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[valueColumn])])
        .nice()
        .range([height, 0]);

    const svg = d3.select(svgId)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d[valueColumn]));

    const color = d3.scaleOrdinal(d3.schemeSet2);

    const groupedData = d3.group(data, d => d[measureColumn]);

    const sortedData = Array.from(groupedData).sort(([keyA, valuesA], [keyB, valuesB]) => {
        const sumA = d3.sum(valuesA, d => d[valueColumn]);
        const sumB = d3.sum(valuesB, d => d[valueColumn]);
        return sumB - sumA;
    });

    // Add axes and labels
// Add x-axis
svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(6))
    .call(g => g.selectAll(".domain").remove())
    .selectAll("text")  // Select the tick labels
    .style("font-size", "14px");  // Adjust the font size for x-axis labels

// Modify the existing Y-axis code to add a class for easier selection later
svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).ticks(10).tickSize(-width))
    .call(g => g.selectAll(".domain").remove())
    .call(g => g.selectAll(".tick line").attr("stroke", "#cccccc"))
    .selectAll("text")
    .style("font-size", "14px");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Years");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -80)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("font-size", "14px")
        .text("Volume of Water (m³)");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("font-size", "14px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Track visibility of areas for stacked areas
    const areaVisibility = {};

    // For Resources chart (Line chart), create the line and circles
    sortedData.forEach(([key, values]) => {
        const sanitizedKey = sanitizeKey(chartId, key);

        if (chartId === "resources") {
            // Line chart with circles for Resources
            const path = svg.append("path")
                .datum(values)
                .attr("fill", "none")
                .attr("stroke", color(key))
                .attr("stroke-width", 2)
                .attr("d", line)
                .attr("id", sanitizedKey)
                .style("display", "inline");

            // Add circles for the Line chart (hoverable)
            svg.selectAll(`.circle-${sanitizedKey}`)
                .data(values)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.Year))
                .attr("cy", d => y(d[valueColumn]))
                .attr("r", 4)
                .attr("fill", color(key))
                .attr("class", `circle-${sanitizedKey}`)
                .on("mouseover", function (event, d) {
                    tooltip.html(`Year: ${d3.timeFormat("%Y")(d.Year)}<br>Total Renewable Freshwater: ${d[valueColumn].toFixed(2)} m³`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px")
                        .style("opacity", 1);
                })
                .on("mousemove", function (event) {
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("opacity", 0);
                });
        } else {
            // For Usage and Abstractions (Stacked Area Chart), add color to tooltip content
            const area = d3.area()
                .x(d => x(d.Year))
                .y0(height)
                .y1(d => y(d[valueColumn]));

            const areaPath = svg.append("path")
                .datum(values)
                .attr("fill", color(key))
                .attr("d", area)
                .attr("id", sanitizedKey)
                .style("display", "inline")
                .style("fill-opacity", 0.8);
            
            // Animate the area
        areaPath
            .attr("d", d3.area()
                .x(d => x(d.Year))
                .y0(height)  // Start from the bottom
                .y1(d => y(0))) // Start with 0 height
            .transition()
            .duration(2000) // Adjust the duration of the animation
            .ease(d3.easeCubicOut)
            .attr("d", area);  // Transition to the actual area path
            // Mark area as visible by default
            areaVisibility[sanitizedKey] = true;
        }
    });

    // Add legend with toggle functionality
    const legendGroup = svg.append("g")
        .attr("transform", `translate(${width + 20}, 20)`);

    const legendSpacing = 20;
    let legendYPos = 0;

    sortedData.forEach(([key]) => {
        const sanitizedKey = sanitizeKey(chartId, key);

    // Check if the chart is not "resources", then add the click functionality
    if (chartId !== "resources") {
        legendGroup.append("rect")
            .attr("x", 0)
            .attr("y", legendYPos)
            .attr("width", 16)
            .attr("height", 16)
            .style("fill", color(key))
            .style("cursor", "pointer")
            .on("click", function () {
                toggleAreaVisibility(sanitizedKey);
            });

        legendGroup.append("text")
            .attr("x", 20)
            .attr("y", legendYPos + 12)
            .text(key)
            .style("font-size", "14px")
            .style("cursor", "pointer")
            .on("click", function () {
                toggleAreaVisibility(sanitizedKey);
            });
    } else {
        // For the "resources" chart, just add the legend without toggle functionality
        legendGroup.append("rect")
            .attr("x", 0)
            .attr("y", legendYPos)
            .attr("width", 12)
            .attr("height", 12)
            .style("fill", color(key));

        legendGroup.append("text")
            .attr("x", 20)
            .attr("y", legendYPos + 12)
            .text(key)
            .style("font-size", "14px");
    }

    legendYPos += legendSpacing;
});

    // Add transparent rect to capture mouse events for vertical line (only for stacked areas)
    if (chartId !== "resources") {
        const verticalLine = svg.append("line")
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .style("opacity", 0)
            .style("stroke-dasharray", "4,4");  // Dotted line (4px dash, 4px space)

        let isVerticalLineVisible = false;

        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .style("pointer-events", "all")
            .on("mousemove", function (event) {
                const mouseX = d3.pointer(event)[0];
                const closestYear = x.invert(mouseX);  // Snap to the closest year
                const snappedYear = d3.timeYear(closestYear);  // Snap to the closest year
                const snapX = x(snappedYear);  // Get the X position of the snapped year

                verticalLine
                    .attr("x1", snapX)
                    .attr("x2", snapX)
                    .attr("y1", 0)
                    .attr("y2", height)
                    .style("opacity", 1);

                isVerticalLineVisible = true;

                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px")
                    .style("opacity", 1);

                let tooltipContent = `Year: ${d3.timeFormat("%Y")(snappedYear)}<br>`;

                svg.selectAll(".hover-circle").remove();

                sortedData.forEach(([key, values]) => {
                    const sanitizedKey = sanitizeKey(chartId, key);

                    const closestDataPoint = values.reduce((prev, curr) => {
                        return Math.abs(x(curr.Year) - snapX) < Math.abs(x(prev.Year) - snapX) ? curr : prev;
                    });

                    if (areaVisibility[sanitizedKey]) {
                        tooltipContent += `<span style="display:inline-block;width:12px;height:12px;background-color:${color(key)};"></span> ${key}: ${closestDataPoint[valueColumn].toFixed(2)} m³<br>`;

                        if (isVerticalLineVisible) {
                            svg.append("circle")
                                .attr("cx", x(closestDataPoint.Year))
                                .attr("cy", y(closestDataPoint[valueColumn]))
                                .attr("r", 5)
                                .attr("fill", color(key))
                                .attr("stroke", "#ffffff")
                                .attr("stroke-width", 1)
                                .attr("class", "hover-circle");
                        }
                    }
                });

                tooltip.html(tooltipContent);
            })
            .on("mouseout", function () {
                verticalLine.style("opacity", 0);  // Hide the vertical line
                tooltip.style("opacity", 0);  // Hide the tooltip

                isVerticalLineVisible = false;

                svg.selectAll(".hover-circle").remove();
            });
    }

    // Toggle area visibility based on the legend
    function toggleAreaVisibility(key) {
        const path = svg.select(`#${key}`);
        const isVisible = path.style("display") === "inline";
        const values = groupedData.get(key); // Get the data for the specific key
    
        if (isVisible) {
            path.style("display", "none");
            areaVisibility[key] = false;
        } else {
            path.style("display", "inline");
            areaVisibility[key] = true;
        }
    
        // Recalculate the max value of the Y-axis for visible areas
        updateYAxis();
        
        // Redraw all areas to adjust their position based on the new Y-axis
        redrawAreas();
    }
    
    function updateYAxis() {
        // Filter out the visible categories
        const visibleValues = [];
        sortedData.forEach(([key, values]) => {
            if (areaVisibility[sanitizeKey(chartId, key)]) {
                visibleValues.push(...values);  // Add values of visible areas
            }
        });
    
        // Calculate the max value from the visible categories
        const maxVisibleValue = d3.max(visibleValues, d => d[valueColumn]);
    
        // Update the Y-axis scale with the new max value
        y.domain([0, maxVisibleValue]).nice();
    
        // Update the Y-axis elements
        svg.selectAll(".y-axis")
            .transition()
            .duration(500)
            .call(d3.axisLeft(y).ticks(10).tickSize(-width))
            .call(g => g.selectAll(".domain").remove())
            .call(g => g.selectAll(".tick line").attr("stroke", "#cccccc"))
            .selectAll("text") // Adjust font size for y-axis labels
            .style("font-size", "14px");
    }
    
    function redrawAreas() {
        // Redraw the paths for visible areas to adjust their position based on the updated Y-axis
        svg.selectAll("path").each(function () {
            const path = d3.select(this);
            const key = path.attr("id");
            if (areaVisibility[key]) {
                // Get the data for the current key
                const values = groupedData.get(key);
                const area = d3.area()
                    .x(d => x(d.Year))
                    .y0(height)
                    .y1(d => y(d[valueColumn]));
    
                path.transition()
                    .duration(500)
                    .attr("d", area);
            }
        });
    
        // Calculate the max value from the visible categories
        const maxVisibleValue = d3.max(visibleValues, d => d[valueColumn]);
    
        // Update the Y-axis scale with the new max value
        y.domain([0, maxVisibleValue]).nice();
    
        // Update the Y-axis elements
        svg.selectAll(".y-axis")
            .transition()
            .duration(500)
            .call(d3.axisLeft(y).ticks(10).tickSize(-width))
            .call(g => g.selectAll(".domain").remove())
            .call(g => g.selectAll(".tick line").attr("stroke", "#cccccc"))
            .selectAll("text") // Adjust font size for y-axis labels
            .style("font-size", "14px");
    }
}

function loadDataAndDrawCharts(chartId) {
    const svg = d3.select(`#${chartId}-svg`);
    // Clear previous chart elements
    svg.selectAll("*").remove();

    if (chartId === 'usage') {
        d3.csv("europe_usage_aggregated.csv").then(data => {
            drawLineChart(data, "#usage-svg", "Measure_group", "OBS_VALUE_use", "usage");
        });
    } else if (chartId === 'resources') {
        d3.csv("europe_resources_aggregated.csv").then(data => {
            drawLineChart(data, "#resources-svg", "Measure_resource", "OBS_VALUE_resources", "resources");
            // Ensure animation is applied after chart is drawn
            animateLineChart(); // Trigger animation
        });
    } else if (chartId === 'abstraction') {
        d3.csv("europe_abstractions_aggregated.csv").then(data => {
            drawLineChart(data, "#abstraction-svg", "Measure_group", "OBS_VALUE_abstraction", "abstraction");
        });
    }
}

function showChart(chartId) {
    document.querySelectorAll('.chart').forEach(chart => chart.style.display = 'none');
    document.getElementById(chartId).style.display = 'block';

    const header = document.querySelector('#visualizations-section h2');
    switch (chartId) {
        case 'waterUsageChart':
            header.textContent = 'Trends in Water Usage Categories - Stacked Area Chart';
            loadDataAndDrawCharts('usage');
            break;
        case 'waterResourcesChart':
            header.textContent = 'Trends in Total Renewable Freshwater - Line Chart';
            loadDataAndDrawCharts('resources');
            break;
        case 'waterAbstractionChart':
            header.textContent = 'Trends in Water Abstraction Categories - Stacked Area Chart';
            loadDataAndDrawCharts('abstraction');
            break;
    }
}

// Function to animate the line chart for the Water Resources chart
function animateLineChart() {
    const svg = d3.select("#resources-svg");
    const paths = svg.selectAll("path"); // Select all paths in the resources chart

    // Wait until all paths are loaded (ensures that the paths are available for animation)
    paths.each(function() {
        const path = d3.select(this);
        const totalLength = path.node().getTotalLength();
        
        path
            .attr("stroke-dasharray", totalLength)
            .attr("stroke-dashoffset", totalLength) // Initially hide the path
            .transition()
            .duration(2000) // Duration of the animation
            .ease(d3.easeLinear) // Transition easing
            .attr("stroke-dashoffset", 0); // Animate the path to its full length
    });
}

// Function to animate the line path (same as in the original code)
function animateLine(path) {
    const totalLength = path.node().getTotalLength();
    path
        .attr("stroke-dasharray", totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)  // Adjust the duration as needed
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
}

loadDataAndDrawCharts();

window.onload = function () {
    showChart('waterUsageChart');
};