import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Download, Sliders, CheckCircle } from 'lucide-react';
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
    name: 'Faded', 
    icon: '🌫️',
    settings: { brightness: 120, contrast: 80, saturation: 60, hue: 0, blur: 0.5, sepia: 10, grayscale: 0, grain: 15 } 
  },
  { 
    name: 'Film', 
    icon: '🎞️',
    settings: { brightness: 105, contrast: 115, saturation: 85, hue: 0, blur: 0, sepia: 15, grayscale: 0, grain: 30 } 
  },
  { 
    name: 'Hazy', 
    icon: '☁️',
    settings: { brightness: 115, contrast: 90, saturation: 80, hue: 0, blur: 1, sepia: 5, grayscale: 0, grain: 5 } 
  },
  { 
    name: 'Vivid', 
    icon: '🌈',
    settings: { brightness: 110, contrast: 135, saturation: 160, hue: 0, blur: 0, sepia: 0, grayscale: 0, grain: 0 } 
  }
];

const CameraApp = () => {
  const [facing, setFacing] = useState('user');
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    grain: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [activePreset, setActivePreset] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const flashRef = useRef(null);

  // Simple utility functions
  const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  const getBestCameraConstraints = (facingMode) => {
    return {
      video: {
        facingMode: facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Check for camera support
    if (!isCameraSupported()) {
      setError("Your browser doesn't support camera access. Please try a different browser.");
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Start camera stream - SIMPLIFIED FOR RELIABILITY
  useEffect(() => {
    let mounted = true;
    
    const setupCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsCameraReady(false);
        
        console.log("Starting camera with facing mode:", facing);
        
        // Stop any existing stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Get user media with basic constraints
        const constraints = {
          video: { facingMode: facing }
        };
        
        console.log("Requesting media with constraints:", constraints);
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) return;
        
        console.log("Got media stream:", newStream);
        setStream(newStream);
        setCameraPermission(true);
        
        if (videoRef.current) {
          console.log("Setting video source");
          videoRef.current.srcObject = newStream;
          
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            if (!mounted) return;
            
            setIsLoading(false);
            videoRef.current.play()
              .then(() => {
                console.log("Video playing successfully");
                setIsCameraReady(true);
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
  }, [facing]);

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
        
        // Draw the image without flipping
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Add grain effect if needed
        if (filters.grain > 0) {
          addGrainEffect(ctx, canvas.width, canvas.height, filters.grain);
        }
      };
      img.src = capturedImage;
    }
  }, [capturedImage, filters]);
  
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
  };

  const resetImage = () => {
    setCapturedImage(null);
    // Don't reset filters when going back to camera
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    // Get the canvas data
    const dataUrl = canvasRef.current.toDataURL('image/png');
    
    // Generate a filename with date and time
    const filename = `neocam-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    
    // Save the image
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
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
      '--grain-amount': `${filters.grain}%`
    };
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
      { name: 'grain', min: 0, max: 100, step: 1, label: 'Grain' }
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

  // Apply a preset filter
  const applyPresetFilter = (index) => {
    setFilters(presetFilters[index].settings);
    setActivePreset(index);
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

  // Handle escape key to close panels
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowFilters(false);
        setShowPresets(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

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
    <div className="neocam-container">
      {/* Flash effect */}
      <div 
        ref={flashRef} 
        className={`neocam-flash ${showFlash ? 'active' : ''}`}
      ></div>
      
      {/* Camera View / Captured Image */}
      <div className="neocam-viewfinder">
        {capturedImage ? (
          <canvas 
            ref={canvasRef} 
            className="neocam-canvas"
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
              className={`neocam-video ${isCameraReady ? 'ready' : 'hidden'}`}
            />
          </>
        )}
      </div>

      {/* Debug info - Remove in production */}
      {!isCameraReady && !isLoading && !error && (
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

      {/* Preset Filters Panel - Horizontal */}
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

      {/* Controls */}
      <div className="neocam-controls">
        <div className="neocam-controls-inner">
          {/* Secondary buttons - LEFT SIDE */}
          <div className="neocam-secondary-controls">
            {!capturedImage && (
              <button 
                onClick={() => {
                  setShowPresets(!showPresets);
                  if (showFilters) setShowFilters(false);
                }}
                className={`neocam-control-button ${showPresets ? 'active' : ''}`}
                aria-label="Filter presets"
              >
                <span className="button-icon">🎞️</span>
                <span className="button-label">Filters</span>
              </button>
            )}
          </div>
          
          {/* Main capture button - CENTER */}
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
                  onClick={downloadImage} 
                  className="neocam-download-button"
                  aria-label="Save photo"
                >
                  <Download size={24} />
                </button>
              </div>
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
          
          {/* Right controls */}
          <div className="neocam-secondary-controls">
            {capturedImage ? (
              <button 
                onClick={() => {
                  setShowFilters(!showFilters);
                  if (showPresets) setShowPresets(false);
                }}
                className={`neocam-control-button ${showFilters ? 'active' : ''}`}
                aria-label="Adjust filters"
              >
                <Sliders size={24} />
                <span className="button-label">Adjust</span>
              </button>
            ) : (
              <button 
                id="flip-camera-button" // Added ID for debugging
                onClick={flipCamera} 
                className="neocam-control-button neocam-flip-button" // Added specific class
                disabled={isLoading || !!error}
                aria-label="Switch camera"
              >
                <RefreshCw size={24} />
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
                grain: 0
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
      </div>
    </div>
  );
};

export default CameraApp;