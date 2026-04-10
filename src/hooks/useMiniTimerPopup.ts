import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppAction } from '../types';

const CHANNEL_NAME = 'drpomo-mini-timer';

function buildPopupHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🍅 DR.Pomo</title>
  <style>
    :root {
      --bg: #0f0f13;
      --surface: #1a1a22;
      --surface-hover: #252532;
      --border: #2e2e3d;
      --text: #e8e8f0;
      --text-muted: #6a6a88;
      --accent: #e05c5c;
      --amber: #f5c842;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
      height: 100vh;
      display: flex;
      align-items: stretch;
    }
    .mini-timer {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      margin: 8px;
      flex: 1;
    }
    .mini-timer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .mini-logo {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 0.02em;
    }
    .mini-close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.8rem;
      line-height: 1;
      padding: 3px 6px;
      border-radius: 6px;
      font-family: inherit;
      transition: color 0.15s, background 0.15s;
    }
    .mini-close-btn:hover { color: var(--text); background: var(--surface-hover); }
    .mini-badge {
      display: inline-block;
      align-self: flex-start;
      color: #fff;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 3px 10px;
      border-radius: 20px;
    }
    .mini-sublabel {
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.35;
      margin-top: -3px;
    }
    .mini-time {
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      font-variant-numeric: tabular-nums;
      text-align: center;
      margin: 2px 0;
      line-height: 1;
    }
    .mini-pause-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-align: center;
    }
    .mini-controls {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-top: 2px;
    }
    .mini-btn {
      flex: 1;
      padding: 8px 10px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      font-family: inherit;
      transition: opacity 0.15s, transform 0.1s;
    }
    .mini-btn:active { transform: scale(0.95); }
    .mini-pause-btn { background: var(--amber); color: #000; }
    .mini-resume-btn { background: var(--accent); color: #fff; }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="mini-timer">
    <div class="mini-timer-header">
      <span class="mini-logo">🍅 DR.Pomo</span>
      <button class="mini-close-btn" id="closeBtn" title="Kapat">✕</button>
    </div>
    <div class="mini-badge" id="badge"></div>
    <div class="mini-sublabel hidden" id="sublabel"></div>
    <div class="mini-time" id="timeDisplay">--:--</div>
    <div class="mini-pause-label hidden" id="pauseLabel">⏸ Duraklatıldı</div>
    <div class="mini-controls">
      <button class="mini-btn mini-pause-btn hidden" id="pauseBtn">⏸ Duraklat</button>
      <button class="mini-btn mini-resume-btn hidden" id="resumeBtn">▶ Devam Et</button>
    </div>
  </div>
  <script>
    var BLOCK_TYPE_LABELS = {
      work: 'Çalışma',
      'short-break': 'Kısa Ara',
      'long-break': 'Uzun Ara',
      lunch: 'Öğle Arası'
    };
    var BLOCK_COLORS = {
      work: '#e05c5c',
      'short-break': '#4db8c8',
      'long-break': '#56c98b',
      lunch: '#f0924a'
    };
    function formatTime(secs) {
      var m = String(Math.floor(secs / 60)).padStart(2, '0');
      var s = String(secs % 60).padStart(2, '0');
      return m + ':' + s;
    }
    function updateUI(state) {
      var block = state.schedule[state.currentBlockIndex];
      if (!block) return;
      var color = BLOCK_COLORS[block.type] || '#e05c5c';
      var isPaused = state.timerState === 'paused';
      var isRunning = state.timerState === 'running';

      var badge = document.getElementById('badge');
      badge.textContent = BLOCK_TYPE_LABELS[block.type] || block.type;
      badge.style.background = color;

      var sublabel = document.getElementById('sublabel');
      if (block.type === 'work' && block.taskName) {
        sublabel.textContent = 'Oturum ' + block.sessionNumber + '/' + block.totalSessions + ' \u00b7 ' + block.taskName;
        sublabel.classList.remove('hidden');
      } else {
        sublabel.classList.add('hidden');
      }

      var timeEl = document.getElementById('timeDisplay');
      timeEl.textContent = formatTime(state.timeRemaining);
      timeEl.style.color = color;

      var pauseLabel = document.getElementById('pauseLabel');
      isPaused ? pauseLabel.classList.remove('hidden') : pauseLabel.classList.add('hidden');

      var pauseBtn = document.getElementById('pauseBtn');
      var resumeBtn = document.getElementById('resumeBtn');
      isRunning ? pauseBtn.classList.remove('hidden') : pauseBtn.classList.add('hidden');
      isPaused ? resumeBtn.classList.remove('hidden') : resumeBtn.classList.add('hidden');

      document.title = formatTime(state.timeRemaining) + ' \u00b7 \ud83c\udf45 DR.Pomo';
    }

    var channel = new BroadcastChannel('drpomo-mini-timer');
    channel.onmessage = function(e) {
      if (e.data.type === 'STATE_UPDATE') updateUI(e.data.state);
    };

    document.getElementById('closeBtn').addEventListener('click', function() {
      channel.postMessage({ type: 'ACTION', action: 'CLOSE' });
      channel.close();
      window.close();
    });
    document.getElementById('pauseBtn').addEventListener('click', function() {
      channel.postMessage({ type: 'ACTION', action: 'PAUSE' });
    });
    document.getElementById('resumeBtn').addEventListener('click', function() {
      channel.postMessage({ type: 'ACTION', action: 'RESUME' });
    });

    // Ask the main window for initial state
    channel.postMessage({ type: 'REQUEST_STATE' });
  </script>
</body>
</html>`;
}

export function useMiniTimerPopup(
  state: AppState,
  dispatch: React.Dispatch<AppAction>,
): { openPopup: () => void; isPopupOpen: boolean } {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const closeCheckerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dispatchRef = useRef(dispatch);
  const stateRef = useRef(state);

  dispatchRef.current = dispatch;
  stateRef.current = state;

  const closePopup = useCallback(() => {
    if (closeCheckerRef.current) {
      clearInterval(closeCheckerRef.current);
      closeCheckerRef.current = null;
    }
    channelRef.current?.close();
    channelRef.current = null;
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    setIsPopupOpen(false);
  }, []);

  const openPopup = useCallback(() => {
    // If popup is already open, focus it
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }

    const width = 280;
    const height = 264;
    const left = Math.max(0, (window.screen.availWidth - width) - 20);
    const top = Math.max(0, (window.screen.availHeight - height) - 60);

    const popup = window.open(
      '',
      'drpomo_mini_timer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,menubar=no,toolbar=no,location=no`,
    );

    if (!popup) {
      // Popup was blocked by the browser; the button stays visible so the user can try again
      // after allowing popups for this site in their browser settings.
      console.warn('[DR.Pomo] Popup was blocked. Please allow popups for this site and try again.');
      return;
    }

    popupRef.current = popup;

    // Set up BroadcastChannel for two-way communication
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (e) => {
      const { type, action } = e.data as { type: string; action?: string };
      if (type === 'ACTION') {
        if (action === 'CLOSE') {
          closePopup();
        } else if (action === 'PAUSE') {
          dispatchRef.current({ type: 'PAUSE' });
        } else if (action === 'RESUME') {
          dispatchRef.current({ type: 'RESUME' });
        }
      } else if (type === 'REQUEST_STATE') {
        channel.postMessage({ type: 'STATE_UPDATE', state: stateRef.current });
      }
    };

    // Write HTML into the popup (works because it's a same-origin blank window)
    popup.document.open();
    popup.document.write(buildPopupHtml());
    popup.document.close();

    // Wait briefly for the popup's document to finish parsing and for its
    // BroadcastChannel listener to be registered before sending the initial state.
    setTimeout(() => {
      channel.postMessage({ type: 'STATE_UPDATE', state: stateRef.current });
    }, 150);

    setIsPopupOpen(true);

    // Poll to detect when the user closes the popup via the OS window chrome
    closeCheckerRef.current = setInterval(() => {
      if (popup.closed) {
        if (closeCheckerRef.current) {
          clearInterval(closeCheckerRef.current);
          closeCheckerRef.current = null;
        }
        channel.close();
        channelRef.current = null;
        popupRef.current = null;
        setIsPopupOpen(false);
      }
    }, 500);
  }, [closePopup]);

  // Sync every state change (timer ticks, pauses, etc.) to the popup.
  // The timer ticks every second by design, so this is the expected update frequency.
  useEffect(() => {
    if (!isPopupOpen || !channelRef.current) return;
    channelRef.current.postMessage({ type: 'STATE_UPDATE', state });
  }, [state, isPopupOpen]);

  // Close popup when the main window/tab is closed or navigated away
  useEffect(() => {
    const handleBeforeUnload = () => closePopup();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [closePopup]);

  // Clean up popup, channel, and interval when the component unmounts
  useEffect(() => {
    return () => {
      if (closeCheckerRef.current) {
        clearInterval(closeCheckerRef.current);
        closeCheckerRef.current = null;
      }
      channelRef.current?.close();
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  return { openPopup, isPopupOpen };
}
