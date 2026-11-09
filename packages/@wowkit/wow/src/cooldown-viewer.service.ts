// Blizzard's Cooldown Manager: in a fight the game hides the player's buffs from addons, but the icons of this window still
// know whether the buff they track is up. It has to be running for that, it can be out of sight.
import {
    findActiveLayout,
    readCategoryOverrides,
    readSavedLayouts,
    setCategoryOverride,
    useOwnLayout,
    writeSavedLayouts,
    type SavedLayout,
} from "./cooldown-layouts";
import type { SpellsService } from "./spells.service";
import { attempt } from "./utils/protected-call.utils";
import { getReadable } from "./utils/secret-value.utils";

const ENABLED_CVAR = "cooldownViewerEnabled";
/** An addon that runs the Cooldown Manager itself, turns it on and handles its windows and their icons. */
const OTHER_MANAGER_ADDON = "EllesmereUICooldownManager";
const BUFF_VIEWERS = ["BuffIconCooldownViewer", "BuffBarCooldownViewer"];
const ALL_VIEWERS = ["EssentialCooldownViewer", "UtilityCooldownViewer", ...BUFF_VIEWERS];
/** Enum.CooldownViewerCategory: Tracked Buffs, and all the groups of Blizzard's list that hold buffs. */
const TRACKED_BUFF_CATEGORY = 2;
const BUFF_CATEGORIES = [TRACKED_BUFF_CATEGORY, 3, 6];
/** Enum.CooldownSetSpellFlags.HideByDefault: a bit of the flags. */
const HIDE_BY_DEFAULT = 2;
/** Any group below zero is Not Displayed. */
const NOT_DISPLAYED = -1;

export class CooldownViewerService {
    constructor(private readonly spells: SpellsService) {}

    /** Does another addon run the windows? Then they are left to it. */
    isRunByOtherAddon(): boolean {
        const [isLoaded] = C_AddOns.IsAddOnLoaded(OTHER_MANAGER_ADDON);
        return isLoaded === true;
    }

    isTurnedOn(): boolean {
        return attempt(C_CVar.GetCVarBool, ENABLED_CVAR) === true;
    }

    enable(): void {
        attempt(C_CVar.SetCVar, ENABLED_CVAR, "1");
    }

    /**
     * Keeps the running window out of sight. Not Hide(): a hidden window stops following its buffs. Its icons stop reacting
     * to the mouse too, or invisible tooltips would come up where they stand.
     */
    hideIcons(): void {
        this.setIconsVisible(false);
    }

    showIcons(): void {
        this.setIconsVisible(true);
    }

    /** Is the buff up, by the icon that tracks it? Undefined with no such icon, or when the game hides the answer. */
    isBuffActive(spellName: string): boolean | undefined {
        for (const name of BUFF_VIEWERS) {
            const viewer = this.getViewer(name);
            if (viewer === undefined) continue;
            for (const item of this.listItems(viewer)) {
                if (this.getItemSpellName(item) === spellName) return getReadable(attempt(() => item.IsActive()));
            }
        }
        return undefined;
    }

    /**
     * Puts the buffs of these names that are on Blizzard's list, learned or not, in Tracked Buffs of the saved layout of the spec.
     * Asks the saved layout itself, so a buff is checked each time; their icons work from the next login or /reload.
     * False while the layouts are loading, or when they cannot be changed.
     */
    trackBuffs(spellNames: string[]): boolean {
        return attempt(() => this.writeTrackedBuffs(spellNames)) === true;
    }

    private writeTrackedBuffs(spellNames: string[]): boolean {
        const settings = (_G as unknown as { CooldownViewerSettings?: CooldownViewerSettingsFrame }).CooldownViewerSettings;
        if (settings === undefined || settings.GetDataProvider().GetLayoutManager() === false) return false;
        const util = (_G as unknown as { CooldownViewerUtil?: CooldownViewerUtilFunctions }).CooldownViewerUtil;
        const specTag = util?.GetCurrentClassAndSpecTag();
        const layouts = readSavedLayouts();
        if (specTag === undefined || layouts === undefined) return false;
        const active = findActiveLayout(layouts, specTag);
        const hidden = this.listHiddenBuffs(active, spellNames);
        if (hidden.length === 0) return true;
        const layout = active ?? useOwnLayout(layouts, specTag);
        for (const id of hidden) setCategoryOverride(layout, id, TRACKED_BUFF_CATEGORY);
        return writeSavedLayouts(layouts);
    }

    /** The entries of Blizzard's list with these names that the layout leaves under Not Displayed. */
    private listHiddenBuffs(layout: SavedLayout | undefined, spellNames: string[]): number[] {
        const overrides = readCategoryOverrides(layout);
        const hidden: number[] = [];
        for (const category of BUFF_CATEGORIES) {
            for (const id of C_CooldownViewer.GetCooldownViewerCategorySet(category, true)) {
                const info = C_CooldownViewer.GetCooldownViewerCooldownInfo(id);
                const name = this.spells.getSpellName(info?.spellID);
                const isHiddenByDefault = (info?.flags ?? 0) % (2 * HIDE_BY_DEFAULT) >= HIDE_BY_DEFAULT;
                const current = overrides.get(id) ?? (isHiddenByDefault ? NOT_DISPLAYED : category);
                if (name !== undefined && spellNames.includes(name) && current < 0) hidden.push(id);
            }
        }
        return hidden;
    }

    private setIconsVisible(isVisible: boolean): void {
        for (const name of ALL_VIEWERS) {
            const viewer = this.getViewer(name);
            if (viewer === undefined) continue;
            viewer.SetAlpha(isVisible ? 1 : 0);
            for (const item of this.listItems(viewer)) item.SetMouseMotionEnabled(isVisible);
        }
    }

    private getViewer(name: string): CooldownViewer | undefined {
        return (_G as unknown as { [name: string]: CooldownViewer | undefined })[name];
    }

    private listItems(viewer: CooldownViewer): CooldownViewerItem[] {
        const items: CooldownViewerItem[] = [];
        if (viewer.itemFramePool === undefined) return items;
        for (const item of viewer.itemFramePool.EnumerateActive()) items.push(item);
        return items;
    }

    private getItemSpellName(item: CooldownViewerItem): string | undefined {
        const cooldownId = getReadable(item.cooldownID);
        if (cooldownId === undefined) return undefined;
        const spellId = getReadable(attempt(C_CooldownViewer.GetCooldownViewerCooldownInfo, cooldownId)?.spellID);
        return spellId !== undefined ? this.spells.getSpellName(spellId) : undefined;
    }
}
