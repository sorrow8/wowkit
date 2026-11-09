// The page of the addon in the Settings panel: the settings that are not about one type or one spell. What is on and off,
// and how each type and spell looks, is the table's (/gb); its button is at the top.

import type { AddonLocale } from "../locale/locale.interface";
import type { ClassBuffsService } from "../reminders/class-buffs.service";
import type { AddonSettingsService, AddonSettings } from "../settings/settings.interface";
import type { ControlsService, OptionsPage, WidgetsService } from "@wowkit/ui";
import type { BarsSection } from "./bars.section";
import type { AnimationSection } from "./animation.section";
import type { GlowsSection } from "./glows.section";
import type { StyleTableService } from "./style-table.service";
import type { WelcomeService } from "./welcome.service";
import type { WhatsNewService } from "./whats-new.service";
import type { ReminderControlsService } from "./reminder-controls.service";
import type { WeaponSection } from "./weapon.section";

/** How the messages come and go. */
const MESSAGE_SWITCHES = [
    ["isMessageZoomInOn", "OPT_MESSAGE_ZOOM_IN", "TIP_MESSAGE_ZOOM_IN"],
    ["isMessageZoomOutOn", "OPT_MESSAGE_ZOOM_OUT", "TIP_MESSAGE_ZOOM_OUT"],
    ["isMessageFadePulseOn", "OPT_MESSAGE_FADE_PULSE", "TIP_MESSAGE_FADE_PULSE"],
    ["isMessageSizePulseOn", "OPT_MESSAGE_SIZE_PULSE", "TIP_MESSAGE_SIZE_PULSE"],
] as const;

/** Where a player reports a problem. */
const ISSUES_URL = "https://github.com/vattiss/wowkit/issues";

export class RemindersPage implements OptionsPage {
    constructor(
        private readonly locale: AddonLocale,
        private readonly classBuffs: ClassBuffsService,
        private readonly settings: AddonSettingsService,
        private readonly controls: ControlsService<AddonSettings>,
        private readonly reminderControls: ReminderControlsService,
        private readonly weaponSection: WeaponSection,
        private readonly glowsSection: GlowsSection,
        private readonly widgets: WidgetsService,
        private readonly table: StyleTableService,
        private readonly barsSection: BarsSection,
        private readonly animationSection: AnimationSection,
        private readonly whatsNew: WhatsNewService,
        private readonly welcome: WelcomeService,
    ) {}

    buildPage(category: SettingsCategory, layout: SettingsLayout): void {
        // What's new first: the window of the changes, and whether it opens by itself
        this.addWhatsNew(category, layout);
        this.reminderControls.addHeader(layout, "HDR_REMINDERS");
        this.widgets.addButton(
            layout,
            this.locale.getText("OPT_TABLE"),
            this.locale.getText("BTN_OPEN"),
            () => this.table.toggle(),
            this.locale.getText("TIP_TABLE"),
        );
        this.controls.addSwitchCheckbox(
            category,
            "showTooltipIds",
            this.locale.getText("OPT_TOOLTIP_IDS"),
            this.locale.getText("TIP_TOOLTIP_IDS"),
        );

        this.animationSection.addAnimationSection(category);

        this.reminderControls.addHeader(layout, "HDR_CHARACTER");
        this.controls.addCheckbox(
            category,
            "isDisabled",
            this.locale.getText("OPT_DISABLE"),
            this.locale.getText("TIP_DISABLE"),
            false,
            () => this.settings.get("isDisabled"),
            (isChecked) => this.settings.change("isDisabled", isChecked),
        );
        this.reminderControls.addSwitch(category, "shouldStayQuietInTowns", "OPT_STAY_QUIET_IN_TOWNS", "TIP_STAY_QUIET_IN_TOWNS");
        this.reminderControls.addSwitch(category, "isAfkRainbowOn", "OPT_AFK_RAINBOW", "TIP_AFK_RAINBOW");
        this.reminderControls.addSwitch(category, "shouldShowGreeting", "OPT_SHOW_GREETING", "TIP_SHOW_GREETING");
        this.reminderControls.addSwitch(category, "shouldShowCooldownManager", "OPT_SHOW_COOLDOWN_MANAGER", "TIP_SHOW_COOLDOWN_MANAGER");

        // The party members: a part of the buff reminder that is not one buff
        if (this.classBuffs.getClassBuffs().some((classBuff) => classBuff.party !== undefined)) {
            this.reminderControls.addHeader(layout, "HDR_BUFFS");
            // Each switch with the number of members its group versions wait for, under it
            const hasGroupVersion = this.classBuffs.getClassBuffs().some((classBuff) => classBuff.party?.groupIds !== undefined);
            const partySwitch = this.reminderControls.addSwitch(category, "showPartyBuffs", "OPT_PARTY_BUFFS", "TIP_PARTY_BUFFS");
            if (hasGroupVersion)
                this.reminderControls.addGroupMin(category, "partyGroupFrom", "TIP_PARTY_GROUP_MIN", partySwitch, "showPartyBuffs");
            const raidSwitch = this.reminderControls.addSwitch(category, "showRaidBuffs", "OPT_RAID_BUFFS", "TIP_RAID_BUFFS");
            if (hasGroupVersion)
                this.reminderControls.addGroupMin(category, "raidGroupFrom", "TIP_RAID_GROUP_MIN", raidSwitch, "showRaidBuffs");
        }

        this.weaponSection.addWeaponSection(category, layout);
        this.glowsSection.addGlowsSection(category, layout);

        this.addMessages(category, layout);

        // The bars last: eight switches and eight more for the faded bars
        this.barsSection.addBarsSection(category, layout);
        this.barsSection.addFadedSection(category, layout);
    }

