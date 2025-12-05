// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
//   memo,
//   useMemo,
// } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   Dimensions,
//   Platform,
//   TouchableOpacity,
//   Alert,
//   Vibration,
//   FlatList,
//   StatusBar,
//   SafeAreaView,
// } from 'react-native';
// import { CameraView, useCameraPermissions } from 'expo-camera';
// import * as Speech from 'expo-speech';
// import { Feather, FontAwesome5 } from '@expo/vector-icons';

// // --- TYPES ---
// interface BoundingBoxCoords {
//   x1: number; y1: number; x2: number; y2: number;
// }

// interface Detection {
//   class: string;
//   confidence: number;
//   position: string;
//   distance: string;
//   isPriority: boolean;
//   bbox: BoundingBoxCoords;
// }

// interface ServerResponse {
//   alert: string;
//   alerts: string[];
//   objects: string[];
//   detections: Detection[];
//   frameWidth: number;
//   frameHeight: number;
// }

// // --- PROPS FOR NAVIGATION ---
// interface Props {
//   onBack: () => void;
// }

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// // --- CONFIGURATION ---
// const CONFIG = {
//   SERVER_URL: 'http://192.168.31.185:5000/detect',
//   FRAME_RATE: 10,
//   REQUEST_TIMEOUT: 5000,
//   RECONNECT_DELAY: 1000,
//   IMAGE_QUALITY: 0.15,
//   MAX_RETRY_ATTEMPTS: 5,
//   SPEECH_COOLDOWN: 3000,
// };

// // --- DIVYADRISHTI THEME ---
// const COLORS = {
//   bg: '#000000',            // Pitch Black
//   primary: '#FFD700',       // Gold
//   secondary: '#FFFFFF',     // White
//   danger: '#FF4500',        // Orange Red (High Vis)
//   success: '#00FF00',       // Bright Green (for system ready)
//   cardBg: '#111111',        // Slightly lighter black for cards
//   border: '#FFD700',        // Gold Borders
//   overlay: 'rgba(0, 0, 0, 0.7)',
// };

// export default function Netra({ onBack }: Props) {
//   const [permission, requestPermission] = useCameraPermissions();
//   const [detections, setDetections] = useState<Detection[]>([]);
//   const [alertText, setAlertText] = useState('System Ready');
//   const [isCameraReady, setIsCameraReady] = useState(false);
//   const [isRunning, setIsRunning] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
//   const [serverW, setServerW] = useState(1);
//   const [serverH, setServerH] = useState(1);

//   const cameraRef = useRef<CameraView>(null);
  
//   // Refs for logic
//   const runningRef = useRef(false);
//   const processingRef = useRef(false);
//   const lastSpeechTimeRef = useRef(0);
//   const retryCountRef = useRef(0);
//   const mountedRef = useRef(true);
//   const frameLoopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const lastAlertTextRef = useRef<string>('System Ready');
  
//   // Camera Layout State
//   const [cameraLayout, setCameraLayout] = useState<{ w: number; h: number }>({
//     w: SCREEN_WIDTH,
//     h: Math.round(SCREEN_HEIGHT * 0.65), // Camera takes 65% of screen
//   });

//   // ---------- LOGIC HANDLERS ----------

//   const updateDetections = useCallback((next: Detection[]) => {
//     setDetections(prev => {
//       if (prev.length === next.length) {
//         // Simple diff check to prevent useless re-renders
//         let same = true;
//         for (let i = 0; i < prev.length; i++) {
//           if (prev[i].class !== next[i].class || prev[i].bbox.x1 !== next[i].bbox.x1) {
//             same = false; break;
//           }
//         }
//         if (same) return prev;
//       }
//       return next;
//     });
//   }, []);

//   const speakAlert = useCallback((text: string) => {
//     const now = Date.now();
//     if (now - lastSpeechTimeRef.current < CONFIG.SPEECH_COOLDOWN) return;
//     lastSpeechTimeRef.current = now;
//     Speech.stop();
//     Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 1.05 });
//   }, []);

