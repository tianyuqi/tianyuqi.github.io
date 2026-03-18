---
title: Testing D3 Data Visualizations
date: 2026-03-02
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

## Monthly Word Count

The chart below shows a fictional monthly word count across eight months, rendered with D3.js.

<div id="d3-chart" style="margin: 2rem 0; overflow: visible;"></div>

<script>
(function () {
  const data = [
    { month: 'Jul', words: 4200 },
    { month: 'Aug', words: 6800 },
    { month: 'Sep', words: 3100 },
    { month: 'Oct', words: 7500 },
    { month: 'Nov', words: 5900 },
    { month: 'Dec', words: 2800 },
    { month: 'Jan', words: 8200 },
    { month: 'Feb', words: 6100 },
  ];

  const margin = { top: 24, right: 24, bottom: 44, left: 64 };
  const containerWidth = document.getElementById('d3-chart').offsetWidth || 600;
  const width  = containerWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3.select('#d3-chart')
    .append('svg')
      .attr('width',  width  + margin.left + margin.right)
      .attr('height', height + margin.top  + margin.bottom)
    .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.month))
    .range([0, width])
    .padding(0.35);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.words) * 1.15])
    .range([height, 0]);

  // Horizontal gridlines
  svg.append('g')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
    .call(g => g.select('.domain').remove())
    .selectAll('line')
      .style('stroke', '#FFE9A3')
      .style('stroke-width', '1px');

  // X axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .call(g => g.select('.domain').style('stroke', '#1B4371').style('stroke-width', '2px'))
    .selectAll('text')
      .attr('dy', '1.2em')
      .style('fill', '#1B4371')
      .style('font-family', '"Space Mono", monospace')
      .style('font-size', '12px');

  // Y axis
  svg.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d / 1000}k`))
    .call(g => g.select('.domain').remove())
    .selectAll('text')
      .style('fill', '#5A7AA0')
      .style('font-family', '"Space Mono", monospace')
      .style('font-size', '11px');

  // Bars with enter animation
  svg.selectAll('.bar')
    .data(data)
    .enter().append('rect')
      .attr('x',     d => x(d.month))
      .attr('width', x.bandwidth())
      .attr('y',      height)
      .attr('height', 0)
      .style('fill', '#1B4371')
    .transition()
      .duration(700)
      .delay((d, i) => i * 75)
      .ease(d3.easeCubicOut)
      .attr('y',      d => y(d.words))
      .attr('height', d => height - y(d.words));

  // Value labels that appear after bars animate in
  svg.selectAll('.label')
    .data(data)
    .enter().append('text')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y(d.words) - 6)
      .attr('text-anchor', 'middle')
      .style('fill', '#1B4371')
      .style('font-family', '"Space Mono", monospace')
      .style('font-size', '10px')
      .style('opacity', 0)
      .text(d => `${(d.words / 1000).toFixed(1)}k`)
    .transition()
      .delay((d, i) => i * 75 + 700)
      .duration(300)
      .style('opacity', 1);
}());
</script>

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Writing Quality Survey

A diverging stacked bar chart showing fictional Likert-scale survey responses across five writing dimensions. Positive responses stack right of centre; negative stack left; neutral straddles the midpoint.

<div id="d3-diverging" style="margin: 2rem 0; overflow: visible;"></div>

<script>
(function () {
  const questions = ['Draft quality', 'Research depth', 'Editing time', 'Engagement', 'Revisions'];
  const categories = ['Strongly agree', 'Agree', 'Neutral', 'Disagree', 'Strongly disagree'];
  const colors = ['#1B4371', '#4A7BA8', '#C8D8E8', '#D4A017', '#8B5E00'];

  // Each row sums to 100 (SA, A, N, D, SD)
  const raw = [
    [28, 35, 15, 14, 8],
    [15, 42, 18, 17, 8],
    [32, 28, 12, 20, 8],
    [10, 38, 22, 22, 8],
    [22, 30, 20, 18, 10],
  ];

  const margin = { top: 16, right: 130, bottom: 36, left: 120 };
  const containerWidth = document.getElementById('d3-diverging').offsetWidth || 600;
  const width  = containerWidth - margin.left - margin.right;
  const bandH  = 28;
  const bandP  = 14;
  const height = questions.length * (bandH + bandP) - bandP;

  const svg = d3.select('#d3-diverging')
    .append('svg')
      .attr('width',  containerWidth)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  // Compute [x0, x1] for every segment; zero is centre of neutral
  const segments = [];
  raw.forEach((row, qi) => {
    const base = -(row[4] + row[3] + row[2] / 2); // leftmost x
    let x = base;
    row.forEach((val, ci) => {
      segments.push({ qi, ci, x0: x, x1: x + val });
      x += val;
    });
  });

  const xExtent = d3.max(segments, d => Math.max(Math.abs(d.x0), Math.abs(d.x1)));

  const xScale = d3.scaleLinear()
    .domain([-xExtent, xExtent])
    .range([0, width]);

  const yScale = d3.scaleBand()
    .domain(d3.range(questions.length))
    .range([0, height])
    .paddingInner(bandP / (bandH + bandP));

  // Centre line
  svg.append('line')
    .attr('x1', xScale(0)).attr('x2', xScale(0))
    .attr('y1', -4).attr('y2', height + 4)
    .style('stroke', '#1B4371')
    .style('stroke-width', '2px');

  // Bars (fade in per row)
  svg.selectAll('.seg')
    .data(segments)
    .enter().append('rect')
      .attr('x',      d => xScale(Math.min(d.x0, d.x1)))
      .attr('y',      d => yScale(d.qi))
      .attr('width',  d => Math.abs(xScale(d.x1) - xScale(d.x0)))
      .attr('height', yScale.bandwidth())
      .style('fill',    d => colors[d.ci])
      .style('opacity', 0)
    .transition()
      .duration(500)
      .delay(d => d.qi * 90 + d.ci * 20)
      .style('opacity', 1);

  // Row labels
  svg.selectAll('.qlabel')
    .data(questions)
    .enter().append('text')
      .attr('x', -10)
      .attr('y', (d, i) => yScale(i) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('fill', '#1B4371')
      .style('font-family', '"Space Mono", monospace')
      .style('font-size', '11px')
      .text(d => d);

  // X axis
  svg.append('g')
    .attr('transform', `translate(0,${height + 6})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${Math.abs(Math.round(d))}%`))
    .call(g => g.select('.domain').remove())
    .selectAll('text')
      .style('fill', '#5A7AA0')
      .style('font-family', '"Space Mono", monospace')
      .style('font-size', '10px');

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${width + 14}, 0)`);
  categories.forEach((cat, ci) => {
    const g = legend.append('g').attr('transform', `translate(0,${ci * 22})`);
    g.append('rect').attr('width', 11).attr('height', 11).style('fill', colors[ci]);
    g.append('text')
      .attr('x', 15).attr('y', 9)
      .style('fill', '#1B4371')
      .style('font-family', '"Space Mono", monospace')
      .style('font-size', '9px')
      .text(cat);
  });
}());
</script>

Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Donec in efficitur leo, in commodo orci. Morbi porttitor, orci sed semper aliquam, urna mi feugiat tortor, non tincidunt libero turpis id arcu.

