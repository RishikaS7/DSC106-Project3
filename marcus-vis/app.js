/* D3 renders both charts from the unrounded, packaged local winter series. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
if (!window.d3 || !window.CLIMATE_DATA) {
  $('error').hidden=false; $('error').textContent='Could not load D3 or the local data. Check your internet connection and upload index.html, style.css, app.js and data.js together.'; return;
}
const ids=['london','berlin','minneapolis','montreal','beijing','sapporo'];
const names=Object.fromEntries(ids.map(id=>[id,id[0].toUpperCase()+id.slice(1)]));
const descriptions={london:'mild, ocean-influenced winters',berlin:'historically near-freezing winters',minneapolis:'cold, inland winters',montreal:'cold winters in eastern North America',beijing:'cold, dry winters',sapporo:'snowy, ocean-influenced winters*'};
const locationColor=d3.scaleOrdinal(ids,['#0072b2','#a46c00','#00896b','#8b4799','#c95100','#4c6070']);
const scenarioColor={ssp126:'#187b9d',ssp585:'#d34b36',historical:'#64748b'};
const scenarioName={ssp126:'SSP1-2.6',ssp585:'SSP5-8.5',historical:'Historical'};
const rows=CLIMATE_DATA.winters.map(([region,scenario,year,annual,smooth])=>({region,scenario,year,annual,smooth}));
const lookup=d3.group(rows,d=>d.region,d=>d.scenario);
const state={region:'all',scenario:'ssp585',measure:'smooth',year:2100,future:false};
const tip=$('tooltip');
const fmt=v=>v==null?'Unavailable':`${d3.format('.2f')(v)}°C`;
function showTip(event,text){tip.textContent=text;tip.hidden=false;const rect=event.currentTarget.getBoundingClientRect();const px=event.clientX || rect.x+rect.width/2,py=event.clientY || rect.y;tip.style.left=`${Math.max(8,Math.min(px+14,window.innerWidth-tip.offsetWidth-12))}px`;tip.style.top=`${Math.max(8,Math.min(py+15,window.innerHeight-tip.offsetHeight-12))}px`;}
function hideTip(){tip.hidden=true;}
function text(svg,x,y,value,attrs={}){const t=svg.append('text').attr('x',x).attr('y',y).text(value);for(const[k,v]of Object.entries(attrs))t.attr(k,v);return t;}
function axis(svg,scale,orient,x,y){return svg.append('g').attr('transform',`translate(${x},${y})`).call(orient(scale).tickSizeOuter(0));}
let yearScale;
function drawTrajectory(){
  hideTip();
  const svg=d3.select('#trajectory');svg.selectAll('*').remove();
  const left=65,right=760,top=45,bottom=505;
  const start=state.future?2015:state.measure==='smooth'?1970:1951;
  yearScale=d3.scaleLinear().domain([start,2100]).range([left,right]);
  const y=d3.scaleLinear().domain([-16,12]).range([bottom,top]); // fixed across selections to preserve comparisons
  const selected=state.region==='all'?ids:[state.region];
  const scenarios=state.scenario==='both'?['ssp126','ssp585']:[state.scenario];
  const series=[];
  selected.forEach(region=>{
    if(state.region!=='all'&&!state.future)series.push({region,scenario:'historical',color:scenarioColor.historical,values:lookup.get(region).get('ssp126').filter(d=>d.year<=2014)});
    scenarios.forEach(scenario=>series.push({region,scenario,color:state.region==='all'?locationColor(region):scenarioColor[scenario],values:lookup.get(region).get(scenario).filter(d=>state.region==='all'||d.year>=2014)}));
  });
  svg.append('title').text(`Winter temperatures: ${state.region==='all'?'six locations':names[state.region]}, ${state.scenario}`);
  axis(svg,y,d3.axisLeft,left,0).call(g=>g.selectAll('.tick line').attr('x2',right-left).attr('stroke-opacity',.5));
  axis(svg,yearScale,d3.axisBottom,0,bottom).call(d3.axisBottom(yearScale).ticks(8).tickFormat(d3.format('d')));
  text(svg,410,555,state.measure==='smooth'?'Winter year (end of 20-winter window)':'Winter year',{'text-anchor':'middle'});
  text(svg,17,275,'DJF air temperature (°C)',{'transform':'rotate(-90 17 275)','text-anchor':'middle'});
  svg.append('line').attr('x1',left).attr('x2',right+15).attr('y1',y(0)).attr('y2',y(0)).attr('stroke','#16334b').attr('stroke-dasharray','5 4');
  text(svg,right+22,y(0)+4,'Freezing point: 0°C / 32°F');
  if(!state.future){svg.append('line').attr('x1',yearScale(2014.5)).attr('x2',yearScale(2014.5)).attr('y1',top).attr('y2',bottom).attr('stroke','#718a9d').attr('stroke-dasharray','3 4');text(svg,yearScale(2014.5)+7,top-12,'Projections begin');}
  const line=d3.line().defined(d=>d[state.measure]!=null).x(d=>yearScale(d.year)).y(d=>y(d[state.measure]));
  const endpoints=[];
  for(const s of series){
    const values=s.values.filter(d=>d.year>=start);
    svg.append('path').datum(values).attr('d',line).attr('fill','none').attr('stroke',s.color).attr('stroke-width',state.measure==='smooth'?2.8:1.3);
    const last=values.at(-1);if(last&&last.year===2100)endpoints.push({...s,value:last[state.measure]});
  }
  let previous=-Infinity;
  endpoints.sort((a,b)=>b.value-a.value).forEach(s=>{
    // Label positions are in screen coordinates; leaders retain the true endpoints.
    const labelY=Math.max(y(s.value),previous+40);previous=labelY;
    svg.append('path').attr('d',`M${right},${y(s.value)}L${right+15},${labelY}`).attr('stroke',s.color).attr('fill','none');
    const label=state.region==='all'?names[s.region]:scenarioName[s.scenario];
    text(svg,right+22,labelY+4,label,{'style':`fill:${s.color};font-weight:650`});
    if(state.region==='all')text(svg,right+22,labelY+20,descriptions[s.region],{'style':`fill:${s.color};font-size:11px`});
  });
  const cursor=svg.append('line').attr('id','year-cursor').attr('y1',top).attr('y2',bottom).attr('stroke','#16334b').attr('stroke-opacity',.35);
  const hover=svg.append('rect').attr('x',left).attr('y',top).attr('width',right-left).attr('height',bottom-top).attr('fill','transparent');
  hover.on('pointermove',function(event){state.year=Math.max(start,Math.min(2100,Math.round(yearScale.invert(d3.pointer(event,this)[0]))));updateReadout();});
  $('year').min=start;state.year=Math.max(start,state.year);$('year').value=state.year;
  $('chart-context').textContent=`${state.region==='all'?'Colors identify locations.':'Colors identify pathways; gray is shared historical data.'} ${state.measure==='smooth'?'Trailing 20-winter means; 2100 represents 2081–2100.':'Each value is one calendar-day-weighted DJF winter.'} Vertical scales stay fixed across selections. Hover or use the year slider to inspect values.`;
  function updateReadout(){
    $('year').value=state.year;$('year-label').textContent=state.year;
    cursor.attr('x1',yearScale(state.year)).attr('x2',yearScale(state.year));
    const values=[];
    for(const region of selected){
      for(const scenario of scenarios){
        // Historical records are identical and must not appear twice in a comparison.
        if(state.year<=2014&&scenario!==scenarios[0])continue;
        const r=lookup.get(region).get(scenario).find(d=>d.year===state.year);
        values.push(`${names[region]}${state.region==='all'?'':` · ${state.year<=2014?'Historical':scenarioName[scenario]}`}: ${fmt(r?.[state.measure])}`);
      }
    }
    $('readout').replaceChildren();const strong=document.createElement('strong');strong.textContent=`Winter ${state.year}${state.measure==='smooth'?` · mean of ${state.year-19}–${state.year}`:''}`;$('readout').append(strong);
    const list=document.createElement('div');list.className='value-list';for(const value of values){const span=document.createElement('span');span.textContent=value;list.append(span);}$('readout').append(list);
  }
  $('year').oninput=()=>{state.year=+$('year').value;updateReadout();};updateReadout();
}
// Period comparisons are recomputed from the same unrounded annual means.
const comparisons=ids.map(region=>{
  const series=lookup.get(region),baseline=d3.mean(series.get('ssp126').filter(d=>d.year>=1995&&d.year<=2014),d=>d.annual);
  const result={region,baseline};for(const scenario of ['ssp126','ssp585'])result[scenario]=d3.mean(series.get(scenario).filter(d=>d.year>=2081),d=>d.annual)-baseline;
  result.gap=result.ssp585-result.ssp126;return result;
});
function drawMagnitude(){
  hideTip();const svg=d3.select('#magnitude');svg.selectAll('*').remove();
  const ordered=[...comparisons];if($('sort').value==='gap')ordered.sort((a,b)=>b.gap-a.gap);
  const x=d3.scaleLinear().domain([0,7.5]).range([315,1025]),y=d3.scalePoint().domain(ordered.map(d=>d.region)).range([65,415]);
  axis(svg,x,d3.axisBottom,0,465).call(g=>g.selectAll('.tick line').attr('y2',-420).attr('stroke-opacity',.6));
  text(svg,670,515,'Change in mean winter temperature (°C)',{'text-anchor':'middle'});
  for(const d of ordered){
    text(svg,290,y(d.region)-4,names[d.region],{'text-anchor':'end','style':'font-weight:650;fill:#16334b'});
    text(svg,290,y(d.region)+14,descriptions[d.region],{'text-anchor':'end','style':'font-size:11px'});
    svg.append('line').attr('x1',x(d.ssp126)).attr('x2',x(d.ssp585)).attr('y1',y(d.region)).attr('y2',y(d.region)).attr('stroke','#b0c1ce').attr('stroke-width',4);
    const message=`${names[d.region]}: SSP1-2.6 warms ${fmt(d.ssp126)}; SSP5-8.5 warms ${fmt(d.ssp585)}. Scenario difference: ${fmt(d.gap)}. Changes compare 2081–2100 with 1995–2014.`;
    for(const scenario of ['ssp126','ssp585']){
      const circle=svg.append('circle').attr('cx',x(d[scenario])).attr('cy',y(d.region)).attr('r',8).attr('fill',scenarioColor[scenario]).attr('tabindex',0).attr('role','img').attr('aria-label',message);
      circle.on('pointerenter focus',function(event){$('comparison').textContent=message;showTip(event,message);}).on('pointermove',function(event){showTip(event,message);}).on('pointerleave blur',hideTip);
      circle.append('title').text(message);
      text(svg,x(d[scenario]),y(d.region)-17,`${d3.format('.1f')(d[scenario])}°`,{'text-anchor':'middle','style':'fill:#16334b'});
    }
  }
}
$('location').onchange=()=>{state.region=$('location').value;if(state.region==='all'&&state.scenario==='both'){state.scenario='ssp585';$('scenario').value='ssp585';}drawTrajectory();};
$('scenario').onchange=()=>{state.scenario=$('scenario').value;if(state.scenario==='both'&&state.region==='all'){state.region='berlin';$('location').value='berlin';}drawTrajectory();};
$('measure').onchange=()=>{state.measure=$('measure').value;drawTrajectory();};
$('future').onchange=()=>{state.future=$('future').checked;drawTrajectory();};
$('sort').onchange=drawMagnitude;
drawTrajectory();drawMagnitude();
})();