//   const handleAlerts = useCallback((data: ServerResponse) => {
//     let nextAlert = 'Path Clear';
//     if (data.alert) nextAlert = data.alert;
//     else if (data.objects?.length > 0) {
//       const uniqueObjects = Array.from(new Set(data.objects));
//       nextAlert = `${uniqueObjects.slice(0, 2).join(', ')} detected`;
//     }

//     if (nextAlert !== lastAlertTextRef.current) {
//       setAlertText(nextAlert);
//       lastAlertTextRef.current = nextAlert;
//     }

//     if (nextAlert.includes('Warning')) Vibration.vibrate([0, 50, 50, 50]);
//     if (data.alert) speakAlert(data.alert);
//   }, [speakAlert]);

//   // Cleanup
//   useEffect(() => {
//     return () => {
//       mountedRef.current = false;
//       runningRef.current = false;
//       if (frameLoopTimeoutRef.current) clearTimeout(frameLoopTimeoutRef.current);
//       Speech.stop();
//     };
//   }, []);

//   const stopDetection = useCallback(() => {
//     runningRef.current = false;
//     setIsRunning(false);
//     Speech.stop();
//     if (frameLoopTimeoutRef.current) clearTimeout(frameLoopTimeoutRef.current);
//     setAlertText('Paused');
//   }, []);

//   // Frame Capture Loop
//   const captureAndSendFrame = useCallback(async () => {
//     if (!cameraRef.current || processingRef.current || !mountedRef.current) return;

//     processingRef.current = true;
//     try {
//       const photo = await cameraRef.current.takePictureAsync({
//         quality: CONFIG.IMAGE_QUALITY,
//         skipProcessing: true,
//         base64: false,
//         exif: false,
//       });

//       if (!mountedRef.current) return;

//       const formData = new FormData();
//       formData.append('image', {
//         uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
//         type: 'image/jpeg',
//         name: 'frame.jpg',
//       } as any);

//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

//       const response = await fetch(CONFIG.SERVER_URL, {
//         method: 'POST',
//         body: formData,
//         signal: controller.signal,
//         headers: { 'Accept': 'application/json' },
//       });

//       clearTimeout(timeoutId);

//       if (!response.ok) throw new Error(`Status: ${response.status}`);

//       const data: ServerResponse = await response.json();
//       if (!mountedRef.current) return;

//       updateDetections(data.detections || []);
//       setServerW(data.frameWidth || 1);
//       setServerH(data.frameHeight || 1);
//       setConnectionStatus('connected');
//       retryCountRef.current = 0;
//       handleAlerts(data);

//     } catch (err: any) {
//       if (!mountedRef.current) return;
//       const isNetworkError = err?.message?.includes('Network') || err?.name === 'AbortError';
      
//       if (isNetworkError) {
//         setConnectionStatus('error');
//         retryCountRef.current += 1;
//         if (retryCountRef.current >= CONFIG.MAX_RETRY_ATTEMPTS) {
//           setAlertText('Connection Lost');
//           stopDetection();
//           Alert.alert('Connection Error', 'Check PC Server.');
//         } else {
//             // Keep trying quietly
//         }
//       }
//     } finally {
//       processingRef.current = false;
//     }
//   }, [handleAlerts, stopDetection, updateDetections]);

//   const startRealtimeLoop = useCallback(() => {
//     const frameDelay = 1000 / CONFIG.FRAME_RATE;
//     const loop = async () => {
//       if (!runningRef.current || !mountedRef.current) return;
//       await captureAndSendFrame();
//       if (runningRef.current && mountedRef.current) {
//         frameLoopTimeoutRef.current = setTimeout(loop, frameDelay);
//       }
//     };
//     loop();
//   }, [captureAndSendFrame]);

