import { IndoorMap } from '../types/indoor-navigation';

// Sample house layout with longer routes for testing
export const SAMPLE_HOUSE_MAP: IndoorMap = {
  name: "Home",
  nodes: [
    { id: "entrance", name: "Entrance", displayName: "Main Entrance", x: 0, y: 0 },
    { id: "living_room", name: "Living Room", displayName: "Living Room", x: 30, y: 0 },
    { id: "kitchen", name: "Kitchen", displayName: "Kitchen", x: 30, y: 30 },
    { id: "bedroom1", name: "Bedroom 1", displayName: "Master Bedroom", x: 0, y: 30 },
    { id: "bedroom2", name: "Bedroom 2", displayName: "Guest Bedroom", x: 0, y: 60 },
    { id: "bathroom", name: "Bathroom", displayName: "Bathroom", x: 30, y: 60 },
    { id: "hallway", name: "Hallway", displayName: "Main Hallway", x: 15, y: 30 },
  ],
  edges: [
    // Entrance connections - longer distances
    { from: "entrance", to: "living_room", steps: 45, heading: 90, description: "Walk straight to living room" },
    { from: "entrance", to: "hallway", steps: 35, heading: 45, description: "Walk to hallway" },
    
    // Living room connections
    { from: "living_room", to: "entrance", steps: 45, heading: 270, description: "Walk straight back to entrance" },
    { from: "living_room", to: "kitchen", steps: 40, heading: 0, description: "Walk straight to kitchen" },
    
    // Kitchen connections
    { from: "kitchen", to: "living_room", steps: 40, heading: 180, description: "Walk straight back to living room" },
    { from: "kitchen", to: "bathroom", steps: 35, heading: 0, description: "Walk straight to bathroom" },
    
    // Hallway connections - central hub
    { from: "hallway", to: "entrance", steps: 35, heading: 225, description: "Walk to entrance" },
    { from: "hallway", to: "bedroom1", steps: 25, heading: 270, description: "Walk to master bedroom" },
    { from: "hallway", to: "bedroom2", steps: 50, heading: 0, description: "Walk straight to guest bedroom" },
    { from: "hallway", to: "bathroom", steps: 30, heading: 45, description: "Walk to bathroom" },
    { from: "hallway", to: "living_room", steps: 30, heading: 90, description: "Walk to living room" },
    
    // Bedroom connections
    { from: "bedroom1", to: "hallway", steps: 25, heading: 90, description: "Walk to hallway" },
    { from: "bedroom2", to: "hallway", steps: 50, heading: 180, description: "Walk straight back to hallway" },
    { from: "bedroom2", to: "bathroom", steps: 40, heading: 90, description: "Walk to bathroom" },
    
    // Bathroom connections
    { from: "bathroom", to: "kitchen", steps: 35, heading: 180, description: "Walk straight back to kitchen" },
    { from: "bathroom", to: "bedroom2", steps: 40, heading: 270, description: "Walk to guest bedroom" },
    { from: "bathroom", to: "hallway", steps: 30, heading: 225, description: "Walk to hallway" },
  ],
};
