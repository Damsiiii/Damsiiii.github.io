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
assert 'id="about"' in html
assert 'id="projects"' in html
assert 'id="skills"' in html
assert 'id="certifications"' in html
assert 'id="contact"' in html
assert html.index('id="about"') < html.index('id="contact"')
assert html.index('id="contact"') < html.index("</footer>")
assert html.count("js/main.js") == 1
assert 'id="snake-game-window"' not in html
assert 'id="playground"' not in html
assert "js/charts.js" not in html
out.append("HTML structure checks passed")

Path = __import__("pathlib").Path
Path("_smoke_out.txt").write_text("\n".join(out), encoding="utf-8")
print("\n".join(out))
