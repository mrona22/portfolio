import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);





function renderPieChart(projectsGiven) {
    // re-calculate rolled data
    let newRolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );
    // re-calculate data
    let newData = newRolledData.map(([year, count]) => {
      return { value: count, label: year };
    });
    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));
    // TODO: clear up paths and legends
    let legend = d3.select('.legend')
    legend.selectAll('*').remove();
    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();

    newArcs.forEach((arc, idx) => {
        // TODO, fill in step for appending path to svg using D3
        newSVG.append('path').attr('d', arc).attr('fill', colors(idx));
    });
    // update paths and legends, refer to steps 1.4 and 2.2
    newData.forEach((d, idx) => {
        legend
          .append('li')
          .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
          .attr('class', 'legend-item')
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    });
  }
  
  // Call this function on page load
  renderPieChart(projects);
  
  let query = '';
  let searchInput = document.querySelector('.searchBar');
  searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
    
    // Filter projects based on query
    let filteredProjects = projects.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query);
    });
    
    // Re-render the projects and pie chart when the search query changes
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
  });

//   let selectedIndex = -1;
//   let svg = d3.select('svg');
  
//   // Clear previous paths
//   svg.selectAll('path').remove();

//   let arcs = arcData.map((d) => arcGenerator(d));
//   arcs.forEach((arc, i) => {
//     svg
//       .append('path')
//       .attr('d', arc)
//       .attr('fill', colors(i))
//       .on('click', function() {
//         // Toggle the selected index
//         selectedIndex = selectedIndex === i ? -1 : i;
  
//         // Update paths by toggling the 'selected' class
//         svg.selectAll('path')
//           .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
  
//         // Update legend items by toggling the 'selected' class
//         legend.selectAll('li')
//           .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
//       });
//   });
