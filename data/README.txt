# How to add a new dataset to the Digital Data Playground
#
# 1. Place a CSV in the data/ folder, e.g. data/my_dataset.csv
# 2. Register it in js/charts.js inside the DATASETS object:
#
#    my_id: {
#      name: "My Dataset Title",
#      file: "data/my_dataset.csv",
#      source: "Source name",
#      description: "Short description",
#      processData: (rows) => {
#        // Return chart-ready arrays from PapaParse rows
#        return {
#          x: [...],
#          y: [...],
#          scatter: [[x, y], ...],   // optional but recommended
#          categories: [{ name, value }, ...], // optional (used by pie charts)
#          xName: "X label",
#          yName: "Y label",
#          unit: ""
#        };
#      },
#      insights: {
#        line: "...",
#        bar: "...",
#        scatter: "...",
#        pie: "...",
#        histogram: "..."
#      }
#    }
#
# 3. Add an option in index.html:
#    <option value="my_id">My Dataset Title</option>
#    inside #datasetSelect
#
# 4. (Optional) Add related facts in data/facts.json with "dataset": "my_id"
#
# Notes:
# - No backend required. CSVs are loaded in the browser via PapaParse.
# - Keep CSVs reasonably small (ideally under ~1–2 MB) for GitHub Pages / mobile.
# - Test locally with: python -m http.server 8765
#   then open http://127.0.0.1:8765/#playground
#   (file:// will not load CSV/JSON via fetch)
