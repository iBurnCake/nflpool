<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>House Picks</title>

  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/housePicks.css">

  <!-- Boot overlay (keeps background visible; no color flash) -->
  <style id="bootCss">
    .app-boot #appBootLoader{
      position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999;
      background:transparent;
    }
    .app-boot #appBootLoader .loader-box{
      display:flex;flex-direction:column;align-items:center;gap:12px;
      padding:16px 20px;border:1px solid #333;border-radius:12px;
      background:#141414;box-shadow:0 6px 24px rgba(0,0,0,.5)
    }
    .app-boot #appBootLoader .spinner{
      width:42px;height:42px;border:3px solid #333;border-top-color:#FFD700;
      border-radius:50%;animation:spin 1s linear infinite
    }
    .app-boot #appBootLoader .msg{color:#fff;opacity:.9;font-weight:600}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
  <script>document.documentElement.classList.add('app-boot');</script>

  <!-- Your exact title style -->
  <style>
    .house-picks-title{
      display:inline-block;padding:10px 25px;background-color:rgba(40,40,40,.9);
      border:2px solid #FFD700;border-radius:8px;font-size:28px;font-weight:bold;color:#FFD700;
      text-align:center;margin:0 auto 20px auto;position:relative;left:50%;transform:translateX(-50%);
      box-shadow:0 0 10px rgba(0,0,0,.6);
    }

    /* layout helpers (unchanged) */
    .house-picks-layout{display:flex;gap:20px;align-items:flex-start;justify-content:flex-start;width:100%;max-width:1200px;margin:0 auto}
    .leaderboard-container{flex:0 0 20%;max-width:300px;min-width:220px}
    .picks-container{flex:1;display:flex;flex-wrap:wrap;gap:20px}
    .user-picks-container{flex:1 1 450px;max-width:500px}
    .user-header{text-align:center;width:100%}
    .leaderboard-user{display:flex;align-items:center;gap:6px;white-space:nowrap;justify-content:center;}
    .leaderboard-user img{width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0;}
    .leaderboard-username{white-space:nowrap;text-overflow:ellipsis}
    .user-picks-table th,.user-picks-table td{text-align:center;vertical-align:middle}
  </style>
</head>
<body>
  <!-- Loader overlay -->
  <div id="appBootLoader" aria-live="polite">
    <div class="loader-box">
      <div class="spinner" aria-hidden="true"></div>
      <div id="appBootMsg" class="msg">Loading…</div>
    </div>
  </div>

  <!-- Header row: back button + centered title using your class -->
  <div style="max-width:1200px;margin:14px auto 16px;position:relative;">
    <button onclick="window.location.href='index.html'" style="position:absolute;left:0;top:50%;transform:translateY(-50%);">
      Back to Home
    </button>
    <div class="house-picks-title">House Picks</div>
  </div>

  <!-- Main content -->
  <div class="house-picks-layout">
    <div id="leaderboardWrapper" class="leaderboard-container"></div>
    <div id="housePicksContainer" class="picks-container"></div>
  </div>

  <script type="module" src="js/housePicks.js"></script>
  <script type="module">
    import { clearBootLoader } from './js/boot.js';
    window.addEventListener('load', () => clearBootLoader());
  </script>
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
      });
    }
  </script>
</body>
</html>
