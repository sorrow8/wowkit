import {
    ASPECT_OF_THE_HAWK,
    ASPECT_OF_THE_MONKEY,
    createWorld,
    describe,
    expect,
    FORTITUDE,
    INNER_FIRE,
    it,
    learnSpell,
    HUNTER,
    LIGHTNING_SHIELD,
    playAs,
    PRAYER_OF_FORTITUDE,
    PRIEST,
    SHAMAN,
    WARRIOR,
    WATER_SHIELD,
    type CharacterClass,
    type ClientState,
    type SpellDefinition,
    type World,
} from "@wowkit/test-kit";

/** A shaman in a fight, the game hiding the buffs, with Lightning Shield just cast and tracked by the Cooldown Manager. */
function createFightWorld(isTracked: boolean): World {
    const world = createWorld((state) => {
        playAs(state, SHAMAN);
        learnSpell(state, LIGHTNING_SHIELD);
        state.bars[1] = LIGHTNING_SHIELD.id;
        state.isInCombat = true;
        state.areAurasHidden = true;
        if (isTracked) state.trackedBuffs.push({ spellId: LIGHTNING_SHIELD.id, isActive: true });
    });
    world.advance(1);
    world.fire("UNIT_SPELLCAST_SUCCEEDED", "player", "cast-1", LIGHTNING_SHIELD.id);
    world.advance(1);
    return world;
}

describe("a shield the Cooldown Manager tracks, in a fight", () => {
    it("does not glow while its icon says it is up", () => {
        const world = createFightWorld(true);
        expect(world.glowsOn(1)).toBe(0);
    });

    it("glows when its icon says it is gone", () => {
        const world = createFightWorld(true);
        world.state.trackedBuffs[0]!.isActive = false;
        world.advance(1);
        expect(world.glowsOn(1)).toBe(1);
    });

    it("stops glowing when it is cast again and its icon is back", () => {
        const world = createFightWorld(true);
        world.state.trackedBuffs[0]!.isActive = false;
        world.advance(1);
        world.state.trackedBuffs[0]!.isActive = true;
        world.fire("UNIT_SPELLCAST_SUCCEEDED", "player", "cast-2", LIGHTNING_SHIELD.id);
        world.advance(1);
        expect(world.glowsOn(1)).toBe(0);
    });
});

describe("a shield nothing tracks, in a fight", () => {
    it("does not glow, however often the player is hit", () => {
        const world = createFightWorld(false);
        for (let i = 0; i < 4; i++) {
            world.fire("UNIT_COMBAT", "player", "WOUND", "", 50, 1);
            world.advance(3.1);
        }
        expect(world.glowsOn(1)).toBe(0);
    });
});