    /** How the messages at the top of the screen come: their words and colors are the table's. */
    private addMessages(category: SettingsCategory, layout: SettingsLayout): void {
        this.reminderControls.addHeader(layout, "HDR_MESSAGES");
        this.controls.addSlider(
            category,
            "messageSize",
            this.locale.getText("OPT_MESSAGE_SIZE"),
            this.locale.getText("TIP_MESSAGE_SIZE"),
            { min: 50, max: 200, step: 5, defaultValue: 100 },
            (value) => string.format("%d%%", value),
            () => this.settings.get("messageSize"),
            (value) => this.settings.change("messageSize", value),
        );
        this.controls.addSlider(
            category,
            "messageTop",
            this.locale.getText("OPT_MESSAGE_TOP"),
            this.locale.getText("TIP_MESSAGE_TOP"),
            { min: 0, max: 1000, step: 10, defaultValue: 180 },
            (value) => string.format("%d", value),
            () => this.settings.get("messageTop"),
            (value) => this.settings.change("messageTop", value),
        );
        for (const [key, label, tip] of MESSAGE_SWITCHES) {
            this.controls.addSwitchCheckbox(category, key, this.locale.getText(label), this.locale.getText(tip));
        }
        this.controls.addSlider(
            category,
            "messagePulseSpeed",
            this.locale.getText("OPT_MESSAGE_PULSE_SPEED"),
            this.locale.getText("TIP_MESSAGE_PULSE_SPEED"),
            { min: 50, max: 200, step: 5, defaultValue: 100 },
            (value) => string.format("%d%%", value),
            () => this.settings.get("messagePulseSpeed"),
            (value) => this.settings.change("messagePulseSpeed", value),
        );
        this.controls.addSwitchCheckbox(
            category,
            "isOneLinePerType",
            this.locale.getText("OPT_ONE_LINE_PER_TYPE"),
            this.locale.getText("TIP_ONE_LINE_PER_TYPE"),
        );
    }

    /** The button to the What's new window, and the switch of its opening by itself after an update. */
    private addWhatsNew(category: SettingsCategory, layout: SettingsLayout): void {
        this.widgets.addButton(
            layout,
            this.locale.getText("OPT_WHATS_NEW"),
            this.locale.getText("BTN_OPEN"),
            () => this.whatsNew.open(),
            this.locale.getText("TIP_WHATS_NEW"),
        );
        // The same choice as the box at the bottom of the window, the other way round
        this.controls.addCheckbox(
            category,
            "showWhatsNew",
            this.locale.getText("OPT_SHOW_WHATS_NEW"),
            this.locale.getText("TIP_SHOW_WHATS_NEW"),
            true,
            () => !this.whatsNew.isOff(),
            (isChecked) => this.whatsNew.setOff(!isChecked),
        );
        this.widgets.addButton(
            layout,
            this.locale.getText("OPT_DEBUG_WELCOME"),
            this.locale.getText("BTN_OPEN"),
            () => this.welcome.open(),
            this.locale.getText("TIP_DEBUG_WELCOME"),
        );
        this.widgets.addLinkButton(layout, this.locale.getText("INFO_ISSUES"), ISSUES_URL);
    }
}
