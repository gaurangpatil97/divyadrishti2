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


// import { IndoorMap } from '../types/indoor-navigation';

// export const COLLEGE_DEPT_MAP: IndoorMap = {
//   name: "Computer Department Floor",
//   nodes: [
//     // 1. The Central Hub
//     { id: "dept_corridor", name: "Main Corridor", displayName: "Department Corridor", x: 20, y: 20 },
    
//     // 2. The Offices requested
//     { id: "hod_office", name: "HOD Office", displayName: "Head of Department Cabin", x: 0, y: 20 },
//     { id: "archana_office", name: "Archana Office", displayName: "Prof. Archana's Cabin", x: 20, y: 40 },
//     { id: "payal_office", name: "Payal Office", displayName: "Prof. Payal's Cabin", x: 40, y: 40 },
//     { id: "swati_office", name: "Swati Office", displayName: "Prof. Swati's Cabin", x: 40, y: 20 },
    
//     // 3. The Classroom
//     { id: "einstein_hall", name: "Einstein Hall", displayName: "Einstein Lecture Hall", x: 60, y: 20 },
//   ],
//   edges: [
//     // --- Connections from HOD Office ---
//     // HOD is at the start of the corridor
//     { from: "hod_office", to: "dept_corridor", steps: 20, heading: 90, description: "Walk straight to main corridor" },
    
//     // --- Connections from Main Corridor (The Central Hub) ---
//     { from: "dept_corridor", to: "hod_office", steps: 20, heading: 270, description: "Walk to HOD cabin" },
//     { from: "dept_corridor", to: "archana_office", steps: 15, heading: 0, description: "Turn left to Archana Ma'am's office" },
//     { from: "dept_corridor", to: "swati_office", steps: 25, heading: 90, description: "Walk down the hall to Swati Ma'am's office" },
    
//     // --- Connections from Archana Ma'am's Office ---
//     { from: "archana_office", to: "dept_corridor", steps: 15, heading: 180, description: "Exit to main corridor" },
//     // A direct path exists between Archana and Payal (Neighboring cabins)
//     { from: "archana_office", to: "payal_office", steps: 15, heading: 90, description: "Walk to adjacent cabin (Payal Ma'am)" },
    
//     // --- Connections from Payal Ma'am's Office ---
//     { from: "payal_office", to: "archana_office", steps: 15, heading: 270, description: "Walk back to Archana Ma'am's cabin" },
//     // Payal Ma'am connects to Einstein Hall via a shortcut
//     { from: "payal_office", to: "einstein_hall", steps: 30, heading: 135, description: "Take the shortcut to Einstein Hall" },
//     // Payal Ma'am also connects to Swati Ma'am (across the hall)
//     { from: "payal_office", to: "swati_office", steps: 10, heading: 180, description: "Walk across to Swati Ma'am's office" },

//     // --- Connections from Swati Ma'am's Office ---
//     { from: "swati_office", to: "dept_corridor", steps: 25, heading: 270, description: "Walk back towards entrance" },
//     { from: "swati_office", to: "payal_office", steps: 10, heading: 0, description: "Walk across to Payal Ma'am's office" },
//     { from: "swati_office", to: "einstein_hall", steps: 20, heading: 90, description: "Walk straight into Einstein Hall" },

//     // --- Connections from Einstein Hall ---
//     { from: "einstein_hall", to: "swati_office", steps: 20, heading: 270, description: "Exit hall towards Swati Ma'am's office" },
//     { from: "einstein_hall", to: "payal_office", steps: 30, heading: 315, description: "Exit hall towards Payal Ma'am's office" },
//   ],
// };