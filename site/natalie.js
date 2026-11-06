// Natalie's two charts, from natalie-vis/index.html. Only the data paths and
// SVG sizing (viewBox, so the charts fit the page width) differ.
// ==========================================
// CHART 1: TIME SERIES TRAJECTORY
// ==========================================
d3.csv("natalie-vis/cmip6_winter_compression.csv").then(rawData => {
    rawData.forEach(d => {
        d.year = +d.year;
        d.winter_mean_temp_c = +d.winter_mean_temp_c;
    });

    rawData.sort((a, b) => a.year - b.year);

    const colorScale = d3.scaleOrdinal()
        .domain(["historical", "ssp126", "ssp585"])
        .range(["#4a5568", "#2b6cb0", "#c53030"]);

    const margin1 = { top: 20, right: 30, bottom: 40, left: 60 };
    const width1 = 800 - margin1.left - margin1.right;
    const height1 = 380 - margin1.top - margin1.bottom;

    const svg1 = d3.select("#chart1")
        .append("svg")
        .attr("viewBox", `0 0 ${width1 + margin1.left + margin1.right} ${height1 + margin1.top + margin1.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin1.left},${margin1.top})`);

    svg1.append("clipPath")
        .attr("id", "clip1")
        .append("rect")
        .attr("width", width1)
        .attr("height", height1);

    const tooltip1 = d3.select("#tooltip1");

    const fullDomain = d3.extent(rawData, d => d.year);
    const zoomDomain = [2015, 2100];

    const x1 = d3.scaleLinear()
        .domain(fullDomain)
        .range([0, width1]);

    const y1 = d3.scaleLinear()
        .domain([
            d3.min(rawData, d => d.winter_mean_temp_c) - 1,
            d3.max(rawData, d => d.winter_mean_temp_c) + 1
        ])
        .range([height1, 0]);

    const xAxisGroup = svg1.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height1})`)
        .call(d3.axisBottom(x1).tickFormat(d3.format("d")));

    svg1.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y1));

    const plot1 = svg1.append("g").attr("clip-path", "url(#clip1)");

    plot1.append("line")
        .attr("x1", 0).attr("x2", width1)
        .attr("y1", y1(0)).attr("y2", y1(0))
        .attr("stroke", "#e53e3e")
        .attr("stroke-dasharray", "4 4")
        .attr("stroke-width", 1.5);

    const nestedData = d3.groups(rawData, d => d.scenario);
    const lineGen1 = d3.line()
        .x(d => x1(d.year))
        .y(d => y1(d.winter_mean_temp_c))
        .curve(d3.curveMonotoneX);

    const lineGroups1 = plot1.selectAll(".line-group")
        .data(nestedData)
        .enter()
        .append("g")
        .attr("class", d => `line-group scenario-${d[0]}`);

    lineGroups1.append("path")
        .attr("class", "line")
        .attr("d", d => lineGen1(d[1]))
        .attr("stroke", d => colorScale(d[0]));

    const thawedPoints = rawData.filter(d => d.winter_mean_temp_c >= 0);
    const thawDots = plot1.selectAll(".thaw-dot")
        .data(thawedPoints)
        .enter()
        .append("circle")
        .attr("class", d => `thaw-dot scenario-${d.scenario}`)
        .attr("r", 4)
        .attr("fill", d => colorScale(d.scenario))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("cx", d => x1(d.year))
        .attr("cy", d => y1(d.winter_mean_temp_c))
        .style("opacity", 0);

    const focusCircle1 = plot1.append("circle")
        .attr("r", 5)
        .attr("class", "focus-circle")
        .style("opacity", 0);

    plot1.append("rect")
        .attr("width", width1)
        .attr("height", height1)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", function (event) {
            const [mouseX] = d3.pointer(event);
            const hoveredYear = Math.round(x1.invert(mouseX));
            const match = rawData.reduce((prev, curr) =>
                Math.abs(curr.year - hoveredYear) < Math.abs(prev.year - hoveredYear) ? curr : prev
            );

            if (match) {
                focusCircle1
                    .attr("cx", x1(match.year))
                    .attr("cy", y1(match.winter_mean_temp_c))
                    .attr("stroke", colorScale(match.scenario))
                    .style("opacity", 1);

                tooltip1
                    .style("opacity", 1)
                    .style("left", `${event.clientX + 15}px`)
                    .style("top", `${event.clientY - 28}px`)
                    .html(`<strong>Year:</strong> ${match.year}<br/><strong>Scenario:</strong> ${match.scenario.toUpperCase()}<br/><strong>Temp:</strong> ${match.winter_mean_temp_c.toFixed(2)}°C`);
            }
        })
        .on("mouseout", function () {
            focusCircle1.style("opacity", 0);
            tooltip1.style("opacity", 0);
        });

    d3.selectAll(".filter-btn").on("click", function () {
        const selected = d3.select(this).attr("data-scenario");
        d3.selectAll(".filter-btn").classed("active", false);
        d3.select(this).classed("active", true);

        if (selected === "all") {
            plot1.selectAll(".line-group").transition().duration(300).style("opacity", 1);
        } else {
            plot1.selectAll(".line-group").transition().duration(300).style("opacity", 0.15);
            plot1.selectAll(`.scenario-${selected}`).transition().duration(300).style("opacity", 1);
            plot1.selectAll(".scenario-historical").transition().duration(300).style("opacity", 1);
        }
    });

    let showAnnualDots = false;
    d3.select("#annualToggleBtn").on("click", function () {
        showAnnualDots = !showAnnualDots;
        d3.select(this).classed("active", showAnnualDots);
        thawDots.transition().duration(250).style("opacity", showAnnualDots ? 1 : 0);
    });

    let isZoomed = false;
    d3.select("#zoomBtn").on("click", function () {
        isZoomed = !isZoomed;
        x1.domain(isZoomed ? zoomDomain : fullDomain);

        d3.select(this)
            .classed("active", isZoomed)
            .text(isZoomed ? "Show All Years (1850–2100)" : "Zoom to Projections (2015–2100)");

        xAxisGroup.transition().duration(750)
            .call(d3.axisBottom(x1).tickFormat(d3.format("d")));

        lineGroups1.selectAll(".line")
            .transition().duration(750)
            .attr("d", d => lineGen1(d[1]));

        thawDots.transition().duration(750)
            .attr("cx", d => x1(d.year));
    });

}).catch(err => {
    console.error(err);
    d3.select("#error-log").text("Chart 2 Error: " + err.message);
});


// ==========================================
// CHART 2: SEASONAL DIFFERENTIAL (WINTER VS SUMMER)
// ==========================================
d3.csv("natalie-vis/cmip6_global_temp_trends.csv").then(rawData => {
    rawData.forEach(d => {
        d.year = +d.year;
        d.mean_temp_celsius = +d.mean_temp_celsius;
    });

    rawData.sort((a, b) => a.year - b.year);

    // Calculate seasonal anomaly lines from baseline
    const baseTemp = d3.mean(rawData.filter(d => d.year >= 1850 && d.year <= 1900), d => d.mean_temp_celsius) || 0;

    const seasonalData = rawData.flatMap(d => {
        const anomaly = d.mean_temp_celsius - baseTemp;
        return [
            { year: d.year, season: "winter", anomaly: anomaly * 1.25, scenario: d.scenario || "historical" },
            { year: d.year, season: "summer", anomaly: anomaly * 0.85, scenario: d.scenario || "historical" }
        ];
    });

    const margin2 = { top: 20, right: 30, bottom: 40, left: 60 };
    const width2 = 800 - margin2.left - margin2.right;
    const height2 = 380 - margin2.top - margin2.bottom;

    const svg2 = d3.select("#chart2")
        .append("svg")
        .attr("viewBox", `0 0 ${width2 + margin2.left + margin2.right} ${height2 + margin2.top + margin2.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin2.left},${margin2.top})`);

    const tooltip2 = d3.select("#tooltip2");

    const x2 = d3.scaleLinear()
        .domain(d3.extent(seasonalData, d => d.year))
        .range([0, width2]);

    const y2 = d3.scaleLinear()
        .domain([
            d3.min(seasonalData, d => d.anomaly) - 0.5,
            d3.max(seasonalData, d => d.anomaly) + 0.5
        ])
        .range([height2, 0]);

    svg2.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height2})`)
        .call(d3.axisBottom(x2).tickFormat(d3.format("d")));

    svg2.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y2).tickFormat(d => `+${d.toFixed(1)}°C`));

    const nestedSeasonal = d3.groups(seasonalData, d => d.season);

    const seasonColors = {
        winter: "#2b6cb0",
        summer: "#dd6b20"
    };

    const lineGen2 = d3.line()
        .x(d => x2(d.year))
        .y(d => y2(d.anomaly))
        .curve(d3.curveMonotoneX);

    const seasonGroups = svg2.selectAll(".season-group")
        .data(nestedSeasonal)
        .enter()
        .append("g")
        .attr("class", d => `season-group season-${d[0]}`);

    seasonGroups.append("path")
        .attr("class", "line")
        .attr("d", d => lineGen2(d[1]))
        .attr("stroke", d => seasonColors[d[0]])
        .attr("stroke-width", 2.5)
        .attr("fill", "none");

    const focusCircle2 = svg2.append("circle")
        .attr("r", 5)
        .attr("class", "focus-circle")
        .style("opacity", 0);

    svg2.append("rect")
        .attr("width", width2)
        .attr("height", height2)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", function (event) {
            const [mouseX] = d3.pointer(event);
            const hoveredYear = Math.round(x2.invert(mouseX));
            const match = seasonalData.find(d => d.year === hoveredYear && d.season === "winter");

            if (match) {
                const summerMatch = seasonalData.find(d => d.year === hoveredYear && d.season === "summer");

                focusCircle2
                    .attr("cx", x2(match.year))
                    .attr("cy", y2(match.anomaly))
                    .attr("stroke", seasonColors.winter)
                    .style("opacity", 1);

                tooltip2
                    .style("opacity", 1)
                    .style("left", `${event.clientX + 15}px`)
                    .style("top", `${event.clientY - 28}px`)
                    .html(`<strong>Year:</strong> ${match.year}<br/>` +
                        `<span style="color:#2b6cb0"><strong>Winter Anomaly:</strong> +${match.anomaly.toFixed(2)}°C</span><br/>` +
                        `<span style="color:#dd6b20"><strong>Summer Anomaly:</strong> +${summerMatch ? summerMatch.anomaly.toFixed(2) : "N/A"}°C</span>`);
            }
        })
        .on("mouseout", function () {
            focusCircle2.style("opacity", 0);
            tooltip2.style("opacity", 0);
        });

    d3.selectAll(".season-btn").on("click", function () {
        const selected = d3.select(this).attr("data-season");
        d3.selectAll(".season-btn").classed("active", false);
        d3.select(this).classed("active", true);

        if (selected === "both") {
            svg2.selectAll(".season-group").transition().duration(300).style("opacity", 1);
        } else {
            svg2.selectAll(".season-group").transition().duration(300).style("opacity", 0.15);
            svg2.selectAll(`.season-${selected}`).transition().duration(300).style("opacity", 1);
        }
    });

}).catch(err => {
    console.error(err);
    d3.select("#error-log").text("Chart 3 Error: " + err.message);
});
