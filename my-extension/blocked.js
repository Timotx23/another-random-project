const quotes = [
    "Discipline beats motivation — but today you’ve got both.",
    "Small choices compound. This is one of them.",
    "Future you is watching. Make it proud.",
    "You don’t need more time. You need fewer distractions.",
    "Stay on the plan. The mood will catch up.",
    "A 10-minute detour becomes a 2-hour regret. Not today."
  ];
  
  document.getElementById("quote").textContent =
    quotes[Math.floor(Math.random() * quotes.length)];
  
  document.getElementById("time").textContent =
    "Blocked at " + new Date().toLocaleString();
  
  document.getElementById("close").addEventListener("click", () => {
    window.close(); // works sometimes; if it doesn't, just close manually
  });
  
  document.getElementById("breathe").addEventListener("click", () => {
    const btn = document.getElementById("breathe");
    btn.disabled = true;
    let t = 10;
    btn.textContent = `Breathe… ${t}`;
    const it = setInterval(() => {
      t -= 1;
      btn.textContent = t > 0 ? `Breathe… ${t}` : "Nice. Back to work.";
      if (t <= 0) { clearInterval(it); }
    }, 1000);
  });
  