import React, { useState, useCallback, useEffect } from 'react';
import { Unit, Dimension, Room, BlockedArea, Layout, BlockedAreaType } from './roomtype';
import ControlsPanel from './components/ControlsPanel';
import FloorplanCanvas from './components/FloorplanCanvas';
import { generateLayouts } from './generator/layoutgenerator';
import { generateDxfContent } from './generator/dxfExporter.ts';
import { generateJsonContent } from './generator/jsonExporter.ts';

const DEFAULT_FLOOR_DIMENSIONS = { width: 10, height: 10 };
const DEFAULT_ROOMS: Room[] = [
    { id: 'r1', name: 'Living Room', dimensions: { width: 4, height: 5 }, color: '#3b82f6', quantity: 1 },
];
const DEFAULT_BLOCKED_AREAS: BlockedArea[] = [
    { id: 'b1', name: 'Corridor', x: 0, y: 4, width: 10, height: 2 },
];
const DEFAULT_BLOCKED_AREA_TYPES: BlockedAreaType[] = [
    { id: 'ba_col', name: 'Column', dimensions: { width: 0.5, height: 0.5 } },
    { id: 'ba_stair', name: 'Staircase', dimensions: { width: 2, height: 4 } },
    { id: 'ba_elev', name: 'Elevator', dimensions: { width: 2, height: 2 } },
    { id: 'ba_wall', name: 'Structural Wall', dimensions: { width: 5, height: 0.2 } },
    { id: 'ba_corr', name: 'Corridor', dimensions: { width: 10, height: 1.5 } },
    { id: 'ba_fire', name: 'Fire Area', dimensions: { width: 2.5, height: 2.5 } },
    { id: 'ba_open', name: 'Open Area', dimensions: { width: 3, height: 3 } },
];

