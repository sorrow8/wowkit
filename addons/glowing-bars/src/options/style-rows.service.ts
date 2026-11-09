// The rows of the table of looks: the types of reminder (their default look), and the spells of the player's class that
// can have a look of their own: the buffs, the weapon buffs, the seals, the gathering trackings, the cooldowns, the procs, the group buffs with a reagent, and
// every spell of the book that has ranks. Plain lists; the window draws them.
import { type PlayerService, type SpellsService, getItemButtonKey, readItemLook } from "@wowkit/wow";
import { Warrior } from "@wowkit/wow-data";
import type { AddedSpellsService } from "../glows/added-spells.service";
import type { GlowCuesService } from "../glows/glow-cues.service";
import type { AddonLocale } from "../locale/locale.interface";
import type { TextKey } from "../locale/texts.constants";
import type { ReagentsService } from "../reagents/reagents.service";
import type { ClassBuffsService } from "../reminders/class-buffs.service";
import type { FedBuffsService } from "../reminders/fed-buffs.service";
import type { SealReminderService } from "../reminders/seal-reminder.service";
import type { TrackingReminderService } from "../reminders/tracking-reminder.service";
import type { WeaponChoiceService } from "../reminders/weapon/weapon-choice.service";
import { ADDABLE_TYPES, TYPE_ORDER, DEFENSIVE_EXECUTE_ROW } from "../settings/settings.constants";
import type { ReminderType, AddableType } from "../settings/settings.interface";
import type { StyleService } from "../settings/style.service";

/** One row of the table: a type (no spell), or a spell of a type. */
export interface StyleRow {
    reminderType: ReminderType;
    spellId: number | undefined;
    label: string;
    /** The spell's icon; none for a type. */
    iconId: number | undefined;
    /** For a cooldown or proc of the lists: its ID there (the player may give it another). */
    listId?: number;
    /** A spell the player added. */
    isAdded?: boolean;
    /** A spell of the class the character has not learned (yet): its row is faded. Undefined for a type and an item. */
    isLearned?: boolean;
    /** The low stock: the item the row is about (its `spellId` is what the item's buttons are found by). */
    itemId?: number;
    /** The ID of a spell of the lists that this row shows and changes too (the same spell, a row of its own). */
    sharesIdOf?: number;
    /** An experimental row: what the tooltip of its name says. */
    alphaTip?: TextKey;
    /** A glow only the game itself can light: what would have to know when it starts is faded on the row. */
    isFadeOnly?: boolean;
}

/** The words that name each type of reminder. */
export const TYPE_TEXTS: { [reminderType in ReminderType]: TextKey } = {
    missingBuff: "TYPE_MISSING_BUFF",
    weaponBuff: "TYPE_WEAPON_BUFF",
    missingSeal: "TYPE_MISSING_SEAL",
    missingTracking: "TYPE_MISSING_TRACKING",
    readyCooldown: "TYPE_READY_COOLDOWN",
    proc: "TYPE_PROC",
    oldRank: "TYPE_OLD_RANK",
    lowReagent: "TYPE_LOW_REAGENT",
    lowStock: "TYPE_LOW_STOCK",
};

export class StyleRowsService {
    constructor(
        private readonly player: PlayerService,
        private readonly spells: SpellsService,
        private readonly classBuffs: ClassBuffsService,
        private readonly weaponChoice: WeaponChoiceService,
        private readonly reagents: ReagentsService,
        private readonly locale: AddonLocale,
        private readonly styles: StyleService,
        private readonly glowCues: GlowCuesService,
        private readonly addedSpells: AddedSpellsService,
        private readonly sealReminder: SealReminderService,
        private readonly trackingReminder: TrackingReminderService,
        private readonly fedBuffs: FedBuffsService,
    ) {}

    /** The default look of each type of reminder this character has spells of (a warrior has no weapon buff to remind of). */
    listTypeRows(spellRows: StyleRow[]): StyleRow[] {
        return TYPE_ORDER.filter((reminderType) => spellRows.some((row) => row.reminderType === reminderType)).map((reminderType) => ({
            reminderType,
            spellId: undefined,
            label: this.locale.getText(TYPE_TEXTS[reminderType]),
            iconId: undefined,
        }));
    }

    /** Is it a food or drink? Many of their spells go by one name, so only the ID tells them apart. */
    isSharingName(spellId: number): boolean {
        return this.fedBuffs.isFedSpell(spellId);
    }

    /**
     * How a row shows a spell. A food or drink the player added goes by its item (the spell's name is the same for all of
     * them), and so does a weapon buff put on with an item (Rough Sharpening Stone, not Sharpen Blade).
     */
    private readLook(
        reminderType: ReminderType,
        spellId: number,
        name: string,
        isAdded: boolean,
    ): { key: string; label: string; iconId: number | undefined; isFromItem: boolean } {
        const hasItem = isAdded && (reminderType === "weaponBuff" || this.isSharingName(spellId));
        const item = hasItem ? this.fedBuffs.findItemLook(spellId) : undefined;
        return {
            key: isAdded && this.isSharingName(spellId) ? string.format("%d", spellId) : name,
            label: item?.name ?? this.spells.getSpellLabel(spellId) ?? name,
            iconId: item?.iconId ?? this.spells.getSpellInfo(spellId)?.iconID,
            isFromItem: item !== undefined,
        };
    }

