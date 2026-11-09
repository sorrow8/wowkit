import type { CustomSoundFolder, SettingsService, SoundKey } from "@wowkit/ui";
import type { GlowAnimation, Rgb } from "@wowkit/wow";

/** The types of reminder. Each has a look (color, glow %, message, sound) the player can change for the type and for a spell. */
export type ReminderType =
    "missingBuff" | "weaponBuff" | "missingSeal" | "missingTracking" | "readyCooldown" | "proc" | "oldRank" | "lowReagent" | "lowStock";

/** The settings service of this addon: a SettingsService that knows the shape of its settings. */
export type AddonSettingsService = SettingsService<AddonSettings>;

/**
 * When a reminder may show: always, only in combat or only out of it, only with a living enemy targeted; or (the low
 * reagents and the low stock) glowing anywhere, with its message and sound only in a town or an inn.
 */
export type When = "always" | "inCombat" | "outOfCombat" | "enemyTargeted" | "townAlert";

/** What a message says: the type of reminder, the type and the spell or item, the spell or item, or the player's own words. */
export type MessageTextChoice = "typeOnly" | "typeAndName" | "name" | "custom";

/** How a reminder looks and sounds, and when it shows. */
export interface Style {
    /** Of the glow and of the message. */
    color: Rgb;
    /** The glow %, 1 to 100. */
    glowPercent: number;
    /** Does a short message at the top of the screen say so? */
    isMessageOn: boolean;
    sound: SoundKey;
    /** Seconds between the repeats of the glow, the message and the sound; 0 shows them once, as the reminder starts. */
    repeat: number;
    when: When;
    /** Seconds the reminder shows once it is due, and again with each repeat; 0 = the whole time, until it is done. */
    glowTime: number;
    /** How the glow moves: around the button, breathing, or still (fading in and out only as it comes and goes). */
    animation: GlowAnimation;
    /** What the message says; none: what its type says by default (StyleService.getMessageTextChoice). */
    messageTextChoice?: MessageTextChoice;
    /** The player's own words for the message, for the Custom choice. */
    messageText?: string;
    /** The color of the message, where it is not the glow's. */
    messageColor?: Rgb;
    /** Seconds the message stays; 0: as long as the button glows; none: the usual time (NOTICE_SECONDS). */
    messageShowFor?: number;
}

/** The types a spell can be added as by the player: every type but the old ranks, which are found for every spell. */
export type AddableType =
    "missingBuff" | "weaponBuff" | "missingSeal" | "missingTracking" | "lowReagent" | "readyCooldown" | "proc" | "lowStock";

/** A spell the player added by its ID; for the low stock an item, by its item ID. */
export interface AddedSpell {
    id: number;
    reminderType: AddableType;
}

/** The parts of a look the player changed; the rest is inherited. */
export type StyleOverride = Partial<Style>;

