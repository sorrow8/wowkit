// The spells that glow by themselves, per class (UnitClass token): the cooldowns worth pressing the moment they are ready,
// and the spells that become usable only after something happened (a dodge, a parry, a kill, a low target).
import { Druid, Hunter, Mage, Paladin, Priest, Racial, Rogue, Shaman, Warlock, Warrior } from "@wowkit/wow-data";

/** Important cooldowns: they glow when ready, in combat. The player can switch each off. */
export const COOLDOWN_CUES: { [classToken: string]: number[] | undefined } = {
    DRUID: [Druid.Innervate, Druid.NaturesSwiftness, Druid.Barkskin, Druid.TigersFury, Druid.Berserk, Druid.FrenziedRegeneration],
    HUNTER: [Hunter.RapidFire, Hunter.BestialWrath, Hunter.Deterrence],
    MAGE: [Mage.PresenceOfMind, Mage.ArcanePower, Mage.Combustion, Mage.Evocation, Mage.IceBlock, Mage.IceBarrier],
    PALADIN: [Paladin.DivineShield, Paladin.DivineProtection, Paladin.LayOnHands, Paladin.SwiftJudgement],
    PRIEST: [Priest.InnerFocus, Priest.PowerInfusion, Priest.Fade],
    ROGUE: [Rogue.AdrenalineRush, Rogue.BladeFlurry, Rogue.ColdBlood, Rogue.Preparation, Rogue.Evasion, Rogue.Vanish],
    SHAMAN: [Shaman.ElementalMastery, Shaman.NaturesSwiftness],
    WARLOCK: [Warlock.DeathCoil],
    WARRIOR: [
        Warrior.Recklessness,
        Warrior.DeathWish,
        Warrior.Bloodrage,
        Warrior.SweepingStrikes,
        Warrior.BerserkerRage,
        Warrior.Retaliation,
        Warrior.ShieldWall,
        Warrior.LastStand,
    ],
};

/**
 * The racials worth a glow in a fight, of every race: only the ones the player has learned count. Offensive (Blood Fury,
 * Berserking, Elune's Light, Eureka), defensive (Stoneform, Will to Survive, Rapid Regeneration), and the ones that break
 * out of a hold (Will of the Forsaken, Escape Artist, Shatter Curse), War Stomp and Perception. And the priest's spells
 * of each race that have a cooldown (Desperate Prayer, Elune's Grace, Feedback, Divine Grace...); the ones without one
 * (Touch of Weakness, Shadowguard, Hex of Weakness) are buffs and debuffs, not cooldowns.
 */
export const RACIAL_COOLDOWNS: number[] = [
    Racial.BloodFury,
    Racial.Berserking,
    Racial.ElunesLight,
    Racial.Eureka,
    Racial.Stoneform,
    Racial.WillToSurvive,
    Racial.RapidRegeneration,
    Racial.WillOfTheForsaken,
    Racial.EscapeArtist,
    Racial.ShatterCurse,
    Racial.WarStomp,
    Racial.Perception,
    Priest.DesperatePrayer,
    Priest.DivineGrace,
    Priest.Feedback,
    Priest.Chastise,
    Priest.ElunesGrace,
    Priest.Starshards,
    Priest.DarkSacrifice,
    Priest.ConfoundingFlash,
    Priest.ContingencyPlan,
];

/** Procs: the spell glows while the game says it is usable (and not on cooldown). The player can switch each off. */
export const PROC_CUES: { [classToken: string]: number[] | undefined } = {
    HUNTER: [Hunter.Counterattack, Hunter.MongooseBite],
    PALADIN: [Paladin.HammerOfWrath, Paladin.Exorcism],
    ROGUE: [Rogue.Riposte],
    WARRIOR: [Warrior.Overpower, Warrior.Revenge, Warrior.Execute, Warrior.VictoryRush],
};

/**
 * Procs that also need a target of a kind: the creature types they hit, in lower case as the client names them. When the
 * client hides the target's type (it does for many NPCs), the spell's range check stands in: it says no for a target the
 * spell cannot hit.
 */
export const TARGET_TYPE_CUES: [spellId: number, creatureTypes: string[]][] = [[Paladin.Exorcism, ["undead", "demon"]]];

/**
 * Procs the game hides in a fight, as buffs: their spell tells instead, by turning free or instant. Alpha: the table says so.
 * Without the talent the spell never does, so no other check is needed.
 */
export const ALPHA_PROC_CUES: { [classToken: string]: { id: number; sign: "free" | "instant" }[] | undefined } = {
    MAGE: [{ id: Mage.ArcaneMissiles, sign: "free" }],
    WARLOCK: [{ id: Warlock.ShadowBolt, sign: "instant" }],
};

/**
 * Cooldowns that start when another spell is cast, not when they are: Swift Judgement makes the next Judgement cheap, and
 * its cooldown starts as that Judgement uses it up, however long that takes. Until then the spell is not ready.
 */
export const COOLDOWN_STARTED_BY: [spellId: number, startedBy: number[]][] = [[Paladin.SwiftJudgement, [Paladin.Judgement]]];
