import { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, Sliders, Download, RefreshCw } from 'lucide-react';
import { 
  getBestCameraConstraints, 
  saveImage, 
  isCameraSupported,
  getBestImageType,
  getOptimalImageQuality
} from '../utils/cameraUtils';
import './CameraApp.css';

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
    sepia: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  // Start camera stream
  useEffect(() => {
    async function setupCamera() {
      try {
        setIsLoading(true);
        setError(null);
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Get the best constraints for this device
        const constraints = await getBestCameraConstraints(facing);
        
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        setCameraPermission(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            // Try to play the video as soon as metadata is loaded
            videoRef.current.play().catch(e => {
              console.error("Error playing video:", e);
              setError("Couldn't start video stream. Please reload and try again.");
            });
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setIsLoading(false);
        
        if (err.name === 'NotAllowedError') {
          setCameraPermission(false);
          setError("Camera access denied. Please allow camera access and reload the page.");
        } else if (err.name === 'NotFoundError') {
          setError(`Cannot find a ${facing === 'user' ? 'front' : 'back'} camera. Try switching cameras.`);
        } else {
          setError(`Error accessing camera: ${err.message}`);
        }
      }
    }
    
    setupCamera();
    
    return () => {
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
        
        // Apply filters
        ctx.filter = `
          brightness(${filters.brightness}%) 
          contrast(${filters.contrast}%) 
          saturate(${filters.saturation}%) 
          hue-rotate(${filters.hue}deg)
          blur(${filters.blur}px)
          sepia(${filters.sepia}%)
        `;
        
        // Draw the image without flipping
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = capturedImage;
    }
  }, [capturedImage, filters]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    // Create temporary canvas for capturing
    const tempCanvas = document.createElement('canvas');
    const video = videoRef.current;
    
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    
    const ctx = tempCanvas.getContext('2d');
    
    // Important: Don't flip the image horizontally
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Get image as data URL with best image type
    const imageType = getBestImageType();
    const imageQuality = getOptimalImageQuality();
    const imageDataUrl = tempCanvas.toDataURL(imageType, imageQuality);
    
    setCapturedImage(imageDataUrl);
  };

  const flipCamera = () => {
    setFacing(facing === 'user' ? 'environment' : 'user');
  };

  const resetImage = () => {
    setCapturedImage(null);
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      sepia: 0
    });
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    // Get the canvas data
    const imageType = getBestImageType();
    const imageQuality = getOptimalImageQuality();
    const dataUrl = canvasRef.current.toDataURL(imageType, imageQuality);
    
    // Generate a filename with date and time
    const filename = `camera-capture-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    
    // Save the image using our utility function
    saveImage(dataUrl, filename);
  };

  // Apply filter CSS to live preview
  const previewFilterStyle = {
    filter: `
      brightness(${filters.brightness}%) 
      contrast(${filters.contrast}%) 
      saturate(${filters.saturation}%) 
      hue-rotate(${filters.hue}deg)
      blur(${filters.blur}px)
      sepia(${filters.sepia}%)
    `
  };

  // Generate filter sliders
  const renderFilterSliders = () => {
    const filterConfig = [
      { name: 'brightness', min: 0, max: 200, step: 1, label: 'Brightness' },
      { name: 'contrast', min: 0, max: 200, step: 1, label: 'Contrast' },
      { name: 'saturation', min: 0, max: 200, step: 1, label: 'Saturation' },
      { name: 'hue', min: 0, max: 360, step: 1, label: 'Hue' },
      { name: 'blur', min: 0, max: 10, step: 0.1, label: 'Blur' },
      { name: 'sepia', min: 0, max: 100, step: 1, label: 'Sepia' }
    ];

    return filterConfig.map((filter) => (
      <div key={filter.name} className="filter-control">
        <div className="filter-label-container">
          <label className="filter-label">{filter.label}</label>
          <span className="filter-value">{filters[filter.name]}</span>
        </div>
        <input
          type="range"
          min={filter.min}
          max={filter.max}
          step={filter.step}
          value={filters[filter.name]}
          onChange={(e) => setFilters({...filters, [filter.name]: parseFloat(e.target.value)})}
          className="filter-slider"
        />
      </div>
    ));
  };

  // Camera permission request screen
  if (cameraPermission === false) {
    return (
      <div className="permission-screen">
        <div className="permission-content">
          <Camera size={48} />
          <h2>Camera Access Required</h2>
          <p>Please allow access to your camera to use this app.</p>
          <button 
            className="permission-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-container">
      {/* Camera View / Captured Image */}
      <div className="camera-view">
        {capturedImage ? (
          <canvas 
            ref={canvasRef} 
            className="captured-image"
          />
        ) : (
          <>
            {isLoading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>Starting camera...</p>
              </div>
            )}
            
            {error && (
              <div className="error-overlay">
                <p>{error}</p>
                <button 
                  className="retry-button"
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
              style={previewFilterStyle}
              className="camera-feed"
            />
          </>
        )}
      </div>

      {/* Controls */}
      <div className="camera-controls">
        <div className="controls-inner">
          {/* Main Controls */}
          <div className="main-controls">
            {capturedImage ? (
              <>
                <button 
                  onClick={resetImage} 
                  className="control-button reset-button"
                  aria-label="Retake photo"
                >
                  <RotateCcw size={24} />
                </button>
                <button 
                  onClick={downloadImage} 
                  className="control-button download-button"
                  aria-label="Save photo"
                >
                  <Download size={24} />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={flipCamera} 
                  className="control-button flip-button"
                  disabled={isLoading || !!error}
                  aria-label="Switch camera"
                >
                  <RefreshCw size={24} />
                </button>
                <button 
                  onClick={capturePhoto} 
                  className="control-button capture-button"
                  disabled={isLoading || !!error}
                  aria-label="Take photo"
                >
                  <Camera size={32} />
                </button>
              </>
            )}
          </div>
          
          {/* Filter Toggle Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`control-button filter-toggle ${showFilters ? 'active' : ''}`}
            aria-label="Toggle filters"
            aria-pressed={showFilters}
          >
            <Sliders size={20} />
          </button>
        </div>
      </div>

      {/* Filter Panel (Slide in from bottom) */}
      <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
        <div className="filter-panel-header">
          <h3>Adjust Filters</h3>
          <button 
            onClick={() => setFilters({
              brightness: 100,
              contrast: 100,
              saturation: 100,
              hue: 0,
              blur: 0,
              sepia: 0
            })}
            className="reset-filters-button"
          >
            Reset
          </button>
        </div>
        
        <div className="filter-controls">
          {renderFilterSliders()}
        </div>
      </div>
    </div>
  );
};

export default CameraApp;