(async function() {
  const loadingEl = document.getElementById("loading");
  const loggedOutEl = document.getElementById("logged-out");
  const loggedInEl = document.getElementById("logged-in");
  const quotaBox = document.getElementById("quota-box");
  const quotaText = document.getElementById("quota-text");
  const planBox = document.getElementById("plan-box");
  const planRenews = document.getElementById("plan-renews");
  const planMethod = document.getElementById("plan-method");
  const btnManageBilling = document.getElementById("btn-manage-billing");
  const downloadsBox = document.getElementById("downloads-box");
  const downloadsList = document.getElementById("downloads-list");
  const updateBanner = document.getElementById("update-banner");
  const updateLink = document.getElementById("update-link");
  async function renderUpdateBanner() {
    const info = await chrome.runtime.sendMessage({
      type: "SR_GET_EXTENSION_UPDATE"
    });
    if (!info || !info.updateAvailable || !info.updateUrl) return;
    updateLink.href = info.updateUrl;
    updateBanner.classList.remove("hidden");
  }
  const qualityBox = document.getElementById("quality-box");
  const qualitySelect = document.getElementById("quality-select");
  async function pollPopupProgress(progressId, filename, barFill, percentEl, item) {
    for (let i = 0; i < 90; i++) {
      const data = await chrome.runtime.sendMessage({
        type: "SR_GET_DOWNLOAD_PROGRESS",
        progressId: progressId
      });
      if (!data || !data.ok) {
        item.remove();
        break;
      }
      const percent = Math.max(0, Math.min(100, data.percent || 0));
      barFill.style.width = `${percent}%`;
      percentEl.textContent = `${percent}%`;
      if (data.done) {
        if (!data.error) await chrome.runtime.sendMessage({
          type: "SR_FETCH_HLS_FILE",
          progressId: progressId,
          filename: filename
        });
        item.remove();
        break;
      }
      await new Promise(r => setTimeout(r, 800));
    }
    if (!downloadsList.children.length) downloadsBox.classList.add("hidden");
  }
  async function renderActiveDownloads() {
    const key = SR_CONFIG.STORAGE_KEYS.PENDING_HLS;
    const store = await chrome.storage.local.get(key);
    const pending = store[key] || {};
    const ids = Object.keys(pending);
    if (ids.length === 0) return;
    downloadsBox.classList.remove("hidden");
    ids.forEach(progressId => {
      const entry = pending[progressId];
      const item = document.createElement("div");
      item.className = "dl-item";
      const head = document.createElement("div");
      head.className = "dl-item-head";
      const name = document.createElement("div");
      name.className = "dl-name";
      name.textContent = entry.filename || "Download";
      const percentEl = document.createElement("div");
      percentEl.className = "dl-percent";
      percentEl.textContent = "0%";
      head.appendChild(name);
      head.appendChild(percentEl);
      item.appendChild(head);
      const barWrap = document.createElement("div");
      barWrap.className = "bar-wrap";
      const barFill = document.createElement("div");
      barFill.className = "bar-fill";
      barWrap.appendChild(barFill);
      item.appendChild(barWrap);
      downloadsList.appendChild(item);
      pollPopupProgress(progressId, entry.filename, barFill, percentEl, item);
    });
  }
  const QUALITY_OPTIONS = [ {
    value: "",
    label: "Ask me every time"
  }, {
    value: "best",
    label: "Best available"
  }, {
    value: "2160",
    label: "2160p (4K)"
  }, {
    value: "1440",
    label: "1440p (2K)"
  }, {
    value: "1080",
    label: "1080p"
  }, {
    value: "720",
    label: "720p"
  }, {
    value: "480",
    label: "480p"
  } ];
  async function renderQualityPreference(isPremium, freeCap) {
    const key = SR_CONFIG.STORAGE_KEYS.PREFERRED_RES;
    const store = await chrome.storage.local.get(key);
    const stored = store[key];
    const currentValue = stored === undefined ? "" : String(stored);
    qualitySelect.replaceChildren();
    QUALITY_OPTIONS.forEach(({value: value, label: label}) => {
      const numeric = value !== "" && value !== "best" ? parseInt(value, 10) : null;
      const locked = !isPremium && numeric != null && numeric > freeCap;
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = locked ? `${label} — PRO` : label;
      opt.disabled = locked;
      if (value === currentValue) opt.selected = true;
      qualitySelect.appendChild(opt);
    });
    qualitySelect.addEventListener("change", async () => {
      const raw = qualitySelect.value;
      if (raw === "") await chrome.storage.local.remove(key); else if (raw === "best") await chrome.storage.local.set({
        [key]: "best"
      }); else await chrome.storage.local.set({
        [key]: parseInt(raw, 10)
      });
    });
    qualityBox.classList.remove("hidden");
  }
  function formatTimeLeft(resetsAt) {
    const mins = Math.max(1, Math.ceil((new Date(resetsAt) - Date.now()) / 6e4));
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  }
  function renderPlanDetails(user) {
    planBox.classList.remove("hidden");
    const isCard = !!user.stripeCustomerId;
    const until = user.premiumUntil ? new Date(user.premiumUntil).toLocaleDateString() : null;
    planRenews.textContent = until ? isCard ? `Renews ${until}` : `Active until ${until}` : "";
    planMethod.textContent = `Payment method: ${isCard ? "Card" : "Crypto"}`;
    if (isCard) {
      btnManageBilling.classList.remove("hidden");
      btnManageBilling.addEventListener("click", async () => {
        btnManageBilling.disabled = true;
        btnManageBilling.textContent = "Opening…";
        const res = await chrome.runtime.sendMessage({
          type: "SR_OPEN_BILLING_PORTAL"
        });
        btnManageBilling.disabled = false;
        btnManageBilling.textContent = "Manage Subscription";
        if (!res.ok) {
          const genericErrors = {
            network_error: "Network error — try again.",
            portal_failed: "Could not open the billing portal. Try again."
          };
          planMethod.textContent = genericErrors[res.error] || res.error || "Could not open the billing portal. Try again.";
        }
      });
    }
  }
  async function renderQuotaStatus() {
    const quota = await chrome.runtime.sendMessage({
      type: "SR_GET_QUOTA_STATUS"
    });
    if (!quota || !quota.ok) return 720;
    quotaBox.classList.remove("hidden");
    if (quota.limit <= 0) {
      quotaText.textContent = "Unlimited downloads";
      return quota.freeCap || 720;
    }
    const remaining = Math.max(0, quota.limit - quota.used);
    let text = `${remaining} of ${quota.limit} downloads left`;
    if (quota.resetsAt) text += ` · resets in ${formatTimeLeft(quota.resetsAt)}`;
    quotaText.textContent = text;
    return quota.freeCap || 720;
  }
  renderActiveDownloads();
  renderUpdateBanner();
  const account = await chrome.runtime.sendMessage({
    type: "SR_GET_ACCOUNT"
  });
  loadingEl.classList.add("hidden");
  const isPremium = account.loggedIn && account.user.isPremium;
  let freeCap = 720;
  if (isPremium) {
    renderPlanDetails(account.user);
  } else {
    freeCap = await renderQuotaStatus();
  }
  renderQualityPreference(isPremium, freeCap);
  if (!account.loggedIn) {
    loggedOutEl.classList.remove("hidden");
    document.getElementById("btn-login").addEventListener("click", () => {
      chrome.tabs.create({
        url: `${SR_CONFIG.API_BASE}/login/`
      });
    });
    return;
  }
  loggedInEl.classList.remove("hidden");
  document.getElementById("email").textContent = account.user.email;
  const badge = document.getElementById("plan-badge");
  badge.textContent = account.user.isPremium ? "PRO" : "FREE";
  if (account.user.isPremium) badge.classList.add("pro");
  document.getElementById("btn-pricing").addEventListener("click", () => {
    chrome.tabs.create({
      url: `${SR_CONFIG.API_BASE}/pricing/`
    });
  });
  document.getElementById("btn-logout").addEventListener("click", async () => {
    await chrome.runtime.sendMessage({
      type: "SR_LOGOUT"
    });
    window.location.reload();
  });
})();