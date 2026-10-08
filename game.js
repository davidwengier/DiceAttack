(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_DICE = 6;
  const STAGE_LENGTH = 31;
  const STAGE_COUNT = 5;
  const RUN_LENGTH = STAGE_LENGTH * STAGE_COUNT;
  const SHOP_INTERVAL = 5;
  const BATTLE_COUNT = STAGE_COUNT * 25;
  const diceTiers = {
    base: { name: "Base", icon: "◇", bonus: 0, priceMultiplier: 1 },
    gold: { name: "Gold", icon: "✦", bonus: 2, priceMultiplier: 1.8 },
    diamond: { name: "Diamond", icon: "♦", bonus: 4, priceMultiplier: 2.8 },
    ruby: { name: "Ruby", icon: "◆", bonus: 6, priceMultiplier: 3.8 },
    emerald: { name: "Emerald", icon: "⬡", bonus: 8, priceMultiplier: 5 },
    obsidian: { name: "Obsidian", icon: "✧", bonus: 10, priceMultiplier: 6.5 },
    sapphire: { name: "Sapphire", icon: "♦", bonus: 12, priceMultiplier: 9, unlock: 2 },
    sunstone: { name: "Sunstone", icon: "☀", bonus: 14, priceMultiplier: 12, unlock: 3 },
    mythril: { name: "Mythril", icon: "✥", bonus: 16, priceMultiplier: 16, unlock: 4 },
    celestial: { name: "Celestial", icon: "✶", bonus: 20, priceMultiplier: 22, unlock: 5 }
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
    fireball: { name: "Ember Bolt", icon: "✦", price: 24, effect: "damage", amount: 10, text: "Deal 10 damage ignoring shields. One free cast per battle. Cannot reach flying enemies." },
    salve: { name: "Healing Spring", icon: "✚", price: 22, effect: "heal", amount: 14, text: "Restore 14 health. One free cast per battle." },
    freeze: { name: "Frost Seal", icon: "❄", price: 26, text: "Freeze the enemy, skipping its next action. One free cast per battle.", effect: "freeze" },
    bulwark: { name: "Iron Bastion", icon: "⬡", price: 48, unlock: 2, effect: "shield", amount: 18, text: "Gain 18 + twice your Moonward level in shield. Free once per battle." },
    arrow: { name: "Piercing Arrow", icon: "➶", price: 56, unlock: 2, effect: "damage", bow: true, rolled: true, multiplier: .8, text: "Bow only. Deal 80% of your offensive dice's effective rolls as extra piercing damage. Keep your rolls. Free once per battle." },
    focus: { name: "Second Chance", icon: "↻", price: 52, unlock: 2, effect: "reroll", text: "Gain two rerolls for this turn, up to your normal allowance +2. Free once per battle." },
    renewal: { name: "Royal Renewal", icon: "✚", price: 95, unlock: 3, effect: "heal", amount: 30, text: "Heal 30 + twice your Lifebloom level. Free once per battle." },
    shatter: { name: "Armor Break", icon: "◇", price: 90, unlock: 3, effect: "shatter", text: "Destroy the target's entire shield. Does not deal damage; works on flying enemies. Free once per battle." },
    venomshot: { name: "Venom Arrow", icon: "❧", price: 110, unlock: 3, effect: "poison", bow: true, rolled: true, text: "Bow only. Add poison equal to one quarter of your offensive dice's effective rolls, rounded up. Free once per battle." },
    sanctuary: { name: "Sanctuary", icon: "❀", price: 170, unlock: 4, effect: "sanctuary", text: "Heal 20 + Lifebloom level and gain 20 + Moonward level in shield. Free once per battle." },
    volley: { name: "Storm Volley", icon: "ϟ", price: 185, unlock: 4, effect: "damage", bow: true, rolled: true, all: true, multiplier: .5, text: "Bow only. Hit every living enemy for 50% of your offensive dice's effective rolls, ignoring armor. One chest if the group falls. Free once per battle." },
    stasis: { name: "Time Lock", icon: "❄", price: 175, unlock: 4, effect: "freeze", all: true, text: "Freeze every living enemy for its next action. Free once per battle." },
    nova: { name: "Starfall Arrow", icon: "✶", price: 280, unlock: 5, effect: "damage", bow: true, rolled: true, multiplier: 1.5, text: "Bow only. Deal 150% of your offensive dice's effective rolls as extra piercing damage. Free once per battle." },
    aegis: { name: "Eternal Aegis", icon: "✥", price: 265, unlock: 5, effect: "shield", amount: 45, text: "Gain 45 + twice your Moonward level in shield. Free once per battle." },
    rebloom: { name: "Dawn Rebirth", icon: "☀", price: 295, unlock: 5, effect: "fullheal", text: "Restore all missing health. Free once per battle." }
  };
  const memberTypes = {
    knight: { name: "You", title: "THE DICEBOUND", role: "Knight", icon: "⚔", hp: 40, die: "attack", ability: null, joins: 0, color: "#b2d1a0", perk: "Attack sixes deal critical damage." }
  };
  const legacyMemberTypes = { ...memberTypes, healer: { hp: 32, joins: 4, ability: "salve" }, mage: { hp: 28, joins: 9, ability: "freeze" } };
  const MEMBER_FIELDS = ["hp", "maxHp", "shield", "collection", "dice", "selected", "rerolls", "abilities", "usedAbilities"];
  const skills = {
    power: { name: "Ember Edge", icon: "⚔", price: 14, max: 15, perStage: 3, text: "+1 damage per Attack, Blood, Flame, Frost, and Lightning strike.", apply: () => { state.power++; } },
    ward: { name: "Moonward", icon: "⬡", price: 12, max: 15, perStage: 3, text: "+1 shield per Guard, Fortune, and Bloom die.", apply: () => { state.ward++; } },
    healing: { name: "Lifebloom", icon: "✚", price: 12, max: 15, perStage: 3, text: "+1 healing per Heal, Blood, and Bloom die.", apply: () => { state.healing++; } },
    vitality: { name: "Lionheart", icon: "♡", price: 16, max: 15, perStage: 3, text: "+8 maximum health. Restore 8 health.", apply: () => { actor().maxHp += 8; actor().hp = Math.min(actor().maxHp, actor().hp + 8); } },
    critical: { name: "Loaded Fate", icon: "✦", price: 14, max: 15, perStage: 3, text: "+2 extra damage on Attack rolls of six.", apply: () => { state.critBonus += 2; } },
    recovery: { name: "Second Wind", icon: "❧", price: 16, max: 15, perStage: 3, text: "Recover 4 extra health after each kill. Heal for 4 now.", apply: () => { state.recovery += 4; actor().hp = Math.min(actor().maxHp, actor().hp + 4); } },
    luck: { name: "Lucky Fingers", icon: "↻", price: 22, max: 3, text: "One extra reroll per turn per level. A new level unlocks in stages 3 and 5.", apply: () => { state.extraRerolls++; } },
    loot: { name: "Treasure Hunter", icon: "◈", price: 18, max: 15, perStage: 3, text: "+25% kill gold per level, rounded up.", apply: () => { state.lootBonus += .25; } },
    barrier: { name: "Prepared Defenses", icon: "⬡", price: 48, max: 5, unlock: 2, text: "Start every new battle with 4 shield per level." },
    archery: { name: "Skyhunter", icon: "➶", price: 55, max: 5, unlock: 2, text: "+2 power per level for Attack, Blood, Flame, Frost, and Lightning dice while using Bow." },
    venomcraft: { name: "Venomcraft", icon: "❧", price: 85, max: 5, unlock: 3, text: "+1 poison per Venom die and +2 to the poison cap per level." },
    hospitality: { name: "Restorative Rest", icon: "✚", price: 75, max: 5, unlock: 3, text: "Market healing restores 4 additional health per level for the same 8 gold." },
    siphon: { name: "Soul Siphon", icon: "♡", price: 130, max: 5, unlock: 4, text: "Heal for 4% of your rolled attack and piercing totals per level, rounded down." },
    resilience: { name: "Iron Resolve", icon: "✥", price: 140, max: 5, unlock: 4, text: "Reduce every incoming enemy strike by 1 per level, before shield is spent." },
    floor: { name: "Fortune's Floor", icon: "✶", price: 220, max: 2, unlock: 5, text: "Your dice cannot roll below 2 at level 1 or below 3 at level 2. Applies to rerolls too." },
    harvest: { name: "Golden Horizon", icon: "◈", price: 200, max: 3, unlock: 5, text: "Fortune dice earn 50% additional gold per level, rounded down." }
  };
  const unlocked = (item, stage = stageFor(state.encounter)) => stage >= (item.unlock || 1);
  function skillLimit(key, stage = stageFor(state.encounter)) {
    const item = skills[key];
    return !unlocked(item, stage) ? 0 : key === "luck" ? Math.ceil(stage / 2) : Math.min(item.max, item.perStage ? stage * item.perStage : item.max);
  }
  const relics = Object.fromEntries([3, 4, 5].flatMap((unlock) => Object.keys(diceTypes).map((type) => {
    const multiplier = 2 ** (unlock - 2);
    return [`${type}-${unlock}`, { type, unlock, multiplier, name: `${["", "", "", "Awakened", "Ascendant", "Eternal"][unlock]} ${diceTypes[type].name.replace(" Die", "")} Relic`,
      icon: diceTypes[type].icon, price: diceTypes[type].price * ({ 3: 5, 4: 12, 5: 28 })[unlock],
      text: `Multiply every ${diceTypes[type].name} effective roll by ${multiplier}. All copies benefit. Stacks by multiplication with your other ${diceTypes[type].name} relics.${type === "venom" ? " Also multiplies the poison cap." : ""} Buy this relic once per adventure.` }];
  })));
  const relicMultiplier = (type, profile = state) => (profile.relics || []).reduce((total, key) => total * (relics[key].type === type ? relics[key].multiplier : 1), 1);
  const effectiveRoll = (die) => (die.value + diceTiers[die.tier].bonus) * relicMultiplier(die.type);
  const poisonLimit = (profile = state) => (12 + (profile.skills.venomcraft || 0) * 2) * relicMultiplier("venom", profile);
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
  const stages = [
    { name: "Against the Darkness", worlds: zones.map((zone) => zone.title), hue: 0 },
    { name: "The Skybound Frontier", worlds: ["The Windwood Canopy", "The Floating Catacombs", "The Sunfire Spires", "The Cloudglass Peaks", "The Stormwake Isles", "The Celestial Aerie"], hue: 20 },
    { name: "The Shattered Kingdom", worlds: ["The Crownroot Forest", "The Royal Necropolis", "The Cinder Citadel", "The Crystal Marches", "The Pearlwater Coast", "The Broken Constellation"], hue: -15 },
    { name: "The Forgotten Realms", worlds: ["The Verdant Labyrinth", "The Echoing Vaults", "The Phoenix Wastes", "The Aurora Expanse", "The Leviathan Depths", "The Moonless Expanse"], hue: 40 },
    { name: "The Last Horizon", worlds: ["The Dawnwood", "The Eternity Crypts", "The Worldfire Throne", "The Endless Glacier", "The Ocean of Stars", "The Heart of the Rift"], hue: -30 }
  ];
  const stageFor = (index) => Math.floor(index / STAGE_LENGTH) + 1;
  const localRound = (index) => index % STAGE_LENGTH;
  const worldFor = (index) => Math.min(zones.length - 1, Math.floor(localRound(index) / SHOP_INTERVAL));
  const shopRound = (index) => (localRound(index) + 1) % SHOP_INTERVAL === 0;
  const worldName = (index = state.encounter) => stages[stageFor(index) - 1].worlds[worldFor(index)];
  const monsters = [
    { name: "Windwing Sprite", zone: 0, type: "wraith", color: "#9edcec", flying: true, moves: [["attack", 1, "Feather dart"], ["heavy", 1.3, "Sky dive"], ["guard", .8, "Wind veil"]] },
    { name: "Cryptwing Phantom", zone: 1, type: "wraith", color: "#b5a7e6", flying: true, moves: [["drain", .8, "Aerial siphon"], ["attack", 1, "Ghost wing"], ["heavy", 1.3, "Phantom dive"]] },
    { name: "Cinderwing Drake", zone: 2, type: "demon", color: "#e59470", flying: true, moves: [["attack", 1, "Fire feather"], ["heavy", 1.3, "Burning dive"], ["guard", .8, "Ash cloud"]] },
    { name: "Frostwing Spirit", zone: 3, type: "wraith", color: "#b4edff", flying: true, moves: [["attack", 1, "Ice feather"], ["guard", .9, "Cloud shield"], ["heavy", 1.3, "Frozen dive"]] },
    { name: "Stormwing Siren", zone: 4, type: "wraith", color: "#7dd7c8", flying: true, moves: [["drain", .8, "Storm song"], ["heavy", 1.3, "Thunder dive"], ["attack", 1, "Gale strike"]] },
    { name: "Starwing Revenant", zone: 5, type: "demon", color: "#dabaff", flying: true, moves: [["attack", 1, "Star feather"], ["heavy", 1.3, "Comet dive"], ["guard", .9, "Starlit veil"]] },
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
  const stageBestiary = [
    [
      [["Galecrest Falcon", "Canopy Coil", "Cloudnest Harrier", "Zephyr Watcher"], ["The Windwood Roc", "Lady of the Gales"], ["bird", "serpent", "bird", "automaton"], "#9bd9b9"],
      [["Cloudbone Raven", "Aether Serpent", "Vaultwing Owl", "Floating Sentinel"], ["The Skycrypt Custodian", "The Pale Albatross"], ["bird", "serpent", "bird", "automaton"], "#b4bddf"],
      [["Sunfeather Hawk", "Spirecoil Viper", "Golden Kite", "Sunfire Construct"], ["The Solar Phoenix", "The Spire Warden"], ["bird", "serpent", "bird", "automaton"], "#edc281"],
      [["Cloudglass Owl", "Mistcoil Python", "Snowcrest Eagle", "Nimbus Keeper"], ["The Nimbus Colossus", "Queen of Cloudglass"], ["bird", "serpent", "bird", "automaton"], "#a8e8ed"],
      [["Storm Petrel", "Thundercoil", "Rainwing Kite", "Lightning Sentry"], ["The Thunder Roc", "The Storm Admiral"], ["bird", "serpent", "bird", "automaton"], "#80b5df"],
      [["Astral Crane", "Halocoil Serpent", "Mooncrest Harrier", "Aerie Watcher"], ["The Celestial Gryphon", "The Halo Sentinel"], ["bird", "serpent", "bird", "automaton"], "#d4b2ed"]
    ],
    [
      [["Crownroot Knight", "Royal Gearhound", "Gilded Page", "Briarwork Sentry"], ["The Crownwood Champion", "The Brass Duchess"], ["automaton", "wolf", "skeleton", "golem"], "#bdbd82"],
      [["Necropolis Bailiff", "Tombgear Hound", "Royal Revenant", "Marble Custodian"], ["The Tomb Chancellor", "The Ivory Regent"], ["automaton", "wolf", "skeleton", "golem"], "#c5bccb"],
      [["Cinderwork Soldier", "Furnace Hound", "Embercourt Duelist", "Foundry Sentinel"], ["The Furnace Marshal", "The Cinder Empress"], ["automaton", "wolf", "skeleton", "golem"], "#d59e6b"],
      [["Prismguard Knight", "Crystal Gearwolf", "Marches Duelist", "Gemwork Keeper"], ["The Prismatic General", "The Crystal Baron"], ["automaton", "wolf", "skeleton", "golem"], "#a9c9e8"],
      [["Pearlwork Soldier", "Coastal Gearhound", "Saltcourt Corsair", "Tidal Custodian"], ["The Pearl Admiral", "The Clocktide Regent"], ["automaton", "wolf", "skeleton", "golem"], "#91c9bd"],
      [["Constellation Knight", "Comet Gearwolf", "Starcourt Duelist", "Orrery Sentinel"], ["The Orrery Architect", "The Broken Star Prince"], ["automaton", "wolf", "skeleton", "golem"], "#c3a3d9"]
    ],
    [
      [["Labyrinth Stag", "Vineback Beetle", "Mothwing Seer", "Rootcoil Adder"], ["The Labyrinth Hart", "The Verdant Broodmother"], ["stag", "beetle", "moth", "serpent"], "#98c59c"],
      [["Echohorn Deer", "Vaultshell Scarab", "Memory Moth", "Whispercoil"], ["The Keeper of Echoes", "The Memory Scarab"], ["stag", "beetle", "moth", "serpent"], "#b6a6cf"],
      [["Ashhorn Antelope", "Phoenix Scarab", "Firewing Moth", "Dunecoil Cobra"], ["The Immortal Firehart", "The Phoenix Brood"], ["stag", "beetle", "moth", "serpent"], "#ddad80"],
      [["Aurora Elk", "Lightshell Beetle", "Ribbonwing Moth", "Polarcoil"], ["The Aurora Dreamer", "The Polar Broodmother"], ["stag", "beetle", "moth", "serpent"], "#a8d9d2"],
      [["Reefhorn Hart", "Deepwater Scarab", "Foamwing Moth", "Leviathan Spawn"], ["The Abyssal Dreamhart", "The Leviathan Matron"], ["stag", "beetle", "moth", "serpent"], "#78bdbb"],
      [["Moonless Stag", "Nightglass Beetle", "Eclipse Moth", "Shadowcoil"], ["The Night Dreamer", "The Eclipse Broodmother"], ["stag", "beetle", "moth", "serpent"], "#b295cc"]
    ],
    [
      [["Dawnscale Wyrm", "Sunroot Basilisk", "Horizon Drake", "Firstlight Coil"], ["The Dawn Dragon", "The Root of Day"], ["dragon", "serpent", "dragon", "serpent"], "#e3c184"],
      [["Eternity Wyrm", "Hourglass Basilisk", "Timeless Drake", "Pendulum Coil"], ["The Eternal Dragon", "The Keeper of Hours"], ["dragon", "serpent", "dragon", "serpent"], "#c4b6d8"],
      [["Worldfire Wyrm", "Magmacrest Basilisk", "Pyre Drake", "Caldera Coil"], ["The Worldfire Dragon", "The Molten Worldheart"], ["dragon", "serpent", "dragon", "serpent"], "#df9574"],
      [["Glacier Wyrm", "Icecrest Basilisk", "Blizzard Drake", "Frostheart Coil"], ["The Endless Ice Dragon", "The Glacier Heart"], ["dragon", "serpent", "dragon", "serpent"], "#a6dce9"],
      [["Starsea Wyrm", "Nebula Basilisk", "Galaxy Drake", "Cometcoil"], ["The Star Ocean Dragon", "The Tide of Infinity"], ["dragon", "serpent", "dragon", "serpent"], "#a6b7e8"],
      [["Riftheart Wyrm", "Reality Basilisk", "Voidheart Drake", "Infinity Coil"], ["The Reality Dragon", "The World Beyond"], ["dragon", "serpent", "dragon", "serpent"], "#d6b0db"]
    ]
  ];
  const creatureMoves = {
    bird: [["attack", .8, "Wing dart"], ["heavy", 1.4, "Diving strike"], ["guard", .8, "Feather ward"]],
    moth: [["attack", .8, "Dream dust"], ["heavy", 1.4, "Lunar flutter"], ["guard", .8, "Silken veil"]],
    serpent: [["drain", .8, "Siphoning fang"], ["heavy", 1.3, "Coiling crush"], ["attack", 1, "Tail lash"]],
    automaton: [["guard", 1.1, "Mechanical bulwark"], ["heavy", 1.4, "Piston smash"], ["attack", .8, "Gearblade"]],
    stag: [["heavy", 1.3, "Antler charge"], ["drain", .8, "Wild hunger"], ["guard", .9, "Spirit bark"]],
    beetle: [["guard", 1.2, "Carapace"], ["attack", 1, "Mandible snap"], ["heavy", 1.3, "Shell charge"]],
    dragon: [["heavy", 1.4, "Dragon breath"], ["guard", 1, "Scale fortress"], ["drain", .9, "Ancient hunger"]],
    wolf: [["attack", .9, "Clockwork pounce"], ["heavy", 1.4, "Gearfang bite"], ["guard", .7, "Brass plating"]],
    skeleton: [["heavy", 1.3, "Royal cleaver"], ["guard", 1, "Court armor"], ["attack", .9, "Duelist slash"]],
    golem: [["guard", 1.2, "Living fortress"], ["heavy", 1.4, "Monument crush"], ["drain", .7, "Core siphon"]]
  };
  stageBestiary.forEach((worlds, index) => {
    const homeStage = index + 2;
    worlds.forEach(([regulars, guardians, types, color], zone) => {
      [...regulars, ...guardians].forEach((name, i) => {
        const type = homeStage === 4 && i === 5 && zone !== 4 ? "beetle" : types[i < 4 ? i : (i - 4) * 3];
        monsters.push({ name, zone, homeStage, type, color, boss: i >= 4, flying: ["bird", "moth", "dragon"].includes(type), moves: creatureMoves[type] });
      });
    });
    const [name, type] = [["The Tempest Emperor", "bird"], ["The Clockwork Monarch", "automaton"], ["The Ancient Dreamer", "stag"], ["The Riftheart Dragon", "dragon"]][index];
    monsters.push({ name, type, homeStage, zone: 5, boss: true, final: true, color: worlds[5][3], flying: ["bird", "dragon"].includes(type),
      moves: [...creatureMoves[type], ["heavy", 1.5, ["Skyfall", "Kingdom Crusher", "Dream Collapse", "Reality Collapse"][index]]] });
  });
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
  function generateStage(stage) {
    const health = [[8, 10, 12, 23], [27, 33, 39, 60], [54, 63, 72, 115], [80, 90, 105, 145], [110, 125, 140, 190], [140, 155, 175, 235]];
    const damage = [[1, 2, 2, 4], [5, 6, 7, 9], [8, 9, 10, 13], [9, 10, 11, 14], [10, 11, 12, 15], [11, 12, 13, 16]];
    const makeBattle = (monster, index, hp, attack) => {
      const elite = monster.zone > 0 && !monster.boss && Math.random() < .3;
      const gold = Math.round((19 + index * 2 + (monster.boss ? 12 : 0) + (elite ? 6 : 0)) * (1 + (stage - 1) * .25));
      return {
        ...monster, stage, kind: "battle", name: `${elite ? "Frenzied " : ""}${monster.name}`, elite,
        hp: Math.round((hp + (stage - 1) * 350) * (1 + (stage - 1) * .25) * (.94 + Math.random() * .12) * (elite ? 1.1 : 1)),
        gold: gold + Math.floor(Math.random() * 4),
        role: monster.flying ? "FLYING · BOW REQUIRED" : monster.final ? stage === STAGE_COUNT ? "FINAL GUARDIAN" : "STAGE GUARDIAN" : monster.boss ? "WORLD GUARDIAN" : elite ? "FRENZIED CREATURE" : "CREATURE OF THE " + zones[monster.zone].className.toUpperCase(),
        flavor: monster.flying ? "Beyond the reach of a blade. Your bow can reach it." : monster.final ? "Beyond the last market, the ruler of this stage awaits." : monster.boss ? "The guardian stands between you and a safe haven." : `A new danger awaits in ${stages[stage - 1].worlds[monster.zone]}.`,
        moveOffset: Math.floor(Math.random() * monster.moves.length),
        moves: monster.moves.map(([kind, factor, name]) => [kind, Math.max(1, Math.round(attack * (1 + (stage - 1) * .15) * factor) + (elite && kind !== "guard" ? 1 : 0)), name])
      };
    };
    const route = zones.flatMap((zone, zoneIndex) => {
      const pool = monsters.filter((monster) => (monster.homeStage || 1) === stage && monster.zone === zoneIndex && (stage >= 2 || !monster.flying));
      const regulars = shuffle(pool.filter((monster) => !monster.boss)).slice(0, 3);
      if (stage === 2 && zoneIndex === 0 && !regulars[0].flying) {
        const flyer = regulars.findIndex((monster) => monster.flying);
        if (flyer >= 0) [regulars[0], regulars[flyer]] = [regulars[flyer], regulars[0]];
        else regulars[0] = pool.find((monster) => !monster.boss && monster.flying);
      }
      const boss = shuffle(pool.filter((monster) => monster.boss && !monster.final))[0];
      const battles = [...regulars, boss].map((monster, slot) => {
        const index = zoneIndex * SHOP_INTERVAL + slot;
        return addEnemyGroup(makeBattle(monster, index, health[zoneIndex][slot], damage[zoneIndex][slot]), slot);
      });
      return [...battles, { stage, kind: "shop", name: "The Wayfarer's Market", zone: zoneIndex }];
    });
    route.push(addEnemyGroup(makeBattle(monsters.find((monster) => monster.final && (monster.homeStage || 1) === stage), STAGE_LENGTH - 1, 280, 19), 3));
    return route;
  }
  function generateRun() { return stages.flatMap((stage, index) => generateStage(index + 1)); }

  function addEnemyGroup(round, slot) {
    const count = round.zone === 0 ? 1 : round.zone === 1 ? slot === 0 ? 1 : 2 : slot === 3 ? 3 : slot === 0 ? 2 : 1 + Math.floor(Math.random() * 3);
    const candidates = shuffle(monsters.filter((monster) => (monster.homeStage || 1) === (round.stage || 1) && monster.zone === round.zone && !monster.boss && ((round.stage || 1) >= 2 || !monster.flying) && !round.name.endsWith(monster.name)));
    const group = [{ ...round }];
    for (let i = 1; i < count; i++) {
      const monster = candidates[i - 1];
      const attack = Math.max(1, Math.round(Math.max(...round.moves.filter((move) => move[0] !== "guard").map((move) => move[1])) * .45));
      group.push({
        ...monster, stage: round.stage || 1, kind: "battle", elite: false, hp: Math.max(5, Math.round(round.hp * (round.boss ? .25 : .4))),
        gold: Math.max(8, Math.round(round.gold * .45)), role: monster.flying ? "FLYING · BOW REQUIRED" : "GUARDIAN ESCORT", flavor: monster.flying ? "Beyond the reach of a blade. Your bow can reach it." : "Together, they stand against your expedition.",
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
  let screen = "menu";
  let collectionTab = "dice";
  let gameScroll = 0;
  let collectionScroll = 0;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reducedMotion ? Math.min(ms, 25) : ms));
  const rollDie = () => Math.max(1 + (state.skills.floor || 0), Math.floor(Math.random() * 6) + 1);

  function actor() { return state.party[state.actorIndex]; }
  function targetEnemy() { return state.enemies[state.target]; }
  function livingMembers() { return state.party.map((member, index) => ({ member, index })).filter(({ member }) => member.hp > 0); }
  function battleWon() { return state.enemies.every((enemy) => enemy.hp === 0); }
  function monsterCount() { return state.encounters.reduce((count, round) => count + (round.group?.length || 0), 0); }
  function healingTarget(member = actor()) {
    return member;
  }
  function createMember(key, profile = state) {
    const definition = memberTypes[key];
    const maxHp = definition.hp + (profile.skills.vitality || 0) * 8;
    return { key, hp: maxHp, maxHp, shield: 0, collection: [{ id: profile.nextDieId++, type: definition.die, tier: "base", paidPrice: 0 }], dice: [], selected: null, rerolls: 1 + profile.extraRerolls, abilities: definition.ability ? [definition.ability] : [], usedAbilities: new Set() };
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
    $("menu-save-note").textContent = "AUTOSAVE UNAVAILABLE · Progress is not being saved. Your unreadable save is kept until you choose to reset.";
    $("collection-save-status").textContent = "AUTOSAVE UNAVAILABLE · Progress is not being saved.";
  }

  function saveProgress(force = false) {
    if (!state || restoring || savingPaused || (!force && document.hidden) || !stablePhases.includes(state.phase) || practice?.busy) return;
    const snapshot = {
      version: 6,
      state: { ...state, id: undefined, party: state.party.map((member) => ({ ...member, usedAbilities: [...member.usedAbilities] })), expandedOffers: [...state.expandedOffers] },
      tutorialSeen, tutorialStep: practice ? practice.step : null,
      journal: [...$("battle-log").children].map((entry) => entry.lastChild.textContent),
      view: {
        help: ["ready", "rolled"].includes(state.phase) && !$("help-overlay").hidden, reset: !$("reset-overlay").hidden,
        screen, collectionTab, collection: screen === "collection" ? window.scrollY : collectionScroll,
        page: screen === "game" ? window.scrollY : gameScroll, shop: $("shop-overlay").querySelector(".modal").scrollTop,
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
      $("menu-save-note").textContent = "Your adventure saves automatically in this browser.";
      $("collection-save-status").textContent = "PROGRESS SAVED ON THIS BROWSER";
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
    require(Array.isArray(s.encounters) && s.encounters.length === STAGE_LENGTH, "route");
    s.encounters.forEach((round, i) => {
      require(object(round) && round.zone === Math.min(zones.length - 1, Math.floor(i / SHOP_INTERVAL)), "area");
      if ((i + 1) % SHOP_INTERVAL === 0) {
        require(round.kind === "shop" && round.name === "The Wayfarer's Market", "shop round");
        return;
      }
      validateMonster(round, round.zone, i % SHOP_INTERVAL === 3 || i === STAGE_LENGTH - 1, i === STAGE_LENGTH - 1);
    });
    require(Array.isArray(s.omens) && s.omens.length === zones.length && s.omens.every((omen) => omens.some((known) => JSON.stringify(known) === JSON.stringify(omen))), "omens");
    require(integer(s.encounter, 0, STAGE_LENGTH - 1) && integer(s.completed, 0, STAGE_LENGTH) && integer(s.defeated, 0, 25), "progress");
    const completed = ["victory", "won"].includes(s.phase) ? s.encounter + 1 : s.encounter;
    require(s.completed === completed && s.defeated === completed - Math.floor(completed / SHOP_INTERVAL), "completed rounds");
    require((s.phase === "shop") === (s.encounters[s.encounter].kind === "shop") && (s.phase !== "won" || s.encounter === STAGE_LENGTH - 1), "round phase");
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
    require(monster && round.zone === zone && round.kind === "battle" && round.type === monster.type && Boolean(round.boss) === Boolean(monster.boss) && Boolean(round.boss) === boss && Boolean(round.final) === final && Boolean(round.flying) === Boolean(monster.flying), "identity");
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
    const next = { ...s, party, actorIndex: 0, acted: [], target: 0, enemyCursor: 0, stats: { ...s.stats, dodges: 0, parries: 0 } };
    MEMBER_FIELDS.forEach((key) => { delete next[key]; });
    delete next.enemy;
    next.encounters = s.encounters.map((round, i) => round.kind === "shop" ? round : i > s.encounter ? addEnemyGroup(round, i % SHOP_INTERVAL) : { ...round, group: [{ ...round }] });
    next.enemies = [{ ...s.enemy, chill: 0, rewarded: s.enemy.hp === 0 }];
    if (s.reward) next.reward = { ...s.reward, enemyIndex: 0, battleWon: true, resume: "party", recruits: [] };
    return { ...saved, version: 3, state: next, relaxedTiming: false, tutorialStep: saved.tutorialStep === 9 ? 12 : saved.tutorialStep };
  }

  function upgradePartySave(saved) {
    validateSave(saved);
    const s = saved.state;
    const hero = { ...s.party[0] };
    const companions = s.party.slice(1);
    const refund = companions.reduce((total, member) => total + member.collection.reduce((amount, die) => amount + die.paidPrice, 0), 0);
    hero.abilities = [...new Set([...hero.abilities, ...companions.flatMap((member) => member.abilities.filter((key) => key !== legacyMemberTypes[member.key].ability))])];
    hero.usedAbilities = [...new Set([...hero.usedAbilities, ...companions.flatMap((member) => member.usedAbilities.filter((key) => key !== legacyMemberTypes[member.key].ability && hero.abilities.includes(key)))])];
    if (!hero.hp && s.phase !== "lost") hero.hp = Math.min(hero.maxHp, 8 + s.recovery);
    const next = { ...s, party: [hero], actorIndex: 0, acted: s.acted.filter((index) => index === 0), gold: s.gold + refund, pendingSale: s.actorIndex === 0 ? s.pendingSale : null };
    if (["ready", "rolled"].includes(s.phase)) {
      next.acted = [];
      if (s.actorIndex !== 0) { next.phase = "ready"; hero.dice = []; hero.selected = null; }
    }
    if (s.reward) {
      next.reward = { ...s.reward, recovery: Math.min(s.reward.recovery, hero.maxHp), recruits: [] };
      if (s.actorIndex !== 0 && s.reward.resume.startsWith("ability-")) next.reward.resume = next.acted.length ? "party" : "ability-ready";
    }
    const step = saved.tutorialStep;
    return { ...saved, version: 3, state: next, tutorialStep: step === null ? null : step >= 11 ? Math.max(11, step - 1) : step,
      journal: companions.length ? [`Back to a solo adventure. Companion dice refunded: ${refund} gold; purchased abilities transferred.`, ...saved.journal].slice(0, 3) : saved.journal };
  }

  function upgradeStages(saved) {
    validateSave(saved);
    const s = saved.state;
    const next = { ...s, weapon: "melee", battleLoot: { gold: 0, recovery: 0 },
      encounters: [...s.encounters.map((round) => round.kind === "shop" ? { ...round, stage: 1 } : { ...round, stage: 1, group: round.group.map((enemy) => ({ ...enemy, stage: 1 })) }), ...stages.slice(1).flatMap((stage, i) => generateStage(i + 2))] };
    if (s.phase === "won") {
      next.phase = "victory";
      next.reward = { gold: 0, recovery: 0, enemyIndex: s.target, battleWon: true, resume: "party", recruits: [] };
    } else if (s.phase === "victory") {
      if (s.reward.battleWon) next.battleLoot = { gold: s.reward.gold, recovery: s.reward.recovery };
      else {
        next.phase = s.reward.resume === "ability-rolled" ? "rolled" : "ready";
        next.reward = null;
        next.target = s.enemies.findIndex((enemy) => enemy.hp > 0);
        next.acted = [];
        next.enemyCursor = 0;
        next.turn += s.reward.resume.startsWith("ability-") ? 0 : 1;
        if (next.phase === "ready") next.party = s.party.map((hero) => ({ ...hero, dice: [], selected: null, rerolls: 1 + s.extraRerolls }));
      }
    }
    const source = next.encounters[next.phase === "shop" ? next.encounter - 1 : next.encounter].group;
    next.enemies = s.enemies.map((enemy, i) => ({ ...enemy, ...source[i], hp: enemy.hp, maxHp: source[i].hp }));
    const step = saved.tutorialStep;
    const result = { ...saved, version: 4, state: next, tutorialStep: step === null ? null : step >= 12 ? 11 : step >= 9 ? 9 : step };
    delete result.relaxedTiming;
    return result;
  }

  function upgradeWorlds(saved) {
    validateSave(saved);
    const route = generateRun();
    return { ...saved, version: 5, state: { ...saved.state, encounters: saved.state.encounters.map((round, i) => i > saved.state.encounter ? route[i] : round) },
      journal: ["New stage enemies await beyond this round. Markets unlock more upgrades, abilities, and materials in every stage.", ...saved.journal].slice(0, 3) };
  }
  function upgradeRelics(saved) {
    validateSave(saved);
    const route = generateRun();
    const encounters = saved.state.encounters.map((round, i) => {
      if (i <= saved.state.encounter || round.kind === "shop" || stageFor(i) === 1) return round;
      const generated = route[i];
      const health = generated.hp;
      const group = round.group.map((enemy, index) => ({ ...enemy, hp: index === 0 ? health : Math.max(5, Math.round(health * (round.boss ? .25 : .4))) }));
      return { ...round, hp: health, group };
    });
    return { ...saved, version: 6, state: { ...saved.state, relics: [], encounters },
      view: { ...saved.view, screen: saved.tutorialStep === null ? "menu" : "game", collectionTab: "dice", collection: 0 },
      journal: ["Enemy health now grows between stages. Stages 3–5 sell stacking relics. Your current battle and purchases are kept.", ...saved.journal].slice(0, 3) };
  }

  function validateSave(saved) {
    const require = (valid, field) => { if (!valid) throw new Error(`Invalid saved ${field}.`); };
    const integer = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= min && value <= max;
    const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
    const keys = (list, catalog) => Array.isArray(list) && new Set(list).size === list.length && list.every((key) => typeof key === "string" && Object.hasOwn(catalog, key));
    const die = (value) => object(value) && typeof value.type === "string" && typeof value.tier === "string" && Object.hasOwn(diceTypes, value.type) && Object.hasOwn(diceTiers, value.tier) && integer(value.id, 1) && integer(value.paidPrice);
    require(object(saved) && [2, 3, 4, 5, 6].includes(saved.version) && object(saved.state) && (saved.version >= 4 || typeof saved.relaxedTiming === "boolean"), "format");
    const legacy = saved.version < 4;
    const length = legacy ? STAGE_LENGTH : RUN_LENGTH;
    const catalog = saved.version === 2 ? legacyMemberTypes : memberTypes;
    const s = saved.state;
    require(saved.version < 6 || (keys(s.relics, relics) && s.relics.every((key) => unlocked(relics[key], stageFor(s.encounter)))), "relics");
    require(stablePhases.includes(s.phase) && typeof s.code === "string" && /^[A-Z0-9]{4}$/.test(s.code), "phase or run code");
    require(Array.isArray(s.encounters) && s.encounters.length === length, "route");
    s.encounters.forEach((round, i) => {
      const zone = worldFor(i);
      require(object(round) && round.zone === zone, "area");
      require(legacy || round.stage === stageFor(i), "stage");
      if (shopRound(i)) { require(round.kind === "shop" && round.name === "The Wayfarer's Market", "shop round"); return; }
      const final = localRound(i) === STAGE_LENGTH - 1;
      const boss = localRound(i) % SHOP_INTERVAL === 3 || final;
      validateMonster(round, zone, boss, final);
      require(stageFor(i) >= 2 || !round.flying, "flying introduction");
      require(Array.isArray(round.group) && round.group.length >= 1 && round.group.length <= (zone === 0 ? 1 : zone === 1 ? 2 : 3), "enemy group");
      round.group.forEach((enemy, index) => {
        validateMonster(enemy, zone, index === 0 && boss, index === 0 && final);
        require(legacy || (enemy.stage === stageFor(i) && (stageFor(i) >= 2 || !enemy.flying)), "group stage");
      });
      require(["name", "hp", "gold", "moveOffset"].every((key) => round.group[0][key] === round[key]) && JSON.stringify(round.group[0].moves) === JSON.stringify(round.moves), "group leader");
    });
    require(Array.isArray(s.omens) && s.omens.length === zones.length && s.omens.every((omen) => omens.some((known) => JSON.stringify(known) === JSON.stringify(omen))), "omens");
    require(integer(s.encounter, 0, length - 1) && integer(s.completed, 0, length) && integer(s.turn, 1) && integer(s.gold), "progress");
    require((s.phase === "shop") === (s.encounters[s.encounter].kind === "shop") && (s.phase !== "won" || s.encounter === length - 1), "round phase");
    require(object(s.skills) && Object.entries(s.skills).every(([key, level]) => Object.hasOwn(skills, key) && integer(level, 1, skills[key].max)), "skills");
    require(s.power === (s.skills.power || 0) && s.ward === (s.skills.ward || 0) && s.healing === (s.skills.healing || 0) && s.critBonus === 3 + (s.skills.critical || 0) * 2 && s.recovery === (s.skills.recovery || 0) * 4 && s.lootBonus === (s.skills.loot || 0) * .25 && s.extraRerolls === (s.skills.luck || 0), "skill bonuses");
    require(saved.version < 5 || Object.entries(s.skills).every(([key, level]) => level <= skillLimit(key, stageFor(s.encounter))), "upgrade unlocks");
    const expectedParty = Object.keys(catalog).filter((key) => catalog[key].joins <= s.completed);
    require(Array.isArray(s.party) && s.party.length === expectedParty.length && s.party.every((member, i) => object(member) && member.key === expectedParty[i]), "party");
    const ids = [];
    s.party.forEach((member) => {
      require(member.maxHp === catalog[member.key].hp + (s.skills.vitality || 0) * 8 && integer(member.hp, 0, member.maxHp) && integer(member.shield) && integer(member.rerolls, 0, 1 + s.extraRerolls + (Array.isArray(member.usedAbilities) && member.usedAbilities.includes("focus") ? 2 : 0)), "party health");
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
      require(object(enemy) && enemy.name === definition.name && enemy.maxHp === definition.hp && integer(enemy.hp, 0, enemy.maxHp) && integer(enemy.shield) && integer(enemy.poison, 0, poisonLimit(s)) && integer(enemy.chill) && typeof enemy.frozen === "boolean" && typeof enemy.rewarded === "boolean" && enemy.rewarded === (enemy.hp === 0), "enemy status");
    });
    const won = s.enemies.every((enemy) => enemy.hp === 0);
    require((!["ready", "rolled", "lost"].includes(s.phase) || !won) && (!["ready", "rolled"].includes(s.phase) || s.enemies[s.target].hp > 0), "enemy target");
    require(s.phase === "victory" ? object(s.reward) && integer(s.reward.gold, legacy ? 1 : 0) && integer(s.reward.recovery, 0, s.party.reduce((total, ally) => total + ally.maxHp, 0) * (legacy ? 1 : s.enemies.length)) && integer(s.reward.enemyIndex, 0, s.enemies.length - 1) && s.enemies[s.reward.enemyIndex].rewarded && s.reward.battleWon === won && (legacy || won) && ["party", "enemies", "ability-ready", "ability-rolled"].includes(s.reward.resume) && keys(s.reward.recruits, catalog) && s.reward.recruits.every((key) => key !== "knight" && s.party.some((ally) => ally.key === key)) : s.reward === null, "reward");
    if (!legacy) {
      require(["melee", "bow"].includes(s.weapon) && (stageFor(s.encounter) >= 2 || s.weapon === "melee"), "weapon");
      require(object(s.battleLoot) && integer(s.battleLoot.gold) && integer(s.battleLoot.recovery, 0, member.maxHp * s.enemies.length), "banked rewards");
      require(s.phase !== "victory" || (s.reward.gold === s.battleLoot.gold && s.reward.recovery === s.battleLoot.recovery), "reward totals");
    }
    const completed = s.phase === "won" || (s.phase === "victory" && won) ? s.encounter + 1 : s.encounter;
    require(s.completed === completed && (!["shop", "won"].includes(s.phase) || won), "completed rounds");
    const kills = s.encounters.slice(0, completed).reduce((total, round) => total + (round.group?.length || 0), 0) + (s.encounter >= completed && s.phase !== "shop" ? s.enemies.filter((enemy) => enemy.rewarded).length : 0);
    require(s.defeated === kills, "monster count");
    require(object(s.stats) && (legacy ? ["rolls", "damage", "criticals", "earned", "dodges", "parries"] : ["rolls", "damage", "criticals", "earned"]).every((key) => integer(s.stats[key])), "statistics");
    require(Array.isArray(s.stock) && s.stock.length <= 10 && s.stock.every((offer) => object(offer) && ["dice", "skill", "ability"].includes(offer.kind) && typeof offer.key === "string" && Object.hasOwn(offer.kind === "dice" ? diceTypes : offer.kind === "skill" ? skills : abilities, offer.key) && integer(offer.price, 1) && typeof offer.bought === "boolean"), "market stock");
    require(["all", "dice", "skill", "ability", "owned", "relic"].includes(s.shopFilter) && typeof s.refreshed === "boolean" && Array.isArray(s.expandedOffers) && s.expandedOffers.every((index) => integer(index, 0, s.stock.length - 1)), "market state");
    require(s.pendingSale === null || (s.phase === "shop" && member.collection.some((owned) => owned.id === s.pendingSale)), "pending sale");
    require(typeof saved.tutorialSeen === "boolean" && (saved.tutorialStep === null || (saved.tutorialSeen && ["ready", "rolled"].includes(s.phase) && integer(saved.tutorialStep, 0, saved.version === 2 ? 13 : saved.version === 3 ? 12 : tutorialSteps.length - 1))), "tutorial");
    require(Array.isArray(saved.journal) && saved.journal.length <= 3 && saved.journal.every((message) => typeof message === "string" && message.length <= 1000), "journal");
    require(object(saved.view) && typeof saved.view.help === "boolean" && typeof saved.view.reset === "boolean" && ["page", "shop", "tutorial", "instructions"].every((key) => Number.isFinite(saved.view[key]) && saved.view[key] >= 0 && saved.view[key] <= 1000000), "view");
    require(saved.version < 6 || (["menu", "game", "collection"].includes(saved.view.screen) && ["dice", "materials", "abilities", "upgrades", "relics", "enemies"].includes(saved.view.collectionTab) && Number.isFinite(saved.view.collection) && saved.view.collection >= 0 && saved.view.collection <= 1000000 && (saved.tutorialStep === null || saved.view.screen === "game")), "navigation");
    require((!saved.view.help || ["ready", "rolled"].includes(s.phase)) && (!saved.view.reset || (["ready", "rolled", "shop", "won", "lost"].includes(s.phase) && s.pendingSale === null)) && (!saved.view.help || !saved.view.reset) && (saved.tutorialStep === null || (!saved.view.help && !saved.view.reset)), "open dialog");
  }

  function restoreProgress(text) {
    let saved;
    try {
      if (text === null) return false;
      saved = JSON.parse(text);
      if (saved.version === 1) saved = upgradeSave(saved);
      else if (saved.version === 2) saved = upgradePartySave(saved);
      if (saved.version === 3) saved = upgradeStages(saved);
      if (saved.version === 4) saved = upgradeWorlds(saved);
      if (saved.version === 5) saved = upgradeRelics(saved);
      validateSave(saved);
    } catch (error) { pauseSaving(error); return false; }
    restoring = true;
    screen = saved.view.screen;
    collectionTab = saved.view.collectionTab;
    gameScroll = saved.view.page;
    collectionScroll = saved.view.collection;
    state = { ...saved.state, id: ++runSerial, party: saved.state.party.map((member) => ({ ...member, usedAbilities: new Set(member.usedAbilities) })), expandedOffers: new Set(saved.state.expandedOffers) };
    const source = state.encounters[state.phase === "shop" ? state.encounter - 1 : state.encounter].group;
    state.enemies = source.map((definition, i) => ({ ...definition, maxHp: definition.hp, ...Object.fromEntries(["hp", "shield", "poison", "frozen", "chill", "rewarded"].map((key) => [key, saved.state.enemies[i][key]])) }));
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
    renderNavigation();
    if (screen === "collection") renderCollection();
    window.scrollTo(0, screen === "collection" ? collectionScroll : screen === "game" ? gameScroll : 0);
    if (screen !== "game" && !saved.view.reset) $(screen === "menu" ? "menu-play" : "collection-back").focus({ preventScroll: true });
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
      const stored = Number(localStorage.getItem("diceattack-155-round-best") ?? localStorage.getItem("diceattack-31-round-best"));
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
      localStorage.setItem("diceattack-155-round-best", String(best));
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

  function exoticArtwork(enemy) {
    const color = enemy.color;
    const defs = `<linearGradient id="exotic-body" x2=".8" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#304150"/></linearGradient>`;
    const eyes = '<path class="monster-eye" d="m104 76 10 3m15 0 10-3" stroke="#fff1c2" stroke-width="5" stroke-linecap="round"/>';
    let body;
    if (enemy.type === "bird") body = `
      <path d="M90 128Q37 74 8 86l22 31-18 7 33 30-13 9 63 18m56-53q53-54 82-42l-22 31 18 7-33 30 13 9-63 18" fill="url(#exotic-body)" stroke="#39536a" stroke-width="4"/>
      <path d="m95 157 10 44-22 29 36-13 5-21 19 34 25-2-23-33 5-39" fill="${color}" stroke="#39536a" stroke-width="4"/>
      <ellipse cx="121" cy="136" rx="38" ry="58" fill="url(#exotic-body)" stroke="#39536a" stroke-width="4"/>
      <path d="M89 73 80 47l26 11 16-33 11 29 25-8-10 30-5 38-22 17-25-18Z" fill="${color}" stroke="#39536a" stroke-width="4"/>
      ${eyes}<path d="m112 91 10 28 12-27Z" fill="#e5c47e" stroke="#8f754d" stroke-width="2"/><path d="m106 140 15 22 15-22" fill="#ead6ac" opacity=".6"/>`;
    else if (enemy.type === "moth") body = `
      <path d="M106 119Q43 28 16 67q-7 52 73 78Q15 139 34 201q32 32 78-41m27-43q63-89 90-50 7 52-73 78 74-6 55 56-32 32-78-41" fill="url(#exotic-body)" stroke="#526173" stroke-width="4"/>
      <g fill="#e5d4ab" opacity=".7"><ellipse cx="67" cy="101" rx="16" ry="23" transform="rotate(-30 67 101)"/><ellipse cx="178" cy="101" rx="16" ry="23" transform="rotate(30 178 101)"/><circle cx="76" cy="179" r="14"/><circle cx="170" cy="179" r="14"/></g>
      <ellipse cx="122" cy="144" rx="16" ry="60" fill="${color}" stroke="#394b59" stroke-width="4"/>
      <circle cx="122" cy="88" r="20" fill="${color}" stroke="#394b59" stroke-width="4"/>
      <path d="m112 72-16-24m35 24 15-24" stroke="#ead9b0" stroke-width="4" stroke-linecap="round"/>
      <path d="m113 84 4 2m10 0 5-2" stroke="#fff0c4" stroke-width="4"/>`;
    else if (enemy.type === "serpent") body = `
      <path d="M68 211q-40-40 19-54 52-11 83 12 59 50-10 59-91 16-77-35 8-30 59-22" fill="none" stroke="#344857" stroke-width="34"/>
      <path d="M68 211q-40-40 19-54 52-11 83 12 59 50-10 59-91 16-77-35 8-30 59-22" fill="none" stroke="${color}" stroke-width="25"/>
      <path d="M141 180q30-52-8-88" fill="none" stroke="#344857" stroke-width="40"/><path d="M141 180q30-52-8-88" fill="none" stroke="${color}" stroke-width="31"/>
      <path d="m89 76 5-27 24-19 30 17 10 35-20 35-32-5Z" fill="url(#exotic-body)" stroke="#344857" stroke-width="4"/>
      ${eyes}<path d="m109 97 5 17 6-13m13-3 6 16 5-19" fill="#f4e4be"/><path d="m123 112-3 17m0 0-7 5m7-5 7 5" stroke="#dc8b95" stroke-width="3"/><path d="m97 48-10-24 25 11m30 5 23-16-5 28" fill="#ddc58a"/>`;
    else if (enemy.type === "automaton") body = `
      <path d="m85 165-14 62 34 3 13-61m10 0 9 61 35-3-17-62" fill="#576a77" stroke="#283b49" stroke-width="5"/>
      <path d="m64 105-22 7-15 69 32 9 23-52m89-34 26 11 11 60-31 13-18-53" fill="${color}" stroke="#283b49" stroke-width="5"/>
      <path d="m74 94 48-15 47 15-9 76-36 24-41-24Z" fill="url(#exotic-body)" stroke="#283b49" stroke-width="5"/>
      <circle cx="122" cy="139" r="22" fill="#273c48" stroke="#e8cb8f" stroke-width="5"/><path d="m122 120 9 18-9 19-9-19Z" fill="#d2eddd"/>
      <path d="m86 46 35-19 35 19-4 44-30 22-32-21Z" fill="${color}" stroke="#283b49" stroke-width="5"/>${eyes}<path d="M108 95h29" stroke="#364552" stroke-width="5"/><path d="M122 27V13m-10 7h21" stroke="#e8cb8f" stroke-width="5"/>`;
    else if (enemy.type === "stag") body = `
      <path d="m76 145-12 80h18l18-74m34 1 13 74h18l-7-85" fill="${color}" stroke="#344950" stroke-width="4"/>
      <ellipse cx="112" cy="145" rx="51" ry="34" fill="url(#exotic-body)" stroke="#344950" stroke-width="4"/>
      <path d="m126 136 10-53 23-19 26 21-13 60-21 23Z" fill="url(#exotic-body)" stroke="#344950" stroke-width="4"/>
      <path d="m139 80-21-26-5-31m9 34-26-6m23-6 13-17m35 48 22-33 4-26m-10 38 24-10m-19-10-13-14" fill="none" stroke="#e3d4a9" stroke-width="6" stroke-linecap="round"/>
      <path d="m146 95 10 3m11-4 9-3" stroke="#e6f1be" stroke-width="4"/><path d="m159 121 10-4" stroke="#344950" stroke-width="4"/><path d="m66 133-15-20" stroke="${color}" stroke-width="12"/>`;
    else if (enemy.type === "beetle") body = `
      <g fill="none" stroke="#52677a" stroke-width="8"><path d="m86 121-45-24-20 22m63 30-49 9-14 27m64-4-36 29-2 22m111-111 45-24 20 22m-63 30 49 9 14 27m-64-4 36 29 2 22"/></g>
      <ellipse cx="122" cy="159" rx="61" ry="66" fill="url(#exotic-body)" stroke="#344758" stroke-width="5"/>
      <path d="M122 102v114m-45-98 34 37-32 34m89-71-34 37 32 34" fill="none" stroke="#e0d2a5" stroke-width="4"/>
      <ellipse cx="122" cy="83" rx="36" ry="35" fill="${color}" stroke="#344758" stroke-width="5"/>${eyes}
      <path d="m104 101-19 23 27-8m20-15 22 23-27-8m-21-61-14-28m40 30 14-28" fill="none" stroke="#d4c299" stroke-width="6"/>`;
    else body = `
      <path d="M89 123 31 51 11 117l30-12-10 58 55-22m66-16 58-72 20 66-30-12 10 58-55-22" fill="${color}" stroke="#485063" stroke-width="4"/>
      <path d="M144 183q99 4 65 41-48 31-114-12" fill="none" stroke="${color}" stroke-width="19"/>
      <path d="m91 162-21 63 32-1 18-38 24 42 30-3-20-66" fill="${color}" stroke="#485063" stroke-width="4"/>
      <path d="m90 91 32-17 34 20 8 68-37 34-45-32Z" fill="url(#exotic-body)" stroke="#485063" stroke-width="4"/>
      <path d="m87 72 5-26 29-19 33 22 2 37-26 31-30-8Z" fill="${color}" stroke="#485063" stroke-width="4"/>${eyes}
      <path d="m94 48-16-24 33 12m34 7 25-20-10 31" fill="#ead3a3"/><path d="m106 99 8 9 6-8 9 10 7-10" fill="#f6e4b9"/><path d="m120 125 15 21-14 27-14-27Z" fill="#ead3a3" opacity=".8"/>`;
    return svgFrame(body + (enemy.boss ? '<path d="m95 35-6-22 20 9 13-18 13 19 21-10-4 25" fill="#efc681" stroke="#95744b" stroke-width="3"/>' : ""), defs);
  }

  function creatureArtwork(enemy) {
    if (["bird", "moth", "serpent", "automaton", "stag", "beetle", "dragon"].includes(enemy.type)) return exoticArtwork(enemy);
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

  function worldArtwork(stage, zone) {
    const palettes = [
      [["#365962", "#152f42", "#92cbb4"], ["#454665", "#222e48", "#c3badb"], ["#725642", "#352c42", "#edc889"], ["#3b6376", "#1d3b55", "#baeaf1"], ["#2c4268", "#142c48", "#a3c9f1"], ["#524368", "#282e4b", "#e0caed"]],
      [["#485344", "#243731", "#cfcc91"], ["#514957", "#252b3d", "#cebed1"], ["#674437", "#2e2832", "#e8b378"], ["#384e6b", "#213347", "#bbd6f2"], ["#386068", "#1d3b48", "#c1e7d5"], ["#483b62", "#252740", "#d1b6ed"]],
      [["#3b5947", "#192f30", "#b2dca2"], ["#4b3d5d", "#272d44", "#d5baf1"], ["#77503f", "#3b2d3a", "#f1c17e"], ["#2d5760", "#1c3449", "#b4f0da"], ["#1f5159", "#102d3d", "#93e0da"], ["#403453", "#191e35", "#c6a4e0"]],
      [["#6a5b4e", "#303f3c", "#f3d08c"], ["#45425f", "#222c46", "#ddcaed"], ["#733c38", "#36263b", "#f8aa74"], ["#41637c", "#233b55", "#cbf3ff"], ["#373f69", "#1b294d", "#bfd0ff"], ["#51385d", "#251d3e", "#eac1ef"]]
    ];
    const motifs = [
      [
        '<path d="M0 208q90-85 225-18l-34 65-53 28-85-24ZM434 142q108-60 223-5l-40 61-79 25-74-30ZM927 212q120-98 273-16l-39 81-110 14-97-32Z" fill="#426b60"/><g fill="#9dc5a2"><path d="m114 176-33-45 39-60 46 67-32 43Zm435-43-27-39 30-68 38 72-27 36Zm503 65-32-53 46-64 35 67-24 45Z"/></g><path d="M202 204Q321 263 445 165m197-10q128 103 310 78" fill="none" stroke="#c2b58a" stroke-width="9"/><path d="m223 211v30m46-8v25m47-24v23m46-31v25m337-70v33m57-10v23m55-7v20m53-17v18" stroke="#827d68" stroke-width="4"/>',
        '<path d="m168 203 77-38 84 44-34 58-96-4Zm680-55 93-38 101 49-47 62-112-5Zm-394 87 136-45 155 38-66 76-165-12Z" fill="#585572"/><g fill="#a4a0b4" stroke="#77758c" stroke-width="5"><path d="M205 192V121q39-62 77 0v74Zm698-54V70q40-60 78 0v78ZM516 217V126q74-96 143 0v91Z"/></g><g fill="#252b42"><path d="M226 181v-51q18-33 34 0v54Zm699-48V80q18-31 33 0v62ZM553 212v-73q39-59 69 0v74Z"/></g><path d="m244 257-31 87m750-129 24 128m-383-50-8 84" stroke="#aea4bf" stroke-width="3" stroke-dasharray="12 8"/>',
        '<g fill="#aa946f" stroke="#5d5862" stroke-width="5"><path d="m185 292 19-161 48-89 39 93 17 161Zm315 17 21-201 81-89 72 93 17 191Zm405-18 20-159 46-77 39 81 18 157Z"/></g><g fill="#efca81" opacity=".65"><path d="m221 150 26-48 24 51-24 74ZM566 117l33-52 35 52-35 77ZM943 157l26-45 24 45-24 63Z"/></g><path d="M290 230h227m170 0h233" stroke="#c5aa77" stroke-width="9"/><circle cx="602" cy="43" r="65" fill="#e7ba63" opacity=".1"/>',
        '<g fill="#91c2cd" opacity=".6"><path d="m119 297 56-139 54 138Zm256 21 93-238 118 235Zm381-13 67-184 76 186Zm230 13 51-126 61 126Z"/></g><path d="M0 198q107-69 238 0t236-3 241 8 252-8 233 4v68q-129 48-233 1t-252 4-241-9-236 3-238 1Z" fill="#a8d6e1" opacity=".3"/><path d="m435 111 33-31 49 38-44-9Zm350 40 38-30 29 42-26-10Z" fill="#e0eff0"/><path d="M388 320q207-39 414 0" fill="none" stroke="#c4e5e6" stroke-width="10"/>',
        '<path d="M0 117q155-81 311-13t346-4 311 8 232-22v72H0Z" fill="#7384a9" opacity=".3"/><path d="m430 20-35 87 45-15-32 90 90-131-50 13 28-44m358 4-38 80 41-11-30 84 81-123-43 8 26-38" fill="#d6e6ff" opacity=".7"/><path d="m55 279 124-47 153 48-70 45-127-5Zm745-1 158-57 189 56-83 57-162-8Z" fill="#50676c"/><path d="M0 359q183-58 385-2t428-7 387-1" fill="none" stroke="#a8cfdb" stroke-width="13" opacity=".25"/>',
        '<path d="M375 307V148q223-192 452 0v158" fill="#655b80" stroke="#bcadc5" stroke-width="18"/><path d="M426 302V164q177-128 349 0v138" fill="#303951"/><g fill="#a8a2be"><path d="m411 151-52-31 34-66 53 47Zm349-48 57-45 38 69-50 28Z"/></g><circle cx="601" cy="130" r="63" fill="none" stroke="#decaed" stroke-width="5"/><path d="m601 65 19 42 46 8-34 32 8 46-39-22-43 23 8-47-35-31 48-9Z" fill="#d1bfdc" opacity=".35"/><path d="M372 321h461m-410 17h358" stroke="#a2a0bf" stroke-width="12"/>'
      ],
      [
        '<g fill="#415544"><path d="M89 327 104 84l49-33 51 33 16 243ZM951 327 965 75l53-28 43 35 22 245Z"/></g><path d="M274 308V157l61-19 30-73 47 78 65 19v146m262 0V144l62-19 29-66 43 70 66 20v160" fill="#6e7358" stroke="#a7a27e" stroke-width="6"/><path d="M481 303V165q111-77 238 0v138" fill="#263e33" stroke="#a7a27e" stroke-width="7"/><path d="m541 149-5-38 31 15 29-47 28 48 34-17-7 45" fill="#c6b483"/><g fill="#81916a"><circle cx="169" cy="84" r="74"/><circle cx="1017" cy="78" r="77"/></g>',
        '<path d="M0 250h1200v85H0Z" fill="#645c69"/><g fill="#a69ba6" stroke="#554e60" stroke-width="4"><path d="M134 291V136l43-42 39 44v153Zm167 0V93l41-38 42 40v196Zm517 0V95l42-42 41 44v194Zm169 0V135l40-39 42 42v153Z"/><path d="M459 285V103l139-70 146 70v182Z"/></g><path d="M542 284V139q55-80 112 0v145" fill="#272a3b"/><path d="M490 106h221M122 300h967" stroke="#cdc0c6" stroke-width="7"/><circle cx="599" cy="97" r="15" fill="#c5b797"/>',
        '<path d="M108 302V127h118V81h87v222m583-1V91h83v37h119v174M400 309V110h407v199" fill="#725447" stroke="#a48062" stroke-width="5"/><path d="M445 106V53h59v53m186 0V38h61v68" fill="#594644"/><path d="M493 295V177h54v118m85 0V155h74v140" fill="#e8a965" opacity=".4"/><g fill="none" stroke="#d9b884" stroke-width="6"><circle cx="601" cy="140" r="33"/><path d="M601 94v92m-46-46h92m-78-32 65 65m0-65-65 65"/></g><path d="M93 323h1013" stroke="#d79866" stroke-width="10"/>',
        '<path d="M0 290 129 273 252 294 388 260 595 299 813 271 988 293 1200 267v133H0Z" fill="#496177"/><g fill="#87acc8" stroke="#b8dbed" stroke-width="3"><path d="m216 286-20-92 36-97 31 103-17 83Zm255-13-16-122 45-113 37 116-20 130Zm252 10-21-91 37-83 33 91-22 94Zm215-3-13-138 39-106 31 110-17 139Z"/></g><path d="M367 311h477" stroke="#a6c8dd" stroke-width="10"/><path d="m485 111 13 170m239-100 8 96m216-165 4 170" stroke="#d4ebf7" stroke-width="2"/>',
        '<path d="M0 284h1200v116H0Z" fill="#34717a" opacity=".6"/><path d="M85 278V159l37-68 37 68v113m880-1v-96l36-60 39 60v100" fill="#9caa9c"/><path d="M238 279q145-164 354-88t372 91" fill="none" stroke="#c5ccb1" stroke-width="21"/><path d="M268 273q134-111 311-59t353 60" fill="none" stroke="#657f7d" stroke-width="10"/><path d="m290 277 12-40m111 22 4-43m309 18 4 43m113-31 12 34" stroke="#aebfa8" stroke-width="12"/><g fill="#e0d2ab"><path d="m454 92 42-33 37 38-40 30Zm261 22 33-30 32 33-31 26Z"/></g>',
        '<circle cx="603" cy="164" r="129" fill="none" stroke="#a88cb9" stroke-width="9"/><ellipse cx="603" cy="164" rx="206" ry="59" fill="none" stroke="#c3a8d7" stroke-width="5" transform="rotate(-24 603 164)"/><path d="M472 267 426 326h357l-42-62" fill="#766284"/><circle cx="603" cy="164" r="49" fill="#e4c8ed" opacity=".3"/><g fill="#e1c9f0"><circle cx="486" cy="116" r="10"/><circle cx="752" cy="138" r="13"/><circle cx="594" cy="37" r="8"/></g><path d="M536 300h136m-168 18h201" stroke="#b8a3ca" stroke-width="8"/>'
      ],
      [
        '<g fill="none" stroke="#64875e" stroke-width="26"><path d="M115 314V88h221v138h152V57h215v183h160V105h218v211"/><path d="M269 317v-41H168V153h99V94m278 224V104h104v177h112m269 33V165h-99v99h-78"/></g><path d="M460 316q135-92 276 0" fill="#304b38"/><g fill="#9abd77"><circle cx="116" cy="89" r="29"/><circle cx="334" cy="88" r="26"/><circle cx="701" cy="57" r="35"/><circle cx="1084" cy="105" r="28"/></g><path d="M522 308h150" stroke="#c1bb88" stroke-width="7"/>',
        '<path d="M143 309V71h106v238m703 0V71h105v238M360 311V107q239-131 480 0v204" fill="#665879" stroke="#aa90bf" stroke-width="8"/><g fill="none" stroke="#c4a9e0" stroke-width="3" opacity=".55"><ellipse cx="603" cy="164" rx="145" ry="111"/><ellipse cx="603" cy="164" rx="108" ry="87"/><ellipse cx="603" cy="164" rx="72" ry="59"/></g><circle cx="603" cy="163" r="31" fill="#d8b9ee" opacity=".25"/><path d="M0 324h1200m-1042-94h88m714 0h84" stroke="#7d6a98" stroke-width="10"/>',
        '<path d="M0 249q147-76 314-9t349-4 319 12 218-29v181H0Z" fill="#966d50"/><path d="M0 322q199-78 369-17t363 1 468-13v107H0Z" fill="#55403c"/><path d="M546 274V129l56-43 52 43v145Z" fill="#8e614a"/><path d="m601 126-30-41-55-10 26-36 36 22 23-54 23 54 38-24 25 39-55 8Z" fill="#e7ad67"/><path d="M114 248 134 161l15 9 6 76m882 4 13-89 18 5 8 83" fill="#dfb06b"/><circle cx="859" cy="74" r="41" fill="#e5c39e" opacity=".25"/>',
        '<path d="M0 63q231 130 489 9t711 22M0 103q237 130 488 13t712 22" fill="none" stroke="#a3f0bd" stroke-width="18" opacity=".25"/><path d="M0 153q232-98 477 7t723-23" fill="none" stroke="#b7a5e7" stroke-width="29" opacity=".2"/><path d="M0 318 107 301 257 321 419 285 595 321 789 291 965 322 1200 282v118H0Z" fill="#7da8ad"/><g fill="#d4e8df"><path d="m273 315 56-74 67 69Zm379-7 50-79 63 76Zm-523 8 22-87 27 88Z"/></g><path d="M411 326q162-55 351 0" fill="none" stroke="#bde3dc" stroke-width="9"/>',
        '<path d="M162 313q87-168 431-200 376-37 489 180" fill="none" stroke="#81b6b7" stroke-width="30" opacity=".65"/><g fill="none" stroke="#accdbe" stroke-width="12" opacity=".6"><path d="M262 296q-31-79 28-132m80 107q-38-113 27-132m96 129q-28-125 31-140m97 145q24-128-38-154m135 160q52-128-8-147m105 162q70-105 8-140"/></g><path d="M0 330q309-34 607 4t593-4v70H0Z" fill="#1e4c50"/><path d="m445 42 18 272m295-286-7 278" stroke="#a1e0d0" stroke-width="40" opacity=".06"/>',
        '<circle cx="623" cy="111" r="75" fill="#ad8cbf" opacity=".35"/><circle cx="650" cy="91" r="74" fill="#24253e"/><path d="M0 298 188 188 305 305 514 244 716 299 897 171 1200 308v92H0Z" fill="#51435f"/><g fill="#897398"><path d="m101 312 32-102 19 115Zm258-16 35-133 22 139Zm493 16 24-141 32 153Zm250 18 30-151 22 157Z"/></g><path d="m505 291 32-68 56-25 63 27 34 71" fill="none" stroke="#c1a1d0" stroke-width="6"/>'
      ],
      [
        '<circle cx="603" cy="142" r="105" fill="#ebc183" opacity=".22"/><path d="M0 303q224-63 400-21t357-20 443 36v102H0Z" fill="#668263"/><g fill="#acb88b"><path d="M130 316 144 123h26l18 193Zm842 0 19-206h27l18 206Z"/><circle cx="160" cy="126" r="72"/><circle cx="1006" cy="118" r="78"/></g><path d="M440 324 599 197 766 324" fill="#d5bc8b" opacity=".3"/><path d="m520 320 79-89 91 90" fill="#e4c797" opacity=".3"/>',
        '<circle cx="602" cy="165" r="124" fill="#635c7c" stroke="#b1a1c7" stroke-width="10"/><circle cx="602" cy="165" r="100" fill="#28314b" stroke="#9484b0" stroke-width="3"/><g stroke="#d6c7dd" stroke-width="5"><path d="M602 68v20m0 154v20m-97-97h20m154 0h20m-166-69 14 14m110 110 14 14m-138 0 14-14m110-110 14-14M602 165V101m0 64 45 27"/></g><path d="M173 300 207 95h58l34 205m605 0 35-206h57l32 206" fill="#81758f"/><path d="m231 114 1 161m735-159-3 159" stroke="#baadc9" stroke-width="6"/>',
        '<path d="M0 305 219 229 371 270 495 127 598 92 709 125 865 275 1018 218 1200 302v98H0Z" fill="#754b4b"/><path d="m495 127 54 38 49-28 54 29 57-41-53 2-56-35-54 34Z" fill="#ec9c68"/><path d="m598 154-17 117-45 62 87 55 31-58-34-64Z" fill="#e29460"/><path d="m573 72-20-55m80 52 35-47m-70 32 2-52" stroke="#dca176" stroke-width="8" opacity=".35"/><circle cx="597" cy="80" r="65" fill="#f6a062" opacity=".08"/>',
        '<path d="M0 0h1200v63l-134 58-98-55-129 49-142-78-147 74-143-49-175 60L0 53Z" fill="#95bcca"/><path d="M0 400V217l128-99 175 54 116-81 186 62 140-74 167 87 133-65 155 140v159H0Z" fill="#426780"/><path d="M297 339V204q304-228 613 0v135" fill="#1c344e" stroke="#9ac7df" stroke-width="15"/><g fill="#b5deeb"><path d="m431 139 25 88 25-109Zm288-17 28 89 25-75Zm-145-29 32 89 23-88Z"/></g><path d="M0 365h1200" stroke="#c5e9f0" stroke-width="13" opacity=".5"/>',
        '<path d="M0 250q226-89 439-13t397-9 364 8v164H0Z" fill="#506391" opacity=".65"/><path d="M0 324q249-65 468-3t393-13 339 11" fill="none" stroke="#b3c8ef" stroke-width="7"/><g fill="#cfdbf4"><circle cx="224" cy="79" r="19"/><circle cx="445" cy="124" r="11"/><circle cx="777" cy="76" r="27"/><circle cx="1004" cy="132" r="14"/></g><ellipse cx="777" cy="77" rx="55" ry="13" fill="none" stroke="#c5b2e4" stroke-width="5" transform="rotate(-20 777 77)"/><path d="m516 288 90-79 92 85-87 41Z" fill="#8c9cb6"/><path d="m546 287 61-51 54 57-51 22Z" fill="#c2d0e6"/>',
        '<path d="M393 310 336 219 376 91 482 35l42 44-77 91 30 128m250 8 51-143-77-87 43-46 108 53 41 132-61 104" fill="#82608e" stroke="#b58dc1" stroke-width="7"/><path d="M545 303 498 173l106-97 100 95-39 133Z" fill="#452a57" stroke="#d5aadf" stroke-width="6"/><path d="m603 108-61 66 60 103 58-104Z" fill="#e0b6e9" opacity=".6"/><path d="m606 141-30 36 26 63 31-65Z" fill="#fff1ed" opacity=".5"/><path d="M0 342 394 309l155 23 115-1 152-24 384 32" fill="none" stroke="#c598d5" stroke-width="7"/>'
      ]
    ];
    const [sky, ground, accent] = palettes[stage - 2][zone];
    const stars = Array.from({ length: 26 }, (_, i) => `<circle class="spark" cx="${(i * 173 + stage * 43) % 1200}" cy="${(i * 61 + zone * 29) % 280}" r="${i % 4 ? 1.3 : 2.5}" fill="${accent}" opacity=".4" style="animation-delay:-${i % 5}s"/>`).join("");
    return svgFrame(`<title>${stages[stage - 1].worlds[zone]}</title><rect width="1200" height="400" fill="url(#world-sky)"/>${stars}${motifs[stage - 2][zone]}<path d="M0 369q224-19 425 2t385-6 390 5v30H0Z" fill="${ground}" opacity=".8"/>`,
      `<linearGradient id="world-sky" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="${ground}"/></linearGradient>`, "0 0 1200 400").replace('<svg xmlns=', '<svg preserveAspectRatio="xMidYMid slice" xmlns=');
  }

  function sceneArtwork(zone, stage = 1) {
    if (stage > 1) return worldArtwork(stage, zone);
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
    practice = null;
    $("practice-dice").replaceChildren();
    state = {
      id: ++runSerial, code: Math.random().toString(36).slice(2, 6).padEnd(4, "0").toUpperCase(),
      encounters: generateRun(), omens: shuffle(omens),
      phase: "ready", encounter: 0, completed: 0, defeated: 0, reward: null, turn: 1, gold: 0, weapon: "melee", battleLoot: { gold: 0, recovery: 0 },
      power: 0, ward: 0, healing: 0, critBonus: 3, recovery: 0, extraRerolls: 0, lootBonus: 0,
      party: [], actorIndex: 0, acted: [], nextDieId: 1, pendingSale: null, enemies: [], target: 0, enemyCursor: 0, skills: {}, relics: [],
      stats: { rolls: 0, damage: 0, criticals: 0, earned: 0 }, stock: [], shopFilter: "all", refreshed: false, expandedOffers: new Set()
    };
    state.party.push(createMember("knight"));
    ["shop-overlay", "reward-overlay", "sell-overlay", "end-overlay", "reset-overlay", "help-overlay", "tutorial-overlay"].forEach((id) => { $(id).hidden = true; });
    $("hero-art").className = "character-art";
    $("hero-effects").replaceChildren();
    $("enemy-effects").replaceChildren();
    $("battle-log").replaceChildren();
    loadEncounter();
    log("One attack die. Five stages, 155 rounds. Every fifth round in each stage is a market.");
  }

  function loadEncounter() {
    const definition = state.encounters[state.encounter];
    state.party.forEach((member) => { member.shield = definition.kind === "shop" ? 0 : (state.skills.barrier || 0) * 4; member.dice = []; member.selected = null; member.rerolls = 1 + state.extraRerolls; member.usedAbilities.clear(); });
    state.acted = [];
    state.actorIndex = livingMembers()[0]?.index ?? 0;
    state.enemyCursor = 0;
    state.target = 0;
    state.battleLoot = { gold: 0, recovery: 0 };
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
    $("zone-title").textContent = worldName();
    $("area-label").textContent = `STAGE ${stageFor(state.encounter)} · WORLD ${zoneIndex + 1} / 6`;
    $("arena").className = `arena ${zone.className}`;
    $("scene-art").innerHTML = sceneArtwork(zoneIndex, stageFor(state.encounter));
    $("scene-art").style.filter = "";
    $("flavor-text").textContent = definition.flavor;
    render();
  }

  function enemyArtwork(enemy) {
    let artwork = enemy.type === "slime" ? slimeArtwork(enemy) : enemy.type === "skeleton" ? skeletonArtwork(enemy) : enemy.type === "demon" ? demonArtwork(enemy) : creatureArtwork(enemy);
    if (enemy.mushroom) artwork = artwork.replace("</svg>", '<path d="M56 105q13-83 69-75 49 3 64 74Z" fill="#af677f" stroke="#663f62" stroke-width="4"/><g fill="#edccbe"><ellipse cx="90" cy="75" rx="11" ry="7"/><ellipse cx="138" cy="53" rx="9" ry="6"/><ellipse cx="163" cy="88" rx="10" ry="7"/></g></svg>');
    if (enemy.flying && !["bird", "moth", "dragon"].includes(enemy.type)) artwork = artwork.replace("</svg>", '<g fill="#b8dcec" fill-opacity=".75" stroke="#537f9e" stroke-width="3"><path d="M91 120Q49 59 10 48q5 68 59 116l-15-39 29 21Z"/><path d="M152 120q42-61 81-72-5 68-59 116l15-39-29 21Z"/></g></svg>');
    if (enemy.homeStage === 3 && ["wolf", "skeleton", "golem"].includes(enemy.type)) artwork = artwork.replace("</svg>", '<circle cx="120" cy="145" r="18" fill="#283949" stroke="#e6c17e" stroke-width="4"/><path d="m120 131 9 14-9 14-9-14Z" fill="#d9cb99"/></svg>');
    return artwork;
  }

  function namespaceArtwork(markup, prefix) {
    return markup.replace(/id="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}-${id})`);
  }

  function paintCombatants() {
    const member = actor();
    const definition = memberTypes[member.key];
    const heroKey = `${state.id}-${state.weapon}`;
    if ($("hero-art").dataset.artKey !== heroKey) {
      $("hero-art").dataset.artKey = heroKey;
      $("hero-art").className = `character-art member-${member.key}`;
      const artwork = state.weapon === "bow" ? heroArtwork().replace(/<g transform="rotate\(18 184 134\)">[\s\S]*?<\/g>/, '<g><path d="M184 62q66 82 0 164" fill="none" stroke="#e6bf78" stroke-width="7" stroke-linecap="round"/><path d="m184 62 3 164" stroke="#d5eed8" stroke-width="2"/><path d="M143 146h88m0 0-12-6m12 6-12 6" stroke="#d5eed8" stroke-width="3"/><path d="m143 146 10-6m-10 6 10 6" stroke="#73b99e" stroke-width="3"/></g>') : heroArtwork();
      $("hero-art").innerHTML = namespaceArtwork(artwork, "active");
    }
    $("hero-art").classList.toggle("defeated", member.hp === 0);
    $("hero-name").textContent = definition.name;
    $("hero-role").textContent = state.weapon === "bow" ? "THE SKYHUNTER · BOW" : definition.title;
    const enemy = targetEnemy();
    const enemyKey = `${state.id}-${state.encounter}-${state.target}`;
    if ($("enemy-art").dataset.artKey !== enemyKey) {
      $("enemy-art").dataset.artKey = enemyKey;
      $("enemy-art").className = `character-art ${enemy.type}${enemy.boss ? " boss" : ""}${enemy.flying ? " flying" : ""}`;
      $("enemy-art").innerHTML = enemyArtwork(enemy);
    }
    $("enemy-art").classList.toggle("defeated", enemy.hp === 0);
    $("enemy-name").textContent = enemy.name.replace(/^Frenzied /, "");
    $("enemy-name").title = enemy.name;
    $("enemy-role").textContent = enemy.role;
    $("enemy-icon").textContent = enemy.boss ? "♛" : ["I", "II", "III", "IV", "V", "VI"][enemy.zone];
  }

  function renderFormation() {
    $("enemy-group-label").textContent = `${state.enemies.filter((enemy) => enemy.hp > 0).length} / ${state.enemies.length} alive · click a target`;
    $("enemy-roster").innerHTML = state.enemies.map((enemy, i) => {
      const intent = getIntent(enemy);
      const member = state.party[intent.target];
      const disabled = practice || !["ready", "rolled"].includes(state.phase) || !enemy.hp;
      return `<button class="enemy-card${i === state.target ? " targeted" : ""}${!enemy.hp ? " fallen-enemy" : ""}" data-enemy="${i}" aria-pressed="${i === state.target}" aria-label="Target ${enemy.name}, ${enemy.hp} of ${enemy.maxHp} health${enemy.flying ? ", flying, bow required" : ""}${enemy.shield ? `, ${enemy.shield} shield` : ""}"${disabled ? " disabled" : ""}><span class="enemy-portrait" aria-hidden="true">${namespaceArtwork(enemyArtwork(enemy), `formation-${i}`)}</span><strong>${enemy.name.replace(/^Frenzied /, "")}</strong><small>${enemy.hp} / ${enemy.maxHp} HP${enemy.shield ? ` · ⬡ ${enemy.shield}` : ""}${enemy.flying ? " · FLYING" : ""}</small><span class="member-health enemy-health-track"><i style="width:${enemy.hp / enemy.maxHp * 100}%"></i></span><small>${!enemy.hp ? "DEFEATED" : enemy.frozen ? "FROZEN" : intent.kind === "guard" ? `⬡ ${intent.value} shield` : `⚔ ${incomingDamage(enemy, intent)} → ${memberTypes[member.key].name}${enemy.chill ? " · ❄" : ""}`}${enemy.poison && enemy.hp ? ` · ❧ ${enemy.poison}` : ""}</small></button>`;
    }).join("");
  }

  function selectEnemy(index) {
    if (practice || !["ready", "rolled"].includes(state.phase) || !state.enemies[index]?.hp) return;
    state.target = index;
    render();
    $("enemy-roster").querySelector(`[data-enemy="${index}"]`).focus({ preventScroll: true });
  }

  function selectWeapon(weapon) {
    if (practice || !["ready", "rolled"].includes(state.phase) || !["melee", "bow"].includes(weapon)) return;
    if (weapon === "bow" && stageFor(state.encounter) < 2) { notify("Your free bow unlocks at the start of stage 2."); return; }
    state.weapon = weapon;
    render();
    $("weapon-controls").querySelector(`[data-weapon="${weapon}"]`).focus({ preventScroll: true });
  }

  function canHitTarget() { return !targetEnemy().flying || state.weapon === "bow"; }

  function getIntent(enemy = targetEnemy()) {
    const [kind, base, name] = enemy.moves[(state.turn - 1 + enemy.moveOffset) % enemy.moves.length];
    const rage = Math.floor((state.turn - 1) / 3);
    const living = livingMembers();
    const target = living.length ? living[(state.turn - 1 + state.enemies.indexOf(enemy)) % living.length].index : state.actorIndex;
    return { kind, value: kind === "guard" ? base : base + rage, name, rage, target };
  }
  function incomingDamage(enemy, intent = getIntent(enemy)) {
    return Math.max(0, intent.value - enemy.chill - (state.skills.resilience || 0));
  }

  function totals() {
    const result = { attack: 0, guard: 0, mend: 0, criticals: 0, pierce: 0, poison: 0, gold: 0, chill: 0, chains: 0 };
    const omen = currentOmen();
    const power = state.power + (omen.power || 0) + (state.weapon === "bow" ? (state.skills.archery || 0) * 2 : 0);
    const ward = state.ward + (omen.ward || 0);
    const healing = state.healing + (omen.healing || 0);
    actor().dice.forEach((die) => {
      const value = effectiveRoll(die);
      if (die.type === "attack") {
        result.attack += value + power + (die.value === 6 ? state.critBonus + (omen.critical || 0) : 0);
        if (die.value === 6) result.criticals++;
      } else if (die.type === "guard") result.guard += value + ward;
      else if (die.type === "mend") result.mend += value + healing;
      else if (die.type === "flame") result.pierce += value + 2 + power;
      else if (die.type === "venom") result.poison += Math.ceil(value / 2) + (state.skills.venomcraft || 0);
      else if (die.type === "blood") { result.attack += value + power; result.mend += Math.ceil(value / 2) + healing; }
      else if (die.type === "fortune") { result.gold += value; result.guard += Math.ceil(value / 2) + ward; }
      else if (die.type === "frost") { result.pierce += Math.ceil(value / 2) + power; result.chill += Math.ceil(value / 2); }
      else if (die.type === "lightning") {
        const strikes = die.value >= 5 ? 2 : 1;
        result.attack += (value + power) * strikes;
        if (strikes === 2) result.chains++;
      } else if (die.type === "bloom") { result.mend += Math.ceil(value / 2) + healing; result.guard += Math.floor(value / 2) + ward; }
    });
    result.mend += Math.floor((result.attack + result.pierce) * (state.skills.siphon || 0) * .04);
    result.gold = Math.floor(result.gold * (1 + (state.skills.harvest || 0) * .5));
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
    $("hero-power").textContent = `+${state.power + (state.weapon === "bow" ? (state.skills.archery || 0) * 2 : 0)} attack power`;
    $("hero-healing").textContent = `+${state.healing} healing`;
    $("hero-caption")?.setAttribute("title", `Attack +${state.power} per die. Guard +${state.ward} per die. Mend +${state.healing} per die. Critical bonus +${state.critBonus}.`);
    const stage = stageFor(state.encounter);
    const offset = (stage - 1) * STAGE_LENGTH;
    $("encounter-number").textContent = String(localRound(state.encounter) + 1).padStart(2, "0");
    $("stage-name").textContent = `STAGE ${stage} / ${STAGE_COUNT} · ${stages[stage - 1].name}`;
    $("adventure-progress").textContent = `${state.completed} / ${RUN_LENGTH} total rounds complete`;
    $("stage-path").innerHTML = stages.map((definition, i) => `<span class="stage-node${i + 1 === stage ? " current-stage" : ""}${i < stage - 1 ? " completed-stage" : ""}"${i + 1 === stage ? ' aria-current="step"' : ""}><strong>${i < stage - 1 ? "✓" : i + 1}</strong><span>${definition.name}<small>31 ROUNDS · 6 WORLDS</small></span></span>`).join("");
    $("stage-intro").hidden = localRound(state.encounter) !== 0;
    $("stage-intro").textContent = stage === 2 ? "A free bow is yours! Flying enemies stay beyond melee reach. Switch to Bow; your offensive dice become arrows with the same rolled damage." : stage === 1 ? "Five stages. Thirty named worlds. Keep your dice, gold, abilities, and upgrades throughout the adventure." : "A new stage, a fresh set of worlds. Your health is restored and all your dice and upgrades carry forward.";
    $("weapon-controls").hidden = stage < 2;
    $("weapon-controls").querySelectorAll("[data-weapon]").forEach((button) => { button.setAttribute("aria-pressed", String(button.dataset.weapon === state.weapon)); button.disabled = !["ready", "rolled"].includes(state.phase) || Boolean(practice); });
    $("target-warning").hidden = !enemy.flying || !enemy.hp;
    $("target-warning").textContent = state.weapon === "bow" ? "FLYING TARGET · Your bow can reach it. Damage comes from your dice." : "FLYING TARGET · Melee and Ember Bolt cannot reach it. Switch to Bow to attack.";
    $("gold-counter").innerHTML = `◈ <b>${state.gold}</b>`;
    $("gold-counter").setAttribute("aria-label", `${state.gold} gold`);
    const omen = currentOmen();
    const nextShop = state.encounters.findIndex((round, index) => index >= state.encounter && index < offset + STAGE_LENGTH && round.kind === "shop");
    const untilShop = nextShop - state.completed;
    $("run-note").textContent = `RUN ${state.code} · ${omen.name}: ${omen.text} · ${state.phase === "shop" ? "SHOP-ONLY ROUND" : nextShop < 0 ? stage === STAGE_COUNT ? "FINAL GUARDIAN" : "STAGE GUARDIAN" : `SHOP IN ${untilShop} ${untilShop === 1 ? "VICTORY" : "VICTORIES"}`}`;
    $("turn-counter").textContent = `TURN ${String(state.turn).padStart(2, "0")}${intent.rage ? ` · RAGE +${intent.rage}` : ""}`;
    $("route").innerHTML = zones.map((zone, chapter) => `<span class="route-chapter" aria-label="${stages[stage - 1].worlds[chapter]}">${state.encounters.slice(offset + chapter * SHOP_INTERVAL, offset + (chapter === zones.length - 1 ? STAGE_LENGTH : (chapter + 1) * SHOP_INTERVAL)).map((round, slot) => {
      const i = offset + chapter * SHOP_INTERVAL + slot;
      return `${slot ? '<span class="route-line"></span>' : ""}<span class="route-node${round.boss ? " boss" : ""}${round.kind === "shop" ? " shop-node" : ""}${i < state.completed ? " done" : i === state.encounter ? " current" : ""}" data-round="${i + 1}" data-kind="${round.kind}" aria-label="Stage ${stage}, round ${localRound(i) + 1}: ${round.name}${i < state.completed ? ", completed" : i === state.encounter ? ", current" : ""}"${i === state.encounter ? ' aria-current="step"' : ""}><span>${i < state.completed ? "✓" : round.kind === "shop" ? "◈" : round.boss ? "♛" : localRound(i) + 1}</span></span>`;
    }).join("")}</span>`).join("");
    const intentIcon = intent.kind === "guard" ? "⬡" : intent.kind === "drain" ? "✦" : "⚔";
    const intentSuffix = intent.kind === "guard" ? `gains <strong>${intent.value}</strong> shield` : `<strong>${incomingDamage(enemy, intent)}</strong> damage${enemy.chill ? ` (❄ −${enemy.chill})` : ""}${state.skills.resilience ? ` (✥ −${state.skills.resilience})` : ""}${intent.kind === "drain" ? " + lifesteal" : ""}`;
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
    $("main-button").disabled = !["ready", "rolled"].includes(phase) || (phase === "rolled" && !canHitTarget());
    $("reset-button").disabled = ["rolling", "resolving", "victory"].includes(phase);
    $("tutorial-button").disabled = !["ready", "rolled"].includes(phase);
    $("start-tutorial").disabled = !["ready", "rolled"].includes(phase);
    $("main-button-text").textContent = phase === "ready" ? actor().collection.length === 1 ? "Roll your die" : "Roll your dice" : phase === "rolling" ? "Rolling…" : phase === "resolving" ? "Fighting…" : phase === "rolled" ? "Make your move" : "Battle complete";
    $("reroll-button").disabled = phase !== "rolled" || !actor().rerolls || actor().selected === null;
    $("reroll-button").innerHTML = `↻ Reroll selected <span>${actor().rerolls} left</span>`;
    $("dice-count").textContent = `${actor().collection.length} / ${MAX_DICE}`;
    $("dice-caption").textContent = phase === "rolled" ? "SELECT A DIE TO REROLL, OR MAKE YOUR MOVE" : phase === "rolling" ? "FATE IS DECIDING…" : "BUILD YOUR COLLECTION AT THE NEXT SHOP";
    $("die-description").textContent = actor().selected !== null ? dieDescription(actor().dice[actor().selected]) : "Ten materials, ten effects. New materials and upgrades unlock every stage.";
    $("phase-title").textContent = phase === "ready" ? "Make your own luck." : phase === "rolled" ? "Your collection. Your destiny." : phase === "rolling" ? "Let fortune fall." : phase === "resolving" ? "Your fate unfolds." : phase === "lost" ? "The dice will roll again." : "Fortune favors the brave.";
    $("phase-instruction").textContent = phase === "rolled" ? "Choose a target, reroll, cast an ability, or make your move." : phase === "ready" ? `Roll ${actor().collection.length === 1 ? "your die" : `your ${actor().collection.length} dice`}. Surviving enemies strike after your move.` : phase === "rolling" ? "A little courage. A little luck." : phase === "resolving" ? "Your shields protect you. Enemy turns resolve automatically." : "An expedition is only the beginning.";
    const outgoing = canHitTarget() ? Math.max(0, values.attack - enemy.shield) + values.pierce : 0;
    const healTarget = healingTarget();
    $("combat-preview").textContent = phase === "rolled" ? !canHitTarget() ? "Switch to Bow to reach this flying enemy. Your rolled dice stay unchanged." : `${outgoing} ${state.weapon === "bow" ? "bow " : ""}damage${values.poison ? ` +${values.poison} poison` : ""} · ${Math.min(values.mend, healTarget.maxHp - healTarget.hp)} healing · ${outgoing >= enemy.hp ? "lethal strike!" : `target: ${enemy.name}`}` : `${memberTypes[actor().key].perk} ${stage >= 2 ? "Bow reaches flying enemies. Your dice power both weapons." : "Shields block automatically. Win the whole round to claim its chest."}`;
    renderAbilities();
    $("skill-list").innerHTML = Object.entries(state.skills).map(([key, level]) => `<span title="${skills[key].text}">${skills[key].icon} ${skills[key].name} ${level > 1 ? `×${level}` : ""}</span>`).join("");
    renderNavigation();
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
    const multiplier = relicMultiplier(die.type);
    return `${dieName(die)}: ${diceTypes[die.type].text}${tier.bonus ? ` ${tier.name} adds +${tier.bonus} to the roll.` : ""}${multiplier > 1 ? ` Relics multiply its effective roll by ${multiplier}.` : ""}${die.value !== undefined ? ` Rolled ${die.value}${tier.bonus || multiplier > 1 ? `; (${die.value} + ${tier.bonus}) × ${multiplier} = ${effectiveRoll(die)}` : ""}.` : ""}`;
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
    if (!canHitTarget()) { notify("This enemy is flying. Switch to Bow; your rolled dice are kept."); return; }
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
    if (values.poison && enemy.hp) enemy.poison = Math.min(poisonLimit(), enemy.poison + values.poison);
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
      const weakened = incomingDamage(enemy, intent);
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
        animate("enemy-art", "enemy-strike");
        await wait(300);
        if (state.id !== run) return;
        const absorbed = absorbDamage(member.shield, weakened);
        const damage = Math.min(member.hp, absorbed.damage);
        member.shield = absorbed.shield;
        member.hp -= damage;
        floatNumber("hero", damage ? `−${damage}` : "BLOCK", damage ? "" : "block");
        if (damage) { animate("hero-art", "hit"); playSound("hit"); }
        else playSound("block");
        log(`You take ${damage} damage from ${enemy.name}${absorbed.blocked ? `; ${absorbed.blocked} shield spent, ${member.shield} left` : ""}.`);
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
    const omen = currentOmen();
    state.enemies.filter((foe) => !foe.hp && !foe.rewarded).forEach((foe) => {
      foe.rewarded = true;
      state.defeated++;
      const gold = Math.ceil(foe.gold * (1 + state.lootBonus)) + (omen.gold || 0);
      const recovery = Math.min(actor().maxHp - actor().hp, 8 + state.recovery + (omen.recovery || 0));
      actor().hp += recovery;
      state.battleLoot.gold += gold;
      state.battleLoot.recovery += recovery;
      log(`${foe.name} falls. ${gold} gold goes into the round's chest${recovery ? `; recover ${recovery} health` : ""}.`);
    });
    if (!battleWon()) {
      state.target = state.enemies.findIndex((foe) => foe.hp > 0);
      if (resume.startsWith("ability-")) {
        state.phase = resume.slice("ability-".length);
        render();
        $("main-button").focus({ preventScroll: true });
      } else if (resume === "enemies") await enemyRound();
      else await nextPartyTurn();
      return;
    }
    state.completed = state.encounter + 1;
    state.phase = "victory";
    addGold(state.battleLoot.gold);
    actor().dice = [];
    actor().selected = null;
    state.reward = { ...state.battleLoot, enemyIndex: index, battleWon: true, resume, recruits: [] };
    $("enemy-art").classList.add("defeated");
    $("ward-aura").classList.remove("visible");
    saveRecord();
    playSound("victory");
    log(`The whole round is won. +${state.battleLoot.gold} gold. Claim your victory chest.`);
    closeHelp(false);
    renderReward(false);
    render();
    $("reward-overlay").querySelector(".modal").focus({ preventScroll: true });
    await wait(1000);
    if (state.id !== run) return;
    $("reward-continue").disabled = false;
    $("reward-menu").disabled = false;
    $("reward-continue").focus({ preventScroll: true });
  }

  function renderReward(ready) {
    const { gold, recovery } = state.reward;
    const stage = stageFor(state.encounter);
    const stageEnd = localRound(state.encounter) === STAGE_LENGTH - 1;
    $("reward-description").textContent = `All ${state.enemies.length} ${state.enemies.length === 1 ? "enemy" : "enemies"} defeated. Stage ${stage}, round ${localRound(state.encounter) + 1} complete.${stageEnd ? stage === STAGE_COUNT ? " The entire adventure is won!" : ` Stage ${stage + 1} awaits, with all your upgrades kept.` : ""} Your round's gold is now in your purse.`;
    $("reward-gold").textContent = `+${gold}`;
    $("reward-health").textContent = recovery ? `+${recovery}` : "FULL";
    $("reward-health-note").textContent = recovery ? "Total health recovered from this round's defeated enemies." : "You're already at full health.";
    $("reward-wallet").textContent = `Your purse: ${state.gold} gold`;
    $("reward-continue").textContent = state.encounter === RUN_LENGTH - 1 ? "Claim victory ↗" : stageEnd ? `Enter stage ${stage + 1} ↗` : state.encounters[state.encounter + 1].kind === "shop" ? "Enter the market ↗" : "Next round ↗";
    $("reward-continue").disabled = !ready;
    $("reward-menu").disabled = !ready;
    $("reward-overlay").hidden = false;
  }

  async function continueVictory() {
    if (state.phase !== "victory" || !state.reward || $("reward-continue").disabled) return;
    state.phase = "resolving";
    state.reward = null;
    $("reward-overlay").hidden = true;
    if (state.encounter === RUN_LENGTH - 1) {
      state.phase = "won";
      render();
      showEnding(true);
    } else {
      state.encounter++;
      if (localRound(state.encounter) === 0) {
        actor().hp = actor().maxHp;
        if (stageFor(state.encounter) === 2) state.weapon = "bow";
        state.omens = shuffle(omens);
        log(`Stage ${stageFor(state.encounter)} begins. Your health is restored, and your dice and upgrades stay.${stageFor(state.encounter) === 2 ? " A free bow joins your equipment!" : ""}`);
      }
      loadEncounter();
      if (state.phase === "ready") $("main-button").focus({ preventScroll: true });
    }
  }

  function makeStock() {
    state.expandedOffers.clear();
    const stage = stageFor(state.encounter);
    const availableAbilities = shuffle(Object.keys(abilities).filter((key) => unlocked(abilities[key]) && !actor().abilities.includes(key)));
    const availableSkills = shuffle(Object.keys(skills).filter((key) => (state.skills[key] || 0) < skillLimit(key)));
    const newestFirst = (list, catalog) => [...list.filter((key) => catalog[key].unlock === stage), ...list.filter((key) => catalog[key].unlock !== stage)];
    const types = ["attack", "guard", "mend"];
    const newType = shuffle(["frost", "lightning", "bloom"])[0];
    types.push(newType, shuffle(Object.keys(diceTypes).filter((key) => !types.includes(key) && key !== newType))[0]);
    const offers = [
      ...types.map((key) => ({ kind: "dice", key })),
      ...newestFirst(availableAbilities, abilities).slice(0, 2).map((key) => ({ kind: "ability", key })),
      ...newestFirst(availableSkills, skills).slice(0, 3).map((key) => ({ kind: "skill", key }))
    ];
    state.stock = offers.map((offer) => {
      const item = itemDefinition(offer);
      return { ...offer, price: Math.max(1, item.price + Math.floor(Math.random() * 5) - 2 + (offer.kind === "skill" ? (state.skills[offer.key] || 0) * 6 : 0)), bought: false };
    });
  }

  function itemDefinition(offer) {
    return (offer.kind === "dice" ? diceTypes : offer.kind === "ability" ? abilities : skills)[offer.key];
  }
  function relicCard(key) {
    const item = relics[key];
    const owned = state.relics.includes(key);
    return `<button class="shop-card relic-card${owned ? " purchased" : ""}" data-relic="${key}"${owned || state.gold < item.price ? " disabled" : ""}><span class="shop-card-icon">${item.icon}</span><span class="shop-card-kind">RELIC · STAGE ${item.unlock}+ · BUY ONCE</span><h3>${item.name}</h3><strong class="relic-factor">×${item.multiplier}</strong><p>${item.text}</p><span class="shop-price">${owned ? "PURCHASED" : `BUY · ◈ ${item.price}`}</span></button>`;
  }

  function buyRelic(key) {
    if (state.phase !== "shop" || !Object.hasOwn(relics, key)) return;
    const item = relics[key];
    if (!unlocked(item) || state.relics.includes(key) || state.gold < item.price) {
      notify("That relic is unavailable. Check its stage, your gold, and whether you already own it.");
      return;
    }
    state.gold -= item.price;
    state.relics.push(key);
    log(`${item.name} purchased. ${diceTypes[item.type].name} rolls now have a ×${relicMultiplier(item.type)} combined relic multiplier.`);
    playSound("heal");
    render();
    renderShop();
    $("leave-shop").focus({ preventScroll: true });
  }

  function offerUnavailable(offer) {
    return !unlocked(itemDefinition(offer)) || (offer.kind === "skill" && offer.bought) || (offer.kind === "dice" && actor().collection.length >= MAX_DICE) ||
      (offer.kind === "ability" && actor().abilities.includes(offer.key)) ||
      (offer.kind === "skill" && (state.skills[offer.key] || 0) >= skillLimit(offer.key));
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
    $("shop-eyebrow").textContent = `STAGE ${stageFor(state.encounter)} / ${STAGE_COUNT} · ROUND ${localRound(state.encounter) + 1} / ${STAGE_LENGTH} · SHOP ONLY`;
    const stage = stageFor(state.encounter);
    $("shop-description").textContent = `A safe haven in ${worldName()}. Core upgrades now reach level ${stage * 3}. ${stage >= 2 ? `${["", "", "Sapphire", "Sunstone", "Mythril", "Celestial"][stage]} dice and new stage abilities are available. ` : "More upgrades, abilities, and materials unlock in later stages. "}Sell old dice to make room; your purchases carry forward.`;
    if (stage >= 3) $("shop-description").textContent += " Relics multiply dice rolls: ×2, ×4, and ×8 stack to ×64 when all three are owned.";
  }

  function renderShop() {
    $("shop-purse").innerHTML = `◈ <b>${state.gold}</b><small>GOLD TO SPEND</small>`;
    const levels = Object.values(state.skills).reduce((a, b) => a + b, 0);
    $("shop-status").textContent = `♡ ${actor().hp} / ${actor().maxHp} HP · ${actor().collection.length} / ${MAX_DICE} dice · ${actor().abilities.length} ${actor().abilities.length === 1 ? "ability" : "abilities"} · ${levels} skill ${levels === 1 ? "level" : "levels"}`;
    $("shop-tabs").querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === state.shopFilter));
      if (button.dataset.filter === "relic") button.disabled = stageFor(state.encounter) < 3;
    });
    if (state.shopFilter === "owned") {
      renderOwnedDice();
    } else if (state.shopFilter === "relic") {
      const available = Object.keys(relics).filter((key) => unlocked(relics[key]));
      $("shop-stock").innerHTML = available.length ? available.map(relicCard).join("") : '<p class="empty-stock">Relics unlock in stage 3. Preview every relic in the Collection.</p>';
    } else {
      const visible = state.stock.map((offer, index) => ({ offer, index })).filter(({ offer }) => state.shopFilter === "all" || offer.kind === state.shopFilter);
      $("shop-stock").innerHTML = visible.length ? visible.map(({ offer, index }) => {
        const item = itemDefinition(offer);
        const unavailable = offerUnavailable(offer);
        if (offer.kind === "dice") {
          const owned = actor().collection.filter((die) => die.type === offer.key).length;
          const variants = Object.entries(diceTiers).filter(([, tier]) => unlocked(tier)).map(([key, tier]) => {
            const price = offerPrice(offer, key);
            const count = actor().collection.filter((die) => die.type === offer.key && die.tier === key).length;
            const disabled = unavailable || state.gold < price;
            return `<button class="variant-buy variant-${key}" data-offer="${index}" data-tier="${key}" aria-label="Buy ${tier.name} ${item.name} for ${price} gold. Owned ${count}.${unavailable ? " Collection full." : state.gold < price ? " Not enough gold." : ""}"${disabled ? " disabled" : ""}><span class="variant-icon" aria-hidden="true">${tier.icon}</span><span class="variant-copy"><strong>${tier.name}</strong><small>${tier.bonus ? `+${tier.bonus} power` : "Standard power"} · Owned ${count}</small></span><span class="variant-price">${unavailable ? "FULL" : `◈ ${price}`}</span></button>`;
          });
          const rare = `<details class="rare-materials" data-rare-offer="${index}"${state.expandedOffers.has(index) ? " open" : ""}><summary>Rare materials <small>${Object.values(diceTiers).filter((tier, i) => i >= 3 && unlocked(tier)).map((tier) => tier.name).join(" · ")}</small></summary><div class="variant-options">${variants.slice(3).join("")}</div></details>`;
          return `<div class="shop-card dice-shop-card type-${offer.key}"><span class="shop-card-icon">${item.icon}</span><span class="shop-card-kind">SPECIALIZED DIE · OWNED ${owned}</span><h3>${item.name}</h3><p>${item.text}</p><div class="variant-options">${variants.slice(0, 3).join("")}</div>${rare}<span class="repeat-purchase-note">BUY MULTIPLE · EACH COPY ROLLS SEPARATELY</span></div>`;
        }
        const owned = offer.kind === "skill" ? state.skills[offer.key] || 0 : actor().abilities.includes(offer.key) ? 1 : 0;
        const purchased = offer.kind === "skill" && offer.bought;
        const status = purchased ? "PURCHASED" : unavailable ? "MAXED / OWNED" : state.gold < offer.price ? "NEED MORE GOLD" : `BUY · ◈ ${offer.price}`;
        return `<button class="shop-card${purchased ? " purchased" : ""}" data-offer="${index}"${unavailable || state.gold < offer.price ? " disabled" : ""}><span class="shop-card-icon">${item.icon}</span><span class="shop-card-kind">${offer.kind === "ability" ? "ONCE / BATTLE" : `PERMANENT UPGRADE · LEVEL ${owned} / ${skillLimit(offer.key)}`}${item.unlock ? ` · STAGE ${item.unlock}+` : ""}</span><h3>${item.name}</h3><p>${item.text}</p><span class="shop-price">${status}${!unavailable && state.gold < offer.price ? ` · ◈ ${offer.price}` : ""}</span></button>`;
      }).join("") : '<p class="empty-stock">No unowned wares in this category today. Refresh stock or browse another tab. New abilities and higher upgrade limits unlock in the next stage.</p>';
      if (state.shopFilter === "all") $("shop-stock").insertAdjacentHTML("afterbegin", Object.keys(relics).filter((key) => unlocked(relics[key]) && !state.relics.includes(key)).slice(0, 2).map(relicCard).join(""));
    }
    $("refresh-shop").disabled = state.refreshed || state.gold < 5;
    $("refresh-shop").textContent = state.refreshed ? "↻ Stock refreshed" : "↻ New stock · 5 gold";
    $("shop-rest").disabled = state.gold < 8 || actor().hp === actor().maxHp;
    $("shop-rest").textContent = `✚ Restore ${12 + (state.skills.hospitality || 0) * 4} HP · 8 gold`;
    saveProgress();
  }

  function canNavigate() {
    return stablePhases.includes(state.phase) && !practice && (state.phase !== "victory" || !$("reward-continue").disabled);
  }

  function renderNavigation() {
    document.body.dataset.screen = screen;
    $("menu-screen").hidden = screen !== "menu";
    $("collection-screen").hidden = screen !== "collection";
    const overlayOpen = [...document.querySelectorAll(".overlay")].some((element) => !element.hidden);
    document.querySelector(".app").inert = screen !== "game" || overlayOpen || Boolean(practice) || ["won", "lost", "victory", "shop"].includes(state.phase);
    $("menu-screen").inert = !$("reset-overlay").hidden;
    $("collection-screen").inert = !$("reset-overlay").hidden;
    $("game-navigation").hidden = screen !== "game" || overlayOpen;
    $("game-navigation").querySelectorAll("button").forEach((button) => { button.disabled = !canNavigate(); });
    if (screen === "menu") {
      $("menu-progress").textContent = `${state.completed} / 155 rounds complete · Stage ${stageFor(state.encounter)}, round ${localRound(state.encounter) + 1} · ${state.gold} gold`;
      $("menu-play").textContent = state.phase === "shop" ? "Return to market ↗" : ["won", "lost"].includes(state.phase) ? "View last adventure ↗" : state.completed || actor().dice.length || state.turn > 1 ? "Continue adventure ↗" : "Begin adventure ↗";
      $("menu-new").disabled = state.phase === "victory";
      if (!$("menu-hero").childElementCount) $("menu-hero").innerHTML = namespaceArtwork(heroArtwork(), "menu");
      const artKey = `${stageFor(state.encounter)}-${worldFor(state.encounter)}`;
      if ($("menu-scene").dataset.artKey !== artKey) {
        $("menu-scene").dataset.artKey = artKey;
        $("menu-scene").innerHTML = namespaceArtwork(sceneArtwork(worldFor(state.encounter), stageFor(state.encounter)), "menu-scene");
      }
    }
  }

  function showScreen(next) {
    if (!canNavigate()) return;
    if (screen === "game") gameScroll = window.scrollY;
    else if (screen === "collection") collectionScroll = window.scrollY;
    screen = next;
    renderNavigation();
    if (next === "collection") renderCollection();
    window.scrollTo(0, next === "game" ? gameScroll : next === "collection" ? collectionScroll : 0);
    if (next === "menu") $("menu-play").focus({ preventScroll: true });
    else if (next === "collection") $("collection-back").focus({ preventScroll: true });
    else {
      const overlay = ["reset-overlay", "sell-overlay", "reward-overlay", "tutorial-overlay", "help-overlay", "shop-overlay", "end-overlay"].map($).find((element) => !element.hidden);
      (overlay?.querySelector("button:enabled") || $("main-button")).focus({ preventScroll: true });
      if (!tutorialSeen && ["ready", "rolled"].includes(state.phase)) openTutorial();
    }
    saveProgress();
  }

  function renderCollection() {
    const member = actor();
    const stage = stageFor(state.encounter);
    const ownedDice = (key) => member.collection.filter((die) => die.type === key).length;
    const seenEnemies = new Set(state.encounters.slice(0, state.encounter + 1).flatMap((round) => round.group || []).map((enemy) => enemy.name.replace(/^Frenzied /, "")));
    let items;
    if (collectionTab === "dice") items = Object.entries(diceTypes).map(([key, item], rarity) => ({
      name: item.name, icon: item.icon, text: item.text, owned: ownedDice(key) > 0, rarity,
      note: `${ownedDice(key)} owned · Relic multiplier ×${relicMultiplier(key)}`, unlock: 1
    }));
    else if (collectionTab === "materials") items = Object.entries(diceTiers).map(([key, item], rarity) => ({
      name: `${item.name} material`, icon: item.icon, text: `Adds +${item.bonus} to every rolled face before relic multipliers and dice effects. Natural criticals and double strikes still use the original face.`,
      owned: member.collection.some((die) => die.tier === key), rarity, note: `+${item.bonus} power · ${item.priceMultiplier}× base purchase price`, unlock: item.unlock || 1
    }));
    else if (collectionTab === "abilities") items = Object.entries(abilities).map(([key, item], rarity) => ({
      ...item, owned: member.abilities.includes(key), rarity: (item.unlock || 1) * 100 + rarity, note: "Click to cast · Once per battle · Does not spend your turn"
    }));
    else if (collectionTab === "upgrades") items = Object.entries(skills).map(([key, item], rarity) => ({
      ...item, owned: Boolean(state.skills[key]), rarity: (item.unlock || 1) * 100 + rarity,
      note: `Level ${state.skills[key] || 0} / ${skillLimit(key)} available now · ${item.max} maximum${item.perStage ? " · Limit rises each stage" : ""}`
    }));
    else if (collectionTab === "relics") items = Object.entries(relics).map(([key, item], rarity) => ({
      ...item, owned: state.relics.includes(key), rarity: item.unlock * 100 + rarity,
      note: `×${item.multiplier} bonus · Combined ${diceTypes[item.type].name} multiplier ×${relicMultiplier(item.type)} · ${item.price} gold`
    }));
    else items = monsters.filter((enemy) => enemy.homeStage || !enemy.flying).map((enemy, rarity) => ({
      name: enemy.name, icon: enemy.boss ? "♛" : enemy.flying ? "➶" : "⚔", owned: seenEnemies.has(enemy.name), rarity: (enemy.homeStage || 1) * 1000 + enemy.zone * 100 + rarity,
      text: `${enemy.flying ? "Flying: only bow attacks can damage this enemy. " : "Grounded: melee and bow attacks both work. "}Moves: ${enemy.moves.map((move) => move[2]).join(", ")}.`,
      note: `Stage ${enemy.homeStage || 1} · World ${enemy.zone + 1}${enemy.final ? " · Stage guardian" : enemy.boss ? " · World guardian" : ""}`,
      unlock: enemy.homeStage || 1, artwork: namespaceArtwork(enemyArtwork(enemy), `collection-${rarity}`)
    }));
    items.sort((a, b) => Number(b.owned) - Number(a.owned) || a.rarity - b.rarity);
    $("collection-tabs").querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.collection === collectionTab)));
    const owned = items.filter((item) => item.owned).length;
    $("collection-count").textContent = `${owned} / ${items.length} ${collectionTab === "enemies" ? "encountered · Encountered" : "owned in this adventure · Owned"} first, then rarity`;
    $("collection-grid").innerHTML = items.map((item) => `<article class="collection-card${item.owned ? " owned-entry" : ""}${(item.unlock || 1) > stage ? " locked-entry" : ""}" data-owned="${item.owned}" data-rarity="${item.rarity}">${item.artwork ? `<div class="collection-portrait">${item.artwork}</div>` : `<span class="collection-icon">${item.icon}</span>`}<span class="shop-card-kind">${item.owned ? collectionTab === "enemies" ? "ENCOUNTERED" : "OWNED" : (item.unlock || 1) > stage ? `UNLOCKS IN STAGE ${item.unlock}` : collectionTab === "enemies" ? "UNDISCOVERED" : "NOT OWNED"}</span><h2>${item.name}</h2><p>${item.text}</p><small>${item.note}</small></article>`).join("");
  }

  function buyOffer(index, tier = "base") {
    const offer = state.stock[index];
    if (state.phase !== "shop" || !offer) return;
    if (offer.kind === "dice" && (!Object.hasOwn(diceTiers, tier) || !unlocked(diceTiers[tier]))) {
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
      skills[offer.key].apply?.();
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

  function abilityBlockReason(key) {
    const item = abilities[key];
    if (item.bow && state.weapon !== "bow") return "Switch to Bow to use this ability.";
    if ((item.rolled || item.effect === "reroll") && state.phase !== "rolled") return "Roll your dice first.";
    if (["damage", "poison"].includes(item.effect) && targetEnemy().flying && !item.bow) return "Only bow attacks can damage this flying enemy.";
    if (["heal", "fullheal"].includes(item.effect) && actor().hp === actor().maxHp) return "Your health is already full.";
    return "";
  }

  function renderAbilities() {
    $("ability-bar").innerHTML = actor().abilities.length ? actor().abilities.map((key) => {
      const used = actor().usedAbilities.has(key);
      const reason = abilityBlockReason(key);
      const disabled = used || reason || !["ready", "rolled"].includes(state.phase);
      return `<button class="ability-button" data-ability="${key}" title="${reason || abilities[key].text}"${disabled ? " disabled" : ""}><span>${abilities[key].icon}</span><strong>${abilities[key].name}</strong><small>${used ? "USED" : reason ? abilities[key].bow && state.weapon !== "bow" ? "BOW ONLY" : (abilities[key].rolled || abilities[key].effect === "reroll") && state.phase !== "rolled" ? "ROLL FIRST" : "UNAVAILABLE" : "READY"}</small></button>`;
    }).join("") : '<p class="empty-abilities">Buy abilities in shop-only rounds: 5, 10, 15, 20, 25, and 30. Each refreshes every battle.</p>';
  }

  async function castAbility(key) {
    if (practice || !actor().abilities.includes(key) || actor().usedAbilities.has(key) || !["ready", "rolled"].includes(state.phase)) return;
    const reason = abilityBlockReason(key);
    if (reason) { notify(reason); return; }
    const item = abilities[key];
    const member = actor();
    const enemies = item.all ? state.enemies.filter((enemy) => enemy.hp) : [targetEnemy()];
    const rolledPower = member.dice.filter((die) => diceTypes[die.type].offensive).reduce((sum, die) => sum + effectiveRoll(die), 0);
    const run = state.id;
    const previousPhase = state.phase;
    actor().usedAbilities.add(key);
    state.phase = "resolving";
    if (item.effect === "damage") {
      const power = item.rolled ? Math.ceil(rolledPower * item.multiplier) : item.amount;
      enemies.forEach((enemy) => {
        const damage = Math.min(power, enemy.hp);
        enemy.hp -= damage;
        state.stats.damage += damage;
        log(`${item.name} deals ${damage} piercing damage to ${enemy.name}.`);
        if (enemy === targetEnemy()) floatNumber("enemy", `−${damage}`, "critical", item.name.toUpperCase());
      });
      animate("hero-art", "strike"); animate("enemy-art", "hit"); playSound("hit");
    } else if (["heal", "fullheal", "sanctuary"].includes(item.effect)) {
      const power = item.effect === "fullheal" ? member.maxHp : item.effect === "sanctuary" ? 20 + state.healing : item.amount + (item.unlock ? state.healing * 2 : 0);
      const healing = Math.min(power, member.maxHp - member.hp);
      member.hp += healing;
      if (item.effect === "sanctuary") member.shield += 20 + state.ward;
      floatNumber("hero", `+${healing}`, "heal"); playSound("heal");
      log(`${item.name} restores ${healing} health${item.effect === "sanctuary" ? ` and adds ${20 + state.ward} shield` : ""}.`);
    } else if (item.effect === "shield") {
      const shield = item.amount + state.ward * 2;
      member.shield += shield;
      floatNumber("hero", `+${shield}`, "block", "SHIELD"); playSound("block");
      log(`${item.name} adds ${shield} shield; ${member.shield} is stored.`);
    } else if (item.effect === "freeze") {
      enemies.forEach((enemy) => { enemy.frozen = true; });
      floatNumber("enemy", "FROZEN", "block"); playSound("block");
      log(`${item.name} freezes ${enemies.length} ${enemies.length === 1 ? "enemy" : "enemies"} for their next action.`);
    } else if (item.effect === "poison") {
      const poison = Math.ceil(rolledPower / 4);
      targetEnemy().poison = Math.min(poisonLimit(), targetEnemy().poison + poison);
      floatNumber("enemy", `+${poison}`, "heal", "POISON"); playSound("hit");
      log(`${item.name} adds up to ${poison} poison; ${targetEnemy().poison} is stored.`);
    } else if (item.effect === "shatter") {
      const shield = targetEnemy().shield;
      targetEnemy().shield = 0;
      floatNumber("enemy", `−${shield}`, "critical", "ARMOR"); playSound("hit");
      log(`${item.name} destroys ${shield} enemy shield.`);
    } else if (item.effect === "reroll") {
      member.rerolls = Math.min(member.rerolls + 2, 3 + state.extraRerolls);
      floatNumber("hero", "+2", "block", "REROLLS"); playSound("roll");
      log(`${item.name} grants two extra rerolls for this turn.`);
    }
    render();
    await wait(600);
    if (state.id !== run) return;
    const defeated = state.enemies.findIndex((enemy) => !enemy.hp && !enemy.rewarded);
    if (defeated >= 0) { await victory(defeated, `ability-${previousPhase}`); return; }
    state.phase = previousPhase;
    render();
    if ($("help-overlay").hidden) $("main-button").focus({ preventScroll: true });
  }

  function showEnding(won) {
    closeHelp(false);
    $("end-emblem").textContent = won ? "♛" : "◇";
    $("end-eyebrow").textContent = won ? "THE DARKNESS HAS FALLEN" : "THE END OF AN EXPEDITION";
    $("end-title").textContent = won ? "You defied the darkness." : "Not all luck lasts.";
    $("end-description").textContent = won ? `All ${RUN_LENGTH} rounds complete: five stages, thirty worlds, thirty markets, ${BATTLE_COUNT} battles, and ${state.defeated} monsters defeated. Your dice carried you through the whole adventure.` : `${targetEnemy().name} defeated you in stage ${stageFor(state.encounter)}, round ${localRound(state.encounter) + 1}. You completed ${state.completed} of ${RUN_LENGTH} total rounds. A new path awaits.`;
    $("run-stats").innerHTML = [
      [state.completed, "ROUNDS COMPLETE"], [state.defeated, "MONSTERS SLAIN"], [state.stats.earned, "GOLD EARNED"]
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
    { title: "Claim the whole round's spoils.", text: "The chest opens only when every enemy in the round is defeated. Until then, kill gold waits in the chest. Collect 24 practice gold and recover 8 health. Shields clear before the next encounter.", action: "collect", button: "Collect practice rewards ↗" },
    { title: "Build a stronger collection.", text: "Every fifth round is a shop, not a fight. Spend 14 of your practice gold on a Guard die. In real runs you start with one Attack die and buy the others.", action: "buy", button: "Buy the Guard die above" },
    { title: "Choose the right enemy.", text: "Later fights have up to three enemies. Click the weakened Practice Slime instead of the armored wolf. Killing one enemy doesn't stop the round: its gold is banked until the whole group is gone.", action: "target", button: "Choose the weakened slime" },
    { title: "Meet your stage 2 bow.", text: "Flying enemies appear in stage 2, when you receive a free bow. Melee and Ember Bolt cannot hurt them. Choose the practice bow: your offensive dice power its arrows, with the same rolled damage. You keep dice throughout all five stages.", action: "bow", button: "Choose the practice bow above" },
    { title: "Five stages await.", text: "155 rounds, thirty worlds, and thirty markets. Your dice and upgrades carry between stages. Enemy turns and shields resolve automatically. Sell old dice in the market, target flying foes with your bow, and claim one chest per completed battle.", action: "done", button: "Return to my run ↗" }
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
    $("practice-arena").hidden = practice.step >= 8;
    $("practice-arena").classList.toggle("practice-motion", practice.busy && ["fight", "finish"].includes(practice.action));
    $("practice-dice").hidden = practice.step >= 8 && practice.step !== 9;
    const dice = practice.dice.length ? practice.dice : ["attack", "guard", "mend"].map((type) => ({ type, tier: "base", value: 6 }));
    const rolling = practice.busy && ["roll", "reroll", "next", "finish"].includes(practice.action);
    $("practice-dice").innerHTML = dice.map((die, i) => `<button class="die type-${die.type} tier-base${rolling ? " rolling" : ""}${!practice.dice.length ? " unrolled" : ""}${practice.step === 1 && i === 0 ? " tutorial-target" : ""}${practice.step === 2 && i === 0 ? " selected" : ""}" data-practice-die="${i}" aria-label="${diceTypes[die.type].name}${practice.dice.length ? `: rolled ${die.value}` : ": not rolled"}"${practice.step !== 1 || i !== 0 || practice.busy ? " disabled" : ""}>${dieMarkup(die.value)}<span class="die-assignment" aria-hidden="true">${diceTypes[die.type].icon}</span><span class="die-type-label" aria-hidden="true">${diceTypes[die.type].label}</span></button>`).join("");
    $("practice-shop").hidden = practice.step !== 8;
    $("practice-targets").hidden = practice.step !== 9;
    $("practice-weapons").hidden = practice.step !== 10;
    $("practice-purse").textContent = `◈ ${practice.gold} practice gold · ${practice.owned} / ${MAX_DICE} dice`;
    $("practice-buy").disabled = practice.step !== 8 || practice.busy;
    $("practice-buy").classList.toggle("tutorial-target", practice.step === 8);
    $("practice-buy-label").textContent = practice.step === 9 ? "PURCHASED · 14 GOLD" : "BUY GUARD · 14 GOLD";
    $("tutorial-action").textContent = practice.busy ? "Practicing…" : step.button;
    $("tutorial-action").disabled = practice.busy || ["select", "buy", "target", "bow"].includes(step.action);
    const target = practice.busy ? $("tutorial-overlay").querySelector(".modal") : practice.step === 1 ? $("practice-dice").querySelector("button") : practice.step === 8 ? $("practice-buy") : practice.step === 9 ? $("practice-targets").querySelector("button:enabled") : practice.step === 10 ? $("practice-bow") : $("tutorial-action");
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
    else if (action === "target") session.enemyHp = 4;
    else if (action === "bow") session.weapon = "bow";
    session.busy = false;
    session.action = null;
    session.step++;
  }

  function openHelp() {
    if (!$("shop-overlay").hidden || !$("end-overlay").hidden || !$("reset-overlay").hidden || !$("sell-overlay").hidden || !$("reward-overlay").hidden || practice) return;
    helpReturnFocus = document.activeElement;
    $("help-overlay").hidden = false;
    renderNavigation();
    $("help-overlay").querySelector(".modal").scrollTop = 0;
    $("close-help").focus({ preventScroll: true });
    saveProgress();
  }

  function closeHelp(restoreFocus = true) {
    if ($("help-overlay").hidden) return;
    $("help-overlay").hidden = true;
    renderNavigation();
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
    renderNavigation();
    $("cancel-reset").focus({ preventScroll: true });
    saveProgress();
  }

  function cancelReset() {
    $("reset-overlay").hidden = true;
    renderNavigation();
    if (resetReturnFocus?.isConnected && !resetReturnFocus.disabled && resetReturnFocus.getClientRects().length) resetReturnFocus.focus({ preventScroll: true });
    else (state.phase === "shop" ? $("leave-shop") : $("reset-button")).focus({ preventScroll: true });
    saveProgress();
  }

  $("main-button").addEventListener("click", () => {
    if (state.phase === "ready") void rollDice();
    else if (state.phase === "rolled") void resolveTurn();
  });
  $("enemy-roster").addEventListener("click", (event) => {
    const button = event.target.closest("[data-enemy]");
    if (button) selectEnemy(Number(button.dataset.enemy));
  });
  $("weapon-controls").addEventListener("click", (event) => {
    const button = event.target.closest("[data-weapon]");
    if (button) selectWeapon(button.dataset.weapon);
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
    const relic = event.target.closest("[data-relic]");
    if (relic) { buyRelic(relic.dataset.relic); return; }
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
    const healing = Math.min(12 + (state.skills.hospitality || 0) * 4, actor().maxHp - actor().hp);
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
    showScreen("game");
  });
  $("restart-button").addEventListener("click", () => {
    startRun(true);
    showScreen("game");
  });
  $("menu-play").addEventListener("click", () => showScreen("game"));
  $("menu-new").addEventListener("click", openReset);
  $("menu-collection").addEventListener("click", () => showScreen("collection"));
  $("collection-back").addEventListener("click", () => showScreen("menu"));
  $("collection-resume").addEventListener("click", () => showScreen("game"));
  ["nav-menu", "shop-menu", "reward-menu", "end-menu"].forEach((id) => $(id).addEventListener("click", () => showScreen("menu")));
  $("nav-collection").addEventListener("click", () => showScreen("collection"));
  document.querySelector(".brand").addEventListener("click", (event) => { event.preventDefault(); showScreen("menu"); });
  $("collection-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-collection]");
    if (!button) return;
    collectionTab = button.dataset.collection;
    collectionScroll = 0;
    renderCollection();
    saveProgress();
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
  $("practice-targets").addEventListener("click", (event) => {
    if (event.target.closest("[data-practice-target]")) void practiceAction("target");
  });
  $("practice-bow").addEventListener("click", () => { void practiceAction("bow"); });
  $("close-help").addEventListener("click", () => closeHelp());
  $("help-play-button").addEventListener("click", () => closeHelp());
  $("help-overlay").addEventListener("click", (event) => {
    if (event.target === $("help-overlay")) closeHelp();
  });
  document.addEventListener("keydown", (event) => {
    const overlay = ["reset-overlay", "sell-overlay", "reward-overlay", "tutorial-overlay", "help-overlay", "shop-overlay", "end-overlay"].map($).find((element) => !element.hidden && element.getClientRects().length);
    if (overlay) {
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
    if (screen !== "game" || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
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
    if (document.hidden) saveProgress(true);
    else syncProgress();
  });
  window.addEventListener("pagehide", () => saveProgress(true));
  window.addEventListener("pageshow", (event) => { if (event.persisted) syncProgress(); });
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
  }
})();