## Topic Influence Flows

A chord diagram showing bidirectional influence between five writing genres. The width of each ribbon is proportional to the volume of cross-influence between two groups.

<div id="d3-chord" style="margin: 2rem 0; display: flex; justify-content: center;"></div>

<script>
(function () {
  const groups = ['Fiction', 'Essays', 'Research', 'Poetry', 'Journalism'];
  const matrix = [
    //  Fi   Es   Re   Po   Jo
    [  0,  18,  12,   8,   5 ],  // Fiction
    [ 15,   0,  22,   6,  12 ],  // Essays
    [ 10,  20,   0,   4,  18 ],  // Research
    [  8,   5,   3,   0,   2 ],  // Poetry
    [  6,  14,  15,   3,   0 ],  // Journalism
  ];
  const colors = ['#1B4371', '#2A5780', '#4A7BA8', '#7AA0C8', '#A8C8E8'];

  const containerWidth = document.getElementById('d3-chord').offsetWidth || 600;
  const size        = Math.min(containerWidth, 460);
  const outerRadius = size / 2 - 52;
  const innerRadius = outerRadius - 22;

  const svg = d3.select('#d3-chord')
    .append('svg')
      .attr('width', size)
      .attr('height', size)
    .append('g')
      .attr('transform', `translate(${size / 2},${size / 2})`);

  const chordLayout = d3.chord()
    .padAngle(0.06)
    .sortSubgroups(d3.descending);

  const chords = chordLayout(matrix);

  const arc    = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  const ribbon = d3.ribbon().radius(innerRadius);

  // Ribbons
  svg.append('g')
    .selectAll('path')
    .data(chords)
    .enter().append('path')
      .attr('d', ribbon)
      .style('fill',         d => colors[d.source.index])
      .style('fill-opacity', 0)
      .style('stroke',       d => colors[d.source.index])
      .style('stroke-width', '0.5px')
      .style('stroke-opacity', 0)
    .transition()
      .duration(700)
      .delay((d, i) => i * 40)
      .style('fill-opacity',   0.55)
      .style('stroke-opacity', 0.25);

  // Outer arcs
  const grp = svg.append('g')
    .selectAll('g')
    .data(chords.groups)
    .enter().append('g');

  grp.append('path')
    .style('fill',    d => colors[d.index])
    .style('stroke',  d => colors[d.index])
    .attr('d', arc)
    .style('opacity', 0)
    .transition()
      .duration(500)
      .delay(d => d.index * 80)
      .style('opacity', 1);

  // Labels
  grp.append('text')
    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr('dy', '0.35em')
    .attr('transform', d => [
      `rotate(${d.angle * 180 / Math.PI - 90})`,
      `translate(${outerRadius + 10})`,
      d.angle > Math.PI ? 'rotate(180)' : '',
    ].join(' '))
    .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
    .style('fill',        '#1B4371')
    .style('font-family', '"Space Mono", monospace')
    .style('font-size',   '11px')
    .text(d => groups[d.index]);
}());
</script>

