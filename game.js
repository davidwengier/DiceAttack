(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const icons = { attack: "⚔", guard: "⬡", mend: "✚" };
  const pipPositions = {
    1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9]
  };
  const zones = [
    { title: "The Whispering Wilds", label: "CHAPTER I · THE WILDS", className: "forest" },
    { title: "The Hollow Catacombs", label: "CHAPTER II · THE CATACOMBS", className: "crypt" },
    { title: "The Ember Throne", label: "CHAPTER III · THE INFERNO", className: "inferno" }
  ];
  const encounters = [
    { name: "Moss Slime", type: "slime", hp: 18, color: "#8acb86", role: "WILD CREATURE", flavor: "Something stirs beneath the ancient trees.", moves: [["attack", 4, "Sticky slap"], ["attack", 5, "Slime splash"], ["guard", 4, "Gelatinous shell"]] },
    { name: "Briar Slime", type: "slime", hp: 25, color: "#9ebd60", thorns: true, role: "THORNBOUND CREATURE", flavor: "Even the smallest creature has its thorns.", moves: [["attack", 5, "Briar lash"], ["heavy", 7, "Thorn burst"], ["guard", 5, "Barkskin"]] },
    { name: "Slime Sovereign", type: "slime", hp: 38, color: "#71c7b2", boss: true, role: "GUARDIAN OF THE WILDS", flavor: "A crown of stolen gold. A kingdom of moss.", moves: [["attack", 6, "Royal splash"], ["guard", 6, "Royal jelly"], ["heavy", 10, "King's crush"]] },
    { name: "Bonewalker", type: "skeleton", hp: 30, role: "RESTLESS DEAD", flavor: "Some footsteps never stop echoing.", moves: [["attack", 6, "Rusty slash"], ["heavy", 8, "Bone cleaver"], ["guard", 5, "Bone barrier"]] },
    { name: "Crypt Sentinel", type: "skeleton", hp: 39, armored: true, role: "UNDYING WATCHMAN", flavor: "Its oath outlived its flesh.", moves: [["guard", 7, "Iron bulwark"], ["attack", 7, "Sentinel strike"], ["heavy", 10, "Gravebreaker"]] },
    { name: "The Hollow King", type: "skeleton", hp: 54, boss: true, armored: true, role: "LORD OF THE CATACOMBS", flavor: "He has waited centuries for a worthy challenger.", moves: [["attack", 8, "Cursed blade"], ["guard", 8, "Crown's protection"], ["heavy", 12, "Death sentence"]] },
    { name: "Ember Imp", type: "demon", hp: 42, color: "#cf755b", role: "CREATURE OF THE RIFT", flavor: "A mischievous spark in an endless furnace.", moves: [["attack", 8, "Fire claw"], ["drain", 6, "Soul sip"], ["heavy", 11, "Ember storm"]] },
    { name: "Ashborn Reaver", type: "demon", hp: 52, color: "#b8697b", role: "INFERNAL HUNTER", flavor: "Forged in fire. Tempered by fury.", moves: [["heavy", 12, "Rift strike"], ["guard", 7, "Obsidian hide"], ["drain", 9, "Soul harvest"]] },
    { name: "Azrath, the Last Flame", type: "demon", hp: 78, color: "#cd6249", boss: true, role: "SOVEREIGN OF THE INFERNO", flavor: "One final roll between you and the darkness.", moves: [["attack", 10, "Hellfire"], ["drain", 9, "Devour hope"], ["guard", 9, "Infernal aegis"], ["heavy", 15, "The last flame"]] }
  ];
  const blessings = [
    { name: "Ember Edge", icon: "⚔", text: "+1 damage for every die assigned to Attack.", tag: "PERMANENT · ATTACK", apply: () => { state.power++; } },
    { name: "Moonward", icon: "⬡", text: "+1 block for every die assigned to Guard.", tag: "PERMANENT · GUARD", apply: () => { state.ward++; } },
    { name: "Lifebloom", icon: "✚", text: "+1 healing for every die assigned to Mend.", tag: "PERMANENT · HEALING", apply: () => { state.healing++; } },
    { name: "Lionheart", icon: "♡", text: "+8 maximum health. Also restore 8 health now.", tag: "PERMANENT · VITALITY", apply: () => { state.maxHp += 8; state.hp = Math.min(state.maxHp, state.hp + 8); } },
    { name: "Loaded Fate", icon: "✦", text: "Attack rolls of 6 deal another +2 critical damage.", tag: "PERMANENT · CRITICAL", apply: () => { state.critBonus += 2; } },
    { name: "Second Wind", icon: "❧", text: "Recover an extra 4 health after every victory, starting now.", tag: "PERMANENT · RECOVERY", apply: () => { state.recovery += 4; state.hp = Math.min(state.maxHp, state.hp + 4); } }
  ];
  let state;
  let best = 0;
  let soundEnabled = false;
  let audio;
  let helpReturnFocus;
  let toastTimer;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reducedMotion ? Math.min(ms, 25) : ms));
  const rollDie = () => Math.floor(Math.random() * 6) + 1;

  function notify(message) {
    $("toast").textContent = message;
    $("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $("toast").hidden = true; }, 5500);
  }

  function readRecord() {
    try {
      const stored = Number(localStorage.getItem("diceattack-best"));
      best = Number.isInteger(stored) && stored >= 0 && stored <= 9 ? stored : 0;
    } catch (error) {
      console.warn("Dice Attack cannot read local expedition records.", error);
      notify("Your browser has blocked save data. You can still play, but records won't be saved.");
    }
    updateRecord();
  }

  function updateRecord() {
    $("record").innerHTML = `BEST EXPEDITION <b>${best ? `${best} / 9` : "—"}</b>`;
  }

  function saveRecord() {
    if (state.defeated <= best) return;
    best = state.defeated;
    updateRecord();
    try {
      localStorage.setItem("diceattack-best", String(best));
    } catch (error) {
      console.warn("Dice Attack cannot save the expedition record.", error);
      notify("Your new record could not be saved. Browser storage is unavailable.");
    }
  }

  function playSound(kind) {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      soundEnabled = false;
      renderSoundButton();
      notify("Sound is not supported by this browser.");
      return;
    }
    if (!audio) audio = new AudioContextClass();
    if (audio.state === "suspended") {
      audio.resume().catch((error) => {
        console.warn("Dice Attack audio could not start.", error);
        soundEnabled = false;
        renderSoundButton();
        notify("Sound could not start. The game will continue without audio.");
      });
    }
    const notes = { roll: [420, 310], select: [520], hit: [130, 70], heal: [440, 660], block: [240, 360], victory: [440, 550, 660, 880], loss: [220, 185, 147] };
    (notes[kind] || notes.select).forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + index * .09;
      oscillator.type = kind === "hit" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .8, start + .15);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.055, start + .012);
      gain.gain.exponentialRampToValueAtTime(.001, start + .21);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + .23);
    });
  }

  function renderSoundButton() {
    $("sound-button").setAttribute("aria-pressed", String(soundEnabled));
    $("sound-button").setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
    $("sound-button").textContent = soundEnabled ? "♫" : "♪";
  }

  function svgFrame(content, defs = "", viewBox = "0 0 240 250") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none"><defs>${defs}</defs>${content}</svg>`;
  }

  function heroArtwork() {
    return svgFrame(`
      <path d="M74 102Q43 158 48 228L108 216 154 230Q183 175 150 104Z" fill="url(#hero-cape)" stroke="#213c3c" stroke-width="3"/>
      <path d="m64 141-9 71 31-11 9-79M138 116l21 95-30-14" stroke="#c5b276" stroke-opacity=".35" stroke-width="2"/>
      <path d="m92 178-8 45-11 9q0 7 20 5l15-5 4-48M122 181l7 43-5 9q5 7 24 3l7-5-16-48" fill="#34494d" stroke="#182d35" stroke-width="4"/>
      <path d="m87 199 19 2m22-1 17-3" stroke="#e1c791" stroke-width="5"/>
      <path d="m89 222 12 1m32-1 16-3" stroke="#93aaa2" stroke-width="3"/>
      <path d="M80 114q37-19 64 0l-6 72q-24 14-50-1Z" fill="url(#hero-armor)" stroke="#20393b" stroke-width="4"/>
      <path d="m88 122 20 26 26-25m-26 25 3 28" stroke="#daf0d2" stroke-opacity=".6" stroke-width="3"/>
      <path d="m89 133 23-9 23 8-2 31-21 12-20-12Z" fill="#28423f" stroke="#b2b28b" stroke-width="2"/>
      <path d="m111 135 8 11-8 17-8-17Z" fill="#e7c789"/>
      <path d="m88 174 51 2-1 13-48-1Z" fill="#4a3e32" stroke="#283531" stroke-width="2"/>
      <rect x="106" y="175" width="15" height="13" rx="2" fill="#c5a76a"/><rect x="111" y="178" width="5" height="7" fill="#4a3e32"/>
      <path d="M81 112q-21-5-23 13l13 14 21-7M140 112q19-6 22 10l-9 17-20-8" fill="url(#hero-metal)" stroke="#344740" stroke-width="3"/>
      <path d="m68 137-8 27 14 10 12-39m66 0 11 19 12 2" fill="#64837b" stroke="#294143" stroke-width="10" stroke-linecap="round"/>
      <path d="m168 157 9 7 9-9-7-8Z" fill="#acbaa0" stroke="#294143" stroke-width="3"/>
      <g transform="rotate(18 184 134)">
        <path d="m184 41 8 19-2 83h-13l1-83Z" fill="url(#hero-blade)" stroke="#456666" stroke-width="2"/>
        <path d="m184 52-1 86" stroke="#efffe7" stroke-width="2"/>
        <path d="M165 144q19-7 37 0l-2 8-35-1Z" fill="#dfbf76" stroke="#726443" stroke-width="2"/>
        <path d="m179 151 10 1-1 27-9-1Z" fill="#413f32" stroke="#967e50" stroke-width="2"/>
        <path d="m177 177 13 1-6 10Z" fill="#dfbf76"/>
      </g>
      <path d="M38 142q20-13 44-6l2 46q-10 24-29 31-19-12-23-34Z" fill="url(#hero-shield)" stroke="#cdb87d" stroke-width="4"/>
      <path d="M44 149q16-8 32-4l-1 35q-7 15-20 24-13-11-17-27Z" stroke="#9db5a0" stroke-opacity=".5" stroke-width="2"/>
      <path d="m55 153 11 19-11 22-10-22Z" fill="#e4c789"/><path d="M48 172h16" stroke="#314d47" stroke-width="3"/>
      <path d="M87 51q30-18 49 8l4 40-26 22-32-19Z" fill="url(#hero-metal)" stroke="#253c3d" stroke-width="4"/>
      <path d="M85 76q28-7 53 2l-1 16-50 1Z" fill="#142b30"/>
      <path d="m92 83 12-2m14 0 12 2" stroke="#d9eabd" stroke-width="3" stroke-linecap="round"/>
      <path d="m111 73-3 32 8 8 7-9-2-30" fill="#a4b6a0" stroke="#536f69" stroke-width="2"/>
      <path d="M86 59q11-32 31-30 7 2 8 14-22-2-25 20" fill="#d9b36d"/>
      <path d="M112 32q-19-11-27 0" stroke="#f2d597" stroke-width="6" stroke-linecap="round"/>
      <path d="m89 60 20-7 22 10" stroke="#d5dec0" stroke-width="3"/>
    `, `<linearGradient id="hero-cape" x2="1" y2="1"><stop stop-color="#548876"/><stop offset="1" stop-color="#193738"/></linearGradient>
      <linearGradient id="hero-armor" x2="1" y2="1"><stop stop-color="#9cae95"/><stop offset=".45" stop-color="#668b7f"/><stop offset="1" stop-color="#3c5a55"/></linearGradient>
      <linearGradient id="hero-metal" x2="1" y2=".6"><stop stop-color="#d2d4ac"/><stop offset=".5" stop-color="#94ad98"/><stop offset="1" stop-color="#527973"/></linearGradient>
      <linearGradient id="hero-blade" x2="1" y2=".3"><stop stop-color="#d4f3e0"/><stop offset=".5" stop-color="#a5d4c5"/><stop offset="1" stop-color="#618e88"/></linearGradient>
      <linearGradient id="hero-shield" x2="1" y2="1"><stop stop-color="#466b58"/><stop offset="1" stop-color="#163936"/></linearGradient>`);
  }

  function slimeArtwork(enemy) {
    return svgFrame(`
      <ellipse cx="123" cy="221" rx="86" ry="13" fill="${enemy.color}" opacity=".14"/>
      ${enemy.thorns ? `<path d="m61 124-23-15 6 39m27-41-8-25 27 17m34-8 15-25 9 37m32 15 31-8-15 36" fill="#789459" stroke="#354f42" stroke-width="3"/>` : ""}
      <path d="M29 207q-11-22 8-53 13-16 25-41 18-41 63-39 43-2 65 36 9 18 15 43 19 18 15 42-3 33-39 32-19 1-25-5-23 15-46 2-22 10-37-1-34 10-44-16Z" fill="url(#slime-body)" stroke="#294b40" stroke-width="4"/>
      <path d="M43 189q-2-36 24-54 13-39 45-46" stroke="#d1f0b4" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/>
      <path d="M62 213q57 17 128-5" stroke="#204b4580" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="88" cy="122" rx="14" ry="7" transform="rotate(-28 88 122)" fill="#e9ffc6" opacity=".5"/>
      <ellipse cx="182" cy="183" rx="12" ry="17" fill="#d3f3be" opacity=".12"/>
      <circle cx="66" cy="183" r="5" fill="#d3f3be" opacity=".2"/><circle cx="147" cy="115" r="6" fill="#d3f3be" opacity=".18"/>
      <g class="monster-eye"><ellipse cx="92" cy="165" rx="10" ry="14" fill="#183c34"/><ellipse cx="152" cy="165" rx="10" ry="14" fill="#183c34"/><circle cx="95" cy="161" r="3" fill="#f1ffdd"/><circle cx="155" cy="161" r="3" fill="#f1ffdd"/></g>
      <path d="M108 184q15 13 29-1" stroke="#234b3d" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="76" cy="183" rx="9" ry="4" fill="#ffc69a" opacity=".24"/><ellipse cx="169" cy="183" rx="9" ry="4" fill="#ffc69a" opacity=".24"/>
      ${enemy.boss ? `<g transform="rotate(-8 124 76)"><path d="m82 74-5-32 24 14 20-25 16 25 26-11-6 32Z" fill="url(#slime-crown)" stroke="#a67c44" stroke-width="3"/><path d="m84 76 71 1-2 12-65-1Z" fill="#dcb46c" stroke="#a67c44" stroke-width="2"/><path d="m117 65 7-9 8 9-8 9Z" fill="#70d3b0"/><circle cx="96" cy="66" r="3" fill="#e7efe2"/><circle cx="145" cy="65" r="3" fill="#e7efe2"/></g>` : ""}
    `, `<linearGradient id="slime-body" x1=".2" y1="0" x2=".7" y2="1"><stop stop-color="${enemy.color}"/><stop offset=".55" stop-color="${enemy.color}"/><stop offset="1" stop-color="#367666"/></linearGradient><linearGradient id="slime-crown" x2=".5" y2="1"><stop stop-color="#f4d498"/><stop offset="1" stop-color="#b58f50"/></linearGradient>`);
  }

  function skeletonArtwork(enemy) {
    const armor = enemy.armored ? "#607285" : "#77695c";
    return svgFrame(`
      ${enemy.boss ? `<path d="M87 89q-34 37-30 142l54-19 60 18q10-87-28-140Z" fill="#4a3e68" stroke="#252b45" stroke-width="3"/><path d="m71 130-4 82 25-11m62-63 8 76-22-12" stroke="#c6a47755" stroke-width="2"/>` : ""}
      <path d="m97 164-6 31-4 28m37-59 11 30 3 29" stroke="#49494c" stroke-width="16" stroke-linecap="round"/>
      <path d="m97 165-6 29-4 28m37-57 11 30 3 27" stroke="#c3c0a9" stroke-width="10" stroke-linecap="round"/>
      <circle cx="92" cy="197" r="7" fill="#d6d0b9" stroke="#5b605c" stroke-width="2"/><circle cx="136" cy="197" r="7" fill="#d6d0b9" stroke="#5b605c" stroke-width="2"/>
      <path d="m80 226-8 7q-1 7 23 3l5-9m31 0 1 9q25 3 22-6l-13-5" fill="#b9baa5" stroke="#4e5958" stroke-width="3"/>
      <path d="m90 112-7 42 14 21 31 1 14-20-8-46Z" fill="#253039" stroke="#36404a" stroke-width="3"/>
      <path d="m111 113 0 45" stroke="#d6cfb5" stroke-width="7"/>
      <path d="M109 124q-25-15-25 2 1 9 24 9m7-11q24-14 24 2-1 9-23 9m-6 7q-27-13-24 2 5 11 24 9m6-11q23-13 21 2-4 10-20 9" stroke="#cac7b0" stroke-width="5" stroke-linecap="round"/>
      <path d="m92 161 17 6 20-5 4 12-14 12-12-9-15 5-7-12Z" fill="#c9c5ab" stroke="#54615d" stroke-width="3"/>
      ${enemy.armored ? `<path d="M86 112q27-14 54 0l-3 41-24 9-28-11Z" fill="${armor}" stroke="#343d51" stroke-width="3"/><path d="m93 122 20 21 19-20m-19 20 1 12" stroke="#a6b3c1" stroke-width="2"/><path d="m111 122 7 10-7 10-6-10Z" fill="#c1a36e"/>` : ""}
      <path d="m83 113-15 27-7 25m79-50 14 19 14-4" stroke="#54635e" stroke-width="13" stroke-linecap="round"/>
      <path d="m83 113-15 27-7 25m79-50 14 19 14-4" stroke="#c8c4ab" stroke-width="8" stroke-linecap="round"/>
      <path d="M64 115q8-21 29-10l1 17-22 8m61-21q21-14 32 4l-8 15-26-9" fill="${armor}" stroke="#39494b" stroke-width="3"/>
      <g transform="rotate(20 177 125)"><path d="m173 43 10 11 4 79-17 4-5-77Z" fill="url(#bone-blade)" stroke="#5e6b6e" stroke-width="3"/><path d="m170 68 8 60m-6-42 9 2m-8 15 10 2" stroke="#8f8e7f" stroke-width="2"/><path d="m156 134 37-2 2 8-39 5Z" fill="#a99160"/><path d="m169 144 12-1 2 26-10 2Z" fill="#615348" stroke="#baa77c" stroke-width="2"/></g>
      <path d="M38 157q21-13 47 0l-2 36-26 21-21-25Z" fill="${armor}" stroke="#9faaa0" stroke-width="3"/>
      <path d="m57 166 12 14-12 16-11-16Z" fill="#b6b092"/><path d="m40 186 13 1" stroke="#39494b" stroke-width="4"/>
      <path d="M86 57q4-29 31-27 30 1 31 30l-6 25-9 5-5 18-29-1-6-18-9-6Z" fill="url(#bone-skull)" stroke="#596760" stroke-width="3"/>
      <path d="M91 68q13-11 23 0l-2 14-19 0Zm29 0q13-10 23 1l-3 13-19-1Z" fill="#25343a"/>
      <g class="monster-eye"><path d="m97 75 10-1m21 0 10 1" stroke="${enemy.boss ? "#cd94ff" : "#abdbea"}" stroke-width="4" stroke-linecap="round"/></g>
      <path d="m117 81-5 10 10 1Z" fill="#4d5a53"/>
      <path d="m101 98 29 1m-22-6v10m7-9v10m7-10v10" stroke="#697365" stroke-width="2"/>
      <path d="m127 36-9 13 7 7" stroke="#758476" stroke-width="2"/>
      ${enemy.boss ? `<path d="m86 43-4-25 20 9 16-22 13 22 24-12-6 30Z" fill="#c2a05c" stroke="#8f7445" stroke-width="2"/><path d="m91 43 54 2" stroke="#f6d594" stroke-width="4"/><path d="m116 29 5-7 6 7-6 7Z" fill="#b593db"/>` : ""}
    `, `<linearGradient id="bone-skull" x2=".7" y2="1"><stop stop-color="#ede1bd"/><stop offset="1" stop-color="#a1af9d"/></linearGradient><linearGradient id="bone-blade" x2="1" y2=".2"><stop stop-color="#c6c5b1"/><stop offset="1" stop-color="#87938c"/></linearGradient>`);
  }

  function demonArtwork(enemy) {
    return svgFrame(`
      <path d="M82 101Q34 64 17 82l14 21-15 27 20-1-11 32 30-11 23 14M157 99q49-39 69-18l-16 21 15 26-20-1 12 32-30-10-31 14" fill="url(#demon-wing)" stroke="#493344" stroke-width="3"/>
      <path d="m79 111-46-18 20 41-18 14m122-36 47-22-21 44 19 11" stroke="${enemy.color}" stroke-opacity=".45" stroke-width="3"/>
      <path d="M161 182q65 20 41-36l-10-14 14 1 6 14q21 63-52 50" fill="${enemy.color}" stroke="#563239" stroke-width="3"/>
      <path d="m91 170-10 27 7 23-19 13 3 7 28-3 6-15-5-25 12-24m14 0 15 23-5 25 10 17 26 1 2-7-22-15 4-23-12-25" fill="url(#demon-body)" stroke="#573642" stroke-width="4"/>
      <path d="m72 235 5-9 8 8m62 1 6-9 8 9" fill="#ddc5a2" stroke="#694858" stroke-width="2"/>
      <path d="M83 102q31-18 65 1l7 38-15 37-20 13-31-17-16-34Z" fill="url(#demon-body)" stroke="#583340" stroke-width="4"/>
      <path d="m93 117 21 12 11-1 18-14m-30 18-3 39m-14-28 13 5m15-7 13-6" stroke="#f3af83" stroke-opacity=".4" stroke-width="3"/>
      <path d="m103 176 19 7 13-7" stroke="#442e3c" stroke-width="7"/>
      <path d="m79 103-20 30-8 34 12 10 12-40 14-19m60-14 19 30 4 35-13 8-5-40-12-21" fill="url(#demon-body)" stroke="#583340" stroke-width="4"/>
      <path d="m51 163-12 9-2 17 10-6 3 10 8-10 8 6 2-16m94-10 12 7 7 17-10-5-1 10-8-8-7 5-3-16" fill="${enemy.color}" stroke="#583340" stroke-width="3"/>
      <path d="m38 187 1-10 5 5m6 9 2-10 4 4m116 3-2-11 6 5" stroke="#f0d2ac" stroke-width="3" stroke-linecap="round"/>
      <path d="M90 57q-23-3-24-36-15 41 14 54m61-18q24-5 27-37 12 43-16 57" fill="url(#demon-horn)" stroke="#775b57" stroke-width="3"/>
      <path d="m76 51-4 13m-2-21-4 10m90-4 6 12m4-17 3 9" stroke="#eed1a580" stroke-width="2"/>
      <path d="M87 53q28-25 60 1l8 29-13 24-23 13-26-16-14-21Z" fill="url(#demon-body)" stroke="#583340" stroke-width="4"/>
      <path d="m82 67-16-6 9 26 14 2m61-22 16-8-8 26-12 4" fill="${enemy.color}" stroke="#583340" stroke-width="3"/>
      <path d="m89 74 21 6-2 9-16-4m34-5 20-8-3 14-16 3" fill="#402737"/>
      <g class="monster-eye"><path d="m94 80 10 2m28 0 9-3" stroke="#ffe9a8" stroke-width="4" stroke-linecap="round"/></g>
      <path d="m118 79-5 13 10 1" stroke="#934b46" stroke-width="3"/>
      <path d="m101 98q17 7 33-2l-7 14-18 1Z" fill="#4b2633"/>
      <path d="m105 101 4 6 3-5m12-1 3 5 4-7" fill="#eed6ac"/>
      <path d="m114 57 6-12 7 13-7 10Z" fill="#ffd08d"/>
      ${enemy.boss ? `<path d="m83 47-5-22 19 10 20-23 19 22 21-12-6 24" fill="#493344" stroke="#d29e63" stroke-width="3"/><path d="m99 114 20 14 24-14-5 14-18 9-18-9Z" fill="#433442" stroke="#b89067" stroke-width="2"/><circle cx="119" cy="132" r="4" fill="#f8c074"/><path d="m76 110-9-17 17 4m68 1 20-7-11 20" fill="#e2c6a3"/>` : ""}
    `, `<linearGradient id="demon-body" x2=".8" y2="1"><stop stop-color="#e9a17c"/><stop offset=".35" stop-color="${enemy.color}"/><stop offset="1" stop-color="#85445a"/></linearGradient><linearGradient id="demon-wing" x2=".5" y2="1"><stop stop-color="#784656"/><stop offset="1" stop-color="#3e3044"/></linearGradient><linearGradient id="demon-horn" x2=".6" y2="1"><stop stop-color="#eddbb6"/><stop offset="1" stop-color="#a68b7b"/></linearGradient>`);
  }

  function sceneArtwork(zone) {
    const sparks = Array.from({ length: 22 }, (_, i) => {
      const x = (i * 137 + 48) % 1200;
      const y = (i * 73 + 54) % 350;
      return `<circle class="spark" cx="${x}" cy="${y}" r="${i % 3 ? 1.3 : 2.1}" fill="${zone === 0 ? "#c2df9b" : zone === 1 ? "#a7c6ed" : "#ffb16b"}" style="animation-delay:-${i % 5}s"/>`;
    }).join("");
    let scene;
    if (zone === 0) {
      scene = `
        <rect width="1200" height="400" fill="url(#scene-bg)"/>
        <circle cx="710" cy="87" r="51" fill="#d5e1b8" opacity=".12"/><circle cx="710" cy="87" r="37" fill="#e2e9c8" opacity=".18"/>
        <path d="m648 0-91 306 70-23L735 0m32 0-47 296 101-19L837 0" fill="#b7d3a4" opacity=".025"/>
        <path d="M0 286q115-33 226-5t240-14 241 4 257-4 236 9v114H0Z" fill="#1e3d39"/>
        <g fill="#284b46" opacity=".7"><path d="M184 0h18l-2 147 41-25-41 48 6 106h-30l8-114-42-52 41 29ZM1016 0h15l9 116 53-35-51 60 10 129h-33l3-127-39-50 34 29Z"/><path d="M355 0h19l-5 114 37-30-36 50 8 145h-33l11-139-30-45 30 20ZM866 0h23l-8 150 44-35-43 59 8 99h-35l11-142-35-50 33 29Z"/></g>
        <g fill="#122e2d"><path d="M64 0h53l-8 93 76-65-68 91-10 163 37 40H45l32-43 5-150-61-62 60 31ZM1092 0h54l-5 113 59-38-61 64-5 131 39 51h-112l42-48 8-129-69-64 69 34Z"/><path d="m514 0 32 0-5 90 60-31-60 53-11 176h-29l19-188-52-46 53 26ZM755 0h25l-8 104 43-22-44 42-2 158h-32l18-171-43-52 45 30Z"/></g>
        <g fill="#0c2427"><path d="M0 0h28l8 191 66 87-68-42 15 164H0ZM1171 0h29v400h-42l17-165-64 56 64-91Z"/><path d="M0 0h1200v21q-95 51-179 10-65 56-141 1-68 28-123-11-62 60-141 8-66 50-132 2-95 65-169 0-104 45-170-5-65 44-145 4Z"/></g>
        <path d="M0 351q80-24 153-7t209-1 226 10 226-6 221 2 165-12v63H0Z" fill="#162e30"/>
        <g fill="#6c8f6a" opacity=".5"><path d="m90 329-10-26 18 14 2-25 6 26 15-7-9 20Zm938 20-14-28 19 15 4-29 6 27 15-10-11 25ZM302 318l-9-17 12 6 4-17 5 16 13-9-10 21Z"/></g>
        <g fill="#c1b28b" opacity=".4"><path d="M172 309q8-16 25 0Z"/><path d="m182 310-1 9h6l-1-9"/><path d="M977 320q10-20 28 0Z"/><path d="m989 320-1 11h6l-1-11"/></g>`;
    } else if (zone === 1) {
      scene = `
        <rect width="1200" height="400" fill="url(#scene-bg)"/>
        <path d="M475 302V118q125-165 250 0v184Z" fill="#101d2b" stroke="#394352" stroke-width="20"/>
        <path d="M491 295V120q109-140 218 0v174" fill="none" stroke="#526077" stroke-opacity=".35" stroke-width="3"/>
        <path d="M565 300V140q35-49 70 0v160" fill="#8eb4d8" opacity=".06"/>
        <g stroke="#8b9cb2" stroke-opacity=".08" stroke-width="2"><path d="M0 90h459m284 0h457M0 160h462m271 0h467M0 230h462m270 0h468M0 298h1200"/><path d="M132 0v90m175 0v70M75 160v70m205 0v68M936 0v90m150 0v70m-223 0v70m166 0v68"/></g>
        <g fill="#354456" stroke="#506276" stroke-opacity=".3" stroke-width="2"><path d="M162 26h84v15h-84Zm13 15h60v229h-60Zm-9 229h78v17h-78Zm-6 17h90v18h-90Z"/><path d="M953 26h84v15h-84Zm13 15h60v229h-60Zm-9 229h78v17h-78Zm-6 17h90v18h-90Z"/></g>
        <g fill="#263446"><path d="M340 0h40v274h-40Zm470 0h40v274h-40ZM0 0h38v315H0Zm1162 0h38v315h-38Z"/></g>
        <path d="M0 314q155-30 299-10t275 1 311-7 315 13v89H0Z" fill="#1f303c"/>
        <path d="m470 400 101-95m153 95-92-95M0 354h1200" stroke="#758391" stroke-opacity=".1" stroke-width="2"/>
        <g fill="#57606a" opacity=".5"><path d="m86 317 58-17 54 15-11 14-96 4ZM1009 321l27-22 52 12 24 16-98 7ZM390 298l18-13 27 3 13 13Z"/></g>
        <g><circle cx="206" cy="148" r="38" fill="#91b8de" opacity=".04"/><circle cx="995" cy="148" r="38" fill="#91b8de" opacity=".04"/><path d="m197 173 18-1-2 18h-13Zm789 0 18-1-2 18h-13Z" fill="#6f8293"/><path d="M206 173q-17-16 0-43 13 19 0 43M995 173q-16-18 0-44 14 21 0 44" fill="#a1c5de" opacity=".7"/><path d="M206 170q-6-12 1-20 6 13-1 20M995 170q-6-12 1-20 6 13-1 20" fill="#def9ec"/></g>`;
    } else {
      scene = `
        <rect width="1200" height="400" fill="url(#scene-bg)"/>
        <circle cx="600" cy="168" r="165" fill="#d47144" opacity=".04"/><circle cx="600" cy="168" r="100" fill="#f48e48" opacity=".035"/>
        <path d="M0 253 111 183 159 240 272 138 363 241 475 198 568 250 664 180 802 246 915 153 1022 237 1110 178 1200 251v149H0Z" fill="#442c33"/>
        <path d="M479 301V143l41-15 16-46 24 20 39-72 40 72 25-20 17 47 40 14v159Z" fill="#322731" stroke="#7a4b4533" stroke-width="4"/>
        <path d="M550 293V163q49-60 100 0v130" fill="#1e1e2a"/>
        <path d="M569 292V175q30-34 60 0v117" fill="#d18145" opacity=".09"/>
        <path d="m0 336 147-27 129 29 165-21 153 29 171-17 155 21 155-31 125 7v74H0Z" fill="#30242e"/>
        <path d="m0 381 142-12 61 12 57-12 67 6 88-21 24 9 48-11 100 21 72-15 116 18 58-9 96 15 60-14 122 10 89-9" stroke="#f2925560" stroke-width="4"/>
        <path d="m0 385 142-12 61 12 57-12 67 6 88-21 24 9 48-11 100 21 72-15 116 18 58-9 96 15 60-14 122 10 89-9" stroke="#e2714240" stroke-width="12"/>
        <g fill="#201e2b"><path d="M0 0h71l-21 164 58 166-57-53-4 123H0ZM1124 0h76v400h-52l10-138-61 72 56-176Z"/><path d="m185 0 37 0 8 267h-61ZM959 0h41l23 280h-82Z"/></g>
        <g fill="#493140"><path d="m171 80-8-37 64-1 15 38Zm778-4-9-34 67-1 20 33Z"/><path d="m169 276 65 0 7 14-82 0Zm772 7 82-3 7 17-96 1Z"/></g>
        <g fill="#b75f42" opacity=".6"><path d="m94 327 11-24 10 23-10-8ZM1079 335l11-30 11 25-9-8Z"/><path d="m300 270 7-18 8 22-8-8ZM860 279l10-25 9 22-8-7Z"/></g>`;
    }
    const color = zone === 0 ? ["#294d42", "#152d31"] : zone === 1 ? ["#293447", "#142231"] : ["#542e31", "#201e2d"];
    return svgFrame(scene + sparks, `<linearGradient id="scene-bg" x2="0" y2="1"><stop stop-color="${color[0]}"/><stop offset="1" stop-color="${color[1]}"/></linearGradient>`, "0 0 1200 400").replace('<svg xmlns=', '<svg preserveAspectRatio="xMidYMid slice" xmlns=');
  }

  function startRun() {
    state = {
      phase: "ready", encounter: 0, defeated: 0, turn: 1,
      hp: 40, maxHp: 40, power: 0, ward: 0, healing: 0, critBonus: 3, recovery: 0,
      dice: [], selected: null, rerolls: 1, enemy: null,
      stats: { rolls: 0, damage: 0, criticals: 0 }, rewards: []
    };
    $("reward-overlay").hidden = true;
    $("end-overlay").hidden = true;
    $("hero-art").className = "character-art";
    $("hero-art").innerHTML = heroArtwork();
    $("hero-effects").replaceChildren();
    $("enemy-effects").replaceChildren();
    $("battle-log").replaceChildren();
    loadEncounter();
    log("Your expedition begins. Nine encounters. Three dice. Endless possibility.");
  }

  function loadEncounter() {
    const definition = encounters[state.encounter];
    state.enemy = { ...definition, maxHp: definition.hp, shield: 0 };
    state.phase = "ready";
    state.turn = 1;
    state.dice = [];
    state.selected = null;
    state.rerolls = 1;
    const zoneIndex = Math.floor(state.encounter / 3);
    const zone = zones[zoneIndex];
    $("zone-title").textContent = zone.title;
    $("area-label").textContent = zone.label;
    $("arena").className = `arena ${zone.className}`;
    $("scene-art").innerHTML = sceneArtwork(zoneIndex);
    $("enemy-name").textContent = definition.name;
    $("enemy-role").textContent = definition.role;
    $("enemy-icon").textContent = definition.boss ? "♛" : ["I", "II", "III"][zoneIndex];
    $("flavor-text").textContent = definition.flavor;
    $("enemy-art").className = `character-art ${definition.type}${definition.boss ? " boss" : ""}`;
    $("enemy-art").innerHTML = definition.type === "slime" ? slimeArtwork(definition) : definition.type === "skeleton" ? skeletonArtwork(definition) : demonArtwork(definition);
    $("ward-aura").classList.remove("visible");
    render();
  }

  function getIntent() {
    const [kind, base, name] = state.enemy.moves[(state.turn - 1) % state.enemy.moves.length];
    const rage = Math.floor((state.turn - 1) / 3);
    return { kind, value: kind === "guard" ? base : base + rage, name, rage };
  }

  function totals() {
    const result = { attack: 0, guard: 0, mend: 0, criticals: 0 };
    state.dice.forEach((die) => {
      if (die.assignment === "attack") {
        result.attack += die.value + state.power + (die.value === 6 ? state.critBonus : 0);
        if (die.value === 6) result.criticals++;
      } else if (die.assignment === "guard") result.guard += die.value + state.ward;
      else if (die.assignment === "mend") result.mend += die.value + state.healing;
    });
    return result;
  }

  function render() {
    const enemy = state.enemy;
    const intent = getIntent();
    $("hero-hp").innerHTML = `${state.hp} <small>/ ${state.maxHp}</small>`;
    $("enemy-hp").innerHTML = `${enemy.hp} <small>/ ${enemy.maxHp}${enemy.shield ? ` · ⬡ ${enemy.shield}` : ""}</small>`;
    $("hero-health-fill").style.width = `${state.hp / state.maxHp * 100}%`;
    $("enemy-health-fill").style.width = `${enemy.hp / enemy.maxHp * 100}%`;
    $("hero-power").textContent = `+${state.power} attack power`;
    $("hero-healing").textContent = `+${state.healing} healing`;
    $("hero-caption")?.setAttribute("title", `Attack +${state.power} per die. Guard +${state.ward} per die. Mend +${state.healing} per die. Critical bonus +${state.critBonus}.`);
    $("encounter-number").textContent = String(state.encounter + 1).padStart(2, "0");
    $("turn-counter").textContent = `TURN ${String(state.turn).padStart(2, "0")}${intent.rage ? ` · RAGE +${intent.rage}` : ""}`;
    $("route").innerHTML = encounters.map((encounter, i) => `${i ? '<span class="route-line"></span>' : ""}<span class="route-node${encounter.boss ? " boss" : ""}${i < state.defeated ? " done" : i === state.encounter ? " current" : ""}" aria-label="Encounter ${i + 1}: ${encounter.name}${i < state.defeated ? ", defeated" : i === state.encounter ? ", current" : ""}"${i === state.encounter ? ' aria-current="step"' : ""}><span>${i < state.defeated ? "✓" : encounter.boss ? "♛" : "·"}</span></span>`).join("");
    const intentIcon = intent.kind === "guard" ? "⬡" : intent.kind === "drain" ? "✦" : "⚔";
    const intentSuffix = intent.kind === "guard" ? `gains <strong>${intent.value}</strong> shield` : `<strong>${intent.value}</strong> damage${intent.kind === "drain" ? " + lifesteal" : ""}`;
    $("intent").innerHTML = `<span class="intent-icon">${intentIcon}</span><span>${intent.name} · ${intentSuffix}</span>`;
    const phase = state.phase;
    const badge = phase === "resolving" ? "BATTLE IN MOTION" : phase === "reward" || phase === "won" ? "VICTORY" : phase === "lost" ? "EXPEDITION ENDED" : "YOUR TURN";
    $("battle-badge").innerHTML = `<span></span> ${badge}`;
    renderDice();
    const values = totals();
    ["attack", "guard", "mend"].forEach((action) => {
      const assigned = state.dice.filter((die) => die.assignment === action);
      $(`${action}-value`).textContent = values[action];
      $(`${action}-dice`).textContent = assigned.length ? assigned.map((die) => die.value).join(" + ") + (action === "attack" && assigned.some((die) => die.value === 6) ? " · CRITICAL" : "") : "NO DICE";
      $(`${action}-dice`).classList.toggle("has-dice", assigned.length > 0);
      $(`assign-${action}`).disabled = phase !== "assign" || state.selected === null;
      $(`assign-${action}`).classList.toggle("active", assigned.length > 0);
      $(`assign-${action}`).setAttribute("aria-label", `${action}: ${values[action]} ${action === "guard" ? "block" : action === "mend" ? "healing" : "damage"}. Assign selected die.`);
    });
    const unassigned = state.dice.filter((die) => !die.assignment).length;
    const allAssigned = state.dice.length === 3 && unassigned === 0;
    $("main-button").disabled = phase !== "ready" && !(phase === "assign" && allAssigned);
    $("main-button-text").textContent = phase === "ready" ? "Roll the dice" : phase === "rolling" ? "Rolling…" : phase === "resolving" ? "Fighting…" : phase === "assign" ? "Make your move" : "Battle complete";
    $("reroll-button").disabled = phase !== "assign" || !state.rerolls || state.selected === null;
    $("reroll-button").innerHTML = `↻ Reroll selected <span>${state.rerolls} left</span>`;
    $("dice-caption").textContent = phase === "assign" ? state.selected !== null ? `DIE ${state.selected + 1} SELECTED · CHOOSE AN ACTION` : "ALL DICE ASSIGNED · READY TO FIGHT" : phase === "rolling" ? "FATE IS DECIDING…" : "THREE DICE. ONE DESTINY.";
    $("phase-title").textContent = phase === "ready" ? "Make your own luck." : phase === "assign" ? "Every die has a destiny." : phase === "rolling" ? "Let fortune fall." : phase === "resolving" ? "Your fate unfolds." : phase === "lost" ? "The dice will roll again." : "Fortune favors the brave.";
    $("phase-instruction").textContent = phase === "assign" ? unassigned ? `Select a die, then choose an action. ${unassigned} ${unassigned === 1 ? "die" : "dice"} still to assign.` : "All dice assigned. Make your move, or select a die to change it." : phase === "ready" ? "Roll 3 dice, then assign them to attack, guard, or mend." : phase === "rolling" ? "A little courage. A little luck." : phase === "resolving" ? "You act first. The surviving monster strikes next." : "An expedition is only the beginning.";
    const incoming = intent.kind === "guard" ? 0 : Math.max(0, intent.value - values.guard);
    const outgoing = Math.max(0, values.attack - enemy.shield);
    $("combat-preview").textContent = phase === "assign" ? `${outgoing} damage · ${Math.min(values.mend, state.maxHp - state.hp)} healing · ${outgoing >= enemy.hp ? "lethal — no counterattack!" : `${incoming} incoming damage`}` : "A roll of 6 on Attack adds +" + state.critBonus + " critical damage.";
  }

  function dieMarkup(value) {
    return `<span class="die-face" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<span${pipPositions[value].includes(i + 1) ? ' class="pip"' : ""}></span>`).join("")}</span>`;
  }

  function renderDice() {
    const dice = state.dice.length ? state.dice : [{ value: 5 }, { value: 6 }, { value: 3 }];
    $("dice-tray").innerHTML = dice.map((die, index) => `<button class="die${state.phase === "ready" ? " unrolled" : ""}${state.selected === index ? " selected" : ""}${state.phase === "rolling" && (state.rollingIndex === undefined || state.rollingIndex === index) ? " rolling" : ""}" data-index="${index}" data-value="${die.value}" aria-label="Die ${index + 1}: ${state.phase === "ready" ? "not rolled" : die.value}${die.assignment ? `, assigned to ${die.assignment}` : ""}" aria-pressed="${state.selected === index}"${state.phase !== "assign" ? " disabled" : ""}>${dieMarkup(die.value)}${die.assignment ? `<span class="die-assignment ${die.assignment}" aria-hidden="true">${icons[die.assignment]}</span>` : ""}</button>`).join("");
  }

  function log(message) {
    const entry = document.createElement("p");
    const mark = document.createElement("span");
    mark.className = "log-mark";
    mark.textContent = "›";
    entry.append(mark, message);
    $("battle-log").append(entry);
    while ($("battle-log").children.length > 3) $("battle-log").firstElementChild.remove();
  }

  function selectDie(index) {
    if (state.phase !== "assign" || !state.dice[index]) return;
    state.selected = index;
    render();
    $("dice-tray").children[index].focus({ preventScroll: true });
    playSound("select");
  }

  function assignDie(action) {
    if (state.phase !== "assign" || state.selected === null) return;
    state.dice[state.selected].assignment = action;
    const next = state.dice.findIndex((die) => !die.assignment);
    state.selected = next < 0 ? null : next;
    render();
    if (state.selected === null) $("main-button").focus({ preventScroll: true });
    else $("dice-tray").children[state.selected].focus({ preventScroll: true });
    playSound("select");
  }

  async function rollDice(reroll = false) {
    if (reroll ? state.phase !== "assign" || !state.rerolls || state.selected === null : state.phase !== "ready") return;
    const index = reroll ? state.selected : undefined;
    if (reroll) {
      state.rerolls--;
      state.dice[index].assignment = null;
    } else {
      state.dice = Array.from({ length: 3 }, () => ({ value: 1, assignment: null }));
      state.rerolls = 1;
    }
    state.phase = "rolling";
    state.rollingIndex = index;
    state.selected = null;
    render();
    playSound("roll");
    for (let frame = 0; frame < 9; frame++) {
      state.dice.forEach((die, i) => { if (index === undefined || i === index) die.value = rollDie(); });
      renderDice();
      await wait(65 + frame * 5);
    }
    state.stats.rolls += reroll ? 1 : 3;
    state.phase = "assign";
    state.selected = index === undefined ? 0 : index;
    delete state.rollingIndex;
    render();
    if ($("help-overlay").hidden) $("dice-tray").children[state.selected].focus({ preventScroll: true });
    log(reroll ? `Fortune tried again: die ${index + 1} rolled a ${state.dice[index].value}.` : `You rolled ${state.dice.map((die) => die.value).join(", ")}. Choose their fate.`);
  }

  function animate(id, className, duration = 550) {
    const element = $(id);
    element.classList.remove("strike", "enemy-strike", "hit");
    void element.offsetWidth;
    element.classList.add(className);
    setTimeout(() => { element.classList.remove(className); }, reducedMotion ? 30 : duration);
  }

  function floatNumber(target, value, kind = "", label = "") {
    const number = document.createElement("span");
    number.className = `floating-number ${kind}`;
    number.textContent = value;
    if (label) {
      const text = document.createElement("small");
      text.textContent = label;
      number.append(text);
    }
    $(`${target}-effects`).append(number);
    setTimeout(() => number.remove(), reducedMotion ? 100 : 1300);
  }

  async function resolveTurn() {
    if (state.phase !== "assign" || state.dice.length !== 3 || state.dice.some((die) => !die.assignment)) return;
    state.phase = "resolving";
    const values = totals();
    const intent = getIntent();
    const enemy = state.enemy;
    render();
    if (values.mend) {
      const healed = Math.min(state.maxHp - state.hp, values.mend);
      state.hp += healed;
      if (healed) {
        floatNumber("hero", `+${healed}`, "heal", "MEND");
        playSound("heal");
        log(`Your dice restore ${healed} health.`);
        render();
        await wait(550);
      }
    }
    if (values.guard) {
      $("ward-aura").classList.add("visible");
      playSound("block");
    }
    if (values.attack) {
      animate("hero-art", "strike");
      await wait(300);
      const blocked = Math.min(enemy.shield, values.attack);
      const damage = Math.min(enemy.hp, values.attack - blocked);
      enemy.shield -= blocked;
      enemy.hp -= damage;
      state.stats.damage += damage;
      state.stats.criticals += values.criticals;
      floatNumber("enemy", damage ? `−${damage}` : "BLOCK", damage ? values.criticals ? "critical" : "" : "block", values.criticals ? "CRITICAL" : "");
      animate("enemy-art", "hit");
      animate("arena", "impact", 350);
      playSound("hit");
      log(`${values.criticals ? "Critical strike! " : ""}You deal ${damage} damage${blocked ? ` (${blocked} absorbed by its shield)` : ""}.`);
      render();
      await wait(650);
    }
    if (enemy.hp <= 0) {
      await victory();
      return;
    }
    if (intent.kind === "guard") {
      enemy.shield += intent.value;
      floatNumber("enemy", `+${intent.value}`, "block", "SHIELD");
      playSound("block");
      log(`${enemy.name} gains ${intent.value} shield. Break it with your next attack.`);
      render();
      await wait(750);
    } else {
      animate("enemy-art", "enemy-strike");
      await wait(300);
      const blocked = Math.min(values.guard, intent.value);
      const damage = Math.min(state.hp, Math.max(0, intent.value - values.guard));
      state.hp -= damage;
      if (damage) {
        floatNumber("hero", `−${damage}`);
        animate("hero-art", "hit");
        animate("arena", "impact", 350);
        playSound("hit");
      } else {
        floatNumber("hero", "BLOCK", "block", "GUARDED");
        playSound("block");
      }
      log(`${enemy.name} uses ${intent.name}: ${damage} damage${blocked ? `, ${blocked} blocked` : ""}.`);
      render();
      await wait(650);
      if (intent.kind === "drain" && damage) {
        const healing = Math.min(enemy.maxHp - enemy.hp, Math.ceil(damage / 2));
        enemy.hp += healing;
        if (healing) {
          floatNumber("enemy", `+${healing}`, "heal", "LIFESTEAL");
          log(`${enemy.name} steals ${healing} health.`);
          render();
          await wait(500);
        }
      }
    }
    $("ward-aura").classList.remove("visible");
    if (state.hp <= 0) {
      state.phase = "lost";
      $("hero-art").classList.add("defeated");
      playSound("loss");
      render();
      await wait(650);
      showEnding(false);
      return;
    }
    state.turn++;
    state.phase = "ready";
    state.dice = [];
    state.selected = null;
    state.rerolls = 1;
    render();
    if ($("help-overlay").hidden) $("main-button").focus({ preventScroll: true });
  }

  async function victory() {
    state.defeated++;
    state.phase = state.defeated === encounters.length ? "won" : "reward";
    $("enemy-art").classList.add("defeated");
    $("ward-aura").classList.remove("visible");
    saveRecord();
    playSound("victory");
    log(`${state.enemy.name} falls. Fortune favors the brave.`);
    render();
    await wait(900);
    if (state.phase === "won") {
      showEnding(true);
      return;
    }
    const recovery = Math.min(state.maxHp - state.hp, 8 + state.recovery);
    state.hp += recovery;
    render();
    state.rewards = [...blessings];
    for (let i = state.rewards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.rewards[i], state.rewards[j]] = [state.rewards[j], state.rewards[i]];
    }
    state.rewards = state.rewards.slice(0, 3);
    $("reward-description").textContent = `${state.enemy.name} defeated. ${recovery ? `You recovered ${recovery} health. ` : ""}${state.defeated % 3 === 0 ? "A new chapter awaits beyond the shadows." : "The path ahead grows darker. You grow stronger."}`;
    $("reward-cards").innerHTML = state.rewards.map((reward, i) => `<button class="reward-card" data-reward="${i}"><span class="reward-icon" aria-hidden="true">${reward.icon}</span><h3>${reward.name}</h3><p>${reward.text}</p><span class="reward-tag">${reward.tag}</span></button>`).join("");
    closeHelp(false);
    $("reward-overlay").hidden = false;
    $("reward-cards").firstElementChild.focus({ preventScroll: true });
  }

  function chooseReward(index) {
    if (state.phase !== "reward" || !state.rewards[index]) return;
    const reward = state.rewards[index];
    reward.apply();
    state.rewards = [];
    state.encounter++;
    $("reward-overlay").hidden = true;
    loadEncounter();
    log(`${reward.name} received. ${state.enemy.name} blocks your path.`);
    playSound("heal");
    $("main-button").focus({ preventScroll: true });
  }

  function showEnding(won) {
    closeHelp(false);
    $("end-emblem").textContent = won ? "♛" : "◇";
    $("end-eyebrow").textContent = won ? "THE DARKNESS HAS FALLEN" : "THE END OF AN EXPEDITION";
    $("end-title").textContent = won ? "You defied the darkness." : "Not all luck lasts.";
    $("end-description").textContent = won ? "The Last Flame is extinguished. From the wilds to the ember throne, your courage shaped your fortune. The realm remembers." : `${state.enemy.name} ended this adventure. You defeated ${state.defeated} of 9 monsters. Every expedition teaches you something. Every roll is a new beginning.`;
    $("run-stats").innerHTML = [
      [state.defeated, "MONSTERS SLAIN"], [state.stats.damage, "DAMAGE DEALT"], [state.stats.criticals, "CRITICAL DICE"]
    ].map(([value, label]) => `<div class="run-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
    $("end-overlay").hidden = false;
    $("restart-button").focus({ preventScroll: true });
  }

  function openHelp() {
    if (!$("reward-overlay").hidden || !$("end-overlay").hidden) return;
    helpReturnFocus = document.activeElement;
    $("help-overlay").hidden = false;
    $("close-help").focus({ preventScroll: true });
  }

  function closeHelp(restoreFocus = true) {
    if ($("help-overlay").hidden) return;
    $("help-overlay").hidden = true;
    if (restoreFocus) {
      const target = helpReturnFocus?.isConnected && !helpReturnFocus.disabled ? helpReturnFocus : $("help-button");
      target.focus({ preventScroll: true });
    }
  }

  $("main-button").addEventListener("click", () => {
    if (state.phase === "ready") void rollDice();
    else if (state.phase === "assign") void resolveTurn();
  });
  $("reroll-button").addEventListener("click", () => { void rollDice(true); });
  $("dice-tray").addEventListener("click", (event) => {
    const die = event.target.closest(".die");
    if (die) selectDie(Number(die.dataset.index));
  });
  ["attack", "guard", "mend"].forEach((action) => {
    $(`assign-${action}`).addEventListener("click", () => assignDie(action));
  });
  $("reward-cards").addEventListener("click", (event) => {
    const card = event.target.closest("[data-reward]");
    if (card) chooseReward(Number(card.dataset.reward));
  });
  $("restart-button").addEventListener("click", () => {
    startRun();
    $("main-button").focus({ preventScroll: true });
  });
  $("sound-button").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    renderSoundButton();
    if (soundEnabled) playSound("select");
  });
  $("help-button").addEventListener("click", openHelp);
  $("close-help").addEventListener("click", () => closeHelp());
  $("help-play-button").addEventListener("click", () => closeHelp());
  $("help-overlay").addEventListener("click", (event) => {
    if (event.target === $("help-overlay")) closeHelp();
  });
  document.addEventListener("keydown", (event) => {
    const overlay = ["help-overlay", "reward-overlay", "end-overlay"].map($).find((element) => !element.hidden);
    if (overlay) {
      if (event.key === "Escape" && overlay.id === "help-overlay") {
        event.preventDefault();
        closeHelp();
      }
      if (event.key === "Tab") {
        const buttons = [...overlay.querySelectorAll("button:not(:disabled)")];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (["1", "2", "3"].includes(key) && state.phase === "assign") {
      event.preventDefault();
      selectDie(Number(key) - 1);
    } else if (["a", "g", "m"].includes(key) && state.phase === "assign") {
      event.preventDefault();
      assignDie({ a: "attack", g: "guard", m: "mend" }[key]);
    } else if (key === "r" && state.phase === "assign") {
      event.preventDefault();
      void rollDice(true);
    } else if (key === " " && (event.target === document.body || event.target === $("main-button") || event.target.closest(".die"))) {
      event.preventDefault();
      if (state.phase === "ready") void rollDice();
      else if (state.phase === "assign") void resolveTurn();
    }
  });

  readRecord();
  startRun();
})();
