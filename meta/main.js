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

    const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

    const yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

    const dots = svg.append('g').attr('class', 'dots');

    dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
        renderTooltipContent(commit);
    })
    .on('mouseleave', () => {
        // TODO: Hide the tooltip
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
  
   

  
  
  
  

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

console.log(commits)
