/**
 * Digital Data Playground — visualization & data engine
 * ECharts for charts, PapaParse for client-side CSV parsing.
 * Works fully static (GitHub Pages / Netlify / Vercel) — no backend.
 */
(function () {
  "use strict";

  let factsList = [];
  let currentFact = null;
  let activeDatasetId = "population";
  let activeChartType = "line";
  let chartInstance = null;
  const cache = {};

  const THEME = {
    amber: "#000080",
    amberSoft: "#008080",
    teal: "#008080",
    paper: "#C0C0C0",
    ink: "#000000",
    ink2: "#2A2A2A",
    colors: ["#000080", "#008080", "#808080", "#D4AF37", "#800080", "#000000"],
  };

  const DATASETS = {
    population: {
      name: "World Population",
      file: "data/population.csv",
      source: "United Nations / World Bank",
      description: "Historical world population figures from 1960 onwards.",
      processData: (rows) => {
        const world = rows
          .filter((r) => r["Country Name"] === "World" && r.Year && r.Value)
          .sort((a, b) => Number(a.Year) - Number(b.Year));
        const x = world.map((r) => String(r.Year));
        const y = world.map((r) => Math.round(Number(r.Value) / 1e6));
        return {
          x,
          y,
          scatter: world.map((r) => [
            Number(r.Year),
            Math.round(Number(r.Value) / 1e6),
          ]),
          xName: "Year",
          yName: "Population (millions)",
          unit: "M",
        };
      },
      insights: {
        line: "Global population grew from under 3 billion in 1960 to over 8 billion — nearly tripling in six decades.",
        bar: "Decade-over-decade gains accelerated through the late 20th century, then moderated as fertility rates declined.",
        scatter:
          "The year–population relationship is near-linear in recent decades, reflecting steady absolute growth even as rates fall.",
        pie: "A slice of the time series highlights how late-century population mass dominates the overall distribution.",
        histogram:
          "Population values cluster toward the higher end of the range, reflecting the long post-1960 growth arc.",
      },
    },

    climate: {
      name: "Global Temperature Anomaly",
      file: "data/climate.csv",
      source: "NASA GISS / NOAA (GCAG)",
      description:
        "Annual mean global temperature anomalies relative to the 1951–1980 baseline (°C).",
      processData: (rows) => {
        const series = rows
          .filter(
            (r) =>
              r.Source === "GCAG" &&
              r.Year &&
              r.Mean !== undefined &&
              r.Mean !== "",
          )
          .sort((a, b) => Number(a.Year) - Number(b.Year));
        const x = series.map((r) => String(r.Year));
        const y = series.map((r) => parseFloat(r.Mean));
        return {
          x,
          y,
          scatter: series.map((r) => [Number(r.Year), parseFloat(r.Mean)]),
          xName: "Year",
          yName: "Temp anomaly (°C)",
          unit: "°C",
        };
      },
      insights: {
        line: "Temperature anomalies show a clear upward inflection after ~1970, with recent years often exceeding +1.0°C.",
        bar: "Warm years dominate the modern era — cool anomalies become rare after the mid-20th century.",
        scatter:
          "The year–anomaly scatter reveals a non-linear warming trend accelerating in the last 50 years.",
        pie: "Comparing recent decades as shares shows how warm-anomaly years outweigh cooler historical periods.",
        histogram:
          "The anomaly distribution is skewed warm, with a long right tail of high positive deviations.",
      },
    },

    movies: {
      name: "Movie Budgets & Box Office",
      file: "data/movies.csv",
      source: "The Numbers / Box Office Mojo",
      description:
        "Production budgets and worldwide gross for major theatrical releases.",
      processData: (rows) => {
        const valid = rows
          .filter((r) => r.movie && r.production_budget && r.worldwide_gross)
          .map((r) => ({
            movie: r.movie,
            budget: Number(r.production_budget),
            gross: Number(r.worldwide_gross),
            genre: r.genre || "Unknown",
          }))
          .filter((r) => !isNaN(r.budget) && !isNaN(r.gross) && r.gross > 0)
          .sort((a, b) => b.gross - a.gross)
          .slice(0, 40);

        return {
          x: valid.map((r) =>
            r.movie.length > 22 ? r.movie.slice(0, 22) + "…" : r.movie,
          ),
          y: valid.map((r) => Math.round(r.gross / 1e6)),
          scatter: valid.map((r) => [
            Math.round(r.budget / 1e6),
            Math.round(r.gross / 1e6),
          ]),
          xName: "Budget ($M)",
          yName: "Worldwide gross ($M)",
          unit: "$M",
          categories: (() => {
            const map = {};
            valid.forEach((r) => {
              map[r.genre] = (map[r.genre] || 0) + r.gross;
            });
            return Object.entries(map)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([name, value]) => ({
                name,
                value: Math.round(value / 1e6),
              }));
          })(),
        };
      },
      insights: {
        line: "Top-grossing titles show how a handful of blockbusters capture outsized worldwide revenue.",
        bar: "Revenue is heavily concentrated — a small set of titles account for a large share of total gross.",
        scatter:
          "Higher budgets often correlate with higher gross, but variance widens sharply above ~$150M.",
        pie: "Genre mix among top earners is dominated by a few commercial categories with global appeal.",
        histogram:
          "Worldwide gross is right-skewed: most films cluster lower while a long tail of megahits extends far right.",
      },
    },

    spotify: {
      name: "Spotify Songs (Audio Features)",
      file: "data/spotify.csv",
      source: "Spotify Web API (TidyTuesday)",
      description:
        "Danceability, energy, and popularity across popular playlist tracks.",
      processData: (rows) => {
        const valid = rows
          .filter(
            (r) => r.track_name && r.danceability !== "" && r.energy !== "",
          )
          .slice(0, 60);
        return {
          x: valid.map((r) =>
            r.track_name.length > 18
              ? r.track_name.slice(0, 18) + "…"
              : r.track_name,
          ),
          y: valid.map((r) => Math.round(Number(r.danceability) * 100)),
          scatter: valid.map((r) => [
            parseFloat(r.danceability),
            parseFloat(r.energy),
          ]),
          xName: "Danceability",
          yName: "Energy",
          unit: "%",
          categories: (() => {
            const map = {};
            valid.forEach((r) => {
              const g = r.playlist_genre || "other";
              map[g] = (map[g] || 0) + 1;
            });
            return Object.entries(map)
              .sort((a, b) => b[1] - a[1])
              .map(([name, value]) => ({ name, value }));
          })(),
        };
      },
      insights: {
        line: "Danceability across hit tracks sits mostly in the mid-to-high range — playlist hits favor groove.",
        bar: "Track-level danceability scores show consistent commercial preference for danceable material.",
        scatter:
          "Hits cluster in the high-energy / high-danceability quadrant, reflecting upbeat listening habits.",
        pie: "Playlist genre composition in this sample shows which styles dominate curated hit lists.",
        histogram:
          "Danceability scores concentrate between ~50–80%, with fewer tracks at the extremes.",
      },
    },

    happiness: {
      name: "World Happiness Ladder",
      file: "data/happiness.csv",
      source: "World Happiness Report (Our World in Data)",
      description:
        "Cantril ladder life-satisfaction scores by country over time.",
      processData: (rows) => {
        const col =
          "Life satisfaction in Cantril Ladder (World Happiness Report 2022)";
        const years = rows.map((r) => Number(r.Year)).filter((y) => !isNaN(y));
        const latest = Math.max(...years);
        const recent = rows
          .filter(
            (r) => Number(r.Year) === latest && r[col] !== "" && r[col] != null,
          )
          .map((r) => ({
            entity: r.Entity,
            score: parseFloat(r[col]),
          }))
          .filter((r) => !isNaN(r.score))
          .sort((a, b) => b.score - a.score);

        const top = recent.slice(0, 20);
        return {
          x: top.map((r) => r.entity),
          y: top.map((r) => Number(r.score.toFixed(2))),
          scatter: top.map((r, i) => [i + 1, Number(r.score.toFixed(2))]),
          xName: "Rank",
          yName: "Happiness score (0–10)",
          unit: "pts",
          metaNote: "Year " + latest,
        };
      },
      insights: {
        line: "Top-ranked countries sit in a tight high band — small score gaps separate the global leaders.",
        bar: "Nordic and Northern European nations dominate the top of the Cantril ladder rankings.",
        scatter:
          "Rank versus score shows a smooth decline — happiness leadership is consistent, not random.",
        pie: "Among the top 20, regional concentration highlights how social and economic models cluster.",
        histogram:
          "Even within the top tier, scores form a compact distribution near the upper end of the 0–10 scale.",
      },
    },
  };

  function $(id) {
    return document.getElementById(id);
  }

  function setLoading(isLoading) {
    const el = $("chartLoading");
    if (el) el.hidden = !isLoading;
    const container = $("chartContainer");
    if (container)
      container.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  function init() {
    if (!$("chartContainer")) return;
    initChart();
    loadFacts();
    bindEvents();
    if ($("datasetSelect")) $("datasetSelect").value = activeDatasetId;
    if ($("chartTypeSelect")) $("chartTypeSelect").value = activeChartType;
    loadDataset(activeDatasetId);
  }

  function initChart() {
    chartInstance = echarts.init($("chartContainer"), null, {
      renderer: "canvas",
    });
    window.addEventListener("resize", () => {
      if (chartInstance) chartInstance.resize();
    });
  }

  function loadFacts() {
    fetch("data/facts.json")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => {
        factsList = Array.isArray(data) ? data : [];
        displayRandomFact();
      })
      .catch((err) => {
        console.error("Failed to load facts.json:", err);
        factsList = [
          {
            title: "Global Population Growth",
            explanation:
              "The world population surpassed 8 billion in late 2022, driven by advances in medicine and public health.",
            category: "Population",
            source: "United Nations",
            dataset: "population",
          },
        ];
        displayRandomFact();
      });
  }

  function displayRandomFact() {
    if (!factsList.length) return;
    let next = factsList[Math.floor(Math.random() * factsList.length)];
    if (factsList.length > 1 && currentFact && next.id === currentFact.id) {
      next = factsList[(factsList.indexOf(next) + 1) % factsList.length];
    }
    currentFact = next;

    const cat = $("factCategory");
    const title = $("factTitle");
    const desc = $("factDesc");
    const source = $("factSource");
    if (cat) cat.textContent = currentFact.category || "General";
    if (title) title.textContent = currentFact.title;
    if (desc) desc.textContent = currentFact.explanation;
    if (source) source.textContent = "Source: " + currentFact.source;
  }

  function loadDataset(datasetId) {
    const config = DATASETS[datasetId];
    if (!config) return;

    activeDatasetId = datasetId;
    if ($("datasetSelect") && $("datasetSelect").value !== datasetId) {
      $("datasetSelect").value = datasetId;
    }

    if ($("infoName")) $("infoName").textContent = config.name;
    if ($("infoSource")) $("infoSource").textContent = config.source;
    updateInsight(config);

    if (cache[datasetId]) {
      if ($("infoRecords"))
        $("infoRecords").textContent =
          cache[datasetId]._rawCount.toLocaleString();
      renderChart(cache[datasetId]);
      return;
    }

    setLoading(true);
    if (chartInstance) {
      chartInstance.showLoading("default", {
        text: "Loading dataset…",
        color: THEME.amber,
        textColor: THEME.ink,
        maskColor: "rgba(192, 192, 192, 0.65)",
        zlevel: 0,
      });
    }

    Papa.parse(config.file, {
      download: true,
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data || [];
        if ($("infoRecords"))
          $("infoRecords").textContent = rawRows.length.toLocaleString();

        try {
          const processed = config.processData(rawRows);
          processed._rawCount = rawRows.length;
          if (!processed.x || !processed.x.length) {
            throw new Error("No usable rows after filtering");
          }
          cache[datasetId] = processed;
          setLoading(false);
          if (chartInstance) chartInstance.hideLoading();
          renderChart(processed);
        } catch (err) {
          console.error("Failed to process dataset", datasetId, err);
          setLoading(false);
          if (chartInstance) chartInstance.hideLoading();
          showChartError(
            "Could not process this dataset. Check the CSV format.",
          );
        }
      },
      error: (err) => {
        console.error("Error loading CSV", config.file, err);
        setLoading(false);
        if (chartInstance) chartInstance.hideLoading();
        showChartError(
          "Could not load " +
            config.file +
            ". Serve the site over HTTP (not file://).",
        );
      },
    });
  }

  function showChartError(message) {
    if (!chartInstance) return;
    chartInstance.clear();
    chartInstance.setOption({
      backgroundColor: "transparent",
      title: {
        text: message,
        left: "center",
        top: "middle",
        textStyle: {
          color: "#808080",
          fontSize: 14,
          fontFamily: "'Share Tech Mono', monospace",
          fontWeight: 400,
          width: 360,
          overflow: "break",
        },
      },
    });
  }

  function updateInsight(config) {
    const el = $("insightText");
    if (!el) return;
    const map = config.insights || {};
    const text =
      map[activeChartType] ||
      config.insight ||
      "Explore different chart types to reveal complementary patterns in this dataset.";
    el.textContent = text;
  }

  function buildOption(data, config) {
    const isDark =
      document.documentElement.getAttribute("data-theme") !== "light";

    const themeColors = isDark
      ? {
          text: "#F0F4F8",
          textMuted: "#A0AEC0",
          textSubtle: "#718096",
          axisLine: "#484E54",
          splitLine: "rgba(240, 244, 248, 0.12)",
          tooltipBg: "#1F2225",
          tooltipBorder: "#4895EF",
          accent: "#4895EF",
          accentSoft: "#E0A96D",
          secondary: "#A0AEC0",
          colors: [
            "#4895EF",
            "#E0A96D",
            "#A0AEC0",
            "#484E54",
            "#718096",
            "#C0C0C0",
          ],
          lineGradStart: "rgba(72, 149, 239, 0.35)",
          lineGradEnd: "rgba(72, 149, 239, 0.01)",
          barGradStart: "#4895EF",
          barGradEnd: "rgba(72, 149, 239, 0.3)",
          pieBorder: "#181B1E",
          pieLine: "rgba(240, 244, 248, 0.4)",
        }
      : {
          text: "#000000",
          textMuted: "#404040",
          textSubtle: "#808080",
          axisLine: "#000000",
          splitLine: "rgba(0, 0, 0, 0.12)",
          tooltipBg: "#C0C0C0",
          tooltipBorder: "#000080",
          accent: "#000080",
          accentSoft: "#008080",
          secondary: "#404040",
          colors: [
            "#000080",
            "#008080",
            "#808080",
            "#D4AF37",
            "#800080",
            "#000000",
          ],
          lineGradStart: "rgba(0, 0, 128, 0.25)",
          lineGradEnd: "rgba(0, 0, 128, 0.01)",
          barGradStart: "#000080",
          barGradEnd: "rgba(0, 0, 128, 0.2)",
          pieBorder: "#FFFFFF",
          pieLine: "rgba(0, 0, 0, 0.4)",
        };

    const baseText = {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace",
      color: themeColors.text,
    };

    const option = {
      backgroundColor: "transparent",
      color: themeColors.colors,
      animationDuration: 500,
      animationEasing: "cubicOut",
      textStyle: baseText,
      legend: {
        show: activeChartType === "pie",
        bottom: 4,
        textStyle: {
          color: themeColors.text,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 12,
          fontWeight: 500,
        },
      },
      tooltip: {
        trigger:
          activeChartType === "pie" || activeChartType === "scatter"
            ? "item"
            : "axis",
        backgroundColor: themeColors.tooltipBg,
        borderColor: themeColors.tooltipBorder,
        borderWidth: 2,
        extraCssText:
          "box-shadow: 2px 2px 0px #000000; border-radius: 0px; padding: 10px 14px;",
        textStyle: {
          color: themeColors.text,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 13,
        },
        formatter: (params) => {
          if (activeChartType === "pie") {
            const p = Array.isArray(params) ? params[0] : params;
            return (
              "<b>" +
              p.name +
              "</b><br/>" +
              p.value +
              " " +
              (data.unit || "") +
              " (" +
              p.percent +
              "%)"
            );
          }
          if (activeChartType === "scatter") {
            const p = Array.isArray(params) ? params[0] : params;
            const v = p.value;
            return (
              "<b>" +
              data.xName +
              ":</b> " +
              v[0] +
              "<br/><b>" +
              data.yName +
              ":</b> " +
              v[1] +
              (data.unit ? " " + data.unit : "")
            );
          }
          const p = Array.isArray(params) ? params[0] : params;
          return (
            "<b>" +
            p.name +
            "</b><br/>" +
            p.seriesName +
            ": <b>" +
            p.value +
            (data.unit ? " " + data.unit : "") +
            "</b>"
          );
        },
      },
      grid: {
        left: "4%",
        right: "4%",
        bottom: data.x && data.x.length > 12 ? "20%" : "14%",
        top: "14%",
        containLabel: true,
      },
      xAxis: {
        show: activeChartType !== "pie",
        type: activeChartType === "scatter" ? "value" : "category",
        name: data.xName || "",
        nameLocation: "end",
        nameGap: 10,
        nameTextStyle: {
          color: themeColors.secondary,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "'Share Tech Mono', monospace",
        },
        data:
          activeChartType === "scatter" || activeChartType === "pie"
            ? undefined
            : data.x,
        axisLine: { lineStyle: { color: themeColors.axisLine, width: 2 } },
        axisTick: {
          show: true,
          lineStyle: { color: themeColors.axisLine, width: 1 },
        },
        axisLabel: {
          color: themeColors.text,
          rotate: data.x && data.x.length > 14 ? 35 : 0,
          fontSize: 12,
          fontWeight: 400,
          fontFamily: "'Share Tech Mono', monospace",
          interval: activeChartType === "histogram" ? 0 : "auto",
        },
        splitLine: {
          show: activeChartType === "scatter",
          lineStyle: { color: themeColors.splitLine, type: "dashed" },
        },
      },
      yAxis: {
        show: activeChartType !== "pie",
        type: "value",
        name:
          activeChartType === "histogram" ? "Frequency" : data.yName || "Value",
        nameLocation: "end",
        nameGap: 10,
        nameTextStyle: {
          color: themeColors.secondary,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "'Share Tech Mono', monospace",
        },
        axisLine: {
          show: true,
          lineStyle: { color: themeColors.axisLine, width: 2 },
        },
        axisTick: {
          show: true,
          lineStyle: { color: themeColors.axisLine, width: 1 },
        },
        splitLine: {
          lineStyle: { color: themeColors.splitLine, type: "solid" },
        },
        axisLabel: {
          color: themeColors.text,
          fontSize: 12,
          fontWeight: 400,
          fontFamily: "'Share Tech Mono', monospace",
        },
      },
      series: [],
    };

    if (activeChartType === "line") {
      const step = Math.max(1, Math.ceil(data.y.length / 8));
      option.series = [
        {
          name: config.name,
          type: "line",
          data: data.y,
          smooth: false,
          symbol: "rect",
          symbolSize: 6,
          lineStyle: { width: 2, color: themeColors.accent },
          itemStyle: { color: themeColors.accent },
          label: {
            show: true,
            position: "top",
            color: themeColors.text,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "'Share Tech Mono', monospace",
            formatter: (p) => {
              if (data.y.length <= 15)
                return p.value + (data.unit ? " " + data.unit : "");
              return p.dataIndex % step === 0
                ? p.value + (data.unit ? " " + data.unit : "")
                : "";
            },
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: themeColors.lineGradStart },
              { offset: 1, color: themeColors.lineGradEnd },
            ]),
          },
        },
      ];
    } else if (activeChartType === "bar") {
      option.series = [
        {
          name: config.name,
          type: "bar",
          data: data.y,
          barMaxWidth: 36,
          label: {
            show: true,
            position: "top",
            color: themeColors.text,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "'Share Tech Mono', monospace",
            formatter: (p) => p.value + (data.unit ? " " + data.unit : ""),
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: themeColors.barGradStart },
              { offset: 1, color: themeColors.barGradEnd },
            ]),
            borderRadius: 0,
            borderWidth: 1,
            borderColor: themeColors.accent,
          },
        },
      ];
    } else if (activeChartType === "scatter") {
      option.series = [
        {
          name: config.name,
          type: "scatter",
          data: data.scatter || data.x.map((xv, i) => [i, data.y[i]]),
          symbolSize: 8,
          symbol: "rect",
          itemStyle: {
            color: themeColors.accentSoft,
            opacity: 0.95,
          },
          emphasis: {
            scale: 1.3,
            label: {
              show: true,
              position: "top",
              color: themeColors.text,
              fontSize: 11,
              fontWeight: 500,
              fontFamily: "'Share Tech Mono', monospace",
              formatter: (p) => p.value[1] + (data.unit ? " " + data.unit : ""),
            },
          },
        },
      ];
    } else if (activeChartType === "pie") {
      const pieData =
        data.categories && data.categories.length
          ? data.categories
          : (() => {
              const n = Math.min(10, data.x.length);
              const step = Math.max(1, Math.floor(data.x.length / n));
              const slices = [];
              for (
                let i = 0;
                i < data.x.length && slices.length < n;
                i += step
              ) {
                slices.push({ name: String(data.x[i]), value: data.y[i] });
              }
              return slices;
            })();

      option.xAxis.show = false;
      option.yAxis.show = false;
      option.series = [
        {
          name: config.name,
          type: "pie",
          radius: ["40%", "70%"],
          center: ["50%", "46%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 0,
            borderColor: themeColors.pieBorder,
            borderWidth: 2,
          },
          label: {
            show: true,
            color: themeColors.text,
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 12,
            fontWeight: 500,
            formatter:
              "{b}: {c}" + (data.unit ? " " + data.unit : "") + " ({d}%)",
          },
          labelLine: { lineStyle: { color: themeColors.pieLine, width: 1 } },
          data: pieData,
        },
      ];
    } else if (activeChartType === "histogram") {
      const vals = data.y.filter((v) => typeof v === "number" && !isNaN(v));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const binCount = Math.min(
        10,
        Math.max(5, Math.round(Math.sqrt(vals.length))),
      );
      const width = (max - min) / binCount || 1;
      const bins = Array(binCount).fill(0);
      const labels = [];
      for (let i = 0; i < binCount; i++) {
        const a = min + i * width;
        const b = min + (i + 1) * width;
        labels.push(a.toFixed(1) + "–" + b.toFixed(1));
      }
      vals.forEach((val) => {
        let idx = Math.floor((val - min) / width);
        if (idx >= binCount) idx = binCount - 1;
        if (idx < 0) idx = 0;
        bins[idx]++;
      });
      option.xAxis.data = labels;
      option.xAxis.name = data.yName || "Value";
      option.series = [
        {
          name: "Frequency",
          type: "bar",
          data: bins,
          barMaxWidth: 40,
          label: {
            show: true,
            position: "top",
            color: themeColors.text,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "'Share Tech Mono', monospace",
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: themeColors.secondary },
              {
                offset: 1,
                color: isDark
                  ? "rgba(235, 229, 222, 0.2)"
                  : "rgba(108, 104, 99, 0.2)",
              },
            ]),
            borderRadius: 0,
            borderWidth: 1,
            borderColor: themeColors.secondary,
          },
        },
      ];
    }

    return option;
  }

  function renderChart(data) {
    if (!chartInstance) return;
    const config = DATASETS[activeDatasetId];
    updateInsight(config);
    chartInstance.setOption(buildOption(data, config), true);
  }

  function exploreCurrentFact() {
    if (!currentFact) return;
    const target = currentFact.dataset || "population";
    loadDataset(target);

    const viz = $("vizPanel") || $("chartContainer");
    if (viz) {
      viz.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const panel = $("vizPanel");
    if (panel) {
      panel.classList.add("playground-flash");
      setTimeout(() => panel.classList.remove("playground-flash"), 1200);
    }
  }

  function bindEvents() {
    const nextBtn = $("nextFactBtn");
    if (nextBtn) nextBtn.addEventListener("click", displayRandomFact);

    const exploreBtn = $("exploreFactBtn");
    if (exploreBtn) exploreBtn.addEventListener("click", exploreCurrentFact);

    const datasetSelect = $("datasetSelect");
    if (datasetSelect) {
      datasetSelect.addEventListener("change", (e) =>
        loadDataset(e.target.value),
      );
    }

    const chartTypeSelect = $("chartTypeSelect");
    if (chartTypeSelect) {
      chartTypeSelect.addEventListener("change", (e) => {
        activeChartType = e.target.value;
        if (cache[activeDatasetId]) renderChart(cache[activeDatasetId]);
        else loadDataset(activeDatasetId);
      });
    }

    const downloadBtn = $("downloadChartBtn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        if (!chartInstance) return;
        const isDark =
          document.documentElement.getAttribute("data-theme") !== "light";
        const url = chartInstance.getDataURL({
          type: "png",
          pixelRatio: 2,
          backgroundColor: isDark ? "#2a2a2a" : "#c0c0c0",
        });
        const link = document.createElement("a");
        link.download =
          "data-playground-" + activeDatasetId + "-" + activeChartType + ".png";
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    window.addEventListener("themechange", () => {
      if (chartInstance && cache[activeDatasetId]) {
        renderChart(cache[activeDatasetId]);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
