(function() {
  const T = srT();
  function hostMatches(hostname, domains) {
    return domains.some(d => hostname === d || hostname.endsWith(`.${d}`));
  }
  function hasLargeVideo() {
    return Array.from(document.querySelectorAll("video")).some(v => {
      const r = v.getBoundingClientRect();
      return r.width >= 400 && r.height >= 200;
    });
  }
  async function buildWidget(siteName) {
    const host = document.createElement("div");
    host.id = "saverip-ext-root";
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;bottom:20px;right:0;";
    const shadow = host.attachShadow({
      mode: "closed"
    });
    const style = document.createElement("style");
    style.textContent = `\n      * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }\n      .shell { position:relative; display:flex; justify-content:flex-end; }\n      .card { background:#111; color:#fff; border-radius:12px; padding:26px 12px 12px; width:260px;\n        margin-right:20px; box-shadow:0 8px 24px rgba(0,0,0,.4); font-size:13px; line-height:1.4;\n        position:relative; transition:transform .3s cubic-bezier(.4,0,.2,1), opacity .25s ease; }\n      .shell.collapsed .card { transform:translateX(16px); opacity:0; pointer-events:none; }\n      .collapse-btn { position:absolute; top:6px; right:6px; width:18px; height:18px; padding:0;\n        border:none; border-radius:5px; background:transparent; color:#9a9a9a; cursor:pointer;\n        display:flex; align-items:center; justify-content:center; }\n      .collapse-btn:hover { background:#2a2a2a; color:#fff; }\n      .collapse-btn svg { width:11px; height:11px; }\n      .tab { position:absolute; top:50%; right:0; transform:translateY(-50%) translateX(100%);\n        width:28px; height:54px; border:none; border-radius:10px 0 0 10px; background:#fe3e02;\n        display:flex; align-items:center; justify-content:center; cursor:pointer;\n        box-shadow:-3px 2px 10px rgba(0,0,0,.35); opacity:0; pointer-events:none;\n        transition:transform .3s cubic-bezier(.4,0,.2,1), opacity .25s ease, background .2s; }\n      .tab:hover { background:#ff5a1f; }\n      .tab svg { width:14px; height:14px; }\n      .shell.collapsed .tab { transform:translateY(-50%) translateX(0); opacity:1; pointer-events:auto; }\n      .btn { display:block; width:100%; padding:10px 12px; border:none; border-radius:8px;\n        background:#fe3e02; color:#fff; font-weight:600; font-size:13px; cursor:pointer; }\n      .btn:disabled { opacity:.6; cursor:default; }\n      .btn-secondary { background:#2a2a2a; margin-top:8px; }\n      \n      .btn-gray { background:#2a2a2a; }\n      .row { margin-top:8px; }\n      input { width:100%; padding:8px; border-radius:6px; border:1px solid #333; background:#1a1a1a;\n        color:#fff; font-size:13px; margin-top:6px; }\n      .muted { color:#9a9a9a; font-size:11px; margin-top:6px; }\n      .bar-wrap { margin-top:8px; height:4px; border-radius:2px; background:#2a2a2a; overflow:hidden; }\n      .bar-fill { height:100%; width:0%; background:#fe3e02; transition:width .25s ease; }\n      .quality-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }\n      .chip { padding:6px 10px; border-radius:6px; background:#fe3e02; color:#fff; border:none;\n        font-size:12px; font-weight:600; cursor:pointer; }\n      .chip:hover { background:#ff5a1f; }\n      .chip.locked { opacity:.55; }\n      .chip .pro-tag { margin-left:4px; font-size:9px; font-weight:800; color:#111; }\n      .pro-card { margin-top:8px; border:1px solid #2e2e2e; border-radius:10px; padding:12px;\n        background:linear-gradient(160deg,#1c1c1c,#141414); }\n      .pro-badge { display:inline-block; background:#fe3e02; color:#fff; font-size:10px; font-weight:800;\n        padding:2px 7px; border-radius:4px; letter-spacing:.04em; }\n      .pro-price { margin-top:8px; display:flex; align-items:baseline; gap:4px; }\n      .pro-price .amount { font-size:24px; font-weight:800; color:#fff; line-height:1; }\n      .pro-price .period { font-size:12px; color:#9a9a9a; }\n      .benefits { list-style:none; margin:10px 0 0; padding:0; font-size:12px; color:#ddd; }\n      .benefits li { margin-top:6px; padding-left:20px; position:relative; }\n      .benefits li::before { content:'✓'; position:absolute; left:0; color:#fe3e02; font-weight:700; }\n      \n      .hidden { display:none; }\n    `;
    shadow.appendChild(style);
    const shell = document.createElement("div");
    shell.className = "shell";
    shadow.appendChild(shell);
    const card = document.createElement("div");
    card.className = "card";
    shell.appendChild(card);
    const WIDGET_COLLAPSED_KEY = SR_CONFIG.STORAGE_KEYS.WIDGET_COLLAPSED;
    async function setCollapsed(value) {
      shell.classList.toggle("collapsed", value);
      await chrome.storage.local.set({
        [WIDGET_COLLAPSED_KEY]: value
      });
    }
    const collapseBtn = document.createElement("button");
    collapseBtn.className = "collapse-btn";
    collapseBtn.type = "button";
    collapseBtn.setAttribute("aria-label", "Hide");
    collapseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    collapseBtn.addEventListener("click", () => setCollapsed(true));
    card.appendChild(collapseBtn);
    const tab = document.createElement("button");
    tab.className = "tab";
    tab.type = "button";
    tab.setAttribute("aria-label", `${T.downloadBtn} · ${siteName}`);
    tab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>';
    tab.addEventListener("click", () => setCollapsed(false));
    shell.appendChild(tab);
    const collapsedStore = await chrome.storage.local.get(WIDGET_COLLAPSED_KEY);
    if (collapsedStore[WIDGET_COLLAPSED_KEY]) shell.classList.add("collapsed");
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "btn";
    downloadBtn.textContent = `${T.downloadBtn} · ${siteName}`;
    card.appendChild(downloadBtn);
    const status = document.createElement("div");
    status.className = "muted hidden";
    card.appendChild(status);
    const barWrap = document.createElement("div");
    barWrap.className = "bar-wrap hidden";
    const barFill = document.createElement("div");
    barFill.className = "bar-fill";
    barWrap.appendChild(barFill);
    card.appendChild(barWrap);
    const upgradePanel = document.createElement("div");
    upgradePanel.className = "hidden";
    card.appendChild(upgradePanel);
    const qualityRow = document.createElement("div");
    qualityRow.className = "quality-row hidden";
    card.appendChild(qualityRow);
    let stripeEnabled = false;
    let monthlyPrice = null;
    srSendMessage({
      type: "SR_GET_PAYMENT_METHODS"
    }).then(res => {
      stripeEnabled = !!(res && res.stripeEnabled);
      monthlyPrice = res && typeof res.monthlyPrice === "number" ? res.monthlyPrice : null;
    });
    function showUpgradePanel({withBenefits: withBenefits = false, source: source = "extension-inline"} = {}) {
      upgradePanel.classList.remove("hidden");
      upgradePanel.replaceChildren();
      if (withBenefits) {
        const proCard = document.createElement("div");
        proCard.className = "pro-card";
        const badge = document.createElement("span");
        badge.className = "pro-badge";
        badge.textContent = T.proTag;
        proCard.appendChild(badge);
        if (monthlyPrice != null) {
          const priceRow = document.createElement("div");
          priceRow.className = "pro-price";
          const amount = document.createElement("span");
          amount.className = "amount";
          amount.textContent = `$${monthlyPrice.toFixed(2)}`;
          const period = document.createElement("span");
          period.className = "period";
          period.textContent = T.perMonth;
          priceRow.appendChild(amount);
          priceRow.appendChild(period);
          proCard.appendChild(priceRow);
        }
        const list = document.createElement("ul");
        list.className = "benefits";
        T.proBenefits.forEach(b => {
          const li = document.createElement("li");
          li.textContent = b;
          list.appendChild(li);
        });
        proCard.appendChild(list);
        upgradePanel.appendChild(proCard);
      }
      const upgradeBtn = document.createElement("button");
      upgradeBtn.className = "btn btn-secondary row";
      upgradeBtn.textContent = T.upgradeBtn;
      upgradePanel.appendChild(upgradeBtn);
      const form = document.createElement("div");
      form.className = "row hidden";
      const emailInput = document.createElement("input");
      emailInput.type = "email";
      emailInput.placeholder = T.emailPlaceholder;
      form.appendChild(emailInput);
      let payCardBtn = null;
      if (stripeEnabled) {
        payCardBtn = document.createElement("button");
        payCardBtn.className = "btn row";
        payCardBtn.textContent = T.payCard;
        form.appendChild(payCardBtn);
      }
      const payCryptoBtn = document.createElement("button");
      payCryptoBtn.className = stripeEnabled ? "btn btn-secondary row" : "btn row";
      payCryptoBtn.textContent = T.payCrypto;
      form.appendChild(payCryptoBtn);
      upgradePanel.appendChild(form);
      upgradeBtn.addEventListener("click", () => {
        form.classList.toggle("hidden");
        srSendMessage({
          type: "SR_TRACK",
          name: "upgrade-modal-opened",
          data: {
            source: source
          }
        });
      });
      async function pay(method, btn) {
        const email = emailInput.value.trim();
        if (!email) {
          emailInput.focus();
          return;
        }
        btn.disabled = true;
        const res = await srSendMessage({
          type: "SR_CHECKOUT",
          email: email,
          plan: "monthly",
          method: method
        });
        btn.disabled = false;
        if (!res.ok) status.textContent = res.error === "context_invalidated" ? T.needsRefresh : T.genericError;
      }
      if (payCardBtn) payCardBtn.addEventListener("click", () => pay("card", payCardBtn));
      payCryptoBtn.addEventListener("click", () => pay("crypto", payCryptoBtn));
    }
    function renderQuotaHit(quota) {
      status.classList.remove("hidden");
      const type = quota && quota.type || "downloads";
      let timeStr = "";
      if (quota && quota.resetsAt) {
        const mins = Math.max(1, Math.ceil((new Date(quota.resetsAt) - Date.now()) / 6e4));
        timeStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
      }
      status.textContent = `${T.quotaTitle(type)} — ${T.quotaSub(timeStr)}`;
      showUpgradePanel({
        withBenefits: true,
        source: "extension-quota-hit"
      });
    }
    async function pollHlsProgress(progressId, filename) {
      const maxAttempts = 90;
      for (let i = 0; i < maxAttempts; i++) {
        if (!host.isConnected) return;
        const data = await srSendMessage({
          type: "SR_GET_DOWNLOAD_PROGRESS",
          progressId: progressId
        });
        if (!data || !data.ok) {
          status.classList.remove("hidden");
          status.textContent = data && data.error === "context_invalidated" ? T.needsRefresh : T.genericError;
          return;
        }
        const percent = Math.max(0, Math.min(100, data.percent || 0));
        barFill.style.width = `${percent}%`;
        downloadBtn.textContent = `${T.phases[data.phase] || T.resolving} ${percent}%`;
        if (data.done) {
          qualityRow.classList.add("hidden");
          if (data.error) {
            status.classList.remove("hidden");
            status.textContent = T.genericError;
          } else {
            barFill.style.width = "100%";
            downloadBtn.textContent = T.phases.done;
            srSendMessage({
              type: "SR_FETCH_HLS_FILE",
              progressId: progressId,
              filename: filename
            });
            setTimeout(() => {
              if (host.isConnected) barWrap.classList.add("hidden");
            }, 1200);
          }
          return;
        }
        await new Promise(r => setTimeout(r, 800));
      }
      status.classList.remove("hidden");
      status.textContent = T.genericError;
    }
    async function startHlsDownload(videoUrl, res, filename) {
      qualityRow.classList.add("hidden");
      status.classList.add("hidden");
      upgradePanel.classList.add("hidden");
      downloadBtn.disabled = true;
      downloadBtn.classList.remove("btn-gray");
      downloadBtn.textContent = T.resolving;
      barFill.style.width = "0%";
      const confirm = await srSendMessage({
        type: "SR_CONFIRM_HLS_DOWNLOAD",
        videoUrl: videoUrl,
        res: res,
        filename: filename
      });
      if (!confirm || !confirm.ok) {
        status.classList.remove("hidden");
        status.textContent = confirm && confirm.error === "context_invalidated" ? T.needsRefresh : T.genericError;
        downloadBtn.disabled = false;
        downloadBtn.textContent = `${T.downloadBtn} · ${siteName}`;
        return;
      }
      barWrap.classList.remove("hidden");
      await pollHlsProgress(confirm.progressId, filename);
      downloadBtn.disabled = false;
      downloadBtn.textContent = `${T.downloadBtn} · ${siteName}`;
    }
    function renderQualityPicker(videoUrl, resolutions, freeCap, filename) {
      qualityRow.replaceChildren();
      upgradePanel.classList.add("hidden");
      status.classList.add("hidden");
      resolutions.forEach(res => {
        const locked = freeCap != null && res > freeCap;
        const chip = document.createElement("button");
        chip.className = `chip${locked ? " locked" : ""}`;
        chip.type = "button";
        chip.append(`${res}p`);
        if (locked) {
          const proTag = document.createElement("span");
          proTag.className = "pro-tag";
          proTag.textContent = T.proTag;
          chip.appendChild(proTag);
        }
        chip.addEventListener("click", () => {
          if (locked) {
            srSendMessage({
              type: "SR_TRACK",
              name: "pro-upsell-chip-clicked",
              data: {
                res: res,
                source: "extension"
              }
            });
            status.textContent = T.resolutionLocked;
            showUpgradePanel({
              withBenefits: true,
              source: "extension-resolution-lock"
            });
            return;
          }
          startHlsDownload(videoUrl, res, filename);
        });
        qualityRow.appendChild(chip);
      });
      qualityRow.classList.remove("hidden");
    }
    downloadBtn.addEventListener("click", async () => {
      downloadBtn.disabled = true;
      downloadBtn.classList.remove("btn-gray");
      downloadBtn.textContent = T.resolving;
      status.classList.add("hidden");
      upgradePanel.classList.add("hidden");
      qualityRow.classList.add("hidden");
      barWrap.classList.add("hidden");
      barFill.style.width = "0%";
      const res = await srSendMessage({
        type: "SR_DOWNLOAD",
        url: location.href
      });
      if (res.error === "context_invalidated") {
        downloadBtn.disabled = false;
        downloadBtn.textContent = `${T.downloadBtn} · ${siteName}`;
        status.classList.remove("hidden");
        status.textContent = T.needsRefresh;
        return;
      }
      if (res.ok && res.hls && res.needsQuality) {
        downloadBtn.disabled = true;
        downloadBtn.classList.add("btn-gray");
        downloadBtn.textContent = T.chooseQuality;
        renderQualityPicker(res.data.videoUrl, res.resolutions, res.freeCap, res.filename);
        return;
      }
      if (res.ok && res.hls && res.progressId) {
        if (res.quota) {
          status.classList.remove("hidden");
          status.textContent = `${res.quota.remaining} ${res.quota.type} left`;
        }
        barWrap.classList.remove("hidden");
        await pollHlsProgress(res.progressId, res.filename);
        downloadBtn.disabled = false;
        downloadBtn.classList.remove("btn-gray");
        downloadBtn.textContent = `${T.downloadBtn} · ${siteName}`;
        return;
      }
      downloadBtn.disabled = false;
      downloadBtn.classList.remove("btn-gray");
      downloadBtn.textContent = `${T.downloadBtn} · ${siteName}`;
      if (res.ok && res.gallery) {
        status.classList.remove("hidden");
        status.textContent = res.quota ? `${T.galleryZip} · ${res.quota.remaining} ${res.quota.type} left` : T.galleryZip;
        return;
      }
      if (res.ok) {
        if (res.quota) {
          status.classList.remove("hidden");
          status.textContent = `${res.quota.remaining} ${res.quota.type} left`;
        }
        return;
      }
      if (res.status === 429) {
        renderQuotaHit(res.quota);
        return;
      }
      if (res.error === "zip_requires_pro") {
        status.classList.remove("hidden");
        status.textContent = T.zipRequiresPro;
        return;
      }
      status.classList.remove("hidden");
      status.textContent = res.status === 404 ? T.notFound : T.genericError;
    });
    document.documentElement.appendChild(host);
  }
  async function init() {
    const existing = document.getElementById("saverip-ext-root");
    if (existing) existing.remove();
    const sites = await srSendMessage({
      type: "SR_GET_SITES"
    });
    if (!Array.isArray(sites) || sites.length === 0) {
      console.warn("[SaveRip] no sites returned — background fetch to /api/meta/sites likely failed");
      return;
    }
    const hostname = location.hostname.toLowerCase();
    const site = sites.find(s => hostMatches(hostname, s.domains));
    if (!site) return;
    const hasVideo = hasLargeVideo();
    const videoPathMatches = /\/(video|watch)s?\//i.test(location.pathname);
    const galleryPathMatches = !!site.supportsGallery && /\/(photos?|gallery|album)s?\//i.test(location.pathname);
    let sitePatternMatches = false;
    if (site.urlPattern) {
      try {
        sitePatternMatches = new RegExp(site.urlPattern, "i").test(location.pathname);
      } catch (err) {
        console.error("[SaveRip] invalid urlPattern for site", site.key, err);
      }
    }
    const pathMatches = videoPathMatches || galleryPathMatches || sitePatternMatches;
    if (!hasVideo && !pathMatches) {
      return;
    }
    buildWidget(site.name);
  }
  init();
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      init();
    }
  }, 800);
})();