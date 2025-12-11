// Indoor Navigation Type Definitions

export interface MapNode {
  id: string;
  name: string;
  displayName: string;
  x: number;
  y: number;
}

export interface MapEdge {
  from: string;
  to: string;
  steps: number;
  heading: number; // degrees (0-360)
  description?: string;
}

export interface IndoorMap {
  name: string;
  nodes: MapNode[];
  edges: MapEdge[];
}

export interface NavigationInstruction {
  type: 'start' | 'turn' | 'continue' | 'arrive';
  text: string;
  expectedSteps: number;
  expectedHeading: number;
  nodeId?: string;
  turnDirection?: string; // The turn to make (e.g., 'turn left', 'turn right')
  phase?: 'turn' | 'walk'; // Current phase of instruction
}

export interface NavigationProgress {
  currentInstructionIndex: number;
  stepsTaken: number;
  distanceRemaining: number;
  isOffRoute: boolean;
}

export interface MargaUpdate {
  stepCount: number;
  heading: number; // degrees (0-360)
  distance: number; // meters
  gyroZ?: number; // gyroscope Z-axis for turn detection
}

export type NavigationEventType = 
  | 'instruction'
  | 'progress' 
  | 'offRoute'
  | 'arrived'
  | 'cancelled'
  | 'turnCompleted';

export interface NavigationEvent {
  type: NavigationEventType;
  data?: any;
}
