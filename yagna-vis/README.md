# CMIP6 winter temperature heatmap

This folder reproduces the interactive Plotly heatmap saved in `project_3_checkpoint.ipynb` (cell 12) without requiring Python or a CMIP6 download in the browser.

## Contents
- `index.html`: webpage, styling, and Plotly loader
- `data/winter_temperature_plot.json`: the actual plot traces and layout exported from the notebook, including its 144 × 192 temperature-change grid

## View locally
From this directory run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/ in your browser. Do not double-click `index.html`: browsers commonly block `fetch()` from `file://`.

## Publish to GitHub Pages
Commit **both** `index.html` and `data/winter_temperature_plot.json` to the same folder in your repository. In repository Settings → Pages, choose Deploy from a branch, then select the appropriate branch and `/ (root)` (or `/docs` if you put both files there). The Pages URL will serve the webpage.

## Provenance
CMIP6 ACCESS-CM2 / r1i1p1f1 / gn, SSP2-4.5; difference in DJF mean temperature, 2041–2060 minus 1995–2014. Exported directly from the notebook's saved Plotly figure, preserving the original 144 × 192 grid and Plotly color settings. Data values are climate-model output, not observed temperatures. The HTML changes the plot width responsively, while keeping the plotted values and visual settings.

Plotly is loaded from a CDN, so visitors need an internet connection. The CMIP6-derived JSON is stored in the repo; there are no runtime requests to the CMIP6 archive.
