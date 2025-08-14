import type { Dimension, Room, BlockedArea, Layout, PlacedRoom, Rect } from '../roomtype';

export function checkCollision(rect1: Rect, rect2: Rect): boolean {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * Finds a valid placement for a single room.
 * @param isGreedy If true, searches for placement in a deterministic order (top-left). 
 *                 If false, randomizes the search order to explore more possibilities.
 */
function findPlacementForRoom(
    room: Room,
    floorAreaDimensions: Dimension,
    placedItems: (PlacedRoom | BlockedArea)[],
    isGreedy: boolean
): PlacedRoom | null {
    const { width: roomW, height: roomH } = room.dimensions;

    const potentialPlacements: { x: number; y: number; rotated: boolean }[] = [];

    // Add non-rotated placements
    if (floorAreaDimensions.width >= roomW && floorAreaDimensions.height >= roomH) {
        for (let y = 0; y <= floorAreaDimensions.height - roomH; y++) {
            for (let x = 0; x <= floorAreaDimensions.width - roomW; x++) {
                potentialPlacements.push({ x, y, rotated: false });
            }
        }
    }

    // Add rotated placements if room is not a square
    if (roomW !== roomH && floorAreaDimensions.width >= roomH && floorAreaDimensions.height >= roomW) {
        for (let y = 0; y <= floorAreaDimensions.height - roomW; y++) {
            for (let x = 0; x <= floorAreaDimensions.width - roomH; x++) {
                potentialPlacements.push({ x, y, rotated: true });
            }
        }
    }

    // For the randomized method, shuffle potential placements.
    // For the greedy method, we try from top-left deterministically.
    if (!isGreedy) {
        for (let i = potentialPlacements.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [potentialPlacements[i], potentialPlacements[j]] = [potentialPlacements[j], potentialPlacements[i]];
        }
    }

    for (const p of potentialPlacements) {
        const currentRect: Rect = {
            x: p.x,
            y: p.y,
            width: p.rotated ? roomH : roomW,
            height: p.rotated ? roomW : roomH,
        };

        let collision = false;
        for (const item of placedItems) {
            const itemDim = 'dimensions' in item ? item.dimensions : { width: item.width, height: item.height };
            const rotated = 'rotated' in item && item.rotated;
            const itemRect: Rect = {
                x: item.x,
                y: item.y,
                width: rotated ? itemDim.height : itemDim.width,
                height: rotated ? itemDim.width : itemDim.height,
            };

            if (checkCollision(currentRect, itemRect)) {
                collision = true;
                break;
            }
        }
        if (!collision) {
            return { ...room, x: p.x, y: p.y, rotated: p.rotated };
        }
    }

    return null;
}

/**
 * Creates a canonical signature string for a layout to detect duplicates.
 * The signature is based on the sorted positions and rotations of each room type.
 */
function getLayoutSignature(placedRooms: PlacedRoom[]): string {
    if (placedRooms.length === 0) return '';
    
    const roomPositions: { [key: string]: string[] } = {};

    // Group positions by base room type ID
    placedRooms.forEach(room => {
        const baseId = room.id.split('-')[0];
        if (!roomPositions[baseId]) {
            roomPositions[baseId] = [];
        }
        // Create a string for the room's state (position and rotation)
        roomPositions[baseId].push(`${room.x},${room.y},${room.rotated}`);
    });

    // Create a canonical signature to identify the layout uniquely.
    // 1. Sort by base room ID to ensure "r1|r2" is the same as "r2|r1"
    const signature = Object.keys(roomPositions)
        .sort() 
        .map(baseId => {
            // 2. Sort positions within the type to handle interchangeability of same-type rooms
            const positions = roomPositions[baseId].sort().join(';');
            return `${baseId}:${positions}`;
        })
        .join('|');
    
    return signature;
}


export function generateLayouts(
    floorAreaDimensions: Dimension,
    rooms: Room[],
    blockedAreas: BlockedArea[]
): Layout[] {
    const floorArea = floorAreaDimensions.width * floorAreaDimensions.height;
    const TOP_N = 10;

    // Any room type defined by the user is considered essential.
    // The generator should always try to place at least one of each.
    const requiredRoomTypeIds = new Set(rooms.map(r => r.id));

    // 1. Create a flat list of all individual rooms to be placed.
    const allRoomsToPlace: Room[] = [];
    rooms.forEach(roomType => {
        const roomArea = roomType.dimensions.width * roomType.dimensions.height;
        if (roomArea <= 0) return; // Skip rooms with no area

        // If quantity is not specified, calculate max possible as a high ceiling.
        const quantity = roomType.quantity ?? Math.floor(floorArea / roomArea);
        
        for (let i = 0; i < quantity; i++) {
            allRoomsToPlace.push({
                ...roomType,
                id: `${roomType.id}-${i}` // Create a unique ID for each instance
            });
        }
    });

    // --- Generation Phase: Run many trials to find possibilities ---
    const generatedLayouts: PlacedRoom[][] = [];
    const NUM_TRIALS = 200;

    // Trial 1: Greedy approach (deterministic baseline)
    const sortByArea = (a: Room, b: Room) => (b.dimensions.width * b.dimensions.height) - (a.dimensions.width * a.dimensions.height);
    const requiredInstances: Room[] = [];
    const optionalInstances: Room[] = [];
    const processedRequiredTypes = new Set<string>();

    // Separate rooms into required (one instance per type) and optional
    for (const room of allRoomsToPlace) {
        const baseId = room.id.split('-')[0];
        if (requiredRoomTypeIds.has(baseId) && !processedRequiredTypes.has(baseId)) {
            requiredInstances.push(room);
            processedRequiredTypes.add(baseId);
        } else {
            optionalInstances.push(room);
        }
    }
    
    // Sort required rooms by area, then add the rest (also sorted)
    requiredInstances.sort(sortByArea);
    optionalInstances.sort(sortByArea);
    const greedyRoomOrder = [...requiredInstances, ...optionalInstances];

    const greedyPlacedRooms: PlacedRoom[] = [];
    const greedyPlacedItems: (PlacedRoom | BlockedArea)[] = [...blockedAreas];
    for (const room of greedyRoomOrder) {
        const placement = findPlacementForRoom(room, floorAreaDimensions, greedyPlacedItems, true); // isGreedy = true
        if (placement) {
            greedyPlacedRooms.push(placement);
            greedyPlacedItems.push(placement);
        }
    }
    if (greedyPlacedRooms.length > 0) {
        generatedLayouts.push(greedyPlacedRooms);
    }

    // Trials 2 to N: Randomized approach for variety
    for (let i = 0; i < NUM_TRIALS - 1; i++) {
        const roomOrder = [...allRoomsToPlace].sort(() => Math.random() - 0.5); // Shuffle
        const placedRooms: PlacedRoom[] = [];
        const placedItems: (PlacedRoom | BlockedArea)[] = [...blockedAreas];
        for (const room of roomOrder) {
            const placement = findPlacementForRoom(room, floorAreaDimensions, placedItems, false); // isGreedy = false
            if (placement) {
                placedRooms.push(placement);
                placedItems.push(placement);
            }
        }
        if (placedRooms.length > 0) {
            generatedLayouts.push(placedRooms);
        }
    }

    // --- Curation Phase: Filter, group, and sort for the best 10 ---
    const uniqueLayoutSignatures = new Set<string>();
    const uniqueLayouts: Layout[] = [];

    for (const placedRooms of generatedLayouts) {
        const signature = getLayoutSignature(placedRooms);
        if (!uniqueLayoutSignatures.has(signature)) {
            uniqueLayoutSignatures.add(signature);
            const score = placedRooms.reduce((sum, r) => sum + (r.dimensions.width * r.dimensions.height), 0);
            const uniqueRoomTypes = new Set(placedRooms.map(r => r.id.split('-')[0]));
            uniqueLayouts.push({ placedRooms, score, diversity: uniqueRoomTypes.size });
        }
    }
    
    // Sort all unique layouts based on a hierarchy of quality criteria.
    uniqueLayouts.sort((a, b) => {
        // 1. Prioritize layouts that contain all "required" room types.
        const aPlacedIds = new Set(a.placedRooms.map(pr => pr.id.split('-')[0]));
        const bPlacedIds = new Set(b.placedRooms.map(pr => pr.id.split('-')[0]));
        const aHasAllRequired = [...requiredRoomTypeIds].every(id => aPlacedIds.has(id));
        const bHasAllRequired = [...requiredRoomTypeIds].every(id => bPlacedIds.has(id));

        if (aHasAllRequired !== bHasAllRequired) {
            return bHasAllRequired ? 1 : -1; // true (b) comes first
        }

        // 2. Prioritize layouts with more rooms placed.
        if (b.placedRooms.length !== a.placedRooms.length) {
            return b.placedRooms.length - a.placedRooms.length;
        }
        // 3. Prioritize layouts with higher diversity of room types.
        if (b.diversity !== a.diversity) {
            return b.diversity - a.diversity;
        }
        // 4. As a tie-breaker, prioritize higher total area coverage.
        return b.score - a.score;
    });
    
    return uniqueLayouts.slice(0, TOP_N);
}