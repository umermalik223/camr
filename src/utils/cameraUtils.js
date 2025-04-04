/**
 * Get the best available camera constraints for the device
 * @param {string} facingMode - 'user' for front camera, 'environment' for back camera
 * @returns {Object} - Camera constraints object
 */
export const getBestCameraConstraints = async (facingMode = 'user') => {
    try {
      // First check if we can get device info (requires HTTPS in modern browsers)
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // If we have access to multiple cameras
        if (videoDevices.length > 1) {
          // Try to get the best camera based on facing mode
          return {
            video: {
              facingMode: facingMode,
              width: { ideal: 4096 },  // Try to get the highest resolution possible
              height: { ideal: 2160 }, // Equivalent to 4K UHD
              frameRate: { ideal: 60, min: 30 }, // Aim for 60fps, accept minimum 30fps
              focusMode: 'continuous',
              exposureMode: 'continuous',
              whiteBalanceMode: 'continuous'
            }
          };
        }
      }
      
      // Fallback to basic constraints if device enumeration fails
      return {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 }, // Full HD
          height: { ideal: 1080 }
        }
      };
    } catch (error) {
      console.error("Error getting camera constraints:", error);
      
      // Return minimal constraints as a last resort
      return {
        video: { 
          facingMode: facingMode 
        }
      };
    }
  };
  
  /**
   * Save an image to the device
   * @param {string} dataUrl - The data URL of the image
   * @param {string} filename - Desired filename
   */
  export const saveImage = (dataUrl, filename = 'camera-capture.png') => {
    // For mobile devices, we need a different approach than desktop
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Try using the download attribute (works on some mobile browsers)
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // For iOS Safari which doesn't support download attribute well
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Open in new tab (user can long-press to save)
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`<img src="${dataUrl}" alt="Captured photo" style="max-width:100%; max-height:100%;">`);
          newTab.document.title = 'Save your photo';
          newTab.document.close();
        }
      }
    } else {
      // Desktop approach
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
    }
  };
  
  /**
   * Check if the browser supports the camera API
   * @returns {boolean} - Whether the camera is supported
   */
  export const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };
  
  /**
   * Get the optimal MIME type for image saving
   * @returns {string} - The best MIME type ('image/png' or 'image/jpeg')
   */
  export const getBestImageType = () => {
    // PNG is lossless but larger, JPEG is smaller but lossy
    // Default to PNG for best quality
    return 'image/png';
  };
  
  /**
   * Gets the optimal image quality for saving
   * @returns {number} - Quality value between 0 and 1
   */
  export const getOptimalImageQuality = () => {
    // Return 1 for PNG (lossless), or 0.92 for JPEG (high quality but smaller)
    return 1;
  };