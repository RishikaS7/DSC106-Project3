// Yagna's heatmap, from yagna-vis/index.html. Only the data path differs.
(async () => {
  const status = document.getElementById('status');
  try {
    const response = await fetch('yagna-vis/data/winter_temperature_plot.json');
    if (!response.ok) throw new Error(`HTTP ${response.status} while loading data`);
    const figure = await response.json();
    if (!window.Plotly) throw new Error('Plotly could not load from its CDN');
    // Preserve the notebook's title, colorscale, range, axes and underlying grid.
    // Only adapt the fixed notebook width for responsive browser display.
    const layout = { ...figure.layout, autosize: true, width: undefined, height: 550 };
    await Plotly.newPlot('heatmap', figure.data, layout, {
      ...figure.config,
      responsive: true,
      displaylogo: false
    });
    status.remove();
  } catch (error) {
    status.textContent = `Could not load the heatmap: ${error.message}. Serve this folder using a local web server or GitHub Pages (not file://).`;
    console.error(error);
  }
})();