describe("another buff in a fight", () => {
    /** A character in a fight, with the buffs just cast, their icons up. */
    function createFight(character: CharacterClass, buffs: SpellDefinition[]): World {
        const world = createWorld((state) => {
            playAs(state, character);
            for (const buff of buffs) {
                learnSpell(state, buff);
                state.trackedBuffs.push({ spellId: buff.id, isActive: true });
            }
            state.bars[1] = buffs[0]!.id;
            state.isInCombat = true;
            state.areAurasHidden = true;
        });
        world.advance(1);
        world.fire("UNIT_SPELLCAST_SUCCEEDED", "player", "cast-1", buffs[0]!.id);
        world.advance(1);
        return world;
    }

    it("glows when its icon says it is gone", () => {
        const world = createFight(PRIEST, [INNER_FIRE]);
        world.state.trackedBuffs[0]!.isActive = false;
        world.advance(1);
        expect(world.glowsOn(1)).toBe(1);
    });

    it("of a category glows when the icons of all the members the player knows are out", () => {
        const world = createFight(PRIEST, [FORTITUDE]);
        world.state.trackedBuffs[0]!.isActive = false;
        world.advance(1);
        expect(world.glowsOn(1)).toBe(1);
    });

    it("of a category glows when the members with an icon are out, whatever a member without one does", () => {
        const world = createWorld((state) => {
            playAs(state, PRIEST);
            learnSpell(state, FORTITUDE);
            learnSpell(state, PRAYER_OF_FORTITUDE);
            state.bars[1] = FORTITUDE.id;
            state.isInCombat = true;
            state.areAurasHidden = true;
            state.trackedBuffs.push({ spellId: FORTITUDE.id, isActive: true });
        });
        world.advance(1);
        world.fire("UNIT_SPELLCAST_SUCCEEDED", "player", "cast-1", FORTITUDE.id);
        world.advance(1);
        world.state.trackedBuffs[0]!.isActive = false;
        world.advance(1);
        expect(world.glowsOn(1)).toBe(1);
    });

    it("of a category does not glow when a member without an icon comes before one whose icon is up", () => {
        const world = createWorld((state) => {
            playAs(state, HUNTER);
            learnSpell(state, ASPECT_OF_THE_HAWK);
            learnSpell(state, ASPECT_OF_THE_MONKEY);
            learnSpell(state, FORTITUDE);
            state.bars[1] = ASPECT_OF_THE_HAWK.id;
            state.isInCombat = true;
            state.areAurasHidden = true;
            state.trackedBuffs.push({ spellId: ASPECT_OF_THE_MONKEY.id, isActive: true });
        });
        world.advance(1);
        // Something else is remembered: the empty list is the game hiding the auras
        world.fire("UNIT_SPELLCAST_SUCCEEDED", "player", "cast-1", FORTITUDE.id);
        world.advance(1);
        expect(world.glowsOn(1)).toBe(0);
    });

    it("of a category does not glow while another member's icon is up", () => {
        const world = createFight(HUNTER, [ASPECT_OF_THE_HAWK, ASPECT_OF_THE_MONKEY]);
        world.state.trackedBuffs[0]!.isActive = false;
        world.advance(1);
        expect(world.glowsOn(1)).toBe(0);
    });
});

describe("the Cooldown Manager at login", () => {
    it("is turned on for every class, and kept out of sight", () => {
        const world = createWorld((state) => playAs(state, WARRIOR));
        world.advance(1);
        expect(world.state.cvars.cooldownViewerEnabled).toBe(true);
        expect(world.state.viewerAlpha).toBe(0);
    });

    it("is kept out of sight for a player who had it on too", () => {
        const world = createWorld((state) => {
            playAs(state, SHAMAN);
            state.cvars.cooldownViewerEnabled = true;
        });
        world.advance(1);
        expect(world.state.viewerAlpha).toBe(0);
    });

    it("is left to EllesmereUI when its Cooldown Manager is loaded, but the buffs are still moved", () => {
        const world = createWorld((state) => {
            playAs(state, SHAMAN);
            state.loadedAddons.EllesmereUICooldownManager = true;
            learnSpell(state, LIGHTNING_SHIELD);
            state.buffCatalog.push({ spellId: LIGHTNING_SHIELD.id, isHiddenByDefault: true });
        });
        world.advance(6);
        expect(world.state.cvars.cooldownViewerEnabled).toBe(undefined);
        expect(world.state.viewerAlpha).toBe(undefined);
        expect(world.state.viewerSaves).toBe(1);
    });

    it("stays visible when the player asked to see it", () => {
        const world = createWorld((state) => playAs(state, SHAMAN), { shouldShowCooldownManager: true });
        world.advance(1);
        expect(world.state.viewerAlpha).toBe(undefined);
    });
});

const NOT_DISPLAYED = -2;
const TRACKED_BUFF = 2;
const SPEC = 1;

/** The saved layouts: spec -> the layout in use (field 2), spec -> layout -> moved cooldowns by group (field 3 and its field 2). */
interface Saved {
    2?: { [spec: number]: number | undefined };
    3?: { [spec: number]: { [layout: number]: { 2?: { [group: number]: number[] | undefined } } | undefined } | undefined };
    4?: { [layout: number]: string | undefined };
}

function listMoved(world: World, group: number, spec = SPEC): number[] {
    const saved = world.state.layoutData as Saved | undefined;
    const layout = saved?.[2]?.[spec];
    return (layout !== undefined ? saved?.[3]?.[spec]?.[layout]?.[2]?.[group] : undefined) ?? [];
}

