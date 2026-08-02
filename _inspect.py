import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

clean = re.sub(r"data:[^\"']+", "data:STRIPPED", content)
out = []

out.append("=== NAV ===")
nav = re.search(r'<nav class="nav">.*?</nav>', clean, re.S)
out.append(nav.group(0) if nav else "none")

out.append("\n=== PLAYGROUND ===")
pg = re.search(r'<section id="playground".*?</section>', clean, re.S)
out.append(pg.group(0) if pg else "none")

out.append("\n=== SCRIPT TAGS ===")
scripts = re.findall(r"<script[^>]*>.*?</script>|<script[^>]+>", clean, re.S)
for s in scripts:
    preview = s[:300].replace("\n", " ")
    out.append(preview + ("..." if len(s) > 300 else ""))

out.append("\n=== SECTION IDS ===")
for m in re.finditer(r'<section[^>]*id="([^"]+)"', clean):
    out.append(m.group(1))

out.append("\n=== LINK/CSS IN HEAD ===")
head = re.search(r"<head>(.*?)</head>", clean, re.S)
if head:
    for m in re.finditer(r"<(link|script|title)[^>]*>", head.group(1)):
        out.append(m.group(0)[:200])

out.append("\nInline style count: " + str(len(re.findall(r"<style", content))))
out.append("External css refs: " + str(re.findall(r'href="([^"]+\.css)"', content)))
out.append("External js refs: " + str(re.findall(r'src="([^"]+\.js)"', content)))

ids = [
    "factCategory", "factTitle", "factDesc", "factSource",
    "nextFactBtn", "exploreFactBtn", "datasetSelect", "chartTypeSelect",
    "downloadChartBtn", "chartContainer", "infoName", "infoSource",
    "infoRecords", "insightText", "generateFact", "factContent",
    "chart", "chartSelect", "insight", "downloadChart"
]
out.append("\n=== ID PRESENCE ===")
for i in ids:
    needle = 'id="' + i + '"'
    out.append(i + ": " + ("YES" if needle in content else "NO"))

# Check whether css/style.css is linked or styles are duplicated inline
out.append("\nFile size bytes: " + str(len(content)))
out.append("Has css/style.css link: " + str('css/style.css' in content))

with open("_inspect_out.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("ok")
