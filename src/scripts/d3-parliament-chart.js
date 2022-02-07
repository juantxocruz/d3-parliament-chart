import * as d3 from 'd3';
import getParliamentPoints from './d3-parliament-helpers';
import debugGuides from './d3-parliament-debug';




function getClientX(svgW, xPosition) {
    let result = xPosition;
    if (xPosition + 150 > svgW) {
        result = xPosition - 150 - 64;
    }
    return result;
}

function getClientY(svgH, yPosition) {
    let result = yPosition;
    if (yPosition + 150 > svgH) {
        result = yPosition - 150;
    }
    return result;
}

/**
 *  ___ ____    ___          _ _                    _       ___ _             _
 * |   \__ /   | _ \__ _ _ _| (_)__ _ _ __  ___ _ _| |_    / __| |_  __ _ _ _| |_
 * | |) |_ \   |  _/ _` | '_| | / _` | '  \/ -_) ' \  _|  | (__| ' \/ _` | '_|  _|
 * |___/___/   |_| \__,_|_| |_|_\__,_|_|_|_\___|_||_\__|   \___|_||_\__,_|_|  \__|
 *
 * A d3 plugin for making semi-circle parliament charts.
 */

export default (data = [], width = 0) => {
    // Dimensions of the graphic
    let graphicWidth = parseFloat(width);

    // clean out any x and y values provided in data objects.
    let rawData = data.map(({ x, y, ...restProps }) => restProps);

    // visual options
    const options = {
        sections: 4,         // Number of sections to divide the half circle into
        sectionGap: 60,      // The gap of the aisle between sections
        seatRadius: 12,      // The radius of each seat
        rowHeight: 42,       // The height of each row
    };

    // Whether we should draw the debug lines or not
    let debug = false;


    // //////////////////////////////////////////////////////////////////////////
    // Selection call
    //
    // This function gets called on instances such as:
    //    d3.select('g').call(parliamentChart())
    const parliamentChart = (selection) => {
        if (graphicWidth === 0) {
            // Sets the graphicWidth based on our selected container
            graphicWidth = selection.node().getBoundingClientRect().width;
        }

        // Get the processed data (filter for entries that have x and y locations)
        const processedData = parliamentChart.data().filter((r) => r.x && r.y);

        // Remove existing chart
        selection.select('g.parliament-chart').remove();


        // Add new chart
        const innerSelection = selection
            .append('g')
            .attr('class', 'parliament-chart');

        // First remove any existing debug lines
        innerSelection.select('g.debug').remove();

        const tooltip = d3.select('body')
            .append("div.tooltip")
            .attr("id", 'tipParliament')
            .style("position", "absolute")
            .style("display", "none")
            .style("padding", "8px")
            .style("box-shadow", "0 3px 10px rgba(0, 0, 0, 0.1)")
            .style("background", "whitesmoke")
            .style("z-index", 100)
            .style("max-width", "150px");


        function pointermoved(event, data) {
            const { sx, sy, width: sw, height: sh } = d3.select('svg#svgParliament').node().getBBox();
            const pointX = event.clientX + 32;
            const pointY = event.clientY + 10;

            d3.selectAll('circle.parliament').style('opacity', 0.8);
            d3.select(event.currentTarget)
                .style('stroke-opacity', 1)
                .style('opacity', 1);

            tooltip.node().innerHTML = "";
            tooltip.style("display", 'block');
            tooltip.style('opacity', 1);

            tooltip.append('img')
                .attr('class', 'member-img')
                .attr('src', data.image_thumb2);
            tooltip.append('p').attr('class', 'member-name')
                .html(data.title);
            tooltip.append('p')
                .attr('class', 'member-position')
                .style("font-size", "10px")
                .html(data.cargo);

            tooltip.style('left', getClientX(sw, pointX) + 'px');
            tooltip.style('top', getClientY(sh, pointY) + 'px');
            return false;

        }

        function pointerleft() {
            tooltip.style("display", "none");
            tooltip.style('left', '0px')
            tooltip.style('top', '0px');
            d3.selectAll('circle.parliament').style('stroke-opacity', 0);
            d3.selectAll('circle.parliament').style('opacity', 1);
            return false;

        }
        function pointerclicked(event, data) {
            window.open(data.permalink + '#miembro-area', '_blank');
            return false;
        }


        // Append debug lines
        if (debug) debugGuides(innerSelection, graphicWidth, options, processedData.length);

        return innerSelection
            .selectAll('circle.parliament')
            .data(processedData)
            .enter()
            .insert('circle')
            .attr('class', 'parliament')
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', options.seatRadius)
            .attr('fill', (d) => d.color || '#AAA')
            .style('fill', d => "url(#" + d.slug + ")")
            .style('stroke', 'red')
            .style('stroke-opacity', 0)
            .style("cursor", "pointer")
            .on("pointerenter", (event, d) => {
                pointermoved(event, d);
            })
            .on("pointerleave", pointerleft)
            .on("click", (event, d) => {
                pointerclicked(event, d);
            })
            .on("touchstart", event => event.preventDefault());
    };

    // //////////////////////////////////////////////////////////////////////////
    // Getters and Setters

    // Sets the width and the height of the graphic
    parliamentChart.width = (w) => {
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(w)) {
            // parse the width
            graphicWidth = parseFloat(w);
        }
        return parliamentChart;
    };

    // Create getters and setters for sections, sectionGap, seatRadius, and rowHeight
    Object.keys(options)
        .forEach((attr) => {
            parliamentChart[attr] = (s) => {
                // eslint-disable-next-line no-restricted-globals
                if (!isNaN(s)) {
                    options[attr] = parseInt(s, 10);
                    return parliamentChart;
                }
                return options[attr];
            };
        });

    // enable / disable debug mode
    parliamentChart.debug = (b) => {
        debug = !!b;
        return parliamentChart;
    };

    // //////////////////////////////////////////////////////////////////////////
    // Data Processing
    //
    // Gets the data processed data with x and y coordinates or sets
    // the raw data.
    parliamentChart.data = (d) => {
        // If an argument with new data is provided
        if (d) {
            // clean out any x and y values provided in data objects.
            rawData = d.map(({ x, y, ...restProps }) => restProps);
            return parliamentChart;
        }

        // If width is not set, don't calculate this instance
        if (graphicWidth <= 0 || rawData.length <= 0) return rawData;

        // Check if we have already run this instance
        if (rawData.every((r) => r.x && r.y)) return rawData;

        // The number of points we need to fit
        const totalPoints = rawData.length;

        // The locations of all the points
        const locations = getParliamentPoints(totalPoints, options, graphicWidth);

        // Add locations to the rawData object
        locations.forEach((coords, i) => rawData[i] = ({ ...rawData[i], ...coords }));

        // return the data
        return rawData;
    };

    // Instead of passing in an array of every single point, we pass in an array of objects
    // that each have a key `seats` that specifies the number of seats. This function can only
    // set, not get.
    parliamentChart.aggregatedData = (d) => {
        rawData = d.reduce((acc, val) => {
            const { seats = 0, x, y, ...restProps } = val;
            return [...acc, ...Array(seats).fill(restProps)];
        }, []);

        return parliamentChart;
    };

    return parliamentChart;
};
