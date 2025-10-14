document.addEventListener('DOMContentLoaded', async () => {
  const slider = document.getElementById('speedSlider');
  const speedValue = document.getElementById('speedValue');
  const speedCheckbox = document.getElementById('speedCheckbox');
  const speedControls = document.getElementById('speedControls');
  const smoothCheckbox = document.getElementById('smoothCheckbox');
  const smoothSlider = document.getElementById('smoothSlider');
  const smoothValue = document.getElementById('smoothValue');
  const smoothControls = document.getElementById('smoothControls');
  const resetBtn = document.getElementById('resetBtn');
  const enableSiteBtn = document.getElementById('enableSiteBtn');
  const disableSiteBtn = document.getElementById('disableSiteBtn');
  const siteStatus = document.getElementById('siteStatus');

  let currentUrl = '';
  let isEnabledOnSite = false;

  // Get current tab URL
  const tab = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab && tab[0]) {
    const url = new URL(tab[0].url);
    currentUrl = url.hostname;
  }

  // Load saved settings from storage
  const data = await browser.storage.local.get(['enabledSites', 'speedEnabled', 'scrollSpeed', 'smoothScrolling', 'smoothDuration']);
  const enabledSites = data.enabledSites || [];
  const speedEnabled = data.speedEnabled !== undefined ? data.speedEnabled : true;
  const speed = data.scrollSpeed !== undefined ? data.scrollSpeed : 1.0;
  const smoothEnabled = data.smoothScrolling !== undefined ? data.smoothScrolling : false;
  const duration = data.smoothDuration !== undefined ? data.smoothDuration : 300;

  isEnabledOnSite = enabledSites.includes(currentUrl);

  speedCheckbox.checked = speedEnabled;
  slider.value = speed;
  speedValue.textContent = parseFloat(speed).toFixed(1) + 'x';
  smoothCheckbox.checked = smoothEnabled;
  smoothSlider.value = duration;
  smoothValue.textContent = duration + 'ms';

  updateSiteStatus();
  updateControlsState();

  // Enable site button
  enableSiteBtn.addEventListener('click', async () => {
    if (!isEnabledOnSite && currentUrl) {
      enabledSites.push(currentUrl);
      await browser.storage.local.set({ enabledSites });
      isEnabledOnSite = true;
      updateSiteStatus();
      notifyCurrentTab();
    }
  });

  // Disable site button
  disableSiteBtn.addEventListener('click', async () => {
    if (isEnabledOnSite && currentUrl) {
      const index = enabledSites.indexOf(currentUrl);
      if (index > -1) {
        enabledSites.splice(index, 1);
      }
      await browser.storage.local.set({ enabledSites });
      isEnabledOnSite = false;
      updateSiteStatus();
      notifyCurrentTab();
    }
  });

  // Speed slider change
  slider.addEventListener('input', async (e) => {
    const newSpeed = parseFloat(e.target.value);
    speedValue.textContent = newSpeed.toFixed(1) + 'x';
    
    await browser.storage.local.set({ scrollSpeed: newSpeed });
    notifyCurrentTab();
  });

  // Speed checkbox change
  speedCheckbox.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await browser.storage.local.set({ speedEnabled: enabled });
    updateControlsState();
    notifyCurrentTab();
  });

  // Smooth scrolling checkbox change
  smoothCheckbox.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await browser.storage.local.set({ smoothScrolling: enabled });
    updateSmoothControlsState();
    notifyCurrentTab();
  });

  // Smooth duration slider change
  smoothSlider.addEventListener('input', async (e) => {
    const newDuration = parseInt(e.target.value);
    smoothValue.textContent = newDuration + 'ms';
    
    await browser.storage.local.set({ smoothDuration: newDuration });
    notifyCurrentTab();
  });

  // Reset to default
  resetBtn.addEventListener('click', async () => {
    slider.value = 1.0;
    speedValue.textContent = '1.0x';
    speedCheckbox.checked = true;
    smoothCheckbox.checked = false;
    smoothSlider.value = 300;
    smoothValue.textContent = '300ms';
    
    await browser.storage.local.set({ 
      speedEnabled: true,
      scrollSpeed: 1.0,
      smoothScrolling: false,
      smoothDuration: 300
    });
    
    updateControlsState();
    notifyCurrentTab();
  });

  function updateSiteStatus() {
    if (isEnabledOnSite) {
      siteStatus.textContent = 'Extension Enabled';
      siteStatus.style.background = '#e8f5e9';
      siteStatus.style.color = '#2e7d32';
    } else {
      siteStatus.textContent = 'Extension Disabled';
      siteStatus.style.background = '#ffebee';
      siteStatus.style.color = '#c62828';
    }
  }

  function updateControlsState() {
    if (speedCheckbox.checked) {
      speedControls.classList.remove('disabled');
    } else {
      speedControls.classList.add('disabled');
    }
    updateSmoothControlsState();
  }

  function updateSmoothControlsState() {
    if (smoothCheckbox.checked) {
      smoothControls.classList.remove('disabled');
    } else {
      smoothControls.classList.add('disabled');
    }
  }

  async function notifyCurrentTab() {
    const tab = await browser.tabs.query({ active: true, currentWindow: true });
    const data = await browser.storage.local.get(['enabledSites', 'speedEnabled', 'scrollSpeed', 'smoothScrolling', 'smoothDuration']);
    console.log('Notifying current tab with data:', data);
    if (tab && tab[0]) {
      browser.tabs.sendMessage(tab[0].id, { 
        type: 'updateScrollSettings',
        isEnabledOnSite: (data.enabledSites || []).includes(currentUrl),
        speedEnabled: data.speedEnabled !== undefined ? data.speedEnabled : true,
        scrollSpeed: data.scrollSpeed || 1.0,
        smoothScrolling: data.smoothScrolling || false,
        smoothDuration: data.smoothDuration || 300
      }).catch(() => {});
    }
  }
});