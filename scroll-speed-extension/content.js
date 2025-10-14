let isEnabledOnSite = false;
let speedEnabled = true;
let scrollSpeed = 1.0;
let smoothScrolling = false;
let smoothDuration = 300;

let accumulatedScroll = 0;
let scrollTimeout = null;

// Get current site hostname
const currentHostname = new URL(window.location.href).hostname;

// Load initial settings
browser.storage.local.get(['enabledSites', 'speedEnabled', 'scrollSpeed', 'smoothScrolling', 'smoothDuration']).then((data) => {
  const enabledSites = data.enabledSites || [];
  isEnabledOnSite = enabledSites.includes(currentHostname);
  speedEnabled = data.speedEnabled !== undefined ? data.speedEnabled : true;
  scrollSpeed = data.scrollSpeed !== undefined ? data.scrollSpeed : 1.0;
  smoothScrolling = data.smoothScrolling !== undefined ? data.smoothScrolling : false;
  smoothDuration = data.smoothDuration !== undefined ? data.smoothDuration : 300;
  console.log('Loaded settings for', currentHostname, ':', { isEnabledOnSite, speedEnabled, scrollSpeed, smoothScrolling, smoothDuration });
});

// Listen for updates from popup
browser.runtime.onMessage.addListener((request) => {
  if (request.type === 'updateScrollSettings') {
    isEnabledOnSite = request.isEnabledOnSite;
    speedEnabled = request.speedEnabled;
    scrollSpeed = request.scrollSpeed;
    smoothScrolling = request.smoothScrolling;
    smoothDuration = request.smoothDuration;
    console.log('Updated settings for', currentHostname, ':', { isEnabledOnSite, speedEnabled, scrollSpeed, smoothScrolling, smoothDuration });
  }
});

// Smooth scroll function
function smoothScroll(distance, duration) {
  const startTime = performance.now();
  const startScroll = window.scrollY;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  function scroll(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeInOutCubic(progress);
    
    const newScroll = startScroll + distance * ease;
    window.scrollTo(0, newScroll);

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  }

  requestAnimationFrame(scroll);
}

// Intercept wheel events and accumulate scroll
document.addEventListener('wheel', (e) => {
  // Extension must be enabled on this site
  if (!isEnabledOnSite) return;
  
  // Determine the effective scroll speed
  const effectiveSpeed = speedEnabled ? scrollSpeed : 1.0;
  
  // If speed is 1.0 and smooth scrolling is off, use Firefox defaults
  if (effectiveSpeed === 1.0 && !smoothScrolling) return;

  e.preventDefault();
  
  // Calculate the scroll distance with the speed multiplier
  const distance = e.deltaY * effectiveSpeed;

  // Clear any pending scroll timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  // Accumulate the scroll distance
  accumulatedScroll += distance;

  // Set a timeout to execute the accumulated scroll
  // This waits for all wheel events in quick succession to be collected
  scrollTimeout = setTimeout(() => {
    console.log('Executing scroll:', { accumulatedScroll, smoothScrolling, smoothDuration });
    if (smoothScrolling && accumulatedScroll !== 0) {
      smoothScroll(accumulatedScroll, smoothDuration);
    } else if (accumulatedScroll !== 0) {
      window.scrollBy(0, accumulatedScroll);
    }
    accumulatedScroll = 0;
    scrollTimeout = null;
  }, 50); // 50ms window to accumulate scroll events

}, { passive: false });