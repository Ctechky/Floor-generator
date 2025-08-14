import type { Dimension, Layout, BlockedArea, Unit, Room } from '../roomtype';

const dxfPair = (code: number, value: string | number) => `${code}\n${value}\n`;

const addLine = (p1: {x: number, y: number}, p2: {x: number, y: number}, layer: string, color?: number): string => {
    let content = `${dxfPair(0, 'LINE')}${dxfPair(8, layer)}`;
    if (color !== undefined) {
        content += dxfPair(62, color);
    }
    content += `${dxfPair(10, p1.x)}${dxfPair(20, p1.y)}${dxfPair(11, p2.x)}${dxfPair(21, p2.y)}`;
    return content;
}

const addRectangle = (x: number, y: number, w: number, h: number, layer: string, color?: number): string => {
    const p = [
        {x: x, y: y},
        {x: x + w, y: y},
        {x: x + w, y: y + h},
        {x: x, y: y + h}
    ];

    let str = '';
    str += addLine(p[0], p[1], layer, color);
    str += addLine(p[1], p[2], layer, color);
    str += addLine(p[2], p[3], layer, color);
    str += addLine(p[3], p[0], layer, color);
    return str;
}

const addText = (text: string, x: number, y: number, height: number, layer: string, rotation: number = 0, align: 'left' | 'center' = 'left', color?: number): string => {
    let content = `${dxfPair(0, 'TEXT')}${dxfPair(8, layer)}`;
    if (color !== undefined) {
        content += dxfPair(62, color);
    }
    
    if (align === 'center') {
        // For centered text, the insertion point (11, 21) is the center.
        // The rotation point (10, 20) can be the same.
        content += `${dxfPair(10, x)}${dxfPair(20, y)}`; // Rotation point
        content += `${dxfPair(11, x)}${dxfPair(21, y)}`; // Alignment point
        content += `${dxfPair(40, height)}`;
        content += `${dxfPair(72, 4)}`; // Horizontal alignment: Middle
        content += `${dxfPair(73, 2)}`; // Vertical alignment: Middle
    } else {
        // Default left-aligned behavior
        content += `${dxfPair(10, x)}${dxfPair(20, y)}`;
        content += `${dxfPair(40, height)}`;
    }

    if (rotation !== 0) {
        content += dxfPair(50, rotation);
    }
    content += dxfPair(1, text);
    return content;
}


const addSolidTriangle = (p1: {x: number, y: number}, p2: {x: number, y: number}, p3: {x: number, y: number}, layer: string, color?: number): string => {
    let content = `${dxfPair(0, 'SOLID')}${dxfPair(8, layer)}`;
     if (color !== undefined) {
        content += dxfPair(62, color);
    }
    content += `${dxfPair(10, p1.x)}${dxfPair(20, p1.y)}` +
           `${dxfPair(11, p2.x)}${dxfPair(21, p2.y)}` +
           `${dxfPair(12, p3.x)}${dxfPair(22, p3.y)}` +
           `${dxfPair(13, p3.x)}${dxfPair(23, p3.y)}`;
    return content;
};

const addArrowHead = (p: {x: number, y: number}, direction: 'left' | 'right' | 'up' | 'down', size: number, layer: string, color?: number): string => {
    let p1, p2, p3;
    const h = size; 
    const w = size / 2;

    switch(direction) {
        case 'left':
            p1 = { x: p.x, y: p.y };
            p2 = { x: p.x + h, y: p.y - w };
            p3 = { x: p.x + h, y: p.y + w };
            break;
        case 'right':
            p1 = { x: p.x, y: p.y };
            p2 = { x: p.x - h, y: p.y - w };
            p3 = { x: p.x - h, y: p.y + w };
            break;
        case 'down':
            p1 = { x: p.x, y: p.y };
            p2 = { x: p.x - w, y: p.y + h };
            p3 = { x: p.x + w, y: p.y + h };
            break;
        case 'up':
            p1 = { x: p.x, y: p.y };
            p2 = { x: p.x - w, y: p.y - h };
            p3 = { x: p.x + w, y: p.y - h };
            break;
    }
    return addSolidTriangle(p1, p2, p3, layer, color);
};

