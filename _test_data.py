"""Smoke-test dataset processing logic (mirrors js/charts.js)."""
import csv
from pathlib import Path

def process_population(rows):
    world = [r for r in rows if r.get("Country Name") == "World" and r.get("Year") and r.get("Value")]
    world.sort(key=lambda r: int(r["Year"]))
    return len(world), [int(r["Year"]) for r in world[:2]], [int(r["Year"]) for r in world[-2:]]

def process_climate(rows):
    series = [r for r in rows if r.get("Source") == "GCAG" and r.get("Year") and r.get("Mean") not in (None, "")]
    series.sort(key=lambda r: int(r["Year"]))
    return len(series), float(series[0]["Mean"]), float(series[-1]["Mean"])

def process_movies(rows):
    valid = []
    for r in rows:
        if not (r.get("movie") and r.get("production_budget") and r.get("worldwide_gross")):
            continue
        try:
            budget = float(r["production_budget"])
            gross = float(r["worldwide_gross"])
        except ValueError:
            continue
        if gross > 0:
            valid.append((r["movie"], budget, gross))
    valid.sort(key=lambda x: x[2], reverse=True)
    valid = valid[:40]
    return len(valid), valid[0][0] if valid else None

def process_spotify(rows):
    valid = [r for r in rows if r.get("track_name") and r.get("danceability") not in ("", None) and r.get("energy") not in ("", None)][:60]
    return len(valid), valid[0]["track_name"] if valid else None

def process_happiness(rows):
    col = "Life satisfaction in Cantril Ladder (World Happiness Report 2022)"
    years = [int(r["Year"]) for r in rows if r.get("Year")]
    latest = max(years)
    recent = []
    for r in rows:
        if int(r["Year"]) != latest:
            continue
        if r.get(col) in ("", None):
            continue
        recent.append((r["Entity"], float(r[col])))
    recent.sort(key=lambda x: x[1], reverse=True)
    top = recent[:20]
    return latest, len(top), top[0] if top else None

base = Path("data")
with (base / "population.csv").open(encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
print("population", process_population(rows))

with (base / "climate.csv").open(encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
print("climate", process_climate(rows))

with (base / "movies.csv").open(encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
print("movies", process_movies(rows))

with (base / "spotify.csv").open(encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
print("spotify", process_spotify(rows))

with (base / "happiness.csv").open(encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
print("happiness", process_happiness(rows))

print("facts", len(__import__("json").loads((base / "facts.json").read_text(encoding="utf-8"))))
