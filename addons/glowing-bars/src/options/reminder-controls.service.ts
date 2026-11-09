// The controls every reminder has on the Reminders page, in this addon's words: a switch, and the number of members a
// group buff waits for. Built on the generic controls of @wowkit/ui. The look of a reminder (color, glow %, message,
// sound) is the table's.
import type { ControlsService } from "@wowkit/ui";
import type { AddonLocale } from "../locale/locale.interface";
import type { TextKey } from "../locale/texts.constants";
import { GROUP_FROM_CHOICES } from "../settings/settings.constants";
import type { AddonSettings, AddonSettingsService } from "../settings/settings.interface";

type FeatureKey =
    | "shouldShowGreeting"
    | "shouldStayQuietInTowns"
    | "isAfkRainbowOn"
    | "shouldShowCooldownManager"
    | "isMissingBuffEnabled"
    | "isWeaponBuffEnabled"
    | "showPartyBuffs"
    | "showRaidBuffs"
    | "isOldRankEnabled"
    | "isLowReagentEnabled"
    | "isReadyCooldownEnabled"
    | "showCooldownsAtFightStart"
    | "isProcEnabled";

export class ReminderControlsService {
    constructor(
        private readonly controls: ControlsService<AddonSettings>,
        private readonly locale: AddonLocale,
        private readonly settings: AddonSettingsService,
    ) {}

    addHeader(layout: SettingsLayout, label: TextKey): void {
        this.controls.addHeader(layout, this.locale.getText(label));
    }

    /** A switch of a feature, on or off by default as the settings say. */
    addSwitch(category: SettingsCategory, key: FeatureKey, label: TextKey, tooltip: TextKey): SettingsInitializer {
        return this.controls.addSwitchCheckbox(category, key, this.locale.getText(label), this.locale.getText(tooltip));
    }

    /**
     * From how many missing a buff its group version is asked for (1 to 5), under the switch `parent` of the party or the
     * raid buffs, greyed out while that switch is off.
     */
    addGroupMin(
        category: SettingsCategory,
        key: "partyGroupFrom" | "raidGroupFrom",
        tooltip: TextKey,
        parent: SettingsInitializer,
        parentKey: "showPartyBuffs" | "showRaidBuffs",
    ): void {
        const initializer = this.controls.addDropdown(
            category,
            key,
            this.locale.getText("OPT_GROUP_FROM"),
            this.locale.getText(tooltip),
            string.format("%d", this.settings.getDefault(key)),
            () => string.format("%d", this.settings.get(key)),
            (value) => this.settings.change(key, tonumber(value) ?? this.settings.getDefault(key)),
            () =>
                GROUP_FROM_CHOICES.map((count): [string, string] => [
                    string.format("%d", count),
                    string.format(this.locale.getText(count === 1 ? "OPT_MEMBER_MISSING" : "OPT_MEMBERS_MISSING"), count),
                ]),
            true,
        );
        initializer.SetParentInitializer(parent, () => this.settings.get(parentKey));
    }
}