const addDimension = (
    p1: {x: number, y: number}, 
    p2: {x: number, y: number}, 
    value: number, 
    units: Unit, 
    isVertical: boolean, 
    offset: number, 
    layer: string,
    config: { textSize: number, arrowSize: number },
    color?: number
): string => {
    let content = '';
    const { textSize, arrowSize } = config;
    const text = value.toString();
    const textGap = text.length * textSize * 0.7 + textSize;

    if (!isVertical) { // Horizontal
        const x1 = Math.min(p1.x, p2.x);
        const x2 = Math.max(p1.x, p2.x);
        const y = p1.y;
        const dimY = y - offset;
        const midX = (x1 + x2) / 2;

        content += addLine({x: x1, y: y}, {x: x1, y: dimY - arrowSize}, layer, color);
        content += addLine({x: x2, y: y}, {x: x2, y: dimY - arrowSize}, layer, color);
        content += addLine({x: x1, y: dimY}, {x: midX - textGap / 2, y: dimY}, layer, color);
        content += addLine({x: midX + textGap / 2, y: dimY}, {x: x2, y: dimY}, layer, color);
        content += addArrowHead({x: x1, y: dimY}, 'right', arrowSize, layer, color);
        content += addArrowHead({x: x2, y: dimY}, 'left', arrowSize, layer, color);
        content += addText(`${text}${units}`, midX, dimY, textSize, layer, 0, 'center', color);
    } else { // Vertical
        const y1 = Math.min(p1.y, p2.y);
        const y2 = Math.max(p1.y, p2.y);
        const x = p1.x;
        const dimX = x - offset;
        const midY = (y1 + y2) / 2;

        content += addLine({x: x, y: y1}, {x: dimX - arrowSize, y: y1}, layer, color);
        content += addLine({x: x, y: y2}, {x: dimX - arrowSize, y: y2}, layer, color);
        content += addLine({x: dimX, y: y1}, {x: dimX, y: midY - textGap / 2}, layer, color);
        content += addLine({x: dimX, y: midY + textGap / 2}, {x: dimX, y: y2}, layer, color);
        content += addArrowHead({x: dimX, y: y1}, 'up', arrowSize, layer, color);
        content += addArrowHead({x: dimX, y: y2}, 'down', arrowSize, layer, color);
        content += addText(`${text}${units}`, dimX, midY, textSize, layer, 90, 'center', color);
    }
    return content;
}

