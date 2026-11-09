// What the fake game currently is: the character, its spells and action bars, the auras on it, the
// party, the bags. A test fills in the parts it needs; the install-*.ts files answer the game's API
// from this state, so changing it in the middle of a test changes what the addon sees.

export interface CharacterClass {
    name: string;
    token: string;
    id: number;
}

export interface SpellDefinition {
    id: number;
    name: string;
    rank: number;
    icon: number;
    /** Milliseconds; instant when not given. */
    castTimeMs?: number;
    /** Yards; 0 is a melee spell. Not given: no range (a self-cast). */
    maxRange?: number;
    /** Cast on enemies. */
    isHarmful?: boolean;
    /** Cast on friends. */
    isHelpful?: boolean;
    /** The spell's base cooldown in seconds. */
    cooldownSeconds?: number;
    /** The spell's description text (the heal size is read from it). */
    description?: string;
}

/** A buff on a character. `expirationTime` is on the game's clock (see World.makeAura). */
export interface FakeAura {
    name: string;
    spellId: number;
    expirationTime: number;
    sourceUnit?: string;
    /** "Magic", "Curse", "Disease", "Poison". */
    dispelName?: string;
    isStealable?: boolean;
    stacks?: number;
}

/** The target of the player. */
export interface FakeTarget {
    name: string;
    level: number;
    /** An enemy (hostile); otherwise a friend. */
    isEnemy: boolean;
    isDead?: boolean;
    /** Health in percent. */
    health: number;
    /** How far it is. */
    yards: number;
    /** "Undead", "Mechanical"...; hidden when not given (as the client does for NPCs). */
    creatureType?: string;
    classification?: string;
    /** Its debuffs; the player's own have sourceUnit "player". */
    debuffs: FakeAura[];
    buffs: FakeAura[];
    /** The spell it is casting now. */
    castingSpell?: string;
    isCastShielded?: boolean;
    /** It attacks the player (the player has aggro). */
    isAttackingPlayer?: boolean;
}

export interface FakePartyMember {
    name: string;
    classToken: string;
    power: number;
    auras: FakeAura[];
    isDead?: boolean;
    isOutOfRange?: boolean;
}

export interface FakeEnchant {
    enchantID: number;
    remainingTimeMs: number;
}

/** The numbers the game uses for the kinds of power. */
export const POWER = { Mana: 0, Rage: 1, Energy: 3 };

export interface ClientState {
    character: CharacterClass;
    /** Every spell that exists in the test, learned or not. */
    spells: { [spellId: number]: SpellDefinition | undefined };
    knownSpells: { [spellId: number]: true | undefined };
    /** Items on the action buttons (slot -> item ID), as a rogue keeps the poisons. */
    barItems: { [slot: number]: number | undefined };
    /** Action slot (1-12 for the main bar) -> the spell on it. */
    bars: { [slot: number]: number | undefined };
    /** The macros on the bars, by action slot: the text, and the spell the game says the macro casts. */
    barMacros: { [slot: number]: { body: string; spellId?: number; name?: string; isShowingItem?: boolean } | undefined };
    /** A spell asked for by name answers with its first rank, not its highest. */
    isFirstRankByName: boolean;
    /** The buffs on the player, in the order the game lists them. */
    auras: FakeAura[];
    isInCombat: boolean;
    /** The other addons that are loaded, by name. */
    loadedAddons: { [name: string]: boolean | undefined };
    /** The client's options that were set, by name. */
    cvars: { [name: string]: boolean | undefined };
    /** The buffs the Cooldown Manager has an icon for. */
    trackedBuffs: { spellId: number; isActive: boolean }[];
    /** What Blizzard offers in the Cooldown Manager's Tracked Buffs. */
    buffCatalog: { spellId: number; isHiddenByDefault: boolean }[];
    /** The saved layouts of the Cooldown Manager, as the addon reads them; undefined: none yet. */
    layoutData: { [field: number]: unknown } | undefined;
    /** Blizzard's layout of the Cooldown Manager for the character's spec. */
    viewerLayout: number;
    /** Have the saved layouts of the Cooldown Manager loaded? */
    isViewerDataLoaded: boolean;
    /** How often the layouts of the Cooldown Manager were saved. */
    viewerSaves: number;
    /** The last opacity given to the windows of the Cooldown Manager. */
    viewerAlpha: number | undefined;
    /** In combat the game hides the auras: the list comes back empty. */
    areAurasHidden: boolean;
    /** In combat the game hides the spell cooldowns: no answer. */
    areCooldownsHidden: boolean;
    /** The spells of the stance bar (forms, a paladin's auras), the first stance first. */
    /** The mana a spell costs now, by spell ID; not given: the game names no cost. */
    spellCosts: { [spellId: number]: number | undefined };
    isAfk: boolean;
    stances: number[];
    /** The spell of the stance the player is in. */
    activeStance: number | undefined;
    /** The spell on the class button of the gamepad bars (the paladin's aura, picked from a flyout). */
    gamepadClassSpell: number | undefined;
    /** What the game loaded from the account's file (## SavedVariables); undefined: the first run. */
    accountSaved: Record<string, unknown> | undefined;
    /** Bartender4 is loaded: its first two bars (BT4Button1 to 24, on the action slots 1 to 24). */
    hasBartender: boolean;
    /** Dominos is loaded: its bars 2 and 3 (DominosActionButton13 to 24, MultiBarRightActionButton1 to 12, slots 13 to 36). */
    hasDominos: boolean;
    /**
     * EllesmereUI is loaded: its Action Bar 2 (EABButton61 to 72, slots 61 to 72) and its bar 9 (EABButton13 to 24, slots
     * 13 to 24), made one second after the login, as EllesmereUI makes them after the addon's first map of the bars.
     */
    hasEllesmere: boolean;
    /** ElvUI is loaded: its bar 6 (ElvUI_Bar6Button1 to 12, slots 61 to 72: Action Bar 2) and its bar 2 (slots 13 to 24, of no Blizzard bar). */
    hasElvUI: boolean;
    /** DaylightUI is loaded: its bar 2 (DaylightUIBar2Button1 to 12, on Action Bar 2's slots 61 to 72). */
    hasDaylight: boolean;
    /** The points spent in each of the three talent trees (a paladin's Holy, Protection, Retribution). */
    talentPoints: number[];
    isResting: boolean;
    /** The sound files the game finds. */
    soundFiles: string[];
    /** The sound files the addon played. */
    playedSoundFiles: string[];
    /** Inventory slot (16 main hand, 17 off hand) -> the temporary enchant on it. */
    enchants: { [slot: number]: FakeEnchant | undefined };
    /** The client gives no answer about weapon enchants (reads fail), as it sometimes does. */
    areEnchantReadsBroken: boolean;
    equippedItems: { [slot: number]: number | undefined };
    /** Spells that cannot be cast right now (no rage, no mana). */
    unusableSpells: { [spellId: number]: true | undefined };
    /** party1, party2... in this order. */
    party: FakePartyMember[];
    isInRaid: boolean;
    bags: { [itemId: number]: number | undefined };
    /** The reagent named in a spell's tooltip. */
    reagentTexts: { [spellId: number]: string | undefined };
    /** Item IDs by name, for an item the addon counts by its name. */
    itemIds: { [name: string]: number | undefined };
    /** The spell an item casts when it is used (an elixir's use spell), by item ID. */
    itemUseSpells: { [itemId: number]: number | undefined };
    itemNames: { [itemId: number]: string | undefined };
    level: number;
    /** The race: its ID (4 Night Elf) and the client's race file name. */
    race: { id: number; file: string };
    target: FakeTarget | undefined;
    /** The player's health in percent. */
    health: number;
    /** In combat the game hides the player's health (and mana): the reads come back empty. */
    isHealthHidden: boolean;
    mana: { current: number; max: number };
    energy: number;
    comboPoints: number;
    /** Spell ID -> when its cooldown started (game clock) and how long it lasts. */
    cooldowns: { [spellId: number]: { start: number; duration: number } | undefined };
    /** The debuffs on the player. */
    playerDebuffs: FakeAura[];
    pet: { isDead?: boolean } | undefined;
    /** The spell the player is casting now. */
    castingSpell: string | undefined;
    /** Totem slot (fire 1, earth 2, water 3, air 4) -> the totem standing in it. */
    totems: { [slot: number]: { name: string; start: number; duration: number } | undefined };
    /** How many enemies around fight the player (nameplate1, nameplate2...). */
    nameplates: number;
}

