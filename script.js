
document.getElementById("start-button").addEventListener("click", () => {
  document.getElementById("lcd-display").textContent = "リール回転中...";
});

document.getElementById("stop-1").addEventListener("click", () => {
  document.getElementById("lcd-display").textContent = "左リール停止";
});

document.getElementById("stop-2").addEventListener("click", () => {
  document.getElementById("lcd-display").textContent = "中リール停止";
});

document.getElementById("stop-3").addEventListener("click", () => {
  document.getElementById("lcd-display").textContent = "右リール停止";
});