//   const startDetection = useCallback(() => {
//     if (runningRef.current) return;
//     runningRef.current = true;
//     retryCountRef.current = 0;
//     setIsRunning(true);
//     setConnectionStatus('connecting');
//     setAlertText('Netra Active...');
//     startRealtimeLoop();
//   }, [startRealtimeLoop]);

//   const toggleDetection = useCallback(() => {
//     Vibration.vibrate(20);
//     if (isRunning) stopDetection();
//     else startDetection();
//   }, [isRunning, startDetection, stopDetection]);

//   // Auto-start
//   const hasStartedRef = useRef(false);
//   useEffect(() => {
//     if (isCameraReady && !hasStartedRef.current) {
//       hasStartedRef.current = true;
//       startDetection();
//     }
//   }, [isCameraReady, startDetection]);

//   // Scaling logic
//   const { scaleX, scaleY } = useMemo(() => {
//     return {
//       scaleX: cameraLayout.w / Math.max(1, serverW),
//       scaleY: cameraLayout.h / Math.max(1, serverH),
//     };
//   }, [serverW, serverH, cameraLayout]);

//   // ---------- RENDER ----------

//   if (!permission || !permission.granted) {
//     return (
//       <View style={styles.permissionContainer}>
//         <FontAwesome5 name="camera" size={60} color={COLORS.primary} style={{marginBottom: 20}} />
//         <Text style={styles.permissionText}>NETRA VISION</Text>
//         <Text style={styles.permissionSubtext}>Camera access required for object detection.</Text>
//         <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
//           <Text style={styles.primaryButtonText}>GRANT ACCESS</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.backButtonSimple} onPress={onBack}>
//           <Text style={styles.backButtonTextSimple}>GO BACK</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#000" />
      
//       {/* 1. CAMERA SECTION */}
//       <View 
//         style={styles.cameraContainer}
//         onLayout={e => setCameraLayout({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
//       >
//         <CameraView
//           style={styles.camera}
//           facing="back"
//           ref={cameraRef}
//           onCameraReady={() => setIsCameraReady(true)}
//         >
//           {/* A. Bounding Boxes Overlay */}
//           <View style={styles.overlay}>
//             {detections.map((det, i) => (
//               <BoundingBox key={`${det.class}-${i}`} detection={det} scaleX={scaleX} scaleY={scaleY} />
//             ))}
//           </View>

//           {/* B. Header Overlay (Back Button + Status) */}
//           <SafeAreaView style={styles.safeHeader}>
//             <View style={styles.headerRow}>
//               {/* Back Button */}
//               <TouchableOpacity onPress={onBack} style={styles.backButton}>
//                  <Feather name="chevron-left" size={28} color={COLORS.primary} />
//               </TouchableOpacity>
              
//               {/* Status Pill */}
//               <View style={[styles.statusPill, connectionStatus === 'error' && styles.statusError]}>
//                 <View style={[styles.statusDot, 
//                    { backgroundColor: connectionStatus === 'connected' ? '#00FF00' : 
//                      connectionStatus === 'error' ? '#FF0000' : '#FFFF00' }
//                 ]} />
//                 <Text style={styles.statusText}>
//                   {connectionStatus === 'connected' ? 'NETRA ONLINE' : 'CONNECTING...'}
//                 </Text>
//               </View>
//             </View>
//           </SafeAreaView>

//           {/* C. Bottom Floating Alert (On Camera) */}
//           <View style={styles.alertOverlay}>
//              {alertText !== 'Paused' && (
//                 <View style={[styles.alertBox, alertText.includes('Warning') && styles.alertBoxWarning]}>
//                   <Feather name={alertText.includes('Warning') ? "alert-triangle" : "eye"} size={24} color={COLORS.bg} />
//                   <Text style={styles.alertText}>{alertText.toUpperCase()}</Text>
//                 </View>
//              )}
//           </View>
//         </CameraView>
//       </View>

//       {/* 2. DASHBOARD SECTION (High Contrast) */}
//       <View style={styles.dashboardContainer}>
        
