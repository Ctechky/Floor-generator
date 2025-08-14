import React, { useMemo, useState } from 'react';
import type { Unit, Dimension, BlockedArea, Layout, Room } from '../roomtype';
import Legend from './Legend';
import Plotly2DView from './Plotly2DView';
import ThreeJS3DView from './ThreeJS3DView';

// Assuming Plotly types are not exported, using Partial<any> for shapes
type PlotlyShape = Partial<any>;

interface FloorplanCanvasProps {
  theme: 'light' | 'dark';
  floorAreaDimensions: Dimension;
  units: Unit;
  blockedAreas: BlockedArea[];
  layout: Layout | undefined;
  coverage: number;
  isLoading: boolean;
  error: string | null;
  rooms: Room[];
}

export interface LegendItem {
  key: string;
  name: string;
  color: string;
}

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none ${
            isActive
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-interactive)]'
        }`}
    >
        {children}
    </button>
);


const FloorplanCanvas: React.FC<FloorplanCanvasProps> = ({
  theme, floorAreaDimensions, units, blockedAreas, layout, coverage, isLoading, error, rooms
}) => {
  const [activeView, setActiveView] = useState<'2D' | '3D'>('2D');
  
  // Memoized calculation for drawing data, used by 2D plot.
  const drawingData = useMemo(() => {
    const { width: floorW, height: floorH } = floorAreaDimensions;
    
    const shapes: PlotlyShape[] = [];

    // Draw a bold outline for the entire floor area to mark the input boundary
    if (floorW > 0 && floorH > 0) {
        shapes.push({
            type: 'rect',
            x0: 0,
            y0: 0,
            x1: floorW,
            y1: floorH,
            line: {
                color: 'var(--canvas-outline)',
                width: 4,
            },
            fillcolor: 'none',
            layer: 'below',
        });
    }

    layout?.placedRooms.forEach(item => {
        const w = item.rotated ? item.dimensions.height : item.dimensions.width;
        const h = item.rotated ? item.dimensions.width : item.dimensions.height;

        if (w <= 0 || h <= 0) return;
        
        shapes.push({
            type: 'rect',
            x0: item.x, y0: item.y, x1: item.x + w, y1: item.y + h,
            fillcolor: item.color,
            line: { color: 'var(--canvas-room-stroke)', width: 1.5 },
            layer: 'below'
        });
    });

    blockedAreas.forEach(item => {
        const { width: w, height: h } = item;
        if (w <= 0 || h <= 0) return;

        shapes.push({
            type: 'rect',
            x0: item.x, y0: item.y, x1: item.x + w, y1: item.y + h,
            fillcolor: 'rgba(128, 128, 128, 0.4)', // Semi-transparent gray
            fillpattern: {
                shape: 'x', // Cross-hatch pattern
                bgcolor: 'var(--canvas-bg)',
                fgcolor: 'rgba(100, 100, 100, 0.6)',
                size: 8,
            },
            line: { color: 'var(--canvas-blocked-stroke)', width: 1.5 },
            layer: 'below'
        });
    });
    
    // Add an invisible trace to enforce the boundaries for autorange
    const boundaryTrace = {
        x: [0, floorW],
        y: [0, floorH],
        mode: 'markers' as const,
        marker: { opacity: 0 },
        hoverinfo: 'none' as const,
        showlegend: false,
    };

    return { plotTraces: [boundaryTrace], shapes };
  }, [floorAreaDimensions, blockedAreas, layout]);
  
  const legendItems = useMemo(() => {
    if (!layout) return [];

    const items: LegendItem[] = [];
    const addedNames = new Set<string>();

    // Create a map for quick color lookup from the original room definitions
    const roomColorMap = new Map(rooms.map(r => [r.name, r.color]));

    layout.placedRooms.forEach(room => {
      if (!addedNames.has(room.name)) {
        items.push({ key: room.name, name: room.name, color: roomColorMap.get(room.name) || '#cccccc' });
        addedNames.add(room.name);
      }
    });

    blockedAreas.forEach(area => {
      if (!addedNames.has(area.name)) {
        items.push({ key: area.name, name: area.name, color: '#808080' });
        addedNames.add(area.name);
      }
    });
    return items;
  }, [layout, rooms, blockedAreas]);


  const message = useMemo(() => {
    if (isLoading) return "Generating layouts, please wait...";
    if (error) return error;
    if (!layout && blockedAreas.length === 0 && rooms.length === 0) return 'Define your space and click "Generate Layouts" to begin';
    if (!layout) return 'Click "Generate Layouts" to begin';
    return null;
  }, [isLoading, error, layout, rooms, blockedAreas]);

  return (
    <>
      <div className="flex-shrink-0 flex justify-between items-baseline mb-2 px-1">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Floor Plan {floorAreaDimensions.width}x{floorAreaDimensions.height} {units}
        </h2>
        {layout && !message && (
          <div className="text-right text-sm sm:text-base">
            <p className="font-medium text-[var(--text-secondary)]">Rooms: {layout.placedRooms.length}</p>
            <p className="font-medium text-[var(--text-secondary)]">Coverage: {coverage.toFixed(1)}%</p>
          </div>
        )}
      </div>

      <div className="flex-grow w-full min-h-0 flex flex-col items-stretch justify-center relative">
         <div className="flex-shrink-0 flex border-b border-[var(--border-secondary)]">
            <TabButton isActive={activeView === '2D'} onClick={() => setActiveView('2D')}>2D View</TabButton>
            <TabButton isActive={activeView === '3D'} onClick={() => setActiveView('3D')}>3D View</TabButton>
         </div>

        <div className="flex-grow w-full min-h-0 flex flex-col md:flex-row items-stretch justify-center relative bg-[var(--bg-secondary)] rounded-b-lg overflow-hidden p-1 gap-4">
            <div className="flex-grow h-full w-full flex items-center justify-center relative">
                
                {activeView === '2D' && (
                    <Plotly2DView
                        theme={theme}
                        floorAreaDimensions={floorAreaDimensions}
                        units={units}
                        layout={layout}
                        drawingData={drawingData}
                    />
                )}
                {activeView === '3D' && (
                    <ThreeJS3DView
                        theme={theme}
                        floorAreaDimensions={floorAreaDimensions}
                        layout={layout}
                        blockedAreas={blockedAreas}
                    />
                )}
                
                {(!layout && message && !error) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="text-lg text-center p-6 bg-[var(--bg-tertiary)] bg-opacity-90 rounded-lg text-[var(--text-secondary)] shadow-2xl">
                        <p>{message}</p>
                    </div>
                    </div>
                )}
                {(error) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="max-w-md text-lg text-center p-6 bg-red-900/80 rounded-lg text-red-100 shadow-2xl border border-red-500/50">
                            <p>{error}</p>
                        </div>
                    </div>
                )}
            </div>
            
            {(layout) && (
                <Legend
                    legendItems={legendItems}
                />
            )}
        </div>
      </div>
    </>
  );
};

export default FloorplanCanvas;