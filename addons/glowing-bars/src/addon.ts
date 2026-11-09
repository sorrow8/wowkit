// Putting the addon together: every service is made here, with the services it needs, dependencies first.
// The order of the lines is also the order the lifecycle hooks run in. The wiring is split in stages: Lua 5.1 lets a
// function reach at most 60 outer names, and one function naming every service would reach more.
import { makeGame, type Game } from "./game-services";
import { Addon } from "@wowkit/core";
import {
    ControlsService,
    GreetingService,
    LocaleService,
    MessagesService,
    OptionsService,
    SettingsService,
    WidgetsService,
} from "@wowkit/ui";
import { NoticeService, SavedVariablesService, ValueCurvesService } from "@wowkit/wow";
import { AuraWatchService } from "./character/aura-watch.service";
import { BlockedActionService } from "./character/blocked-action.service";
import { BuffMemoryService } from "./character/buff-memory.service";
import { BuffStateService } from "./character/buff-state.service";
import { EquipmentService } from "./character/equipment.service";
import { IdleService } from "./character/idle.service";
import { DefensiveExecuteService } from "./glows/defensive-execute.service";
import { LowHealthDefenseService } from "./glows/low-health-defense.service";
import { RosterService } from "./character/roster.service";
import { CooldownTrackerService } from "./glows/cooldown-tracker.service";
import { AddedSpellsService } from "./glows/added-spells.service";
import { GlowCuesService } from "./glows/glow-cues.service";
import { AfkRainbowService } from "./glows/afk-rainbow.service";
import { StanceProcsService } from "./glows/stance-procs.service";
import { BuffKnowledgeService } from "./knowledge/buff-knowledge.service";
import { TEXTS } from "./locale/texts.constants";
import { BarsSection } from "./options/bars.section";
import { AnimationSection } from "./options/animation.section";
import { GlowsSection } from "./options/glows.section";
import { IdTooltipService } from "./options/id-tooltip.service";
import { ReminderControlsService } from "./options/reminder-controls.service";
import { StyleChoicesService } from "./options/style-choices.service";
import { StyleEditsService } from "./options/style-edits.service";
import { StyleRowsService } from "./options/style-rows.service";
import { StyleTableService } from "./options/style-table.service";
import { StyleWindowService } from "./options/style-window.service";
import { TableCommand } from "./options/table-command";
import { ScanReport } from "./options/scan-report";
import { WelcomeService } from "./options/welcome.service";
import { WhatsNewService } from "./options/whats-new.service";
import { RemindersPage } from "./options/reminders.page";
import { WeaponSection } from "./options/weapon.section";
import { ReagentsService } from "./reagents/reagents.service";
import { BuffReminderService } from "./reminders/buff-reminder.service";
import { ClassBuffsService } from "./reminders/class-buffs.service";
import { AddedRemindersService } from "./reminders/added-reminders.service";
import { FedBuffsService } from "./reminders/fed-buffs.service";
import { BelowLimitsService } from "./reminders/below-limits.service";
import { LowStockService } from "./reminders/low-stock.service";
import { OutdatedRanksService } from "./reminders/outdated-ranks.service";
import { SealReminderService } from "./reminders/seal-reminder.service";
import { TrackingReminderService } from "./reminders/tracking-reminder.service";
import { PartyBuffsService } from "./reminders/party-buffs.service";
import { WeaponChoiceService } from "./reminders/weapon/weapon-choice.service";
import { WEAPON_BUFF_BY_SPELL } from "./reminders/weapon/weapon-buffs.constants";
import { WeaponMemoryService } from "./reminders/weapon/weapon-memory.service";
import { WeaponReadingService } from "./reminders/weapon/weapon-reading.service";
import { WeaponReminderService } from "./reminders/weapon/weapon-reminder.service";
import { ACCOUNT_VARIABLES_NAME, createDefaultSettings, repairSettings } from "./settings/settings.constants";
import type { AddonSettings } from "./settings/settings.interface";
import { StyleService } from "./settings/style.service";
import { EnabledService } from "./settings/enabled.service";
import { DisplayService } from "./tick/display.service";
import { FindRemindersService } from "./tick/find-reminders.service";
import { NoticesService } from "./tick/notices.service";
import { RefreshService } from "./tick/refresh.service";
import { ShowRemindersService } from "./tick/show-reminders.service";
import { TickService } from "./tick/tick.service";

export function startAddon(addonName: string): void {
    const addon = new Addon(addonName);
    const game = makeGame(addon, addonName);
    const texts = makeTexts(addon, game);
    const buffs = makeBuffs(addon, game, texts);
    const reminders = makeReminders(addon, addonName, game, texts, buffs);
    const finder = makeTick(addon, addonName, game, texts, buffs, reminders);
    makeOptions(addon, addonName, game, texts, buffs, reminders, finder);
    addon.start();
}

