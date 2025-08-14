import React from 'react';
import { LegendItem } from './FloorplanCanvas';

interface LegendProps {
    legendItems: LegendItem[];
}


const Legend: React.FC<LegendProps> = ({ legendItems }) => {
  return (
    <div className="flex-shrink-0 w-full md:w-64 bg-[var(--bg-secondary)] p-3 rounded-md shadow-inner text-sm max-h-full overflow-y-auto">
      <div>
        <h4 className="font-bold border-b border-[var(--border-secondary)] pb-1 mb-1.5 text-[var(--text-secondary)]">
          Legend
        </h4>
        {legendItems.length > 0 ? (
          <ul className="space-y-1.5">
              {legendItems.map(item => (
                  <li className="flex items-center" key={item.key}>
                      <div style={{ backgroundColor: item.color }} className="w-4 h-4 rounded-sm mr-2 flex-shrink-0 border border-black/20" />
                      {item.key && item.key.startsWith('[') ? (
                          <div className="flex items-baseline truncate">
                              <span className="font-bold mr-1">{item.key}:</span>
                              <span className="text-[var(--text-secondary)] truncate" title={item.name}>{item.name}</span>
                          </div>
                      ) : (
                          <span className="text-[var(--text-secondary)] truncate" title={item.name}>{item.name}</span>
                      )}
                  </li>
              ))}
          </ul>
        ) : (
          <p className="text-center text-xs italic text-[var(--text-secondary)] pt-2">
              No items require a legend.
          </p>
        )}
      </div>
    </div>
  );
};

export default Legend;