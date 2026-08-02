import re

with open("index.html", encoding="utf-8") as f:
    c = f.read()

for m in re.finditer(r"<script[^>]*>", c):
    print(m.start(), m.group(0)[:120])

# Also check if there's an early main.js before contact
print("\n--- first main.js context ---")
i = c.find('js/main.js')
print(c[i-80:i+40])
print("\n--- second ---")
j = c.find('js/main.js', i+1)
print(c[j-80:j+40] if j>0 else "none")

# Extract contact section structure without huge attrs
cs = c.find('<section id="contact"')
ce = c.find("</section>", cs) + len("</section>")
contact = c[cs:ce]
clean = re.sub(r'data:[^"\']+', "data:STRIPPED", contact)
clean = re.sub(r'src="[^"]{200,}"', 'src="HUGE"', clean)
print("\nCONTACT STRUCTURE (stripped):")
print(clean[:2500])
print("\n...\n")
print(clean[-800:])
