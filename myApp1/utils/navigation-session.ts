import { 
  IndoorMap, 
  MapEdge, 
  NavigationInstruction, 
  NavigationProgress,
  MargaUpdate,
  NavigationEvent,
  NavigationEventType
} from '../types/indoor-navigation';
import { Vibration } from 'react-native';
import { findPath, getDirectionFromHeading, getTurnDirection } from './pathfinding';

type EventCallback = (event: NavigationEvent) => void;

export class NavigationSession {
  private map: IndoorMap;
  private path: MapEdge[];
  private instructions: NavigationInstruction[];
  private currentInstructionIndex: number = 0;
  private stepsTakenInCurrentSegment: number = 0;
  private startStepsForCurrentSegment: number = 0;
  private isActive: boolean = false;
  private listeners: Map<NavigationEventType, EventCallback[]> = new Map();
  private lastHeading: number = 0;
  private calibrationOffset: number = 0;
  private currentPhase: 'turn' | 'walk' = 'walk';
  private gyroAccumulator: number = 0; // Use Marga's gyro logic
  private lastGyroTime: number = Date.now();
  private TURN_THRESHOLD: number = 45; // Same as Marga(merged)

  constructor(map: IndoorMap, startId: string, endId: string) {
    this.map = map;
    
    const path = findPath(map, startId, endId);
    if (!path) {
      throw new Error(`No path found from ${startId} to ${endId}`);
    }
    
    this.path = path;
    this.instructions = this.generateInstructions(path, startId, endId);
  }

