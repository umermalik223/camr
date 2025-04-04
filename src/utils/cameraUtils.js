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
  export const saveImage = (dataUrl, filename = 'neocam-capture.png') => {
    // For mobile devices, we need a different approach than desktop
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Create a visible link for mobile devices to see and interact with
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
      downloadDiv.style.fontFamily = 'sans-serif';
      
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.innerText = 'Close';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '20px';
      closeButton.style.right = '20px';
      closeButton.style.padding = '8px 16px';
      closeButton.style.backgroundColor = '#333';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => document.body.removeChild(downloadDiv);
      
      // Create image
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.maxWidth = '90%';
      img.style.maxHeight = '70%';
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
      img.style.marginBottom = '20px';
      
      // Create save instructions
      const instructions = document.createElement('p');
      instructions.innerText = 'Press and hold the image to save';
      instructions.style.color = 'white';
      instructions.style.margin = '16px';
      instructions.style.textAlign = 'center';
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.style.padding = '12px 24px';
      link.style.backgroundColor = '#FF3CAC';
      link.style.color = 'white';
      link.style.textDecoration = 'none';
      link.style.borderRadius = '24px';
      link.style.fontWeight = 'bold';
      link.style.display = 'inline-block';
      link.style.margin = '8px 0';
      link.innerText = 'Download Image';
      
      // Assemble the download div
      downloadDiv.appendChild(closeButton);
      downloadDiv.appendChild(img);
      downloadDiv.appendChild(instructions);
      downloadDiv.appendChild(link);
      
      // Add to body
      document.body.appendChild(downloadDiv);
      
      // For iOS Safari which doesn't support download attribute well
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        instructions.innerText = 'Press and hold the image, then tap "Save to Photos"';
      }
    } else {
      // Desktop approach - simple download
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