//         {/* Controls Row */}
//         <View style={styles.controlsRow}>
//             <Text style={styles.dashTitle}>DETECTED OBJECTS ({detections.length})</Text>
            
//             <TouchableOpacity 
//                 style={[styles.controlButton, isRunning ? styles.btnActive : styles.btnPaused]} 
//                 onPress={toggleDetection}
//             >
//                 <Feather name={isRunning ? "pause" : "play"} size={20} color={COLORS.bg} />
//                 <Text style={styles.controlBtnText}>{isRunning ? "PAUSE" : "RESUME"}</Text>
//             </TouchableOpacity>
//         </View>

//         {/* List */}
//         <FlatList
//           data={detections}
//           keyExtractor={(item, idx) => idx.toString()}
//           contentContainerStyle={{ paddingBottom: 20 }}
//           renderItem={({ item }) => (
//             <View style={[styles.card, item.isPriority && styles.cardPriority]}>
//               <View style={styles.cardLeft}>
//                  <Text style={styles.cardTitle}>{item.class.toUpperCase()}</Text>
//                  <Text style={styles.cardSubtitle}>{item.position} • {item.distance}</Text>
//               </View>
//               <View style={styles.cardRight}>
//                  <Text style={[styles.confidenceText, { color: item.isPriority ? COLORS.danger : COLORS.primary }]}>
//                     {Math.round(item.confidence * 100)}%
//                  </Text>
//               </View>
//             </View>
//           )}
//           ListEmptyComponent={
//             <View style={styles.emptyState}>
//               <Text style={styles.emptyText}>PATH IS CLEAR</Text>
//             </View>
//           }
//         />
//       </View>
//     </View>
//   );
// }

// // --- OPTIMIZED BOUNDING BOX ---
// const BoundingBox = memo(function BoundingBox({ detection, scaleX, scaleY }: { detection: Detection; scaleX: number; scaleY: number; }) {
//   const { bbox, isPriority } = detection;
//   const color = isPriority ? COLORS.danger : COLORS.primary;
  
//   return (
//     <View
//         style={{
//             position: 'absolute',
//             left: bbox.x1 * scaleX,
//             top: bbox.y1 * scaleY,
//             width: (bbox.x2 - bbox.x1) * scaleX,
//             height: (bbox.y2 - bbox.y1) * scaleY,
//             borderWidth: 3, // Thicker for accessibility
//             borderColor: color,
//             zIndex: 10,
//         }}
//     >
//        {/* Label Tag */}
//        <View style={{ position: 'absolute', top: -25, left: -3, backgroundColor: color, paddingHorizontal: 6, paddingVertical: 2 }}>
//           <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>{detection.class.toUpperCase()}</Text>
//        </View>
//     </View>
//   );
// });

// // --- STYLES (GOLD & BLACK THEME) ---
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.bg },
  
//   // CAMERA
//   cameraContainer: { flex: 2, backgroundColor: '#000', overflow: 'hidden' },
//   camera: { flex: 1 },
//   overlay: { ...StyleSheet.absoluteFillObject },
  
//   // HEADER
//   safeHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
//   headerRow: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     justifyContent: 'space-between', 
//     paddingHorizontal: 20, 
//     paddingTop: Platform.OS === 'android' ? 40 : 10 
//   },
//   backButton: {
//     width: 50, height: 50,
//     justifyContent: 'center', alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     borderRadius: 12,
//     borderWidth: 2, borderColor: COLORS.primary
//   },
//   statusPill: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     paddingHorizontal: 15, paddingVertical: 8,
//     borderRadius: 20,
//     borderWidth: 1, borderColor: COLORS.primary
//   },
//   statusError: { borderColor: COLORS.danger },
//   statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
//   statusText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },

//   // ALERTS
//   alertOverlay: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
//   alertBox: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: COLORS.primary,
//     paddingHorizontal: 20, paddingVertical: 12,
//     borderRadius: 8, gap: 10,
//     shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10
//   },
//   alertBoxWarning: { backgroundColor: COLORS.danger },
//   alertText: { color: COLORS.bg, fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },

