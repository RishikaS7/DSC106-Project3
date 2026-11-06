// Rishika's chart, from rishika-vis/index.html. Only the data path differs.
(() => {
const W = 960, H = 430, m = { top: 34, right: 24, bottom: 42, left: 56 };
const COL = { warmer: "#d6533c", within: "#aebdca", colder: "#2f80c9" };
const NAME = { ssp126: "cut emissions", ssp585: "keep burning fossil fuels" };
const deg = v => `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)} °C`;
const state = { born: 2005, k: "ssp585" };
const tip = d3.select("#tip");
let S, x, y, svg, G = {}, LAST;

d3.csv("rishika-vis/data/winter_djf.csv", d3.autoType).then(rows => {
  const hist = rows.filter(r => r.scenario === "historical");
  const last = d3.max(hist, r => r.winter_year);
  S = {};
  for (const k of ["ssp126", "ssp585"])
    S[k] = hist.concat(rows.filter(r => r.scenario === k && r.winter_year > last))
      .map(r => ({ year: r.winter_year, t: r.tas_c })).sort((a, b) => a.year - b.year);
  LAST = last;
  draw(); update(false);
  d3.select("#born").on("input", function () { state.born = +this.value; update(true); });
  d3.selectAll("#seg button").on("click", function () {
    state.k = this.dataset.k;
    d3.selectAll("#seg button").classed("active", function () { return this.dataset.k === state.k; });
    update(true);
  });
}).catch(() => d3.select("#summary").text("Couldn't load rishika-vis/data/winter_djf.csv."));

function windows(k) {
  const b = state.born, s = S[k];
  const child = s.filter(d => d.year >= b + 5 && d.year <= b + 14);
  const later = s.filter(d => d.year >= b + 60 && d.year <= b + 79);
  const lo = d3.min(child, d => d.t), hi = d3.max(child, d => d.t);
  const cls = d => d.t > hi ? "warmer" : d.t < lo ? "colder" : "within";
  const count = c => later.filter(d => cls(d) === c).length;
  return { child, later, lo, hi, cls, warmer: count("warmer"), within: count("within"), colder: count("colder") };
}

function draw() {
  svg = d3.select("#chart");
  const all = [...S.ssp126, ...S.ssp585];
  x = d3.scaleLinear().domain([1851, 2100]).range([m.left, W - m.right]);
  y = d3.scaleLinear().domain(d3.extent(all, d => d.t)).nice().range([H - m.bottom, m.top]);
  const bottom = H - m.bottom;

  svg.append("g").attr("class", "grid").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickSize(-(W - m.left - m.right)).tickFormat(""));
  G.band = svg.append("rect").attr("x", m.left).attr("width", W - m.left - m.right).attr("fill", "#e3f0fa");
  G.childWin = svg.append("rect").attr("y", m.top - 6).attr("height", bottom - m.top + 6).attr("fill", "#0f2a3d").attr("opacity", .05);
  G.laterWin = svg.append("rect").attr("y", m.top - 6).attr("height", bottom - m.top + 6).attr("fill", "#0f2a3d").attr("opacity", .05);
  G.childLab = svg.append("text").attr("class", "note").attr("y", m.top - 12).attr("text-anchor", "middle").style("font-weight", 600).attr("fill", "#0f2a3d");
  G.laterLab = svg.append("text").attr("class", "note").attr("y", m.top - 12).attr("text-anchor", "middle").style("font-weight", 600).attr("fill", "#0f2a3d");
  G.bandLab = svg.append("text").attr("class", "note").attr("x", m.left + 8).attr("fill", "#3d7fb3");

  svg.append("line").attr("x1", x(LAST + .5)).attr("x2", x(LAST + .5)).attr("y1", m.top).attr("y2", bottom)
    .attr("stroke", "#9fb4c5").attr("stroke-dasharray", "2 3");
  svg.append("text").attr("class", "note").attr("x", x(LAST + .5) + 5).attr("y", bottom - 6).text("Projections →");

  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${bottom})`)
    .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")).tickSizeOuter(0));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => `${d < 0 ? "−" : ""}${Math.abs(d)}°`).tickSizeOuter(0));
  svg.append("text").attr("class", "note").attr("transform", `translate(14,${(m.top + bottom) / 2}) rotate(-90)`)
    .attr("text-anchor", "middle").text("Average winter temperature, °C");

  G.dots = svg.append("g");
}

function update(animate) {
  const dur = animate ? 350 : 0, b = state.born, w = windows(state.k), other = windows(state.k === "ssp585" ? "ssp126" : "ssp585");
  d3.select("#bornOut").text(b);

  G.band.transition().duration(dur).attr("y", y(w.hi)).attr("height", y(w.lo) - y(w.hi));
  G.bandLab.transition().duration(dur).attr("y", y(w.hi) - 5).text(`Your childhood range: ${deg(w.lo)} to ${deg(w.hi)}`);
  const c0 = b + 5, c1 = b + 14, l0 = b + 60, l1 = Math.min(b + 79, 2100);
  G.childWin.transition().duration(dur).attr("x", x(c0 - .5)).attr("width", x(c1 + .5) - x(c0 - .5));
  G.childLab.transition().duration(dur).attr("x", x((c0 + c1) / 2)).text(`Childhood ${c0}–${c1}`);
  G.laterWin.transition().duration(dur).attr("x", x(l0 - .5)).attr("width", Math.max(0, x(l1 + .5) - x(l0 - .5)));
  G.laterLab.transition().duration(dur).attr("x", x((l0 + l1) / 2)).text(`Age 60–${l1 - b}: ${l0}–${l1}`);

  const childYears = new Set(w.child.map(d => d.year)), laterYears = new Set(w.later.map(d => d.year));
  G.dots.selectAll("circle").data(S[state.k], d => d.year).join("circle")
    .attr("cx", d => x(d.year)).attr("r", d => laterYears.has(d.year) ? 5 : 3.4)
    .attr("stroke", d => childYears.has(d.year) ? "#0f2a3d" : "#fff").attr("stroke-width", d => childYears.has(d.year) ? 1.6 : .8)
    .on("mouseenter", (ev, d) => {
      const c = w.cls(d), age = d.year - b;
      tip.html(`<b>Winter ${d.year}</b> <span class="dim">· you’d be ${age < 0 ? "not yet born" : age}</span><br>${deg(d.t)} · ` +
        (c === "warmer" ? "warmer than any winter of your childhood" : c === "colder" ? "colder than any winter of your childhood" : "like the winters you grew up with"))
        .style("opacity", 1).style("left", ev.clientX + 14 + "px").style("top", ev.clientY - 52 + "px");
    })
    .on("mouseleave", () => tip.style("opacity", 0))
    .transition().duration(dur)
    .attr("cy", d => y(d.t))
    .attr("fill", d => COL[w.cls(d)])
    .attr("opacity", d => laterYears.has(d.year) || childYears.has(d.year) ? 1 : .55);

  // the sentence
  const n = w.later.length, past = l1 <= LAST;
  const lead = `Born in <b>${b}</b>, your childhood winters ran from ${deg(w.lo)} to ${deg(w.hi)}. `;
  let body;
  if (past) {
    body = `Your winters at age 60–79 (${l0}–${l1}) have already happened: <b class="warm">${w.warmer} of ${n}</b> were warmer than any you grew up with.`;
  } else {
    const k1 = state.k, k2 = k1 === "ssp585" ? "ssp126" : "ssp585";
    body = `At age 60–79 (${l0}–${l1}${l1 < b + 79 ? ", data ends 2100" : ""}), if we <b>${NAME[k1]}</b>, <b class="warm">${w.warmer} of ${n}</b> winters will be warmer than any winter of your childhood. ` +
      `If we ${NAME[k2]} instead, it’s <b class="warm">${other.warmer} of ${n}</b>.`;
  }
  d3.select("#summary").html(lead + body);
}
})();
