(function() {
  let lastSeen;
  async function sync() {
    const current = localStorage.getItem("accessToken") || null;
    if (current === lastSeen) return;
    lastSeen = current;
    const msg = current ? {
      type: "SR_STORE_TOKENS",
      accessToken: current,
      refreshToken: localStorage.getItem("refreshToken") || null
    } : {
      type: "SR_LOGOUT"
    };
    const res = await srSendMessage(msg);
    if (res.error === "context_invalidated") clearInterval(intervalId);
  }
  let intervalId;
  sync();
  intervalId = setInterval(sync, 1500);
  window.addEventListener("pagehide", () => clearInterval(intervalId));
})();