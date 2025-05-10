import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
  
    return data;
  }

  function timePeriod(hourFrac) {
    if (hourFrac >= 5 && hourFrac < 12) return 'morning';
    if (hourFrac >= 12 && hourFrac < 17) return 'afternoon';
    if (hourFrac >= 17 && hourFrac < 21) return 'evening';
    return 'night'; // from 9 PM to 4:59 AM
  }


  let xScale, yScale;


  function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/mrona22/porfolio/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          writable: false,
          enumerable: false,
          configurable: false,
        });
  
        return ret;
      });
  }
  function renderCommitInfo(data, commits) {
    // Create outer wrapper for all stats
    const wrapper = d3.select('#stats')
      .append('div')
      .attr('class', 'stats-wrapper'); // This wraps all stats
  
    // Create the container for the individual stat boxes inside the wrapper
    const container = wrapper.append('div')
      .attr('class', 'meta-stats'); // This holds individual stats
  
    // Helper to create each stat box
    function addStat(label, value, isHtml = false) {
      const box = container.append('div');
      const dl = box.append('dl');
  
      if (isHtml) {
        dl.append('dt').html(label);
      } else {
        dl.append('dt').text(label);
      }
  
      dl.append('dd').text(value);
    }
  
    addStat('Total <abbr title="Lines of code">LOC</abbr>', data.length, true);
    addStat('Total commits', commits.length);
  
    const avgFileLength = d3.mean(commits.map(d => d.totalLines)).toFixed(2);
    addStat('Average Lines', avgFileLength);
  
    const longestLine = d3.max(commits.flatMap(d => d.lines.map(line => line.length)));
    addStat('Longest Line', longestLine);
  
    const timeCounts = d3.rollup(commits, v => v.length, d => timePeriod(d.hourFrac));
    const mostCommonTime = Array.from(timeCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
    addStat('Time of day', mostCommonTime);
  }

  function renderScatterPlot(data, commits) {
    // Put all the JS code of Steps inside this function
    const width = 1000;
    const height = 600;

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
      };


    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');



    xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

    const dots = svg.append('g').attr('class', 'dots');

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 12]);
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines)

    dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
        .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
    });

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    // Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    createBrushSelector(svg)

   }

   function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
  }
  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }

  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }

  function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d),
    );
    renderSelectionCount(selection)
  }
  
  function isCommitSelected(selection, commit) { 
    if (!selection) { return false; } 
    const [x0, x1] = selection.map((d) => d[0]); 
    const [y0, y1] = selection.map((d) => d[1]); 
    const x = xScale(commit.datetime); 
    const y = yScale(commit.hourFrac); 
    return x >= x0 && x <= x1 && y >= y0 && y <= y1; 
}
  

  function createBrushSelector(svg) {
    //d3.select(svg).call(d3.brush().on('start brush end', brushed));
    svg.call(d3.brush().on('start brush end', brushed));
    // Raise dots and everything after overlay
    //svg.selectAll('.dots').raise();
    svg.selectAll('.dots, .overlay ~ *').raise();
  }

  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }
  


let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

console.log(commits)
