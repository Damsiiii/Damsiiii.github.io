import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ReactECharts from 'echarts-for-react';
import { Download, Shuffle, BarChart2, ArrowLeft, Sparkles } from 'lucide-react';

const Header = () => (
  <header className="bg-[#e6ded3] border-b-2 border-dashed border-[#282420] py-4 px-6 sticky top-0 z-50">
    <div className="max-w-5xl mx-auto flex justify-between items-center">
      <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2 text-[#221e1a]">
        <BarChart2 className="text-[#c93535] stroke-[2.5]" size={28} />
        <span>Data Playground<span className="text-[#c93535]">.</span></span>
      </h1>
      <a 
        href="../" 
        className="font-hand text-lg text-[#275696] hover:text-[#c93535] flex items-center gap-1.5 transition-colors border-2 border-[#275696] hover:border-[#c93535] px-3.5 py-1 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] shadow-[2px_2px_0px_0px_#282420] hover:shadow-[1px_1px_0px_0px_#282420] hover:translate-x-0.5 hover:translate-y-0.5 bg-[#eee5da]"
      >
        <ArrowLeft size={18} /> Back to Portfolio
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
    if (currentFact) setDatasetId(currentFact.dataset);
  };

  const getChartOption = () => {
    if (!chartData || chartData.length === 0) return {};
    
    const columns = Object.keys(chartData[0]);
    if (columns.length < 2) return {};
    
    const xAxisCol = columns[0];
    const seriesCols = columns.slice(1);
    
    const colors = ['#c93535', '#275696', '#cf7107', '#0d8579', '#6d32d4', '#c9206c'];

    return {
      color: colors,
      textStyle: {
        fontFamily: "'Patrick Hand', cursive",
        fontSize: 14,
        color: '#221e1a'
      },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: '#eee5da',
        borderColor: '#282420',
        borderWidth: 2,
        textStyle: {
          fontFamily: "'Patrick Hand', cursive",
          fontSize: 15,
          color: '#221e1a'
        },
        extraCssText: 'box-shadow: 4px 4px 0px 0px #282420; border-radius: 8px;'
      },
      legend: { 
        data: seriesCols, 
        top: 'bottom',
        textStyle: {
          fontFamily: "'Patrick Hand', cursive",
          fontSize: 15,
          color: '#221e1a'
        }
      },
      toolbox: {
        feature: {
          saveAsImage: { title: 'Download Chart' }
        }
      },
      xAxis: {
        type: 'category',
        data: chartData.map(row => row[xAxisCol]),
        axisLine: { lineStyle: { color: '#282420', width: 2 } },
        axisLabel: {
          fontFamily: "'Patrick Hand', cursive",
          fontSize: 13,
          color: '#221e1a'
        }
      },
      yAxis: { 
        type: 'value',
        axisLine: { lineStyle: { color: '#282420', width: 2 } },
        splitLine: { lineStyle: { type: 'dashed', color: '#cfc5b5' } },
        axisLabel: {
          fontFamily: "'Patrick Hand', cursive",
          fontSize: 13,
          color: '#221e1a'
        }
      },
      series: seriesCols.map((col, idx) => ({
        name: col,
        type: chartType === 'scatter' ? 'scatter' : chartType === 'bar' ? 'bar' : 'line',
        data: chartData.map(row => row[col]),
        smooth: true,
        itemStyle: {
          color: colors[idx % colors.length]
        },
        lineStyle: {
          width: 3
        }
      }))
    };
  };

  return (
    <div className="min-h-screen bg-[#e6ded3] text-[#221e1a] font-hand">
      <Header />
      
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-10 py-10">
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-[#275696] font-bold">
            <Sparkles size={16} className="text-[#c93535]" /> Interactive Laboratory
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#221e1a]">
            Explore Real Data<span className="text-[#c93535]">!</span>
          </h2>
          <p className="text-xl text-[#221e1a]/80 max-w-xl mx-auto">
            Discover hidden patterns, trends, and quirky curiosities through interactive hand-crafted visualizations.
          </p>
        </section>

        {/* Fact Card (Post-it note) */}
        {currentFact && (
          <section className="relative bg-[#e6d396] p-6 sm:p-8 border-2 border-[#282420] rounded-[15px_255px_15px_225px/255px_15px_225px_15px] shadow-[4px_4px_0px_0px_#282420] max-w-2xl mx-auto -rotate-0.5 hover:rotate-0 transition-transform">
            <div className="tape-strip"></div>
            
            <div className="flex justify-between items-start mb-4">
              <span className="inline-block font-hand text-sm font-bold text-[#c93535] bg-red-500/10 border border-dashed border-[#c93535] px-3 py-0.5 rounded-[8px_18px_12px_16px/14px_10px_18px_8px] uppercase tracking-wider">
                {currentFact.category}
              </span>
              <button 
                onClick={generateRandomFact}
                className="font-hand text-base text-[#275696] hover:text-[#c93535] flex items-center gap-1.5 transition-colors border border-dashed border-[#275696] px-3 py-1 rounded-[8px_18px_12px_16px] hover:bg-white/50"
              >
                <Shuffle size={16} /> Random Fact
              </button>
            </div>
            
            <h3 className="font-heading text-2xl sm:text-3xl font-bold mb-3 text-[#221e1a]">
              {currentFact.title}
            </h3>
            <p className="text-[#221e1a]/85 text-lg sm:text-xl leading-relaxed mb-6">
              {currentFact.explanation}
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t-2 border-dashed border-[#282420]/20">
              <span className="text-sm text-[#221e1a]/65 font-hand">
                Source: {currentFact.source}
              </span>
              <button 
                onClick={handleExploreFact}
                className="wobbly-btn bg-[#eee5da] hover:bg-[#c93535] text-[#221e1a] hover:text-white px-6 py-2 text-lg font-bold transition-all self-start sm:self-auto"
              >
                {currentFact.buttonText || "Explore This Data"} →
              </button>
            </div>
          </section>
        )}

        {/* Playground Exploration Card */}
        <section className="bg-[#eee5da] border-2 border-[#282420] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] shadow-[6px_6px_0px_0px_#282420] overflow-hidden">
          <div className="bg-[#e6ded3] p-5 sm:p-6 border-b-2 border-dashed border-[#282420] flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 sm:gap-6 items-center w-full sm:w-auto">
              <div className="flex-1 sm:flex-none">
                <label className="block text-sm font-bold text-[#221e1a]/70 mb-1 font-hand uppercase tracking-wider">
                  Select Dataset
                </label>
                <select 
                  className="bg-[#eee5da] border-2 border-[#282420] text-[#221e1a] text-base rounded-[8px_18px_12px_16px] block w-full sm:w-52 p-2.5 outline-none cursor-pointer shadow-[2px_2px_0px_0px_#282420] hover:border-[#275696] font-hand"
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                >
                  <option value="population">World Population</option>
                  <option value="climate">Climate Change</option>
                  <option value="movies">Movies Box Office</option>
                  <option value="spotify">Spotify Top Songs</option>
                  <option value="happiness">World Happiness</option>
                </select>
              </div>
              <div className="flex-1 sm:flex-none">
                <label className="block text-sm font-bold text-[#221e1a]/70 mb-1 font-hand uppercase tracking-wider">
                  Chart Type
                </label>
                <select 
                  className="bg-[#eee5da] border-2 border-[#282420] text-[#221e1a] text-base rounded-[8px_18px_12px_16px] block w-full sm:w-44 p-2.5 outline-none cursor-pointer shadow-[2px_2px_0px_0px_#282420] hover:border-[#275696] font-hand"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <option value="line">Line Graph</option>
                  <option value="bar">Bar Chart</option>
                  <option value="scatter">Scatter Plot</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-8 space-y-6">
             <div className="bg-[#e6ded3] p-4 rounded-xl border border-dashed border-[#cfc5b5]">
               <ReactECharts 
                 option={getChartOption()} 
                 style={{ height: '420px', width: '100%' }} 
                 opts={{ renderer: 'svg' }}
               />
             </div>

             {/* Speech bubble style insight */}
             <div className="relative bg-[#eee5da] text-[#221e1a] p-5 rounded-[8px_18px_12px_16px/14px_10px_18px_8px] border-2 border-[#275696] shadow-[3px_3px_0px_0px_rgba(39,86,150,0.2)]">
               <div className="font-heading font-bold text-[#275696] text-base mb-1 flex items-center gap-1.5">
                 <span>💡 Hand-Drawn Data Insight:</span>
               </div>
               <p className="text-lg leading-relaxed text-[#221e1a]/85">
                 {chartData?.length 
                   ? `Analyzing ${chartData.length} records in the ${datasetId} dataset. Interactive points update directly based on your selected visualization mode.` 
                   : "Loading dataset entries..."}
               </p>
             </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-dashed border-[#cfc5b5] py-8 text-center text-[#221e1a]/50 font-hand text-base">
        Hand-crafted with ♥ for data exploration · Damsara Dissanayaka © 2026
      </footer>
    </div>
  );
};

export default App;