/** Settings, texts and messages. */
function makeTexts(addon: Addon, game: Game) {
    const settings = addon.register(
        new SettingsService<AddonSettings>(game.savedVariables, addon.events, createDefaultSettings, repairSettings),
    );
    const locale = addon.register(new LocaleService(TEXTS));
    const messages = addon.register(new MessagesService(game.notice, locale.getText("TITLE")));
    // At each login it tells where the table is, unless the player switched it off
    addon.register(new GreetingService(messages, locale.getText("INIT"), { settings, key: "shouldShowGreeting" }));
    const styles = addon.register(new StyleService(game.spells, settings));
    return { settings, locale, messages, styles };
}
type Texts = ReturnType<typeof makeTexts>;

/** What the addon knows about the player's buffs. */
function makeBuffs(addon: Addon, game: Game, texts: Texts) {
    const idle = addon.register(new IdleService(game.player));
    const classBuffs = addon.register(new ClassBuffsService(game.player, game.spells, texts.settings));
    const knowledge = addon.register(new BuffKnowledgeService(classBuffs, game.spells));
    const memory = addon.register(new BuffMemoryService(game.spells, game.clock, knowledge));
    const state = addon.register(new BuffStateService(game.auras, game.spells, game.player, memory, knowledge));
    return { idle, classBuffs, state };
}
type Buffs = ReturnType<typeof makeBuffs>;

/** What the addon reminds about. */
function makeReminders(addon: Addon, addonName: string, game: Game, texts: Texts, buffs: Buffs) {
    const { settings } = texts;
    const buff = addon.register(
        new BuffReminderService(buffs.state, game.spells, game.player, game.actionBars, buffs.classBuffs, settings),
    );
    const limits = addon.register(new BelowLimitsService(settings));
    const reagents = addon.register(new ReagentsService(game.bags, game.spells, limits));
    const party = addon.register(
        new PartyBuffsService(buffs.state, game.spells, game.clock, game.party, game.player, buffs.classBuffs, reagents, settings, buff),
    );
    const weaponChoice = addon.register(new WeaponChoiceService(game.player, game.spells, settings, game.actionBars, game.bags));
    const weaponMemory = addon.register(new WeaponMemoryService());
    const weaponReading = addon.register(new WeaponReadingService(buffs.state, game.weaponEnchants, weaponChoice));
    const weapon = addon.register(new WeaponReminderService(game.clock, game.weaponEnchants, weaponChoice, weaponMemory, weaponReading));
    const outdatedRanks = addon.register(new OutdatedRanksService(game.actionBars, game.spells, settings));
    const addedSpells = addon.register(new AddedSpellsService(game.spells, settings, game.cooldowns, reagents));
    // A spell the player gave another ID is asked of that ID everywhere: buffs, weapon buffs, reagents, cooldowns, procs
    game.spells.useIdAlias((spellId) => addedSpells.getEffectiveId(spellId));
    const tracker = addon.register(new CooldownTrackerService(game.spells, game.cooldowns, game.clock));
    addon.register(new AfkRainbowService(game.buttonSearch, game.glow, game.clock, game.player, settings));
    const stanceProcs = addon.register(new StanceProcsService(game.player, game.spells, game.clock, addon.events));
    const glowCues = addon.register(
        new GlowCuesService(game.player, game.spells, game.spellDetails, game.actionBars, tracker, settings, addedSpells, stanceProcs),
    );
    const fedBuffs = addon.register(
        new FedBuffsService(addedSpells, game.spells, buffs.state, game.player, game.clock, settings, game.actionBars),
    );
    texts.styles.useOwnLooks((spellId) => fedBuffs.isFedSpell(spellId));
    texts.styles.useWeaponBuffLooks((spellId) => WEAPON_BUFF_BY_SPELL.get(spellId)?.id ?? spellId);
    const { spells, actionBars, weaponEnchants, bags, player } = game;
    const added = addon.register(
        new AddedRemindersService(addedSpells, spells, actionBars, buffs.state, weaponEnchants, bags, settings, reagents, fedBuffs, player),
    );
    const seal = addon.register(new SealReminderService(game.spells, game.actionBars, buffs.state, game.player, settings, addedSpells));
    const tracking = addon.register(new TrackingReminderService(game.spells, game.actionBars, buffs.state, settings, addedSpells));
    return { buff, reagents, party, weaponChoice, weapon, outdatedRanks, glowCues, addedSpells, added, fedBuffs, limits, seal, tracking };
}
type Reminders = ReturnType<typeof makeReminders>;

