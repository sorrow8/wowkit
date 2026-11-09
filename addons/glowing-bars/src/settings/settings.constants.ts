import { isSoundKey } from "@wowkit/ui";
import { tryCall, type GlowAnimation } from "@wowkit/wow";
import { Warrior } from "@wowkit/wow-data";
import { convertOldSettings } from "./settings-migration";
import type { AddonSettings, ReminderType, AddableType, Style, StyleOverride, When, MessageTextChoice } from "./settings.interface";

/** The global the TOC saves per character (## SavedVariablesPerCharacter). */
export const SAVED_VARIABLES_NAME = "GlowingBarsCharDB";
/** The account's saved data (## SavedVariables): what it has seen of the releases. */
export const ACCOUNT_VARIABLES_NAME = "GlowingBarsDB";

export function createDefaultSettings(): AddonSettings {
    return {
        isDisabled: false,
        shouldShowGreeting: true,
        shouldStayQuietInTowns: false,
        isAfkRainbowOn: false,
        isWelcomeDone: false,
        shouldShowCooldownManager: false,
        roundAnimation: "breathing",
        isMissingBuffEnabled: true,
        isWeaponBuffEnabled: true,
        messageSize: 100,
        messageTop: 180,
        isMessageZoomInOn: true,
        isMessageZoomOutOn: true,
        isMessageFadePulseOn: false,
        isMessageSizePulseOn: false,
        messagePulseSpeed: 100,
        isOneLinePerType: false,
        showPartyBuffs: true,
        showRaidBuffs: true,
        partyGroupFrom: 2,
        raidGroupFrom: 1,
        isOldRankEnabled: true,
        isLowReagentEnabled: true,
        isReadyCooldownEnabled: true,
        showCooldownsAtFightStart: false,
        reagentBelow: 10,
        stockBelow: 20,
        isLowStockEnabled: true,
        belowLimits: {},
        isProcEnabled: true,
        isMissingSealEnabled: true,
        isMissingTrackingEnabled: true,
        styles: {},
        spellStyles: {},
        enabledBuffs: {},
        barsThatGlow: {},
        fadedBars: {},
        fadedOpacity: 50,
        showTooltipIds: false,
        isTableAdvanced: false,
        customSoundFolders: [{ folder: CUSTOM_SOUND_FOLDER, count: 0 }],
        idOverrides: {},
        addedSpells: [],
        enabledReagents: {},
        enabledRanks: {},
        enabledSpells: {},
        lastBuffs: {},
        fedBuffs: {},
        fedItems: {},
    };
}

/** The look of each type of reminder until the player changes it. The old ranks and the low reagents are a quiet hint. */
/** The default looks of some spells, by type and spell ID: what they want unlike the rest of their type. */
/** The row of Execute in Defensive Stance in the table: no spell has this ID, so its look and its switch are its own. */
export const DEFENSIVE_EXECUTE_ROW = -Warrior.Execute;

export const SPELL_STYLE_DEFAULTS: { [key in ReminderType]?: { [spellId: number]: StyleOverride | undefined } } = {
    // Its row has a type of its own to tell apart from: "Proc" alone would say little
    proc: { [DEFENSIVE_EXECUTE_ROW]: { messageTextChoice: "name" } },
    // Shield Block lasts 7 seconds: out of a fight it is no use
    missingBuff: { [Warrior.ShieldBlock]: { when: "inCombat" } },
};