    /** What the player added; an item of the low stock goes by what its buttons are found by, and under its own name. */
    private listAddedRows(): { reminderType: AddableType; id: number; extra: Partial<StyleRow> }[] {
        const added: { reminderType: AddableType; id: number; extra: Partial<StyleRow> }[] = [];
        for (const reminderType of ADDABLE_TYPES) {
            for (const id of this.addedSpells.listAdded(reminderType)) {
                if (reminderType !== "lowStock") {
                    added.push({ reminderType, id, extra: { isAdded: true } });
                    continue;
                }
                const { name, iconId } = readItemLook(id);
                const extra = { isAdded: true, itemId: id, label: name ?? string.format("%d", id), iconId };
                added.push({ reminderType, id: getItemButtonKey(id), extra });
            }
        }
        return added;
    }

    /** The spells of the class that can have a look of their own, by type, then by name. A spell is listed once. */
    listSpellRows(): StyleRow[] {
        const rows: StyleRow[] = [];
        const keys = new LuaSet<string>();
        /** A spell is listed once, unless `suffix` tells two rows of one name apart (the ranks of a group buff with their reagents). */
        const add = (reminderType: ReminderType, spellId: number | undefined, extra: Partial<StyleRow> = {}, suffix?: string) => {
            if (spellId === undefined) return;
            const name = this.styles.getSpellKey(spellId);
            const look = this.readLook(reminderType, spellId, name, extra.isAdded === true);
            // A spell the player added has a row of its own even when a list has it as another type: it glows on its own too
            const key = extra.isAdded === true ? `${reminderType}:${look.key}` : suffix !== undefined ? `${name}|${suffix}` : name;
            if (keys.has(key)) return;
            keys.add(key);
            rows.push({
                reminderType,
                spellId,
                label: suffix !== undefined ? `${look.label} (${suffix})` : look.label,
                iconId: look.iconId,
                // What goes through an item is never learned: having it is what counts
                isLearned: extra.itemId !== undefined || look.isFromItem ? undefined : this.spells.isLearned(spellId),
                ...extra,
            });
        };
        const addListed = (reminderType: ReminderType, listId: number | undefined, suffix?: string) => {
            if (listId !== undefined) add(reminderType, this.addedSpells.getEffectiveId(listId), { listId }, suffix);
        };
        for (const classBuff of this.classBuffs.getClassBuffs()) addListed("missingBuff", classBuff.id);
        for (const entry of this.weaponChoice.getWeaponChoices()) addListed("weaponBuff", entry.id);
        for (const id of this.sealReminder.listSeals()) addListed("missingSeal", id);
        for (const id of this.trackingReminder.listTrackings()) addListed("missingTracking", id);
        for (const reminderType of ["readyCooldown", "proc"] as const) {
            for (const id of this.glowCues.listBuiltInIds(reminderType)) addListed(reminderType, id);
        }
        for (const { reminderType, id, extra } of this.listAddedRows()) add(reminderType, id, extra);
        // A group buff whose ranks take different reagents (Holy Candle, Sacred Candle) has a row for each reagent
        for (const reagent of this.reagents.getReagentsOfClass(this.player.getClassToken())) {
            addListed("lowReagent", reagent.spells[0], this.reagents.getReagentName(reagent));
        }
        // The spells that have ranks (a spell with one rank has no "Rank" in its subtext), on a bar or not. The ranks are read
        // off the bars, by the IDs there: a rank row's ID is not one to fix
        for (const id of this.spells.listSpellBookIds()) if (this.spells.getSpellRank(id) !== undefined) add("oldRank", id);
        this.addAlphaRows(rows);
        rows.sort((a, b) => this.compareRows(a, b));
        return rows;
    }

    /** The buffs told by the Cooldown Manager in a fight. */
    private isBuffRow(row: StyleRow): boolean {
        if (row.spellId !== undefined && this.fedBuffs.isFedSpell(row.spellId)) return false;
        return row.reminderType === "missingBuff" || row.reminderType === "missingSeal" || row.reminderType === "missingTracking";
    }

    /** What is experimental says so: a warrior's Execute in Defensive Stance, and the procs told by their spell. */
    private addAlphaRows(rows: StyleRow[]): void {
        if (this.player.getClassToken() === "WARRIOR") rows.push(this.createDefensiveExecuteRow());
        for (const row of rows) {
            if (this.isBuffRow(row)) this.markAlpha(row, "TIP_ALPHA_BUFF");
            if (row.reminderType === "proc" && row.listId !== undefined && this.glowCues.isAlphaProc(row.listId))
                this.markAlpha(row, "TIP_ALPHA_PROC");
        }
    }

    private markAlpha(row: StyleRow, tip: TextKey): void {
        row.label = `${row.label} (alpha)`;
        row.alphaTip = tip;
    }

    /** Execute in Defensive Stance: a row of its own beside the one of Execute, whose glow can do all that this one cannot. */
    private createDefensiveExecuteRow(): StyleRow {
        const stance = this.spells.getSpellLabel(Warrior.DefensiveStance) ?? "";
        const row: StyleRow = {
            reminderType: "proc",
            spellId: DEFENSIVE_EXECUTE_ROW,
            label: `${this.spells.getSpellLabel(Warrior.Execute) ?? ""} (${stance})`,
            iconId: this.spells.getSpellInfo(Warrior.Execute)?.iconID,
            isLearned: this.spells.isLearned(Warrior.Execute),
            sharesIdOf: Warrior.Execute,
            isFadeOnly: true,
        };
        this.markAlpha(row, "TIP_ALPHA_EXECUTE");
        return row;
    }

    private compareRows(a: StyleRow, b: StyleRow): number {
        const byType = TYPE_ORDER.indexOf(a.reminderType) - TYPE_ORDER.indexOf(b.reminderType);
        if (byType !== 0) return byType;
        return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
    }
}
