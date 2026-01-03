
import React, { useState, useEffect, useCallback } from 'react';
import { VectorizationSettings, OptimizationMode, ImageStats, Pixel, Rect } from './types';
import { getImagePixels } from './services/imageLoader';
import { vectorize } from './services/vectorizer';
import { buildSvg } from './services/svgBuilder';
import SettingsPanel from './components/SettingsPanel';
import Dropzone from './components/Dropzone';

const DEFAULT_SETTINGS: VectorizationSettings = {
  pixelSize: 10,
  optimization: OptimizationMode.GREEDY_2D,
  alphaThreshold: 1,
  minify: false,
  enableColorSimplification: false,
  colorTolerance: 30,
  enableColorQuantization: false,
  maxColors: 16
};

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceData, setSourceData] = useState<{ pixels: Pixel[], width: number, height: number } | null>(null);
  const [settings, setSettings] = useState<VectorizationSettings>(DEFAULT_SETTINGS);
  const [svgString, setSvgString] = useState<string>('');
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  const handleFileSelect = (newFile: File) => {
    setFile(newFile);
  };

  useEffect(() => {
    if (!file) return;
    
    setProcessing(true);
    getImagePixels(file).then(data => {
      setSourceData(data);
      setProcessing(false);
    }).catch(err => {
      console.error(err);
      alert("Erreur lors du chargement de l'image.");
      setProcessing(false);
    });
  }, [file]);

  const processImage = useCallback(() => {
    if (!sourceData) return;
    
    setProcessing(true);
    // On utilise un timeout pour laisser respirer le thread UI
    setTimeout(() => {
      const rects = vectorize(sourceData.pixels, sourceData.width, sourceData.height, settings);
      const svg = buildSvg(rects, sourceData.width, sourceData.height, settings);
      
      setSvgString(svg);
      setStats({
        width: sourceData.width,
        height: sourceData.height,
        rectCount: rects.length,
        approxSizeKB: Math.round(svg.length / 1024 * 10) / 10
      });
      setProcessing(false);
    }, 10);
  }, [sourceData, settings]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  const downloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace('.png', '') || 'vectorized'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
              V
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-800">Pixel Vectorizer</h1>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mt-1">Pixel-Perfect SVG Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {stats && (
              <div className="hidden md:flex gap-4 text-xs font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 uppercase tracking-tighter">
                <span>{stats.width}x{stats.height} px</span>
                <span className="w-px h-3 bg-gray-300 self-center"></span>
                <span>{stats.rectCount} rects</span>
                <span className="w-px h-3 bg-gray-300 self-center"></span>
                <span className="text-blue-600">{stats.approxSizeKB} KB</span>
              </div>
            )}
            <button 
              onClick={downloadSvg}
              disabled={!svgString || processing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Exporter SVG
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Settings */}
        <aside className="lg:col-span-1 space-y-6">
          {!file ? (
             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 italic text-gray-400 text-center text-sm">
               Uploadez une image pour configurer les options.
             </div>
          ) : (
            <SettingsPanel settings={settings} setSettings={setSettings} />
          )}

          {stats && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Récapitulatif</h3>
               <div className="space-y-2">
                 <StatRow label="Fichier Source" value={`${stats.width}x${stats.height}`} />
                 <StatRow label="Éléments générés" value={stats.rectCount.toLocaleString()} />
                 <StatRow label="Poids du SVG" value={`${stats.approxSizeKB} KB`} />
                 <StatRow label="Optimisation" value={settings.optimization === OptimizationMode.GREEDY_2D ? '2D Greedy' : settings.optimization === OptimizationMode.HORIZONTAL ? 'Horizontal' : 'Aucune'} />
               </div>
            </div>
          )}
        </aside>

        {/* Center/Right Column: Viewport */}
        <section className="lg:col-span-3 space-y-6">
          {!file ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Dropzone onFileSelect={handleFileSelect} />
              <p className="mt-8 text-sm text-gray-400 text-center max-w-md">
                Idéal pour convertir vos sprites de jeux vidéo ou vos illustrations pixelisées en vecteurs infiniment redimensionnables sans perte de netteté.
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Source Preview */}
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Source (PNG)</h3>
                      <button onClick={() => setFile(null)} className="text-[10px] text-gray-400 font-bold hover:text-red-500 uppercase tracking-widest transition-colors">Fermer</button>
                    </div>
                    <div className="relative aspect-square rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden checkerboard group">
                       <img 
                        src={URL.createObjectURL(file)} 
                        alt="Original" 
                        className="max-w-full max-h-full transition-transform duration-300 group-hover:scale-105"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                 </div>

                 {/* Vector Preview */}
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3 relative">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Vecteur (SVG)</h3>
                      {processing && (
                        <span className="flex items-center gap-1.5 text-[10px] text-blue-500 font-bold animate-pulse uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          Calcul...
                        </span>
                      )}
                    </div>
                    <div className="relative aspect-square rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden checkerboard group">
                        <div 
                          className="max-w-full max-h-full transition-transform duration-300 group-hover:scale-105"
                          dangerouslySetInnerHTML={{ __html: svgString }}
                        />
                    </div>
                 </div>
              </div>

              {/* SVG Code Explorer Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Code SVG (1ers octets)</h3>
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-300"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-300"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-300"></div>
                    </div>
                 </div>
                 <pre className="bg-gray-900 text-blue-300 p-6 overflow-x-auto text-[10px] font-mono leading-relaxed max-h-40">
                    {svgString.substring(0, 1500)}
                    {svgString.length > 1500 ? '\n\n/* ... la suite est masquée pour préserver les performances de l\'aperçu ... */' : ''}
                 </pre>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 px-6 text-center text-xs text-gray-400">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span>Moteur de rendu <b>CrispEdges</b> actif</span>
           </div>
           <p>Pixel-Perfect Vectorizer &bull; Traitement 100% Local (Navigateur)</p>
           <div className="flex gap-6">
             <span className="hover:text-blue-500 cursor-help transition-colors">Documentation</span>
             <span className="hover:text-blue-500 cursor-help transition-colors">Github</span>
           </div>
         </div>
      </footer>
    </div>
  );
};

const StatRow: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-gray-400 font-medium">{label}</span>
    <span className="font-bold text-gray-700">{value}</span>
  </div>
);

export default App;
