(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_DICE = 6;
  const RUN_LENGTH = 31;
  const SHOP_INTERVAL = 5;
  const BATTLE_COUNT = RUN_LENGTH - Math.floor(RUN_LENGTH / SHOP_INTERVAL);
  const diceTiers = {
    base: { name: "Base", icon: "◇", bonus: 0, priceMultiplier: 1 },
    gold: { name: "Gold", icon: "✦", bonus: 2, priceMultiplier: 1.8 },
    diamond: { name: "Diamond", icon: "♦", bonus: 4, priceMultiplier: 2.8 },
    ruby: { name: "Ruby", icon: "◆", bonus: 6, priceMultiplier: 3.8 },
    emerald: { name: "Emerald", icon: "⬡", bonus: 8, priceMultiplier: 5 },
    obsidian: { name: "Obsidian", icon: "✧", bonus: 10, priceMultiplier: 6.5 }
  };
  const diceTypes = {
    attack: { name: "Attack Die", label: "ATTACK", icon: "⚔", price: 18, offensive: true, text: "Deal your roll as damage. Sixes add +3 critical damage, improved by Loaded Fate." },
    guard: { name: "Guard Die", label: "GUARD", icon: "⬡", price: 14, text: "Gain your roll's worth of shield. Unused shield lasts until spent or the battle ends. Moonward adds +1 per level." },
    mend: { name: "Heal Die", label: "HEAL", icon: "✚", price: 16, text: "Restore your roll's worth of health. Lifebloom adds +1 per level." },
    venom: { name: "Venom Die", label: "VENOM", icon: "❧", price: 22, offensive: true, text: "Add half your roll, rounded up, as poison. Poison bypasses shields and ticks before the enemy acts." },
    flame: { name: "Flame Die", label: "FLAME", icon: "✦", price: 26, offensive: true, text: "Deal your roll +2 damage, ignoring shields. Ember Edge also increases this damage." },
    blood: { name: "Blood Die", label: "BLOOD", icon: "♡", price: 28, offensive: true, text: "Deal your roll as damage and restore half your roll, rounded up. Attack and healing skills both help." },
    fortune: { name: "Fortune Die", label: "FORTUNE", icon: "◈", price: 18, text: "Earn your roll in gold and gain half your roll, rounded up, as lasting shield. Moonward improves the shield." },
    frost: { name: "Frost Die", label: "FROST", icon: "❄", price: 28, offensive: true, text: "Deal half your roll, rounded up, as piercing damage. Reduce the enemy's damage by that half-roll this turn. Ember Edge improves your damage." },
    lightning: { name: "Lightning Die", label: "LIGHTNING", icon: "ϟ", price: 30, offensive: true, text: "Deal your roll as damage. Natural rolls of 5 or 6 strike twice! Ember Edge applies to each strike." },
    bloom: { name: "Bloom Die", label: "BLOOM", icon: "❀", price: 24, text: "Heal half your roll, rounded up, and gain half, rounded down, as lasting shield. Healing and guard skills improve it." }
  };
  const abilities = {
    fireball: { name: "Ember Bolt", icon: "✦", price: 24, text: "Deal 10 damage ignoring shields. One free cast per battle." },
    salve: { name: "Healing Spring", icon: "✚", price: 22, text: "Restore 14 health. One free cast per battle." },
    freeze: { name: "Frost Seal", icon: "❄", price: 26, text: "Freeze the enemy, skipping its next action. One free cast per battle." }
  };
  const memberTypes = {
    knight: { name: "You", title: "THE DICEBOUND", role: "Knight", icon: "⚔", hp: 40, die: "attack", ability: null, joins: 0, color: "#b2d1a0", perk: "Attack sixes deal critical damage." },
    healer: { name: "Mira", title: "THE LIFEBLOOM", role: "Healer", icon: "✚", hp: 32, die: "blood", ability: "salve", joins: 4, color: "#a9dfc2", perk: "Her healing dice and Healing Spring mend the most injured living ally." },
    mage: { name: "Sol", title: "THE STARWEAVER", role: "Mage", icon: "✦", hp: 28, die: "flame", ability: "freeze", joins: 9, color: "#c6b1ef", perk: "+2 damage per offensive die. Frost Seal freezes a chosen enemy." }
  };
  const MEMBER_FIELDS = ["hp", "maxHp", "shield", "collection", "dice", "selected", "rerolls", "abilities", "usedAbilities"];
  const skills = {
    power: { name: "Ember Edge", icon: "⚔", price: 14, max: 3, text: "+1 damage per Attack, Blood, Flame, Frost, and Lightning strike.", apply: () => { state.power++; } },
    ward: { name: "Moonward", icon: "⬡", price: 12, max: 3, text: "+1 shield per Guard, Fortune, and Bloom die.", apply: () => { state.ward++; } },
    healing: { name: "Lifebloom", icon: "✚", price: 12, max: 3, text: "+1 healing per Heal, Blood, and Bloom die.", apply: () => { state.healing++; } },
    vitality: { name: "Lionheart", icon: "♡", price: 16, max: 3, text: "+8 maximum health for every party member. Restore 8 health each.", apply: () => { state.party.forEach((member) => { member.maxHp += 8; member.hp = Math.min(member.maxHp, member.hp + 8); }); } },
    critical: { name: "Loaded Fate", icon: "✦", price: 14, max: 3, text: "+2 extra damage on Attack rolls of six.", apply: () => { state.critBonus += 2; } },
    recovery: { name: "Second Wind", icon: "❧", price: 16, max: 3, text: "Recover 4 extra health after each kill. Heal every ally for 4 now.", apply: () => { state.recovery += 4; state.party.forEach((member) => { member.hp = Math.min(member.maxHp, member.hp + 4); }); } },
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
    { title: "The Ember Throne", label: "CHAPTER III · THE INFERNO", className: "inferno" },
    { title: "The Frostglass Peaks", label: "CHAPTER IV · THE FROSTLANDS", className: "frostlands" },
    { title: "The Sunken Kingdom", label: "CHAPTER V · THE DROWNED RUINS", className: "sunken" },
    { title: "The Astral Rift", label: "CHAPTER VI · THE STARLESS SKY", className: "astral" }
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
    { name: "The Ash Titan", zone: 2, type: "golem", color: "#ab7b70", wings: true, boss: true, moves: [["heavy", 1.5, "Worldbreaker"], ["guard", 1, "Molten armor"], ["drain", .9, "Ember hunger"]] },
    { name: "Frostfang Wolf", zone: 3, type: "wolf", color: "#b5dfea", moves: [["attack", 1, "Ice fang"], ["heavy", 1.3, "Whiteout pounce"], ["guard", .8, "Snow veil"]] },
    { name: "Crystal Wraith", zone: 3, type: "wraith", color: "#9bdcea", moves: [["drain", .8, "Frozen breath"], ["attack", 1.1, "Crystal shard"], ["guard", 1, "Ice mirror"]] },
    { name: "Glacier Golem", zone: 3, type: "golem", color: "#7ebbc9", moves: [["guard", 1, "Glacier shell"], ["heavy", 1.4, "Avalanche"], ["attack", .9, "Ice hammer"]] },
    { name: "The Winter Queen", zone: 3, type: "wraith", color: "#c4edff", boss: true, moves: [["heavy", 1.3, "Winter's fury"], ["drain", .9, "Cold embrace"], ["guard", 1, "Frozen crown"]] },
    { name: "Frostglass Colossus", zone: 3, type: "golem", color: "#98c9e2", boss: true, moves: [["guard", 1.1, "Crystal fortress"], ["heavy", 1.4, "Mountainbreaker"], ["attack", 1, "Glacial fist"]] },
    { name: "Tide Slime", zone: 4, type: "slime", color: "#65c5b1", moves: [["attack", 1, "Tidal splash"], ["drain", .9, "Undertow"], ["guard", .8, "Coral shell"]] },
    { name: "Drowned Knight", zone: 4, type: "skeleton", armored: true, color: "#70a89f", moves: [["guard", 1, "Barnacle armor"], ["attack", 1, "Sunken blade"], ["heavy", 1.3, "Anchor smash"]] },
    { name: "Abyssal Reaver", zone: 4, type: "demon", color: "#599eaa", moves: [["drain", .9, "Deep hunger"], ["heavy", 1.3, "Abyssal claw"], ["guard", .8, "Sea mist"]] },
    { name: "The Coral King", zone: 4, type: "golem", color: "#83bfb0", boss: true, moves: [["guard", 1.1, "Coral throne"], ["heavy", 1.4, "Crushing tide"], ["drain", .9, "Ocean's hunger"]] },
    { name: "Queen of the Deep", zone: 4, type: "wraith", color: "#89d6ca", boss: true, moves: [["drain", 1, "Drowned souls"], ["heavy", 1.3, "Maelstrom"], ["guard", .9, "Pearl veil"]] },
    { name: "Starfang Wolf", zone: 5, type: "wolf", color: "#b8a0dc", moves: [["heavy", 1.3, "Comet pounce"], ["attack", 1, "Starlight bite"], ["guard", .8, "Nebula veil"]] },
    { name: "Void Wraith", zone: 5, type: "wraith", color: "#b69eea", moves: [["drain", .9, "Star siphon"], ["guard", 1, "Event horizon"], ["heavy", 1.3, "Void pulse"]] },
    { name: "Riftborn Demon", zone: 5, type: "demon", color: "#a783ca", moves: [["attack", 1.1, "Rift claw"], ["heavy", 1.3, "Meteor strike"], ["guard", .9, "Cosmic shell"]] },
    { name: "The Comet Titan", zone: 5, type: "golem", color: "#b39aca", wings: true, boss: true, moves: [["heavy", 1.4, "Falling star"], ["guard", 1, "Meteor armor"], ["drain", .9, "Stellar hunger"]] },
    { name: "The Eclipse Herald", zone: 5, type: "demon", color: "#b990ce", boss: true, moves: [["drain", 1, "Eclipse"], ["heavy", 1.3, "Nightfall"], ["guard", 1, "Moonless ward"]] },
    { name: "The Starless Sovereign", zone: 5, type: "demon", color: "#d2abea", boss: true, final: true, moves: [["heavy", 1.3, "End of stars"], ["guard", 1, "Void crown"], ["drain", .9, "Consume the sky"], ["attack", 1, "Last light"]] }
  ];
  const omens = [
    { name: "Gilded Skies", text: "+4 gold from every kill", gold: 4 },
    { name: "Lifebloom Mist", text: "+1 healing from Heal, Blood, and Bloom dice", healing: 1 },
    { name: "Iron Moon", text: "+1 shield from Guard, Fortune, and Bloom dice", ward: 1 },
    { name: "Ember Stars", text: "+1 damage from Attack, Blood, Flame, Frost, and Lightning strikes", power: 1 },
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
    const health = [[8, 10, 12, 23], [27, 33, 39, 60], [54, 63, 72, 115], [80, 90, 105, 145], [110, 125, 140, 190], [140, 155, 175, 235]];
    const damage = [[1, 2, 2, 4], [5, 6, 7, 9], [8, 9, 10, 13], [9, 10, 11, 14], [10, 11, 12, 15], [11, 12, 13, 16]];
    const makeBattle = (monster, index, hp, attack) => {
      const elite = monster.zone > 0 && !monster.boss && Math.random() < .3;
      const gold = 19 + index * 2 + (monster.boss ? 12 : 0) + (elite ? 6 : 0);
      return {
        ...monster, kind: "battle", name: `${elite ? "Frenzied " : ""}${monster.name}`, elite,
        hp: Math.round(hp * (.94 + Math.random() * .12) * (elite ? 1.1 : 1)),
        gold: gold + Math.floor(Math.random() * 4),
        role: monster.final ? "FINAL GUARDIAN" : monster.boss ? "CHAPTER GUARDIAN" : elite ? "FRENZIED CREATURE" : "CREATURE OF THE " + zones[monster.zone].className.toUpperCase(),
        flavor: monster.final ? "Beyond the last market, the ruler of the rift awaits." : monster.boss ? "The guardian stands between you and a safe haven." : `A new danger awaits in ${zones[monster.zone].title}.`,
        moveOffset: Math.floor(Math.random() * monster.moves.length),
        moves: monster.moves.map(([kind, factor, name]) => [kind, Math.max(1, Math.round(attack * factor) + (elite && kind !== "guard" ? 1 : 0)), name])
      };
    };
    const route = zones.flatMap((zone, zoneIndex) => {
      const regulars = shuffle(monsters.filter((monster) => monster.zone === zoneIndex && !monster.boss)).slice(0, 3);
      const boss = shuffle(monsters.filter((monster) => monster.zone === zoneIndex && monster.boss && !monster.final))[0];
      const battles = [...regulars, boss].map((monster, slot) => {
        const index = zoneIndex * SHOP_INTERVAL + slot;
        return addEnemyGroup(makeBattle(monster, index, health[zoneIndex][slot], damage[zoneIndex][slot]), slot);
      });
      return [...battles, { kind: "shop", name: "The Wayfarer's Market", zone: zoneIndex }];
    });
    route.push(addEnemyGroup(makeBattle(monsters.find((monster) => monster.final), RUN_LENGTH - 1, 280, 19), 3));
    return route;
  }

  function addEnemyGroup(round, slot) {
    const count = round.zone === 0 ? 1 : round.zone === 1 ? slot === 0 ? 1 : 2 : slot === 3 ? 3 : slot === 0 ? 2 : 1 + Math.floor(Math.random() * 3);
    const candidates = shuffle(monsters.filter((monster) => monster.zone === round.zone && !monster.boss && !round.name.endsWith(monster.name)));
    const group = [{ ...round }];
    for (let i = 1; i < count; i++) {
      const monster = candidates[i - 1];
      const attack = Math.max(1, Math.round(Math.max(...round.moves.filter((move) => move[0] !== "guard").map((move) => move[1])) * .45));
      group.push({
        ...monster, kind: "battle", elite: false, hp: Math.max(5, Math.round(round.hp * (round.boss ? .25 : .4))),
        gold: Math.max(8, Math.round(round.gold * .45)), role: "GUARDIAN ESCORT", flavor: "Together, they stand against your expedition.",
        moveOffset: Math.floor(Math.random() * monster.moves.length),
        moves: monster.moves.map(([kind, factor, name]) => [kind, Math.max(1, Math.round(attack * factor)), name])
      });
    }
    return { ...round, group };
  }
  let state;
  let best = 0;
  let soundEnabled = false;
  let audio;
  let helpReturnFocus;
  let resetReturnFocus;
  let practice = null;
  let practiceReturnFocus;
  let runSerial = 0;
  let toastTimer;
  const SAVE_KEY = "diceattack-run-save-v1";
  const stablePhases = ["ready", "rolled", "shop", "victory", "won", "lost"];
  let tutorialSeen = false;
  let lastSavedText = null;
  let restoring = false;
  let savingPaused = false;
  let scrollSaveTimer;
  let defense = null;
  let relaxedTiming = false;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reducedMotion ? Math.min(ms, 25) : ms));
  const rollDie = () => Math.floor(Math.random() * 6) + 1;

  function actor() { return state.party[state.actorIndex]; }
  function targetEnemy() { return state.enemies[state.target]; }
  function livingMembers() { return state.party.map((member, index) => ({ member, index })).filter(({ member }) => member.hp > 0); }
  function battleWon() { return state.enemies.every((enemy) => enemy.hp === 0); }
  function monsterCount() { return state.encounters.reduce((count, round) => count + (round.group?.length || 0), 0); }
  function healingTarget(member = actor()) {
    return member.key === "healer" ? livingMembers().map(({ member: ally }) => ally).sort((a, b) => (b.maxHp - b.hp) - (a.maxHp - a.hp))[0] || member : member;
  }
  function createMember(key, profile = state) {
    const definition = memberTypes[key];
    const maxHp = definition.hp + (profile.skills.vitality || 0) * 8;
    return { key, hp: maxHp, maxHp, shield: 0, collection: [{ id: profile.nextDieId++, type: definition.die, tier: "base", paidPrice: 0 }], dice: [], selected: null, rerolls: 1 + profile.extraRerolls, abilities: definition.ability ? [definition.ability] : [], usedAbilities: new Set() };
  }
  function recruitCompanions() {
    const recruits = [];
    Object.entries(memberTypes).forEach(([key, definition]) => {
      if (state.completed >= definition.joins && !state.party.some((member) => member.key === key)) {
        state.party.push(createMember(key));
        recruits.push(key);
      }
    });
    return recruits;
  }

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

  function pauseSaving(error) {
    console.warn("Dice Attack could not save or restore this run.", error);
    if (!savingPaused) notify("Your saved run could not be read or written. Progress is not being saved. Reset the run to retry; unreadable saves won't be overwritten automatically.", "error");
    savingPaused = true;
    $("save-status").textContent = "AUTOSAVE UNAVAILABLE";
  }

  function saveProgress(force = false) {
    if (!state || restoring || savingPaused || (!force && document.hidden) || !stablePhases.includes(state.phase) || practice?.busy) return;
    const snapshot = {
      version: 2,
      state: { ...state, id: undefined, party: state.party.map((member) => ({ ...member, usedAbilities: [...member.usedAbilities] })), expandedOffers: [...state.expandedOffers] },
      relaxedTiming,
      tutorialSeen, tutorialStep: practice ? practice.step : null,
      journal: [...$("battle-log").children].map((entry) => entry.lastChild.textContent),
      view: {
        help: ["ready", "rolled"].includes(state.phase) && !$("help-overlay").hidden, reset: !$("reset-overlay").hidden,
        page: window.scrollY, shop: $("shop-overlay").querySelector(".modal").scrollTop,
        tutorial: $("tutorial-overlay").querySelector(".modal").scrollTop,
        instructions: $("help-overlay").querySelector(".modal").scrollTop
      }
    };
    const text = JSON.stringify(snapshot);
    try {
      if (localStorage.getItem(SAVE_KEY) !== lastSavedText) return;
      if (text !== lastSavedText) localStorage.setItem(SAVE_KEY, text);
      lastSavedText = text;
      $("save-status").textContent = "PROGRESS SAVED ON THIS BROWSER";
    } catch (error) { pauseSaving(error); }
  }

  function validateLegacySave(saved) {
    const require = (valid, field) => { if (!valid) throw new Error(`Invalid saved ${field}.`); };
    const integer = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= min && value <= max;
    const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
    const catalogKeys = (list, catalog) => Array.isArray(list) && new Set(list).size === list.length && list.every((key) => typeof key === "string" && Object.hasOwn(catalog, key));
    const die = (value) => object(value) && typeof value.type === "string" && typeof value.tier === "string" && Object.hasOwn(diceTypes, value.type) && Object.hasOwn(diceTiers, value.tier) && integer(value.id, 1) && integer(value.paidPrice);
    require(object(saved) && saved.version === 1 && object(saved.state), "format");
    const s = saved.state;
    require(stablePhases.includes(s.phase) && typeof s.code === "string" && /^[A-Z0-9]{4}$/.test(s.code), "phase or run code");
    require(Array.isArray(s.encounters) && s.encounters.length === RUN_LENGTH, "route");
    s.encounters.forEach((round, i) => {
      require(object(round) && round.zone === Math.min(zones.length - 1, Math.floor(i / SHOP_INTERVAL)), "area");
      if ((i + 1) % SHOP_INTERVAL === 0) {
        require(round.kind === "shop" && round.name === "The Wayfarer's Market", "shop round");
        return;
      }
      validateMonster(round, round.zone, i % SHOP_INTERVAL === 3 || i === RUN_LENGTH - 1, i === RUN_LENGTH - 1);
    });
    require(Array.isArray(s.omens) && s.omens.length === zones.length && s.omens.every((omen) => omens.some((known) => JSON.stringify(known) === JSON.stringify(omen))), "omens");
    require(integer(s.encounter, 0, RUN_LENGTH - 1) && integer(s.completed, 0, RUN_LENGTH) && integer(s.defeated, 0, BATTLE_COUNT), "progress");
    const completed = ["victory", "won"].includes(s.phase) ? s.encounter + 1 : s.encounter;
    require(s.completed === completed && s.defeated === completed - Math.floor(completed / SHOP_INTERVAL), "completed rounds");
    require((s.phase === "shop") === (s.encounters[s.encounter].kind === "shop") && (s.phase !== "won" || s.encounter === RUN_LENGTH - 1), "round phase");
    require(object(s.skills) && Object.entries(s.skills).every(([key, level]) => Object.hasOwn(skills, key) && integer(level, 1, skills[key].max)), "skills");
    require(s.power === (s.skills.power || 0) && s.ward === (s.skills.ward || 0) && s.healing === (s.skills.healing || 0) && s.critBonus === 3 + (s.skills.critical || 0) * 2 && s.recovery === (s.skills.recovery || 0) * 4 && s.maxHp === 40 + (s.skills.vitality || 0) * 8 && s.lootBonus === (s.skills.loot || 0) * .25 && s.extraRerolls === (s.skills.luck || 0), "skill bonuses");
    require(integer(s.hp, 0, s.maxHp) && (s.hp === 0) === (s.phase === "lost") && integer(s.shield) && integer(s.gold) && integer(s.turn, 1) && integer(s.rerolls, 0, 1 + s.extraRerolls), "player values");
    require(Array.isArray(s.collection) && s.collection.length >= 1 && s.collection.length <= MAX_DICE && s.collection.every(die) && new Set(s.collection.map((owned) => owned.id)).size === s.collection.length && s.collection.some((owned) => diceTypes[owned.type].offensive), "collection");
    require(integer(s.nextDieId, Math.max(...s.collection.map((owned) => owned.id)) + 1), "next die ID");
    require(Array.isArray(s.dice) && (s.dice.length === 0 || s.dice.length === s.collection.length) && s.dice.every((rolled, i) => die(rolled) && rolled.id === s.collection[i].id && rolled.type === s.collection[i].type && rolled.tier === s.collection[i].tier && rolled.paidPrice === s.collection[i].paidPrice && integer(rolled.value, 1, 6)), "rolled dice");
    require((s.phase !== "rolled" || s.dice.length === s.collection.length) && (s.phase !== "ready" || s.dice.length === 0) && (s.selected === null || integer(s.selected, 0, s.dice.length - 1)), "dice selection");
    require(catalogKeys(s.abilities, abilities) && Array.isArray(s.usedAbilities) && new Set(s.usedAbilities).size === s.usedAbilities.length && s.usedAbilities.every((key) => s.abilities.includes(key)), "abilities");
    const source = s.encounters[s.phase === "shop" ? s.encounter - 1 : s.encounter];
    require(object(s.enemy) && s.enemy.name === source.name && s.enemy.type === source.type && s.enemy.zone === source.zone && s.enemy.maxHp === source.hp && integer(s.enemy.hp, 0, source.hp) && integer(s.enemy.shield) && integer(s.enemy.poison, 0, 12) && typeof s.enemy.frozen === "boolean", "current enemy");
    require(JSON.stringify(s.enemy.moves) === JSON.stringify(source.moves) && s.enemy.moveOffset === source.moveOffset, "current enemy moves");
    require((s.enemy.hp === 0) === ["shop", "victory", "won"].includes(s.phase), "enemy health");
    require(object(s.stats) && ["rolls", "damage", "criticals", "earned"].every((key) => integer(s.stats[key])), "statistics");
    require(Array.isArray(s.stock) && s.stock.length <= 10 && s.stock.every((offer) => object(offer) && ["dice", "skill", "ability"].includes(offer.kind) && typeof offer.key === "string" && Object.hasOwn(offer.kind === "dice" ? diceTypes : offer.kind === "skill" ? skills : abilities, offer.key) && integer(offer.price, 1) && typeof offer.bought === "boolean"), "market stock");
    require(["all", "dice", "skill", "ability", "owned"].includes(s.shopFilter) && typeof s.refreshed === "boolean" && Array.isArray(s.expandedOffers) && s.expandedOffers.every((index) => integer(index, 0, s.stock.length - 1)), "market state");
    require(s.pendingSale === null || (s.phase === "shop" && s.collection.some((owned) => owned.id === s.pendingSale)), "pending sale");
    require(s.phase === "victory" ? object(s.reward) && integer(s.reward.gold, 1) && integer(s.reward.recovery, 0, s.maxHp) : s.reward === null, "reward");
    require(typeof saved.tutorialSeen === "boolean" && (saved.tutorialStep === null || (saved.tutorialSeen && ["ready", "rolled"].includes(s.phase) && integer(saved.tutorialStep, 0, 9))), "tutorial");
    require(Array.isArray(saved.journal) && saved.journal.length <= 3 && saved.journal.every((message) => typeof message === "string" && message.length <= 1000), "journal");
    require(object(saved.view) && typeof saved.view.help === "boolean" && typeof saved.view.reset === "boolean" && ["page", "shop", "tutorial", "instructions"].every((key) => Number.isFinite(saved.view[key]) && saved.view[key] >= 0 && saved.view[key] <= 1000000), "view");
    require((!saved.view.help || ["ready", "rolled"].includes(s.phase)) && (!saved.view.reset || (["ready", "rolled", "shop", "won", "lost"].includes(s.phase) && s.pendingSale === null)) && (!saved.view.help || !saved.view.reset) && (saved.tutorialStep === null || (!saved.view.help && !saved.view.reset)), "open dialog");
  }

  function validateMonster(round, zone, boss, final) {
    const require = (valid, field) => { if (!valid) throw new Error(`Invalid saved monster ${field}.`); };
    const integer = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= min && value <= max;
    require(round !== null && typeof round === "object" && !Array.isArray(round), "definition");
    const monster = monsters.find((item) => round.name === `${round.elite ? "Frenzied " : ""}${item.name}` && item.zone === zone);
    require(monster && round.zone === zone && round.kind === "battle" && round.type === monster.type && Boolean(round.boss) === Boolean(monster.boss) && Boolean(round.boss) === boss && Boolean(round.final) === final, "identity");
    require(integer(round.hp, 1) && integer(round.gold, 1) && integer(round.moveOffset, 0, monster.moves.length - 1), "values");
    require(Array.isArray(round.moves) && round.moves.length === monster.moves.length && round.moves.every((move, j) => Array.isArray(move) && move.length === 3 && move[0] === monster.moves[j][0] && integer(move[1], 1) && move[2] === monster.moves[j][2]), "moves");
    require(typeof round.role === "string" && typeof round.flavor === "string" && !/[<>&"]/.test(round.role + round.flavor), "text");
    require(round.color === monster.color && ["armored", "wings", "mushroom", "thorns"].every((key) => Boolean(round[key]) === Boolean(monster[key])), "artwork");
  }

  function upgradeSave(saved) {
    validateLegacySave(saved);
    const s = saved.state;
    const knight = { key: "knight" };
    MEMBER_FIELDS.forEach((key) => { knight[key] = s[key]; });
    const party = [knight];
    Object.entries(memberTypes).forEach(([key, definition]) => {
      if (key !== "knight" && s.completed >= definition.joins) {
        const member = createMember(key, s);
        if (s.phase === "lost") member.hp = 0;
        member.usedAbilities = [];
        party.push(member);
      }
    });
    const next = { ...s, party, actorIndex: 0, acted: [], target: 0, enemyCursor: 0, stats: { ...s.stats, dodges: 0, parries: 0 } };
    MEMBER_FIELDS.forEach((key) => { delete next[key]; });
    delete next.enemy;
    next.encounters = s.encounters.map((round, i) => round.kind === "shop" ? round : i > s.encounter ? addEnemyGroup(round, i % SHOP_INTERVAL) : { ...round, group: [{ ...round }] });
    next.enemies = [{ ...s.enemy, chill: 0, rewarded: s.enemy.hp === 0 }];
    if (s.reward) next.reward = { ...s.reward, enemyIndex: 0, battleWon: true, resume: "party", recruits: party.slice(1).filter((member) => memberTypes[member.key].joins === s.completed).map((member) => member.key) };
    return { ...saved, version: 2, state: next, relaxedTiming: false, tutorialStep: saved.tutorialStep === 9 ? tutorialSteps.length - 1 : saved.tutorialStep };
  }

  function validateSave(saved) {
    const require = (valid, field) => { if (!valid) throw new Error(`Invalid saved ${field}.`); };
    const integer = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= min && value <= max;
    const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
    const keys = (list, catalog) => Array.isArray(list) && new Set(list).size === list.length && list.every((key) => typeof key === "string" && Object.hasOwn(catalog, key));
    const die = (value) => object(value) && typeof value.type === "string" && typeof value.tier === "string" && Object.hasOwn(diceTypes, value.type) && Object.hasOwn(diceTiers, value.tier) && integer(value.id, 1) && integer(value.paidPrice);
    require(object(saved) && saved.version === 2 && object(saved.state) && typeof saved.relaxedTiming === "boolean", "format");
    const s = saved.state;
    require(stablePhases.includes(s.phase) && typeof s.code === "string" && /^[A-Z0-9]{4}$/.test(s.code), "phase or run code");
    require(Array.isArray(s.encounters) && s.encounters.length === RUN_LENGTH, "route");
    s.encounters.forEach((round, i) => {
      const zone = Math.min(zones.length - 1, Math.floor(i / SHOP_INTERVAL));
      require(object(round) && round.zone === zone, "area");
      if ((i + 1) % SHOP_INTERVAL === 0) { require(round.kind === "shop" && round.name === "The Wayfarer's Market", "shop round"); return; }
      const boss = i % SHOP_INTERVAL === 3 || i === RUN_LENGTH - 1;
      validateMonster(round, zone, boss, i === RUN_LENGTH - 1);
      require(Array.isArray(round.group) && round.group.length >= 1 && round.group.length <= (zone === 0 ? 1 : zone === 1 ? 2 : 3), "enemy group");
      round.group.forEach((enemy, index) => validateMonster(enemy, zone, index === 0 && boss, index === 0 && i === RUN_LENGTH - 1));
      require(["name", "hp", "gold", "moveOffset"].every((key) => round.group[0][key] === round[key]) && JSON.stringify(round.group[0].moves) === JSON.stringify(round.moves), "group leader");
    });
    require(Array.isArray(s.omens) && s.omens.length === zones.length && s.omens.every((omen) => omens.some((known) => JSON.stringify(known) === JSON.stringify(omen))), "omens");
    require(integer(s.encounter, 0, RUN_LENGTH - 1) && integer(s.completed, 0, RUN_LENGTH) && integer(s.turn, 1) && integer(s.gold), "progress");
    require((s.phase === "shop") === (s.encounters[s.encounter].kind === "shop") && (s.phase !== "won" || s.encounter === RUN_LENGTH - 1), "round phase");
    require(object(s.skills) && Object.entries(s.skills).every(([key, level]) => Object.hasOwn(skills, key) && integer(level, 1, skills[key].max)), "skills");
    require(s.power === (s.skills.power || 0) && s.ward === (s.skills.ward || 0) && s.healing === (s.skills.healing || 0) && s.critBonus === 3 + (s.skills.critical || 0) * 2 && s.recovery === (s.skills.recovery || 0) * 4 && s.lootBonus === (s.skills.loot || 0) * .25 && s.extraRerolls === (s.skills.luck || 0), "skill bonuses");
    const expectedParty = Object.keys(memberTypes).filter((key) => memberTypes[key].joins <= s.completed);
    require(Array.isArray(s.party) && s.party.length === expectedParty.length && s.party.every((member, i) => object(member) && member.key === expectedParty[i]), "party");
    const ids = [];
    s.party.forEach((member) => {
      require(member.maxHp === memberTypes[member.key].hp + (s.skills.vitality || 0) * 8 && integer(member.hp, 0, member.maxHp) && integer(member.shield) && integer(member.rerolls, 0, 1 + s.extraRerolls), "party health");
      require(Array.isArray(member.collection) && member.collection.length >= 1 && member.collection.length <= MAX_DICE && member.collection.every(die) && member.collection.some((owned) => diceTypes[owned.type].offensive), "member collection");
      ids.push(...member.collection.map((owned) => owned.id));
      require(Array.isArray(member.dice) && (member.dice.length === 0 || member.dice.length === member.collection.length) && member.dice.every((rolled, i) => die(rolled) && ["id", "type", "tier", "paidPrice"].every((key) => rolled[key] === member.collection[i][key]) && integer(rolled.value, 1, 6)), "member dice");
      require(member.selected === null || integer(member.selected, 0, member.dice.length - 1), "dice selection");
      require(keys(member.abilities, abilities) && Array.isArray(member.usedAbilities) && new Set(member.usedAbilities).size === member.usedAbilities.length && member.usedAbilities.every((key) => member.abilities.includes(key)), "member abilities");
    });
    require(new Set(ids).size === ids.length && integer(s.nextDieId, Math.max(...ids) + 1), "die IDs");
    require(integer(s.actorIndex, 0, s.party.length - 1) && Array.isArray(s.acted) && new Set(s.acted).size === s.acted.length && s.acted.every((index) => integer(index, 0, s.party.length - 1)), "party turn");
    require((s.phase === "lost") === s.party.every((member) => member.hp === 0), "party defeat");
    const member = s.party[s.actorIndex];
    require(!["ready", "rolled"].includes(s.phase) || (member.hp > 0 && !s.acted.includes(s.actorIndex) && member.dice.length === (s.phase === "ready" ? 0 : member.collection.length)), "active turn");
    const source = s.encounters[s.phase === "shop" ? s.encounter - 1 : s.encounter].group;
    require(Array.isArray(s.enemies) && s.enemies.length === source.length && integer(s.target, 0, s.enemies.length - 1) && integer(s.enemyCursor, 0, s.enemies.length), "current enemies");
    s.enemies.forEach((enemy, i) => {
      const definition = source[i];
      require(object(enemy) && enemy.name === definition.name && enemy.maxHp === definition.hp && integer(enemy.hp, 0, enemy.maxHp) && integer(enemy.shield) && integer(enemy.poison, 0, 12) && integer(enemy.chill) && typeof enemy.frozen === "boolean" && typeof enemy.rewarded === "boolean" && enemy.rewarded === (enemy.hp === 0), "enemy status");
    });
    const won = s.enemies.every((enemy) => enemy.hp === 0);
    require((!["ready", "rolled", "lost"].includes(s.phase) || !won) && (!["ready", "rolled"].includes(s.phase) || s.enemies[s.target].hp > 0), "enemy target");
    require(s.phase === "victory" ? object(s.reward) && integer(s.reward.gold, 1) && integer(s.reward.recovery, 0, s.party.reduce((total, ally) => total + ally.maxHp, 0)) && integer(s.reward.enemyIndex, 0, s.enemies.length - 1) && s.enemies[s.reward.enemyIndex].rewarded && s.reward.battleWon === won && ["party", "enemies", "ability-ready", "ability-rolled"].includes(s.reward.resume) && keys(s.reward.recruits, memberTypes) && s.reward.recruits.every((key) => key !== "knight" && s.party.some((ally) => ally.key === key)) : s.reward === null, "reward");
    const completed = s.phase === "won" || (s.phase === "victory" && won) ? s.encounter + 1 : s.encounter;
    require(s.completed === completed && (!["shop", "won"].includes(s.phase) || won), "completed rounds");
    const kills = s.encounters.slice(0, completed).reduce((total, round) => total + (round.group?.length || 0), 0) + (s.encounter >= completed && s.phase !== "shop" ? s.enemies.filter((enemy) => enemy.rewarded).length : 0);
    require(s.defeated === kills, "monster count");
    require(object(s.stats) && ["rolls", "damage", "criticals", "earned", "dodges", "parries"].every((key) => integer(s.stats[key])), "statistics");
    require(Array.isArray(s.stock) && s.stock.length <= 10 && s.stock.every((offer) => object(offer) && ["dice", "skill", "ability"].includes(offer.kind) && typeof offer.key === "string" && Object.hasOwn(offer.kind === "dice" ? diceTypes : offer.kind === "skill" ? skills : abilities, offer.key) && integer(offer.price, 1) && typeof offer.bought === "boolean"), "market stock");
    require(["all", "dice", "skill", "ability", "owned"].includes(s.shopFilter) && typeof s.refreshed === "boolean" && Array.isArray(s.expandedOffers) && s.expandedOffers.every((index) => integer(index, 0, s.stock.length - 1)), "market state");
    require(s.pendingSale === null || (s.phase === "shop" && member.collection.some((owned) => owned.id === s.pendingSale)), "pending sale");
    require(typeof saved.tutorialSeen === "boolean" && (saved.tutorialStep === null || (saved.tutorialSeen && ["ready", "rolled"].includes(s.phase) && integer(saved.tutorialStep, 0, tutorialSteps.length - 1))), "tutorial");
    require(Array.isArray(saved.journal) && saved.journal.length <= 3 && saved.journal.every((message) => typeof message === "string" && message.length <= 1000), "journal");
    require(object(saved.view) && typeof saved.view.help === "boolean" && typeof saved.view.reset === "boolean" && ["page", "shop", "tutorial", "instructions"].every((key) => Number.isFinite(saved.view[key]) && saved.view[key] >= 0 && saved.view[key] <= 1000000), "view");
    require((!saved.view.help || ["ready", "rolled"].includes(s.phase)) && (!saved.view.reset || (["ready", "rolled", "shop", "won", "lost"].includes(s.phase) && s.pendingSale === null)) && (!saved.view.help || !saved.view.reset) && (saved.tutorialStep === null || (!saved.view.help && !saved.view.reset)), "open dialog");
  }

  function restoreProgress(text) {
    let saved;
    try {
      if (text === null) return false;
      saved = JSON.parse(text);
      if (saved.version === 1) saved = upgradeSave(saved);
      validateSave(saved);
    } catch (error) { pauseSaving(error); return false; }
    restoring = true;
    cancelDefense();
    state = { ...saved.state, id: ++runSerial, party: saved.state.party.map((member) => ({ ...member, usedAbilities: new Set(member.usedAbilities) })), expandedOffers: new Set(saved.state.expandedOffers) };
    const source = state.encounters[state.phase === "shop" ? state.encounter - 1 : state.encounter].group;
    state.enemies = source.map((definition, i) => ({ ...definition, maxHp: definition.hp, ...Object.fromEntries(["hp", "shield", "poison", "frozen", "chill", "rewarded"].map((key) => [key, saved.state.enemies[i][key]])) }));
    relaxedTiming = saved.relaxedTiming;
    tutorialSeen = saved.tutorialSeen;
    practice = saved.tutorialStep === null ? null : createPractice(saved.tutorialStep);
    lastSavedText = text;
    ["shop-overlay", "reward-overlay", "sell-overlay", "end-overlay", "reset-overlay", "help-overlay", "tutorial-overlay"].forEach((id) => { $(id).hidden = true; });
    $("hero-art").className = "character-art";
    $("hero-effects").replaceChildren();
    $("enemy-effects").replaceChildren();
    $("battle-log").replaceChildren();
    saved.journal.forEach(log);
    paintEncounter();
    if (state.phase === "shop") {
      $("shop-overlay").hidden = false;
      renderShopHeading();
      renderShop();
      if (state.pendingSale !== null) openSale(state.pendingSale);
      else $("leave-shop").focus({ preventScroll: true });
    } else if (state.phase === "victory") {
      $("enemy-art").classList.add("defeated");
      renderReward(true);
      $("reward-continue").focus({ preventScroll: true });
    } else if (["won", "lost"].includes(state.phase)) {
      if (state.phase === "lost") $("hero-art").classList.add("defeated");
      showEnding(state.phase === "won");
    } else if (practice) {
      paintPractice();
      $("tutorial-overlay").hidden = false;
      renderTutorial();
    } else if (state.phase === "rolled" && actor().selected !== null) $("dice-tray").children[actor().selected].focus({ preventScroll: true });
    else $("main-button").focus({ preventScroll: true });
    if (saved.view.reset) openReset();
    else if (saved.view.help) openHelp();
    window.scrollTo(0, saved.view.page);
    $("shop-overlay").querySelector(".modal").scrollTop = saved.view.shop;
    $("tutorial-overlay").querySelector(".modal").scrollTop = saved.view.tutorial;
    $("help-overlay").querySelector(".modal").scrollTop = saved.view.instructions;
    restoring = false;
    savingPaused = false;
    $("save-status").textContent = "PROGRESS SAVED ON THIS BROWSER";
    saveProgress();
    return true;
  }

  function readRecord() {
    try {
      const stored = Number(localStorage.getItem("diceattack-31-round-best"));
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
    if (state.completed <= best) return;
    best = state.completed;
    updateRecord();
    try {
      localStorage.setItem("diceattack-31-round-best", String(best));
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

  function memberArtwork(key) {
    if (key === "knight") return heroArtwork();
    const mage = key === "mage";
    const color = mage ? "#ae91dc" : "#84cbb0";
    const trim = mage ? "#e8cb86" : "#d6e9ba";
    return svgFrame(`
      <ellipse cx="120" cy="229" rx="72" ry="11" fill="${color}" opacity=".16"/>
      <path d="M85 117q-25 37-35 103l47 12 23-13 24 15 48-16q-18-74-44-102Z" fill="url(#companion-robe)" stroke="#283a48" stroke-width="4"/>
      <path d="m80 138-10 73 29-8m48-66 25 69-24-6m-29-76v89" stroke="${trim}" stroke-width="3" opacity=".65"/>
      <path d="m104 217-4 20 17 0 4-18m7 0 6 20 18-1-11-19" fill="#344050" stroke="#a9b9b0" stroke-width="3"/>
      <path d="m83 108 37-16 38 19-9 47-29 15-32-16Z" fill="${color}" stroke="#344d50" stroke-width="3"/>
      <path d="m92 115 29 20 28-18m-29 19v26" stroke="${trim}" stroke-width="3"/>
      <path d="m112 133 9-10 9 11-9 13Z" fill="${trim}"/>
      <path d="m90 118-17 27-11 21m89-47 12 21 21-2" stroke="${color}" stroke-width="17" stroke-linecap="round"/>
      <path d="m56 159-6 15 15 4 5-12m105-33 9 12 10-6-5-11" fill="#dfc0a4" stroke="#546766" stroke-width="3"/>
      <path d="M91 56q2-30 30-31 28 1 31 31l-5 44-26 14-25-16Z" fill="#6c4a52" stroke="#293d45" stroke-width="3"/>
      <path d="M100 58q20-12 41 0l-2 30-17 16-20-13Z" fill="#e2c1a0" stroke="#9a786b" stroke-width="2"/>
      <path d="M96 61q3-35 27-28 28 2 25 27l-12-15-16 16-8-15-12 18" fill="${mage ? "#d6b27b" : "#975b52"}"/>
      <path d="m106 74 8-1m15 0 7 1" stroke="#384652" stroke-width="3" stroke-linecap="round"/>
      <path d="m118 87 10 0" stroke="#a96f65" stroke-width="2" stroke-linecap="round"/>
      <path d="m103 51 20-8 15 6" stroke="${trim}" stroke-width="3"/>
      <path d="M184 63v158" stroke="#534747" stroke-width="9" stroke-linecap="round"/>
      <path d="M184 65v153" stroke="${trim}" stroke-width="3"/>
      ${mage ? `<path d="m184 24 18 23-18 26-17-25Z" fill="${color}" stroke="${trim}" stroke-width="3"/><path d="m184 32 0 30m-10-15h21" stroke="#f6eac5" stroke-width="3"/><circle cx="184" cy="48" r="32" stroke="${color}" stroke-width="1" opacity=".3"/>` : `<path d="M196 29a23 23 0 1 0 1 36 18 18 0 0 1-1-36Z" fill="${trim}" stroke="#789d85" stroke-width="2"/><path d="m184 41 5 7-5 7-5-7Z" fill="${color}"/>`}
      <path d="m76 182 22-6 9 14-3 22-24-1Z" fill="#405454" stroke="${trim}" stroke-width="2"/>
      <path d="m84 189 13 4m-12 4 11 3" stroke="${color}" stroke-width="2"/>
    `, `<linearGradient id="companion-robe" x2=".8" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="${mage ? "#443a70" : "#284f4d"}"/></linearGradient>`);
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
      return `<circle class="spark" cx="${x}" cy="${y}" r="${i % 3 ? 1.3 : 2.1}" fill="${["#c2df9b", "#a7c6ed", "#ffb16b", "#b6f4ff", "#8debd0", "#dfb7ff"][zone]}" style="animation-delay:-${i % 5}s"/>`;
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
    } else if (zone === 2) {
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
    if (zone === 3) {
      scene = `<rect width="1200" height="400" fill="url(#scene-bg)"/>
        <path d="M0 92Q250 5 470 88T1200 44" fill="none" stroke="#83eac1" stroke-width="35" opacity=".12"/><path d="M0 125Q290 25 570 105T1200 76" fill="none" stroke="#b99cef" stroke-width="18" opacity=".1"/>
        <circle cx="835" cy="73" r="34" fill="#dffaff" opacity=".22"/>
        <path d="M0 300 180 84 310 247 475 43 670 264 880 72 1200 302V400H0Z" fill="#33556b"/><path d="m180 84-54 78 60-20 34 35Zm295-41-71 104 71-35 43 30Zm405 29-74 99 75-30 42 27Z" fill="#c0e8ef" opacity=".7"/>
        <path d="M0 333Q180 284 350 327T750 316T1200 325V400H0Z" fill="#4c7a86"/><path d="M0 365Q210 334 480 369T1200 351V400H0Z" fill="#9dbfc8" opacity=".3"/>
        <g fill="#aadff1" opacity=".55"><path d="m94 315 14-70 18 75Zm932 13 23-94 28 87Zm-17 5 9-56 14 54Zm-878-12 9-39 13 40Z"/></g>`;
    } else if (zone === 4) {
      scene = `<rect width="1200" height="400" fill="url(#scene-bg)"/>
        <path d="m340 0 90 321h72L465 0m275 0-42 332h78L876 0" fill="#95e6d0" opacity=".045"/>
        <path d="M440 306V158Q600 30 760 158V306" fill="#183c43" stroke="#638983" stroke-width="22"/><path d="M475 306V162Q600 72 725 162V306" fill="#14313c"/>
        <g fill="#416b68"><path d="M184 129h55v174h-55Zm-9-16h73v19h-73Zm-5 190h82v15h-82ZM946 158h53v153h-53Zm-8-17h70v20h-70Zm-8 170h85v16h-85Z"/></g>
        <path d="M0 328Q190 290 350 320T780 319T1200 310V400H0Z" fill="#284e50"/>
        <g fill="none" stroke="#c388ab" stroke-width="7" stroke-linecap="round"><path d="M100 340v-51m0 28-20-20m20 8 22-29M1070 345v-62m0 35 22-18m-22 5-18-21"/></g>
        <g fill="none" stroke="#9ee6d4" opacity=".25"><circle cx="315" cy="93" r="9"/><circle cx="337" cy="144" r="5"/><circle cx="902" cy="86" r="8"/><circle cx="876" cy="180" r="4"/></g>
        <g fill="#79acb1" opacity=".5"><path d="m750 103 18-7 15 7-15 6Zm32 0 9-8v16ZM385 198l17-8 16 8-16 7Zm31 0 9-7v15Z"/></g>`;
    } else if (zone === 5) {
      scene = `<rect width="1200" height="400" fill="url(#scene-bg)"/>
        <ellipse cx="600" cy="150" rx="176" ry="123" fill="#9866d1" opacity=".08"/><ellipse cx="600" cy="150" rx="124" ry="85" fill="none" stroke="#d6a8ed" stroke-width="2" opacity=".4"/>
        <ellipse cx="600" cy="150" rx="100" ry="119" fill="none" stroke="#946dd2" stroke-width="3" opacity=".3" transform="rotate(40 600 150)"/><circle cx="600" cy="150" r="67" fill="#100f24"/><circle cx="600" cy="150" r="71" fill="none" stroke="#cfa8ff" stroke-width="3" opacity=".35"/>
        <g fill="#725c90"><path d="m185 103 41-35 42 39-21 92-39-5Zm774 47 29-28 44 31-13 52-37-4ZM404 257l48-22 66 25-32 20-60 3ZM794 251l37-21 56 29-25 19-47-3Z"/></g>
        <path d="M0 344 170 319 311 341 421 308 571 333 736 306 896 338 1081 312 1200 340V400H0Z" fill="#30283f"/>
        <path d="m0 350 170-25 141 22 110-32 150 25 165-27 160 32 185-27 119 28" fill="none" stroke="#c59bef" stroke-width="3" opacity=".3"/>
        <path d="m243 39 8 19 21 2-17 12 5 21-18-13-18 11 6-20-15-13 20-1ZM1038 66l5 12 13 2-10 8 2 13-11-8-12 7 4-13-9-9 13-1Z" fill="#ecdcff" opacity=".65"/>`;
    }
    const color = [["#294d42", "#152d31"], ["#293447", "#142231"], ["#542e31", "#201e2d"], ["#233e58", "#182f42"], ["#245559", "#142f3b"], ["#35264e", "#17182d"]][zone];
    return svgFrame(scene + sparks, `<linearGradient id="scene-bg" x2="0" y2="1"><stop stop-color="${color[0]}"/><stop offset="1" stop-color="${color[1]}"/></linearGradient>`, "0 0 1200 400").replace('<svg xmlns=', '<svg preserveAspectRatio="xMidYMid slice" xmlns=');
  }

  function startRun(replaceSave = false) {
    if (replaceSave) {
      try { lastSavedText = localStorage.getItem(SAVE_KEY); savingPaused = false; }
      catch (error) { pauseSaving(error); }
    }
    clearInfoToast();
    cancelDefense();
    practice = null;
    $("practice-dice").replaceChildren();
    state = {
      id: ++runSerial, code: Math.random().toString(36).slice(2, 6).padEnd(4, "0").toUpperCase(),
      encounters: generateRun(), omens: shuffle(omens),
      phase: "ready", encounter: 0, completed: 0, defeated: 0, reward: null, turn: 1, gold: 0,
      power: 0, ward: 0, healing: 0, critBonus: 3, recovery: 0, extraRerolls: 0, lootBonus: 0,
      party: [], actorIndex: 0, acted: [], nextDieId: 1, pendingSale: null, enemies: [], target: 0, enemyCursor: 0, skills: {},
      stats: { rolls: 0, damage: 0, criticals: 0, earned: 0, dodges: 0, parries: 0 }, stock: [], shopFilter: "all", refreshed: false, expandedOffers: new Set()
    };
    state.party.push(createMember("knight"));
    ["shop-overlay", "reward-overlay", "sell-overlay", "end-overlay", "reset-overlay", "help-overlay", "tutorial-overlay"].forEach((id) => { $(id).hidden = true; });
    $("hero-art").className = "character-art";
    $("hero-effects").replaceChildren();
    $("enemy-effects").replaceChildren();
    $("battle-log").replaceChildren();
    loadEncounter();
    log("One attack die. Six areas to explore. Round 5 is a shop, not a battle.");
  }

  function loadEncounter() {
    const definition = state.encounters[state.encounter];
    state.party.forEach((member) => { member.shield = 0; member.dice = []; member.selected = null; member.rerolls = 1 + state.extraRerolls; member.usedAbilities.clear(); });
    state.acted = [];
    state.actorIndex = livingMembers()[0]?.index ?? 0;
    state.enemyCursor = 0;
    state.target = 0;
    if (definition.kind === "shop") { openShop(); return; }
    state.enemies = definition.group.map((enemy) => ({ ...enemy, maxHp: enemy.hp, shield: 0, poison: 0, frozen: false, chill: 0, rewarded: false }));
    state.phase = "ready";
    state.turn = 1;
    paintEncounter();
  }

  function paintEncounter() {
    const definition = targetEnemy();
    const zoneIndex = definition.zone;
    const zone = zones[zoneIndex];
    $("zone-title").textContent = zone.title;
    $("area-label").textContent = zone.label;
    $("arena").className = `arena ${zone.className}`;
    $("scene-art").innerHTML = sceneArtwork(zoneIndex);
    $("flavor-text").textContent = definition.flavor;
    render();
  }

  function enemyArtwork(enemy) {
    let artwork = enemy.type === "slime" ? slimeArtwork(enemy) : enemy.type === "skeleton" ? skeletonArtwork(enemy) : enemy.type === "demon" ? demonArtwork(enemy) : creatureArtwork(enemy);
    if (enemy.mushroom) artwork = artwork.replace("</svg>", '<path d="M56 105q13-83 69-75 49 3 64 74Z" fill="#af677f" stroke="#663f62" stroke-width="4"/><g fill="#edccbe"><ellipse cx="90" cy="75" rx="11" ry="7"/><ellipse cx="138" cy="53" rx="9" ry="6"/><ellipse cx="163" cy="88" rx="10" ry="7"/></g></svg>');
    return artwork;
  }

  function namespaceArtwork(markup, prefix) {
    return markup.replace(/id="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}-${id})`);
  }

  function paintCombatants() {
    const member = actor();
    const definition = memberTypes[member.key];
    const heroKey = `${state.id}-${member.key}`;
    if ($("hero-art").dataset.artKey !== heroKey) {
      $("hero-art").dataset.artKey = heroKey;
      $("hero-art").className = `character-art member-${member.key}`;
      $("hero-art").innerHTML = namespaceArtwork(memberArtwork(member.key), "active");
    }
    $("hero-art").classList.toggle("defeated", member.hp === 0);
    $("hero-name").textContent = definition.name;
    $("hero-role").textContent = definition.title;
    const enemy = targetEnemy();
    const enemyKey = `${state.id}-${state.encounter}-${state.target}`;
    if ($("enemy-art").dataset.artKey !== enemyKey) {
      $("enemy-art").dataset.artKey = enemyKey;
      $("enemy-art").className = `character-art ${enemy.type}${enemy.boss ? " boss" : ""}`;
      $("enemy-art").innerHTML = enemyArtwork(enemy);
    }
    $("enemy-art").classList.toggle("defeated", enemy.hp === 0);
    $("enemy-name").textContent = enemy.name.replace(/^Frenzied /, "");
    $("enemy-name").title = enemy.name;
    $("enemy-role").textContent = enemy.role;
    $("enemy-icon").textContent = enemy.boss ? "♛" : ["I", "II", "III", "IV", "V", "VI"][enemy.zone];
  }

  function memberCards(shop = false) {
    return Object.entries(memberTypes).map(([key, definition]) => {
      const index = state.party.findIndex((member) => member.key === key);
      if (index < 0) return `<div class="party-card locked-member"><span class="party-portrait">${definition.icon}</span><span><strong>${definition.name}</strong><small>Rescue after round ${definition.joins}</small></span></div>`;
      const member = state.party[index];
      const disabled = !shop && (practice || state.phase !== "ready" || !member.hp || state.acted.includes(index));
      return `<button class="party-card${index === state.actorIndex ? " active-member" : ""}${!member.hp ? " downed" : ""}" data-member="${index}" aria-pressed="${index === state.actorIndex}" aria-label="${definition.name}, ${definition.role}, ${member.hp} of ${member.maxHp} health, ${member.collection.length} dice. ${definition.perk}"${disabled ? " disabled" : ""}><span class="party-portrait" aria-hidden="true">${namespaceArtwork(memberArtwork(key), `${shop ? "shop" : "party"}-${key}`)}</span><span class="member-copy"><strong>${definition.name} <em>${definition.role}</em></strong><small>${member.hp} / ${member.maxHp} HP${member.shield ? ` · ⬡ ${member.shield}` : ""}</small><span class="member-health"><i style="width:${member.hp / member.maxHp * 100}%"></i></span><small>${shop ? `${member.collection.length} / 6 dice` : !member.hp ? "DOWNED" : state.acted.includes(index) ? "TURN COMPLETE" : index === state.actorIndex ? "ACTIVE TURN" : "TURN READY"}</small></span></button>`;
    }).join("");
  }

  function renderFormation() {
    $("party-roster").innerHTML = memberCards();
    $("party-turn-label").textContent = `${memberTypes[actor().key].name}'s dice · ${state.acted.length} / ${state.party.length} turns spent`;
    $("enemy-group-label").textContent = `${state.enemies.filter((enemy) => enemy.hp > 0).length} / ${state.enemies.length} alive · click a target`;
    $("enemy-roster").innerHTML = state.enemies.map((enemy, i) => {
      const intent = getIntent(enemy);
      const member = state.party[intent.target];
      const disabled = practice || !["ready", "rolled"].includes(state.phase) || !enemy.hp;
      return `<button class="enemy-card${i === state.target ? " targeted" : ""}${!enemy.hp ? " fallen-enemy" : ""}" data-enemy="${i}" aria-pressed="${i === state.target}" aria-label="Target ${enemy.name}, ${enemy.hp} of ${enemy.maxHp} health${enemy.shield ? `, ${enemy.shield} shield` : ""}"${disabled ? " disabled" : ""}><span class="enemy-portrait" aria-hidden="true">${namespaceArtwork(enemyArtwork(enemy), `formation-${i}`)}</span><strong>${enemy.name.replace(/^Frenzied /, "")}</strong><small>${enemy.hp} / ${enemy.maxHp} HP${enemy.shield ? ` · ⬡ ${enemy.shield}` : ""}</small><span class="member-health enemy-health-track"><i style="width:${enemy.hp / enemy.maxHp * 100}%"></i></span><small>${!enemy.hp ? "DEFEATED" : enemy.frozen ? "FROZEN" : intent.kind === "guard" ? `⬡ ${intent.value} shield` : `⚔ ${Math.max(0, intent.value - enemy.chill)} → ${memberTypes[member.key].name}${enemy.chill ? " · ❄" : ""}`}${enemy.poison && enemy.hp ? ` · ❧ ${enemy.poison}` : ""}</small></button>`;
    }).join("");
  }

  function selectMember(index) {
    if (practice || !$("reset-overlay").hidden || !state.party[index]) return;
    if (state.phase === "shop") closeSale(false);
    else if (state.phase !== "ready" || !state.party[index].hp || state.acted.includes(index)) return;
    state.actorIndex = index;
    render();
    if (state.phase === "shop") renderShop();
    else $("main-button").focus({ preventScroll: true });
  }

  function selectEnemy(index) {
    if (practice || !["ready", "rolled"].includes(state.phase) || !state.enemies[index]?.hp) return;
    state.target = index;
    render();
    $("enemy-roster").querySelector(`[data-enemy="${index}"]`).focus({ preventScroll: true });
  }

  function getIntent(enemy = targetEnemy()) {
    const [kind, base, name] = enemy.moves[(state.turn - 1 + enemy.moveOffset) % enemy.moves.length];
    const rage = Math.floor((state.turn - 1) / 3);
    const living = livingMembers();
    const target = living.length ? living[(state.turn - 1 + state.enemies.indexOf(enemy)) % living.length].index : state.actorIndex;
    return { kind, value: kind === "guard" ? base : base + rage, name, rage, target };
  }

  function totals() {
    const result = { attack: 0, guard: 0, mend: 0, criticals: 0, pierce: 0, poison: 0, gold: 0, chill: 0, chains: 0 };
    const omen = currentOmen();
    const power = state.power + (omen.power || 0) + (actor().key === "mage" ? 2 : 0);
    const ward = state.ward + (omen.ward || 0);
    const healing = state.healing + (omen.healing || 0);
    actor().dice.forEach((die) => {
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
      else if (die.type === "frost") { result.pierce += Math.ceil(value / 2) + power; result.chill += Math.ceil(value / 2); }
      else if (die.type === "lightning") {
        const strikes = die.value >= 5 ? 2 : 1;
        result.attack += (value + power) * strikes;
        if (strikes === 2) result.chains++;
      } else if (die.type === "bloom") { result.mend += Math.ceil(value / 2) + healing; result.guard += Math.floor(value / 2) + ward; }
    });
    return result;
  }

  function currentOmen() {
    return state.omens[state.encounters[state.encounter].zone];
  }

  function addGold(amount) {
    state.gold += amount;
    state.stats.earned += amount;
  }

  function absorbDamage(shield, incoming) {
    const blocked = Math.min(shield, incoming);
    return { blocked, damage: incoming - blocked, shield: shield - blocked };
  }

  function defenseResult(action, progress) {
    const [start, end] = action === "parry" ? [.78, .9] : [.58, .94];
    return { action, success: progress >= start && progress <= end, timing: progress < start ? "early" : progress > end ? "late" : "perfect" };
  }

  function defend(title, description, required = null) {
    cancelDefense();
    return new Promise((resolve) => {
      defense = { resolve, required, armed: false, paused: false, elapsed: 0, frame: 0 };
      $("defense-title").textContent = title;
      $("defense-description").textContent = description;
      $("defense-status").textContent = "Ready when you are. Start the strike, then react once as the marker crosses a colored window.";
      $("defense-meter").dataset.progress = "0";
      $("defense-meter").setAttribute("aria-valuenow", "0");
      $("defense-marker").style.left = "0%";
      $("defense-ready").hidden = false;
      $("defense-dodge").disabled = true;
      $("defense-parry").disabled = true;
      $("defense-relaxed").checked = relaxedTiming;
      $("defense-relaxed").disabled = false;
      $("defense-overlay").hidden = false;
      document.querySelector(".app").inert = true;
      $("tutorial-overlay").inert = Boolean(practice);
      $("defense-ready").focus({ preventScroll: true });
    });
  }

  function armDefense() {
    if (!defense || defense.armed) return;
    defense.armed = true;
    defense.duration = relaxedTiming ? 5000 : 2500;
    defense.startedAt = performance.now();
    defense.paused = document.hidden;
    $("defense-ready").hidden = true;
    $("defense-relaxed").disabled = true;
    $("defense-dodge").disabled = Boolean(defense.required && defense.required !== "dodge");
    $("defense-parry").disabled = Boolean(defense.required && defense.required !== "parry");
    $("defense-status").textContent = defense.required === "parry" ? "Wait for GOLD. Press P or Parry inside the narrow gold window." : "Watch the marker. DODGE [D] in blue; PARRY [P] in gold.";
    $("defense-overlay").querySelector(".modal").focus({ preventScroll: true });
    if (!defense.paused) tickDefense(defense);
  }

  function tickDefense(session) {
    if (defense !== session) return;
    if (document.hidden) { pauseDefense(); return; }
    const progress = Math.min(1, (performance.now() - session.startedAt) / session.duration);
    $("defense-meter").dataset.progress = String(progress);
    $("defense-meter").setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    $("defense-marker").style.left = `${progress * 100}%`;
    if (progress >= 1) { finishDefense({ action: null, success: false, timing: "missed" }); return; }
    session.frame = requestAnimationFrame(() => tickDefense(session));
  }

  function reactDefense(action) {
    if (!defense?.armed || defense.paused || document.hidden || (defense.required && defense.required !== action)) return;
    finishDefense(defenseResult(action, (performance.now() - defense.startedAt) / defense.duration));
  }

  function finishDefense(result) {
    if (!defense) return;
    const session = defense;
    cancelAnimationFrame(session.frame);
    defense = null;
    $("defense-overlay").hidden = true;
    $("tutorial-overlay").inert = false;
    document.querySelector(".app").inert = Boolean(practice) || ["victory", "shop", "won", "lost"].includes(state.phase);
    session.resolve(result);
  }

  function cancelDefense() {
    if (defense) finishDefense({ cancelled: true, success: false, action: null });
  }

  function pauseDefense() {
    if (!defense?.armed || defense.paused) return;
    defense.elapsed = Math.min(1, (performance.now() - defense.startedAt) / defense.duration);
    defense.paused = true;
    cancelAnimationFrame(defense.frame);
  }

  function resumeDefense() {
    if (!defense?.armed || !defense.paused) return;
    defense.startedAt = performance.now() - defense.elapsed * defense.duration;
    defense.paused = false;
    tickDefense(defense);
  }

  function render() {
    const enemy = targetEnemy();
    const intent = getIntent();
    paintCombatants();
    renderFormation();
    const app = document.querySelector(".app");
    app.hidden = state.phase === "shop";
    app.inert = Boolean(practice) || ["victory", "shop", "won", "lost"].includes(state.phase);
    $("hero-hp").innerHTML = `${actor().hp} <small>/ ${actor().maxHp}</small><span class="hero-shield" id="hero-shield-counter" title="Unused shield carries between turns and clears when this battle ends." aria-label="${actor().shield} shield remaining"${actor().shield ? "" : " hidden"}> · ⬡ <b>${actor().shield}</b></span>`;
    $("ward-aura").classList.toggle("visible", actor().shield > 0);
    $("enemy-hp").innerHTML = `${enemy.hp} <small>/ ${enemy.maxHp}${enemy.shield ? ` · ⬡ ${enemy.shield}` : ""}</small>`;
    $("hero-health-fill").style.width = `${actor().hp / actor().maxHp * 100}%`;
    $("enemy-health-fill").style.width = `${enemy.hp / enemy.maxHp * 100}%`;
    $("hero-power").textContent = `+${state.power + (actor().key === "mage" ? 2 : 0)} attack power`;
    $("hero-healing").textContent = `+${state.healing} healing`;
    $("hero-caption")?.setAttribute("title", `Attack +${state.power} per die. Guard +${state.ward} per die. Mend +${state.healing} per die. Critical bonus +${state.critBonus}.`);
    $("encounter-number").textContent = String(state.encounter + 1).padStart(2, "0");
    $("gold-counter").innerHTML = `◈ <b>${state.gold}</b>`;
    $("gold-counter").setAttribute("aria-label", `${state.gold} gold`);
    const omen = currentOmen();
    const nextShop = state.encounters.findIndex((round, index) => index >= state.encounter && round.kind === "shop");
    const untilShop = nextShop - state.completed;
    $("run-note").textContent = `RUN ${state.code} · ${omen.name}: ${omen.text} · ${state.phase === "shop" ? "SHOP-ONLY ROUND" : nextShop < 0 ? "FINAL GUARDIAN" : `SHOP IN ${untilShop} ${untilShop === 1 ? "VICTORY" : "VICTORIES"}`}`;
    $("turn-counter").textContent = `TURN ${String(state.turn).padStart(2, "0")}${intent.rage ? ` · RAGE +${intent.rage}` : ""}`;
    $("route").innerHTML = zones.map((zone, chapter) => `<span class="route-chapter" aria-label="${zone.title}">${state.encounters.slice(chapter * SHOP_INTERVAL, chapter === zones.length - 1 ? RUN_LENGTH : (chapter + 1) * SHOP_INTERVAL).map((round, slot) => {
      const i = chapter * SHOP_INTERVAL + slot;
      return `${slot ? '<span class="route-line"></span>' : ""}<span class="route-node${round.boss ? " boss" : ""}${round.kind === "shop" ? " shop-node" : ""}${i < state.completed ? " done" : i === state.encounter ? " current" : ""}" data-round="${i + 1}" data-kind="${round.kind}" aria-label="Round ${i + 1}: ${round.name}${i < state.completed ? ", completed" : i === state.encounter ? ", current" : ""}"${i === state.encounter ? ' aria-current="step"' : ""}><span>${i < state.completed ? "✓" : round.kind === "shop" ? "◈" : round.boss ? "♛" : i + 1}</span></span>`;
    }).join("")}</span>`).join("");
    const intentIcon = intent.kind === "guard" ? "⬡" : intent.kind === "drain" ? "✦" : "⚔";
    const intentSuffix = intent.kind === "guard" ? `gains <strong>${intent.value}</strong> shield` : `<strong>${Math.max(0, intent.value - enemy.chill)}</strong> damage${enemy.chill ? ` (❄ −${enemy.chill})` : ""}${intent.kind === "drain" ? " + lifesteal" : ""}`;
    $("intent").innerHTML = `<span class="intent-icon">${intentIcon}</span><span>${enemy.frozen ? "FROZEN · next action skipped" : `${intent.name} · ${intentSuffix}${intent.kind !== "guard" && enemy.hp ? ` → ${memberTypes[state.party[intent.target].key].name}` : ""}`}${enemy.poison ? ` · ❧ ${enemy.poison}` : ""}</span>`;
    const phase = state.phase;
    const badge = phase === "resolving" ? "BATTLE IN MOTION" : ["victory", "shop", "won"].includes(phase) ? "VICTORY" : phase === "lost" ? "EXPEDITION ENDED" : "YOUR TURN";
    $("battle-badge").innerHTML = `<span></span> ${badge}`;
    renderDice();
    const values = totals();
    ["attack", "guard", "mend"].forEach((action) => {
      const value = action === "attack" ? values.attack + values.pierce : action === "guard" ? actor().shield + (["rolling", "rolled"].includes(phase) ? values.guard : 0) : values[action];
      $(`${action}-value`).textContent = value;
      $(`${action}-dice`).textContent = action === "guard" && value ? `${actor().shield} STORED${phase === "rolled" && values.guard ? ` · +${values.guard} NEW` : ""}` : phase === "ready" ? "ROLL TO REVEAL" : action === "attack" && values.criticals ? `${values.criticals} CRITICAL ${values.criticals === 1 ? "DIE" : "DICE"}` : value ? "AUTOMATIC EFFECT" : "NO CONTRIBUTION";
      $(`${action}-dice`).classList.toggle("has-dice", value > 0);
      $(`summary-${action}`).classList.toggle("active", value > 0);
    });
    $("special-effects").innerHTML = `${values.pierce ? `<span>✦ ${values.pierce} piercing damage</span>` : ""}${values.poison ? `<span>❧ +${values.poison} poison</span>` : ""}${values.gold ? `<span>◈ +${values.gold} gold</span>` : ""}${values.chill ? `<span>❄ −${values.chill} enemy damage</span>` : ""}${values.chains ? `<span>ϟ ${values.chains} double ${values.chains === 1 ? "strike" : "strikes"}</span>` : ""}`;
    $("main-button").disabled = !["ready", "rolled"].includes(phase);
    $("reset-button").disabled = ["rolling", "resolving", "victory"].includes(phase);
    $("tutorial-button").disabled = !["ready", "rolled"].includes(phase);
    $("start-tutorial").disabled = !["ready", "rolled"].includes(phase);
    $("main-button-text").textContent = phase === "ready" ? actor().collection.length === 1 ? "Roll your die" : "Roll your dice" : phase === "rolling" ? "Rolling…" : phase === "resolving" ? "Fighting…" : phase === "rolled" ? "Make your move" : "Battle complete";
    $("reroll-button").disabled = phase !== "rolled" || !actor().rerolls || actor().selected === null;
    $("reroll-button").innerHTML = `↻ Reroll selected <span>${actor().rerolls} left</span>`;
    $("dice-count").textContent = `${actor().collection.length} / ${MAX_DICE}`;
    $("dice-caption").textContent = phase === "rolled" ? "SELECT A DIE TO REROLL, OR MAKE YOUR MOVE" : phase === "rolling" ? "FATE IS DECIDING…" : "BUILD YOUR COLLECTION AT THE NEXT SHOP";
    $("die-description").textContent = actor().selected !== null ? dieDescription(actor().dice[actor().selected]) : "Six materials, ten effects. Find rare dice and sell old ones at the shop.";
    $("phase-title").textContent = phase === "ready" ? "Make your own luck." : phase === "rolled" ? "Your collection. Your destiny." : phase === "rolling" ? "Let fortune fall." : phase === "resolving" ? "Your fate unfolds." : phase === "lost" ? "The dice will roll again." : "Fortune favors the brave.";
    $("phase-instruction").textContent = phase === "rolled" ? `${memberTypes[actor().key].name}'s effects are ready. Choose an enemy, reroll, cast an ability, or fight.` : phase === "ready" ? `${memberTypes[actor().key].name}'s turn. Roll ${actor().collection.length === 1 ? "their die" : `their ${actor().collection.length} dice`}. Every living ally acts before the enemies.` : phase === "rolling" ? "A little courage. A little luck." : phase === "resolving" ? "Watch enemy attacks. Dodge for safety, or parry to counter." : "An expedition is only the beginning.";
    const outgoing = Math.max(0, values.attack - enemy.shield) + values.pierce;
    const healTarget = healingTarget();
    $("combat-preview").textContent = phase === "rolled" ? `${outgoing} damage${values.poison ? ` +${values.poison} poison` : ""} · ${Math.min(values.mend, healTarget.maxHp - healTarget.hp)} healing to ${memberTypes[healTarget.key].name} · ${outgoing >= enemy.hp ? "lethal strike!" : `target: ${enemy.name}`}` : `${memberTypes[actor().key].perk} Dodge [D] · Parry [P] during enemy strikes.`;
    renderAbilities();
    $("skill-list").innerHTML = Object.entries(state.skills).map(([key, level]) => `<span title="${skills[key].text}">${skills[key].icon} ${skills[key].name} ${level > 1 ? `×${level}` : ""}</span>`).join("");
    saveProgress();
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
    const dice = actor().dice.length ? actor().dice : actor().collection.map((die) => ({ ...die, value: 6 }));
    $("dice-tray").innerHTML = dice.map((die, index) => {
      const tier = diceTiers[die.tier];
      return `<button class="die type-${die.type} tier-${die.tier}${state.phase === "ready" ? " unrolled" : ""}${actor().selected === index ? " selected" : ""}${state.phase === "rolling" && (state.rollingIndex === undefined || state.rollingIndex === index) ? " rolling" : ""}" data-index="${index}" data-type="${die.type}" data-tier="${die.tier}" data-value="${die.value}" title="${dieDescription(state.phase === "ready" ? actor().collection[index] : die)}" aria-label="${dieName(die)} ${index + 1}: ${state.phase === "ready" ? "not rolled" : `${die.value}${tier.bonus ? ` plus ${tier.bonus} tier bonus` : ""}`}" aria-pressed="${actor().selected === index}"${state.phase !== "rolled" ? " disabled" : ""}>${dieMarkup(die.value)}${tier.bonus ? `<span class="die-tier-mark" aria-hidden="true">${tier.icon}<small>+${tier.bonus}</small></span>` : ""}<span class="die-assignment ${die.type}" aria-hidden="true">${diceTypes[die.type].icon}</span><span class="die-type-label" aria-hidden="true">${diceTypes[die.type].label}<small>${tier.name.toUpperCase()}</small></span></button>`;
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
    queueMicrotask(() => saveProgress());
  }

  function selectDie(index) {
    if (practice || state.phase !== "rolled" || !actor().dice[index]) return;
    actor().selected = index;
    render();
    $("dice-tray").children[index].focus({ preventScroll: true });
    playSound("select");
  }

  async function rollDice(reroll = false) {
    if (practice) return;
    if (reroll ? state.phase !== "rolled" || !actor().rerolls || actor().selected === null : state.phase !== "ready") return;
    const run = state.id;
    const index = reroll ? actor().selected : undefined;
    if (reroll) {
      actor().rerolls--;
    } else {
      actor().dice = actor().collection.map((die) => ({ ...die, value: 1 }));
      actor().rerolls = 1 + state.extraRerolls;
    }
    state.phase = "rolling";
    state.rollingIndex = index;
    actor().selected = null;
    render();
    playSound("roll");
    for (let frame = 0; frame < 9; frame++) {
      actor().dice.forEach((die, i) => { if (index === undefined || i === index) die.value = rollDie(); });
      renderDice();
      await wait(65 + frame * 5);
      if (state.id !== run) return;
    }
    state.stats.rolls += reroll ? 1 : actor().dice.length;
    state.phase = "rolled";
    actor().selected = index === undefined ? 0 : index;
    delete state.rollingIndex;
    render();
    if ($("help-overlay").hidden) $("dice-tray").children[actor().selected].focus({ preventScroll: true });
    log(reroll ? `${dieName(actor().dice[index])} rerolled: ${actor().dice[index].value}.` : `Your dice rolled ${actor().dice.map((die) => die.value).join(", ")}. Their effects are ready.`);
  }

  function animate(id, className, duration = 550) {
    const element = $(id);
    const run = state.id;
    const artKey = element.dataset.artKey;
    element.classList.remove("strike", "enemy-strike", "hit");
    void element.offsetWidth;
    element.classList.add(className);
    setTimeout(() => { if (state.id === run && element.dataset.artKey === artKey) element.classList.remove(className); }, reducedMotion ? 30 : duration);
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
    if (practice || state.phase !== "rolled" || actor().dice.length !== actor().collection.length) return;
    const run = state.id;
    state.phase = "resolving";
    const values = totals();
    const intent = getIntent();
    const enemy = targetEnemy();
    const member = actor();
    actor().shield += values.guard;
    if (values.gold) {
      addGold(values.gold);
      log(`Fortune dice earn ${values.gold} gold.`);
    }
    render();
    if (values.mend) {
      const ally = healingTarget(member);
      const healed = Math.min(ally.maxHp - ally.hp, values.mend);
      ally.hp += healed;
      if (healed) {
        floatNumber("hero", `+${healed}`, "heal", "MEND");
        playSound("heal");
        log(`${memberTypes[member.key].name}'s dice restore ${healed} health to ${memberTypes[ally.key].name}.`);
        render();
        await wait(550);
        if (state.id !== run) return;
      }
    }
    if (values.guard) {
      floatNumber("hero", `+${values.guard}`, "block", "SHIELD");
      log(`Your dice add ${values.guard} shield. ${actor().shield} shield is stored.`);
      playSound("block");
    }
    if (values.chill && intent.kind !== "guard" && !enemy.frozen) {
      log(`Frost reduces the enemy's next strike by ${Math.min(values.chill, intent.value)} damage this turn.`);
    }
    if (values.attack || values.pierce) {
      animate("hero-art", "strike");
      await wait(300);
      if (state.id !== run) return;
      const absorbed = absorbDamage(enemy.shield, values.attack);
      const blocked = absorbed.blocked;
      const damage = Math.min(enemy.hp, absorbed.damage + values.pierce);
      enemy.shield = absorbed.shield;
      enemy.hp -= damage;
      state.stats.damage += damage;
      state.stats.criticals += values.criticals;
      floatNumber("enemy", damage ? `−${damage}` : "BLOCK", damage ? values.criticals ? "critical" : "" : "block", values.criticals ? "CRITICAL" : "");
      animate("enemy-art", "hit");
      animate("arena", "impact", 350);
      playSound("hit");
      log(`${values.criticals ? "Critical strike! " : ""}${values.chains ? "Lightning strikes twice! " : ""}You deal ${damage} damage${blocked ? ` (${blocked} absorbed by its shield)` : ""}${values.pierce ? `, including ${values.pierce} piercing` : ""}.`);
      render();
      await wait(650);
      if (state.id !== run) return;
    }
    if (values.poison && enemy.hp) enemy.poison = Math.min(12, enemy.poison + values.poison);
    enemy.chill += values.chill;
    member.dice = [];
    member.selected = null;
    member.rerolls = 1 + state.extraRerolls;
    state.acted.push(state.actorIndex);
    if (enemy.hp <= 0) {
      await victory(state.target, "party");
      return;
    }
    await nextPartyTurn();
  }

  async function nextPartyTurn() {
    const next = livingMembers().find(({ index }) => !state.acted.includes(index));
    if (next) {
      state.actorIndex = next.index;
      state.phase = "ready";
      if (!targetEnemy().hp) state.target = state.enemies.findIndex((enemy) => enemy.hp > 0);
      render();
      $("main-button").focus({ preventScroll: true });
    } else {
      state.phase = "resolving";
      await enemyRound();
    }
  }

  async function enemyRound() {
    const run = state.id;
    for (let i = state.enemyCursor; i < state.enemies.length; i++) {
      const enemy = state.enemies[i];
      state.enemyCursor = i + 1;
      if (!enemy.hp) continue;
      state.target = i;
      const intent = getIntent(enemy);
      state.actorIndex = intent.target;
      render();
      if (enemy.poison) {
        const damage = Math.min(enemy.hp, enemy.poison);
        enemy.hp -= damage;
        enemy.poison--;
        state.stats.damage += damage;
        floatNumber("enemy", `−${damage}`, "heal", "POISON");
        log(`Venom deals ${damage} damage to ${enemy.name} through armor.`);
        render();
        await wait(400);
        if (state.id !== run) return;
        if (!enemy.hp) { await victory(i, "enemies"); return; }
      }
      const weakened = Math.max(0, intent.value - enemy.chill);
      enemy.chill = 0;
      if (enemy.frozen) {
        enemy.frozen = false;
        floatNumber("enemy", "FROZEN", "block");
        log(`${enemy.name} is frozen and cannot act.`);
        render();
        await wait(350);
      } else if (intent.kind === "guard") {
        enemy.shield += intent.value;
        floatNumber("enemy", `+${intent.value}`, "block", "SHIELD");
        playSound("block");
        log(`${enemy.name} gains ${intent.value} shield.`);
        render();
        await wait(400);
      } else {
        const member = actor();
        const reaction = await defend(`${enemy.name} · ${intent.name}`, `${memberTypes[member.key].name} faces ${weakened} damage. Shield: ${member.shield}.`, false);
        if (state.id !== run || reaction.cancelled) return;
        animate("enemy-art", "enemy-strike");
        const absorbed = absorbDamage(member.shield, reaction.success ? 0 : weakened);
        const damage = Math.min(member.hp, absorbed.damage);
        member.shield = absorbed.shield;
        member.hp -= damage;
        if (reaction.success) {
          state.stats[reaction.action === "parry" ? "parries" : "dodges"]++;
          floatNumber("hero", reaction.action === "parry" ? "PARRY!" : "DODGED", "block");
          playSound("block");
          log(`${memberTypes[member.key].name} ${reaction.action === "parry" ? "parries" : "dodges"} ${enemy.name}. No damage, no shield spent.`);
          if (reaction.action === "parry") {
            const counter = Math.min(enemy.hp, 4 + state.power);
            enemy.hp -= counter;
            state.stats.damage += counter;
            floatNumber("enemy", `−${counter}`, "critical", "RIPOSTE");
            log(`Parry counter deals ${counter} damage through shields.`);
          }
        } else {
          floatNumber("hero", damage ? `−${damage}` : "BLOCK", damage ? "" : "block", reaction.action ? `${reaction.timing.toUpperCase()} ${reaction.action.toUpperCase()}` : "");
          if (damage) { animate("hero-art", "hit"); playSound("hit"); }
          log(`${reaction.timing === "early" ? "Too early! " : reaction.timing === "late" ? "Too late! " : ""}${memberTypes[member.key].name} takes ${damage} damage from ${enemy.name}${absorbed.blocked ? `; ${absorbed.blocked} shield spent, ${member.shield} left` : ""}.`);
        }
        if (intent.kind === "drain" && damage) {
          const healing = Math.min(enemy.maxHp - enemy.hp, Math.ceil(damage / 2));
          enemy.hp += healing;
          log(`${enemy.name} steals ${healing} health.`);
        }
        render();
        await wait(450);
        if (state.id !== run) return;
        if (!enemy.hp) { await victory(i, "enemies"); return; }
        if (!livingMembers().length) {
          state.phase = "lost";
          playSound("loss");
          render();
          showEnding(false);
          return;
        }
      }
      if (state.id !== run) return;
    }
    state.turn++;
    state.acted = [];
    state.enemyCursor = 0;
    state.actorIndex = livingMembers()[0].index;
    if (!targetEnemy().hp) state.target = state.enemies.findIndex((enemy) => enemy.hp > 0);
    state.phase = "ready";
    render();
    $("main-button").focus({ preventScroll: true });
  }

  async function victory(index = state.target, resume = "party") {
    const enemy = state.enemies[index];
    if (state.phase !== "resolving" || enemy.hp > 0 || enemy.rewarded) return;
    const run = state.id;
    enemy.rewarded = true;
    state.defeated++;
    const won = battleWon();
    if (won) state.completed = state.encounter + 1;
    const recruits = won ? recruitCompanions() : [];
    state.phase = "victory";
    const omen = currentOmen();
    const gold = Math.ceil(enemy.gold * (1 + state.lootBonus)) + (omen.gold || 0);
    addGold(gold);
    const recipients = won ? state.party : livingMembers().map(({ member }) => member).sort((a, b) => (b.maxHp - b.hp) - (a.maxHp - a.hp)).slice(0, 1);
    let recovery = 0;
    recipients.forEach((member) => { const healing = Math.min(member.maxHp - member.hp, 8 + state.recovery + (omen.recovery || 0)); member.hp += healing; recovery += healing; });
    if (won) state.party.forEach((member) => { member.dice = []; member.selected = null; });
    state.reward = { gold, recovery, enemyIndex: index, battleWon: won, resume, recruits };
    $("enemy-art").classList.add("defeated");
    $("ward-aura").classList.remove("visible");
    saveRecord();
    playSound("victory");
    log(`${enemy.name} falls. +${gold} gold${recovery ? `, +${recovery} party health` : ""}.${recruits.length ? ` ${recruits.map((key) => memberTypes[key].name).join(" and ")} joins your party!` : ""}`);
    closeHelp(false);
    renderReward(false);
    render();
    $("reward-overlay").querySelector(".modal").focus({ preventScroll: true });
    await wait(1000);
    if (state.id !== run) return;
    $("reward-continue").disabled = false;
    $("reward-continue").focus({ preventScroll: true });
  }

  function renderReward(ready) {
    const { gold, recovery, enemyIndex, battleWon: won, recruits } = state.reward;
    $("reward-description").textContent = `${state.enemies[enemyIndex].name} defeated. ${won ? `Round ${state.encounter + 1} complete.` : `${state.enemies.filter((enemy) => enemy.hp > 0).length} enemies remain; this battle continues.`} Your spoils are already in your purse.`;
    $("reward-gold").textContent = `+${gold}`;
    $("reward-health").textContent = recovery ? `+${recovery}` : "FULL";
    $("reward-health-note").textContent = recovery ? won ? "Recovery for every ally; downed allies return." : "Recovery for your most injured living ally." : "Your party is already at full health.";
    $("reward-wallet").textContent = `Your purse: ${state.gold} gold`;
    $("reward-recruit").hidden = !recruits.length;
    $("reward-recruit").innerHTML = recruits.map((key) => `<span class="recruit-portrait" aria-hidden="true">${namespaceArtwork(memberArtwork(key), `recruit-${key}`)}</span><div><p class="eyebrow">A NEW COMPANION</p><h3>${memberTypes[key].name}, ${memberTypes[key].role}</h3><p>${memberTypes[key].perk} Starts with their own ${dieName({ type: memberTypes[key].die, tier: "base" })} and ${abilities[memberTypes[key].ability].name}.</p></div>`).join("");
    $("reward-continue").textContent = !won ? "Return to battle ↗" : state.encounter === RUN_LENGTH - 1 ? "Claim victory ↗" : state.encounters[state.encounter + 1].kind === "shop" ? "Enter the market ↗" : "Next round ↗";
    $("reward-continue").disabled = !ready;
    $("reward-overlay").hidden = false;
  }

  async function continueVictory() {
    if (state.phase !== "victory" || !state.reward || $("reward-continue").disabled) return;
    const reward = state.reward;
    state.phase = "resolving";
    state.reward = null;
    $("reward-overlay").hidden = true;
    if (!reward.battleWon) {
      state.target = state.enemies.findIndex((enemy) => enemy.hp > 0);
      if (reward.resume.startsWith("ability-")) {
        state.phase = reward.resume.slice("ability-".length);
        render();
        $("main-button").focus({ preventScroll: true });
      } else if (reward.resume === "enemies") await enemyRound();
      else await nextPartyTurn();
    } else if (state.encounter === RUN_LENGTH - 1) {
      state.phase = "won";
      render();
      showEnding(true);
    } else {
      state.encounter++;
      loadEncounter();
      if (state.phase === "ready") $("main-button").focus({ preventScroll: true });
    }
  }

  function makeStock() {
    state.expandedOffers.clear();
    const types = ["attack", shuffle(["guard", "mend"])[0]];
    const newType = shuffle(["frost", "lightning", "bloom"])[0];
    types.push(newType, shuffle(Object.keys(diceTypes).filter((key) => !types.includes(key) && key !== newType))[0]);
    const offers = [
      ...types.map((key) => ({ kind: "dice", key })),
      ...shuffle(Object.keys(abilities).filter((key) => state.party.some((member) => !member.abilities.includes(key)))).slice(0, 2).map((key) => ({ kind: "ability", key })),
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
    return (offer.kind === "skill" && offer.bought) || (offer.kind === "dice" && actor().collection.length >= MAX_DICE) ||
      (offer.kind === "ability" && actor().abilities.includes(offer.key)) ||
      (offer.kind === "skill" && (state.skills[offer.key] || 0) >= skills[offer.key].max);
  }

  function offerPrice(offer, tier = "base") {
    return offer.kind === "dice" ? Math.round(offer.price * diceTiers[tier].priceMultiplier) : offer.price;
  }

  function openShop() {
    clearInfoToast();
    state.phase = "shop";
    state.shopFilter = "all";
    state.refreshed = false;
    makeStock();
    closeHelp(false);
    renderShopHeading();
    $("shop-overlay").hidden = false;
    render();
    renderShop();
    $("shop-overlay").querySelector(".shop-modal").scrollTop = 0;
    $("leave-shop").focus({ preventScroll: true });
  }

  function renderShopHeading() {
    $("shop-eyebrow").textContent = `ROUND ${state.encounter + 1} / ${RUN_LENGTH} · SHOP ONLY`;
    $("shop-description").textContent = `A safe haven in ${zones[state.encounters[state.encounter].zone].title}. No monster this round: spend your gold, upgrade your dice, and prepare for ${state.encounter === RUN_LENGTH - 2 ? "the final guardian" : "the next area"}.`;
  }

  function renderShop() {
    $("shop-party").innerHTML = memberCards(true);
    $("shop-recipient").textContent = `Shopping for ${memberTypes[actor().key].name}: dice and abilities belong to this companion. Skills improve the whole party.`;
    $("shop-purse").innerHTML = `◈ <b>${state.gold}</b><small>GOLD TO SPEND</small>`;
    const levels = Object.values(state.skills).reduce((a, b) => a + b, 0);
    $("shop-status").textContent = `♡ ${actor().hp} / ${actor().maxHp} HP · ${actor().collection.length} / ${MAX_DICE} dice · ${actor().abilities.length} ${actor().abilities.length === 1 ? "ability" : "abilities"} · ${levels} skill ${levels === 1 ? "level" : "levels"}`;
    $("shop-tabs").querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === state.shopFilter)));
    if (state.shopFilter === "owned") {
      renderOwnedDice();
    } else {
      const visible = state.stock.map((offer, index) => ({ offer, index })).filter(({ offer }) => state.shopFilter === "all" || offer.kind === state.shopFilter);
      $("shop-stock").innerHTML = visible.length ? visible.map(({ offer, index }) => {
        const item = itemDefinition(offer);
        const unavailable = offerUnavailable(offer);
        if (offer.kind === "dice") {
          const owned = actor().collection.filter((die) => die.type === offer.key).length;
          const variants = Object.entries(diceTiers).map(([key, tier]) => {
            const price = offerPrice(offer, key);
            const count = actor().collection.filter((die) => die.type === offer.key && die.tier === key).length;
            const disabled = unavailable || state.gold < price;
            return `<button class="variant-buy variant-${key}" data-offer="${index}" data-tier="${key}" aria-label="Buy ${tier.name} ${item.name} for ${price} gold. Owned ${count}.${unavailable ? " Collection full." : state.gold < price ? " Not enough gold." : ""}"${disabled ? " disabled" : ""}><span class="variant-icon" aria-hidden="true">${tier.icon}</span><span class="variant-copy"><strong>${tier.name}</strong><small>${tier.bonus ? `+${tier.bonus} power` : "Standard power"} · Owned ${count}</small></span><span class="variant-price">${unavailable ? "FULL" : `◈ ${price}`}</span></button>`;
          });
          const rare = `<details class="rare-materials" data-rare-offer="${index}"${state.expandedOffers.has(index) ? " open" : ""}><summary>Rare materials <small>Ruby · Emerald · Obsidian</small></summary><div class="variant-options">${variants.slice(3).join("")}</div></details>`;
          return `<div class="shop-card dice-shop-card type-${offer.key}"><span class="shop-card-icon">${item.icon}</span><span class="shop-card-kind">SPECIALIZED DIE · OWNED ${owned}</span><h3>${item.name}</h3><p>${item.text}</p><div class="variant-options">${variants.slice(0, 3).join("")}</div>${rare}<span class="repeat-purchase-note">BUY MULTIPLE · EACH COPY ROLLS SEPARATELY</span></div>`;
        }
        const owned = offer.kind === "skill" ? state.skills[offer.key] || 0 : actor().abilities.includes(offer.key) ? 1 : 0;
        const purchased = offer.kind === "skill" && offer.bought;
        const status = purchased ? "PURCHASED" : unavailable ? "MAXED / OWNED" : state.gold < offer.price ? "NEED MORE GOLD" : `BUY · ◈ ${offer.price}`;
        return `<button class="shop-card${purchased ? " purchased" : ""}" data-offer="${index}"${unavailable || state.gold < offer.price ? " disabled" : ""}><span class="shop-card-icon">${item.icon}</span><span class="shop-card-kind">${offer.kind === "ability" ? "THIS MEMBER · ONCE / BATTLE" : "PERMANENT PARTY SKILL"}${owned ? ` · OWNED ${owned}` : ""}</span><h3>${item.name}</h3><p>${item.text}</p><span class="shop-price">${status}${!unavailable && state.gold < offer.price ? ` · ◈ ${offer.price}` : ""}</span></button>`;
      }).join("") : '<p class="empty-stock">You already know all the abilities on offer. Browse dice or skills.</p>';
    }
    $("refresh-shop").disabled = state.refreshed || state.gold < 5;
    $("refresh-shop").textContent = state.refreshed ? "↻ Stock refreshed" : "↻ New stock · 5 gold";
    $("shop-rest").disabled = state.gold < 8 || actor().hp === actor().maxHp;
    saveProgress();
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
    if (offer.kind === "dice") {
      actor().collection.push({ id: state.nextDieId++, type: offer.key, tier, paidPrice: price });
      actor().dice = [];
      actor().selected = null;
    }
    else if (offer.kind === "ability") { actor().abilities.push(offer.key); }
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

  function saleRestriction(die) {
    if (actor().collection.length === 1) return "Keep at least one die.";
    if (diceTypes[die.type].offensive && actor().collection.filter((owned) => diceTypes[owned.type].offensive).length === 1) {
      return "Keep at least one damage-dealing die.";
    }
    return "";
  }

  function renderOwnedDice() {
    const tierOrder = Object.keys(diceTiers);
    const owned = [...actor().collection].sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));
    $("shop-stock").innerHTML = owned.map((die) => {
      const tier = diceTiers[die.tier];
      const refund = Math.floor(die.paidPrice / 2);
      const restriction = saleRestriction(die);
      const label = restriction ? actor().collection.length === 1 ? "KEEP ONE DIE" : "KEEP A DAMAGE DIE" : `Sell · ◈ ${refund}`;
      return `<div class="shop-card owned-card type-${die.type}"><span class="owned-gem variant-${die.tier}">${tier.icon}<small>${diceTypes[die.type].icon}</small></span><span class="shop-card-kind">YOUR COLLECTION · ${tier.name.toUpperCase()}</span><h3>${dieName(die)}</h3><p>${diceTypes[die.type].text}</p><span class="owned-material variant-${die.tier}">${tier.bonus ? `+${tier.bonus} material power` : "Standard material power"}</span><span class="owned-cost">${die.paidPrice ? `Paid ${die.paidPrice} gold · Refund ${refund}` : "Free starter die · Refund 0"}</span><button class="secondary-button sell-button" data-sell-id="${die.id}" title="${restriction || `Sell for ${refund} gold`}"${restriction ? " disabled" : ""}>${label}</button>${restriction ? `<span class="owned-restriction">${restriction}</span>` : ""}</div>`;
    }).join("");
  }

  function openSale(id) {
    if (state.phase !== "shop") return;
    const die = actor().collection.find((owned) => owned.id === id);
    if (!die) { notify("That die is no longer in your collection."); return; }
    const restriction = saleRestriction(die);
    if (restriction) { notify(restriction); return; }
    state.pendingSale = id;
    $("sell-description").textContent = `Sell your ${dieName(die)} for ${Math.floor(die.paidPrice / 2)} gold? This removes that copy and frees one collection slot.`;
    $("sell-overlay").hidden = false;
    $("cancel-sell").focus({ preventScroll: true });
    saveProgress();
  }

  function closeSale(restoreFocus = true) {
    $("sell-overlay").hidden = true;
    const id = state.pendingSale;
    state.pendingSale = null;
    if (restoreFocus) {
      const button = $("shop-stock").querySelector(`[data-sell-id="${id}"]:not(:disabled)`);
      (button || $("leave-shop")).focus({ preventScroll: true });
    }
    saveProgress();
  }

  function sellDie(id) {
    if (state.phase !== "shop") return;
    const index = actor().collection.findIndex((die) => die.id === id);
    if (index < 0) { notify("That die is no longer in your collection."); return; }
    const die = actor().collection[index];
    const restriction = saleRestriction(die);
    if (restriction) { notify(restriction); return; }
    const refund = Math.floor(die.paidPrice / 2);
    actor().collection.splice(index, 1);
    state.gold += refund;
    actor().dice = [];
    actor().selected = null;
    closeSale(false);
    render();
    renderShop();
    log(`${dieName(die)} sold for ${refund} gold. A slot is free for a better die.`);
    playSound("select");
    $("leave-shop").focus({ preventScroll: true });
  }

  function leaveShop() {
    if (state.phase !== "shop") return;
    closeSale(false);
    $("shop-overlay").hidden = true;
    state.completed = state.encounter + 1;
    saveRecord();
    state.encounter++;
    loadEncounter();
    log(`A new chapter. ${actor().collection.length} dice at your side.`);
    $("main-button").focus({ preventScroll: true });
  }

  function renderAbilities() {
    $("ability-bar").innerHTML = actor().abilities.length ? actor().abilities.map((key) => {
      const used = actor().usedAbilities.has(key);
      const ally = healingTarget();
      const disabled = used || !["ready", "rolled"].includes(state.phase) || (key === "salve" && ally.hp === ally.maxHp);
      return `<button class="ability-button" data-ability="${key}" title="${abilities[key].text}"${disabled ? " disabled" : ""}><span>${abilities[key].icon}</span><strong>${abilities[key].name}</strong><small>${used ? "USED" : key === "salve" && ally.hp === ally.maxHp ? "FULL HP" : "READY"}</small></button>`;
    }).join("") : '<p class="empty-abilities">Buy abilities in shop-only rounds: 5, 10, 15, 20, 25, and 30. Each refreshes every battle.</p>';
  }

  async function castAbility(key) {
    if (practice || !actor().abilities.includes(key) || actor().usedAbilities.has(key) || !["ready", "rolled"].includes(state.phase)) return;
    const ally = healingTarget();
    if (key === "salve" && ally.hp === ally.maxHp) return;
    const run = state.id;
    const previousPhase = state.phase;
    actor().usedAbilities.add(key);
    state.phase = "resolving";
    if (key === "fireball") {
      const damage = Math.min(10, targetEnemy().hp);
      targetEnemy().hp -= damage;
      state.stats.damage += damage;
      floatNumber("enemy", `−${damage}`, "critical", "EMBER BOLT");
      animate("enemy-art", "hit");
      playSound("hit");
      log(`Ember Bolt deals ${damage} damage through shields.`);
    } else if (key === "salve") {
      const healing = Math.min(14, ally.maxHp - ally.hp);
      ally.hp += healing;
      floatNumber("hero", `+${healing}`, "heal");
      playSound("heal");
      log(`Healing Spring restores ${healing} health to ${memberTypes[ally.key].name}.`);
    } else {
      targetEnemy().frozen = true;
      floatNumber("enemy", "FROZEN", "block");
      playSound("block");
      log("Frost Seal freezes the enemy's next action.");
    }
    render();
    await wait(600);
    if (state.id !== run) return;
    if (targetEnemy().hp <= 0) { await victory(state.target, `ability-${previousPhase}`); return; }
    state.phase = previousPhase;
    render();
    if ($("help-overlay").hidden) $("main-button").focus({ preventScroll: true });
  }

  function showEnding(won) {
    closeHelp(false);
    $("end-emblem").textContent = won ? "♛" : "◇";
    $("end-eyebrow").textContent = won ? "THE DARKNESS HAS FALLEN" : "THE END OF AN EXPEDITION";
    $("end-title").textContent = won ? "You defied the darkness." : "Not all luck lasts.";
    $("end-description").textContent = won ? `All ${RUN_LENGTH} rounds complete: six areas, six markets, ${BATTLE_COUNT} battles, and ${state.defeated} monsters defeated. Your party overcame the Starless Sovereign together.` : `${targetEnemy().name} defeated your party on round ${state.encounter + 1}. You completed ${state.completed} of ${RUN_LENGTH} rounds and defeated ${state.defeated} of ${monsterCount()} monsters. A new path awaits.`;
    $("run-stats").innerHTML = [
      [state.defeated, "MONSTERS SLAIN"], [state.stats.parries, "PERFECT PARRIES"], [state.stats.dodges, "TIMED DODGES"]
    ].map(([value, label]) => `<div class="run-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
    $("end-overlay").hidden = false;
    $("restart-button").focus({ preventScroll: true });
  }

  const tutorialSteps = [
    { title: "Roll your practice dice.", text: "Borrow an Attack, Guard, and Heal die. Practice rolls are fixed so you can learn safely. Your real run is paused and won't change.", action: "roll", button: "Roll practice dice ↗" },
    { title: "Choose a die to improve.", text: "Attack rolled 3, Guard rolled 6, and Heal rolled 2. Click the highlighted Attack die to select it. Each role acts automatically.", action: "select", button: "Select the Attack die above" },
    { title: "Give luck another chance.", text: "Reroll the selected Attack die. In a real battle, you get one reroll per turn unless you buy Lucky Fingers.", action: "reroll", button: "Reroll Attack ↻" },
    { title: "Make your first move.", text: "Your natural 6 deals 9 damage, including a +3 critical. The slime has 2 shield. Your Heal restores 2 health, and Guard adds 6 shield before it hits for 2.", action: "fight", button: "Make your move ↗" },
    { title: "Your shield didn't disappear!", text: "6 shield absorbed the slime's 2 damage, leaving 4 shield. Your health stayed safe. Unused shield carries over between turns, just like enemy shields.", action: "next", button: "Roll the next turn ↗" },
    { title: "Block without another Guard roll.", text: "This turn you only rolled Attack. You still have 4 shield from last turn. Strike again and let your stored shield absorb the next 2 damage.", action: "fight", button: "Attack with stored shield ↗" },
    { title: "Finish the fight.", text: "Your shield went from 4 to 2, with no health lost. The slime has 4 health left. Roll one last Attack to defeat it before it can hit again.", action: "finish", button: "Finish the slime ↗" },
    { title: "Claim your victory spoils.", text: "Enemies don't counterattack after they die. Collect 24 practice gold and recover 8 health. Shields belong to one battle, so they clear before the next encounter.", action: "collect", button: "Collect practice rewards ↗" },
    { title: "Build a stronger collection.", text: "Every fifth round is a shop, not a fight. Spend 14 of your practice gold on a Guard die. In real runs you start with one Attack die and buy the others.", action: "buy", button: "Buy the Guard die above" },
    { title: "Dodge an incoming strike.", text: "A new practice slime is attacking. Start the strike when ready, then press D or Dodge when the marker reaches the BLUE window. A successful dodge takes no damage and spends no shield. Mistakes are safe here: try again.", action: "dodge", button: "Practice a timed dodge ↗" },
    { title: "Risk a perfect parry.", text: "Parries have a smaller GOLD timing window. Start the strike, then press P or Parry inside that window. A perfect parry prevents damage and counters through shields. Try Relaxed timing if you want more time.", action: "parry", button: "Practice a timed parry ↗" },
    { title: "Take a companion's turn.", text: "Every living companion acts once before the enemies. Rescue Mira after round 4 and Sol after round 9. Click Mira to try her own Blood die: her healing looks after your most injured living ally.", action: "party", button: "Choose Mira above" },
    { title: "Choose the right enemy.", text: "Later fights have up to three enemies. Their health, shields, and poison are separate. Click the weakened Practice Slime to target it instead of the armored wolf. A kill pays rewards, but other enemies stay in the battle.", action: "target", button: "Choose the weakened slime" },
    { title: "You're ready to defy the darkness.", text: "Control your party's separate turns, pick a target, and roll each member's own dice. Dodge for safety or parry for a counter. Your real party, dice, gold, health, progress, and record are exactly as you left them.", action: "done", button: "Return to my run ↗" }
  ];

  function practiceArtwork(markup) {
    return namespaceArtwork(markup, "practice");
  }

  function openTutorial() {
    if (!["ready", "rolled"].includes(state.phase) || !$("reset-overlay").hidden || practice) return;
    practiceReturnFocus = document.activeElement;
    closeHelp(false);
    tutorialSeen = true;
    practice = createPractice(0);
    paintPractice();
    $("tutorial-overlay").hidden = false;
    $("tutorial-overlay").querySelector(".modal").scrollTop = 0;
    render();
    renderTutorial();
  }

  function paintPractice() {
    $("practice-scene").innerHTML = practiceArtwork(sceneArtwork(0));
    $("practice-hero-art").innerHTML = practiceArtwork(heroArtwork());
    $("practice-enemy-art").innerHTML = practiceArtwork(slimeArtwork({ color: "#8acb86" }));
  }

  function closeTutorial(restoreFocus = true) {
    if (!practice) return;
    cancelDefense();
    practice = null;
    $("tutorial-overlay").hidden = true;
    $("practice-dice").replaceChildren();
    render();
    if (restoreFocus) {
      const target = practiceReturnFocus?.isConnected && !practiceReturnFocus.disabled && practiceReturnFocus.getClientRects().length ? practiceReturnFocus : $("help-button");
      target.focus({ preventScroll: true });
    }
  }

  function renderTutorial() {
    if (!practice) return;
    const step = tutorialSteps[practice.step];
    $("tutorial-title").textContent = step.title;
    $("tutorial-instruction").textContent = step.text;
    $("tutorial-progress").innerHTML = tutorialSteps.map((item, i) => `<span class="${i < practice.step ? "complete" : i === practice.step ? "current" : ""}" aria-hidden="true"></span>`).join("");
    $("tutorial-progress").setAttribute("aria-label", `Step ${practice.step + 1} of ${tutorialSteps.length}`);
    $("practice-player-stat").textContent = `${practice.hp} / 40 HP · ⬡ ${practice.shield} shield`;
    $("practice-enemy-stat").textContent = `${practice.enemyHp} / 20 HP · ⬡ ${practice.enemyShield} shield`;
    $("practice-intent").textContent = practice.enemyHp ? "SLIME INTENT · 2 DAMAGE" : "SLIME DEFEATED · NO COUNTERATTACK";
    $("practice-arena").hidden = practice.step === 8 || practice.step >= 11;
    $("practice-arena").classList.toggle("practice-motion", practice.busy && ["fight", "finish"].includes(practice.action));
    $("practice-dice").hidden = practice.step >= 8 && practice.step !== 12;
    const dice = practice.dice.length ? practice.dice : ["attack", "guard", "mend"].map((type) => ({ type, tier: "base", value: 6 }));
    const rolling = practice.busy && ["roll", "reroll", "next", "finish"].includes(practice.action);
    $("practice-dice").innerHTML = dice.map((die, i) => `<button class="die type-${die.type} tier-base${rolling ? " rolling" : ""}${!practice.dice.length ? " unrolled" : ""}${practice.step === 1 && i === 0 ? " tutorial-target" : ""}${practice.step === 2 && i === 0 ? " selected" : ""}" data-practice-die="${i}" aria-label="${diceTypes[die.type].name}${practice.dice.length ? `: rolled ${die.value}` : ": not rolled"}"${practice.step !== 1 || i !== 0 || practice.busy ? " disabled" : ""}>${dieMarkup(die.value)}<span class="die-assignment" aria-hidden="true">${diceTypes[die.type].icon}</span><span class="die-type-label" aria-hidden="true">${diceTypes[die.type].label}</span></button>`).join("");
    $("practice-shop").hidden = practice.step !== 8;
    $("practice-party").hidden = practice.step !== 11;
    $("practice-targets").hidden = practice.step !== 12;
    $("practice-purse").textContent = `◈ ${practice.gold} practice gold · ${practice.owned} / ${MAX_DICE} dice`;
    $("practice-buy").disabled = practice.step !== 8 || practice.busy;
    $("practice-buy").classList.toggle("tutorial-target", practice.step === 8);
    $("practice-buy-label").textContent = practice.step === 9 ? "PURCHASED · 14 GOLD" : "BUY GUARD · 14 GOLD";
    $("tutorial-action").textContent = practice.busy ? "Practicing…" : step.button;
    $("tutorial-action").disabled = practice.busy || ["select", "buy", "party", "target"].includes(step.action);
    const target = practice.busy ? $("tutorial-overlay").querySelector(".modal") : practice.step === 1 ? $("practice-dice").querySelector("button") : practice.step === 8 ? $("practice-buy") : practice.step === 11 ? $("practice-party").querySelector("button:enabled") : practice.step === 12 ? $("practice-targets").querySelector("button:enabled") : $("tutorial-action");
    target.focus({ preventScroll: true });
    saveProgress();
  }

  function selectPracticeDie(index) {
    if (!practice || practice.busy || practice.step !== 1 || index !== 0) return;
    practice.step = 2;
    renderTutorial();
    playSound("select");
  }

  async function practiceAction(action) {
    if (!practice || practice.busy || action !== tutorialSteps[practice.step].action || action === "select") return;
    if (action === "done") { closeTutorial(); return; }
    const session = practice;
    session.busy = true;
    session.action = action;
    renderTutorial();
    if (action === "dodge" || action === "parry") {
      const result = await defend(`Practice ${action}`, "Practice Slime · 2 damage. Mistakes do not harm your real run.", action);
      if (practice !== session || result.cancelled) return;
      if (!result.success) {
        session.busy = false;
        session.action = null;
        renderTutorial();
        notify(result.timing === "early" ? "Too early! Wait for the colored window, then try again." : "That strike got through. Try again in the colored window; practice is safe.");
        return;
      }
      advancePractice(session, action);
      renderTutorial();
      return;
    }
    playSound(["roll", "reroll", "next", "finish"].includes(action) ? "roll" : action === "collect" || action === "buy" ? "heal" : "hit");
    await wait(500);
    if (practice !== session) return;
    advancePractice(session, action);
    renderTutorial();
  }

  function createPractice(step) {
    const session = { step: 0, busy: false, action: null, hp: 30, shield: 0, enemyHp: 20, enemyShield: 2, gold: 0, owned: 1, dice: [] };
    while (session.step < step) advancePractice(session, tutorialSteps[session.step].action);
    return session;
  }

  function advancePractice(session, action) {
    if (action === "roll") session.dice = ["attack", "guard", "mend"].map((type, i) => ({ type, tier: "base", value: [3, 6, 2][i] }));
    else if (action === "reroll") session.dice[0].value = 6;
    else if (action === "next") session.dice = [{ type: "attack", tier: "base", value: 6 }];
    else if (action === "fight" || action === "finish") {
      if (session.step === 3) { session.hp = Math.min(40, session.hp + 2); session.shield += 6; }
      const strike = absorbDamage(session.enemyShield, session.dice[0].value + 3);
      session.enemyShield = strike.shield;
      session.enemyHp = Math.max(0, session.enemyHp - strike.damage);
      if (session.enemyHp) {
        const retaliation = absorbDamage(session.shield, 2);
        session.shield = retaliation.shield;
        session.hp -= retaliation.damage;
      }
    } else if (action === "collect") { session.gold += 24; session.hp = Math.min(40, session.hp + 8); session.shield = 0; }
    else if (action === "buy") { session.gold -= 14; session.owned++; session.enemyHp = 20; session.enemyShield = 0; }
    else if (action === "parry") session.enemyHp -= 4;
    else if (action === "party") session.dice = [{ type: "blood", tier: "base", value: 6 }];
    else if (action === "target") session.enemyHp = 4;
    session.busy = false;
    session.action = null;
    session.step++;
  }

  function openHelp() {
    if (!$("shop-overlay").hidden || !$("end-overlay").hidden || !$("reset-overlay").hidden || !$("sell-overlay").hidden || !$("reward-overlay").hidden || practice || defense) return;
    helpReturnFocus = document.activeElement;
    $("help-overlay").hidden = false;
    $("help-overlay").querySelector(".modal").scrollTop = 0;
    $("close-help").focus({ preventScroll: true });
    saveProgress();
  }

  function closeHelp(restoreFocus = true) {
    if ($("help-overlay").hidden) return;
    $("help-overlay").hidden = true;
    if (restoreFocus) {
      const target = helpReturnFocus?.isConnected && !helpReturnFocus.disabled ? helpReturnFocus : $("help-button");
      target.focus({ preventScroll: true });
    }
    saveProgress();
  }

  function openReset() {
    if (practice || ["rolling", "resolving", "victory"].includes(state.phase)) return;
    closeHelp(false);
    closeSale(false);
    resetReturnFocus = document.activeElement;
    $("reset-overlay").hidden = false;
    $("cancel-reset").focus({ preventScroll: true });
    saveProgress();
  }

  function cancelReset() {
    $("reset-overlay").hidden = true;
    if (resetReturnFocus?.isConnected && !resetReturnFocus.disabled && resetReturnFocus.getClientRects().length) resetReturnFocus.focus({ preventScroll: true });
    else (state.phase === "shop" ? $("leave-shop") : $("reset-button")).focus({ preventScroll: true });
    saveProgress();
  }

  $("main-button").addEventListener("click", () => {
    if (state.phase === "ready") void rollDice();
    else if (state.phase === "rolled") void resolveTurn();
  });
  $("party-roster").addEventListener("click", (event) => {
    const button = event.target.closest("[data-member]");
    if (button) selectMember(Number(button.dataset.member));
  });
  $("shop-party").addEventListener("click", (event) => {
    const button = event.target.closest("[data-member]");
    if (button) selectMember(Number(button.dataset.member));
  });
  $("enemy-roster").addEventListener("click", (event) => {
    const button = event.target.closest("[data-enemy]");
    if (button) selectEnemy(Number(button.dataset.enemy));
  });
  $("defense-ready").addEventListener("click", armDefense);
  ["dodge", "parry"].forEach((action) => {
    $(`defense-${action}`).addEventListener("pointerdown", (event) => { if (event.button === 0) { event.preventDefault(); reactDefense(action); } });
    $(`defense-${action}`).addEventListener("click", (event) => { if (event.detail === 0) reactDefense(action); });
  });
  $("defense-skip").addEventListener("click", () => finishDefense({ action: null, success: false, timing: "skip" }));
  $("defense-relaxed").addEventListener("change", () => { relaxedTiming = $("defense-relaxed").checked; saveProgress(); });
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
    const sell = event.target.closest("[data-sell-id]");
    if (sell) { openSale(Number(sell.dataset.sellId)); return; }
    const card = event.target.closest("[data-offer]");
    if (card) buyOffer(Number(card.dataset.offer), card.dataset.tier || "base");
  });
  $("shop-stock").addEventListener("toggle", (event) => {
    const details = event.target;
    if (!details.isConnected || !details.matches(".rare-materials")) return;
    const index = Number(details.dataset.rareOffer);
    if (details.open) state.expandedOffers.add(index);
    else state.expandedOffers.delete(index);
    saveProgress();
  }, true);
  $("cancel-sell").addEventListener("click", () => closeSale());
  $("confirm-sell").addEventListener("click", () => sellDie(state.pendingSale));
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
    if (state.phase !== "shop" || state.gold < 8 || actor().hp === actor().maxHp) return;
    const healing = Math.min(12, actor().maxHp - actor().hp);
    state.gold -= 8;
    actor().hp += healing;
    render();
    renderShop();
    $("leave-shop").focus({ preventScroll: true });
    playSound("heal");
    log(`Merchant tonic restores ${healing} health for 8 gold.`);
  });
  $("leave-shop").addEventListener("click", leaveShop);
  $("reward-continue").addEventListener("click", continueVictory);
  $("reset-button").addEventListener("click", openReset);
  $("shop-reset").addEventListener("click", openReset);
  $("cancel-reset").addEventListener("click", cancelReset);
  $("confirm-reset").addEventListener("click", () => {
    startRun(true);
    $("main-button").focus({ preventScroll: true });
  });
  $("restart-button").addEventListener("click", () => {
    startRun(true);
    $("main-button").focus({ preventScroll: true });
  });
  $("sound-button").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    renderSoundButton();
    if (soundEnabled) playSound("select");
  });
  $("help-button").addEventListener("click", openHelp);
  $("tutorial-button").addEventListener("click", openTutorial);
  $("start-tutorial").addEventListener("click", openTutorial);
  $("close-tutorial").addEventListener("click", () => closeTutorial());
  $("tutorial-action").addEventListener("click", () => { if (practice) void practiceAction(tutorialSteps[practice.step].action); });
  $("practice-buy").addEventListener("click", () => { void practiceAction("buy"); });
  $("practice-dice").addEventListener("click", (event) => {
    const die = event.target.closest("[data-practice-die]");
    if (die) selectPracticeDie(Number(die.dataset.practiceDie));
  });
  $("practice-party").addEventListener("click", (event) => {
    if (event.target.closest("[data-practice-member]")) void practiceAction("party");
  });
  $("practice-targets").addEventListener("click", (event) => {
    if (event.target.closest("[data-practice-target]")) void practiceAction("target");
  });
  $("close-help").addEventListener("click", () => closeHelp());
  $("help-play-button").addEventListener("click", () => closeHelp());
  $("help-overlay").addEventListener("click", (event) => {
    if (event.target === $("help-overlay")) closeHelp();
  });
  document.addEventListener("keydown", (event) => {
    const overlay = ["defense-overlay", "reset-overlay", "sell-overlay", "reward-overlay", "tutorial-overlay", "help-overlay", "shop-overlay", "end-overlay"].map($).find((element) => !element.hidden);
    if (overlay) {
      if (overlay.id === "defense-overlay" && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const key = event.key.toLowerCase();
        if (key === "d" || key === "p") { event.preventDefault(); reactDefense(key === "d" ? "dodge" : "parry"); return; }
        if (key === "escape") { event.preventDefault(); finishDefense({ action: null, success: false, timing: "skip" }); return; }
      }
      if (overlay.id === "tutorial-overlay") {
        if (event.key === "Escape") { event.preventDefault(); closeTutorial(); return; }
        if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && event.key === "1") { event.preventDefault(); selectPracticeDie(0); return; }
        if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === "r") { event.preventDefault(); void practiceAction("reroll"); return; }
      }
      if (event.key === "Escape" && overlay.id === "help-overlay") {
        event.preventDefault();
        closeHelp();
      }
      if (event.key === "Escape" && overlay.id === "reset-overlay") {
        event.preventDefault();
        cancelReset();
      }
      if (event.key === "Escape" && overlay.id === "sell-overlay") {
        event.preventDefault();
        closeSale();
      }
      if (event.key === "Tab") {
        const buttons = [...overlay.querySelectorAll("button:not(:disabled), summary, input:not(:disabled)")].filter((button) => button.getClientRects().length);
        if (!buttons.length) { event.preventDefault(); return; }
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!buttons.includes(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
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

  function syncProgress() {
    let text;
    try { text = localStorage.getItem(SAVE_KEY); }
    catch (error) { pauseSaving(error); return; }
    if (text !== lastSavedText && text !== null) restoreProgress(text);
    else {
      if (text === null) lastSavedText = null;
      saveProgress();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { pauseDefense(); saveProgress(true); }
    else { syncProgress(); resumeDefense(); }
  });
  window.addEventListener("pagehide", () => { pauseDefense(); saveProgress(true); });
  window.addEventListener("pageshow", (event) => { if (event.persisted) { syncProgress(); resumeDefense(); } });
  window.addEventListener("storage", (event) => { if ((event.key === SAVE_KEY || event.key === null) && !document.hidden) syncProgress(); });
  document.addEventListener("scroll", () => {
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => saveProgress(), 150);
  }, true);

  readRecord();
  let savedText = null;
  try { savedText = localStorage.getItem(SAVE_KEY); lastSavedText = savedText; }
  catch (error) { pauseSaving(error); }
  if (!restoreProgress(savedText)) {
    startRun();
    if (!tutorialSeen) openTutorial();
  }
})();
