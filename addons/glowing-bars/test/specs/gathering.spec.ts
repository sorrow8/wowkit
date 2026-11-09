import {
    beforeEach,
    createWorld,
    describe,
    expect,
    it,
    learnSpell,
    playAs,
    HUNTER,
    PALADIN,
    type SpellDefinition,
    type World,
} from "@wowkit/test-kit";
import { switchInTable } from "./table.helpers";

const FIND_MINERALS: SpellDefinition = { id: 2580, name: "Find Minerals", rank: 1, icon: 136025, isHelpful: true };
const FIND_HERBS: SpellDefinition = { id: 2383, name: "Find Herbs", rank: 1, icon: 133939, isHelpful: true };
const FIND_TREASURE: SpellDefinition = { id: 2481, name: "Find Treasure", rank: 1, icon: 135725, isHelpful: true };
const TRACK_BEASTS: SpellDefinition = { id: 1494, name: "Track Beasts", rank: 1, icon: 132328, isHelpful: true };

describe("a dwarf with Find Treasure on the bar", () => {
    let world!: World;

    beforeEach(() => {
        world = createWorld((state) => {
            playAs(state, PALADIN);
            learnSpell(state, FIND_TREASURE);
            state.bars[1] = FIND_TREASURE.id;
        });
        world.advance(1);
    });

    it("sees it glow while no tracking is on", () => {
        expect(world.glowsOn(1)).toBe(1);
    });

    it("sees it stop glowing once it is on", () => {
        world.state.auras = [{ name: FIND_TREASURE.name, spellId: FIND_TREASURE.id, expirationTime: 0 }];
        world.fire("UNIT_AURA", "player");
        world.advance(1);
        expect(world.glowsOn(1)).toBe(0);
    });
});

describe("a hunter who is a miner and a herbalist", () => {
    let world!: World;

    beforeEach(() => {
        world = createWorld((state) => {
            playAs(state, HUNTER);
            for (const spell of [FIND_MINERALS, FIND_HERBS, TRACK_BEASTS]) learnSpell(state, spell);
            state.bars[1] = FIND_MINERALS.id;
            state.bars[2] = FIND_HERBS.id;
            state.bars[3] = TRACK_BEASTS.id;
        });
        world.advance(1);
    });

    function putOn(spell: SpellDefinition): void {
        world.state.auras = [{ name: spell.name, spellId: spell.id, expirationTime: 0 }];
        world.fire("UNIT_AURA", "player");
        world.advance(1);
    }

    it("sees both gathering trackings glow while no tracking is on", () => {
        expect(world.glowsOn(1)).toBe(1);
        expect(world.glowsOn(2)).toBe(1);
        expect(world.glowsOn(3)).toBe(0);
    });

    it("sees none glow once one of them is on", () => {
        putOn(FIND_HERBS);
        expect(world.glowsOn(1)).toBe(0);
        expect(world.glowsOn(2)).toBe(0);
    });

    it("is not told to find minerals while tracking beasts", () => {
        putOn(TRACK_BEASTS);
        expect(world.glowsOn(1)).toBe(0);
        expect(world.glowsOn(2)).toBe(0);
    });

    it("sees no glow once the trackings are switched off in the table", () => {
        switchInTable(world, "Missing tracking", false);
        world.advance(1);
        expect(world.glowsOn(1)).toBe(0);
    });
});

describe("a character with no gathering profession", () => {
    it("has no tracking row in the table", () => {
        const world = createWorld((state) => playAs(state, HUNTER));
        SlashCmdList["GLOWINGBARS"]!("", undefined as never);
        expect(world.findFrame((frame) => frame.fontStrings.some((text) => text.text === "Missing tracking"))).toBeUndefined();
    });
});

describe("a miner who added Find Minerals as a missing buff before it was on the list", () => {
    it("has a row for each, so the one added by hand can be seen, styled and taken out", () => {
        const world = createWorld(
            (state) => {
                playAs(state, HUNTER);
                learnSpell(state, FIND_MINERALS);
            },
            { addedSpells: [{ id: FIND_MINERALS.id, reminderType: "missingBuff" }] },
        );
        SlashCmdList["GLOWINGBARS"]!("", undefined as never);
        const rows = world.frames.filter((frame) =>
            frame.fontStrings.some((text) => string.find(text.text ?? "", "Find Minerals", 1, true)[0] !== undefined),
        );
        expect(rows.length).toBe(2);
    });
});