/** The tick: find what is due, show it, look again sooner when something changed; and what happens to the player. */
function makeTick(addon: Addon, addonName: string, game: Game, texts: Texts, buffs: Buffs, reminders: Reminders) {
    const { settings, locale, messages, styles } = texts;
    const finder = addon.register(
        new FindRemindersService(
            addon.register(new LowStockService(reminders.addedSpells, game.bags, reminders.limits, settings)),
            game.actionBars,
            buffs.idle,
            game.player,
            game.spells,
            reminders.buff,
            reminders.party,
            reminders.weapon,
            reminders.outdatedRanks,
            reminders.glowCues,
            reminders.reagents,
            reminders.added,
            reminders.seal,
            reminders.tracking,
            settings,
            game.clock,
        ),
    );
    const notices = addon.register(new NoticesService(game.actionBars, game.clock, game.notice, game.spells, locale, styles, settings));
    const { fedBuffs } = reminders;
    const shower = addon.register(
        new ShowRemindersService(game.glow, messages, settings, notices, styles, game.actionBars, game.barFade, game.clock, fedBuffs),
    );
    const tick = addon.register(new TickService(finder, shower, game.player, styles, game.clock));
    const { player, spells, actionBars, glow, notice } = game;
    const curves = new ValueCurvesService();
    addon.register(new DefensiveExecuteService(player, spells, actionBars, glow, notice, curves, styles, settings, locale, buffs.idle));
    addon.register(
        new LowHealthDefenseService(player, spells, actionBars, glow, curves, styles, settings, reminders.glowCues, buffs.idle),
    );
    const refresh = addon.register(new RefreshService(tick, shower, buffs.state, game.clock, game.barRefresh));
    addon.register(new DisplayService(shower, tick));
    addon.register(new EquipmentService(refresh, game.player, game.weaponEnchants, reminders.weapon));
    addon.register(new AuraWatchService(refresh, buffs.state, reminders.weapon));
    addon.register(new RosterService(refresh, reminders.party));
    addon.register(new BlockedActionService(addonName, game.player, messages, locale));
    return finder;
}

/** The table of looks (/gb), and its command. */
function makeTable(addon: Addon, addonName: string, game: Game, texts: Texts, buffs: Buffs, reminders: Reminders) {
    const { locale, messages, styles } = texts;
    const rows = addon.register(
        new StyleRowsService(
            game.player,
            game.spells,
            buffs.classBuffs,
            reminders.weaponChoice,
            reminders.reagents,
            locale,
            styles,
            reminders.glowCues,
            reminders.addedSpells,
            reminders.seal,
            reminders.tracking,
            reminders.fedBuffs,
        ),
    );
    const choices = addon.register(new StyleChoicesService(locale, styles, messages, texts.settings));
    const windows = addon.register(new StyleWindowService(locale, texts.settings));
    const switches = addon.register(new EnabledService(game.spells, buffs.classBuffs, reminders.reagents, texts.settings));
    const tableNotice = addon.register(new NoticeService(`${addonName}-table`));
    const edits = addon.register(
        new StyleEditsService(locale, reminders.addedSpells, tableNotice, switches, rows, styles, reminders.limits, reminders.reagents),
    );
    const table = addon.register(new StyleTableService(locale, styles, rows, messages, choices, windows, edits));
    return table;
}

/** The Settings panel. */
function makeOptions(
    addon: Addon,
    addonName: string,
    game: Game,
    texts: Texts,
    buffs: Buffs,
    reminders: Reminders,
    finder: FindRemindersService,
) {
    const { settings, locale, messages } = texts;
    const controls = addon.register(new ControlsService<AddonSettings>(settings, messages, addonName));
    const widgets = addon.register(
        new WidgetsService(messages, { copy: locale.getText("INFO_COPY"), copied: locale.getText("INFO_COPIED") }),
    );
    const reminderControls = addon.register(new ReminderControlsService(controls, locale, settings));
    addon.register(new IdTooltipService(game.tooltips, settings, locale));
    const weaponSection = addon.register(
        new WeaponSection(locale, game.spells, reminders.weaponChoice, settings, controls, reminderControls),
    );
    const glowsSection = addon.register(new GlowsSection(reminderControls, reminders.glowCues));
    const table = makeTable(addon, addonName, game, texts, buffs, reminders);
    const barsSection = addon.register(new BarsSection(locale, settings, controls, reminderControls));
    const animationSection = addon.register(new AnimationSection(locale, settings, controls));
    const whatsNew = addon.register(
        new WhatsNewService(new SavedVariablesService(ACCOUNT_VARIABLES_NAME), locale, game.clock, game.player),
    );
    const { buttonSearch, glow, clock, player } = game;
    const report = new ScanReport(game.actionBars, game.spells, player, () => finder.findReminders());
    const welcome = addon.register(new WelcomeService(buttonSearch, glow, clock, player, locale, settings, whatsNew, messages, report));
    addon.register(new TableCommand(table, whatsNew, welcome));
    const page = addon.register(
        new RemindersPage(
            locale,
            buffs.classBuffs,
            settings,
            controls,
            reminderControls,
            weaponSection,
            glowsSection,
            widgets,
            table,
            barsSection,
            animationSection,
            whatsNew,
            welcome,
        ),
    );
    addon.register(new OptionsService(messages, locale.getText("TITLE"), page));
}
