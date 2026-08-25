(function () {
    const navy = '#1B4371';
    const blue = '#4A7BA8';
    const pale = '#D8E5F0';
    const gold = '#D4A017';
    const gray = '#5A7AA0';
    const grid = '#E7DFA7';
    const font = '"Space Mono", monospace';

    function frame(id, height, left = 96) {
        const el = document.getElementById(id);
        if (!el) return null;
        const width = Math.max(el.clientWidth || 680, 420);
        const margin = { top: 32, right: 18, bottom: 44, left };
        const svg = d3.select(el).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('role', 'img')
            .attr('aria-label', el.previousElementSibling?.textContent || 'Report data chart');
        return { svg, g: svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`), width: width - margin.left - margin.right, height: height - margin.top - margin.bottom, margin };
    }

    function legend(svg, series, width) {
        const item = svg.append('g').attr('transform', `translate(${Math.max(0, width - series.length * 95)},8)`);
        series.forEach((s, i) => {
            const g = item.append('g').attr('transform', `translate(${i * 95},0)`);
            g.append('rect').attr('width', 11).attr('height', 11).attr('fill', s.color);
            g.append('text').attr('x', 16).attr('y', 10).text(s.name).attr('fill', navy).style('font', `10px ${font}`);
        });
    }

    function groupedBars(id, data, series, options = {}) {
        const f = frame(id, options.height || Math.max(270, data.length * 48 + 95), options.left || 110);
        if (!f) return;
        const max = options.max || d3.max(data, d => d3.max(series, s => d[s.key]));
        const x = d3.scaleLinear().domain([0, max]).nice().range([0, f.width]);
        const y0 = d3.scaleBand().domain(data.map(d => d.label)).range([0, f.height]).padding(0.22);
        const y1 = d3.scaleBand().domain(series.map(s => s.key)).range([0, y0.bandwidth()]).padding(0.1);
        f.g.append('g').call(d3.axisBottom(x).ticks(5).tickSize(f.height).tickFormat(options.format || (d => d)))
            .call(g => g.select('.domain').remove()).call(g => g.selectAll('line').attr('stroke', grid))
            .call(g => g.selectAll('text').attr('fill', gray).style('font', `10px ${font}`).attr('dy', 16));
        f.g.append('g').call(d3.axisLeft(y0).tickSize(0)).call(g => g.select('.domain').remove())
            .call(g => g.selectAll('text').attr('fill', navy).style('font', `10px ${font}`).attr('dx', -5));
        const groups = f.g.selectAll('.group').data(data).join('g').attr('transform', d => `translate(0,${y0(d.label)})`);
        groups.selectAll('rect').data(d => series.map(s => ({ value: d[s.key], color: s.color }))).join('rect')
            .attr('y', (d, i) => y1(series[i].key)).attr('height', y1.bandwidth()).attr('x', 0).attr('width', 0).attr('fill', d => d.color)
            .transition().duration(650).attr('width', d => x(d.value));
        legend(f.svg, series, f.width + f.margin.left);
    }

    function lineChart(id, data, series, options = {}) {
        const f = frame(id, options.height || 330, options.left || 54);
        if (!f) return;
        const x = d3.scalePoint().domain(data.map(d => d.label)).range([0, f.width]);
        const y = d3.scaleLinear().domain(options.domain || [0, d3.max(data, d => d3.max(series, s => d[s.key]))]).nice().range([f.height, 0]);
        f.g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(-f.width).tickFormat(options.format || (d => d)))
            .call(g => g.select('.domain').remove()).call(g => g.selectAll('line').attr('stroke', grid))
            .call(g => g.selectAll('text').attr('fill', gray).style('font', `10px ${font}`));
        f.g.append('g').attr('transform', `translate(0,${f.height})`).call(d3.axisBottom(x).tickSize(0))
            .call(g => g.select('.domain').attr('stroke', navy)).call(g => g.selectAll('text').attr('fill', gray).style('font', `9px ${font}`).attr('dy', 15));
        series.forEach(s => {
            const line = d3.line().x(d => x(d.label)).y(d => y(d[s.key])).curve(d3.curveMonotoneX);
            const path = f.g.append('path').datum(data).attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', 3).attr('d', line);
            const length = path.node().getTotalLength();
            path.attr('stroke-dasharray', `${length} ${length}`).attr('stroke-dashoffset', length).transition().duration(900).attr('stroke-dashoffset', 0);
            f.g.selectAll(`.dot-${s.key}`).data(data).join('circle').attr('cx', d => x(d.label)).attr('cy', d => y(d[s.key])).attr('r', 3.5).attr('fill', s.color);
        });
        legend(f.svg, series, f.width + f.margin.left);
    }

    const two = [{ key: 'before', name: 'Earlier', color: pale }, { key: 'after', name: 'Jun 2026', color: navy }];
    groupedBars('chart-function', [
        ['Founder',14,30],['Engineering',12,30],['Product',12,34],['Design',6,22],['GTM',5,18]
    ].map(d => ({label:d[0],before:d[1],after:d[2]})), [{...two[0],name:'Jan 2026'},two[1]], {max:40,format:d=>`${d}%`});

    groupedBars('chart-executives', [
        ['Founder 201+',10,26],['Founder 51–200',15,27],['Founder 1–50',15,31],['CEO 201+',9,36],['CEO 51–200',15,25],['CEO 1–50',7,21],['CPO 201+',3,24],['CPO 51–200',10,26],['CPO 1–50',11,36],['CTO 201+',11,35],['CTO 51–200',12,28],['CTO 1–50',16,33]
    ].map(d => ({label:d[0],before:d[1],after:d[2]})), [{...two[0],name:'Jan 2026'},two[1]], {max:40,height:620,left:128,format:d=>`${d}%`});

    groupedBars('chart-size', [['1,001+',8,25],['201–1,000',9,27],['51–200',9,25],['1–50',8,23]].map(d=>({label:d[0],before:d[1],after:d[2]})), [{...two[0],name:'Jan 2026'},two[1]], {max:30,format:d=>`${d}%`});

    groupedBars('chart-work', [['Engineering',5,3,5],['Product',-1,0,1],['Design',3,3,2],['GTM',4,3,6],['Founder',17,7,26]].map(d=>({label:d[0],create:Math.max(0,d[1]),update:d[2],comment:d[3]})), [
        {key:'create',name:'Create',color:navy},{key:'update',name:'Update',color:blue},{key:'comment',name:'Comment',color:gold}
    ], {max:30,format:d=>`${d}m`});

    lineChart('chart-issues', [['Jun 24',0,605],['Jun 25',18,1095],['Jan 26',206,1601],['Apr 26',1038,2063],['Jul 26',2078,2532],['Aug 26',2435,2481]].map(d=>({label:d[0],agents:d[1],people:d[2]})), [
        {key:'agents',name:'Agents',color:navy},{key:'people',name:'People',color:gold}
    ], {format:d=>`${d/1000}m`});

    groupedBars('chart-planning', [['Engineering',0,1],['Product',0,1],['Design',0,1],['GTM',1,1],['Founder',1,0]].map(d=>({label:d[0],requests:d[1],docs:d[2]})), [
        {key:'requests',name:'Requests',color:blue},{key:'docs',name:'Docs',color:navy}
    ], {max:3,format:d=>`${d}m`});

    groupedBars('chart-ai-work', [['Engineering',1,2],['Product',1,5],['Design',0,3],['GTM',0,3],['Founder',2,4]].map(d=>({label:d[0],agents:d[1],chat:d[2]})), [
        {key:'agents',name:'Agent issues',color:blue},{key:'chat',name:'AI chat',color:navy}
    ], {max:6,format:d=>`${d}m`});

    groupedBars('chart-pr-roles', [['Founder',11,12,23],['Engineering',20,22,34],['Product',3,3,10],['Design',1,2,8],['GTM',1,1,3]].map(d=>({label:d[0],y24:d[1],y25:d[2],y26:d[3]})), [
        {key:'y24',name:'2024',color:pale},{key:'y25',name:'2025',color:blue},{key:'y26',name:'2026',color:navy}
    ], {max:40,format:d=>`${d}%`});

    lineChart('chart-pr-volume', [['Jun 24',0],['Jun 25',22],['Feb 26',27],['Mar 26',50],['May 26',80],['Jun 26',111]].map(d=>({label:d[0],change:d[1]})), [{key:'change',name:'PR change',color:navy}], {domain:[0,120],format:d=>`+${d}%`});

    lineChart('chart-agents', [['Jun 24',21,8],['Jun 25',28,8],['Jan 26',35,7],['Mar 26',49,9],['May 26',60,10],['Jun 26',65,10]].map(d=>({label:d[0],agents:d[1],traditional:d[2]})), [
        {key:'agents',name:'Agent teams',color:navy},{key:'traditional',name:'Traditional',color:gold}
    ], {domain:[0,70]});
}());
