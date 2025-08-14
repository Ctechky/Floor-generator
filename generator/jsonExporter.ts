import type { Dimension, Layout, BlockedArea, Unit, Room } from '../roomtype';

export interface JsonExportData {
    metadata: {
        appName: string;
        exportedAt: string;
        layoutIndex: number;
    };
    floorAreaDimensions: Dimension;
    units: Unit;
    rooms: Room[]; // The original room definitions
    blockedAreas: BlockedArea[];
    layout: Layout; // The specific generated layout
}

/**
 * Generates a pretty-printed JSON string containing the complete state
 * of a generated floor plan for saving or external use.
 * @returns A string containing the layout data in JSON format.
 */
export function generateJsonContent(
    floorAreaDimensions: Dimension,
    rooms: Room[],
    blockedAreas: BlockedArea[],
    layout: Layout,
    units: Unit,
    layoutIndex: number
): string {
    const exportData: JsonExportData = {
        metadata: {
            appName: 'AI Floor Plan Generator',
            exportedAt: new Date().toISOString(),
            layoutIndex: layoutIndex + 1, // Use 1-based index for user-facing export
        },
        floorAreaDimensions,
        units,
        rooms,
        blockedAreas,
        layout,
    };

    return JSON.stringify(exportData, null, 2); // Pretty-print with 2-space indentation
}