import urllib.request
import os

datasets = {
    "population": "https://raw.githubusercontent.com/datasets/population/master/data/population.csv",
    "climate": "https://raw.githubusercontent.com/datasets/global-temp/master/data/annual.csv",
    "movies": "https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2018/2018-10-23/movie_profit.csv",
    "spotify": "https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv"
}

output_dir = "data-playground/public/data/datasets"
os.makedirs(output_dir, exist_ok=True)

for name, url in datasets.items():
    print(f"Downloading {name}...")
    file_path = os.path.join(output_dir, f"{name}.csv")
    try:
        urllib.request.urlretrieve(url, file_path)
        print(f"Saved {name}.csv")
    except Exception as e:
        print(f"Failed to download {name}: {e}")
