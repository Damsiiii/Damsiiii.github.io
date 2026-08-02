import json
import re
import urllib.request

BASE = "http://127.0.0.1:8765"

def get(path):
    with urllib.request.urlopen(BASE + path, timeout=30) as r:
        return r.status, r.read()

checks = [
    "/",
    "/css/style.css",
    "/js/main.js",
    "/js/charts.js",
    "/data/facts.json",
    "/data/population.csv",
    "/data/climate.csv",
    "/data/movies.csv",
    "/data/happiness.csv",
    "/data/spotify.csv",
]

out = []
for p in checks:
    try:
        status, body = get(p)
        out.append(f"OK {status} {p} ({len(body)} bytes)")
    except Exception as e:
        out.append(f"FAIL {p}: {e}")

# HTML sanity
status, body = get("/")
html = body.decode("utf-8", errors="replace")
assert 'id="playground"' in html
assert html.index('id="playground"') < html.index('id="contact"')
assert html.index('id="playground"') < html.index("</footer>")
assert html.count("js/main.js") == 1
assert "js/charts.js" in html
assert "papaparse" in html
assert "echarts" in html
assert 'id="nextFactBtn"' in html
assert 'id="exploreFactBtn"' in html
assert 'id="chartContainer"' in html
assert 'id="datasetSelect"' in html
assert 'id="chartTypeSelect"' in html
# no dead script
assert "js/data.js" not in html
out.append("HTML structure checks passed")

facts = json.loads(get("/data/facts.json")[1])
assert len(facts) >= 5
datasets = {f["dataset"] for f in facts}
out.append("fact datasets: " + ", ".join(sorted(datasets)))

# charts.js contains all dataset keys
charts = get("/js/charts.js")[1].decode("utf-8")
for key in ["population", "climate", "movies", "spotify", "happiness"]:
    assert key + ":" in charts or f'"{key}"' in charts or f"{key}:" in charts
out.append("charts.js dataset keys present")

Path = __import__("pathlib").Path
Path("_smoke_out.txt").write_text("\n".join(out), encoding="utf-8")
print("\n".join(out))
