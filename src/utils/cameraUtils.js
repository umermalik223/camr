// Modifications for cameraUtils.js to add ultrawide support

/**
 * Get the best available camera constraints for the device
 * @param {string} facingMode - 'user' for front camera, 'environment' for back camera
 * @param {number} zoomLevel - Current zoom level, can be < 1 for ultrawide
 * @returns {Object} - Camera constraints object
 */
export const getBestCameraConstraints = async (facingMode = 'user', zoomLevel = 1) => {
    try {
      // First try to detect if we have multiple cameras (like a wide-angle lens)
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // If a phone has multiple back cameras, we might be able to use the wide-angle one
        // when zoomLevel is < 1
        if (videoDevices.length > 1 && facingMode === 'environment' && zoomLevel < 1) {
          console.log("Multiple cameras detected, will try to use wide-angle if available");
          
          // We'll create two sets of constraints - one for the first try (possible wide lens)
          // and a fallback for the main lens with software zoom
          try {
            // First try - attempt to get the second camera (often wide-angle)
            // on Android, sometimes the 0 index is wide-angle and 1 is main
            // on iPhone, 0 is usually main and 1 might be wide
            // We'll try both approaches
            
            // Try the second camera first
            const wideConstraints = {
              video: {
                deviceId: { exact: videoDevices[1].deviceId },
                width: { ideal: 4096 },
                height: { ideal: 2160 }
              }
            };
            
            console.log("Trying possible wide-angle camera:", videoDevices[1].deviceId);
            return wideConstraints;
          } catch (err) {
            console.log("Could not use second camera, trying first camera:", videoDevices[0].deviceId);
            // If that fails, try the first camera
            const mainConstraints = {
              video: {
                deviceId: { exact: videoDevices[0].deviceId },
                width: { ideal: 4096 },
                height: { ideal: 2160 }
              }
            };
            return mainConstraints;
          }
        }
      }
      
      // Default constraints with advanced options if available
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 3840 }, // Try for 4K
          height: { ideal: 2160 },
          frameRate: { ideal: 60 }
        },
        audio: false // Only request audio in video mode
      };
      
      // If zoom is supported and we're not in ultrawide mode (zoom < 1),
      // apply the zoom constraint
      if (window.navigator.mediaDevices.getSupportedConstraints && 
          window.navigator.mediaDevices.getSupportedConstraints().zoom &&
          zoomLevel >= 1) {
        constraints.video.zoom = zoomLevel;
      }
      
      return constraints;
    } catch (err) {
      console.error("Error creating constraints:", err);
      return {
        video: { facingMode },
        audio: false
      };
    }
  };
  
  /**
   * Apply software-based wide-angle effect based on zoom level
   * @param {number} zoomLevel - Current zoom level (0.5 - 1.0 for wide-angle)
   * @returns {Object} - CSS style object for the video element
   */
  export const getUltrawideStyle = (zoomLevel) => {
    // Only apply ultrawide effect if zoom is less than 1
    if (zoomLevel >= 1) {
      return {
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center'
      };
    }
    
    // Calculate how "wide" we want to go - 0.5 is maximum wide-angle
    // Translate zoom level 0.5-1.0 to distortion strength 0.5-0
    const distortionStrength = Math.max(0, 0.5 - (zoomLevel - 0.5));
    
    // Calculate scale - we need to scale down as we add distortion to maintain framing
    const scaleValue = 1 + (0.5 * (1 - zoomLevel));
    
    return {
      transform: `scale(${scaleValue})`,
      transformOrigin: 'center',
      borderRadius: `${distortionStrength * 40}%`, // Creates a subtle distortion
      filter: `perspective(500px) ${distortionStrength > 0 ? `rotateY(0deg)` : ''}`,
      // Also add some subtle barrel distortion via background if needed
      '--distortion-strength': distortionStrength
    };
  };
  
  /**
   * Apply advanced wide-angle effect to canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLImageElement|HTMLCanvasElement} img - Source image
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} zoomLevel - Current zoom level (0.5 - 1.0 for wide-angle)
   */
  export const applyUltrawideEffect = (ctx, img, width, height, zoomLevel) => {
    // Only apply wide-angle effect if zoom is less than 1
    if (zoomLevel >= 1) {
      // Normal drawing without distortion
      ctx.drawImage(img, 0, 0, width, height);
      return;
    }
    
    // Calculate distortion strength based on zoom level
    // 0.5 zoom = maximum distortion, 1.0 zoom = no distortion
    const strength = Math.max(0, 0.8 * (1 - zoomLevel));
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Scale the image first to make it wider
    const scaleFactor = 1 + (0.5 * (1 - zoomLevel));
    
    // Save context state
    ctx.save();
    
    // Apply the barrel distortion by dividing the image into small chunks
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
          
          // Calculate source coordinates with scaling
          const srcX = (x - centerX) / scaleFactor + centerX;
          const srcY = (y - centerY) / scaleFactor + centerY;
          
          // Draw this chunk of the image with distortion
          ctx.drawImage(
            img,
            srcX, srcY, chunkSize / scaleFactor, chunkSize / scaleFactor, // Source rectangle
            newX, newY, chunkSize, chunkSize // Destination rectangle
          );
        } else {
          // For the center, just draw normally
          ctx.drawImage(
            img,
            (x - centerX) / scaleFactor + centerX, (y - centerY) / scaleFactor + centerY, 
            chunkSize / scaleFactor, chunkSize / scaleFactor,
            x, y, chunkSize, chunkSize
          );
        }
      }
    }
    
    // Restore the original state
    ctx.restore();
    
    // Add a subtle vignette effect (common in wide angle lenses)
    addVignetteEffect(ctx, width, height, 0.3 * strength);
  };
  
  // Helper function to add vignette effect
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