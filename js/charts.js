/**
 * Digital Data Playground — visualization & data engine
 * ECharts for charts, PapaParse for client-side CSV parsing.
 * Works fully static (GitHub Pages / Netlify / Vercel) — no backend.
 *
 * =============================================================================
 * HOW TO ADD A NEW DATASET
 * =============================================================================
 * 1. Add a CSV file under data/ (e.g. data/my_dataset.csv).
 * 2. Register it in DATASETS below:
 *      my_id: {
 *        name, file, source, description,
 *        processData(rows) -> { x, y, scatter, xName, yName, unit },
 *        insights: { line|bar|scatter|pie|histogram: "..." }  // or insight: "..."
 *      }
 * 3. Add <option value="my_id">…</option> to #datasetSelect in index.html.
 * 4. Optionally add facts in data/facts.json with "dataset": "my_id".
 * =============================================================================
 */
(function () {
  'use strict';

  let factsList = [];
  let currentFact = null;
  let activeDatasetId = 'population';
  let activeChartType = 'line';
  let chartInstance = null;
  const cache = {};

  const THEME = {
    amber: '#D4AF37',
    amberSoft: '#D4AF37',
    teal: '#B8860B',
    paper: '#F9F8F6',
    ink: '#1A1A1A',
    ink2: '#242424',
    colors: ['#D4AF37', '#B8860B', '#6C6863', '#1A1A1A', '#A39274', '#8C7B53']
  };

  const DATASETS = {
    population: {
      name: 'World Population',
      file: 'data/population.csv',
      source: 'United Nations / World Bank',
      description: 'Historical world population figures from 1960 onwards.',
      processData: (rows) => {
        const world = rows
          .filter((r) => r['Country Name'] === 'World' && r.Year && r.Value)
          .sort((a, b) => Number(a.Year) - Number(b.Year));
        const x = world.map((r) => String(r.Year));
        const y = world.map((r) => Math.round(Number(r.Value) / 1e6));
        return {
          x,
          y,
          scatter: world.map((r) => [Number(r.Year), Math.round(Number(r.Value) / 1e6)]),
          xName: 'Year',
          yName: 'Population (millions)',
          unit: 'M'
        };
      },
      insights: {
        line: 'Global population grew from under 3 billion in 1960 to over 8 billion — nearly tripling in six decades.',
        bar: 'Decade-over-decade gains accelerated through the late 20th century, then moderated as fertility rates declined.',
        scatter: 'The year–population relationship is near-linear in recent decades, reflecting steady absolute growth even as rates fall.',
        pie: 'A slice of the time series highlights how late-century population mass dominates the overall distribution.',
        histogram: 'Population values cluster toward the higher end of the range, reflecting the long post-1960 growth arc.'
      }
    },

    climate: {
      name: 'Global Temperature Anomaly',
      file: 'data/climate.csv',
      source: 'NASA GISS / NOAA (GCAG)',
      description: 'Annual mean global temperature anomalies relative to the 1951–1980 baseline (°C).',
      processData: (rows) => {
        const series = rows
          .filter((r) => r.Source === 'GCAG' && r.Year && r.Mean !== undefined && r.Mean !== '')
          .sort((a, b) => Number(a.Year) - Number(b.Year));
        const x = series.map((r) => String(r.Year));
        const y = series.map((r) => parseFloat(r.Mean));
        return {
          x,
          y,
          scatter: series.map((r) => [Number(r.Year), parseFloat(r.Mean)]),
          xName: 'Year',
          yName: 'Temp anomaly (°C)',
          unit: '°C'
        };
      },
      insights: {
        line: 'Temperature anomalies show a clear upward inflection after ~1970, with recent years often exceeding +1.0°C.',
        bar: 'Warm years dominate the modern era — cool anomalies become rare after the mid-20th century.',
        scatter: 'The year–anomaly scatter reveals a non-linear warming trend accelerating in the last 50 years.',
        pie: 'Comparing recent decades as shares shows how warm-anomaly years outweigh cooler historical periods.',
        histogram: 'The anomaly distribution is skewed warm, with a long right tail of high positive deviations.'
      }
    },

    movies: {
      name: 'Movie Budgets & Box Office',
      file: 'data/movies.csv',
      source: 'The Numbers / Box Office Mojo',
      description: 'Production budgets and worldwide gross for major theatrical releases.',
      processData: (rows) => {
        const valid = rows
          .filter((r) => r.movie && r.production_budget && r.worldwide_gross)
          .map((r) => ({
            movie: r.movie,
            budget: Number(r.production_budget),
            gross: Number(r.worldwide_gross),
            genre: r.genre || 'Unknown'
          }))
          .filter((r) => !isNaN(r.budget) && !isNaN(r.gross) && r.gross > 0)
          .sort((a, b) => b.gross - a.gross)
          .slice(0, 40);

        return {
          x: valid.map((r) => (r.movie.length > 22 ? r.movie.slice(0, 22) + '…' : r.movie)),
          y: valid.map((r) => Math.round(r.gross / 1e6)),
          scatter: valid.map((r) => [Math.round(r.budget / 1e6), Math.round(r.gross / 1e6)]),
          xName: 'Budget ($M)',
          yName: 'Worldwide gross ($M)',
          unit: '$M',
          // Genre aggregates for pie
          categories: (() => {
            const map = {};
            valid.forEach((r) => {
              map[r.genre] = (map[r.genre] || 0) + r.gross;
            });
            return Object.entries(map)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([name, value]) => ({ name, value: Math.round(value / 1e6) }));
          })()
        };
      },
      insights: {
        line: 'Top-grossing titles show how a handful of blockbusters capture outsized worldwide revenue.',
        bar: 'Revenue is heavily concentrated — a small set of titles account for a large share of total gross.',
        scatter: 'Higher budgets often correlate with higher gross, but variance widens sharply above ~$150M.',
        pie: 'Genre mix among top earners is dominated by a few commercial categories with global appeal.',
        histogram: 'Worldwide gross is right-skewed: most films cluster lower while a long tail of megahits extends far right.'
      }
    },

    spotify: {
      name: 'Spotify Songs (Audio Features)',
      file: 'data/spotify.csv',
      source: 'Spotify Web API (TidyTuesday)',
      description: 'Danceability, energy, and popularity across popular playlist tracks.',
      processData: (rows) => {
        const valid = rows
          .filter((r) => r.track_name && r.danceability !== '' && r.energy !== '')
          .slice(0, 60);
        return {
          x: valid.map((r) =>
            r.track_name.length > 18 ? r.track_name.slice(0, 18) + '…' : r.track_name
          ),
          y: valid.map((r) => Math.round(Number(r.danceability) * 100)),
          scatter: valid.map((r) => [parseFloat(r.danceability), parseFloat(r.energy)]),
          xName: 'Danceability',
          yName: 'Energy',
          unit: '%',
          categories: (() => {
            const map = {};
            valid.forEach((r) => {
              const g = r.playlist_genre || 'other';
              map[g] = (map[g] || 0) + 1;
            });
            return Object.entries(map)
              .sort((a, b) => b[1] - a[1])
              .map(([name, value]) => ({ name, value }));
          })()
        };
      },
      insights: {
        line: 'Danceability across hit tracks sits mostly in the mid-to-high range — playlist hits favor groove.',
        bar: 'Track-level danceability scores show consistent commercial preference for danceable material.',
        scatter: 'Hits cluster in the high-energy / high-danceability quadrant, reflecting upbeat listening habits.',
        pie: 'Playlist genre composition in this sample shows which styles dominate curated hit lists.',
        histogram: 'Danceability scores concentrate between ~50–80%, with fewer tracks at the extremes.'
      }
    },

    happiness: {
      name: 'World Happiness Ladder',
      file: 'data/happiness.csv',
      source: 'World Happiness Report (Our World in Data)',
      description: 'Cantril ladder life-satisfaction scores by country over time.',
      processData: (rows) => {
        const col = 'Life satisfaction in Cantril Ladder (World Happiness Report 2022)';
        const years = rows.map((r) => Number(r.Year)).filter((y) => !isNaN(y));
        const latest = Math.max(...years);
        const recent = rows
          .filter((r) => Number(r.Year) === latest && r[col] !== '' && r[col] != null)
          .map((r) => ({
            entity: r.Entity,
            score: parseFloat(r[col])
          }))
          .filter((r) => !isNaN(r.score))
          .sort((a, b) => b.score - a.score);

        const top = recent.slice(0, 20);
        return {
          x: top.map((r) => r.entity),
          y: top.map((r) => Number(r.score.toFixed(2))),
          scatter: top.map((r, i) => [i + 1, Number(r.score.toFixed(2))]),
          xName: 'Rank',
          yName: 'Happiness score (0–10)',
          unit: 'pts',
          metaNote: 'Year ' + latest
        };
      },
      insights: {
        line: 'Top-ranked countries sit in a tight high band — small score gaps separate the global leaders.',
        bar: 'Nordic and Northern European nations dominate the top of the Cantril ladder rankings.',
        scatter: 'Rank versus score shows a smooth decline — happiness leadership is consistent, not random.',
        pie: 'Among the top 20, regional concentration highlights how social and economic models cluster.',
        histogram: 'Even within the top tier, scores form a compact distribution near the upper end of the 0–10 scale.'
      }
    }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function setLoading(isLoading) {
    const el = $('chartLoading');
    if (el) el.hidden = !isLoading;
    const container = $('chartContainer');
    if (container) container.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }

  function init() {
    if (!$('chartContainer')) return;
    initChart();
    loadFacts();
    bindEvents();
    // Sync select UI
    if ($('datasetSelect')) $('datasetSelect').value = activeDatasetId;
    if ($('chartTypeSelect')) $('chartTypeSelect').value = activeChartType;
    loadDataset(activeDatasetId);
  }

  function initChart() {
    chartInstance = echarts.init($('chartContainer'), null, { renderer: 'canvas' });
    window.addEventListener('resize', () => {
      if (chartInstance) chartInstance.resize();
    });
  }

  function loadFacts() {
    fetch('data/facts.json')
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        factsList = Array.isArray(data) ? data : [];
        displayRandomFact();
      })
      .catch((err) => {
        console.error('Failed to load facts.json:', err);
        factsList = [
          {
            title: 'Global Population Growth',
            explanation:
              'The world population surpassed 8 billion in late 2022, driven by advances in medicine and public health.',
            category: 'Population',
            source: 'United Nations',
            dataset: 'population'
          }
        ];
        displayRandomFact();
      });
  }

  function displayRandomFact() {
    if (!factsList.length) return;
    let next = factsList[Math.floor(Math.random() * factsList.length)];
    // Avoid immediate repeat when possible
    if (factsList.length > 1 && currentFact && next.id === currentFact.id) {
      next = factsList[(factsList.indexOf(next) + 1) % factsList.length];
    }
    currentFact = next;

    const cat = $('factCategory');
    const title = $('factTitle');
    const desc = $('factDesc');
    const source = $('factSource');
    if (cat) cat.textContent = currentFact.category || 'General';
    if (title) title.textContent = currentFact.title;
    if (desc) desc.textContent = currentFact.explanation;
    if (source) source.textContent = 'Source: ' + currentFact.source;
  }

  function loadDataset(datasetId) {
    const config = DATASETS[datasetId];
    if (!config) return;

    activeDatasetId = datasetId;
    if ($('datasetSelect') && $('datasetSelect').value !== datasetId) {
      $('datasetSelect').value = datasetId;
    }

    if ($('infoName')) $('infoName').textContent = config.name;
    if ($('infoSource')) $('infoSource').textContent = config.source;
    updateInsight(config);

    if (cache[datasetId]) {
      if ($('infoRecords')) $('infoRecords').textContent = cache[datasetId]._rawCount.toLocaleString();
      renderChart(cache[datasetId]);
      return;
    }

    setLoading(true);
    if (chartInstance) {
      chartInstance.showLoading('default', {
        text: 'Loading dataset…',
        color: THEME.amber,
        textColor: THEME.paper,
        maskColor: 'rgba(14, 20, 32, 0.65)',
        zlevel: 0
      });
    }

    Papa.parse(config.file, {
      download: true,
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data || [];
        if ($('infoRecords')) $('infoRecords').textContent = rawRows.length.toLocaleString();

        try {
          const processed = config.processData(rawRows);
          processed._rawCount = rawRows.length;
          if (!processed.x || !processed.x.length) {
            throw new Error('No usable rows after filtering');
          }
          cache[datasetId] = processed;
          setLoading(false);
          if (chartInstance) chartInstance.hideLoading();
          renderChart(processed);
        } catch (err) {
          console.error('Failed to process dataset', datasetId, err);
          setLoading(false);
          if (chartInstance) chartInstance.hideLoading();
          showChartError('Could not process this dataset. Check the CSV format.');
        }
      },
      error: (err) => {
        console.error('Error loading CSV', config.file, err);
        setLoading(false);
        if (chartInstance) chartInstance.hideLoading();
        showChartError('Could not load ' + config.file + '. Serve the site over HTTP (not file://).');
      }
    });
  }

  function showChartError(message) {
    if (!chartInstance) return;
    chartInstance.clear();
    chartInstance.setOption({
      backgroundColor: 'transparent',
      title: {
        text: message,
        left: 'center',
        top: 'middle',
        textStyle: {
          color: 'rgba(246,243,236,0.55)',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          width: 360,
          overflow: 'break'
        }
      }
    });
  }

  function updateInsight(config) {
    const el = $('insightText');
    if (!el) return;
    const map = config.insights || {};
    const text =
      map[activeChartType] ||
      config.insight ||
      'Explore different chart types to reveal complementary patterns in this dataset.';
    el.textContent = text;
  }

  function buildOption(data, config) {
    const baseText = {
      fontFamily: "'Inter', sans-serif",
      color: THEME.paper
    };

    const option = {
      backgroundColor: 'transparent',
      color: THEME.colors,
      animationDuration: 650,
      animationEasing: 'cubicOut',
      textStyle: baseText,
      legend: {
        show: activeChartType === 'pie',
        bottom: 0,
        textStyle: { color: 'rgba(246,243,236,0.7)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }
      },
      tooltip: {
        trigger: activeChartType === 'pie' || activeChartType === 'scatter' ? 'item' : 'axis',
        backgroundColor: 'rgba(14, 28, 44, 0.95)',
        borderColor: THEME.amber,
        borderWidth: 1,
        textStyle: { color: THEME.paper, fontFamily: "'Inter', sans-serif" },
        formatter: (params) => {
          if (activeChartType === 'pie') {
            const p = Array.isArray(params) ? params[0] : params;
            return '<b>' + p.name + '</b><br/>' + p.value + ' ' + (data.unit || '') + ' (' + p.percent + '%)';
          }
          if (activeChartType === 'scatter') {
            const p = Array.isArray(params) ? params[0] : params;
            const v = p.value;
            return (
              '<b>' +
              data.xName +
              ':</b> ' +
              v[0] +
              '<br/><b>' +
              data.yName +
              ':</b> ' +
              v[1] +
              (data.unit ? ' ' + data.unit : '')
            );
          }
          const p = Array.isArray(params) ? params[0] : params;
          return '<b>' + p.name + '</b><br/>' + p.seriesName + ': ' + p.value + (data.unit ? ' ' + data.unit : '');
        }
      },
      grid: {
        left: '2%',
        right: '3%',
        bottom: data.x && data.x.length > 12 ? '18%' : '12%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        show: activeChartType !== 'pie',
        type: activeChartType === 'scatter' ? 'value' : 'category',
        name: activeChartType === 'scatter' ? data.xName : '',
        nameLocation: 'middle',
        nameGap: 32,
        nameTextStyle: { color: 'rgba(246,243,236,0.55)', fontSize: 11 },
        data: activeChartType === 'scatter' || activeChartType === 'pie' ? undefined : data.x,
        axisLine: { lineStyle: { color: 'rgba(246, 243, 236, 0.2)' } },
        axisLabel: {
          color: 'rgba(246, 243, 236, 0.7)',
          rotate: data.x && data.x.length > 14 ? 40 : 0,
          fontSize: 11,
          interval: activeChartType === 'histogram' ? 0 : 'auto'
        },
        splitLine: {
          show: activeChartType === 'scatter',
          lineStyle: { color: 'rgba(246,243,236,0.06)' }
        }
      },
      yAxis: {
        show: activeChartType !== 'pie',
        type: 'value',
        name: activeChartType === 'histogram' ? 'Frequency' : data.yName || 'Value',
        nameTextStyle: { color: 'rgba(246,243,236,0.55)', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(246, 243, 236, 0.2)' } },
        splitLine: { lineStyle: { color: 'rgba(246, 243, 236, 0.08)' } },
        axisLabel: { color: 'rgba(246, 243, 236, 0.7)', fontSize: 11 }
      },
      series: []
    };

    if (activeChartType === 'line') {
      option.series = [
        {
          name: config.name,
          type: 'line',
          data: data.y,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: THEME.amber },
          itemStyle: { color: THEME.amber },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(226, 165, 61, 0.35)' },
              { offset: 1, color: 'rgba(226, 165, 61, 0.0)' }
            ])
          }
        }
      ];
    } else if (activeChartType === 'bar') {
      option.series = [
        {
          name: config.name,
          type: 'bar',
          data: data.y,
          barMaxWidth: 42,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: THEME.teal },
              { offset: 1, color: 'rgba(95, 179, 163, 0.25)' }
            ]),
            borderRadius: [3, 3, 0, 0]
          }
        }
      ];
    } else if (activeChartType === 'scatter') {
      option.series = [
        {
          name: config.name,
          type: 'scatter',
          data: data.scatter || data.x.map((xv, i) => [i, data.y[i]]),
          symbolSize: 10,
          itemStyle: {
            color: THEME.amberSoft,
            opacity: 0.85,
            shadowBlur: 8,
            shadowColor: 'rgba(226,165,61,0.25)'
          },
          emphasis: { scale: 1.25 }
        }
      ];
    } else if (activeChartType === 'pie') {
      const pieData =
        data.categories && data.categories.length
          ? data.categories
          : // Fallback: sample evenly across series (max 10 slices)
            (() => {
              const n = Math.min(10, data.x.length);
              const step = Math.max(1, Math.floor(data.x.length / n));
              const slices = [];
              for (let i = 0; i < data.x.length && slices.length < n; i += step) {
                slices.push({ name: String(data.x[i]), value: data.y[i] });
              }
              return slices;
            })();

      option.xAxis.show = false;
      option.yAxis.show = false;
      option.series = [
        {
          name: config.name,
          type: 'pie',
          radius: ['38%', '68%'],
          center: ['50%', '46%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 5, borderColor: THEME.ink, borderWidth: 2 },
          label: {
            show: true,
            color: THEME.paper,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            formatter: '{b}'
          },
          labelLine: { lineStyle: { color: 'rgba(246,243,236,0.35)' } },
          data: pieData
        }
      ];
    } else if (activeChartType === 'histogram') {
      const vals = data.y.filter((v) => typeof v === 'number' && !isNaN(v));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const binCount = Math.min(10, Math.max(5, Math.round(Math.sqrt(vals.length))));
      const width = (max - min) / binCount || 1;
      const bins = Array(binCount).fill(0);
      const labels = [];
      for (let i = 0; i < binCount; i++) {
        const a = min + i * width;
        const b = min + (i + 1) * width;
        labels.push(a.toFixed(1) + '–' + b.toFixed(1));
      }
      vals.forEach((val) => {
        let idx = Math.floor((val - min) / width);
        if (idx >= binCount) idx = binCount - 1;
        if (idx < 0) idx = 0;
        bins[idx]++;
      });
      option.xAxis.data = labels;
      option.xAxis.name = data.yName || 'Value';
      option.series = [
        {
          name: 'Frequency',
          type: 'bar',
          data: bins,
          barMaxWidth: 48,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#38bdf8' },
              { offset: 1, color: 'rgba(56, 189, 248, 0.25)' }
            ]),
            borderRadius: [3, 3, 0, 0]
          }
        }
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
    const target = currentFact.dataset || 'population';
    loadDataset(target);

    const viz = $('vizPanel') || $('chartContainer');
    if (viz) {
      viz.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Brief highlight
    const panel = $('vizPanel');
    if (panel) {
      panel.classList.add('playground-flash');
      setTimeout(() => panel.classList.remove('playground-flash'), 1200);
    }
  }

  function bindEvents() {
    const nextBtn = $('nextFactBtn');
    if (nextBtn) nextBtn.addEventListener('click', displayRandomFact);

    const exploreBtn = $('exploreFactBtn');
    if (exploreBtn) exploreBtn.addEventListener('click', exploreCurrentFact);

    const datasetSelect = $('datasetSelect');
    if (datasetSelect) {
      datasetSelect.addEventListener('change', (e) => loadDataset(e.target.value));
    }

    const chartTypeSelect = $('chartTypeSelect');
    if (chartTypeSelect) {
      chartTypeSelect.addEventListener('change', (e) => {
        activeChartType = e.target.value;
        if (cache[activeDatasetId]) renderChart(cache[activeDatasetId]);
        else loadDataset(activeDatasetId);
      });
    }

    const downloadBtn = $('downloadChartBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        if (!chartInstance) return;
        const url = chartInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: THEME.ink
        });
        const link = document.createElement('a');
        link.download = 'data-playground-' + activeDatasetId + '-' + activeChartType + '.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
