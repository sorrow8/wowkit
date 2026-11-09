// In a fight the game hides the player's buffs; Blizzard's Cooldown Manager still knows them. So it runs in the background, out
// of sight unless the player wants to see it, and the buffs the addon reminds about are put in its Tracked Buffs.
import { OnEvent, OnGameEvent, type OnLogin } from "@wowkit/core";
import type { ClockService, CooldownViewerService, PlayerService, SpellsService } from "@wowkit/wow";
import type { AddedSpellsService } from "../glows/added-spells.service";
import type { ClassBuffsService } from "../reminders/class-buffs.service";
import type { SealReminderService } from "../reminders/seal-reminder.service";
import type { TrackingReminderService } from "../reminders/tracking-reminder.service";
import type { AddonSettingsService } from "../settings/settings.interface";

/** After login or a new spec Blizzard is still loading its layouts. */
const TRACK_DELAY = 5;

export class CooldownManagerService implements OnLogin {
    private isTrackingDue = false;

    constructor(
        private readonly viewer: CooldownViewerService,
        private readonly player: PlayerService,
        private readonly settings: AddonSettingsService,
        private readonly spells: SpellsService,
        private readonly clock: ClockService,
        private readonly classBuffs: ClassBuffsService,
        private readonly addedSpells: AddedSpellsService,
        private readonly seals: SealReminderService,
        private readonly trackings: TrackingReminderService,
    ) {}

    onLogin(): void {
        if (!this.viewer.isRunByOtherAddon() && !this.viewer.isTurnedOn()) this.viewer.enable();
        this.hideIcons();
        this.waitToTrackBuffs();
    }

    /** The game can show them again with a new layout; a fight is when new icons would be seen. */
    @OnGameEvent("EDIT_MODE_LAYOUTS_UPDATED", "PLAYER_ENTERING_WORLD", "PLAYER_REGEN_DISABLED")
    hideIcons(): void {
        if (!this.viewer.isRunByOtherAddon() && !this.settings.get("shouldShowCooldownManager")) this.viewer.hideIcons();
    }

    @OnEvent("setting.changed")
    applyShowSetting(key: string): void {
        if (key !== "shouldShowCooldownManager" || this.viewer.isRunByOtherAddon()) return;
        if (this.settings.get("shouldShowCooldownManager")) this.viewer.showIcons();
        else this.viewer.hideIcons();
    }

    /** Blizzard keeps a layout for each spec, and what the addon wrote can be overwritten: asked again at each login. */
    @OnGameEvent("ACTIVE_PLAYER_SPECIALIZATION_CHANGED")
    waitToTrackBuffs(): void {
        this.isTrackingDue = true;
        this.clock.runAfter(TRACK_DELAY, () => this.trackBuffs());
    }

    /** In peace: a fight or layouts still loading put it off until the end of the next fight. */
    @OnGameEvent("PLAYER_REGEN_ENABLED")
    trackBuffs(): void {
        if (!this.isTrackingDue || this.player.isInCombat()) return;
        if (this.viewer.trackBuffs(this.listWantedNames())) this.isTrackingDue = false;
    }

    /** The buffs of the table of this class, by name: every rank goes by one. */
    private listWantedNames(): string[] {
        const ids = [...this.seals.listSeals(), ...this.trackings.listTrackings(), ...this.addedSpells.listAdded("missingBuff")];
        for (const classBuff of this.classBuffs.getClassBuffs()) ids.push(classBuff.id, ...(classBuff.categoryMembers ?? []));
        const names = new LuaSet<string>();
        for (const id of ids) {
            const name = this.spells.getSpellName(this.addedSpells.getEffectiveId(id));
            if (name !== undefined && name !== "") names.add(name);
        }
        const list: string[] = [];
        for (const name of names) list.push(name);
        return list;
    }
}
