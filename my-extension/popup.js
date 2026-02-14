document.getElementById("send").addEventListener("click", async () => {

  // Get active tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  const url = tab.url;

  // Send to Python backend
  const response = await fetch("http://localhost:5000/receive", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: url })
  });

  const data = await response.json();

  document.getElementById("result").textContent = data.python_string;
});
