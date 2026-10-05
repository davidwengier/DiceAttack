(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_DICE = 6;
  const RUN_LENGTH = 15;
  const SHOP_INTERVAL = 5;
  const diceTiers = {
    base: { name: "Base", icon: "◇", bonus: 0, priceMultiplier: 1 },
    gold: { name: "Gold", icon: "✦", bonus: 2, priceMultiplier: 1.8 },
    diamond: { name: "Diamond", icon: "♦", bonus: 4, priceMultiplier: 2.8 }
  };
  const diceTypes = {
    attack: { name: "Attack Die", label: "ATTACK", icon: "⚔", price: 18, text: "Deal your roll as damage. Sixes add +3 critical damage, improved by Loaded Fate." },
    guard: { name: "Guard Die", label: "GUARD", icon: "⬡", price: 14, text: "Block your roll's worth of damage this turn. Moonward adds +1 per level." },
    mend: { name: "Heal Die", label: "HEAL", icon: "✚", price: 16, text: "Restore your roll's worth of health. Lifebloom adds +1 per level." },
    venom: { name: "Venom Die", label: "VENOM", icon: "❧", price: 22, text: "Add half your roll, rounded up, as poison. Poison bypasses shields and ticks before the enemy acts." },
    flame: { name: "Flame Die", label: "FLAME", icon: "✦", price: 26, text: "Deal your roll +2 damage, ignoring shields. Ember Edge also increases this damage." },
    blood: { name: "Blood Die", label: "BLOOD", icon: "♡", price: 28, text: "Deal your roll as damage and restore half your roll, rounded up. Attack and healing skills both help." },
    fortune: { name: "Fortune Die", label: "FORTUNE", icon: "◈", price: 18, text: "Earn your roll in gold and block half your roll, rounded up. Moonward improves the block." }
  };
  const abilities = {
    fireball: { name: "Ember Bolt", icon: "✦", price: 24, text: "Deal 10 damage ignoring shields. One free cast per battle." },
    salve: { name: "Healing Spring", icon: "✚", price: 22, text: "Restore 14 health. One free cast per battle." },
    freeze: { name: "Frost Seal", icon: "❄", price: 26, text: "Freeze the enemy, skipping its next action. One free cast per battle." }
  };
  const skills = {
    power: { name: "Ember Edge", icon: "⚔", price: 14, max: 3, text: "+1 damage per Attack, Blood, and Flame die.", apply: () => { state.power++; } },
    ward: { name: "Moonward", icon: "⬡", price: 12, max: 3, text: "+1 block per Guard and Fortune die.", apply: () => { state.ward++; } },
    healing: { name: "Lifebloom", icon: "✚", price: 12, max: 3, text: "+1 healing per Heal and Blood die.", apply: () => { state.healing++; } },
    vitality: { name: "Lionheart", icon: "♡", price: 16, max: 3, text: "+8 maximum health and restore 8 health now.", apply: () => { state.maxHp += 8; state.hp = Math.min(state.maxHp, state.hp + 8); } },
    critical: { name: "Loaded Fate", icon: "✦", price: 14, max: 3, text: "+2 extra damage on Attack rolls of six.", apply: () => { state.critBonus += 2; } },
    recovery: { name: "Second Wind", icon: "❧", price: 16, max: 3, text: "Recover 4 extra health after each victory. Heal 4 now.", apply: () => { state.recovery += 4; state.hp = Math.min(state.maxHp, state.hp + 4); } },
    luck: { name: "Lucky Fingers", icon: "↻", price: 22, max: 1, text: "A second reroll on every turn.", apply: () => { state.extraRerolls = 1; } },
    loot: { name: "Treasure Hunter", icon: "◈", price: 18, max: 3, text: "+25% kill gold per level, rounded up.", apply: () => { state.lootBonus += .25; } }
  };
  const pipPositions = {
    1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9]
  };
  const zones = [
    { title: "The Whispering Wilds", label: "CHAPTER I · THE WILDS", className: "forest" },
    { title: "The Hollow Catacombs", label: "CHAPTER II · THE CATACOMBS", className: "crypt" },
    { title: "The Ember Throne", label: "CHAPTER III · THE INFERNO", className: "inferno" }
  ];
  const monsters = [
    { name: "Moss Slime", zone: 0, type: "slime", color: "#8acb86", moves: [["attack", 1, "Sticky slap"], ["attack", 1.2, "Slime splash"], ["guard", .8, "Gel shell"]] },
    { name: "Briar Slime", zone: 0, type: "slime", color: "#9ebd60", thorns: true, moves: [["attack", 1, "Briar lash"], ["heavy", 1.4, "Thorn burst"], ["guard", .8, "Barkskin"]] },
    { name: "Moonfang Wolf", zone: 0, type: "wolf", color: "#899aab", moves: [["attack", 1, "Snap"], ["heavy", 1.4, "Moonfang bite"], ["attack", .8, "Pounce"]] },
    { name: "Silkfang Spider", zone: 0, type: "spider", color: "#9877a2", moves: [["attack", .8, "Venom bite"], ["guard", 1, "Silken armor"], ["heavy", 1.4, "Fang lunge"]] },
    { name: "Sporeling", zone: 0, type: "slime", color: "#cc9cba", mushroom: true, moves: [["drain", .8, "Spore siphon"], ["attack", 1, "Cap bash"], ["guard", .7, "Spore cloud"]] },
    { name: "Mossstone Golem", zone: 0, type: "golem", color: "#718c73", moves: [["guard", 1, "Stone skin"], ["heavy", 1.4, "Boulder fist"], ["attack", .8, "Rumble"]] },
    { name: "Slime Sovereign", zone: 0, type: "slime", color: "#71c7b2", boss: true, moves: [["attack", 1, "Royal splash"], ["guard", 1, "Royal jelly"], ["heavy", 1.4, "King's crush"]] },
    { name: "The Thorn Matriarch", zone: 0, type: "spider", color: "#af7f9c", boss: true, moves: [["heavy", 1.3, "Royal fangs"], ["drain", .8, "Brood hunger"], ["guard", 1, "Thorn cocoon"]] },
    { name: "Bonewalker", zone: 1, type: "skeleton", moves: [["attack", 1, "Rusty slash"], ["heavy", 1.3, "Bone cleaver"], ["guard", .8, "Bone barrier"]] },
    { name: "Crypt Sentinel", zone: 1, type: "skeleton", armored: true, moves: [["guard", 1, "Iron bulwark"], ["attack", 1, "Sentinel strike"], ["heavy", 1.4, "Gravebreaker"]] },
    { name: "Lantern Wraith", zone: 1, type: "wraith", color: "#88a8ce", moves: [["drain", .8, "Soul whisper"], ["attack", 1, "Phantom touch"], ["heavy", 1.3, "Haunting"]] },
    { name: "Graveweaver", zone: 1, type: "spider", color: "#7b879d", moves: [["guard", 1, "Grave silk"], ["attack", 1.1, "Bone bite"], ["heavy", 1.3, "Web strike"]] },
    { name: "Runestone Guardian", zone: 1, type: "golem", color: "#8393aa", moves: [["heavy", 1.3, "Rune smash"], ["guard", 1.1, "Runic barrier"], ["attack", .9, "Stone palm"]] },
    { name: "Dusk Acolyte", zone: 1, type: "cultist", color: "#83709f", moves: [["drain", .8, "Dark prayer"], ["guard", .9, "Veil"], ["heavy", 1.4, "Dusk bolt"]] },
    { name: "The Hollow King", zone: 1, type: "skeleton", boss: true, armored: true, moves: [["attack", 1, "Cursed blade"], ["guard", 1, "Crown's ward"], ["heavy", 1.4, "Death sentence"]] },
    { name: "Lady of Lost Souls", zone: 1, type: "wraith", color: "#ba98dc", boss: true, moves: [["drain", 1, "Devour memory"], ["heavy", 1.3, "Soul tempest"], ["guard", .9, "Spectral veil"]] },
    { name: "Ember Imp", zone: 2, type: "demon", color: "#cf755b", moves: [["attack", 1, "Fire claw"], ["drain", .8, "Soul sip"], ["heavy", 1.3, "Ember storm"]] },
    { name: "Ashborn Reaver", zone: 2, type: "demon", color: "#b8697b", moves: [["heavy", 1.3, "Rift strike"], ["guard", .9, "Obsidian hide"], ["drain", 1, "Soul harvest"]] },
    { name: "Obsidian Gargoyle", zone: 2, type: "golem", color: "#827c91", wings: true, moves: [["guard", 1.1, "Obsidian shell"], ["heavy", 1.3, "Dive crush"], ["attack", 1, "Stone talons"]] },
    { name: "Cinder Wolf", zone: 2, type: "wolf", color: "#bd8a73", moves: [["heavy", 1.3, "Blazing bite"], ["attack", 1, "Cinder claw"], ["drain", .8, "Blood hunger"]] },
    { name: "Rift Specter", zone: 2, type: "wraith", color: "#c287a1", moves: [["drain", .9, "Rift siphon"], ["guard", .8, "Void shroud"], ["heavy", 1.4, "Reality tear"]] },
    { name: "Flame Cultist", zone: 2, type: "cultist", color: "#b16b65", moves: [["attack", 1, "Flame chant"], ["heavy", 1.4, "Pyre blast"], ["guard", .9, "Ash ward"]] },
    { name: "Azrath, Last Flame", zone: 2, type: "demon", color: "#cd6249", boss: true, moves: [["attack", 1, "Hellfire"], ["drain", .9, "Devour hope"], ["guard", 1, "Infernal aegis"], ["heavy", 1.4, "Last flame"]] },
    { name: "The Ash Titan", zone: 2, type: "golem", color: "#ab7b70", wings: true, boss: true, moves: [["heavy", 1.5, "Worldbreaker"], ["guard", 1, "Molten armor"], ["drain", .9, "Ember hunger"]] }
  ];
  const omens = [
    { name: "Gilded Skies", text: "+4 gold from every kill", gold: 4 },
    { name: "Lifebloom Mist", text: "+1 healing from Heal and Blood dice", healing: 1 },
    { name: "Iron Moon", text: "+1 block from Guard and Fortune dice", ward: 1 },
    { name: "Ember Stars", text: "+1 damage from Attack, Blood, and Flame dice", power: 1 },
    { name: "Lucky Constellation", text: "+2 critical damage on Attack sixes", critical: 2 },
    { name: "Gentle Rain", text: "+4 health recovered after each victory", recovery: 4 }
  ];
  const shuffle = (items) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  function generateRun() {
    const health = [8, 10, 12, 15, 23, 27, 33, 39, 45, 60, 54, 63, 72, 83, 115];
    const damage = [1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11, 13];
    return zones.flatMap((zone, zoneIndex) => {
      const regulars = shuffle(monsters.filter((monster) => monster.zone === zoneIndex && !monster.boss)).slice(0, 4);
      const boss = shuffle(monsters.filter((monster) => monster.zone === zoneIndex && monster.boss))[0];
      return [...regulars, boss].map((monster, slot) => {
        const index = zoneIndex * SHOP_INTERVAL + slot;
        const elite = zoneIndex > 0 && !monster.boss && Math.random() < .3;
        const gold = 19 + index * 2 + (monster.boss ? 12 : 0) + (elite ? 6 : 0);
        return {
          ...monster, name: `${elite ? "Frenzied " : ""}${monster.name}`, elite,
          hp: Math.round(health[index] * (.94 + Math.random() * .12) * (elite ? 1.1 : 1)),
          gold: gold + Math.floor(Math.random() * 4),
          role: monster.boss ? "CHAPTER GUARDIAN" : elite ? "FRENZIED CREATURE" : ["CREATURE OF THE WILDS", "RESTLESS DARKNESS", "INFERNAL CREATURE"][zoneIndex],
          flavor: monster.boss ? "The guardian of this chapter stands before you." : ["A different path. A new danger beneath the trees.", "Something forgotten moves in the darkness.", "The rift has many horrors. This is one of them."][zoneIndex],
          moveOffset: Math.floor(Math.random() * monster.moves.length),
          moves: monster.moves.map(([kind, factor, name]) => [kind, Math.max(1, Math.round(damage[index] * factor) + (elite && kind !== "guard" ? 1 : 0)), name])
        };
      });
    });
  }
  let state;
  let best = 0;
  let soundEnabled = false;
  let audio;
  let helpReturnFocus;
  let resetReturnFocus;
  let runSerial = 0;
  let toastTimer;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reducedMotion ? Math.min(ms, 25) : ms));
  const rollDie = () => Math.floor(Math.random() * 6) + 1;

  function notify(message, severity = "info") {
    $("toast").textContent = message;
    $("toast").dataset.severity = severity;
    $("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $("toast").hidden = true; }, 5500);
  }

  function clearInfoToast() {
    if ($("toast").dataset.severity !== "error") {
      clearTimeout(toastTimer);
      $("toast").hidden = true;
    }
  }

  function readRecord() {
    try {
      const stored = Number(localStorage.getItem("diceattack-roguelike-best"));
      best = Number.isInteger(stored) && stored >= 0 && stored <= RUN_LENGTH ? stored : 0;
    } catch (error) {
      console.warn("Dice Attack cannot read local expedition records.", error);
      notify("Your browser has blocked save data. You can still play, but records won't be saved.", "error");
    }
    updateRecord();
  }

  function updateRecord() {
    $("record").innerHTML = `BEST EXPEDITION <b>${best ? `${best} / ${RUN_LENGTH}` : "—"}</b>`;
  }

  function saveRecord() {
    if (state.defeated <= best) return;
    best = state.defeated;
    updateRecord();
    try {
      localStorage.setItem("diceattack-roguelike-best", String(best));
    } catch (error) {
      console.warn("Dice Attack cannot save the expedition record.", error);
      notify("Your new record could not be saved. Browser storage is unavailable.", "error");
    }
  }

  function playSound(kind) {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      soundEnabled = false;
      renderSoundButton();
      notify("Sound is not supported by this browser.", "error");
      return;
    }
    if (!audio) audio = new AudioContextClass();
    if (audio.state === "suspended") {
      audio.resume().catch((error) => {
        console.warn("Dice Attack audio could not start.", error);
        soundEnabled = false;
        renderSoundButton();
        notify("Sound could not start. The game will continue without audio.", "error");
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

  function creatureArtwork(enemy) {
    const color = enemy.color;
    const defs = `<linearGradient id="creature-body" x2=".8" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#364556"/></linearGradient><radialGradient id="creature-glow"><stop stop-color="#e5ffd6"/><stop offset="1" stop-color="${color}"/></radialGradient>`;
    if (enemy.type === "wolf") return svgFrame(`
      <path d="M65 180Q16 185 26 149l22 10 27-23" fill="${color}" stroke="#34404e" stroke-width="4"/>
      <path d="m72 164-14 44-12 20 30-1 15-36 17-16m39-8 17 41-4 19 31 1-9-19-9-52" fill="url(#creature-body)" stroke="#34404e" stroke-width="4"/>
      <path d="M63 114q28-31 79-18l41 52-18 40-45-5-42 15-25-28Z" fill="url(#creature-body)" stroke="#34404e" stroke-width="4"/>
      <path d="m82 118-22 1 12 14-22 2 18 15-14 13 29 11 13-23" fill="${color}" stroke="#34404e" stroke-width="3"/>
      <path d="m142 55-9-29 30 15 27-15-4 37 12 46-24 35-33-13-21-37Z" fill="url(#creature-body)" stroke="#34404e" stroke-width="4"/>
      <path d="m143 49-3-15 16 10m22 2 6-11-2 18" stroke="#dfbbba" stroke-width="6"/>
      <path d="m145 80 13 4m15-2 12-5" stroke="#f5e8ae" stroke-width="5" stroke-linecap="round"/>
      <path d="m162 92 25 8-12 26-27-3-8-13Z" fill="#b9b9a7" stroke="#52616a" stroke-width="3"/>
      <path d="m166 99 15 3-9 9Z" fill="#263b45"/><path d="m151 118 22 1" stroke="#263b45" stroke-width="3"/>
      <path d="m153 121 3 8 4-8m7-1 4 7 3-8" fill="#e8e5cd"/>
      <path d="m65 227 4-6m-13 6 4-6m122 5-2-6m9 6-3-6" stroke="#d3d7c5" stroke-width="3"/>
    `, defs);
    if (enemy.type === "spider") return svgFrame(`
      <g stroke="#33424c" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
        <path d="m89 144-44-38-25 51m63-2-52-4-17 42m70-29-49 24 1 32m114-73 43-41 27 51m-62-1 53-8 19 44m-75-27 49 23-1 34"/>
      </g>
      <g stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <path d="m89 144-44-38-25 51m63-2-52-4-17 42m70-29-49 24 1 32m114-73 43-41 27 51m-62-1 53-8 19 44m-75-27 49 23-1 34"/>
      </g>
      <ellipse cx="119" cy="121" rx="51" ry="54" fill="url(#creature-body)" stroke="#33424c" stroke-width="4"/>
      <path d="m120 80 16 23-16 30-17-30Z" fill="#d9bba8" opacity=".6"/>
      <ellipse cx="120" cy="173" rx="44" ry="32" fill="${color}" stroke="#33424c" stroke-width="4"/>
      <g class="monster-eye" fill="#f5d59c"><circle cx="106" cy="166" r="7"/><circle cx="135" cy="166" r="7"/><circle cx="94" cy="156" r="4"/><circle cx="147" cy="156" r="4"/></g>
      <path d="m103 188-8 17 16-8m25-10 8 18-16-8" fill="#e3d6b9" stroke="#56616b" stroke-width="2"/>
      ${enemy.boss ? '<path d="m90 91-5-22 24 8 11-21 12 20 21-9-3 25Z" fill="#e1bb76" stroke="#927444" stroke-width="3"/>' : ""}
    `, defs);
    if (enemy.type === "golem") return svgFrame(`
      ${enemy.wings ? `<path d="M77 108 24 58 18 129l26-13-8 47 44-25m82-30 54-50 6 72-25-14 5 48-43-28" fill="#595469" stroke="#353548" stroke-width="4"/>` : ""}
      <path d="m85 171-15 53 36 9 13-51m8-1 6 48 37-5-17-54" fill="url(#creature-body)" stroke="#303e49" stroke-width="5"/>
      <path d="m71 104 48-16 52 14 6 70-34 23-46-4-32-24Z" fill="url(#creature-body)" stroke="#303e49" stroke-width="5"/>
      <path d="m78 106-29 1-20 36 1 43 35 1 11-45m90-37 29 3 17 38-1 42-31-1-9-48" fill="${color}" stroke="#303e49" stroke-width="5"/>
      <path d="m47 135 13 6m-21 24 20 1m123-27 17-4m-16 33 22-1" stroke="#d5d0bc50" stroke-width="3"/>
      <path d="m85 42 32-10 40 13 7 48-32 18-45-14-9-29Z" fill="url(#creature-body)" stroke="#303e49" stroke-width="5"/>
      <path d="m94 65 18 5m17-1 18-5" stroke="${enemy.zone === 2 ? "#ffd18d" : "#d0f5bc"}" stroke-width="6" stroke-linecap="round"/>
      <path d="m105 90 30-1m-39-47 12 13-3 10m44 26-11-7" stroke="#35434e" stroke-width="4"/>
      <path d="m119 122 16 20-16 27-16-27Z" fill="url(#creature-glow)"/><path d="m119 132 7 10-7 14-6-14Z" fill="#f0ffdf"/>
      ${enemy.boss ? '<path d="m91 39-4-24 22 9 12-17 13 18 20-10-1 27" fill="#c1a075" stroke="#82634e" stroke-width="3"/>' : ""}
    `, defs);
    if (enemy.type === "wraith") return svgFrame(`
      <ellipse cx="120" cy="225" rx="66" ry="13" fill="${color}" opacity=".12"/>
      <path d="M92 91q-38 15-41 59l25-16-3 52-31 42 39-10 11 16 30-18 21 19 20-17 35 9-24-49-11-68Z" fill="url(#creature-body)" stroke="#51647c" stroke-width="3" opacity=".9"/>
      <path d="m87 146-7 54 17-12 7 20 18-22 22 20-1-36" stroke="#bed9dd" stroke-opacity=".3" stroke-width="3"/>
      <path d="M79 88q6-54 42-58 37 8 45 60l-12 46-35 18-32-22Z" fill="${color}" stroke="#51647c" stroke-width="3"/>
      <path d="M92 88q4-39 29-42 26 10 31 43l-13 40-20 9-21-12Z" fill="#243244"/>
      <g class="monster-eye"><path d="m102 89 10 3m15 0 12-3" stroke="#edffdb" stroke-width="5" stroke-linecap="round"/></g>
      <path d="m111 117 7-7 7 7" stroke="#94bccc" stroke-width="3"/>
      <path d="m67 129-26 15-13 27 17 10 22-24m100-30 27 17 14 26-17 11-22-24" fill="${color}" stroke="#51647c" stroke-width="3"/>
      ${enemy.boss ? '<path d="m93 49-3-21 19 9 13-23 11 23 17-7-1 24" fill="#c8a878" stroke="#917556" stroke-width="3"/>' : ""}
    `, defs);
    return svgFrame(`
      <path d="M87 104q-23 24-28 125l40-8 22 14 24-14 36 8q-5-96-33-127Z" fill="url(#creature-body)" stroke="#35364b" stroke-width="4"/>
      <path d="m84 139-12 75 26-9 22 13 23-13 23 11-11-79" stroke="#dec69855" stroke-width="3"/>
      <path d="M85 85q2-49 36-60 32 15 34 61l-16 40-37-1Z" fill="${color}" stroke="#35364b" stroke-width="4"/>
      <path d="M96 83q1-26 25-41 25 19 23 43l-9 29-28-1Z" fill="#263043"/>
      <path d="m105 87 11 2m11 0 10-3" stroke="#e8d7a4" stroke-width="4" stroke-linecap="round"/>
      <path d="m118 123-1 68" stroke="#d4b988" stroke-width="5"/><circle cx="120" cy="143" r="8" fill="#e5c185"/>
      <path d="m82 121-26 29 10 21 23-21m58-27 22 19 10-1" stroke="${color}" stroke-width="17" stroke-linecap="round"/>
      <path d="m179 222 3-115" stroke="#a18a70" stroke-width="7"/>
      <path d="m181 111-15-16 15-17 15 17Z" fill="url(#creature-glow)" stroke="#cfc096" stroke-width="3"/>
      <circle cx="181" cy="94" r="6" fill="#efffce"/>
    `, defs);
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
    clearInfoToast();
    state = {
      id: ++runSerial, code: Math.random().toString(36).slice(2, 6).padEnd(4, "0").toUpperCase(),
      encounters: generateRun(), omens: shuffle(omens).slice(0, 3),
      phase: "ready", encounter: 0, defeated: 0, turn: 1, gold: 0,
      hp: 40, maxHp: 40, power: 0, ward: 0, healing: 0, critBonus: 3, recovery: 0,
      extraRerolls: 0, lootBonus: 0, collection: [{ type: "attack", tier: "base" }], dice: [],
      selected: null, rerolls: 1, enemy: null, abilities: [], usedAbilities: new Set(), skills: {},
      stats: { rolls: 0, damage: 0, criticals: 0, earned: 0 }, stock: [], shopFilter: "all", refreshed: false
    };
    ["shop-overlay", "end-overlay", "reset-overlay", "help-overlay"].forEach((id) => { $(id).hidden = true; });
    $("hero-art").className = "character-art";
    $("hero-art").innerHTML = heroArtwork();
    $("hero-effects").replaceChildren();
    $("enemy-effects").replaceChildren();
    $("battle-log").replaceChildren();
    loadEncounter();
    log("One attack die. A different path. The first shop awaits after five victories.");
  }

  function loadEncounter() {
    const definition = state.encounters[state.encounter];
    state.enemy = { ...definition, maxHp: definition.hp, shield: 0, poison: 0, frozen: false };
    state.phase = "ready";
    state.turn = 1;
    state.dice = [];
    state.selected = null;
    state.rerolls = 1 + state.extraRerolls;
    state.usedAbilities = new Set();
    const zoneIndex = Math.floor(state.encounter / SHOP_INTERVAL);
    const zone = zones[zoneIndex];
    $("zone-title").textContent = zone.title;
    $("area-label").textContent = zone.label;
    $("arena").className = `arena ${zone.className}`;
    $("scene-art").innerHTML = sceneArtwork(zoneIndex);
    $("enemy-name").textContent = definition.name.replace(/^Frenzied /, "");
    $("enemy-name").title = definition.name;
    $("enemy-role").textContent = definition.role;
    $("enemy-icon").textContent = definition.boss ? "♛" : ["I", "II", "III"][zoneIndex];
    $("flavor-text").textContent = definition.flavor;
    $("enemy-art").className = `character-art ${definition.type}${definition.boss ? " boss" : ""}`;
    $("enemy-art").innerHTML = definition.type === "slime" ? slimeArtwork(definition) : definition.type === "skeleton" ? skeletonArtwork(definition) : definition.type === "demon" ? demonArtwork(definition) : creatureArtwork(definition);
    if (definition.mushroom) {
      $("enemy-art").querySelector("svg").insertAdjacentHTML("beforeend", '<path d="M56 105q13-83 69-75 49 3 64 74Z" fill="#af677f" stroke="#663f62" stroke-width="4"/><g fill="#edccbe"><ellipse cx="90" cy="75" rx="11" ry="7"/><ellipse cx="138" cy="53" rx="9" ry="6"/><ellipse cx="163" cy="88" rx="10" ry="7"/></g>');
    }
    $("ward-aura").classList.remove("visible");
    render();
  }

  function getIntent() {
    const [kind, base, name] = state.enemy.moves[(state.turn - 1 + state.enemy.moveOffset) % state.enemy.moves.length];
    const rage = Math.floor((state.turn - 1) / 3);
    return { kind, value: kind === "guard" ? base : base + rage, name, rage };
  }

  function totals() {
    const result = { attack: 0, guard: 0, mend: 0, criticals: 0, pierce: 0, poison: 0, gold: 0 };
    const omen = currentOmen();
    const power = state.power + (omen.power || 0);
    const ward = state.ward + (omen.ward || 0);
    const healing = state.healing + (omen.healing || 0);
    state.dice.forEach((die) => {
      const value = die.value + diceTiers[die.tier].bonus;
      if (die.type === "attack") {
        result.attack += value + power + (die.value === 6 ? state.critBonus + (omen.critical || 0) : 0);
        if (die.value === 6) result.criticals++;
      } else if (die.type === "guard") result.guard += value + ward;
      else if (die.type === "mend") result.mend += value + healing;
      else if (die.type === "flame") result.pierce += value + 2 + power;
      else if (die.type === "venom") result.poison += Math.ceil(value / 2);
      else if (die.type === "blood") { result.attack += value + power; result.mend += Math.ceil(value / 2) + healing; }
      else if (die.type === "fortune") { result.gold += value; result.guard += Math.ceil(value / 2) + ward; }
    });
    return result;
  }

  function currentOmen() {
    return state.omens[Math.floor(state.encounter / SHOP_INTERVAL)];
  }

  function addGold(amount) {
    state.gold += amount;
    state.stats.earned += amount;
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
    $("gold-counter").innerHTML = `◈ <b>${state.gold}</b>`;
    $("gold-counter").setAttribute("aria-label", `${state.gold} gold`);
    const omen = currentOmen();
    const untilShop = SHOP_INTERVAL - state.defeated % SHOP_INTERVAL;
    $("run-note").textContent = `RUN ${state.code} · ${omen.name}: ${omen.text} · ${state.encounter >= 10 ? "FINAL CHAPTER" : `SHOP IN ${untilShop} ${untilShop === 1 ? "VICTORY" : "VICTORIES"}`}`;
    $("turn-counter").textContent = `TURN ${String(state.turn).padStart(2, "0")}${intent.rage ? ` · RAGE +${intent.rage}` : ""}`;
    $("route").innerHTML = state.encounters.map((encounter, i) => `${i ? '<span class="route-line"></span>' : ""}<span class="route-node${encounter.boss ? " boss" : ""}${i < state.defeated ? " done" : i === state.encounter ? " current" : ""}" aria-label="Encounter ${i + 1}: ${encounter.name}${i < state.defeated ? ", defeated" : i === state.encounter ? ", current" : ""}"${i === state.encounter ? ' aria-current="step"' : ""}><span>${i < state.defeated ? "✓" : encounter.boss ? "♛" : "·"}</span></span>`).join("");
    const intentIcon = intent.kind === "guard" ? "⬡" : intent.kind === "drain" ? "✦" : "⚔";
    const intentSuffix = intent.kind === "guard" ? `gains <strong>${intent.value}</strong> shield` : `<strong>${intent.value}</strong> damage${intent.kind === "drain" ? " + lifesteal" : ""}`;
    $("intent").innerHTML = `<span class="intent-icon">${intentIcon}</span><span>${enemy.frozen ? "FROZEN · next action skipped" : `${intent.name} · ${intentSuffix}`}${enemy.poison ? ` · ❧ ${enemy.poison}` : ""}</span>`;
    const phase = state.phase;
    const badge = phase === "resolving" ? "BATTLE IN MOTION" : ["victory", "shop", "won"].includes(phase) ? "VICTORY" : phase === "lost" ? "EXPEDITION ENDED" : "YOUR TURN";
    $("battle-badge").innerHTML = `<span></span> ${badge}`;
    renderDice();
    const values = totals();
    ["attack", "guard", "mend"].forEach((action) => {
      const value = action === "attack" ? values.attack + values.pierce : values[action];
      $(`${action}-value`).textContent = value;
      $(`${action}-dice`).textContent = phase === "ready" ? "ROLL TO REVEAL" : action === "attack" && values.criticals ? `${values.criticals} CRITICAL ${values.criticals === 1 ? "DIE" : "DICE"}` : value ? "AUTOMATIC EFFECT" : "NO CONTRIBUTION";
      $(`${action}-dice`).classList.toggle("has-dice", value > 0);
      $(`summary-${action}`).classList.toggle("active", value > 0);
    });
    $("special-effects").innerHTML = `${values.pierce ? `<span>✦ ${values.pierce} piercing damage</span>` : ""}${values.poison ? `<span>❧ +${values.poison} poison</span>` : ""}${values.gold ? `<span>◈ +${values.gold} gold</span>` : ""}`;
    $("main-button").disabled = !["ready", "rolled"].includes(phase);
    $("reset-button").disabled = ["rolling", "resolving", "victory"].includes(phase);
    $("main-button-text").textContent = phase === "ready" ? state.collection.length === 1 ? "Roll your die" : "Roll your dice" : phase === "rolling" ? "Rolling…" : phase === "resolving" ? "Fighting…" : phase === "rolled" ? "Make your move" : "Battle complete";
    $("reroll-button").disabled = phase !== "rolled" || !state.rerolls || state.selected === null;
    $("reroll-button").innerHTML = `↻ Reroll selected <span>${state.rerolls} left</span>`;
    $("dice-count").textContent = `${state.collection.length} / ${MAX_DICE}`;
    $("dice-caption").textContent = phase === "rolled" ? "SELECT A DIE TO REROLL, OR MAKE YOUR MOVE" : phase === "rolling" ? "FATE IS DECIDING…" : "BUILD YOUR COLLECTION AT THE NEXT SHOP";
    $("die-description").textContent = state.selected !== null ? dieDescription(state.dice[state.selected]) : "Base · Gold +2 · Diamond +4. Each die keeps its own effect.";
    $("phase-title").textContent = phase === "ready" ? "Make your own luck." : phase === "rolled" ? "Your collection. Your destiny." : phase === "rolling" ? "Let fortune fall." : phase === "resolving" ? "Your fate unfolds." : phase === "lost" ? "The dice will roll again." : "Fortune favors the brave.";
    $("phase-instruction").textContent = phase === "rolled" ? "Your dice effects are ready. Reroll one, cast an ability, or make your move." : phase === "ready" ? `Roll ${state.collection.length === 1 ? "your attack die" : `your ${state.collection.length} specialized dice`}. Earn gold to grow your collection.` : phase === "rolling" ? "A little courage. A little luck." : phase === "resolving" ? "Your dice act first. A surviving monster strikes next." : "An expedition is only the beginning.";
    const incoming = intent.kind === "guard" || enemy.frozen ? 0 : Math.max(0, intent.value - values.guard);
    const outgoing = Math.max(0, values.attack - enemy.shield) + values.pierce;
    const poison = Math.min(12, enemy.poison + values.poison);
    $("combat-preview").textContent = phase === "rolled" ? `${outgoing} damage${poison ? ` + ${poison} poison` : ""} · ${Math.min(values.mend, state.maxHp - state.hp)} healing · ${outgoing + poison >= enemy.hp ? "lethal — no counterattack!" : `${incoming} incoming damage`}` : "Each die keeps its own role. Attack sixes deal bonus damage.";
    renderAbilities();
    $("skill-list").innerHTML = Object.entries(state.skills).map(([key, level]) => `<span title="${skills[key].text}">${skills[key].icon} ${skills[key].name} ${level > 1 ? `×${level}` : ""}</span>`).join("");
  }

  function dieMarkup(value) {
    return `<span class="die-face" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<span${pipPositions[value].includes(i + 1) ? ' class="pip"' : ""}></span>`).join("")}</span>`;
  }

  function dieName(die) {
    return `${diceTiers[die.tier].name} ${diceTypes[die.type].name}`;
  }

  function dieDescription(die) {
    const tier = diceTiers[die.tier];
    return `${dieName(die)}: ${diceTypes[die.type].text}${tier.bonus ? ` ${tier.name} adds +${tier.bonus} to the roll before calculating its effects.` : ""}${die.value !== undefined ? ` Rolled ${die.value}${tier.bonus ? ` + ${tier.bonus} = ${die.value + tier.bonus}` : ""}.` : ""}`;
  }

  function renderDice() {
    const dice = state.dice.length ? state.dice : state.collection.map((die) => ({ ...die, value: 6 }));
    $("dice-tray").innerHTML = dice.map((die, index) => {
      const tier = diceTiers[die.tier];
      return `<button class="die type-${die.type} tier-${die.tier}${state.phase === "ready" ? " unrolled" : ""}${state.selected === index ? " selected" : ""}${state.phase === "rolling" && (state.rollingIndex === undefined || state.rollingIndex === index) ? " rolling" : ""}" data-index="${index}" data-type="${die.type}" data-tier="${die.tier}" data-value="${die.value}" title="${dieDescription(state.phase === "ready" ? state.collection[index] : die)}" aria-label="${dieName(die)} ${index + 1}: ${state.phase === "ready" ? "not rolled" : `${die.value}${tier.bonus ? ` plus ${tier.bonus} tier bonus` : ""}`}" aria-pressed="${state.selected === index}"${state.phase !== "rolled" ? " disabled" : ""}>${dieMarkup(die.value)}${tier.bonus ? `<span class="die-tier-mark" aria-hidden="true">${tier.icon}<small>+${tier.bonus}</small></span>` : ""}<span class="die-assignment ${die.type}" aria-hidden="true">${diceTypes[die.type].icon}</span><span class="die-type-label" aria-hidden="true">${diceTypes[die.type].label}<small>${tier.name.toUpperCase()}</small></span></button>`;
    }).join("");
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
    if (state.phase !== "rolled" || !state.dice[index]) return;
    state.selected = index;
    render();
    $("dice-tray").children[index].focus({ preventScroll: true });
    playSound("select");
  }

  async function rollDice(reroll = false) {
    if (reroll ? state.phase !== "rolled" || !state.rerolls || state.selected === null : state.phase !== "ready") return;
    const run = state.id;
    const index = reroll ? state.selected : undefined;
    if (reroll) {
      state.rerolls--;
    } else {
      state.dice = state.collection.map((die) => ({ ...die, value: 1 }));
      state.rerolls = 1 + state.extraRerolls;
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
      if (state.id !== run) return;
    }
    state.stats.rolls += reroll ? 1 : state.dice.length;
    state.phase = "rolled";
    state.selected = index === undefined ? 0 : index;
    delete state.rollingIndex;
    render();
    if ($("help-overlay").hidden) $("dice-tray").children[state.selected].focus({ preventScroll: true });
    log(reroll ? `${dieName(state.dice[index])} rerolled: ${state.dice[index].value}.` : `Your dice rolled ${state.dice.map((die) => die.value).join(", ")}. Their effects are ready.`);
  }

  function animate(id, className, duration = 550) {
    const element = $(id);
    const run = state.id;
    element.classList.remove("strike", "enemy-strike", "hit");
    void element.offsetWidth;
    element.classList.add(className);
    setTimeout(() => { if (state.id === run) element.classList.remove(className); }, reducedMotion ? 30 : duration);
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
    if (state.phase !== "rolled" || state.dice.length !== state.collection.length) return;
    const run = state.id;
    state.phase = "resolving";
    const values = totals();
    const intent = getIntent();
    const enemy = state.enemy;
    if (values.gold) {
      addGold(values.gold);
      log(`Fortune dice earn ${values.gold} gold.`);
    }
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
        if (state.id !== run) return;
      }
    }
    if (values.guard) {
      $("ward-aura").classList.add("visible");
      playSound("block");
    }
    if (values.attack || values.pierce) {
      animate("hero-art", "strike");
      await wait(300);
      if (state.id !== run) return;
      const blocked = Math.min(enemy.shield, values.attack);
      const damage = Math.min(enemy.hp, values.attack - blocked + values.pierce);
      enemy.shield -= blocked;
      enemy.hp -= damage;
      state.stats.damage += damage;
      state.stats.criticals += values.criticals;
      floatNumber("enemy", damage ? `−${damage}` : "BLOCK", damage ? values.criticals ? "critical" : "" : "block", values.criticals ? "CRITICAL" : "");
      animate("enemy-art", "hit");
      animate("arena", "impact", 350);
      playSound("hit");
      log(`${values.criticals ? "Critical strike! " : ""}You deal ${damage} damage${blocked ? ` (${blocked} absorbed by its shield)` : ""}${values.pierce ? `, including ${values.pierce} piercing` : ""}.`);
      render();
      await wait(650);
      if (state.id !== run) return;
    }
    if (values.poison) enemy.poison = Math.min(12, enemy.poison + values.poison);
    if (enemy.hp > 0 && enemy.poison) {
      const damage = Math.min(enemy.hp, enemy.poison);
      enemy.hp -= damage;
      state.stats.damage += damage;
      enemy.poison = Math.max(0, enemy.poison - 1);
      floatNumber("enemy", `−${damage}`, "heal", "POISON");
      log(`Venom deals ${damage} damage through armor.`);
      render();
      await wait(500);
      if (state.id !== run) return;
    }
    if (enemy.hp <= 0) {
      await victory();
      return;
    }
    if (enemy.frozen) {
      enemy.frozen = false;
      floatNumber("enemy", "FROZEN", "block");
      log(`${enemy.name} is frozen and cannot act.`);
      render();
      await wait(500);
      if (state.id !== run) return;
    } else if (intent.kind === "guard") {
      enemy.shield += intent.value;
      floatNumber("enemy", `+${intent.value}`, "block", "SHIELD");
      playSound("block");
      log(`${enemy.name} gains ${intent.value} shield. Break it with your next attack.`);
      render();
      await wait(750);
      if (state.id !== run) return;
    } else {
      animate("enemy-art", "enemy-strike");
      await wait(300);
      if (state.id !== run) return;
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
      if (state.id !== run) return;
      if (intent.kind === "drain" && damage) {
        const healing = Math.min(enemy.maxHp - enemy.hp, Math.ceil(damage / 2));
        enemy.hp += healing;
        if (healing) {
          floatNumber("enemy", `+${healing}`, "heal", "LIFESTEAL");
          log(`${enemy.name} steals ${healing} health.`);
          render();
          await wait(500);
          if (state.id !== run) return;
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
      if (state.id !== run) return;
      showEnding(false);
      return;
    }
    state.turn++;
    state.phase = "ready";
    state.dice = [];
    state.selected = null;
    state.rerolls = 1 + state.extraRerolls;
    render();
    if ($("help-overlay").hidden) $("main-button").focus({ preventScroll: true });
  }

  async function victory() {
    const run = state.id;
    state.defeated++;
    state.phase = state.defeated === RUN_LENGTH ? "won" : "victory";
    const omen = currentOmen();
    const gold = Math.ceil(state.enemy.gold * (1 + state.lootBonus)) + (omen.gold || 0);
    addGold(gold);
    const recovery = Math.min(state.maxHp - state.hp, 8 + state.recovery + (omen.recovery || 0));
    state.hp += recovery;
    $("enemy-art").classList.add("defeated");
    $("ward-aura").classList.remove("visible");
    saveRecord();
    playSound("victory");
    log(`${state.enemy.name} falls. +${gold} gold${recovery ? `, +${recovery} health` : ""}.`);
    render();
    await wait(900);
    if (state.id !== run) return;
    if (state.phase === "won") {
      showEnding(true);
      return;
    }
    if (state.defeated % SHOP_INTERVAL === 0) {
      openShop(gold, recovery);
    } else {
      state.encounter++;
      loadEncounter();
      notify(`Victory! +${gold} gold${recovery ? ` · +${recovery} HP` : ""} · Shop in ${SHOP_INTERVAL - state.defeated % SHOP_INTERVAL} victories.`);
      if ($("help-overlay").hidden) $("main-button").focus({ preventScroll: true });
    }
  }

  function makeStock() {
    const types = ["attack", shuffle(["guard", "mend"])[0]];
    types.push(...shuffle(Object.keys(diceTypes).filter((key) => !types.includes(key))).slice(0, 2));
    const offers = [
      ...types.map((key) => ({ kind: "dice", key })),
      ...shuffle(Object.keys(abilities).filter((key) => !state.abilities.includes(key))).slice(0, 2).map((key) => ({ kind: "ability", key })),
      ...shuffle(Object.keys(skills).filter((key) => (state.skills[key] || 0) < skills[key].max)).slice(0, 4).map((key) => ({ kind: "skill", key }))
    ];
    state.stock = offers.map((offer) => {
      const item = itemDefinition(offer);
      return { ...offer, price: Math.max(1, item.price + Math.floor(Math.random() * 5) - 2 + (offer.kind === "skill" ? (state.skills[offer.key] || 0) * 6 : 0)), bought: false };
    });
  }

  function itemDefinition(offer) {
    return (offer.kind === "dice" ? diceTypes : offer.kind === "ability" ? abilities : skills)[offer.key];
  }

  function offerUnavailable(offer) {
    return (offer.kind !== "dice" && offer.bought) || (offer.kind === "dice" && state.collection.length >= MAX_DICE) ||
      (offer.kind === "ability" && state.abilities.includes(offer.key)) ||
      (offer.kind === "skill" && (state.skills[offer.key] || 0) >= skills[offer.key].max);
  }

  function offerPrice(offer, tier = "base") {
    return offer.kind === "dice" ? Math.round(offer.price * diceTiers[tier].priceMultiplier) : offer.price;
  }

  function openShop(gold, recovery) {
    clearInfoToast();
    state.phase = "shop";
    state.shopFilter = "all";
    state.refreshed = false;
    makeStock();
    closeHelp(false);
    $("shop-description").textContent = `Five enemies defeated. ${state.enemy.name} dropped ${gold} gold${recovery ? ` and you recovered ${recovery} health` : ""}. A new chapter lies ahead. Spend your spoils wisely.`;
    $("shop-overlay").hidden = false;
    render();
    renderShop();
    $("shop-overlay").querySelector(".shop-modal").scrollTop = 0;
    $("leave-shop").focus({ preventScroll: true });
  }

  function renderShop() {
    $("shop-purse").innerHTML = `◈ <b>${state.gold}</b><small>GOLD TO SPEND</small>`;
    const levels = Object.values(state.skills).reduce((a, b) => a + b, 0);
    $("shop-status").textContent = `♡ ${state.hp} / ${state.maxHp} HP · ${state.collection.length} / ${MAX_DICE} dice · ${state.abilities.length} ${state.abilities.length === 1 ? "ability" : "abilities"} · ${levels} skill ${levels === 1 ? "level" : "levels"}`;
    $("shop-tabs").querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === state.shopFilter)));
    const visible = state.stock.map((offer, index) => ({ offer, index })).filter(({ offer }) => state.shopFilter === "all" || offer.kind === state.shopFilter);
    $("shop-stock").innerHTML = visible.length ? visible.map(({ offer, index }) => {
      const item = itemDefinition(offer);
      const unavailable = offerUnavailable(offer);
      if (offer.kind === "dice") {
        const owned = state.collection.filter((die) => die.type === offer.key).length;
        const variants = Object.entries(diceTiers).map(([key, tier]) => {
          const price = offerPrice(offer, key);
          const count = state.collection.filter((die) => die.type === offer.key && die.tier === key).length;
          const disabled = unavailable || state.gold < price;
          return `<button class="variant-buy variant-${key}" data-offer="${index}" data-tier="${key}" aria-label="Buy ${tier.name} ${item.name} for ${price} gold. Owned ${count}.${unavailable ? " Collection full." : state.gold < price ? " Not enough gold." : ""}"${disabled ? " disabled" : ""}><span class="variant-icon" aria-hidden="true">${tier.icon}</span><span class="variant-copy"><strong>${tier.name}</strong><small>${tier.bonus ? `+${tier.bonus} power` : "Standard power"} · Owned ${count}</small></span><span class="variant-price">${unavailable ? "FULL" : `◈ ${price}`}</span></button>`;
        }).join("");
        return `<div class="shop-card dice-shop-card type-${offer.key}"><span class="shop-card-icon">${item.icon}</span><span class="shop-card-kind">SPECIALIZED DIE · OWNED ${owned}</span><h3>${item.name}</h3><p>${item.text}</p><div class="variant-options">${variants}</div><span class="repeat-purchase-note">BUY MULTIPLE · EACH COPY ROLLS SEPARATELY</span></div>`;
      }
      const owned = offer.kind === "skill" ? state.skills[offer.key] || 0 : state.abilities.includes(offer.key) ? 1 : 0;
      const status = offer.bought ? "PURCHASED" : unavailable ? "MAXED / OWNED" : state.gold < offer.price ? "NEED MORE GOLD" : `BUY · ◈ ${offer.price}`;
      return `<button class="shop-card${offer.bought ? " purchased" : ""}" data-offer="${index}"${unavailable || state.gold < offer.price ? " disabled" : ""}><span class="shop-card-icon">${item.icon}</span><span class="shop-card-kind">${offer.kind === "ability" ? "ACTIVE ABILITY · ONCE / BATTLE" : "PERMANENT SKILL"}${owned ? ` · OWNED ${owned}` : ""}</span><h3>${item.name}</h3><p>${item.text}</p><span class="shop-price">${status}${!unavailable && state.gold < offer.price ? ` · ◈ ${offer.price}` : ""}</span></button>`;
    }).join("") : '<p class="empty-stock">You already know all the abilities on offer. Browse dice or skills.</p>';
    $("refresh-shop").disabled = state.refreshed || state.gold < 5;
    $("refresh-shop").textContent = state.refreshed ? "↻ Stock refreshed" : "↻ New stock · 5 gold";
    $("shop-rest").disabled = state.gold < 8 || state.hp === state.maxHp;
  }

  function buyOffer(index, tier = "base") {
    const offer = state.stock[index];
    if (state.phase !== "shop" || !offer) return;
    if (offer.kind === "dice" && !Object.hasOwn(diceTiers, tier)) {
      notify("That dice variant is not available.");
      return;
    }
    const price = offerPrice(offer, tier);
    if (offerUnavailable(offer) || state.gold < price) {
      notify("That purchase is unavailable. Check your gold and collection limit.");
      return;
    }
    state.gold -= price;
    if (offer.kind === "dice") state.collection.push({ type: offer.key, tier });
    else if (offer.kind === "ability") { offer.bought = true; state.abilities.push(offer.key); }
    else {
      offer.bought = true;
      state.skills[offer.key] = (state.skills[offer.key] || 0) + 1;
      skills[offer.key].apply();
    }
    log(`${offer.kind === "dice" ? dieName({ type: offer.key, tier }) : itemDefinition(offer).name} purchased for ${price} gold.`);
    playSound("heal");
    render();
    renderShop();
    const repeatButton = $("shop-stock").querySelector(`[data-offer="${index}"][data-tier="${tier}"]:not(:disabled)`);
    (repeatButton || $("leave-shop")).focus({ preventScroll: true });
  }

  function leaveShop() {
    if (state.phase !== "shop") return;
    $("shop-overlay").hidden = true;
    state.encounter++;
    loadEncounter();
    log(`A new chapter. ${state.collection.length} dice at your side.`);
    $("main-button").focus({ preventScroll: true });
  }

  function renderAbilities() {
    $("ability-bar").innerHTML = state.abilities.length ? state.abilities.map((key) => {
      const used = state.usedAbilities.has(key);
      const disabled = used || !["ready", "rolled"].includes(state.phase) || (key === "salve" && state.hp === state.maxHp);
      return `<button class="ability-button" data-ability="${key}" title="${abilities[key].text}"${disabled ? " disabled" : ""}><span>${abilities[key].icon}</span><strong>${abilities[key].name}</strong><small>${used ? "USED" : key === "salve" && state.hp === state.maxHp ? "FULL HP" : "READY"}</small></button>`;
    }).join("") : '<p class="empty-abilities">Buy abilities at the shop after five victories. Each refreshes every battle.</p>';
  }

  async function castAbility(key) {
    if (!state.abilities.includes(key) || state.usedAbilities.has(key) || !["ready", "rolled"].includes(state.phase)) return;
    if (key === "salve" && state.hp === state.maxHp) return;
    const run = state.id;
    const previousPhase = state.phase;
    state.usedAbilities.add(key);
    state.phase = "resolving";
    if (key === "fireball") {
      const damage = Math.min(10, state.enemy.hp);
      state.enemy.hp -= damage;
      state.stats.damage += damage;
      floatNumber("enemy", `−${damage}`, "critical", "EMBER BOLT");
      animate("enemy-art", "hit");
      playSound("hit");
      log(`Ember Bolt deals ${damage} damage through shields.`);
    } else if (key === "salve") {
      const healing = Math.min(14, state.maxHp - state.hp);
      state.hp += healing;
      floatNumber("hero", `+${healing}`, "heal");
      playSound("heal");
      log(`Healing Spring restores ${healing} health.`);
    } else {
      state.enemy.frozen = true;
      floatNumber("enemy", "FROZEN", "block");
      playSound("block");
      log("Frost Seal freezes the enemy's next action.");
    }
    render();
    await wait(600);
    if (state.id !== run) return;
    if (state.enemy.hp <= 0) { await victory(); return; }
    state.phase = previousPhase;
    render();
    if ($("help-overlay").hidden) $("main-button").focus({ preventScroll: true });
  }

  function showEnding(won) {
    closeHelp(false);
    $("end-emblem").textContent = won ? "♛" : "◇";
    $("end-eyebrow").textContent = won ? "THE DARKNESS HAS FALLEN" : "THE END OF AN EXPEDITION";
    $("end-title").textContent = won ? "You defied the darkness." : "Not all luck lasts.";
    $("end-description").textContent = won ? `All fifteen enemies defeated. Your ${state.collection.length}-dice collection overcame the final guardian. Another path, another shop, and another build await in your next run.` : `${state.enemy.name} ended this adventure. You defeated ${state.defeated} of ${RUN_LENGTH} monsters. New enemies, omens, and merchant stock await your next run.`;
    $("run-stats").innerHTML = [
      [state.defeated, "MONSTERS SLAIN"], [state.stats.damage, "DAMAGE DEALT"], [state.stats.earned, "GOLD EARNED"]
    ].map(([value, label]) => `<div class="run-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
    $("end-overlay").hidden = false;
    $("restart-button").focus({ preventScroll: true });
  }

  function openHelp() {
    if (!$("shop-overlay").hidden || !$("end-overlay").hidden || !$("reset-overlay").hidden) return;
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

  function openReset() {
    if (["rolling", "resolving", "victory"].includes(state.phase)) return;
    closeHelp(false);
    resetReturnFocus = document.activeElement;
    $("reset-overlay").hidden = false;
    $("cancel-reset").focus({ preventScroll: true });
  }

  function cancelReset() {
    $("reset-overlay").hidden = true;
    if (resetReturnFocus?.isConnected && !resetReturnFocus.disabled) resetReturnFocus.focus({ preventScroll: true });
    else $("reset-button").focus({ preventScroll: true });
  }

  $("main-button").addEventListener("click", () => {
    if (state.phase === "ready") void rollDice();
    else if (state.phase === "rolled") void resolveTurn();
  });
  $("reroll-button").addEventListener("click", () => { void rollDice(true); });
  $("dice-tray").addEventListener("click", (event) => {
    const die = event.target.closest(".die");
    if (die) selectDie(Number(die.dataset.index));
  });
  $("ability-bar").addEventListener("click", (event) => {
    const button = event.target.closest("[data-ability]");
    if (button) void castAbility(button.dataset.ability);
  });
  $("shop-stock").addEventListener("click", (event) => {
    const card = event.target.closest("[data-offer]");
    if (card) buyOffer(Number(card.dataset.offer), card.dataset.tier || "base");
  });
  $("shop-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button || state.phase !== "shop") return;
    state.shopFilter = button.dataset.filter;
    renderShop();
    button.focus({ preventScroll: true });
  });
  $("refresh-shop").addEventListener("click", () => {
    if (state.phase !== "shop" || state.refreshed || state.gold < 5) return;
    state.gold -= 5;
    state.refreshed = true;
    makeStock();
    render();
    renderShop();
    $("leave-shop").focus({ preventScroll: true });
    playSound("roll");
  });
  $("shop-rest").addEventListener("click", () => {
    if (state.phase !== "shop" || state.gold < 8 || state.hp === state.maxHp) return;
    const healing = Math.min(12, state.maxHp - state.hp);
    state.gold -= 8;
    state.hp += healing;
    render();
    renderShop();
    $("leave-shop").focus({ preventScroll: true });
    playSound("heal");
    log(`Merchant tonic restores ${healing} health for 8 gold.`);
  });
  $("leave-shop").addEventListener("click", leaveShop);
  $("reset-button").addEventListener("click", openReset);
  $("shop-reset").addEventListener("click", openReset);
  $("cancel-reset").addEventListener("click", cancelReset);
  $("confirm-reset").addEventListener("click", () => {
    startRun();
    $("main-button").focus({ preventScroll: true });
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
    const overlay = ["reset-overlay", "help-overlay", "shop-overlay", "end-overlay"].map($).find((element) => !element.hidden);
    if (overlay) {
      if (event.key === "Escape" && overlay.id === "help-overlay") {
        event.preventDefault();
        closeHelp();
      }
      if (event.key === "Escape" && overlay.id === "reset-overlay") {
        event.preventDefault();
        cancelReset();
      }
      if (event.key === "Tab") {
        const buttons = [...overlay.querySelectorAll("button:not(:disabled)")].filter((button) => button.getClientRects().length);
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (["1", "2", "3", "4", "5", "6"].includes(key) && state.phase === "rolled") {
      event.preventDefault();
      selectDie(Number(key) - 1);
    } else if (key === "r" && state.phase === "rolled") {
      event.preventDefault();
      void rollDice(true);
    } else if (key === " " && (event.target === document.body || event.target === $("main-button") || event.target.closest(".die"))) {
      event.preventDefault();
      if (state.phase === "ready") void rollDice();
      else if (state.phase === "rolled") void resolveTurn();
    }
  });

  readRecord();
  startRun();
})();
