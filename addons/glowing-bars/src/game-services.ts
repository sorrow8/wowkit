// The services of the shared packages that the addon runs on: what the game says, the bars, the glows.
import type { Addon } from "@wowkit/core";
import {
    ActionBarsService,
    AurasService,
    BagsService,
    BarFadeService,
    BarRefreshService,
    ButtonRegistryService,
    ButtonSearchService,
    ClockService,
    CooldownViewerService,
    CooldownsService,
    GlowService,
    NoticeService,
    PartyService,
    PlayerService,
    SavedVariablesService,
    SpellBookService,
    SpellCastService,
    SpellDetailsService,
    SpellRefreshService,
    SpellsService,
    TooltipService,
    WeaponEnchantsService,
} from "@wowkit/wow";
import { registerPublicApi } from "./api/public-api";
import { SAVED_VARIABLES_NAME } from "./settings/settings.constants";

export function makeGame(addon: Addon, addonName: string) {
    const clock = addon.register(new ClockService());
    const player = addon.register(new PlayerService());
    const party = addon.register(new PartyService());
    const bags = addon.register(new BagsService());
    const savedVariables = addon.register(new SavedVariablesService(SAVED_VARIABLES_NAME));
    const spellBook = addon.register(new SpellBookService(addon.events));
    const spells = addon.register(new SpellsService(spellBook, addon.events));
    addon.register(new SpellCastService(player, spells, addon.events));
    addon.register(new SpellRefreshService(spells, clock, addon.events));
    const spellDetails = addon.register(new SpellDetailsService());
    const cooldowns = addon.register(new CooldownsService());
    const auras = addon.register(new AurasService(spells));
    const cooldownViewer = addon.register(new CooldownViewerService(spells));
    const buttonRegistry = addon.register(new ButtonRegistryService());
    registerPublicApi(buttonRegistry);
    const actionBars = addon.register(new ActionBarsService(clock, spells, addon.events, buttonRegistry));
    const barRefresh = addon.register(new BarRefreshService(actionBars, clock, buttonRegistry));
    const buttonSearch = addon.register(new ButtonSearchService(buttonRegistry, actionBars));
    const weaponEnchants = addon.register(new WeaponEnchantsService());
    const glow = addon.register(new GlowService(actionBars));
    const barFade = addon.register(new BarFadeService(glow, buttonRegistry));
    const notice = addon.register(new NoticeService(addonName));
    const tooltips = addon.register(new TooltipService());
    return {
        clock,
        player,
        party,
        bags,
        savedVariables,
        spells,
        spellDetails,
        cooldowns,
        auras,
        cooldownViewer,
        actionBars,
        barRefresh,
        weaponEnchants,
        glow,
        barFade,
        notice,
        tooltips,
        buttonSearch,
    };
}
export type Game = ReturnType<typeof makeGame>;
