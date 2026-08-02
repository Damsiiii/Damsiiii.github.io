# Rebuild playground markup & move it before Contact; fix scripts.
import re

with open("index.html", encoding="utf-8") as f:
    html = f.read()

NEW_PLAYGROUND = r'''
  <section id="playground" class="playground-section reveal">
    <div class="wrap">
      <div class="section-head">
        <span class="section-num">06</span>
        <h2 class="section-title">Digital Data Playground</h2>
        <div class="section-rule"></div>
      </div>

      <p class="playground-lead">
        Explore real-world datasets and discover hidden patterns through interactive visualization.
      </p>

      <div class="playground-grid">
        <!-- 1. Random Data Fact Generator -->
        <aside class="playground-card fact-card" aria-labelledby="fact-heading">
          <div class="playground-card-head">
            <span class="playground-kicker">01 — Facts</span>
            <h3 id="fact-heading">Random Data Fact Generator</h3>
          </div>

          <div id="factDisplay" class="fact-display">
            <span class="fact-badge" id="factCategory">Loading</span>
            <h4 class="fact-title" id="factTitle">Fetching a data fact…</h4>
            <p class="fact-desc" id="factDesc"></p>
            <div class="fact-meta" id="factSource"></div>
          </div>

          <div class="fact-actions">
            <button type="button" id="nextFactBtn" class="btn btn-solid fact-btn">
              Generate Random Fact
            </button>
            <button type="button" id="exploreFactBtn" class="btn btn-outline fact-btn">
              Explore This Data
            </button>
          </div>
        </aside>

        <!-- 2–4. Dataset explorer + visualization + insights -->
        <div class="playground-card viz-card" id="vizPanel" aria-labelledby="viz-heading">
          <div class="playground-card-head">
            <span class="playground-kicker">02 — Explore</span>
            <h3 id="viz-heading">Interactive Visualization</h3>
          </div>

          <div class="controls-bar" role="group" aria-label="Dataset and chart controls">
            <div class="control-group">
              <label for="datasetSelect">Dataset</label>
              <select id="datasetSelect" class="control-select">
                <option value="population">World Population</option>
                <option value="climate">Global Temperature</option>
                <option value="spotify">Spotify Songs</option>
                <option value="movies">Movies / Box Office</option>
                <option value="happiness">World Happiness</option>
              </select>
            </div>

            <div class="control-group">
              <label for="chartTypeSelect">Chart type</label>
              <select id="chartTypeSelect" class="control-select">
                <option value="line">Line</option>
                <option value="bar">Bar</option>
                <option value="scatter">Scatter</option>
                <option value="pie">Pie</option>
                <option value="histogram">Histogram</option>
              </select>
            </div>

            <button type="button" id="downloadChartBtn" class="btn btn-outline download-btn">
              Download Chart
            </button>
          </div>

          <div class="chart-shell">
            <div id="chartLoading" class="chart-loading" hidden>Loading dataset…</div>
            <div id="chartContainer" class="chart-container" role="img" aria-label="Interactive data chart"></div>
          </div>

          <div class="dataset-info-grid" aria-label="Dataset metadata">
            <div class="info-item">
              <div class="info-label">Dataset</div>
              <div class="info-val" id="infoName">—</div>
            </div>
            <div class="info-item">
              <div class="info-label">Source</div>
              <div class="info-val" id="infoSource">—</div>
            </div>
            <div class="info-item">
              <div class="info-label">Records</div>
              <div class="info-val" id="infoRecords">—</div>
            </div>
            <div class="info-item">
              <div class="info-label">Updated</div>
              <div class="info-val" id="infoUpdated">2026-08</div>
            </div>
          </div>

          <div class="insight-card" aria-live="polite">
            <div class="insight-header">Data insight</div>
            <p class="insight-text" id="insightText">Select a dataset to generate an insight.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
'''

# Remove existing playground section (wherever it is)
html2, n_pg = re.subn(
    r'\s*<section id="playground"[\s\S]*?</section>',
    '',
    html,
    count=1,
)
print("removed playground:", n_pg)

# Fix contact section number 06 -> 07
html2, n_num = re.subn(
    r'(<section id="contact">[\s\S]*?<span class="section-num">)06(</span>)',
    r'\g<1>07\g<2>',
    html2,
    count=1,
)
print("renumbered contact:", n_num)

# Insert playground before contact
contact_idx = html2.find('<section id="contact"')
if contact_idx < 0:
    raise SystemExit("contact section not found")
html2 = html2[:contact_idx] + NEW_PLAYGROUND + "\n" + html2[contact_idx:]

# Remove any orphaned main.js that sits between footer and leftover content,
# then normalize end-of-body scripts.
# First strip ALL trailing scripts/deps after footer (we'll re-add clean ones)
footer_end = html2.find("</footer>")
if footer_end < 0:
    raise SystemExit("footer not found")
footer_end += len("</footer>")

# Keep everything through footer, then clean body close
tail = html2[footer_end:]
# Remove scripts and playground leftovers from after footer; keep </body></html>
body_close = re.search(r"</body>\s*</html>\s*$", html2, re.I)
if not body_close:
    raise SystemExit("body/html close not found")

html2 = html2[:footer_end] + """

  <!-- Data Playground: PapaParse (CSV) + Apache ECharts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>
  <script src="js/main.js"></script>
  <script src="js/charts.js"></script>
</body>

</html>
"""

with open("index.html", "w", encoding="utf-8", newline="\n") as f:
    f.write(html2)

# Verify
with open("index.html", encoding="utf-8") as f:
    check = f.read()
for sid in ["about", "projects", "skills", "certifications", "education", "playground", "contact"]:
    print(sid, check.find('id="' + sid + '"'))
print("main.js count", check.count("js/main.js"))
print("charts.js count", check.count("js/charts.js"))
print("playground after footer?", check.find('id="playground"') > check.find("</footer>"))
print("playground before contact?", check.find('id="playground"') < check.find('id="contact"'))
print("file bytes", len(check.encode("utf-8")))