  private generateInstructions(path: MapEdge[], startId: string, endId: string): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];
    
    // Start instruction - just walk straight
    if (path.length > 0) {
      const firstEdge = path[0];
      const startNode = this.map.nodes.find(n => n.id === startId);
      
      instructions.push({
        type: 'start',
        text: `Starting from ${startNode?.displayName}. Walk straight for ${firstEdge.steps} steps.`,
        expectedSteps: firstEdge.steps,
        expectedHeading: firstEdge.heading,
        nodeId: startId,
        phase: 'walk',
      });
    }

    // Middle instructions - split into turn + walk phases
    for (let i = 1; i < path.length; i++) {
      const prevEdge = path[i - 1];
      const currentEdge = path[i];
      const node = this.map.nodes.find(n => n.id === currentEdge.from);
      
      const turnDirection = getTurnDirection(prevEdge.heading, currentEdge.heading);
      
      // Only add turn instruction if there's actually a turn
      if (!turnDirection.includes('straight')) {
        instructions.push({
          type: 'turn',
          text: `At ${node?.displayName}, ${turnDirection}.`,
          expectedSteps: 0,
          expectedHeading: currentEdge.heading,
          nodeId: currentEdge.from,
          turnDirection: turnDirection,
          phase: 'turn',
        });
      }
      
      // Then walk instruction
      instructions.push({
        type: 'continue',
        text: `Now walk straight for ${currentEdge.steps} steps.`,
        expectedSteps: currentEdge.steps,
        expectedHeading: currentEdge.heading,
        nodeId: currentEdge.from,
        phase: 'walk',
      });
    }

    // Arrival instruction
    const lastEdge = path[path.length - 1];
    const endNode = this.map.nodes.find(n => n.id === endId);
    
    instructions.push({
      type: 'arrive',
      text: `You have arrived at ${endNode?.displayName}.`,
      expectedSteps: 0,
      expectedHeading: lastEdge.heading,
      nodeId: endId,
      phase: 'walk',
    });

    return instructions;
  }

  start() {
    this.isActive = true;
    this.currentInstructionIndex = 0;
    this.stepsTakenInCurrentSegment = 0;
    this.startStepsForCurrentSegment = 0;
    this.currentPhase = this.instructions[0]?.phase || 'walk';
    this.gyroAccumulator = 0; // RESET on start
    this.lastGyroTime = Date.now();
    
    if (this.instructions.length > 0) {
      this.emit('instruction', { 
        instruction: this.instructions[0],
        index: 0,
        total: this.instructions.length,
      });
    }
  }

  // Calibration removed - not needed for simple navigation

  update(margaUpdate: MargaUpdate) {
    if (!this.isActive) return;

    const currentInstruction = this.getCurrentInstruction();
    if (!currentInstruction) return;

    this.lastHeading = margaUpdate.heading;

    // If in TURN phase, detect turn with gyroscope (Marga logic)
    if (currentInstruction.phase === 'turn') {
      this.detectTurnCompletion(margaUpdate);
    } 
    // If in WALK phase, count steps
    else if (currentInstruction.phase === 'walk') {
      // RESET gyro accumulator when NOT turning
      this.gyroAccumulator = 0;
      this.lastGyroTime = Date.now();
      
      const stepsInSegment = margaUpdate.stepCount - this.startStepsForCurrentSegment;
      
      // Only update if not already reached target (stop counting extra steps)
      if (stepsInSegment < currentInstruction.expectedSteps) {
        this.stepsTakenInCurrentSegment = stepsInSegment;
        this.emitProgress();
      } else if (stepsInSegment >= currentInstruction.expectedSteps) {
        // Reached target - freeze at exact target
        this.stepsTakenInCurrentSegment = currentInstruction.expectedSteps;
        this.moveToNextInstruction(this.startStepsForCurrentSegment + currentInstruction.expectedSteps);
      }
    }
  }

  private detectTurnCompletion(margaUpdate: MargaUpdate) {
    // EXACT logic from Marga(merged)
    if (!margaUpdate.gyroZ) return;

    const now = Date.now();
    const dt = (now - this.lastGyroTime) / 1000;
    this.lastGyroTime = now;

    const degrees = margaUpdate.gyroZ * (180 / Math.PI) * dt;
    this.gyroAccumulator += degrees;

    const currentInstruction = this.getCurrentInstruction();
    if (!currentInstruction?.turnDirection) return;

    console.log(`🔄 Gyro: ${margaUpdate.gyroZ.toFixed(3)}, Degrees: ${degrees.toFixed(1)}°, Accumulated: ${this.gyroAccumulator.toFixed(1)}°, Direction: ${currentInstruction.turnDirection}`);

    // Use HIGHER threshold like Marga to avoid false detections
    const TURN_THRESHOLD = 90; // Increased from 45 - requires full 90° turn
    
    // Detect Sharp Turns (same as Marga) - need significant rotation
    if (currentInstruction.turnDirection.includes('left') && this.gyroAccumulator > TURN_THRESHOLD) {
      console.log('✅ LEFT turn detected!');
      this.completeTurn();
    } else if (currentInstruction.turnDirection.includes('right') && this.gyroAccumulator < -TURN_THRESHOLD) {
      console.log('✅ RIGHT turn detected!');
      this.completeTurn();
    }
  }

  private completeTurn() {
    this.gyroAccumulator = 0; // Reset like Marga does
    this.emit('turnCompleted', { message: 'Turn completed' });
    Vibration.vibrate([0, 50, 100, 50]);
    
    // Move to next instruction (should be the walk phase)
    this.moveToNextInstruction(this.startStepsForCurrentSegment);
  }

  private moveToNextInstruction(totalSteps: number) {
    this.currentInstructionIndex++;
    this.startStepsForCurrentSegment = totalSteps; // Start next segment from current total
    this.stepsTakenInCurrentSegment = 0; // Reset segment counter

    // RESET gyro when moving to new instruction
    this.gyroAccumulator = 0;
    this.lastGyroTime = Date.now();

    if (this.currentInstructionIndex >= this.instructions.length - 1) {
      // Arrived at destination
      this.isActive = false;
      this.emit('arrived', {
        instruction: this.instructions[this.instructions.length - 1],
      });
    } else {
      const nextInstruction = this.getCurrentInstruction();
      if (nextInstruction) {
        this.emit('instruction', {
          instruction: nextInstruction,
          index: this.currentInstructionIndex,
          total: this.instructions.length,
        });
      }
    }
  }

  getCurrentInstruction(): NavigationInstruction | null {
    return this.instructions[this.currentInstructionIndex] || null;
  }

  getProgress(): NavigationProgress {
    const currentInstruction = this.getCurrentInstruction();
    const totalSteps = this.path.reduce((sum, edge) => sum + edge.steps, 0);
    const stepsDone = this.path
      .slice(0, this.currentInstructionIndex)
      .reduce((sum, edge) => sum + edge.steps, 0) + this.stepsTakenInCurrentSegment;

    return {
      currentInstructionIndex: this.currentInstructionIndex,
      stepsTaken: this.stepsTakenInCurrentSegment,
      distanceRemaining: totalSteps - stepsDone,
      isOffRoute: false,
    };
  }

  repeatInstruction() {
    const instruction = this.getCurrentInstruction();
    if (instruction) {
      this.emit('instruction', {
        instruction,
        index: this.currentInstructionIndex,
        total: this.instructions.length,
        isRepeat: true,
      });
    }
  }

  cancel() {
    this.isActive = false;
    this.emit('cancelled', {});
  }

  on(eventType: NavigationEventType, callback: EventCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: NavigationEventType, callback: EventCallback) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(eventType: NavigationEventType, data?: any) {
    const event: NavigationEvent = { type: eventType, data };
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(cb => cb(event));
  }

  private emitProgress() {
    this.emit('progress', this.getProgress());
  }

  isNavigating(): boolean {
    return this.isActive;
  }

  getAllInstructions(): NavigationInstruction[] {
    return [...this.instructions];
  }
}
