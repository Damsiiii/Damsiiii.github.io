import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ReactECharts from 'echarts-for-react';
import { Download, Shuffle, BarChart2 } from 'lucide-react';

const Header = () => (
  <header className="bg-slate-900 text-white p-6 shadow-md">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart2 /> Data Playground
      </h1>
      <a href="../" className="text-slate-300 hover:text-white transition">
        &larr; Back to Portfolio
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
    fetch('/data-playground/data/facts.json')
      .then(res => res.json())
      .then(data => {
        setFacts(data);
        setCurrentFact(data[Math.floor(Math.random() * data.length)]);
      })
      .catch(err => console.error("Could not load facts", err));
  }, []);

  useEffect(() => {
    fetch(`/data-playground/data/datasets/${datasetId}.csv`)
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
    
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: seriesCols, top: 'bottom' },
      toolbox: {
        feature: {
          saveAsImage: { title: 'Download' }
        }
      },
      xAxis: {
        type: 'category',
        data: chartData.map(row => row[xAxisCol])
      },
      yAxis: { type: 'value' },
      series: seriesCols.map(col => ({
        name: col,
        type: chartType === 'scatter' ? 'scatter' : chartType === 'bar' ? 'bar' : 'line',
        data: chartData.map(row => row[col]),
        smooth: true
      }))
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />
      
      <main className="max-w-6xl mx-auto p-6 space-y-12 py-12">
        <section className="text-center space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight">Explore Data</h2>
          <p className="text-lg text-slate-600">Discover hidden patterns through interactive visualization.</p>
        </section>

        {/* Fact Card */}
        {currentFact && (
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-3xl mx-auto transform transition hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {currentFact.category}
              </span>
              <button 
                onClick={generateRandomFact}
                className="text-slate-400 hover:text-indigo-600 transition flex items-center gap-2"
              >
                <Shuffle size={18} /> New Fact
              </button>
            </div>
            <h3 className="text-2xl font-bold mb-2">{currentFact.title}</h3>
            <p className="text-slate-600 text-lg mb-6">{currentFact.explanation}</p>
            
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
              <span className="text-sm text-slate-500 font-mono">Source: {currentFact.source}</span>
              <button 
                onClick={handleExploreFact}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                {currentFact.buttonText}
              </button>
            </div>
          </section>
        )}

        {/* Playground */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dataset</label>
                <select 
                  className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-2.5"
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                >
                  <option value="population">World Population</option>
                  <option value="climate">Climate Change</option>
                  <option value="movies">Movies</option>
                  <option value="spotify">Spotify</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chart Type</label>
                <select 
                  className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-2.5"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="scatter">Scatter Plot</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-6">
             <ReactECharts 
               option={getChartOption()} 
               style={{ height: '400px', width: '100%' }} 
               opts={{ renderer: 'svg' }}
             />
             <div className="mt-6 bg-amber-50 text-amber-900 p-4 rounded-lg border border-amber-200 flex gap-3">
               <strong className="font-semibold">Insight:</strong>
               <span>{chartData?.length ? `The data shows noticeable trends across the tracked period.` : "Loading..."}</span>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
