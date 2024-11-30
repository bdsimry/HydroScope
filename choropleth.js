d3.csv("./water_stress.csv").then(data => {
    const svgWidth = 1500;
    const svgHeight = 800;

    let svg = d3.select("body").select("svg");
    if (svg.empty()) {
        svg = d3.select("body")
            .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);
    }

    // Set up the zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])  // Defines the zoom scale range
        .on("zoom", zoomed);  // Callback function to handle zoom events

    // Apply the zoom behavior to the SVG element
    svg.call(zoom);

    function zoomed(event) {
        svg.selectAll("path")  // Apply zoom to all map paths
            .attr("transform", event.transform);  // Update the transform property for zooming
    }

    const sources = Array.from(new Set(data.map(d => d['Measure_group'])));
    const dropdown = d3.select("#measure-group");
    sources.forEach(source => {
        const option = dropdown.append("option").text(source).attr("value", source);
        if (source === 'Total') option.attr("selected", true);
    });

    const years = Array.from(new Set(data.map(d => +d['Year']))).sort((a, b) => a - b);
    const yearSlider = d3.select("#year-slider")
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("value", d3.max(years));
    const yearValue = d3.select("#year-value").text(d3.max(years));

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip");

    // Static color legend for pie chart
    const legendData = [
        { category: 'Agriculture', color: '#74c476' },
        { category: 'Industry', color: '#fd8d3c' },
        { category: 'Domestic/Public Use', color: '#9e9ac8' },
        { category: 'Energy Production', color: '#fb6a4a' },
        { category: 'Services', color: '#df65b0' }
    ]; 

    function getColorScale(category) {
        const domain = [0, 0.2, 0.4, 0.6, 0.8];  // 4 breakpoints for 5 colors
        let colors;
        let nullColor;
        switch (category) {
            case 'Agriculture': colors = ['#c7e9c0', '#a1d99b', '#74c476', '#31a354', '#006d2c']; nullColor = '#edf8e9'; break;
            case 'Industry': colors = ['#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d', '#a63603']; nullColor = '#feedde'; break;
            case 'Domestic/Public Use': colors = ['#dadaeb', '#bcbddc', '#9e9ac8', '#756bb1', '#54278f']; nullColor = '#f2f0f7'; break;
            case 'Energy Production': colors = ['#fcbba1', '#fc9272', '#fb6a4a', '#de2d26', '#a50f15']; nullColor = '#fee5d9'; break;
            case 'Services': colors = ['#d4b9da', '#c994c7', '#df65b0', '#dd1c77', '#980043']; nullColor = '#f1eef6'; break;
            default: colors = ['#d0d1e6', '#a6bddb', '#74a9cf', '#2b8cbe', '#045a8d']; nullColor = '#f1eef6'; break;
        }
        return { scale: d3.scaleThreshold().domain(domain).range(colors), nullColor };
    }

    function updateMap(selectedCategory, selectedYear) {
        const dataMap = {};
        data.forEach(d => {
            const ratio = +d.usage_to_abstractions_ratio;
            if (d['Measure_group'] === selectedCategory && +d['Year'] === selectedYear && ratio <= 1) {
                const iso3 = d.ISO3;
                dataMap[iso3] = ratio;
            }
        });
    
        const countriesToRemove = ['RUS', 'ISR', 'TUR'];
        const { scale: thresholdScale, nullColor } = getColorScale(selectedCategory);
    
        d3.json("./europe.geojson").then(geoData => {
            svg.selectAll("path")
                .data(geoData.features.filter(d => !countriesToRemove.includes(d.properties.ISO3)))
                .join("path")
                .attr("d", d3.geoPath().projection(d3.geoMercator()
                    .center([10, 50])
                    .scale(1500)
                    .translate([svgWidth / 2 + 180, svgHeight / 2 + 250])))
                .attr("fill", d => {
                    const countryCode = d.properties.ISO3;
                    const countryData = dataMap[countryCode];
                    return countryData == null ? nullColor : thresholdScale(countryData);
                })
                .attr("stroke", "#2e4454")
                .attr("stroke-width", 1)
                .on("mouseover", function(event, d) {
                    const countryCode = d.properties.ISO3;
                    const countryData = dataMap[countryCode];
                    tooltip.style("opacity", 1)
                        .html(`<strong>Country:</strong> ${d.properties.NAME}<br><strong>Value:</strong> ${countryData !== undefined ? countryData.toFixed(2) : "N/A"}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    d3.select(this).attr("fill", d3.rgb(d3.select(this).attr("fill")).darker(1.2));
                })
                .on("mousemove", function(event) {
                    tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("fill", d => {
                        const countryCode = d.properties.ISO3;
                        const countryData = dataMap[countryCode];
                        return countryData == null ? nullColor : thresholdScale(countryData);
                    });
                })
                .on("click", function(event, d) {
                    const countryCode = d.properties.ISO3;
                    createDonutChartForCountry(data, countryCode, selectedYear);
                });
        });
    }    

    let selectedCountryCode = null; // Track the currently selected country

    function createDonutChartForCountry(data, countryCode, year) {
        const donutChartContainer = d3.select("#donut-chart-container");

        // If the same country is clicked again, fade out the donut chart and hide the container
        if (selectedCountryCode === countryCode) {
            donutChartContainer.transition()
                .duration(600) // Animation duration for fade-out
                .style("opacity", 0) // Fade-out effect
                .style("transform", "translateX(-100px)") // Slide out effect
                .on("end", function() {
                    donutChartContainer.style("display", "none"); // Hide the container after animation
                });

            selectedCountryCode = null; // Reset the selected country code
            return; // Return early to avoid further execution
        }

        // Proceed with the donut chart creation process
        const filteredData = data.filter(d => d['ISO3'] === countryCode && +d['Year'] === year && d['Measure_group'] !== 'Total');
        const totalData = data.find(d => d['ISO3'] === countryCode && +d['Year'] === year && d['Measure_group'] === 'Total');
        const totalValue = totalData ? +totalData['OBS_VALUE_use'] : 0;

        // Always show the container, but initially hide it
        donutChartContainer.style("display", "block")
            .style("opacity", 0) // Initially hidden for fade-in effect
            .style("transform", "translateX(-100px)"); // Start slightly off-screen to the left

        // Clear only the donut chart, but keep the legend
        donutChartContainer.select("#donut-chart").remove();

        // Add country name, year, and OBS_VALUE_use to the container
        const countryFeature = d3.json("./europe.geojson").then(geoData => {
            const countryFeature = geoData.features.find(d => d.properties.ISO3 === countryCode);
            const countryName = countryFeature ? countryFeature.properties.NAME : "Unknown Country";

            // Display country name with total OBS_VALUE_use (in m³)
            donutChartContainer
                .html(`<h3>${countryName} (Total Water Usage- ${totalValue ? totalValue.toFixed(2) : "N/A"} m³)</h3>`)  // Display country name and total OBS_VALUE_use
                .style("text-align", "center")
                .style("margin-bottom", "5px")
                .style("font-size", "16px")
                .style("color", "#333");

            // Check if there is no data for this country
            if (!totalValue || filteredData.length === 0) {
                // If no data, show the "No data available" message
                donutChartContainer.append("p")
                    .html(`No data available for ${countryCode} in ${year}`)
                    .style("font-size", "16px")
                    .style("color", "#333")
                    .style("text-align", "center")
                    .style("padding", "20px");

                // Apply fade-in effect for the "No data" message
                donutChartContainer.transition()
                    .duration(600)
                    .style("opacity", 1)  // Fade in the container
                    .style("transform", "translateY(0)");  // Slide the container up

                selectedCountryCode = countryCode; // Update the selected country code
                return;  // No need to process donut chart or legend if there's no data
            }

            // If there's data, create the donut chart
            const containerWidth = donutChartContainer.node().clientWidth;
            const containerHeight = donutChartContainer.node().clientHeight;
            const margin = { top: 30, right: 20, bottom: 50, left: 20 };
            const width = containerWidth - margin.left - margin.right;
            const height = containerHeight - margin.top - margin.bottom;
            const radius = Math.min(width, height) / 2;

            const svg = donutChartContainer.append("svg")
                .attr("id", "donut-chart")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${(width / 2) + margin.left + 70}, ${(height / 2) + margin.top - 20})`);

            const colorScale = d3.scaleOrdinal()
                .domain(filteredData.map(d => d['Measure_group']))
                .range(["#74c476", "#fd8d3c", "#9e9ac8", "#fb6a4a", "#df65b0"]);

            const pie = d3.pie().value(d => d.value);
            const arc = d3.arc().innerRadius(0).outerRadius(radius * 0.95);

            const arcs = svg.selectAll("arc")
                .data(pie(filteredData.map(d => ({
                    category: d['Measure_group'],
                    value: +d['OBS_VALUE_use'],
                    displayValue: `${d['OBS_VALUE_use']} m³`
                })))).enter()
                .append("g")
                .attr("class", "arc");

            arcs.append("path")
                .attr("d", arc)
                .attr("fill", d => colorScale(d.data.category))
                .on("mouseover", function(event, d) {
                    tooltip.style("opacity", 1)
                        .html(`<strong>Category:</strong> ${d.data.category}<br><strong>Value:</strong> ${d.data.displayValue}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mousemove", function(event) {
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                })
                .transition()
                .duration(1000)
                .delay(100)
                .attrTween('d', function(d) {
                    const i = d3.interpolate(d.startAngle, d.endAngle);
                    return function(t) {
                        d.endAngle = i(t);
                        return arc(d);
                    };
                });

            // Add text labels inside or outside the donut slices based on percentage
            const text = svg.selectAll('.text')
                .data(pie(filteredData.map(d => ({
                    category: d['Measure_group'],
                    value: +d['OBS_VALUE_use']
                })))).enter()
                .append('text')
                .attr('transform', function(d) {
                    const centroid = arc.centroid(d);
                    const percentage = (d.value / totalValue) * 100;

                    // Modify the distance based on percentage to prevent labels from being too far
                    const distanceFactor = percentage < 5 ? 1.4 : 1.0; // Smaller slices will have larger distance

                    return `translate(${centroid[0] * distanceFactor}, ${centroid[1] * distanceFactor})`;
                })
                .style('opacity', 0)
                .style("font-size", function(d) {
                    const percentage = (d.value / totalValue) * 100;
                    return percentage < 5 ? "10px" : "14px"; // Smaller text for small slices
                })
                .text(function(d) {
                    const percentage = (d.value / totalValue * 100).toFixed(1);
                    return percentage >= 5 ? `${percentage}%` : ""; // Only display text for larger slices
                })
                .transition()
                .duration(300)
                .delay(700)
                .style('opacity', 1); // Fade-in text after arc transition

                // Add the legend
                const legendContainer = donutChartContainer.append("div")
                    .attr("id", "legend-container")
                    .style("display", "flex")
                    .style("flex-direction", "column")
                    .style("margin-top", "20px")
                    .style("opacity", 0);  // Initially hidden for animation
        
                legendData.forEach(item => {
                    const legendItem = legendContainer.append("div")
                        .style("margin-bottom", "5px")
                        .style("display", "flex")
                        .style("align-items", "center");
                    legendItem.append("span")
                        .style("display", "inline-block")
                        .style("width", "15px")
                        .style("height", "15px")
                        .style("background-color", item.color)
                        .style("margin-right", "10px");
                    legendItem.append("span").text(item.category);
                });
        
                // Apply fade-in animation to the donut chart container and the legend
                donutChartContainer.transition()
                    .duration(600)
                    .style("opacity", 1)  // Fade in the container
                    .style("transform", "translateY(0)");  // Slide the container up
                legendContainer.transition()
                    .duration(400)
                    .style("opacity", 1);  // Fade in the legend
                    
                selectedCountryCode = countryCode; // Update selected country code
            });
        }      

        const initialYear = +yearSlider.attr("value");
        updateMap("Total", initialYear);

        // This function will be used to update the horizontal legend based on the selected category
        function updateHorizontalLegend(category) {
            const { scale: colorScale } = getColorScale(category);
            const domain = colorScale.domain();
        
            // Select legend container and clear previous content
            const legend = d3.select("#horizontal-legend").html("");
        
            // Append legend items
            domain.forEach((value, i) => {
                legend.append("div")
                    .style("display", "flex")
                    .style("align-items", "center")
                    .style("gap", "5px")
                    .html(`
                        <span style="width: 20px; height: 15px; background-color: ${colorScale(value)}; display: inline-block;"></span>
                        <span>${value}${domain[i + 1] ? ` - ${domain[i + 1]}` : "+"}</span>
                    `);
            });
        }              

        // Initially update the horizontal legend with the "Total" category
        updateHorizontalLegend("Total");

        // Update the map and legend when the category is changed via dropdown
        dropdown.on("change", function() {
            const selectedSource = this.value;
            const selectedYear = +yearSlider.node().value;
            updateMap(selectedSource, selectedYear);
            updateHorizontalLegend(selectedSource); // Update the legend based on the selected category
        });

        // Update the map and legend when the year is changed via slider
        yearSlider.on("input", function() {
            const selectedYear = +this.value;
            yearValue.text(selectedYear);
            const selectedSource = dropdown.node().value;
            updateMap(selectedSource, selectedYear);
            updateHorizontalLegend(selectedSource); // Update the legend based on the selected category
        });

});