// Spells, the spellbook and spell tooltips.
import { findPartyMember, type ClientState, type SpellDefinition } from "./client-state";
import { defineGlobals, defineNamespace, fake } from "./define";

/** A melee spell (range 0) reaches this far. */
const MELEE_YARDS = 5;

export function installSpells(state: ClientState): void {
    function toSpellInfo(spell: SpellDefinition): SpellInfo {
        return {
            name: spell.name,
            iconID: spell.icon,
            originalIconID: spell.icon,
            castTime: spell.castTimeMs ?? 0,
            minRange: 0,
            maxRange: spell.maxRange ?? 0,
            spellID: spell.id,
        };
    }

    /** The spell by ID, or by name: then the highest rank, like the game. */
    function findSpell(idOrName: number | string): SpellDefinition | undefined {
        if (type(idOrName) === "number") return state.spells[idOrName as number];
        let best: SpellDefinition | undefined;
        for (const [, spell] of pairs(state.spells)) {
            if (spell.name !== idOrName) continue;
            if (best === undefined || (state.isFirstRankByName ? spell.rank < best.rank : spell.rank > best.rank)) best = spell;
        }
        return best;
    }

    /** Is the target within the spell's range? Undefined for a spell without a range or without a target. */
    function isTargetInRange(spell: SpellDefinition | undefined): boolean | undefined {
        if (spell?.maxRange === undefined || state.target === undefined) return undefined;
        return state.target.yards <= math.max(spell.maxRange, MELEE_YARDS);
    }

    /** The spellbook lists the learned spells, sorted by ID. */
    function listSpellBook(): SpellDefinition[] {
        const ids: number[] = [];
        for (const [id] of pairs(state.knownSpells)) ids.push(id);
        ids.sort((a, b) => a - b);
        return ids.map((id) => state.spells[id]!);
    }

    defineNamespace<typeof C_Spell>("C_Spell", {
        // By name the game answers only of what the player knows
        GetSpellInfo: (idOrName) => {
            const spell = findSpell(idOrName);
            if (spell === undefined || (type(idOrName) === "string" && state.knownSpells[spell.id] !== true)) return undefined;
            return toSpellInfo(spell);
        },
        GetSpellSubtext: (idOrName) => {
            const spell = findSpell(idOrName);
            return spell ? `Rank ${spell.rank}` : undefined;
        },
        GetOverrideSpell: (idOrName) => (type(idOrName) === "number" ? (idOrName as number) : 0),
        IsSpellInRange: (idOrName, unit) => {
            if (unit === "target") return isTargetInRange(findSpell(idOrName));
            return findPartyMember(state, unit)?.isOutOfRange !== true;
        },
        IsSpellHarmful: (idOrName) => findSpell(idOrName)?.isHarmful === true,
        IsSpellHelpful: (idOrName) => findSpell(idOrName)?.isHelpful === true,
        IsAutoRepeatSpell: () => false,
        GetSpellPowerCost: (idOrName) => {
            const cost = state.spellCosts[findSpell(idOrName)?.id ?? 0];
            return (cost !== undefined ? [{ cost, type: 0 }] : []) as SpellPowerCostInfo[];
        },
        GetSpellDescription: (idOrName) => findSpell(idOrName)?.description ?? "",
        GetSpellCooldown: (idOrName) => {
            if (state.areCooldownsHidden) return undefined;
            const spell = findSpell(idOrName);
            const cooldown = spell ? state.cooldowns[spell.id] : undefined;
            return fake<SpellCooldownInfo>({ startTime: cooldown?.start ?? 0, duration: cooldown?.duration ?? 0, isEnabled: true });
        },
        IsSpellUsable: (idOrName) => {
            const isUnusable = state.unusableSpells[idOrName as number] === true;
            return $multi(!isUnusable, isUnusable);
        },
        GetSpellTexture: (idOrName) => {
            const icon = findSpell(idOrName)?.icon;
            return $multi(icon, icon, undefined);
        },
    });

    defineGlobals({
        GetSpellBaseCooldown: (spellId) => $multi((state.spells[spellId]?.cooldownSeconds ?? 0) * 1000, 1500),
    });

    defineNamespace<typeof C_SpellBook>("C_SpellBook", {
        IsSpellKnown: (spellId) => state.knownSpells[spellId] === true,
        IsSpellInSpellBook: (spellId) => state.knownSpells[spellId] === true,
        GetNumSpellBookSkillLines: () => 1,
        GetSpellBookSkillLineInfo: () => fake<SpellBookSkillLineInfo>({ itemIndexOffset: 0, numSpellBookItems: listSpellBook().length }),
        GetSpellBookItemInfo: (slot, bank) => {
            if (bank !== Enum.SpellBookSpellBank.Player) return undefined;
            const spell = listSpellBook()[slot - 1];
            return spell
                ? fake<SpellBookItemInfo>({ name: spell.name, spellID: spell.id, itemType: Enum.SpellBookItemType.Spell })
                : undefined;
        },
        GetSpellBookItemName: () => $multi(undefined, undefined),
        FindSpellBookSlotForSpell: () => $multi(undefined, undefined),
    });

    defineNamespace<typeof C_TooltipInfo>("C_TooltipInfo", {
        GetInventoryItem: () => fake<TooltipData>({ lines: [] }),
        GetSpellByID: (spellId) => {
            const lines = [{ leftText: state.spells[spellId as number]?.name ?? "?" }];
            const reagent = state.reagentTexts[spellId as number];
            if (reagent !== undefined)
                lines.push({ leftText: `${(_G as unknown as { SPELL_REAGENTS?: string }).SPELL_REAGENTS ?? "Reagents: "}${reagent}` });
            return fake<TooltipData>({ lines });
        },
    });

    defineNamespace<typeof C_AddOns>("C_AddOns", {
        IsAddOnLoaded: (name) => $multi(state.loadedAddons[name] === true, state.loadedAddons[name] === true),
        GetAddOnMetadata: () => "test",
    });
}
