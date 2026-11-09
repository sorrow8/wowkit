// What the specs of the table of looks share: a warrior with Recklessness, and the way to the table and its rows.
import { learnSpell, playAs, WARRIOR, type ClientState, type FakeFrame, type SpellDefinition, type World } from "@wowkit/test-kit";

export const RECKLESSNESS: SpellDefinition = {
    id: 1719,
    name: "Recklessness",
    rank: 1,
    icon: 132109,
    cooldownSeconds: 300,
    isHelpful: true,
};

/** Recklessness is used in the fight and comes back: the moment it glows in combat. */
export function useAndRecoverRecklessness(world: World): void {
    world.state.cooldowns[RECKLESSNESS.id] = { start: 0, duration: 99999 };
    world.advance(0.5);
    world.state.cooldowns[RECKLESSNESS.id] = undefined;
    world.advance(0.5);
}

export function setUpWarrior(state: ClientState): void {
    playAs(state, WARRIOR);
    learnSpell(state, RECKLESSNESS);
    state.bars[2] = RECKLESSNESS.id;
    state.isInCombat = true;
}

/** The widgets of the row with this label in the open table. */
export interface Row {
    swatch: FakeFrame;
    glowPercent: FakeFrame;
    message: FakeFrame;
    enabled: FakeFrame;
    sound: FakeFrame;
    reset: FakeFrame;
}

/** The text with this label: the text widgets are not frames of their own, they belong to the frame that made them. */
export function findLabel(world: World, label: string): FakeFrame | undefined {
    // The rows first: a type's small heading in the list of spells says the same as its row
    const isRow = (frame: FakeFrame) => world.frames.some((other) => other.parent === frame && other.frameType === "CheckButton");
    for (const frame of [...world.frames.filter((frame) => isRow(frame)), ...world.frames]) {
        const found = frame.fontStrings.find((text) => text.text === label || text.text === `${label} (alpha)`);
        if (found !== undefined) return found;
    }
    return undefined;
}

export function findRow(world: World, label: string): Row {
    const row = findLabel(world, label)?.parent;
    if (row === undefined) throw new Error(`no row for ${label}`);
    const parts = world.frames.filter((frame) => frame.parent === row);
    const buttons = parts.filter((frame) => frame.frameType === "Button" && frame.template === "UIPanelButtonTemplate");
    return {
        swatch: parts.find((frame) => frame.frameType === "Button" && frame.template === undefined)!,
        glowPercent: parts.find((frame) => frame.frameType === "EditBox")!,
        message: parts.filter((frame) => frame.frameType === "CheckButton")[0]!,
        enabled: parts.filter((frame) => frame.frameType === "CheckButton")[1]!,
        sound: buttons[0]!,
        reset: buttons[1]!,
    };
}

export function toggleTable(): void {
    SlashCmdList["GLOWINGBARS"]!("", undefined as never);
}

export function readSaved(world: World, section: "styles" | "spellStyles"): Record<string, Record<string, unknown> | undefined> {
    return world.getSavedSettings()?.[section] as Record<string, Record<string, unknown> | undefined>;
}

/** Switches a type or a spell on or off in the Enabled column of the table, the way a click does (the table is opened). */
export function switchInTable(world: World, label: string, isOn: boolean): void {
    const window = world.findFrame((frame) => frame.name === "GlowingBarsLooks");
    if (window?.isShown !== true) toggleTable();
    const row = findLabel(world, label)?.parent;
    if (row === undefined) throw new Error(`no row for ${label}`);
    const enabled = world.frames.filter((frame) => frame.parent === row && frame.frameType === "CheckButton")[1]!;
    enabled.isChecked = isOn;
    enabled.scripts.OnClick!(enabled);
}
