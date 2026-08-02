import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Find positions of major sections for reorder planning
for sid in ["about", "projects", "skills", "certifications", "education", "contact", "playground"]:
    i = content.find('id="' + sid + '"')
    print(sid, i)

# Check if styles are only in css/style.css and whether btn classes exist
with open("css/style.css", "r", encoding="utf-8") as f:
    css = f.read()
print("btn-solid" in css, "btn-outline" in css, "btn " in css)
# Check section-num pattern for contact vs playground
for m in re.finditer(r'section-num">(.*?)<', content):
    print("num:", m.group(1))
