import re

with open("index.html", encoding="utf-8") as f:
    c = f.read()

idx = c.rfind("<script")
print("SCRIPTS TAIL:")
print(c[idx:])

ps = c.find('<section id="playground"')
pe = c.find("</section>", ps) + len("</section>")
print("\nplayground span", ps, pe, "len", pe - ps)

cs = c.find('<section id="contact"')
print("contact at", cs)

# Find full contact section end - careful with nested? sections shouldn't nest
# contact section may contain lots of content
ce = c.find("</section>", cs) + len("</section>")
print("contact end", ce, "len", ce - cs)

# anything after playground before scripts
print("\nAFTER PLAYGROUND:")
print(repr(c[pe:pe + 500]))