/** A character with both shields on Blizzard's list, hidden there by default; a moment after login, when the layouts have loaded. */
function createListWorld(setUp: (state: ClientState) => void = (state) => playAs(state, SHAMAN)): World {
    const world = createWorld((state) => {
        setUp(state);
        learnSpell(state, LIGHTNING_SHIELD);
        // Not learned yet
        state.spells[WATER_SHIELD.id] = WATER_SHIELD;
        state.buffCatalog.push({ spellId: LIGHTNING_SHIELD.id, isHiddenByDefault: true });
        state.buffCatalog.push({ spellId: WATER_SHIELD.id, isHiddenByDefault: true });
    });
    world.advance(6);
    return world;
}

describe("the buffs in the Cooldown Manager's saved layout", () => {
    it("are put in Tracked Buffs, learned or not, in a layout of the addon's, written once", () => {
        const world = createListWorld();
        expect(listMoved(world, TRACKED_BUFF).length).toBe(2);
        expect(world.state.viewerSaves).toBe(1);
        expect(((world.state.layoutData as Saved)[4] ?? {})[1]).toBe("Glowing Bars");
    });

    it("are put in the layout the player is on, out of Not Displayed", () => {
        const world = createListWorld((state) => {
            playAs(state, SHAMAN);
            state.layoutData = {
                1: 5,
                2: { [SPEC]: 7 },
                3: { [SPEC]: { 7: { 2: { [NOT_DISPLAYED]: [LIGHTNING_SHIELD.id] } } } },
                4: { 7: "Mine" },
            };
        });
        expect(listMoved(world, TRACKED_BUFF).length).toBe(2);
        expect(listMoved(world, NOT_DISPLAYED).length).toBe(0);
        expect(((world.state.layoutData as Saved)[2] ?? {})[SPEC]).toBe(7);
    });

    it("are looked at in the saved layout again: one that was taken out goes back at the next check", () => {
        const world = createListWorld();
        const moved = listMoved(world, TRACKED_BUFF);
        moved.pop();
        world.fire("ACTIVE_PLAYER_SPECIALIZATION_CHANGED");
        world.advance(6);
        expect(listMoved(world, TRACKED_BUFF).length).toBe(2);
    });

    it("are not written again when they are there", () => {
        const world = createListWorld();
        world.fire("ACTIVE_PLAYER_SPECIALIZATION_CHANGED");
        world.advance(6);
        expect(world.state.viewerSaves).toBe(1);
    });

    it("are put in for another spec, which has a layout of its own", () => {
        const world = createListWorld();
        world.state.viewerLayout = 2;
        world.fire("ACTIVE_PLAYER_SPECIALIZATION_CHANGED");
        world.advance(6);
        expect(listMoved(world, TRACKED_BUFF, 2).length).toBe(2);
    });

    it("are left where they are when the addon does not remind of them", () => {
        const world = createListWorld((state) => playAs(state, WARRIOR));
        expect(world.state.viewerSaves).toBe(0);
    });

    it("are not touched in a format the addon does not know", () => {
        const world = createListWorld((state) => {
            playAs(state, SHAMAN);
            state.layoutData = { 1: 99 };
        });
        expect(world.state.viewerSaves).toBe(0);
    });

    it("are not moved in a fight, but after it", () => {
        const world = createListWorld((state) => {
            playAs(state, SHAMAN);
            state.isInCombat = true;
        });
        expect(world.state.viewerSaves).toBe(0);
        world.state.isInCombat = false;
        world.fire("PLAYER_REGEN_ENABLED");
        expect(listMoved(world, TRACKED_BUFF).length).toBe(2);
    });

    it("wait for Blizzard's layouts to load", () => {
        const world = createListWorld((state) => {
            playAs(state, SHAMAN);
            state.isViewerDataLoaded = false;
        });
        expect(world.state.viewerSaves).toBe(0);
        world.state.isViewerDataLoaded = true;
        world.fire("PLAYER_REGEN_ENABLED");
        expect(world.state.viewerSaves).toBe(1);
    });
});
