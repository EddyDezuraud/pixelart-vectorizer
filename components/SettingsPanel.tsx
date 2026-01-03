
import React from 'react';
import { OptimizationMode, VectorizationSettings } from '../types';

interface SettingsPanelProps {
  settings: VectorizationSettings;
  setSettings: (settings: VectorizationSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings }) => {
  const handleChange = (key: keyof VectorizationSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm space-y-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2 text-center lg:text-left">Paramètres</h2>
      
      {/* Taille Pixel */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Taille de pixel (Export)</label>
        <input 
          type="number" 
          min="1" 
          max="100" 
          value={settings.pixelSize}
          onChange={(e) => handleChange('pixelSize', parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      {/* Optimisation */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Stratégie de fusion</label>
        <select 
          value={settings.optimization}
          onChange={(e) => handleChange('optimization', e.target.value as OptimizationMode)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
        >
          <option value={OptimizationMode.NONE}>Aucune (Brut)</option>
          <option value={OptimizationMode.HORIZONTAL}>Fusion horizontale</option>
          <option value={OptimizationMode.GREEDY_2D}>Fusion 2D (Optimal)</option>
        </select>
      </div>

      {/* Quantification (Nouveau) */}
      <div className="pt-4 border-t space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="quantize" className="text-sm font-semibold text-gray-700 cursor-pointer">Limiter le nombre de couleurs</label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input 
              type="checkbox" 
              id="quantize" 
              checked={settings.enableColorQuantization}
              onChange={(e) => handleChange('enableColorQuantization', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
        </div>

        {settings.enableColorQuantization && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex justify-between">
               <label className="text-xs font-medium text-gray-500">Palette Max (K)</label>
               <input 
                  type="number"
                  min="2"
                  max="256"
                  value={settings.maxColors}
                  onChange={(e) => handleChange('maxColors', parseInt(e.target.value) || 2)}
                  className="w-16 px-1 text-right text-xs font-bold text-blue-600 border rounded"
               />
            </div>
            <input 
              type="range" 
              min="2" 
              max="64" 
              value={settings.maxColors}
              onChange={(e) => handleChange('maxColors', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[10px] text-gray-400">Force l'image à utiliser seulement N couleurs.</p>
          </div>
        )}
      </div>

      {/* Simplification Couleurs */}
      <div className="pt-4 border-t space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="simplify" className="text-sm font-semibold text-gray-700 cursor-pointer">Simplification (Tolérance)</label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input 
              type="checkbox" 
              id="simplify" 
              checked={settings.enableColorSimplification}
              onChange={(e) => handleChange('enableColorSimplification', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
        </div>

        {settings.enableColorSimplification && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex justify-between">
               <label className="text-xs font-medium text-gray-500">Seuil Delta-E</label>
               <span className="text-xs font-bold text-blue-600">{settings.colorTolerance}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="150" 
              value={settings.colorTolerance}
              onChange={(e) => handleChange('colorTolerance', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        )}
      </div>

      {/* Alpha & Minify */}
      <div className="pt-4 border-t space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Seuil Transparence</label>
          <input 
            type="range" 
            min="0" 
            max="255" 
            value={settings.alphaThreshold}
            onChange={(e) => handleChange('alphaThreshold', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <input 
            type="checkbox" 
            id="minify" 
            checked={settings.minify}
            onChange={(e) => handleChange('minify', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
          />
          <label htmlFor="minify" className="text-xs font-bold text-gray-600 cursor-pointer uppercase tracking-wider">Minifier le SVG</label>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