const downloadFile = (content: string, mimeType: string, filename: string) => {
    const dataBlob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

const App: React.FC = () => {
  const [floorAreaDimensions, setFloorAreaDimensions] = useState<Dimension>(DEFAULT_FLOOR_DIMENSIONS);
  const [units, setUnits] = useState<Unit>('m');
  const [blockedAreas, setBlockedAreas] = useState<BlockedArea[]>(DEFAULT_BLOCKED_AREAS);
  const [blockedAreaTypes, setBlockedAreaTypes] = useState<BlockedAreaType[]>(DEFAULT_BLOCKED_AREA_TYPES);
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);

  const [generatedLayouts, setGeneratedLayouts] = useState<Layout[]>([]);
  const [currentLayoutIndex, setCurrentLayoutIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    setGeneratedLayouts([]);
    setCurrentLayoutIndex(0);
    setError(null);
  }, [floorAreaDimensions, rooms, blockedAreas]);


  const handleGenerate = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setGeneratedLayouts([]);
    setCurrentLayoutIndex(0);

    setTimeout(() => {
      try {
        const finalLayouts = generateLayouts(floorAreaDimensions, rooms, blockedAreas);

        if (finalLayouts.length === 0) {
          setError("Could not generate any valid layouts. Try reducing the number of rooms or their sizes.");
        }
        setGeneratedLayouts(finalLayouts);
      } catch (e) {
        if (e instanceof Error) {
            setError(`An error occurred during generation: ${e.message}`);
        } else {
            setError("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    }, 50);
  }, [floorAreaDimensions, rooms, blockedAreas]);

  const handleNextLayout = () => {
    setCurrentLayoutIndex(prev => Math.min(prev + 1, generatedLayouts.length - 1));
  };

  const handlePrevLayout = () => {
    setCurrentLayoutIndex(prev => Math.max(prev - 1, 0));
  };
  
  const handleExportDxf = useCallback(() => {
      const currentLayout = generatedLayouts[currentLayoutIndex];
      if (!currentLayout) return;
      const dxfContent = generateDxfContent(floorAreaDimensions, currentLayout, blockedAreas, units, rooms);
      downloadFile(
          dxfContent,
          'application/dxf',
          `floorplan-layout-${currentLayoutIndex + 1}.dxf`
      );
  }, [generatedLayouts, currentLayoutIndex, floorAreaDimensions, blockedAreas, units, rooms]);

  const handleExportJson = useCallback(() => {
    const currentLayout = generatedLayouts[currentLayoutIndex];
    if (!currentLayout) return;
    const jsonContent = generateJsonContent(
        floorAreaDimensions,
        rooms,
        blockedAreas,
        currentLayout,
        units,
        currentLayoutIndex
    );
    downloadFile(
        jsonContent,
        'application/json',
        `floorplan-layout-${currentLayoutIndex + 1}.json`
    );
  }, [generatedLayouts, currentLayoutIndex, floorAreaDimensions, rooms, blockedAreas, units]);


  const handleClearAllSettings = useCallback(() => {
    setFloorAreaDimensions(DEFAULT_FLOOR_DIMENSIONS);
    setBlockedAreas([]);
    setRooms([]);
    setGeneratedLayouts([]);
    setCurrentLayoutIndex(0);
  }, []);

  const totalFloorArea = floorAreaDimensions.width * floorAreaDimensions.height;
  const currentLayout = generatedLayouts[currentLayoutIndex];
  const currentCoverage = currentLayout && totalFloorArea > 0 ? (currentLayout.score / totalFloorArea) * 100 : 0;

  const baseButtonClasses = "btn px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)]";
  const primaryButtonClasses = `bg-[var(--accent-primary)] text-[var(--text-on-accent)] hover:bg-[var(--accent-primary-hover)]`;
  const outlinedButtonClasses = `border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-interactive)] hover:border-[var(--accent-primary)]`;

  return (
    <div className="min-h-screen w-screen flex flex-col font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] lg:h-screen lg:overflow-hidden">
      <header className="flex-shrink-0 text-center px-12 py-4">
        <div className="relative inline-block">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Floor Plan Generator
          </h1>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full ml-4">
            <button onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="p-2 rounded-full hover:bg-[var(--bg-interactive)] transition-colors text-2xl">
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mt-1 text-base">Design your space by defining rooms and constraints, then generate optimal layouts.</p>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0 px-4 pb-4">
        <div className="w-full lg:w-96 lg:flex-shrink-0 min-h-0 flex flex-col">
          <ControlsPanel
            floorAreaDimensions={floorAreaDimensions}
            setFloorAreaDimensions={setFloorAreaDimensions}
            units={units}
            setUnits={setUnits}
            blockedAreas={blockedAreas}
            setBlockedAreas={setBlockedAreas}
            blockedAreaTypes={blockedAreaTypes}
            rooms={rooms}
            setRooms={setRooms}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            onClearAll={handleClearAllSettings}
          />
        </div>

        <div className="flex-grow flex flex-col bg-[var(--bg-tertiary)] rounded-xl shadow-2xl p-4 sm:p-6 min-h-0" style={{boxShadow: `0 10px 25px -5px var(--shadow-color)`}}>
          <FloorplanCanvas
            theme={theme}
            floorAreaDimensions={floorAreaDimensions}
            units={units}
            blockedAreas={blockedAreas}
            layout={currentLayout}
            coverage={currentCoverage}
            isLoading={isLoading}
            error={error}
            rooms={rooms}
          />
          {generatedLayouts.length > 0 && !isLoading && (
            <div className="flex flex-row flex-wrap gap-2 items-center justify-center mt-4">
              <button
                onClick={handlePrevLayout}
                disabled={currentLayoutIndex === 0}
                className={`${baseButtonClasses} ${outlinedButtonClasses}`}
              >
                Previous
              </button>
              <p className="text-lg font-medium whitespace-nowrap">
                Layout {currentLayoutIndex + 1} of {generatedLayouts.length}
              </p>
              <button
                onClick={handleNextLayout}
                disabled={currentLayoutIndex === generatedLayouts.length - 1}
                className={`${baseButtonClasses} ${outlinedButtonClasses}`}
              >
                Next
              </button>
              <button
                  onClick={handleExportDxf}
                  className={`${baseButtonClasses} ${primaryButtonClasses}`}
                >
                  Export DXF
              </button>
              <button
                  onClick={handleExportJson}
                  className={`${baseButtonClasses} ${primaryButtonClasses}`}
                >
                  Export JSON
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;