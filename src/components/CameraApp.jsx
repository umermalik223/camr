import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Download, Sliders, CheckCircle, Video, Square, Play, Pause, Clock, Zap, Eye, Minimize, Maximize, Sun, Moon } from 'lucide-react';
import './CameraApp.css';

// Predefined filters
const presetFilters = [
  { 
    name: 'Normal', 
    icon: '🔍',
    settings: { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0, grayscale: 0, grain: 0 } 
  },
  { 
    name: 'Vintage', 
    icon: '🕰️',
    settings: { brightness: 110, contrast: 120, saturation: 70, hue: 10, blur: 0, sepia: 30, grayscale: 0, grain: 20 } 
  },
  { 
    name: 'B&W', 
    icon: '⚫',
    settings: { brightness: 100, contrast: 130, saturation: 0, hue: 0, blur: 0, sepia: 0, grayscale: 100, grain: 10 } 
  },
  { 
    name: 'Warm', 
    icon: '☀️',
    settings: { brightness: 105, contrast: 110, saturation: 130, hue: 15, blur: 0, sepia: 20, grayscale: 0, grain: 0 } 
  },
  { 
    name: 'Cool', 
    icon: '❄️',
    settings: { brightness: 100, contrast: 110, saturation: 90, hue: 230, blur: 0, sepia: 0, grayscale: 0, grain: 0 } 
  },
  { 
    name: 'Dramatic', 
    icon: '🎭',
    settings: { brightness: 110, contrast: 150, saturation: 130, hue: 0, blur: 0, sepia: 0, grayscale: 0, grain: 0 } 
  },
  { 
    name: 'Wide', 
    icon: '🌐',
    settings: { brightness: 105, contrast: 105, saturation: 105, hue: 0, blur: 0, sepia: 0, grayscale: 0, grain: 0, wideAngle: 1 } 
  },
  { 
    name: 'Ultra Wide', 
    icon: '🔭',
    settings: { brightness: 105, contrast: 110, saturation: 105, hue: 0, blur: 0, sepia: 0, grayscale: 0, grain: 0, wideAngle: 2 } 
  },
  { 
    name: 'Film', 
    icon: '🎞️',
    settings: { brightness: 105, contrast: 115, saturation: 85, hue: 0, blur: 0, sepia: 15, grayscale: 0, grain: 30 } 
  },
  { 
    name: 'HDR', 
    icon: '✨',
    settings: { brightness: 110, contrast: 120, saturation: 120, hue: 0, blur: 0, sepia: 0, grayscale: 0, grain: 0, hdr: 1 } 
  },
  { 
    name: 'Night', 
    icon: '🌙',
    settings: { brightness: 120, contrast: 110, saturation: 90, hue: 210, blur: 0.5, sepia: 10, grayscale: 0, grain: 15, nightMode: 1 } 
  },
  { 
    name: 'Portrait', 
    icon: '👤',
    settings: { brightness: 105, contrast: 110, saturation: 110, hue: 0, blur: 0, sepia: 0, grayscale: 0, grain: 5, portraitMode: 1 } 
  }
];

// AI modes
const aiModes = [
  { name: 'Standard', icon: '📷', description: 'Standard camera mode' },
  { name: 'Smart HDR', icon: '✨', description: 'AI-enhanced dynamic range' },
  { name: 'Night Vision', icon: '🌙', description: 'AI-enhanced low light capture' },
  { name: 'Portrait', icon: '👤', description: 'AI depth mapping for portraits' },
  { name: 'Scene Detect', icon: '🏞️', description: 'AI scene detection and optimization' },
  { name: 'Pro Mode', icon: '⚙️', description: 'Professional controls with AI assistance' }
];