export const STYLE_DEFAULTS: { [key in ReminderType]: Style } = {
    missingBuff: {
        color: [0.2, 0.55, 1],
        glowPercent: 100,
        isMessageOn: false,
        sound: "none",
        repeat: 0,
        when: "always",
        glowTime: 0,
        animation: "circling",
    },
    weaponBuff: {
        color: [1, 0.55, 0.1],
        glowPercent: 100,
        isMessageOn: false,
        sound: "none",
        repeat: 0,
        when: "always",
        glowTime: 0,
        animation: "circling",
    },
    // The paladin's gold
    missingSeal: {
        color: [1, 0.85, 0.2],
        glowPercent: 100,
        isMessageOn: false,
        sound: "none",
        repeat: 0,
        when: "inCombat",
        glowTime: 0,
        animation: "circling",
    },
    // #1AA6BF, a deep turquoise: a lighter cyan glows almost white
    missingTracking: {
        color: [0.1, 0.65, 0.75],
        glowPercent: 100,
        isMessageOn: false,
        sound: "none",
        repeat: 0,
        when: "always",
        glowTime: 0,
        animation: "circling",
    },
    readyCooldown: {
        color: [1, 1, 1],
        glowPercent: 100,
        isMessageOn: false,
        sound: "none",
        repeat: 0,
        when: "inCombat",
        glowTime: 3,
        animation: "circling",
    },
    proc: {
        color: [1, 0.12, 0.08],
        glowPercent: 100,
        isMessageOn: false,
        sound: "none",
        repeat: 0,
        when: "always",
        glowTime: 0,
        animation: "circling",
    },
    oldRank: {
        color: [1, 0.85, 0.2],
        glowPercent: 50,
        isMessageOn: true,
        sound: "none",
        repeat: 0,
        when: "always",
        glowTime: 0,
        animation: "circling",
    },
    // Its message is the town's: it names the reagents to buy
    lowReagent: {
        color: [1, 0.85, 0.2],
        glowPercent: 50,
        isMessageOn: true,
        sound: "none",
        repeat: 0,
        when: "townAlert",
        glowTime: 0,
        animation: "circling",
    },
    // A quieter red than the procs'
    lowStock: {
        color: [1, 0.12, 0.08],
        glowPercent: 50,
        isMessageOn: true,
        sound: "none",
        repeat: 0,
        when: "always",
        glowTime: 0,
        animation: "circling",
    },
};

/** When a reminder of the reminderType may show: by combat or a target; the low reagents and the low stock also with their alert in a town. */
export function listWhenChoices(reminderType: ReminderType): When[] {
    const choices: When[] = ["always", "inCombat", "outOfCombat", "enemyTargeted"];
    return reminderType === "lowReagent" || reminderType === "lowStock" ? [...choices, "townAlert"] : choices;
}

/** The folder in AddOns for sound files of the player's own that the table starts with: next to the addon, so an update leaves it alone. */
export const CUSTOM_SOUND_FOLDER = "GlowingBars_Sounds";

/** What a folder added in the table starts as, to change into the player's own. */
export const NEW_SOUND_FOLDER = "GlowingBars_My_Sounds";

/** The choices of how often a sound repeats while its glow is on (seconds; 0 = once). */
export const REPEAT_CHOICES = [0, 5, 10, 30, 60];

/** The choices of how visible a faded bar's buttons are, in percent. */
export const FADED_OPACITY_CHOICES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

/** The choices of how a glow moves. */
export const ANIMATION_CHOICES: GlowAnimation[] = ["circling", "clean", "breathing", "breathingClean", "none", "noneClean"];

/** The choices of how long a reminder shows once it is due (seconds; 0 = until it is done). */
export const GLOW_TIME_CHOICES = [0, 1, 2, 3, 5, 10];

/** The choices of from how many missing a buff its group version is asked for. */
export const GROUP_FROM_CHOICES = [1, 2, 3, 4, 5];

/** The types a spell can be added as, in the order the add button goes through them. */
export const ADDABLE_TYPES: AddableType[] = [
    "readyCooldown",
    "proc",
    "missingBuff",
    "weaponBuff",
    "lowReagent",
    "lowStock",
    "missingSeal",
    "missingTracking",
];

/** The types in the order the tables list them. */
export const TYPE_ORDER: ReminderType[] = [
    "missingBuff",
    "weaponBuff",
    "missingSeal",
    "missingTracking",
    "lowReagent",
    "lowStock",
    "readyCooldown",
    "proc",
    "oldRank",
];

/** A saved value that is one of the choices; undefined for any other. */
/** How long a message can stay, in seconds; 0 is as long as the button glows. */
export const MESSAGE_SHOW_FOR_CHOICES = [5, 10, 20, 0];

/** What a message can say. */
export const MESSAGE_TEXT_CHOICES: MessageTextChoice[] = ["typeOnly", "typeAndName", "name", "custom"];

function pickChoice<T>(value: T | undefined, choices: T[]): T | undefined {
    return value !== undefined && choices.includes(value) ? value : undefined;
}

/** A saved When that the type has; undefined for any other (the type of a spell look not known: none). */
function repairWhen(when: unknown, reminderType: ReminderType | undefined): When | undefined {
    return reminderType !== undefined && listWhenChoices(reminderType).includes(when as When) ? (when as When) : undefined;
}

