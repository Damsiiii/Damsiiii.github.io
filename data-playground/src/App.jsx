import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ReactECharts from 'echarts-for-react';
import { ArrowLeft, Shuffle, Download } from 'lucide-react';

const Header = () => (
  <header className="bg-[#F9F8F6]/90 backdrop-blur-md border-b border-[#1A1A1A]/10 py-5 px-6 sm:px-12 sticky top-0 z-50 transition-colors duration-500">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        <a href="../" className="font-serif text-lg tracking-[0.14em] font-semibold text-[#1A1A1A] uppercase">
          Damsara <span className="text-[#D4AF37]">.</span>
        </a>
        <span className="hidden sm:inline-block text-[10px] tracking-[0.25em] uppercase text-[#6C6863] border-l border-[#1A1A1A]/15 pl-3">
          Data Atelier / Vol. 2026
        </span>
      </div>
      <a 
        href="../" 
        className="luxury-btn-outline h-9 px-4 text-[11px] tracking-[0.2em]"
      >
        <ArrowLeft size={13} className="text-[#D4AF37]" />
        <span>Return to Portfolio</span>
      </a>
    </div>
  </header>
);

const App = () => {
  const [facts, setFacts] = useState([]);
  const [currentFact, setCurrentFact] = useState(null);
  
  const [datasetId, setDatasetId] = useState('population');
  const [chartType, setChartType] = useState('line');
  const [chartData, setChartData] = useState(null);
  const chartRef = React.useRef(null);
  
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    fetch(`${baseUrl}data/facts.json`)
      .then(res => res.json())
      .then(data => {
        setFacts(data);
        setCurrentFact(data[Math.floor(Math.random() * data.length)]);
      })
      .catch(err => console.error("Could not load facts", err));
  }, []);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    fetch(`${baseUrl}data/datasets/${datasetId}.csv`)
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            setChartData(results.data);
          }
        });
      })
      .catch(err => console.error("Could not load dataset", err));
  }, [datasetId]);

  const generateRandomFact = () => {
    if (facts.length > 0) {
      let newFact;
      do {
        newFact = facts[Math.floor(Math.random() * facts.length)];
      } while (newFact.id === currentFact?.id && facts.length > 1);
      setCurrentFact(newFact);
    }
  };
  
  const handleExploreFact = () => {
    if (currentFact && currentFact.dataset) {
      setDatasetId(currentFact.dataset);
      const element = document.getElementById('visualizer-atelier');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const echartInstance = chartRef.current.getEchartsInstance();
      const picInfo = echartInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#F9F8F6'
      });
      const link = document.createElement('a');
      link.download = `atelier-${datasetId}-${chartType}.png`;
      link.href = picInfo;
      link.click();
    }
  };

  const getChartOption = () => {
    if (!chartData || chartData.length === 0) return {};
    
    const columns = Object.keys(chartData[0]);
    if (columns.length < 2) return {};
    
    const xAxisCol = columns[0];
    const seriesCols = columns.slice(1);
    
    const colors = ['#1A1A1A', '#D4AF37', '#6C6863', '#8C7D6B', '#3E4451', '#A6926D'];

    return {
      backgroundColor: 'transparent',
      color: colors,
      animationDuration: 800,
      animationEasing: 'cubicOut',
      textStyle: {
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        color: '#1A1A1A'
      },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: '#1A1A1A',
        borderWidth: 1,
        textStyle: {
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: '#1A1A1A'
        },
        extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.08); padding: 14px 18px; border-radius: 0px;'
      },
      legend: { 
        data: seriesCols, 
        top: 'bottom',
        textStyle: {
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: '#6C6863'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.map(row => row[xAxisCol]),
        axisLine: { lineStyle: { color: '#1A1A1A', width: 1 } },
        axisTick: { show: true, lineStyle: { color: '#1A1A1A', width: 1 } },
        axisLabel: {
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: '#6C6863',
          rotate: chartData.length > 15 ? 35 : 0
        }
      },
      yAxis: { 
        type: 'value',
        axisLine: { lineStyle: { color: '#1A1A1A', width: 1 } },
        splitLine: { lineStyle: { type: 'solid', color: 'rgba(26, 26, 26, 0.08)' } },
        axisLabel: {
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: '#6C6863'
        }
      },
      series: seriesCols.map((col, idx) => ({
        name: col,
        type: chartType === 'scatter' ? 'scatter' : chartType === 'bar' ? 'bar' : 'line',
        data: chartData.map(row => row[col]),
        smooth: true,
        symbolSize: 6,
        barMaxWidth: 36,
        itemStyle: {
          color: colors[idx % colors.length],
          borderRadius: 0
        },
        lineStyle: {
          width: 2
        },
        areaStyle: chartType === 'line' && idx === 0 ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(212, 175, 55, 0.22)' },
              { offset: 1, color: 'rgba(212, 175, 55, 0.0)' }
            ]
          }
        } : undefined
      }))
    };
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] relative selection:bg-[#D4AF37] selection:text-white">
      {/* Paper Grain Overlay */}
      <div className="paper-noise" aria-hidden="true"></div>

      {/* Architectural Gridlines */}
      <div className="architectural-grid" aria-hidden="true">
        <div className="grid-col-line"></div>
        <div className="grid-col-line"></div>
        <div className="grid-col-line"></div>
        <div className="grid-col-line"></div>
      </div>

      <Header />
      
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-16 space-y-24 relative z-10">
        
        {/* Editorial Hero Banner */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end border-b border-[#1A1A1A]/10 pb-16">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-semibold tracking-[0.28em] text-[#D4AF37] uppercase">
                Empirical Analytics
              </span>
              <span className="h-px w-12 bg-[#1A1A1A]/20"></span>
              <span className="text-[11px] tracking-[0.25em] text-[#6C6863] uppercase">
                Edition MMXXVI
              </span>
            </div>
            
            <h1 className="font-serif text-5xl sm:text-7xl font-normal leading-[0.92] tracking-tight text-[#1A1A1A]">
              Statistical <span className="italic-accent">Perspectives</span>.
            </h1>
            
            <p className="text-lg text-[#6C6863] font-light max-w-2xl leading-relaxed drop-cap">
              An interactive laboratory analyzing real-world global time-series, demographic trajectories, and cultural distributions through high-contrast editorial visualization models.
            </p>
          </div>

          <div className="lg:col-span-4 border-t-2 border-[#1A1A1A] pt-6 space-y-6">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[#6C6863] font-medium">
              Atelier Coordinates
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="font-serif text-4xl text-[#1A1A1A]">05</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#6C6863] mt-1">Verified Corpora</div>
              </div>
              <div>
                <div className="font-serif text-4xl text-[#1A1A1A]">03</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#6C6863] mt-1">Geometric Projections</div>
              </div>
            </div>
          </div>
        </section>

        {/* Curated Fact Feature Card (Inverted Dark Surface for Contrast) */}
        {currentFact && (
          <section className="bg-[#141414] text-[#F9F8F6] border-t-2 border-[#D4AF37] p-8 sm:p-14 shadow-[0_8px_32px_rgba(0,0,0,0.12)] relative">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-[#D4AF37] border-b border-[#D4AF37] pb-0.5">
                  {currentFact.category || "Empirical Observation"}
                </span>
                <span className="text-xs text-white/30">/</span>
                <span className="text-[11px] tracking-widest text-[#A09B94] uppercase">
                  Observation #{currentFact.id || "01"}
                </span>
              </div>
              <button 
                onClick={generateRandomFact}
                className="luxury-btn-outline h-8 px-4 text-[10px] tracking-[0.2em] text-white border-white/20 hover:bg-white hover:text-[#141414]"
              >
                <Shuffle size={12} className="text-[#D4AF37]" /> Next Observation
              </button>
            </div>
            
            <div className="space-y-4 max-w-4xl">
              <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#F9F8F6] leading-snug">
                {currentFact.title}
              </h2>
              <p className="text-[#A09B94] text-base sm:text-lg leading-relaxed font-light">
                {currentFact.explanation}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 mt-8 border-t border-white/10">
              <div className="text-xs text-[#A09B94] italic">
                Source Document: <span className="font-medium text-white not-italic">{currentFact.source}</span>
              </div>
              <button 
                onClick={handleExploreFact}
                className="luxury-btn-solid h-11 text-xs"
              >
                <span>{currentFact.buttonText || "Examine Dataset"} →</span>
              </button>
            </div>
          </section>
        )}

        {/* Playground Exploration Atelier */}
        <section id="visualizer-atelier" className="bg-white border-t-2 border-[#1A1A1A] shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          {/* Controls Bar */}
          <div className="p-6 sm:p-10 border-b border-[#1A1A1A]/10 flex flex-wrap gap-8 items-end justify-between bg-[#F9F8F6]/50">
            <div className="flex flex-wrap gap-8 items-center w-full sm:w-auto">
              <div className="flex-1 sm:flex-none">
                <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-[#6C6863] mb-2">
                  Dataset Corpus
                </label>
                <select 
                  className="bg-transparent border-b border-[#1A1A1A] text-[#1A1A1A] text-sm py-2 pr-8 outline-none cursor-pointer focus:border-[#D4AF37] font-medium transition-colors"
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                >
                  <option value="population">World Population Ingestion</option>
                  <option value="climate">Atmospheric Temperature Deviations</option>
                  <option value="movies">Global Box Office Performance</option>
                  <option value="spotify">Spotify Streaming Audio Metrics</option>
                  <option value="happiness">World Happiness Index</option>
                </select>
              </div>

              <div className="flex-1 sm:flex-none">
                <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-[#6C6863] mb-2">
                  Projection Geometry
                </label>
                <select 
                  className="bg-transparent border-b border-[#1A1A1A] text-[#1A1A1A] text-sm py-2 pr-8 outline-none cursor-pointer focus:border-[#D4AF37] font-medium transition-colors"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <option value="line">Continuous Line Series</option>
                  <option value="bar">Discrete Column Histogram</option>
                  <option value="scatter">Distribution Scatter Plot</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleDownload}
              className="luxury-btn-outline h-9 px-4 text-[11px] tracking-[0.2em]"
            >
              <Download size={13} className="text-[#D4AF37]" />
              <span>Export Vector</span>
            </button>
          </div>
          
          <div className="p-6 sm:p-10 space-y-8">
             <div className="p-4 bg-[#F9F8F6] border border-[#1A1A1A]/10">
               <ReactECharts 
                 ref={chartRef}
                 option={getChartOption()} 
                 style={{ height: '440px', width: '100%' }} 
                 opts={{ renderer: 'svg' }}
               />
             </div>

             {/* Analytical Insight Strip */}
             <div className="border-l-2 border-[#D4AF37] bg-[#F9F8F6] p-6 space-y-2">
               <div className="text-[11px] tracking-[0.25em] uppercase font-semibold text-[#D4AF37] flex items-center gap-2">
                 <span>Statistical Note</span>
               </div>
               <p className="text-base text-[#1A1A1A] font-serif italic leading-relaxed">
                 {chartData?.length 
                   ? `Evaluated ${chartData.length} records in the ${datasetId} archive. Values update in real time across the selected visualization canvas.` 
                   : "Parsing data stream..."}
               </p>
             </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1A1A1A]/10 py-12 text-center text-[#6C6863] text-xs uppercase tracking-[0.25em] relative z-10">
        Data Atelier · Curated by Damsara Dissanayaka © 2026
      </footer>
    </div>
  );
};

export default App;
