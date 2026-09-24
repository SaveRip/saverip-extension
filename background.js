if (typeof importScripts === "function") {
  importScripts("shared/config.js");
}

const KEYS = SR_CONFIG.STORAGE_KEYS;

async function getTokens() {
  const store = await chrome.storage.local.get([ KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN ]);
  return {
    accessToken: store[KEYS.ACCESS_TOKEN] || null,
    refreshToken: store[KEYS.REFRESH_TOKEN] || null
  };
}

async function getDeviceId() {
  const store = await chrome.storage.local.get(KEYS.DEVICE_ID);
  if (store[KEYS.DEVICE_ID]) return store[KEYS.DEVICE_ID];
  const id = crypto.randomUUID();
  await chrome.storage.local.set({
    [KEYS.DEVICE_ID]: id
  });
  return id;
}

async function setTokens(accessToken, refreshToken) {
  await chrome.storage.local.set({
    [KEYS.ACCESS_TOKEN]: accessToken,
    [KEYS.REFRESH_TOKEN]: refreshToken
  });
}

async function clearTokens() {
  await chrome.storage.local.remove([ KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN ]);
}

async function tryRefresh(refreshToken) {
  try {
    const res = await fetch(`${SR_CONFIG.API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });
    const payload = await res.json();
    if (res.ok && payload.success) {
      await setTokens(payload.data.accessToken, payload.data.refreshToken);
      return payload.data.accessToken;
    }
  } catch (_) {}
  await clearTokens();
  return null;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function extTrack(name, data) {
  try {
    await fetch(SR_CONFIG.UMAMI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "event",
        payload: {
          website: SR_CONFIG.UMAMI_WEBSITE_ID,
          name: name,
          data: data || {},
          hostname: "extension",
          url: "/extension"
        }
      })
    });
  } catch (_) {}
}

async function getSites({forceRefresh: forceRefresh = false} = {}) {
  if (!forceRefresh) {
    const cached = await chrome.storage.local.get(KEYS.SITES_CACHE);
    if (cached[KEYS.SITES_CACHE]) return cached[KEYS.SITES_CACHE];
  }
  try {
    const res = await fetch(`${SR_CONFIG.API_BASE}/api/meta/sites`);
    const payload = await res.json();
    if (res.ok && payload.success) {
      await chrome.storage.local.set({
        [KEYS.SITES_CACHE]: payload.data
      });
      return payload.data;
    }
  } catch (err) {
    console.error("[SaveRip] GET /api/meta/sites failed", err);
  }
  return [];
}

chrome.runtime.onInstalled.addListener(() => getSites({
  forceRefresh: true
}));

async function getSmartlinkUrl({forceRefresh: forceRefresh = false} = {}) {
  if (!forceRefresh) {
    const cached = await chrome.storage.local.get(KEYS.SMARTLINK_CACHE);
    if (cached[KEYS.SMARTLINK_CACHE]) return cached[KEYS.SMARTLINK_CACHE];
  }
  try {
    const res = await fetch(`${SR_CONFIG.API_BASE}/api/meta/smartlink`);
    const payload = await res.json();
    if (res.ok && payload.success && payload.data.url) {
      await chrome.storage.local.set({
        [KEYS.SMARTLINK_CACHE]: payload.data.url
      });
      return payload.data.url;
    }
  } catch (err) {
    console.error("[SaveRip] GET /api/meta/smartlink failed", err);
  }
  return SR_CONFIG.SMARTLINK_URL_FALLBACK;
}

chrome.runtime.onInstalled.addListener(() => getSmartlinkUrl({
  forceRefresh: true
}));

function compareVersions(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function getExtensionUpdateInfo() {
  try {
    const res = await fetchWithTimeout(`${SR_CONFIG.API_BASE}/api/meta/extension-version`);
    const payload = await res.json();
    if (!(res.ok && payload.success && payload.data.latestVersion)) return {
      updateAvailable: false
    };
    const currentVersion = chrome.runtime.getManifest().version;
    const updateAvailable = compareVersions(payload.data.latestVersion, currentVersion) > 0;
    return {
      updateAvailable: updateAvailable,
      latestVersion: payload.data.latestVersion,
      updateUrl: payload.data.updateUrl || null
    };
  } catch (err) {
    return {
      updateAvailable: false
    };
  }
}

async function getPreferredResolution() {
  const store = await chrome.storage.local.get(KEYS.PREFERRED_RES);
  const val = store[KEYS.PREFERRED_RES];
  if (val === "best") return "best";
  if (typeof val === "number") return val;
  return null;
}

async function getDownloadProgress(progressId) {
  try {
    const res = await fetchWithTimeout(`${SR_CONFIG.API_BASE}/api/download/progress/${progressId}`);
    const data = await res.json();
    return {
      ok: true,
      ...data
    };
  } catch (err) {
    return {
      ok: false
    };
  }
}

const PENDING_HLS_MAX_AGE_MS = 15 * 60 * 1e3;

async function trackPendingHls(progressId, filename) {
  const store = await chrome.storage.local.get(KEYS.PENDING_HLS);
  const pending = store[KEYS.PENDING_HLS] || {};
  pending[progressId] = {
    filename: filename,
    createdAt: Date.now()
  };
  await chrome.storage.local.set({
    [KEYS.PENDING_HLS]: pending
  });
  chrome.alarms.create(`sr_hls_${progressId}`, {
    delayInMinutes: 1,
    periodInMinutes: 1
  });
}

async function clearPendingHls(progressId) {
  chrome.alarms.clear(`sr_hls_${progressId}`);
  const store = await chrome.storage.local.get(KEYS.PENDING_HLS);
  const pending = store[KEYS.PENDING_HLS] || {};
  if (pending[progressId]) {
    delete pending[progressId];
    await chrome.storage.local.set({
      [KEYS.PENDING_HLS]: pending
    });
  }
}

async function claimPendingHls(progressId) {
  const store = await chrome.storage.local.get(KEYS.PENDING_HLS);
  const pending = store[KEYS.PENDING_HLS] || {};
  if (!(progressId in pending)) return false;
  delete pending[progressId];
  await chrome.storage.local.set({
    [KEYS.PENDING_HLS]: pending
  });
  chrome.alarms.clear(`sr_hls_${progressId}`);
  return true;
}

chrome.alarms.onAlarm.addListener(async alarm => {
  const match = /^sr_hls_(.+)$/.exec(alarm.name);
  if (!match) return;
  const progressId = match[1];
  const store = await chrome.storage.local.get(KEYS.PENDING_HLS);
  const entry = (store[KEYS.PENDING_HLS] || {})[progressId];
  if (!entry) {
    chrome.alarms.clear(alarm.name);
    return;
  }
  if (Date.now() - entry.createdAt > PENDING_HLS_MAX_AGE_MS) {
    await clearPendingHls(progressId);
    return;
  }
  const progress = await getDownloadProgress(progressId);
  if (!progress.ok || !progress.done) return;
  if (progress.error) {
    await clearPendingHls(progressId);
  } else {
    fetchHlsFile(progressId, entry.filename);
  }
});

async function fetchHlsFile(progressId, filename) {
  if (!await claimPendingHls(progressId)) return {
    ok: true,
    skipped: true
  };
  chrome.downloads.download({
    url: `${SR_CONFIG.API_BASE}/api/download/fetch/${progressId}`,
    filename: filename
  });
  return {
    ok: true
  };
}

async function confirmHlsDownload(videoUrl, res, filename) {
  const progressId = crypto.randomUUID();
  const sep = videoUrl.includes("?") ? "&" : "?";
  let url = `${videoUrl}${sep}progressId=${progressId}`;
  if (res) url += `&res=${encodeURIComponent(res)}`;
  try {
    await fetchWithTimeout(url);
  } catch (err) {
    return {
      ok: false,
      status: 500,
      error: "download_failed"
    };
  }
  await trackPendingHls(progressId, filename);
  return {
    ok: true,
    progressId: progressId
  };
}

function safeFilename(title, ext) {
  const base = (title || "saverip-download").replace(/[\\/:*?"<>|]/g, "_");
  return base.endsWith(`.${ext}`) ? base : `${base}.${ext}`;
}

const REQUEST_TIMEOUT_MS = 45e3;

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController;
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timer));
}

async function doDownload(pageUrl) {
  const tokens = await getTokens();
  const deviceId = await getDeviceId();
  const headers = {
    "Content-Type": "application/json"
  };
  if (tokens.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
  let res;
  try {
    res = await fetchWithTimeout(`${SR_CONFIG.API_BASE}/api/download/free`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        url: pageUrl,
        deviceId: deviceId
      })
    });
    if (res.status === 401 && tokens.refreshToken) {
      const newAccessToken = await tryRefresh(tokens.refreshToken);
      if (newAccessToken) {
        headers.Authorization = `Bearer ${newAccessToken}`;
        res = await fetchWithTimeout(`${SR_CONFIG.API_BASE}/api/download/free`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            url: pageUrl,
            deviceId: deviceId
          })
        });
      }
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.name === "AbortError" ? "timeout" : "network_error"
    };
  }
  const payload = await res.json().catch(() => ({}));
  const site = hostnameOf(pageUrl);
  if (res.ok && payload.success) {
    const isPremium = tokens.accessToken ? !!(await getAccount()).user?.isPremium : false;
    if (payload.quota && !isPremium) {
      getSmartlinkUrl().then(url => chrome.tabs.create({
        url: url,
        active: false
      }));
    }
    const responseQuota = isPremium ? null : payload.quota;
    if (payload.data && payload.data.mediaType === "gallery") {
      return await doGalleryZip(pageUrl, payload.data.siteKey, isPremium, tokens.accessToken, site, responseQuota);
    }
    if (payload.data && payload.data.videoUrl) {
      const filename = safeFilename(payload.data.title, "mp4");
      if (payload.data.mediaType === "hls") {
        const resolutions = Array.isArray(payload.data.resolutions) ? payload.data.resolutions : [];
        const preferredRes = await getPreferredResolution();
        if (resolutions.length > 1 && preferredRes === null) {
          extTrack("extension-download", {
            site: site,
            plan: isPremium ? "premium" : "free"
          });
          return {
            ok: true,
            data: payload.data,
            quota: responseQuota,
            hls: true,
            needsQuality: true,
            resolutions: resolutions,
            freeCap: payload.data.freeCap ?? null,
            filename: filename
          };
        }
        const progressId = crypto.randomUUID();
        const sep = payload.data.videoUrl.includes("?") ? "&" : "?";
        const resParam = typeof preferredRes === "number" ? `&res=${preferredRes}` : "";
        try {
          await fetchWithTimeout(`${payload.data.videoUrl}${sep}progressId=${progressId}${resParam}`);
        } catch (err) {
          return {
            ok: false,
            status: 500,
            error: "download_failed"
          };
        }
        await trackPendingHls(progressId, filename);
        extTrack("extension-download", {
          site: site,
          plan: isPremium ? "premium" : "free"
        });
        return {
          ok: true,
          data: payload.data,
          quota: responseQuota,
          hls: true,
          progressId: progressId,
          filename: filename
        };
      }
      chrome.downloads.download({
        url: payload.data.videoUrl,
        filename: filename
      });
    }
    extTrack("extension-download", {
      site: site,
      plan: isPremium ? "premium" : "free"
    });
    return {
      ok: true,
      data: payload.data,
      quota: responseQuota
    };
  }
  if (res.status === 429) {
    extTrack("quota-hit", {
      site: site
    });
    return {
      ok: false,
      status: 429,
      quota: payload.quota || null
    };
  }
  return {
    ok: false,
    status: res.status,
    error: payload.error || "download_failed"
  };
}

async function doGalleryZip(pageUrl, siteKey, isPremium, accessToken, site, quota) {
  if (!isPremium) {
    const sites = await getSites();
    const siteMeta = sites.find(s => s.key === siteKey);
    if (!siteMeta?.freeZip) {
      return {
        ok: false,
        status: 403,
        error: "zip_requires_pro"
      };
    }
  }
  const progressId = crypto.randomUUID();
  const zipUrl = `${SR_CONFIG.API_BASE}/api/download/gallery-zip?url=${encodeURIComponent(pageUrl)}&progressId=${progressId}`;
  const downloadOptions = {
    url: zipUrl
  };
  if (accessToken) downloadOptions.headers = [ {
    name: "Authorization",
    value: `Bearer ${accessToken}`
  } ];
  chrome.downloads.download(downloadOptions);
  extTrack("extension-download", {
    site: site,
    plan: isPremium ? "premium" : "free"
  });
  return {
    ok: true,
    gallery: true,
    quota: quota
  };
}

async function getAccount() {
  const tokens = await getTokens();
  if (!tokens.accessToken) return {
    loggedIn: false
  };
  let res;
  try {
    res = await fetchWithTimeout(`${SR_CONFIG.API_BASE}/api/user/me`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    if (res.status === 401 && tokens.refreshToken) {
      const newAccessToken = await tryRefresh(tokens.refreshToken);
      if (!newAccessToken) return {
        loggedIn: false
      };
      res = await fetchWithTimeout(`${SR_CONFIG.API_BASE}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${newAccessToken}`
        }
      });
    }
  } catch (err) {
    return {
      loggedIn: false
    };
  }
  if (!res.ok) return {
    loggedIn: false
  };
  const payload = await res.json();
  return {
    loggedIn: true,
    user: payload.data
  };
}

async function getQuotaStatus() {
  try {
    const deviceId = await getDeviceId();
    const res = await fetchWithTimeout(`${SR_CONFIG.API_BASE}/api/meta/quota-status`, {
      headers: {
        "X-Device-Id": deviceId
      }
    });
    const payload = await res.json();
    if (res.ok && payload.success) return {
      ok: true,
      ...payload.data
    };
  } catch (err) {
    console.error("[SaveRip] GET /api/meta/quota-status failed", err);
  }
  return {
    ok: false
  };
}

async function openBillingPortal() {
  const tokens = await getTokens();
  if (!tokens.accessToken) return {
    ok: false,
    error: "not_logged_in"
  };
  async function callPortal(accessToken) {
    return fetchWithTimeout(`${SR_CONFIG.API_BASE}/api/checkout/portal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }
  try {
    let res = await callPortal(tokens.accessToken);
    if (res.status === 401 && tokens.refreshToken) {
      const newAccessToken = await tryRefresh(tokens.refreshToken);
      if (newAccessToken) res = await callPortal(newAccessToken);
    }
    const payload = await res.json();
    if (res.ok && payload.success && payload.data.url) {
      chrome.tabs.create({
        url: payload.data.url
      });
      return {
        ok: true
      };
    }
    return {
      ok: false,
      error: payload.error || "portal_failed"
    };
  } catch (err) {
    return {
      ok: false,
      error: "network_error"
    };
  }
}

async function getPaymentMethods() {
  try {
    const res = await fetch(`${SR_CONFIG.API_BASE}/api/meta/payment-methods`);
    const payload = await res.json();
    if (res.ok && payload.success) return payload.data;
  } catch (err) {
    console.error("[SaveRip] GET /api/meta/payment-methods failed", err);
  }
  return {
    stripeEnabled: false
  };
}

async function startCheckout(email, plan, method) {
  try {
    const res = await fetch(`${SR_CONFIG.API_BASE}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        plan: plan,
        method: method
      })
    });
    const payload = await res.json();
    if (res.ok && payload.success && payload.data.paymentUrl) {
      chrome.tabs.create({
        url: payload.data.paymentUrl
      });
      extTrack("upgrade-modal-opened", {
        source: "extension",
        plan: plan,
        method: method
      });
      return {
        ok: true
      };
    }
    return {
      ok: false,
      error: payload.error || "checkout_failed"
    };
  } catch (err) {
    return {
      ok: false,
      error: "network_error"
    };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      await routeMessage(msg, sendResponse);
    } catch (err) {
      console.error("[SaveRip] message handler threw", msg.type, err);
      sendResponse({
        ok: false,
        error: "internal_error"
      });
    }
  })();
  return true;
});

async function routeMessage(msg, sendResponse) {
  switch (msg.type) {
   case "SR_GET_SITES":
    sendResponse(await getSites());
    break;

   case "SR_DOWNLOAD":
    sendResponse(await doDownload(msg.url));
    break;

   case "SR_GET_DOWNLOAD_PROGRESS":
    sendResponse(await getDownloadProgress(msg.progressId));
    break;

   case "SR_FETCH_HLS_FILE":
    sendResponse(await fetchHlsFile(msg.progressId, msg.filename));
    break;

   case "SR_CONFIRM_HLS_DOWNLOAD":
    sendResponse(await confirmHlsDownload(msg.videoUrl, msg.res, msg.filename));
    break;

   case "SR_GET_ACCOUNT":
    sendResponse(await getAccount());
    break;

   case "SR_GET_QUOTA_STATUS":
    sendResponse(await getQuotaStatus());
    break;

   case "SR_GET_EXTENSION_UPDATE":
    sendResponse(await getExtensionUpdateInfo());
    break;

   case "SR_OPEN_BILLING_PORTAL":
    sendResponse(await openBillingPortal());
    break;

   case "SR_CHECKOUT":
    sendResponse(await startCheckout(msg.email, msg.plan, msg.method));
    break;

   case "SR_GET_PAYMENT_METHODS":
    sendResponse(await getPaymentMethods());
    break;

   case "SR_STORE_TOKENS":
    await setTokens(msg.accessToken, msg.refreshToken);
    sendResponse({
      ok: true
    });
    break;

   case "SR_LOGOUT":
    await clearTokens();
    sendResponse({
      ok: true
    });
    break;

   case "SR_TRACK":
    await extTrack(msg.name, msg.data);
    sendResponse({
      ok: true
    });
    break;

   default:
    sendResponse({
      ok: false,
      error: "unknown_message"
    });
  }
}