/** The part of a saved look that can be used: a sound that is no longer in the list, or a color that is no color, is dropped. */
function repairStyle(style: StyleOverride | undefined, reminderType: ReminderType | undefined): StyleOverride | undefined {
    if (style === undefined || type(style) !== "table") return undefined;
    const repaired: StyleOverride = {};
    repaired.when = repairWhen(style.when, reminderType);
    if (isSoundKey(style.sound)) repaired.sound = style.sound;
    if (type(style.isMessageOn) === "boolean") repaired.isMessageOn = style.isMessageOn;
    repaired.repeat = pickChoice(style.repeat, REPEAT_CHOICES);
    repaired.glowTime = pickChoice(style.glowTime, GLOW_TIME_CHOICES);
    repaired.animation = pickChoice(style.animation, ANIMATION_CHOICES);
    const glowPercent = tonumber(style.glowPercent);
    if (glowPercent !== undefined) repaired.glowPercent = math.max(1, math.min(100, math.floor(glowPercent + 0.5)));
    repaired.messageTextChoice = pickChoice(style.messageTextChoice, MESSAGE_TEXT_CHOICES);
    repaired.messageShowFor = pickChoice(style.messageShowFor, MESSAGE_SHOW_FOR_CHOICES);
    repaired.color = repairColor(style.color);
    repaired.messageColor = repairColor(style.messageColor);
    if (type(style.messageText) === "string" && style.messageText !== "") repaired.messageText = style.messageText;
    return repaired;
}

function repairColor(color: StyleOverride["color"]): StyleOverride["color"] {
    return color !== undefined && type(color) === "table" && tonumber(color[0]) !== undefined
        ? [color[0], color[1] ?? 0, color[2] ?? 0]
        : undefined;
}

/** A limit of how few is running low: any number from 0. */
function repairLimit(limit: unknown, byDefault: number): number {
    return type(limit) === "number" && (limit as number) >= 0 ? (limit as number) : byDefault;
}

/** The folders that make sense; there is always one to fill in. */
function repairSoundFolders(saved: unknown, byDefault: AddonSettings["customSoundFolders"]): AddonSettings["customSoundFolders"] {
    if (type(saved) !== "table") return byDefault;
    const folders = (saved as AddonSettings["customSoundFolders"])
        .filter(
            (entry) =>
                type(entry) === "table" && type(entry.folder) === "string" && string.find(entry.folder, "^[^\\/:]+$")[0] !== undefined,
        )
        .map((entry) => ({ folder: entry.folder, count: repairLimit(entry.count, 0) }));
    return folders.length > 0 ? folders : byDefault;
}

/** Puts right what a saved look got wrong. */
export function repairSettings(values: AddonSettings): void {
    // Whatever goes wrong with old settings, the addon still loads: what was not converted is the default
    tryCall(() => convertOldSettings(values));
    // A style no longer known (or circling on a round button) is the default again
    const defaults = createDefaultSettings();
    if (!["breathing", "none"].includes(values.roundAnimation)) values.roundAnimation = defaults.roundAnimation;
    if (!FADED_OPACITY_CHOICES.includes(values.fadedOpacity)) values.fadedOpacity = defaults.fadedOpacity;
    // An added spell that is not a number and a type is dropped
    values.addedSpells = (values.addedSpells ?? []).filter(
        (cue) => type(cue) === "table" && tonumber(cue.id) !== undefined && ADDABLE_TYPES.includes(cue.reminderType),
    );
    values.reagentBelow = repairLimit(values.reagentBelow, defaults.reagentBelow);
    values.stockBelow = repairLimit(values.stockBelow, defaults.stockBelow);
    values.customSoundFolders = repairSoundFolders(values.customSoundFolders, defaults.customSoundFolders);
    // The old switch of a Greater Blessing for one member of a class in a party is a party group version from one
    const old = values as { showGreaterForOne?: boolean };
    if (old.showGreaterForOne === true) values.partyGroupFrom = 1;
    old.showGreaterForOne = undefined;
    if (!GROUP_FROM_CHOICES.includes(values.partyGroupFrom)) values.partyGroupFrom = defaults.partyGroupFrom;
    if (!GROUP_FROM_CHOICES.includes(values.raidGroupFrom)) values.raidGroupFrom = defaults.raidGroupFrom;
    for (const reminderType of TYPE_ORDER) values.styles[reminderType] = repairStyle(values.styles[reminderType], reminderType);
    // A spell's look is kept under its type and name ("buff:Arcane Intellect")
    for (const [key, style] of pairs(values.spellStyles)) {
        const [reminderType] = string.match(key as string, "^(%a+):");
        values.spellStyles[key as string] = repairStyle(
            style,
            TYPE_ORDER.find((known) => known === reminderType),
        );
    }
}
