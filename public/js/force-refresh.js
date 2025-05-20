// This script forces a complete cache refresh
;(() => {
    // Function to clear all browser caches
    function clearAllCaches() {
      // Clear localStorage
      try {
        localStorage.clear()
        console.log("localStorage cleared")
      } catch (e) {
        console.error("Failed to clear localStorage:", e)
      }
  
      // Clear sessionStorage
      try {
        sessionStorage.clear()
        console.log("sessionStorage cleared")
      } catch (e) {
        console.error("Failed to clear sessionStorage:", e)
      }
  
      // Clear application cache (deprecated but might still be used)
      if (window.applicationCache) {
        try {
          window.applicationCache.swapCache()
          console.log("Application cache swapped")
        } catch (e) {
          console.error("Failed to swap application cache:", e)
        }
      }
  
      // Clear service worker caches
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name)
            console.log("Cache deleted:", name)
          }
        })
      }
  
      // Unregister service workers
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister()
            console.log("ServiceWorker unregistered")
          }
        })
      }
  
      console.log("All caches cleared at", new Date().toLocaleTimeString())
    }
  
    // Clear caches immediately
    clearAllCaches()
  
    // Register a new service worker that prevents caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/cache-clearer-sw.js")
        .then((registration) => {
          console.log("Cache clearer service worker registered:", registration.scope)
        })
        .catch((error) => {
          console.log("Service worker registration failed:", error)
        })
    }
  
    // Add timestamp to all resource requests
    const originalFetch = window.fetch
    window.fetch = (url, options) => {
      if (typeof url === "string") {
        url = url + (url.includes("?") ? "&" : "?") + "_t=" + Date.now()
      }
      return originalFetch(url, options)
    }
  
    // Add timestamp to all XHR requests
    const originalOpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      if (typeof url === "string") {
        url = url + (url.includes("?") ? "&" : "?") + "_t=" + Date.now()
      }
      return originalOpen.call(this, method, url, ...rest)
    }
  
    // Force reload on page load if not already a reload
    if (window.performance && window.performance.navigation) {
      if (window.performance.navigation.type !== 1) {
        // Not a reload
        window.addEventListener("load", () => {
          setTimeout(() => {
            const currentLocation = window.location.href
            const cacheBuster = Date.now()
            const separator = currentLocation.indexOf("?") !== -1 ? "&" : "?"
            window.location.href = currentLocation + separator + "_cb=" + cacheBuster
          }, 100)
        })
      }
    }
  })()
  