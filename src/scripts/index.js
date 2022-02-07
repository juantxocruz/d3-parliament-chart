import '../styles/index.scss';
import * as d3 from 'd3';
import d3ParliamentChart from './d3-parliament-chart';

import {
  onClick
} from './starter.service';

if (process.env.NODE_ENV === 'development') {
  require('../index.html');
}


console.log('webpack starterkit', d3ParliamentChart);

// https://observablehq.com/@lacroute/d3-parliament-export
// https://observablehq.com/@dkaoster/d3-parliament-chart#parliamentSeats

let win = window;
let doc = win.document;
let timeout = null;
let body = d3.select('body');
let width, height;
let svg;
let margin = { top: 80, right: 20, left: 20, bottom: 0 };
// configuration
let seats = 111;
let seatRadius = 16;
let rowHeight = 45;
let sections = 1;
let sectionGap = 60;
let debug = false;
let showColors = true;
// let parliamentSeats = [{ seats: 25, color: "#ca511f" }, { seats: 50, color: "#a2a4e3" }, { seats: 25, color: "#2f938a" }];
// const colors = ['#ca511f', '#a2a4e3', '#2f938a'];




function buildPartners(svg, data) {

  const patterns = svg
    .selectAll("defs.patterns")
    .data(data)
    .enter()
    .append("svg:defs")
    .attr('class', 'patterns')
    .selectAll("pattern")
    .data(function (d, i) {
      return [d];
    })
    .enter()
    .append("svg:pattern")
    .attr('class', 'pattern')
    .attr('patternUnits', 'objectBoundingBox')
    .attr('id', (function (d, i) {
      return d.slug;
    }))
    .attr('x', '0%')
    .attr('y', '0%')
    .attr('height', '100%')
    .attr('width', '100%');
  //
  const images = patterns
    .selectAll(".pattern")
    .data(function (d, i) {
      return [d];
    })
    .enter()
    .append("svg:image")
    .attr('x', '0%')
    .attr('y', '0%')
    .attr('height', '40')
    .attr('width', '40')
    .attr('xlink\:href', d => d.image_thumb2);
}

function getDimensions(el, margin) {
  // modal width is 100% of the body (CSS rules)
  // svg width is 90% of the body
  let width = parseInt(90 * (el.node().offsetWidth) / 100) - margin.left - margin.right;
  let height = width / 2;
  let seatRadius = width * 16 / 840;
  let rowHeight = width * 45 / 840;
  let sections = 1;
  let sectionGap = width * 60 / 840;

  return {
    width: width,
    height: height,
    seatRadius: seatRadius,
    rowHeight: rowHeight,
    sections: sections,
    sectionGap: sectionGap
  }

}
export function buildParliament() {

  d3.json("./data/members_20220107.json").then((data) => {

    let members = data
      .filter(d => d.staff.indexOf('full-members') >= 0)
      .map((d) => {
        d['seats'] = 1;
        d['color'] = "#a2a4e3";
        return d;
      });

    seats = members.length;
    let dimension = getDimensions(body, margin);


    width = dimension.width;
    height = dimension.height;
    seatRadius = dimension.seatRadius;
    rowHeight = dimension.rowHeight;
    sections = dimension.sections;
    sectionGap = dimension.sectionGap;

    svg = d3.select('#modal_content')
      .append('svg:svg')
      .attr('id', 'svgParliament')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .style("-webkit-tap-highlight-color", "transparent")
      .style("overflow", "visible");

    buildPartners(svg, members);
    update(members);

    win.addEventListener('resize', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        update(members);
      }, 1000);
    });

  });

  function resizePatterns(seatRadius) {
    let images = d3.selectAll(".pattern")
      .selectAll("image")
      .attr('height', seatRadius * 2)
      .attr('width', seatRadius * 2)
  }

  function resizeParliament(members, dimensions) {
    d3.select('#parliamentContainer').remove();

    //let d = d3ParliamentChart;
    svg.append('g')
      .attr('id', 'parliamentContainer')
      .call(
        d3ParliamentChart()
          .width(dimensions.width)
          .aggregatedData(members)
          .sections(dimensions.sections)
          .sectionGap(dimensions.sectionGap)
          .seatRadius(dimensions.seatRadius)
          .rowHeight(dimensions.rowHeight)
          .debug(debug)
      );
  }

  function hideTooltip() {
    d3.selectAll('.tooltip')
      .style("display", 'none')
      .style('opacity', 1);

  }
  function update(members) {
    let dimensions = getDimensions(body, margin);
    resizePatterns(dimensions.seatRadius);
    resizeParliament(members, dimensions);
    hideTooltip();
  }
}

buildParliament();