//   // DASHBOARD
//   dashboardContainer: { 
//     flex: 1.2, 
//     backgroundColor: COLORS.bg, 
//     paddingHorizontal: 20, 
//     paddingTop: 20,
//     borderTopWidth: 2,
//     borderTopColor: COLORS.primary
//   },
//   controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
//   dashTitle: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  
//   controlButton: {
//     flexDirection: 'row', alignItems: 'center',
//     paddingHorizontal: 16, paddingVertical: 10,
//     borderRadius: 8, gap: 8
//   },
//   btnActive: { backgroundColor: COLORS.primary },
//   btnPaused: { backgroundColor: '#333', borderWidth: 1, borderColor: '#666' },
//   controlBtnText: { color: COLORS.bg, fontWeight: 'bold', fontSize: 14 },

//   // CARDS
//   card: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     backgroundColor: '#111',
//     borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)',
//     borderRadius: 12,
//     padding: 16, marginBottom: 10
//   },
//   cardPriority: { borderColor: COLORS.danger, borderWidth: 2 },
//   cardLeft: { flex: 1 },
//   cardRight: { justifyContent: 'center' },
//   cardTitle: { color: COLORS.secondary, fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
//   cardSubtitle: { color: '#888', fontSize: 14, marginTop: 4 },
//   confidenceText: { fontSize: 20, fontWeight: 'bold' },

//   // EMPTY STATE
//   emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
//   emptyText: { color: '#444', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },

//   // PERMISSIONS
//   permissionContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 30 },
//   permissionText: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
//   permissionSubtext: { color: '#FFF', textAlign: 'center', marginBottom: 30, fontSize: 16 },
//   primaryButton: { 
//       backgroundColor: COLORS.primary, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 
//   },
//   primaryButtonText: { color: '#000', fontWeight: 'bold', fontSize: 18 },
//   backButtonSimple: { padding: 15 },
//   backButtonTextSimple: { color: '#666', fontSize: 16, fontWeight: 'bold' }
// });



import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
  TouchableOpacity,
  Alert,
  Vibration,
  FlatList,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import { Feather, FontAwesome5 } from "@expo/vector-icons";

// --- TYPES ---
interface BoundingBoxCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Detection {
  class: string;
  confidence: number;
  position: string;
  distance: string;
  isPriority: boolean;
  bbox: BoundingBoxCoords;
}

interface ServerResponse {
  alert: string;
  alerts: string[];
  objects: string[];
  detections: Detection[];
  frameWidth: number;
  frameHeight: number;
}

