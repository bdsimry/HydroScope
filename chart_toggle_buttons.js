function showChart(chartId) {
    // Hide all charts initially
    document.getElementById('waterUsageChart').style.display = 'none';
    document.getElementById('waterResourcesChart').style.display = 'none';
    document.getElementById('waterAbstractionChart').style.display = 'none';
    document.getElementById('barchart1-section').style.display = 'none';
    document.getElementById('barchart2-section').style.display = 'none';
    document.getElementById('barchart3-section').style.display = 'none';
    
    // Hide all chart titles
    document.getElementById('UsechartTitle').style.display = 'none';
    document.getElementById('ResourcechartTitle').style.display = 'none';
    document.getElementById('AbstractchartTitle').style.display = 'none';

    // Show the selected chart and its corresponding title
    if (chartId === 'waterResourcesChart') {
        document.getElementById('waterResourcesChart').style.display = 'block';
        document.getElementById('barchart2-section').style.display = 'block';
        document.getElementById('ResourcechartTitle').style.display = 'block';  // Show the Water Resources title
    } else if (chartId === 'waterAbstractionChart') {
        document.getElementById('waterAbstractionChart').style.display = 'block';
        document.getElementById('barchart3-section').style.display = 'block';
        document.getElementById('AbstractchartTitle').style.display = 'block';  // Show the Water Abstraction title
    }else{
        document.getElementById('waterUsageChart').style.display = 'block';
        document.getElementById('barchart1-section').style.display = 'block';
        document.getElementById('UsechartTitle').style.display = 'block';  // Show the Water Usage title
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Default to Water Usage Chart when page loads
    showChart('waterUsageChart');
    
    // Set the active state for the Water Usage button
    document.querySelector(".visualization-btn").classList.add("active");  // Water Usage button by default
});