// Minimal DXF generator that should work with any CAD software
export function generateDxfContent(
    floorAreaDimensions: Dimension,
    layout: Layout,
    blockedAreas: BlockedArea[],
    units: Unit,
    rooms: Room[]
): string {
    let dxf = '';
    
    dxf += dxfPair(0, 'SECTION');
    dxf += dxfPair(2, 'HEADER');
    dxf += dxfPair(9, '$ACADVER');
    dxf += dxfPair(1, 'AC1009');
    dxf += dxfPair(0, 'ENDSEC');
    
    dxf += dxfPair(0, 'SECTION');
    dxf += dxfPair(2, 'TABLES');
    
    dxf += dxfPair(0, 'TABLE');
    dxf += dxfPair(2, 'LTYPE');
    dxf += dxfPair(70, 1);
    dxf += dxfPair(0, 'LTYPE');
    dxf += dxfPair(2, 'CONTINUOUS');
    dxf += dxfPair(70, 0);
    dxf += dxfPair(3, 'Solid line');
    dxf += dxfPair(72, 65);
    dxf += dxfPair(73, 0);
    dxf += dxfPair(40, 0.0);
    dxf += dxfPair(0, 'ENDTAB');
    
    dxf += dxfPair(0, 'TABLE');
    dxf += dxfPair(2, 'LAYER');

    const placedRoomTypes = rooms.filter(
        (roomDef) => layout.placedRooms.some(pr => pr.id.startsWith(roomDef.id))
    );
     const uniquePlacedRoomTypes = placedRoomTypes.filter(
        (room, index, self) => index === self.findIndex((r) => r.name === room.name)
    );

    const baseLayerCount = 7;
    const roomLayerCount = uniquePlacedRoomTypes.length * 3; // 3 layers per room type (geom, dim, legend)
    dxf += dxfPair(70, baseLayerCount + roomLayerCount);
    
    // --- Static Layers ---
    dxf += dxfPair(0, 'LAYER'); dxf += dxfPair(2, '0'); dxf += dxfPair(70, 0); dxf += dxfPair(62, 7); dxf += dxfPair(6, 'CONTINUOUS');
    dxf += dxfPair(0, 'LAYER'); dxf += dxfPair(2, 'FLOOR_OUTLINE'); dxf += dxfPair(70, 0); dxf += dxfPair(62, 5); dxf += dxfPair(6, 'CONTINUOUS');
    dxf += dxfPair(0, 'LAYER'); dxf += dxfPair(2, 'BLOCKED'); dxf += dxfPair(70, 0); dxf += dxfPair(62, 8); dxf += dxfPair(6, 'CONTINUOUS');
    dxf += dxfPair(0, 'LAYER'); dxf += dxfPair(2, 'DIMENSIONS_FLOOR'); dxf += dxfPair(70, 0); dxf += dxfPair(62, 5); dxf += dxfPair(6, 'CONTINUOUS');
    dxf += dxfPair(0, 'LAYER'); dxf += dxfPair(2, 'DIMENSIONS_BLOCKED'); dxf += dxfPair(70, 0); dxf += dxfPair(62, 8); dxf += dxfPair(6, 'CONTINUOUS');
    dxf += dxfPair(0, 'LAYER'); dxf += dxfPair(2, 'LEGEND_TITLE'); dxf += dxfPair(70, 0); dxf += dxfPair(62, 4); dxf += dxfPair(6, 'CONTINUOUS');
    dxf += dxfPair(0, 'LAYER'); dxf += dxfPair(2, 'LEGEND_BLOCKED'); dxf += dxfPair(70, 0); dxf += dxfPair(62, 8); dxf += dxfPair(6, 'CONTINUOUS');

    // --- Dynamic Room Layers ---
    // A curated list of distinct ACI colors for better visual separation in CAD software.
    // Color 5 (Blue) is reserved for the main floor outline and is removed from this list.
    const DISTINCT_ACI_COLORS = [
        1,    // Red
        3,    // Green
        2,    // Yellow
        4,    // Cyan
        6,    // Magenta
        30,   // Orange
        142,  // A light green
        211,  // A pink/magenta
        40,   // A darker orange
        150,  // A dark blue
        52,   // A yellow/orange
        94,   // A dark green
        20,   // Another red
    ];
    const roomNameToLayerMap = new Map<string, { layerName: string, dimLayerName: string, legendLayerName: string, color: number }>();

    uniquePlacedRoomTypes.forEach((roomType, index) => {
        const sanitizedName = roomType.name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/ /g, '_');
        const baseLayerName = `ROOM_${sanitizedName}`;
        const dimLayerName = `DIM_${baseLayerName}`;
        const legendLayerName = `LEGEND_${baseLayerName}`;
        
        const currentColor = DISTINCT_ACI_COLORS[index % DISTINCT_ACI_COLORS.length];

        // Room geometry layer
        dxf += `${dxfPair(0, 'LAYER')}${dxfPair(2, baseLayerName)}${dxfPair(70, 0)}${dxfPair(62, currentColor)}${dxfPair(6, 'CONTINUOUS')}`;
        // Room dimension layer
        dxf += `${dxfPair(0, 'LAYER')}${dxfPair(2, dimLayerName)}${dxfPair(70, 0)}${dxfPair(62, currentColor)}${dxfPair(6, 'CONTINUOUS')}`;
        // Room legend layer
        dxf += `${dxfPair(0, 'LAYER')}${dxfPair(2, legendLayerName)}${dxfPair(70, 0)}${dxfPair(62, currentColor)}${dxfPair(6, 'CONTINUOUS')}`;

        roomNameToLayerMap.set(roomType.name, { layerName: baseLayerName, dimLayerName, legendLayerName, color: currentColor });
    });

    dxf += dxfPair(0, 'ENDTAB');
    dxf += dxfPair(0, 'ENDSEC');
    
    dxf += dxfPair(0, 'SECTION');
    dxf += dxfPair(2, 'ENTITIES');
    
    const { width, height } = floorAreaDimensions;
    
    const basis = Math.max(width, height, 10);
    const outerOffset = basis * 0.15;
    const innerOffset = basis * 0.05;
    const dimConfig = { textSize: basis * 0.025, arrowSize: basis * 0.015 };
    const smallDimConfig = { textSize: basis * 0.02, arrowSize: basis * 0.012 };

    // Draw floor outline on its dedicated layer with the reserved color
    dxf += addRectangle(0, 0, width, height, 'FLOOR_OUTLINE', 5);

    // Draw all dimensions first
    dxf += addDimension({x: 0, y: 0}, {x: width, y: 0}, width, units, false, outerOffset, 'DIMENSIONS_FLOOR', dimConfig, 5);
    dxf += addDimension({x: 0, y: 0}, {x: 0, y: height}, height, units, true, outerOffset, 'DIMENSIONS_FLOOR', dimConfig, 5);

    const dimensionedRoomTypes = new Set<string>();
    layout.placedRooms.forEach(room => {
        // Only add dimensions for the first instance of each room type
        if (!dimensionedRoomTypes.has(room.name)) {
            const w = room.rotated ? room.dimensions.height : room.dimensions.width;
            const h = room.rotated ? room.dimensions.width : room.dimensions.height;
            const { x, y } = room;

            const layerInfo = roomNameToLayerMap.get(room.name);
            const dimLayer = layerInfo ? layerInfo.dimLayerName : 'DIMENSIONS_BLOCKED';
            const dimColor = layerInfo ? layerInfo.color : 2; // Fallback to yellow for blocked

            dxf += addDimension({x, y}, {x: x + w, y}, w, units, false, innerOffset, dimLayer, smallDimConfig, dimColor);
            dxf += addDimension({x, y}, {x, y: y + h}, h, units, true, innerOffset, dimLayer, smallDimConfig, dimColor);
            dimensionedRoomTypes.add(room.name);
        }
    });

    blockedAreas.forEach(area => {
        const { x, y, width: w, height: h } = area;
        dxf += addDimension({x, y}, {x: x + w, y}, w, units, false, innerOffset, 'DIMENSIONS_BLOCKED', smallDimConfig, 8);
        dxf += addDimension({x, y}, {x, y: y + h}, h, units, true, innerOffset, 'DIMENSIONS_BLOCKED', smallDimConfig, 8);
    });
    
    // Draw rooms
    layout.placedRooms.forEach((room) => {
        const w = room.rotated ? room.dimensions.height : room.dimensions.width;
        const h = room.rotated ? room.dimensions.width : room.dimensions.height;
        const { x, y } = room;

        const layerInfo = roomNameToLayerMap.get(room.name);
        const roomLayer = layerInfo ? layerInfo.layerName : '0'; // Fallback to layer 0
        const roomColor = layerInfo ? layerInfo.color : 7; // Fallback to default color

        dxf += addRectangle(x, y, w, h, roomLayer, roomColor);
    });
    
    // Draw blocked areas
    blockedAreas.forEach((area) => {
        const { x, y, width: w, height: h } = area;
        dxf += addRectangle(x, y, w, h, 'BLOCKED', 8);
    });

    // --- Legend ---
    const legendTextSize = basis * 0.03;
    let legendX = width + outerOffset * 0.75;
    let legendY = height;
    const legendLineHeight = legendTextSize * 1.5;
    const itemIndent = legendTextSize;

    dxf += addText('Legend', legendX, legendY, legendTextSize * 1.2, 'LEGEND_TITLE', 0, 'left', 4);
    legendY -= legendLineHeight * 1.5;

    // Rooms Section
    if (uniquePlacedRoomTypes.length > 0) {
        dxf += addText('Rooms', legendX, legendY, legendTextSize * 1.1, 'LEGEND_TITLE', 0, 'left', 4);
        legendY -= legendLineHeight;

        uniquePlacedRoomTypes.forEach((room) => {
            const w = room.dimensions.width;
            const h = room.dimensions.height;
            const legendStr = `${room.name} (${w}${units} x ${h}${units})`;

            const layerInfo = roomNameToLayerMap.get(room.name);
            const legendLayer = layerInfo ? layerInfo.legendLayerName : 'LEGEND_BLOCKED'; // Fallback
            const legendColor = layerInfo ? layerInfo.color : 1; // Fallback to red

            dxf += addText(legendStr, legendX + itemIndent, legendY, legendTextSize, legendLayer, 0, 'left', legendColor);
            legendY -= legendLineHeight;
        });
    }
    
    if (uniquePlacedRoomTypes.length > 0 && blockedAreas.length > 0) {
        legendY -= legendLineHeight * 0.5;
    }

    // Blocked Areas Section
    const uniqueBlockedAreas = blockedAreas.filter(
        (area, index, self) => index === self.findIndex((a) => a.name === area.name)
    );

    if (uniqueBlockedAreas.length > 0) {
        dxf += addText('Blocked Areas', legendX, legendY, legendTextSize * 1.1, 'LEGEND_TITLE', 0, 'left', 4);
        legendY -= legendLineHeight;

        uniqueBlockedAreas.forEach((area) => {
            const { name, width: w, height: h } = area;
            const legendStr = `${name} (${w}${units} x ${h}${units})`;
            dxf += addText(legendStr, legendX + itemIndent, legendY, legendTextSize, 'LEGEND_BLOCKED', 0, 'left', 8);
            legendY -= legendLineHeight;
        });
    }
    
    dxf += dxfPair(0, 'ENDSEC');
    dxf += dxfPair(0, 'EOF');
    
    return dxf;
}