/** The member of the test's party a unit stands for: party1..4, or raid1..n in a raid (the player is none of them). */
export function findPartyMember(state: ClientState, unit: string | undefined): FakePartyMember | undefined {
    const [digit] = string.match(unit ?? "", "^party(%d)$");
    if (digit !== undefined) return state.party[tonumber(digit)! - 1];
    const [index] = string.match(unit ?? "", "^raid(%d+)$");
    return index !== undefined && state.isInRaid ? state.party[tonumber(index)! - 1] : undefined;
}

export function createClientState(): ClientState {
    return {
        character: { name: "Priest", token: "PRIEST", id: 5 },
        spells: {},
        knownSpells: {},
        barItems: {},
        bars: {},
        barMacros: {},
        isFirstRankByName: false,
        auras: [],
        isInCombat: false,
        loadedAddons: {},
        cvars: {},
        trackedBuffs: [],
        buffCatalog: [],
        layoutData: undefined,
        viewerLayout: 1,
        isViewerDataLoaded: true,
        viewerSaves: 0,
        viewerAlpha: undefined,
        areAurasHidden: false,
        areCooldownsHidden: false,
        spellCosts: {},
        isAfk: false,
        stances: [],
        activeStance: undefined,
        gamepadClassSpell: undefined,
        accountSaved: undefined,
        hasBartender: false,
        hasDominos: false,
        hasEllesmere: false,
        hasElvUI: false,
        hasDaylight: false,
        talentPoints: [0, 0, 0],
        isResting: false,
        soundFiles: [],
        playedSoundFiles: [],
        enchants: {},
        areEnchantReadsBroken: false,
        equippedItems: {},
        unusableSpells: {},
        party: [],
        isInRaid: false,
        bags: {},
        reagentTexts: {},
        itemIds: {},
        itemUseSpells: {},
        itemNames: {},
        level: 60,
        race: { id: 1, file: "Human" },
        target: undefined,
        health: 100,
        isHealthHidden: false,
        mana: { current: 1000, max: 1000 },
        energy: 100,
        comboPoints: 0,
        cooldowns: {},
        playerDebuffs: [],
        pet: undefined,
        castingSpell: undefined,
        totems: {},
        nameplates: 0,
    };
}

export function playAs(state: ClientState, character: CharacterClass): void {
    state.character = character;
}

/** The spell exists and the character has learned it. */
export function learnSpell(state: ClientState, spell: SpellDefinition): void {
    state.spells[spell.id] = spell;
    state.knownSpells[spell.id] = true;
}

/** An enemy (a level 60 humanoid at 25 yards, full health, attacking no one) with what the test changes. */
export function targetEnemy(state: ClientState, changes: Partial<FakeTarget> = {}): FakeTarget {
    state.target = { name: "Defias Thug", level: 60, isEnemy: true, health: 100, yards: 25, debuffs: [], buffs: [], ...changes };
    return state.target;
}