const CameraApp = () => {
  // Camera state
  const [facing, setFacing] = useState('user');
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoMode, setVideoMode] = useState(false);
  const [cameraCapabilities, setCameraCapabilities] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [exposureLevel, setExposureLevel] = useState(0);
  const [aiMode, setAiMode] = useState(0); // Index of selected AI mode

  // UI state
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    grain: 0,
    wideAngle: 0,
    hdr: 0,
    nightMode: 0,
    portraitMode: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAiModes, setShowAiModes] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isIphoneX, setIsIphoneX] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [activePreset, setActivePreset] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showZoomSlider, setShowZoomSlider] = useState(false);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [sceneInfo, setSceneInfo] = useState(null); // For AI scene detection
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const flashRef = useRef(null);
  const viewfinderRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const zoomTimerRef = useRef(null);

  // Simple utility functions
  const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  const getBestCameraConstraints = async (facingMode) => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 3840 }, // Try for 4K
          height: { ideal: 2160 },
          frameRate: { ideal: 60 }
        },
        audio: videoMode // Only request audio in video mode
      };
      
      // Advanced constraints if supported
      if (window.navigator.mediaDevices.getSupportedConstraints) {
        const supportedConstraints = window.navigator.mediaDevices.getSupportedConstraints();
        
        if (supportedConstraints.zoom) {
          constraints.video.zoom = zoomLevel;
        }
        
        if (supportedConstraints.exposureCompensation) {
          constraints.video.exposureCompensation = exposureLevel;
        }
      }
      
      return constraints;
    } catch (err) {
      console.error("Error creating constraints:", err);
      return {
        video: { facingMode },
        audio: videoMode
      };
    }
  };

  // Check if device is mobile and detect iPhone X or newer
  useEffect(() => {
    const checkDevice = () => {
      // Check if mobile
      const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      // Check if iPhone X or newer (has notch and home indicator)
      const isIphoneXOrNewer = /iPhone/.test(navigator.userAgent) && 
        (window.screen.height >= 812 || window.screen.width >= 812);
      setIsIphoneX(isIphoneXOrNewer);
      
      if (isIphoneXOrNewer) {
        // Add a special class to the body for iPhone X+ specific CSS
        document.body.classList.add('is-iphone-x');
      }
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    // Check for camera support
    if (!isCameraSupported()) {
      setError("Your browser doesn't support camera access. Please try a different browser.");
    }
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Start camera stream
  useEffect(() => {
    let mounted = true;
    
    const setupCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsCameraReady(false);
        
        console.log("Starting camera with facing mode:", facing, "video mode:", videoMode);
        
        // Stop any existing stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Get user media with best constraints
        const constraints = await getBestCameraConstraints(facing);
        console.log("Using constraints:", constraints);
        
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) return;
        
        setStream(newStream);
        setCameraPermission(true);
        
        // Get camera capabilities (if available)
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
          try {
            const capabilities = videoTrack.getCapabilities();
            console.log("Camera capabilities:", capabilities);
            setCameraCapabilities(capabilities);
          } catch (e) {
            console.log("Could not get camera capabilities:", e);
          }
        }
        
        // Set video dimensions for canvas
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          
          videoRef.current.onloadedmetadata = () => {
            if (!mounted) return;
            
            const video = videoRef.current;
            setImageWidth(video.videoWidth);
            setImageHeight(video.videoHeight);
            setIsLoading(false);
            
            video.play()
              .then(() => {
                console.log("Video playing successfully");
                setIsCameraReady(true);
                
                // Start AI scene detection if in relevant mode
                if (aiMode === 4) { // Scene Detect mode
                  startSceneDetection();
                }
              })
              .catch(e => {
                console.error("Error playing video:", e);
                setError("Couldn't start video stream. Please reload and try again.");
              });
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (!mounted) return;
        
        setIsLoading(false);
        
        if (err.name === 'NotAllowedError') {
          setCameraPermission(false);
          setError("Camera access denied. Please allow camera access and reload the page.");
        } else if (err.name === 'NotFoundError') {
          setError(`Cannot find a ${facing === 'user' ? 'front' : 'back'} camera. Try switching cameras.`);
        } else {
          setError(`Error accessing camera: ${err.message || 'Unknown error'}`);
        }
      }
    };
    
    setupCamera();
    
    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facing, videoMode, zoomLevel, exposureLevel, aiMode]);

  // Handle double tap on viewfinder to flip camera
  useEffect(() => {
    const handleDoubleTap = (e) => {
      const now = new Date().getTime();
      const timeDiff = now - lastTapTime;
      
      // Detect double tap (time between taps < 300ms)
      if (timeDiff < 300 && timeDiff > 0) {
        flipCamera();
        e.preventDefault(); // Prevent zoom on double tap
      }
      
      setLastTapTime(now);
    };
    
    const viewfinder = viewfinderRef.current;
    if (viewfinder) {
      viewfinder.addEventListener('touchend', handleDoubleTap);
    }
    
    return () => {
      if (viewfinder) {
        viewfinder.removeEventListener('touchend', handleDoubleTap);
      }
    };
  }, [lastTapTime]);

  // Apply filters to captured image
  useEffect(() => {
    if (capturedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Apply CSS filters
        ctx.filter = `
          brightness(${filters.brightness}%) 
          contrast(${filters.contrast}%) 
          saturate(${filters.saturation}%) 
          hue-rotate(${filters.hue}deg)
          blur(${filters.blur}px)
          sepia(${filters.sepia}%)
          grayscale(${filters.grayscale}%)
        `;
        
        // Apply wide angle effect if enabled
        if (filters.wideAngle > 0) {
          applyWideAngleEffect(ctx, img, canvas.width, canvas.height, filters.wideAngle);
        } else {
          // Draw the image without flipping
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        // Apply grain effect if needed
        if (filters.grain > 0) {
          addGrainEffect(ctx, canvas.width, canvas.height, filters.grain);
        }
        
        // Apply additional effects based on AI mode
        if (filters.portraitMode > 0) {
          applyPortraitEffect(ctx, canvas.width, canvas.height);
        }
        
        if (filters.hdr > 0) {
          applyHDREffect(ctx, canvas.width, canvas.height);
        }
        
        if (filters.nightMode > 0) {
          applyNightModeEffect(ctx, canvas.width, canvas.height);
        }
      };
      img.src = capturedImage;
    }
  }, [capturedImage, filters]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
    
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);
  
  // Handle zoom slider auto-hide
  useEffect(() => {
    if (showZoomSlider) {
      if (zoomTimerRef.current) {
        clearTimeout(zoomTimerRef.current);
      }
      
      zoomTimerRef.current = setTimeout(() => {
        setShowZoomSlider(false);
      }, 3000); // Hide after 3 seconds of inactivity
    }
    
    return () => {
      if (zoomTimerRef.current) {
        clearTimeout(zoomTimerRef.current);
      }
    };
  }, [showZoomSlider, zoomLevel]);

  // Handle escape key to close panels
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowFilters(false);
        setShowPresets(false);
        setShowAdvanced(false);
        setShowAiModes(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);
  
  // Scene detection function
  const startSceneDetection = useCallback(() => {
    if (!videoRef.current || !isCameraReady) return;
    
    // Set up a canvas for grabbing video frames
    const detectCanvas = document.createElement('canvas');
    const detectCtx = detectCanvas.getContext('2d');
    const video = videoRef.current;
    
    // Down-sample for performance
    detectCanvas.width = 100;
    detectCanvas.height = 100;
    
    // Function to analyze the current frame
    const analyzeFrame = () => {
      // Only run if component is still mounted and in scene detect mode
      if (!videoRef.current || aiMode !== 4) return;
      
      // Draw the current frame
      detectCtx.drawImage(video, 0, 0, detectCanvas.width, detectCanvas.height);
      
      // Get image data
      const imageData = detectCtx.getImageData(0, 0, detectCanvas.width, detectCanvas.height);
      const data = imageData.data;
      
      // Simple analysis - check brightness and color distribution
      let brightness = 0;
      let redSum = 0, greenSum = 0, blueSum = 0;
      let pixelCount = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        brightness += (r + g + b) / 3;
        redSum += r;
        greenSum += g;
        blueSum += b;
        pixelCount++;
      }
      
      brightness = brightness / pixelCount;
      const avgRed = redSum / pixelCount;
      const avgGreen = greenSum / pixelCount;
      const avgBlue = blueSum / pixelCount;
      
      // Detect scene type (very basic implementation)
      let sceneType = 'Standard';
      let recommendation = 'No adjustments needed';
      
      if (brightness < 50) {
        sceneType = 'Low Light';
        recommendation = 'Consider using Night mode';
      } else if (brightness > 200) {
        sceneType = 'Bright';
        recommendation = 'Consider lowering exposure';
      }
      
      if (avgGreen > avgRed * 1.5 && avgGreen > avgBlue * 1.5) {
        sceneType = 'Nature/Landscape';
        recommendation = 'Use Wide angle for better composition';
      }
      
      if (Math.max(avgRed, avgGreen, avgBlue) - Math.min(avgRed, avgGreen, avgBlue) < 20) {
        sceneType = 'Low Contrast';
        recommendation = 'Increase contrast for better definition';
      }
      
      setSceneInfo({
        type: sceneType,
        brightness: Math.round(brightness),
        colorBalance: {
          red: Math.round(avgRed),
          green: Math.round(avgGreen),
          blue: Math.round(avgBlue)
        },
        recommendation
      });
      
      // Schedule next frame analysis
      requestAnimationFrame(analyzeFrame);
    };
    
    // Start the analysis
    analyzeFrame();
  }, [isCameraReady, aiMode]);
  
  // Function to add grain effect to canvas
  const addGrainEffect = (ctx, width, height, intensity) => {
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = width;
    grainCanvas.height = height;
    const grainCtx = grainCanvas.getContext('2d');
    
    const imageData = grainCtx.createImageData(width, height);
    const data = imageData.data;
    
    // Normalize intensity (0-100) to a usable opacity (0-20)
    const grainOpacity = intensity / 5;
    
    for (let i = 0; i < data.length; i += 4) {
      // Random noise
      const value = Math.random() * 255;
      
      // Apply to RGB channels
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      
      // Set alpha based on intensity
      data[i + 3] = grainOpacity;
    }
    
    grainCtx.putImageData(imageData, 0, 0);
    
    // Apply grain using 'overlay' blend mode
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(grainCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  };
  
  // Function to apply simulated wide angle effect
  const applyWideAngleEffect = (ctx, img, width, height, intensity) => {
    // Save the original state
    ctx.save();
    
    // Calculate the barrel distortion parameters based on intensity
    const strength = 0.3 * intensity; // Adjust strength based on intensity
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Step 1: Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Step 2: Apply the distortion by dividing the image into small chunks
    const chunkSize = 20; // Size of each chunk
    
    for (let y = 0; y < height; y += chunkSize) {
      for (let x = 0; x < width; x += chunkSize) {
        // Calculate the position relative to the center
        const relX = (x - centerX) / centerX;
        const relY = (y - centerY) / centerY;
        
        // Calculate the distance from the center (0 to 1)
        const distance = Math.sqrt(relX * relX + relY * relY);
        
        // Apply the barrel distortion formula
        const newDistance = distance * (1 - strength * distance * distance);
        
        // Only apply distortion if we're not at the center (to avoid division by zero)
        if (distance > 0) {
          const ratio = newDistance / distance;
          
          // Calculate the new coordinates
          const newX = centerX + (x - centerX) * ratio;
          const newY = centerY + (y - centerY) * ratio;
          
          // Draw this chunk of the image with distortion
          ctx.drawImage(
            img,
            x, y, chunkSize, chunkSize, // Source rectangle
            newX, newY, chunkSize, chunkSize // Destination rectangle
          );
        } else {
          // For the center, just draw normally
          ctx.drawImage(
            img,
            x, y, chunkSize, chunkSize, // Source rectangle
            x, y, chunkSize, chunkSize // Destination rectangle
          );
        }
      }
    }
    
    // Restore the original state
    ctx.restore();
    
    // Add a subtle vignette effect (common in wide angle lenses)
    addVignetteEffect(ctx, width, height, 0.3 * intensity);
  };
  
  // Add vignette effect (darkened corners)
  const addVignetteEffect = (ctx, width, height, intensity) => {
    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.4, // Inner circle
      width / 2, height / 2, Math.max(width, height) * 0.7  // Outer circle
    );
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
    
    // Apply the vignette
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  };
  
  // Apply simulated portrait mode effect (fake bokeh)
  const applyPortraitEffect = (ctx, width, height) => {
    // Create a gradient that simulates depth of field
    // Assuming the center of the image is the subject
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    // Create a circular mask for the in-focus area
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    
    // Create gradient for the blur mask
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.7, // Inner circle (in focus)
      centerX, centerY, radius * 1.5  // Outer circle (blurred)
    );
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)'); // In focus (transparent)
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)'); // Blurred (opaque)
    
    // Draw a blurred version of the image underneath
    ctx.filter = 'blur(8px)';
    ctx.globalAlpha = 0.7;
    ctx.drawImage(canvasRef.current, 0, 0);
    ctx.globalAlpha = 1;
    
    // Draw the mask to create the DOF effect
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.restore();
  };
  
  // Apply simulated HDR effect
  const applyHDREffect = (ctx, width, height) => {
    // Simulate HDR by enhancing shadow and highlight details
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Get pixel values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Apply different adjustments based on luminance
      if (luminance < 80) {
        // Boost shadows
        data[i] = Math.min(r * 1.2, 255);
        data[i + 1] = Math.min(g * 1.2, 255);
        data[i + 2] = Math.min(b * 1.2, 255);
      } else if (luminance > 180) {
        // Recover highlights
        data[i] = Math.max(r * 0.9, 0);
        data[i + 1] = Math.max(g * 0.9, 0);
        data[i + 2] = Math.max(b * 0.9, 0);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add subtle local contrast enhancement
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.3;
    ctx.drawImage(canvasRef.current, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };
  
  // Apply simulated night mode effect
  const applyNightModeEffect = (ctx, width, height) => {
    // First apply noise reduction (simple blur)
    ctx.filter = 'blur(0.5px)';
    ctx.drawImage(canvasRef.current, 0, 0);
    ctx.filter = 'none';
    
    // Then enhance brightness in darker areas
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Get pixel values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Boost low light areas more than bright areas
      const factor = 1 + Math.max(0, (100 - luminance) / 100);
      
      data[i] = Math.min(r * factor, 255);
      data[i + 1] = Math.min(g * factor, 255);
      data[i + 2] = Math.min(b * factor, 255);
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add subtle blue tint for night aesthetic
    ctx.fillStyle = 'rgba(0, 0, 50, 0.1)';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  };

  // Toggle video mode
  const toggleVideoMode = () => {
    // If currently recording, stop first
    if (isRecording) {
      stopRecording();
    }
    
    setVideoMode(!videoMode);
    setRecordedVideo(null);
  };
  
  // Start recording video
  const startRecording = () => {
    if (!stream || !videoMode) return;
    
    try {
      // Reset recorded chunks
      recordedChunksRef.current = [];
      
      // Create media recorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      // Handle data available event
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorderRef.current.onstop = () => {
        // Create video blob from recorded chunks
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoURL = URL.createObjectURL(blob);
        setRecordedVideo(videoURL);
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError("Could not start recording. Please try again.");
    }
  };
  
  // Stop recording video
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Format recording time as MM:SS
  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const capturePhoto = () => {
    if (!videoRef.current || !isCameraReady) return;
    
    // Show flash effect
    if (flashRef.current) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 150);
    }
    
    // Create temporary canvas for capturing
    const tempCanvas = document.createElement('canvas');
    const video = videoRef.current;
    
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    
    const ctx = tempCanvas.getContext('2d');
    
    // Important: Don't flip the image horizontally
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Get image as data URL
    const imageDataUrl = tempCanvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);
  };

  // This function flips the camera
  const flipCamera = () => {
    console.log("Flipping camera from", facing, "to", facing === 'user' ? 'environment' : 'user');
    setFacing(prevFacing => prevFacing === 'user' ? 'environment' : 'user');
    // Close any open panels when flipping camera
    setShowPresets(false);
    setShowFilters(false);
    setShowAdvanced(false);
  };

  const resetImage = () => {
    setCapturedImage(null);
    // Don't reset filters when going back to camera
  };
  
  const resetVideo = () => {
    setRecordedVideo(null);
  };

  const downloadMedia = () => {
    if (capturedImage && canvasRef.current) {
      // Download captured image
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const filename = `neocam-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      
      downloadFile(dataUrl, filename);
    } else if (recordedVideo) {
      // Download recorded video
      const filename = `neocam-video-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
      
      // For videos, we need to fetch the blob and then download
      fetch(recordedVideo)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          downloadFile(url, filename);
          window.URL.revokeObjectURL(url);
        })
        .catch(err => {
          console.error("Error downloading video:", err);
          setError("Could not download video. Please try again.");
        });
    }
  };
  
  // Helper function to download a file
  const downloadFile = (url, filename) => {
    // Create visible link for mobile devices
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      const downloadDiv = document.createElement('div');
      downloadDiv.style.position = 'fixed';
      downloadDiv.style.top = '0';
      downloadDiv.style.left = '0';
      downloadDiv.style.width = '100%';
      downloadDiv.style.height = '100%';
      downloadDiv.style.backgroundColor = 'rgba(0,0,0,0.85)';
      downloadDiv.style.display = 'flex';
      downloadDiv.style.flexDirection = 'column';
      downloadDiv.style.alignItems = 'center';
      downloadDiv.style.justifyContent = 'center';
      downloadDiv.style.zIndex = '9999';
      
      // Close button
      const closeButton = document.createElement('button');
      closeButton.innerText = 'Close';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '20px';
      closeButton.style.right = '20px';
      closeButton.style.padding = '10px 20px';
      closeButton.style.backgroundColor = '#FF3CAC';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '20px';
      closeButton.style.fontWeight = 'bold';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => document.body.removeChild(downloadDiv);
      
      // Media preview
      let mediaElement;
      if (capturedImage) {
        mediaElement = document.createElement('img');
        mediaElement.src = url;
        mediaElement.style.maxWidth = '90%';
        mediaElement.style.maxHeight = '60%';
        mediaElement.style.borderRadius = '12px';
        mediaElement.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        mediaElement.style.marginBottom = '20px';
      } else {
        mediaElement = document.createElement('video');
        mediaElement.src = url;
        mediaElement.controls = true;
        mediaElement.autoplay = true;
        mediaElement.style.maxWidth = '90%';
        mediaElement.style.maxHeight = '60%';
        mediaElement.style.borderRadius = '12px';
        mediaElement.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        mediaElement.style.marginBottom = '20px';
      }
      
      // Instructions
      const instructions = document.createElement('p');
      instructions.style.color = 'white';
      instructions.style.margin = '16px';
      instructions.style.fontFamily = 'sans-serif';
      
      // Add iOS-specific instructions
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        if (capturedImage) {
          instructions.innerText = 'Press and hold the image, then tap "Save to Photos"';
        } else {
          instructions.innerText = 'Tap the share button in the video player to save';
        }
      } else {
        instructions.innerText = capturedImage ? 
          'Press and hold the image to save' : 
          'Press and hold the video to save';
      }
      
      // Download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.padding = '12px 24px';
      link.style.backgroundColor = '#4CAF50';
      link.style.color = 'white';
      link.style.textDecoration = 'none';
      link.style.borderRadius = '24px';
      link.style.fontWeight = 'bold';
      link.style.fontFamily = 'sans-serif';
      link.innerText = capturedImage ? 'Download Image' : 'Download Video';
      
      // Assemble
      downloadDiv.appendChild(closeButton);
      downloadDiv.appendChild(mediaElement);
      downloadDiv.appendChild(instructions);
      downloadDiv.appendChild(link);
      
      document.body.appendChild(downloadDiv);
    } else {
      // Desktop approach
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    }
  };

  // Apply filter CSS to live preview
  const getFilterStyle = () => {
    return {
      filter: `
        brightness(${filters.brightness}%) 
        contrast(${filters.contrast}%) 
        saturate(${filters.saturation}%) 
        hue-rotate(${filters.hue}deg)
        blur(${filters.blur}px)
        sepia(${filters.sepia}%)
        grayscale(${filters.grayscale}%)
      `,
      // Handle grain separately via a pseudo-element in CSS with variable
      '--grain-amount': `${filters.grain}%`,
      // Handle wide angle via distortion in CSS
      '--distortion-amount': `${filters.wideAngle * 2}%`,
      transform: `scale(${zoomLevel})`,
      transformOrigin: 'center'
    };
  };

  // Apply a preset filter
  const applyPresetFilter = (index) => {
    setFilters(presetFilters[index].settings);
    setActivePreset(index);
    
    // If this is an AI-focused filter, switch to appropriate AI mode
    if (presetFilters[index].name === 'HDR') {
      setAiMode(1); // Smart HDR
    } else if (presetFilters[index].name === 'Night') {
      setAiMode(2); // Night Vision
    } else if (presetFilters[index].name === 'Portrait') {
      setAiMode(3); // Portrait mode
    } else {
      setAiMode(0); // Standard mode
    }
  };
  
  // Set AI mode
  const setAIModeHandler = (index) => {
    setAiMode(index);
    
    // Apply corresponding filter preset if applicable
    switch (index) {
      case 1: // Smart HDR
        setFilters({...filters, hdr: 1});
        break;
      case 2: // Night Vision
        setFilters({...filters, nightMode: 1});
        break;
      case 3: // Portrait
        setFilters({...filters, portraitMode: 1});
        break;
      case 4: // Scene Detect
        // This will trigger the scene detection logic
        break;
      default:
        // Reset special modes
        setFilters({
          ...filters,
          hdr: 0,
          nightMode: 0,
          portraitMode: 0
        });
    }
  };

  // Generate filter sliders
  const renderFilterSliders = () => {
    const filterConfig = [
      { name: 'brightness', min: 50, max: 150, step: 1, label: 'Brightness' },
      { name: 'contrast', min: 50, max: 150, step: 1, label: 'Contrast' },
      { name: 'saturation', min: 0, max: 200, step: 1, label: 'Saturation' },
      { name: 'hue', min: 0, max: 360, step: 1, label: 'Hue' },
      { name: 'sepia', min: 0, max: 100, step: 1, label: 'Sepia' },
      { name: 'grayscale', min: 0, max: 100, step: 1, label: 'B&W' },
      { name: 'blur', min: 0, max: 5, step: 0.1, label: 'Blur' },
      { name: 'grain', min: 0, max: 100, step: 1, label: 'Grain' },
      { name: 'wideAngle', min: 0, max: 2, step: 0.1, label: 'Wide Angle' }
    ];

    return filterConfig.map((filter) => (
      <div key={filter.name} className="filter-slider-control">
        <div className="filter-slider-header">
          <span className="filter-slider-label">{filter.label}</span>
          <span className="filter-slider-value">{filters[filter.name]}</span>
        </div>
        <input
          type="range"
          min={filter.min}
          max={filter.max}
          step={filter.step}
          value={filters[filter.name]}
          onChange={(e) => {
            setFilters({...filters, [filter.name]: parseFloat(e.target.value)});
            setActivePreset(-1); // Custom filter now
          }}
          className="filter-range-input"
        />
      </div>
    ));
  };

  // Render advanced controls
  const renderAdvancedControls = () => {
    return (
      <div className="advanced-controls">
        <div className="filter-slider-control">
          <div className="filter-slider-header">
            <span className="filter-slider-label">Zoom</span>
            <span className="filter-slider-value">{zoomLevel.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="filter-range-input"
          />
        </div>
        
        <div className="filter-slider-control">
          <div className="filter-slider-header">
            <span className="filter-slider-label">Exposure</span>
            <span className="filter-slider-value">{exposureLevel > 0 ? `+${exposureLevel}` : exposureLevel}</span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={exposureLevel}
            onChange={(e) => setExposureLevel(parseFloat(e.target.value))}
            className="filter-range-input"
          />
        </div>
        
        {/* AI Mode Selection */}
        <div className="ai-mode-selector">
          <h4>AI Enhancement</h4>
          <div className="ai-mode-options">
            {aiModes.map((mode, index) => (
              <div 
                key={mode.name} 
                className={`ai-mode-option ${aiMode === index ? 'active' : ''}`}
                onClick={() => setAIModeHandler(index)}
              >
                <div className="ai-mode-icon">{mode.icon}</div>
                <div className="ai-mode-name">{mode.name}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Scene Information (only shown in Scene Detect mode) */}
        {aiMode === 4 && sceneInfo && (
          <div className="scene-info">
            <h4>Scene Analysis</h4>
            <div className="scene-details">
              <p><strong>Scene Type:</strong> {sceneInfo.type}</p>
              <p><strong>Brightness:</strong> {sceneInfo.brightness}/255</p>
              <p><strong>Recommendation:</strong> {sceneInfo.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render preset filters
  const renderPresetFilters = () => {
    return (
      <div className="preset-filters-container">
        {presetFilters.map((preset, index) => (
          <div 
            key={preset.name} 
            className={`preset-filter ${activePreset === index ? 'active' : ''}`}
            onClick={() => applyPresetFilter(index)}
          >
            <div className="preset-filter-icon">{preset.icon}</div>
            <div className="preset-filter-name">{preset.name}</div>
            {activePreset === index && (
              <div className="preset-filter-selected">
                <CheckCircle size={16} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Camera permission request screen
  if (cameraPermission === false) {
    return (
      <div className="neocam-permission-screen">
        <div className="neocam-permission-content">
          <div className="neocam-logo">NEOCAM</div>
          <Camera size={48} />
          <h2>Camera Access Required</h2>
          <p>Please allow access to your camera to use this app.</p>
          <button 
            className="neocam-permission-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`neocam-container ${isIphoneX ? 'is-iphone-x' : ''}`}>
      {/* Flash effect */}
      <div 
        ref={flashRef} 
        className={`neocam-flash ${showFlash ? 'active' : ''}`}
      ></div>
      
      {/* Zoom Slider (shows briefly when zooming) */}
      <div className={`neocam-zoom-slider ${showZoomSlider ? 'visible' : ''}`}>
        <div className="zoom-slider-label">
          <Minimize size={16} />
          <span>{zoomLevel.toFixed(1)}x</span>
          <Maximize size={16} />
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="0.1"
          value={zoomLevel}
          onChange={(e) => {
            setZoomLevel(parseFloat(e.target.value));
            setShowZoomSlider(true);
          }}
          className="zoom-range-input"
        />
      </div>
      
      {/* Camera View / Captured Image / Recorded Video */}
      <div 
        className="neocam-viewfinder" 
        ref={viewfinderRef}
        onClick={() => {
          // Toggle zoom slider on tap
          if (!capturedImage && !recordedVideo) {
            setShowZoomSlider(prev => !prev);
          }
        }}
      >
        {/* Double-tap instructions */}
        {isMobile && !capturedImage && !recordedVideo && isCameraReady && (
          <div className="neocam-double-tap-hint">
            Double-tap to flip camera
          </div>
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="neocam-recording-indicator">
            <div className="recording-dot"></div>
            <div className="recording-time">{formatRecordingTime(recordingTime)}</div>
          </div>
        )}
        
        {/* AI Mode indicator */}
        {aiMode > 0 && !capturedImage && !recordedVideo && (
          <div className="neocam-ai-indicator">
            <div className="ai-mode-badge">
              <span className="ai-mode-icon">{aiModes[aiMode].icon}</span>
              <span className="ai-mode-name">{aiModes[aiMode].name}</span>
            </div>
          </div>
        )}
        
        {capturedImage ? (
          <canvas 
            ref={canvasRef} 
            className="neocam-canvas"
          />
        ) : recordedVideo ? (
          <video 
            src={recordedVideo}
            className="neocam-video-playback"
            controls
            autoPlay
          />
        ) : (
          <>
            {isLoading && (
              <div className="neocam-loading">
                <div className="neocam-spinner"></div>
                <p>Starting camera...</p>
              </div>
            )}
            
            {error && (
              <div className="neocam-error">
                <p>{error}</p>
                <button 
                  className="neocam-retry-button"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={getFilterStyle()}
              className={`neocam-video ${isCameraReady ? 'ready' : 'hidden'} ${filters.wideAngle > 0 ? 'wide-angle' : ''}`}
            />
          </>
        )}
      </div>

      {/* Debug info - Remove in production */}
      {!isCameraReady && !isLoading && !error && !capturedImage && !recordedVideo && (
        <div className="neocam-debug-info">
          <p>Camera initialized but not displaying. Try reloading the page.</p>
          <button 
            className="neocam-retry-button"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )}

      {/* Preset Filters Panel */}
      <div className={`neocam-preset-panel ${showPresets ? 'visible' : ''}`}>
        <div className="neocam-panel-header">
          <h3>Choose Filter</h3>
          <button 
            onClick={() => setShowPresets(false)}
            className="neocam-close-panel-button"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="neocam-preset-wrapper">
          {renderPresetFilters()}
        </div>
      </div>
      
      {/* Advanced Controls Panel */}
      <div className={`neocam-advanced-panel ${showAdvanced ? 'visible' : ''}`}>
        <div className="neocam-panel-header">
          <h3>Advanced Controls</h3>
          <button 
            onClick={() => setShowAdvanced(false)}
            className="neocam-close-panel-button"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="neocam-advanced-controls-wrapper">
          {renderAdvancedControls()}
        </div>
      </div>

      {/* AI Modes Panel */}
      <div className={`neocam-ai-panel ${showAiModes ? 'visible' : ''}`}>
        <div className="neocam-panel-header">
          <h3>AI Camera Modes</h3>
          <button 
            onClick={() => setShowAiModes(false)}
            className="neocam-close-panel-button"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="neocam-ai-modes-wrapper">
          <div className="ai-modes-container">
            {aiModes.map((mode, index) => (
              <div 
                key={mode.name} 
                className={`ai-mode-card ${aiMode === index ? 'active' : ''}`}
                onClick={() => {
                  setAIModeHandler(index);
                  setShowAiModes(false);
                }}
              >
                <div className="ai-mode-card-icon">{mode.icon}</div>
                <div className="ai-mode-card-content">
                  <div className="ai-mode-card-name">{mode.name}</div>
                  <div className="ai-mode-card-description">{mode.description}</div>
                </div>
                {aiMode === index && (
                  <div className="ai-mode-card-selected">
                    <CheckCircle size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`neocam-controls ${isIphoneX ? 'iphone-x-controls' : ''}`}>
        <div className="neocam-controls-inner">
          {/* Top row controls */}
          <div className="neocam-top-controls">
            {/* Video mode toggle */}
            <button
              onClick={toggleVideoMode}
              className={`neocam-mode-button ${videoMode ? 'active' : ''}`}
              disabled={isLoading || !!error}
            >
              {videoMode ? <Camera size={20} /> : <Video size={20} />}
            </button>
            
            {/* AI mode button */}
            <button
              onClick={() => {
                setShowAiModes(!showAiModes);
                // Close other panels
                setShowPresets(false);
                setShowFilters(false);
                setShowAdvanced(false);
              }}
              className={`neocam-mode-button ${aiMode > 0 ? 'active' : ''}`}
              disabled={isLoading || !!error}
            >
              {aiMode === 0 ? <Zap size={20} /> : 
               aiMode === 1 ? <Sun size={20} /> :
               aiMode === 2 ? <Moon size={20} /> :
               aiMode === 3 ? <Eye size={20} /> :
               <Eye size={20} />}
            </button>
          </div>
        
          {/* Main controls */}
          <div className="neocam-main-controls">
            {/* Left secondary control */}
            <div className="neocam-secondary-controls">
              {!capturedImage && !recordedVideo && !isRecording && (
                <button 
                  onClick={() => {
                    setShowPresets(!showPresets);
                    // Close other panels
                    setShowFilters(false);
                    setShowAdvanced(false);
                    setShowAiModes(false);
                  }}
                  className={`neocam-control-button ${showPresets ? 'active' : ''}`}
                  aria-label="Filter presets"
                  disabled={isLoading || !!error}
                >
                  <span className="button-icon">🎞️</span>
                  <span className="button-label">Filters</span>
                </button>
              )}
            </div>
            
            {/* Center primary control */}
            <div className="neocam-primary-controls">
              {capturedImage ? (
                <div className="neocam-captured-controls">
                  <button 
                    onClick={resetImage} 
                    className="neocam-reset-button"
                    aria-label="Retake photo"
                  >
                    <X size={24} />
                  </button>
                  <button 
                    onClick={downloadMedia} 
                    className="neocam-download-button"
                    aria-label="Save photo"
                  >
                    <Download size={24} />
                  </button>
                </div>
              ) : recordedVideo ? (
                <div className="neocam-captured-controls">
                  <button 
                    onClick={resetVideo} 
                    className="neocam-reset-button"
                    aria-label="Discard video"
                  >
                    <X size={24} />
                  </button>
                  <button 
                    onClick={downloadMedia} 
                    className="neocam-download-button"
                    aria-label="Save video"
                  >
                    <Download size={24} />
                  </button>
                </div>
              ) : videoMode ? (
                <button 
                  onClick={isRecording ? stopRecording : startRecording} 
                  className={`neocam-record-button ${isRecording ? 'recording' : ''}`}
                  disabled={isLoading || !!error || !isCameraReady}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? <Square size={24} /> : <Video size={28} />}
                </button>
              ) : (
                <button 
                  onClick={capturePhoto} 
                  className="neocam-capture-button"
                  disabled={isLoading || !!error || !isCameraReady}
                  aria-label="Take photo"
                >
                </button>
              )}
            </div>
            
            {/* Right secondary control */}
            <div className="neocam-secondary-controls">
              {capturedImage ? (
                <button 
                  onClick={() => {
                    setShowFilters(!showFilters);
                    // Close other panels
                    setShowPresets(false);
                    setShowAdvanced(false);
                    setShowAiModes(false);
                  }}
                  className={`neocam-control-button ${showFilters ? 'active' : ''}`}
                  aria-label="Adjust filters"
                >
                  <Sliders size={24} />
                  <span className="button-label">Edit</span>
                </button>
              ) : !recordedVideo && (
                <button 
                  onClick={() => {
                    setShowAdvanced(!showAdvanced);
                    // Close other panels
                    setShowPresets(false);
                    setShowFilters(false);
                    setShowAiModes(false);
                  }}
                  className={`neocam-control-button ${showAdvanced ? 'active' : ''}`}
                  disabled={isLoading || !!error}
                  aria-label="Advanced controls"
                >
                  <Sliders size={24} />
                  <span className="button-label">Pro</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Bottom row controls */}
          <div className="neocam-bottom-controls">
            {!capturedImage && !recordedVideo && !isRecording && (
              <button 
                id="flip-camera-button"
                onClick={flipCamera} 
                className="neocam-control-button neocam-flip-button"
                disabled={isLoading || !!error}
                aria-label="Switch camera"
              >
                <RefreshCw size={20} />
                <span className="button-label">Flip</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Filter Adjustments Panel */}
      <div className={`neocam-adjustment-panel ${showFilters ? 'visible' : ''}`}>
        <div className="neocam-panel-header">
          <h3>Adjust Filters</h3>
          <div className="neocam-panel-actions">
            <button 
              onClick={() => setFilters({
                brightness: 100,
                contrast: 100,
                saturation: 100,
                hue: 0,
                blur: 0,
                sepia: 0,
                grayscale: 0,
                grain: 0,
                wideAngle: 0,
                hdr: 0,
                nightMode: 0,
                portraitMode: 0
              })}
              className="neocam-reset-filters-button"
            >
              Reset
            </button>
            <button 
              onClick={() => setShowFilters(false)}
              className="neocam-close-panel-button"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="neocam-filter-controls">
          {renderFilterSliders()}
        </div>
      </div>
      
      {/* Logo overlay */}
      <div className="neocam-brand">
        <div className="neocam-logo">NEOCAM</div>
        {aiMode > 0 && (
          <div className="neocam-ai-badge">AI</div>
        )}
      </div>
    </div>
  );
};

export default CameraApp;