## Writing Taxonomy Sunburst

An interactive zoomable sunburst showing a hierarchy of writing genres. Click any inner ring segment to drill down; click the centre to go back up.

<div id="d3-sunburst" style="margin: 2rem 0; display: flex; justify-content: center;"></div>

<script>
(function () {
  const data = {
    name: 'Writing',
    children: [
      { name: 'Fiction', children: [
        { name: 'Short stories', value: 32 },
        { name: 'Novels',        value: 28 },
        { name: 'Flash fiction', value: 14 },
      ]},
      { name: 'Non-fiction', children: [
        { name: 'Essays',      value: 38 },
        { name: 'Journalism',  value: 22 },
        { name: 'Research',    value: 30 },
      ]},
      { name: 'Poetry', children: [
        { name: 'Lyric',        value: 18 },
        { name: 'Narrative',    value: 12 },
        { name: 'Experimental', value: 8  },
      ]},
      { name: 'Technical', children: [
        { name: 'Docs',      value: 25 },
        { name: 'Tutorials', value: 20 },
        { name: 'Reviews',   value: 15 },
      ]},
    ],
  };

  const topColors = {
    'Fiction':     '#1B4371',
    'Non-fiction': '#2A5780',
    'Poetry':      '#4A7BA8',
    'Technical':   '#7AA0C8',
  };

  function nodeColor(d) {
    if (d.depth === 0) return 'none';
    const top = d.ancestors().find(a => a.depth === 1);
    const base = topColors[top.data.name];
    return d.depth === 1 ? base : d3.interpolateRgb(base, '#FFFACD')(0.52);
  }

  const containerWidth = document.getElementById('d3-sunburst').offsetWidth || 600;
  const size   = Math.min(containerWidth, 480);
  const radius = size / 2;

  const root = d3.hierarchy(data)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  d3.partition().size([2 * Math.PI, root.height + 1])(root);
  root.each(d => d.current = { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 });

  const levels = root.height + 1; // 3 for this dataset

  function r(y) { return y * radius / levels; }

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.008))
    .padRadius(radius / 2)
    .innerRadius(d => r(d.y0))
    .outerRadius(d => Math.max(r(d.y0), r(d.y1) - 1.5));

  const svg = d3.select('#d3-sunburst')
    .append('svg')
      .attr('width',  size)
      .attr('height', size)
    .append('g')
      .attr('transform', `translate(${radius},${radius})`);

  // Slice paths
  const path = svg.append('g')
    .selectAll('path')
    .data(root.descendants().slice(1))
    .enter().append('path')
      .attr('fill',         d => nodeColor(d))
      .attr('fill-opacity', d => arcVisible(d.current) ? (d.children ? 0.88 : 0.68) : 0)
      .attr('d', d => arc(d.current))
      .style('cursor', d => d.children ? 'pointer' : 'default')
      .on('mouseover', function (event, d) {
        if (arcVisible(d.current))
          d3.select(this).attr('fill-opacity', d.children ? 1 : 0.85);
      })
      .on('mouseout', function (event, d) {
        d3.select(this).attr('fill-opacity',
          arcVisible(d.current) ? (d.children ? 0.88 : 0.68) : 0);
      })
      .on('click', (event, d) => { if (d.children) clicked(event, d); });

  // Arc labels
  const label = svg.append('g')
    .attr('pointer-events', 'none')
    .attr('text-anchor', 'middle')
    .selectAll('text')
    .data(root.descendants().slice(1))
    .enter().append('text')
      .attr('dy', '0.35em')
      .attr('fill-opacity', d => +labelVisible(d.current))
      .attr('transform',    d => labelTransform(d.current))
      .style('font-size',   d => d.depth === 1 ? '11px' : '9px')
      .style('font-family', '"Space Mono", monospace')
      .style('fill',        d => d.depth === 1 ? '#FFFACD' : '#1B4371')
      .text(d => d.data.name);

  // Centre circle — click to go up
  const centerR = r(1);
  svg.append('circle')
    .datum(root)
    .attr('r', centerR)
    .attr('fill', '#1B4371')
    .attr('fill-opacity', 0.08)
    .attr('stroke', '#1B4371')
    .attr('stroke-width', '1.5px')
    .attr('stroke-opacity', 0.25)
    .style('cursor', 'pointer')
    .on('click', clicked);

  const centerText = svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .style('font-family', '"Space Mono", monospace')
    .style('font-size', '10px')
    .style('fill', '#1B4371')
    .style('pointer-events', 'none')
    .text(data.name);

  // Zoom into p; clicking centre passes its parent as p
  function clicked(event, p) {
    // Update centre circle datum so next centre-click goes one level up
    svg.select('circle').datum(p.parent || root);

    // Update centre label
    centerText.text(p.depth > 0 ? p.data.name : data.name);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth),
    });

    const t = svg.transition().duration(750).ease(d3.easeCubicInOut);

    path.transition(t)
      .tween('data', d => {
        const i = d3.interpolate(d.current, d.target);
        return t => d.current = i(t);
      })
      .filter(function (d) {
        return +this.getAttribute('fill-opacity') || arcVisible(d.target);
      })
      .attr('fill-opacity', d => arcVisible(d.target) ? (d.children ? 0.88 : 0.68) : 0)
      .attrTween('d', d => () => arc(d.current));

    label.filter(function (d) {
      return +this.getAttribute('fill-opacity') || labelVisible(d.target);
    }).transition(t)
      .attr('fill-opacity', d => +labelVisible(d.target))
      .attrTween('transform', d => () => labelTransform(d.current));
  }

  function arcVisible(d) {
    return d.y1 <= levels && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= levels && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.06;
  }

  function labelTransform(d) {
    const angle = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const dist  = (r(d.y0) + r(d.y1)) / 2;
    return `rotate(${angle - 90}) translate(${dist},0) rotate(${angle < 180 ? 0 : 180})`;
  }
}());
</script>

### Observations

Vivamus lacinia odio vitae vestibulum vestibulum. Donec in efficitur leo, in commodo orci. Morbi porttitor, orci sed semper aliquam, urna mi feugiat tortor, non tincidunt libero turpis id arcu. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.

- **January** had the highest output at 8.2k words
- Output dipped in **December**, possibly due to holidays
- The overall trend shows growth from mid-year onward
- **Research** and **Essays** have the strongest mutual influence in the chord diagram

> "The first draft of anything is garbage." — Hemingway (probably)

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis molestie dictum semper, nisi lorem egestas odio, at malesuada neque turpis lacus scelerisque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
