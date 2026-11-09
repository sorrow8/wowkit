// A paladin's Templar's Bulwark when the player is about to die. The game hides the player's health from addons, so the
// glow is lit on the button all the while, ready and in a fight, and its opacity comes from that hidden health through a
// curve (see ValueCurvesService), as Execute's in Defensive Stance does: it shows only at 10% health or below.
import { Interval } from "@wowkit/core";
import type {
    ActionBarsService,
    ButtonGlow,
    GlowAnimation,
    GlowService,
    PlayerService,
    SpellsService,
    ValueCurvesService,
} from "@wowkit/wow";
import { Paladin } from "@wowkit/wow-data";
import type { IdleService } from "../character/idle.service";
import type { AddonSettingsService } from "../settings/settings.interface";
import type { StyleService } from "../settings/style.service";
import type { GlowCuesService } from "./glow-cues.service";

/** The curve ends here: its short ramp is over at 10% health, where the glow is full. */
const CURVE_END_PERCENT = 12;

export class LowHealthDefenseService {
    private glow: ButtonGlow | undefined;
    private glowAnimation: GlowAnimation | undefined;
    /** The one spell of the glow: the same list at every look. */
    private readonly spellIds: number[] = [];

    constructor(
        private readonly player: PlayerService,
        private readonly spells: SpellsService,
        private readonly actionBars: ActionBarsService,
        private readonly glows: GlowService,
        private readonly curves: ValueCurvesService,
        private readonly styles: StyleService,
        private readonly settings: AddonSettingsService,
        private readonly glowCues: GlowCuesService,
        private readonly idle: IdleService,
    ) {}

    /** The opacity is only true for a moment: it is asked of the game again and again. */
    @Interval(250)
    updateGlow(): void {
        const spellId = this.findBulwark();
        const style = spellId !== undefined ? this.styles.getStyle("proc", spellId) : undefined;
        const alpha =
            spellId !== undefined && style !== undefined
                ? this.curves.getHealthAlpha("player", CURVE_END_PERCENT, "below", style.glowPercent / 100)
                : undefined;
        if (spellId === undefined || style === undefined || alpha === undefined) {
            this.glow?.clear();
            return;
        }
        const glow = this.takeGlow(style.animation);
        this.spellIds[0] = spellId;
        glow.show(this.spellIds, style.color);
        glow.setAlpha(alpha);
    }

    /** The Bulwark to light: a paladin's, learned, on a bar, switched on and ready, in a fight. */
    private findBulwark(): number | undefined {
        if (this.player.getClassToken() !== "PALADIN" || !this.player.isInCombat()) return undefined;
        if (!this.settings.get("isProcEnabled") || this.settings.get("isDisabled") || this.idle.shouldStayIdle(false)) return undefined;
        if (this.settings.get("enabledSpells")[string.format("%d", Paladin.TemplarsBulwark)] === false) return undefined;
        const spellId = this.spells.resolve(Paladin.TemplarsBulwark);
        if (spellId === undefined || !this.actionBars.isOnBars(spellId)) return undefined;
        return this.glowCues.isOnCooldown(spellId) ? undefined : spellId;
    }

    /** The glow of this animation: one made for another goes out. */
    private takeGlow(animation: GlowAnimation): ButtonGlow {
        if (this.glow !== undefined && this.glowAnimation === animation) return this.glow;
        this.glow?.clear();
        this.glow = this.glows.createButtonGlow(`lowHealthDefense:${animation}`, animation, (button) => this.isBarShown(button));
        this.glowAnimation = animation;
        return this.glow;
    }

    private isBarShown(button: ActionButton): boolean {
        const bar = this.actionBars.getBarNumber(button);
        return bar === undefined || this.settings.get("barsThatGlow")[string.format("%d", bar)] !== false;
    }
}
