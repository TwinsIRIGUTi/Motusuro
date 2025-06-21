// JavaScriptのメインロジック（前に提供した完全版をベースにする）
// ここでは演出系関数のみプレースホルダとして記述
function playSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

function stopSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

function showPatlamp(show) {
  const container = document.getElementById("patlamp-container");
  if (show) {
    container.classList.add("bonus-active");
  } else {
    container.classList.remove("bonus-active");
  }
}