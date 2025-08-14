import React, { useState, useEffect, useCallback } from 'react';
import type { Unit, Dimension, Room, BlockedArea, BlockedAreaType } from '../roomtype';

interface ControlsPanelProps {
  floorAreaDimensions: Dimension;
  setFloorAreaDimensions: React.Dispatch<React.SetStateAction<Dimension>>;
  units: Unit;
  setUnits: React.Dispatch<React.SetStateAction<Unit>>;
  blockedAreas: BlockedArea[];
  setBlockedAreas: React.Dispatch<React.SetStateAction<BlockedArea[]>>;
  blockedAreaTypes: BlockedAreaType[];
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  onGenerate: () => void;
  isLoading: boolean;
  onClearAll: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-[var(--bg-tertiary)] p-3 mb-2 border border-[var(--border-secondary)] rounded-md">
    <h3 className="font-bold mb-3 pb-2 border-b border-[var(--border-secondary)] text-[var(--accent-secondary)]">
      {title}
    </h3>
    <div className="flex flex-col space-y-3">
      {children}
    </div>
  </div>
);

const LabeledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
    <input
      {...props}
      className="w-full p-2 rounded-md border border-[var(--border-primary)] bg-[var(--bg-interactive)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none transition"
    />
  </div>
);

const ROOM_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4'];
const initialNewRoomState = { name: '', width: 2, height: 2, color: ROOM_COLORS[0], quantity: '' };
const initialNewBlockedAreaState = { name: '', x: 1, y: 1, width: 1, height: 1 };

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  floorAreaDimensions, setFloorAreaDimensions, units, setUnits,
  blockedAreas, setBlockedAreas, blockedAreaTypes, rooms, setRooms,
  onGenerate, isLoading, onClearAll,
}) => {
  const [newRoom, setNewRoom] = useState(initialNewRoomState);
  const [newBlockedArea, setNewBlockedArea] = useState(initialNewBlockedAreaState);
  const [editingItemId, setEditingItemId] = useState<{type: 'room' | 'blockedArea', id: string} | null>(null);

  const isEditingRoom = editingItemId?.type === 'room';
  const isEditingBlockedArea = editingItemId?.type === 'blockedArea';
  
  const getUniqueName = (baseName: string, existingNames: string[]): string => {
      const namesSet = new Set(existingNames);
      let finalName = baseName.trim();
      if (finalName === "") finalName = "Untitled";

      if (namesSet.has(finalName)) {
          let i = 1;
          while (namesSet.has(`${finalName} ${i}`)) {
              i++;
          }
          finalName = `${finalName} ${i}`;
      }
      return finalName;
  }

  const resetRoomForm = useCallback(() => {
    const baseName = 'New Room Type';
    const finalName = getUniqueName(baseName, rooms.map(r => r.name));
    const nextColor = ROOM_COLORS[rooms.length % ROOM_COLORS.length];
    setNewRoom({ ...initialNewRoomState, name: finalName, color: nextColor });
  }, [rooms]);

  const resetBlockedAreaForm = useCallback(() => {
    const baseName = 'New Blocked Area';
    const finalName = getUniqueName(baseName, blockedAreas.map(b => b.name));
    setNewBlockedArea({ ...initialNewBlockedAreaState, name: finalName });
  }, [blockedAreas]);


  // Effect for initial form setup
  useEffect(() => {
    resetRoomForm();
    resetBlockedAreaForm();
  }, []); // Run only on mount

  // Effect to populate forms for editing
  useEffect(() => {
    if (isEditingRoom) {
      const roomToEdit = rooms.find(r => r.id === editingItemId.id);
      if (roomToEdit) {
        setNewRoom({
          name: roomToEdit.name,
          width: roomToEdit.dimensions.width,
          height: roomToEdit.dimensions.height,
          color: roomToEdit.color,
          quantity: roomToEdit.quantity?.toString() ?? ''
        });
      }
    } else if (isEditingBlockedArea) {
      const areaToEdit = blockedAreas.find(b => b.id === editingItemId.id);
      if (areaToEdit) {
        setNewBlockedArea({ name: areaToEdit.name, x: areaToEdit.x, y: areaToEdit.y, width: areaToEdit.width, height: areaToEdit.height });
      }
    }
  }, [editingItemId, rooms, blockedAreas]);


  const handleCancelEdit = () => {
    setEditingItemId(null);
    resetRoomForm();
    resetBlockedAreaForm();
  };

  const handleRoomSubmit = () => {
    const roomQty = parseInt(newRoom.quantity, 10);
    const quantity = !isNaN(roomQty) && roomQty > 0 ? roomQty : undefined;

    // For "add" mode, if the form is invalid, just reset it and do nothing else.
    if (!isEditingRoom && !(newRoom.name && newRoom.width > 0 && newRoom.height > 0)) {
        handleCancelEdit();
        return;
    }

    const savedEditingId = editingItemId?.id;

    setRooms(prevRooms => {
        let updatedRooms;
        if (isEditingRoom && savedEditingId) {
            updatedRooms = prevRooms.map(r => 
                r.id === savedEditingId 
                ? { ...r, id: savedEditingId, name: newRoom.name, dimensions: { width: newRoom.width, height: newRoom.height }, color: newRoom.color, quantity } 
                : r
            );
        } else {
            const finalName = getUniqueName(newRoom.name, prevRooms.map(r => r.name));
            const newRoomData = {
                id: `r${Date.now()}`, name: finalName, dimensions: { width: newRoom.width, height: newRoom.height }, color: newRoom.color, quantity,
            };
            updatedRooms = [...prevRooms, newRoomData];
        }

        // After either adding or updating, calculate the state for the *next* new room form.
        // This ensures the color cycles and the default name is unique.
        const nextBaseName = 'New Room Type';
        const nextFinalName = getUniqueName(nextBaseName, updatedRooms.map(r => r.name));
        const nextColor = ROOM_COLORS[updatedRooms.length % ROOM_COLORS.length];
        setNewRoom({ ...initialNewRoomState, name: nextFinalName, color: nextColor });
        
        return updatedRooms;
    });
    
    // We've handled the form reset inside the `setRooms` updater, so just clear the editing state.
    setEditingItemId(null);
  };
  const removeRoom = (id: string) => setRooms(prev => prev.filter(r => r.id !== id));

  const handleBlockedAreaSubmit = () => {
     if (isEditingBlockedArea && editingItemId) {
        setBlockedAreas(prev => prev.map(b => b.id === editingItemId.id ? { ...b, id: editingItemId.id, ...newBlockedArea } : b));
     } else {
        if (newBlockedArea.name && newBlockedArea.width > 0 && newBlockedArea.height > 0) {
            setBlockedAreas(prevAreas => {
                const finalName = getUniqueName(newBlockedArea.name, prevAreas.map(a => a.name));
                const newAreaData = { id: `b${Date.now()}`, ...newBlockedArea, name: finalName };
                return [...prevAreas, newAreaData];
            });
        }
     }
     handleCancelEdit();
  };
  const removeBlockedArea = (id: string) => setBlockedAreas(prev => prev.filter(b => b.id !== id));
  
  const handleBlockedAreaTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditingItemId(null); // Ensure we are in "add" mode
    const typeId = e.target.value;
    const selectedType = blockedAreaTypes.find(t => t.id === typeId);
    if (selectedType) {
        const baseName = selectedType.name;
        const finalName = getUniqueName(baseName, blockedAreas.map(b => b.name));
        setNewBlockedArea({
            name: finalName,
            x: 1, y: 1,
            width: selectedType.dimensions.width,
            height: selectedType.dimensions.height,
        });
    } else {
        resetBlockedAreaForm(); // "Custom Area" was selected
    }
  };

  const baseButtonClasses = "btn w-full px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)]";
  const primaryButtonClasses = `bg-[var(--accent-primary)] text-[var(--text-on-accent)] hover:bg-[var(--accent-primary-hover)]`;
  const secondaryButtonClasses = `bg-[var(--accent-secondary)] text-[var(--text-on-accent)] hover:bg-[var(--accent-secondary-hover)]`;
  const outlinedButtonClasses = `border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-interactive)]`;
  const textButtonClasses = `hover:bg-[var(--bg-interactive)] text-[var(--text-secondary)]`;
  const actionButtonClasses = "p-1 rounded hover:bg-[var(--bg-interactive-hover)] transition-all hover:scale-110";

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow bg-[var(--bg-secondary)] rounded-xl shadow-2xl p-2 sm:p-4 overflow-y-auto" style={{boxShadow: `0 10px 25px -5px var(--shadow-color)`}}>
        <Section title="Floor Area Settings">
          <div className="flex space-x-2">
            <LabeledInput label="Width" type="number" min="1" value={floorAreaDimensions.width} onChange={e => setFloorAreaDimensions(d => ({...d, width: +e.target.value}))} />
            <LabeledInput label="Height" type="number" min="1" value={floorAreaDimensions.height} onChange={e => setFloorAreaDimensions(d => ({...d, height: +e.target.value}))} />
          </div>
          <div>
              <label htmlFor="units-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Units</label>
              <select id="units-select" value={units} onChange={e => setUnits(e.target.value as Unit)} className="w-full p-2 rounded-md border border-[var(--border-primary)] bg-[var(--bg-interactive)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none transition">
                  <option value="m">m</option>
                  <option value="cm">cm</option>
                  <option value="mm">mm</option>
              </select>
          </div>
        </Section>

        <Section title="Blocked Areas">
           <ul className="max-h-40 overflow-y-auto bg-[var(--bg-interactive)] rounded-md p-1 space-y-1">
            {blockedAreas.map(b => (
              <li key={b.id} className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-interactive-hover)]">
                <div className="truncate">
                  <p className="font-semibold truncate">{b.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{`X:${b.x}, Y:${b.y}, W:${b.width}, H:${b.height}`}</p>
                </div>
                <div className="flex space-x-1 flex-shrink-0 ml-2">
                  <button onClick={() => setEditingItemId({type: 'blockedArea', id: b.id})} className={actionButtonClasses} aria-label="Edit blocked area">✏️</button>
                  <button onClick={() => removeBlockedArea(b.id)} className={actionButtonClasses} aria-label="Delete blocked area">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
           {!isEditingBlockedArea && (
            <div>
                <label htmlFor="blocked-type-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Preset Type</label>
                <select
                    id="blocked-type-select"
                    onChange={handleBlockedAreaTypeSelect}
                    className="w-full p-2 rounded-md border border-[var(--border-primary)] bg-[var(--bg-interactive)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none transition"
                >
                    <option value="">Custom Area</option>
                    {blockedAreaTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name} ({type.dimensions.width}x{type.dimensions.height})</option>
                    ))}
                </select>
            </div>
           )}
          <LabeledInput label="Area Name" type="text" value={newBlockedArea.name} onChange={e => setNewBlockedArea(b => ({...b, name: e.target.value}))} />
          <div className="grid grid-cols-4 gap-2">
              <LabeledInput label="X" type="number" min="0" value={newBlockedArea.x} onChange={e => setNewBlockedArea(b => ({...b, x: +e.target.value}))} />
              <LabeledInput label="Y" type="number" min="0" value={newBlockedArea.y} onChange={e => setNewBlockedArea(b => ({...b, y: +e.target.value}))} />
              <LabeledInput label="W" type="number" min="1" value={newBlockedArea.width} onChange={e => setNewBlockedArea(b => ({...b, width: +e.target.value}))} />
              <LabeledInput label="H" type="number" min="1" value={newBlockedArea.height} onChange={e => setNewBlockedArea(b => ({...b, height: +e.target.value}))} />
          </div>
          <div className="flex space-x-2">
              <button onClick={handleBlockedAreaSubmit} className={`${baseButtonClasses} ${primaryButtonClasses}`}>
                {isEditingBlockedArea ? 'Update Area' : 'Add Area'}
              </button>
              {isEditingBlockedArea && (
                <button onClick={handleCancelEdit} className={`${baseButtonClasses} ${outlinedButtonClasses}`}>
                  Cancel
                </button>
              )}
          </div>
        </Section>
        
        <Section title="Room Types">
          <ul className="max-h-40 overflow-y-auto bg-[var(--bg-interactive)] rounded-md p-1 space-y-1">
            {rooms.map(r => (
              <li key={r.id} className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-interactive-hover)]">
                  <div className="flex items-center min-w-0">
                    <div style={{ backgroundColor: r.color }} className="w-4 h-4 rounded-sm mr-2 flex-shrink-0 border border-[var(--border-primary)]" />
                    <div className="truncate">
                      <p className="font-semibold truncate">{r.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{`${r.dimensions.width}x${r.dimensions.height} - ${r.quantity ? `Qty: ${r.quantity}` : 'Auto-fit'}`}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0 ml-2">
                    <button onClick={() => setEditingItemId({type: 'room', id: r.id})} className={actionButtonClasses} aria-label="Edit room">✏️</button>
                    <button onClick={() => removeRoom(r.id)} className={actionButtonClasses} aria-label="Delete room">🗑️</button>
                  </div>
              </li>
            ))}
          </ul>
          <LabeledInput label="Room Type Name" type="text" value={newRoom.name} onChange={e => setNewRoom(r => ({...r, name: e.target.value}))} />
          <div className="flex space-x-2">
              <LabeledInput label="Width" type="number" min="1" value={newRoom.width} onChange={e => setNewRoom(r => ({...r, width: +e.target.value}))} />
              <LabeledInput label="Height" type="number" min="1" value={newRoom.height} onChange={e => setNewRoom(r => ({...r, height: +e.target.value}))} />
          </div>
          <LabeledInput label="Quantity (optional)" type="number" min="1" placeholder="Auto-fit" value={newRoom.quantity} onChange={e => setNewRoom(r => ({...r, quantity: e.target.value}))} />
          <label htmlFor="room-color-input" className="flex justify-between items-center p-2 rounded-md border border-[var(--border-primary)] bg-[var(--bg-interactive)] cursor-pointer hover:border-[var(--text-primary)]">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Color</span>
            <div style={{ backgroundColor: newRoom.color }} className="w-7 h-7 rounded border border-[var(--border-primary)]"/>
            <input id="room-color-input" type="color" value={newRoom.color} onChange={e => setNewRoom(r => ({ ...r, color: e.target.value }))} className="opacity-0 w-0 h-0 absolute"/>
          </label>
          <div className="flex space-x-2">
            <button onClick={handleRoomSubmit} className={`${baseButtonClasses} ${primaryButtonClasses}`}>
              {isEditingRoom ? 'Update Room Type' : 'Add Room Type'}
            </button>
            {isEditingRoom && ( <button onClick={handleCancelEdit} className={`${baseButtonClasses} ${outlinedButtonClasses}`}>Cancel</button> )}
          </div>
        </Section>
      </div>

      <div className="flex-shrink-0 mt-4 space-y-2">
        <button onClick={onGenerate} disabled={isLoading || rooms.length === 0} className={`${baseButtonClasses} ${secondaryButtonClasses} py-3 text-lg`}>
          {isLoading ? 'Generating...' : 'Generate Layouts'}
        </button>
         <button onClick={onClearAll} className={`${baseButtonClasses} ${textButtonClasses} py-1 shadow-none`}>
          Clear All Settings
        </button>
      </div>
    </div>
  );
};

export default ControlsPanel;