export interface AddonSettings {
    isDisabled: boolean;
    /** How big the messages at the top of the screen are, in percent. */
    messageSize: number;
    /** How far below the top of the screen the messages are, in pixels. */
    messageTop: number;
    /** Do the messages grow into place as they appear? */
    isMessageZoomInOn: boolean;
    /** Do the messages shrink away as they disappear? */
    isMessageZoomOutOn: boolean;
    /** Do the messages keep fading a little and back while they are on screen? */
    isMessageFadePulseOn: boolean;
    /** Do the messages keep growing and shrinking while they are on screen? */
    isMessageSizePulseOn: boolean;
    /** How fast and how strong the pulses of the messages are, in percent. */
    messagePulseSpeed: number;
    /** Do all the messages of one type share a line? */
    isOneLinePerType: boolean;
    /** Does the greeting in the chat come at each login? */
    shouldShowGreeting: boolean;
    shouldStayQuietInTowns: boolean;
    /** Has this character seen the welcome window? */
    isWelcomeDone: boolean;
    /** Does the player want to see Blizzard's Cooldown Manager, which the addon runs in the background? */
    shouldShowCooldownManager: boolean;
    /** Do the action buttons light up in rainbow colors while the player is AFK? */
    isAfkRainbowOn: boolean;
    /** What a circling glow does on a round button (Forever's gamepad bars, another addon's), where it cannot circle. */
    roundAnimation: GlowAnimation;
    isMissingBuffEnabled: boolean;
    isWeaponBuffEnabled: boolean;
    /** Party members missing the player's buffs. */
    showPartyBuffs: boolean;
    /** Raid members missing the player's buffs. */
    showRaidBuffs: boolean;
    /**
     * The group version (Prayer of Fortitude, a Greater Blessing) is asked for from this many missing the buff, the player
     * counted (1 to 5): in a party, and in a raid. A Greater Blessing counts the members of its class.
     */
    partyGroupFrom: number;
    raidGroupFrom: number;
    /** Spells on the bars at a lower rank than the one the player knows. */
    isOldRankEnabled: boolean;
    /** The reagents of the group buffs running low, on arriving in a town. */
    isLowReagentEnabled: boolean;
    /** Important cooldowns that are ready. */
    isReadyCooldownEnabled: boolean;
    /** As a fight starts, every ready cooldown glows too (a reminder to use it), for its glow time. */
    showCooldownsAtFightStart: boolean;
    /** A group buff's reagent runs low with fewer than this in the bags. */
    reagentBelow: number;
    /** The same of the items the player watches, and whether they are watched. */
    stockBelow: number;
    isLowStockEnabled: boolean;
    /** The limit of a row of its own ("stock:2512", "reagent:17028"), where it has one. */
    belowLimits: { [entry: string]: number | undefined };
    /** Spells the game says are usable now (Overpower, Revenge, Execute...). */
    isProcEnabled: boolean;
    /** A paladin in a fight with no seal up. */
    isMissingSealEnabled: boolean;
    /** A miner or a herbalist with no tracking on. */
    isMissingTrackingEnabled: boolean;
    /** The player's changes to the look of each type of reminder (the default look of its spells). */
    styles: { [key in ReminderType]?: StyleOverride };
    /** The player's changes to the look of one spell in one type, by the type and the spell's name ("rank:Smite"). */
    spellStyles: { [typeAndName: string]: StyleOverride | undefined };
    /** The player's fix of the ID of a cooldown or proc of the lists (by the list's ID): the ID the client knows it by. */
    idOverrides: { [listId: string]: number | undefined };
    /** Cooldowns and procs the player added by their ID. */
    addedSpells: AddedSpell[];
    /** The action bars (1 to 8) whose buttons are faded until they glow; only set where the player switched one on. */
    fadedBars: { [bar: string]: boolean | undefined };
    /** How visible the buttons of a faded bar are while they do not glow, in percent. */
    fadedOpacity: number;
    /** The spell IDs in the spell and item tooltips, to add a spell by its ID in the table. */
    showTooltipIds: boolean;
    /** The table shows every column (Advanced), not only the ones everybody needs (Basic). */
    isTableAdvanced: boolean;
    /** The folders in AddOns with sound files of the player's own (custom1, custom2...), and how many each has. */
    customSoundFolders: CustomSoundFolder[];
    /** The action bars (1 to 8) that glow; only set (false) where the player switched one off. */
    barsThatGlow: { [bar: string]: boolean | undefined };
    /** Per-spell switches of the cooldown and proc glows (by spell ID); only set where the player switched one off. */
    enabledSpells: { [spellId: string]: boolean | undefined };
    /** The buff of a group (one aura, one armor) the player cast last, by the group's first spell ID: the one that glows. */
    lastBuffs: { [group: string]: number | undefined };
    /** The Well Fed each food or drink the player added gives, as learned when it was used (spell ID -> the aura's spell ID). */
    fedBuffs: { [spell: string]: number | undefined };
    /** The item of each food or drink the player added, as seen on a button (spell ID -> item ID). */
    fedItems: { [spell: string]: number | undefined };
    /** The spells whose old rank is not reminded of, by name; only set where the player switched one off. */
    enabledRanks: { [spellName: string]: boolean | undefined };
    /** Per-reagent switches (by item ID); only set where the player switched one off. */
    enabledReagents: { [itemId: string]: boolean | undefined };
    /** Per-buff switches; only set where the player changed the default. */
    enabledBuffs: { [buffKey: string]: boolean | undefined };
    /** Weapon buff picks (WeaponBuff.key); undefined = automatic. */
    weaponBuff?: string;
    weaponBuffOff?: string;
}
