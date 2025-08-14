export type Unit = 'm' | 'cm' | 'mm';

export interface Dimension {
  width: number;
  height: number;
}

export interface Room {
  id: string;
  name:string;
  dimensions: Dimension;
  color: string;
  quantity?: number;
}

export interface PlacedRoom extends Room {
  x: number;
  y: number;
  rotated: boolean;
}

export interface BlockedAreaType {
  id: string;
  name: string;
  dimensions: Dimension;
}

export interface BlockedArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Layout {
  placedRooms: PlacedRoom[];
  score: number; // Total area covered by placed rooms
  diversity: number; // Number of unique room types included
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}