const PY_HOST = "com.timo.genreclassifier";

// Always allow these (even if Python says otherwise)
const ALLOW_DOMAINS = new Set([
  "youtube.com", "www.youtube.com", "youtu.be",
  "whatsapp.com", "www.whatsapp.com", "web.whatsapp.com"
]);

// Quick local heuristics (Stage A already blocks many; this is extra)
const LOCAL_BLOCK_WORDS = {
  porn: ["porn", "xxx", "hentai", "nsfw", "nude", "erotic", "sex"],
  gambling: ["casino", "bet", "poker", "slots", "sportsbook", "bookmaker"]
};

function hostnameOf(url) {
  try { return new URL(url).hostname; } catch { return ""; }
}

function isHttp(url) {
  return /^https?:\/\//i.test(url || "");
}

function isAllowlisted(host) {
  if (!host) return false;
  if (ALLOW_DOMAINS.has(host)) return true;
  // allow subdomains of youtube.com / whatsapp.com if you want:
  if (host.endsWith(".youtube.com")) return true;
  if (host.endsWith(".whatsapp.com")) return true;
  return false;
}

function localGuess(url) {
  const u = (url || "").toLowerCase();
  for (const w of LOCAL_BLOCK_WORDS.porn) if (u.includes(w)) return "porn";
  for (const w of LOCAL_BLOCK_WORDS.gambling) if (u.includes(w)) return "gambling";
  return "unknown";
}

// Create a stable dynamic rule id from a string
function stableIdFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  h = Math.abs(h);
  return (h % 900000) + 10000; // keep ids in a safe range
}

async function addBlockRuleForDomain(domain, reason) {
  const ruleId = stableIdFromString("block:" + domain);

  const rule = {
    id: ruleId,
    priority: 120,
    action: { type: "block" },
    condition: {
      requestDomains: [domain],
      resourceTypes: ["main_frame"]
    }
  };

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ruleId],
    addRules: [rule]
  });

  console.log(`🧱 Dynamic block installed for ${domain} (${reason})`);
}

function askPythonClassifier(url) {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(
      PY_HOST,
      { url },
      (resp) => {
        if (chrome.runtime.lastError) {
          console.warn("🐍 Python classifier not reachable:", chrome.runtime.lastError.message);
          resolve({ label: "unknown", confidence: 0.0 });
          return;
        }
        resolve(resp || { label: "unknown", confidence: 0.0 });
      }
    );
  });
}

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const tab = await chrome.tabs.get(details.tabId);
  const url = tab.url;

  if (!isHttp(url)) return;

  const host = hostnameOf(url);
  if (!host) return;

  // Always allowlist
  if (isAllowlisted(host)) return;

  // Quick local guess
  const guess = localGuess(url);
  if (guess !== "unknown") {
    await addBlockRuleForDomain(host, "local:" + guess);
    // Optional: kick them off immediately (won’t be as perfect as pre-block)
    chrome.tabs.update(details.tabId, { url: "about:blank" });
    return;
  }

  // Stage B: ask Python only for uncertain cases
  const { label, confidence } = await askPythonClassifier(url);

  // Decide threshold however you want
  if ((label === "porn" || label === "gambling" || label === "social") && confidence >= 0.65) {
    await addBlockRuleForDomain(host, `python:${label}:${confidence}`);
    chrome.tabs.update(details.tabId, { url: "about:blank" });
  }
});
