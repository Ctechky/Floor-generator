import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { Unit, Dimension, Layout } from '../roomtype';

interface Plotly2DViewProps {
  theme: 'light' | 'dark';
  floorAreaDimensions: Dimension;
  units: Unit;
  layout: Layout | undefined;
  drawingData: {
      plotTraces: any[];
      shapes: Partial<Plotly.Shape>[];
  };
}

const Plotly2DView: React.FC<Plotly2DViewProps> = ({
  theme,
  floorAreaDimensions,
  units,
  layout,
  drawingData,
}) => {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plotRef.current || !layout) {
      if (plotRef.current) Plotly.purge(plotRef.current);
      return;
    }

    const style = getComputedStyle(document.documentElement);
    const plotLayout: Partial<Plotly.Layout> = {
      shapes: drawingData.shapes,
      xaxis: {
        autorange: true,
        rangemode: 'tozero',
        title: { text: `Width (${units})` },
        showgrid: true,
        zeroline: false,
        showline: true,
        gridcolor: style.getPropertyValue('--canvas-grid').trim(),
        linecolor: style.getPropertyValue('--canvas-tick').trim(),
        tickcolor: style.getPropertyValue('--canvas-tick').trim(),
      },
      yaxis: {
        autorange: true,
        rangemode: 'tozero',
        title: { text: `Height (${units})` },
        showgrid: true,
        zeroline: false,
        showline: true,
        gridcolor: style.getPropertyValue('--canvas-grid').trim(),
        linecolor: style.getPropertyValue('--canvas-tick').trim(),
        tickcolor: style.getPropertyValue('--canvas-tick').trim(),
        scaleanchor: 'x', // Fix aspect ratio
        scaleratio: 1,
      },
      margin: { l: 60, r: 20, b: 50, t: 20 },
      showlegend: false,
      paper_bgcolor: 'transparent',
      plot_bgcolor: style.getPropertyValue('--canvas-bg').trim(),
      font: {
        color: style.getPropertyValue('--text-primary').trim(),
        family: 'sans-serif',
      },
      autosize: true,
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['toImage', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
    };

    Plotly.react(plotRef.current, drawingData.plotTraces, plotLayout, config);

  }, [drawingData, floorAreaDimensions, units, theme, layout]);
  
  return <div ref={plotRef} className="w-full h-full"></div>;
};

export default Plotly2DView;