interface Props {
  onBack: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- CONFIG ---
const CONFIG = {
  SERVER_URL: "http://192.168.31.185:5000/detect",
  FRAME_RATE: 10,
  REQUEST_TIMEOUT: 5000,
  RECONNECT_DELAY: 1000,
  IMAGE_QUALITY: 0.15,
  MAX_RETRY_ATTEMPTS: 5,
  SPEECH_COOLDOWN: 3000,
};

// --- THEME ---
const COLORS = {
  bg: "#000000",
  primary: "#FFD700",
  secondary: "#FFFFFF",
  danger: "#FF3B30",
  success: "#00FF00",
  cardBg: "#1C1C1E",
  border: "rgba(255, 215, 0, 0.5)",
  dangerBorder: "rgba(255, 59, 48, 0.5)",
  overlay: "rgba(0, 0, 0, 0.6)",
  subtle: "#8E8E93",
};

export default function Netra({ onBack }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [alertText, setAlertText] = useState("System Ready");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const [serverW, setServerW] = useState(1);
  const [serverH, setServerH] = useState(1);

  const cameraRef = useRef<CameraView>(null);

  const runningRef = useRef(false);
  const processingRef = useRef(false);
  const lastSpeechTimeRef = useRef(0);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const frameLoopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAlertTextRef = useRef<string>("System Ready");

  const [cameraLayout, setCameraLayout] = useState<{ w: number; h: number }>({
    w: SCREEN_WIDTH,
    h: Math.round(SCREEN_HEIGHT * 0.65),
  });

  // ---------- LOGIC ----------
  const updateDetections = useCallback((next: Detection[]) => {
    setDetections((prev) => {
      if (prev.length === next.length) {
        let same = true;
        for (let i = 0; i < prev.length; i++) {
          if (
            prev[i].class !== next[i].class ||
            prev[i].bbox.x1 !== next[i].bbox.x1
          ) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return next;
    });
  }, []);

  const speakAlert = useCallback((text: string) => {
    const now = Date.now();
    if (now - lastSpeechTimeRef.current < CONFIG.SPEECH_COOLDOWN) return;
    lastSpeechTimeRef.current = now;
    Speech.stop();
    Speech.speak(text, { language: "en-US", pitch: 1.0, rate: 1.05 });
  }, []);

  const handleAlerts = useCallback(
    (data: ServerResponse) => {
      let nextAlert = "Path Clear";
      if (data.alert) nextAlert = data.alert;
      else if (data.objects?.length > 0) {
        const uniqueObjects = Array.from(new Set(data.objects));
        nextAlert = `${uniqueObjects.slice(0, 2).join(", ")} detected`;
      }

      if (nextAlert !== lastAlertTextRef.current) {
        setAlertText(nextAlert);
        lastAlertTextRef.current = nextAlert;
      }

      if (nextAlert.includes("Warning")) Vibration.vibrate([0, 50, 50, 50]);
      if (data.alert) speakAlert(data.alert);
    },
    [speakAlert]
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      runningRef.current = false;
      if (frameLoopTimeoutRef.current) clearTimeout(frameLoopTimeoutRef.current);
      Speech.stop();
    };
  }, []);

  const stopDetection = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    Speech.stop();
    if (frameLoopTimeoutRef.current) clearTimeout(frameLoopTimeoutRef.current);
    setAlertText("Paused");
  }, []);

  const captureAndSendFrame = useCallback(async () => {
    if (!cameraRef.current || processingRef.current || !mountedRef.current)
      return;

    processingRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: CONFIG.IMAGE_QUALITY,
        skipProcessing: true,
        base64: false,
        exif: false,
      });

      if (!mountedRef.current) return;

      const formData = new FormData();
      formData.append("image", {
        uri:
          Platform.OS === "ios"
            ? photo.uri.replace("file://", "")
            : photo.uri,
        type: "image/jpeg",
        name: "frame.jpg",
      } as any);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        CONFIG.REQUEST_TIMEOUT
      );

      const response = await fetch(CONFIG.SERVER_URL, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data: ServerResponse = await response.json();
      if (!mountedRef.current) return;

      updateDetections(data.detections || []);
      setServerW(data.frameWidth || 1);
      setServerH(data.frameHeight || 1);
      setConnectionStatus("connected");
      retryCountRef.current = 0;
      handleAlerts(data);
    } catch (err: any) {
      if (!mountedRef.current) return;
      const isNetworkError =
        err?.message?.includes("Network") || err?.name === "AbortError";

      if (isNetworkError) {
        setConnectionStatus("error");
        retryCountRef.current += 1;
        if (retryCountRef.current >= CONFIG.MAX_RETRY_ATTEMPTS) {
          setAlertText("Connection Lost");
          stopDetection();
          Alert.alert("Connection Error", "Check PC Server.");
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [handleAlerts, stopDetection, updateDetections]);

  const startRealtimeLoop = useCallback(() => {
    const frameDelay = 1000 / CONFIG.FRAME_RATE;
    const loop = async () => {
      if (!runningRef.current || !mountedRef.current) return;
      await captureAndSendFrame();
      if (runningRef.current && mountedRef.current) {
        frameLoopTimeoutRef.current = setTimeout(loop, frameDelay);
      }
    };
    loop();
  }, [captureAndSendFrame]);

  const startDetection = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    retryCountRef.current = 0;
    setIsRunning(true);
    setConnectionStatus("connecting");
    setAlertText("Netra Active...");
    startRealtimeLoop();
  }, [startRealtimeLoop]);

  const toggleDetection = useCallback(() => {
    Vibration.vibrate(20);
    if (isRunning) stopDetection();
    else startDetection();
  }, [isRunning, startDetection, stopDetection]);

  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (isCameraReady && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startDetection();
    }
  }, [isCameraReady, startDetection]);

  const { scaleX, scaleY } = useMemo(() => {
    return {
      scaleX: cameraLayout.w / Math.max(1, serverW),
      scaleY: cameraLayout.h / Math.max(1, serverH),
    };
  }, [serverW, serverH, cameraLayout]);

  // ---------- UI ----------

  if (!permission || !permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIconWrapper}>
          <FontAwesome5 name="camera" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.permissionTitle}>NETRA VISION</Text>
        <Text style={styles.permissionSubtext}>
          Camera access is required for real-time object detection and navigation assistance.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButtonSimple} 
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonTextSimple}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* CAMERA SECTION */}
      <View
        style={styles.cameraContainer}
        onLayout={(e) =>
          setCameraLayout({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        <CameraView
          style={styles.camera}
          facing="back"
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
        >
          {/* OVERLAY */}
          <View style={styles.overlay}>
            {detections.map((det, i) => (
              <BoundingBox
                key={`${det.class}-${i}`}
                detection={det}
                scaleX={scaleX}
                scaleY={scaleY}
              />
            ))}
          </View>

          {/* HEADER */}
          <SafeAreaView style={styles.safeHeader}>
            <View style={styles.headerRow}>
              {/* BACK */}
              <TouchableOpacity 
                onPress={onBack} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Feather name="chevron-left" size={26} color={COLORS.primary} />
              </TouchableOpacity>

              {/* STATUS */}
              <View
                style={[
                  styles.statusPill,
                  connectionStatus === "error" && styles.statusError,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        connectionStatus === "connected"
                          ? COLORS.success
                          : connectionStatus === "error"
                          ? COLORS.danger
                          : "#FFFF00",
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {connectionStatus === "connected"
                    ? "ONLINE"
                    : connectionStatus === "error"
                    ? "OFFLINE"
                    : "CONNECTING"}
                </Text>
              </View>
            </View>
          </SafeAreaView>

          {/* FLOATING ALERT */}
          <View style={styles.alertOverlay}>
            {alertText !== "Paused" && (
              <View
                style={[
                  styles.alertBox,
                  alertText.includes("Warning") && styles.alertBoxWarning,
                ]}
              >
                <View style={styles.alertIconWrapper}>
                  <Feather
                    name={alertText.includes("Warning") ? "alert-triangle" : "eye"}
                    size={22}
                    color={alertText.includes("Warning") ? COLORS.danger : COLORS.primary}
                  />
                </View>
                <Text style={styles.alertText}>
                  {alertText.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </CameraView>
      </View>

      {/* DASHBOARD */}
      <View style={styles.dashboardContainer}>
        {/* HEADER */}
        <View style={styles.controlsRow}>
          <View>
            <Text style={styles.dashTitle}>Detected Objects</Text>
            <Text style={styles.dashSubtitle}>{detections.length} items in view</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.controlButton,
              isRunning ? styles.btnActive : styles.btnPaused,
            ]}
            onPress={toggleDetection}
            activeOpacity={0.8}
          >
            <View style={styles.controlIconWrapper}>
              <Feather
                name={isRunning ? "pause" : "play"}
                size={18}
                color={isRunning ? COLORS.bg : COLORS.primary}
              />
            </View>
            <Text style={[
              styles.controlBtnText,
              !isRunning && styles.controlBtnTextInactive
            ]}>
              {isRunning ? "Pause" : "Resume"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <FlatList
          data={detections}
          keyExtractor={(item, idx) => idx.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[styles.card, item.isPriority && styles.cardPriority]}
            >
              <View style={[
                styles.cardIconWrapper,
                item.isPriority && styles.cardIconWrapperPriority
              ]}>
                <Feather 
                  name={item.isPriority ? "alert-circle" : "box"} 
                  size={20} 
                  color={item.isPriority ? COLORS.danger : COLORS.primary} 
                />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  {item.class.toUpperCase()}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {item.position} • {item.distance}
                </Text>
              </View>

              <View style={styles.cardRight}>
                <Text
                  style={[
                    styles.confidenceText,
                    {
                      color: item.isPriority ? COLORS.danger : COLORS.primary,
                    },
                  ]}
                >
                  {Math.round(item.confidence * 100)}%
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="check-circle" size={40} color={COLORS.success} />
              </View>
              <Text style={styles.emptyText}>Path is Clear</Text>
              <Text style={styles.emptySubtext}>No obstacles detected</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

// --- BOUNDING BOX ---
const BoundingBox = memo(function BoundingBox({
  detection,
  scaleX,
  scaleY,
}: {
  detection: Detection;
  scaleX: number;
  scaleY: number;
}) {
  const { bbox, isPriority } = detection;
  const color = isPriority ? COLORS.danger : COLORS.primary;

  return (
    <View
      style={{
        position: "absolute",
        left: bbox.x1 * scaleX,
        top: bbox.y1 * scaleY,
        width: (bbox.x2 - bbox.x1) * scaleX,
        height: (bbox.y2 - bbox.y1) * scaleY,
        borderWidth: 2.5,
        borderColor: color,
        borderRadius: 8,
        shadowColor: color,
        shadowOpacity: 0.6,
        shadowRadius: isPriority ? 10 : 6,
        elevation: isPriority ? 10 : 6,
        zIndex: 10,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -28,
          left: -2,
          backgroundColor: color,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
        }}
      >
        <Text
          style={{
            color: "#000",
            fontWeight: "700",
            fontSize: 11,
            letterSpacing: 0.5,
          }}
        >
          {detection.class.toUpperCase()}
        </Text>
      </View>
    </View>
  );
});

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  cameraContainer: { flex: 2, backgroundColor: "#000", overflow: "hidden" },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },

  safeHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.overlay,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.overlay,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusError: { borderColor: COLORS.dangerBorder },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: COLORS.secondary,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
  },

  alertOverlay: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  alertBoxWarning: {
    borderColor: COLORS.dangerBorder,
    shadowColor: COLORS.danger,
  },
  alertIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertText: {
    color: COLORS.secondary,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  dashboardContainer: {
    flex: 1.2,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  dashTitle: {
    color: COLORS.secondary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dashSubtitle: {
    color: COLORS.subtle,
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },

  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  btnActive: { 
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  btnPaused: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
  },
  controlIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  controlBtnText: {
    color: COLORS.bg,
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  controlBtnTextInactive: {
    color: COLORS.secondary,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardPriority: {
    borderColor: COLORS.dangerBorder,
    borderWidth: 1.5,
  },

  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardIconWrapperPriority: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
  },

  cardContent: { flex: 1 },
  cardTitle: {
    color: COLORS.secondary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    color: COLORS.subtle,
    fontSize: 13,
    marginTop: 3,
    fontWeight: "500",
  },

  cardRight: {
    justifyContent: "center",
    alignItems: "flex-end",
  },

  confidenceText: {
    fontSize: 18,
    fontWeight: "700",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 255, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.secondary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptySubtext: {
    color: COLORS.subtle,
    fontSize: 14,
    fontWeight: "500",
  },

  // Permissions
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  permissionIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  permissionTitle: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 1,
  },
  permissionSubtext: {
    color: COLORS.subtle,
    textAlign: "center",
    marginBottom: 40,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  backButtonSimple: { 
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backButtonTextSimple: {
    color: COLORS.subtle,
    fontSize: 16,
    fontWeight: "600",
  },
});