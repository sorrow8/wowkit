// The client's options (CVars), the talents, the stable, and the curves the client evaluates over hidden values.
import type { ClientState } from "./client-state";
import { defineNamespace, defineValues, fake } from "./define";

/** A linear curve through its points, like the client's LuaCurveObject (its methods are called with the object: method syntax). */
function createCurve(): LuaCurveObject {
    const points: [x: number, y: number][] = [];
    return fake<LuaCurveObject>({
        SetType() {
            return undefined;
        },
        AddPoint(x: number, y: number) {
            points.push([x, y]);
            points.sort((a, b) => a[0] - b[0]);
        },
        Evaluate(x: number) {
            if (points.length === 0) return 0;
            if (x <= points[0]![0]) return points[0]![1];
            for (let i = 1; i < points.length; i++) {
                const [x1, y1] = points[i]!;
                const [x0, y0] = points[i - 1]!;
                if (x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
            }
            return points[points.length - 1]![1];
        },
    });
}

/** The windows of the Cooldown Manager: the icons of the tracked buffs are in the first buff window, an icon's cooldown ID is its spell's. */
function installCooldownViewers(state: ClientState): void {
    // The addon's table goes through the encoding as it is
    let written: { [field: number]: unknown } | undefined;
    defineNamespace<typeof C_EncodingUtil>("C_EncodingUtil", {
        DecodeBase64: (source) => source,
        EncodeBase64: (source) => source,
        DecompressString: (source) => source,
        CompressString: (source) => source,
        DeserializeCBOR: () => state.layoutData,
        SerializeCBOR: (value) => {
            written = value as { [field: number]: unknown };
            return "saved";
        },
    });
    defineNamespace<typeof C_CooldownViewer>("C_CooldownViewer", {
        GetCooldownViewerCooldownInfo: (cooldownID) => {
            const isHidden = state.buffCatalog.find((buff) => buff.spellId === cooldownID)?.isHiddenByDefault === true;
            return fake<CooldownViewerCooldown>({
                cooldownID,
                spellID: cooldownID,
                flags: (isHidden ? 2 : 0) as Enum.CooldownSetSpellFlags,
            });
        },
        GetLayoutData: () => (state.layoutData === undefined ? "" : "1|saved"),
        SetLayoutData: () => {
            state.layoutData = written;
            state.viewerSaves += 1;
        },
        GetCooldownViewerCategorySet: (category) => (category === 2 ? state.buffCatalog.map((buff) => buff.spellId) : []),
    });
    const createViewer = (hasIcons: boolean) => ({
        SetAlpha(alpha: number) {
            state.viewerAlpha = alpha;
        },
        itemFramePool: {
            EnumerateActive() {
                let index = 0;
                return () => {
                    const buff = hasIcons ? state.trackedBuffs[index] : undefined;
                    index += 1;
                    if (buff === undefined) return undefined;
                    return {
                        cooldownID: buff.spellId,
                        IsActive: function (this: void, _self: unknown) {
                            return buff.isActive;
                        },
                        SetMouseMotionEnabled: function (this: void) {
                            return undefined;
                        },
                    };
                };
            },
        },
    });
    const provider = {
        GetLayoutManager() {
            return state.isViewerDataLoaded ? {} : false;
        },
    };
    defineValues({
        CooldownViewerUtil: { GetCurrentClassAndSpecTag: () => state.viewerLayout },
        CooldownViewerSettings: {
            GetDataProvider() {
                return provider;
            },
        },
        EssentialCooldownViewer: createViewer(false),
        UtilityCooldownViewer: createViewer(false),
        BuffIconCooldownViewer: createViewer(true),
        BuffBarCooldownViewer: createViewer(false),
    });
}

export function installCurves(state: ClientState): void {
    defineNamespace<typeof C_CurveUtil>("C_CurveUtil", { CreateCurve: createCurve });
    defineNamespace<typeof C_CVar>("C_CVar", {
        GetCVarBool: (name) => state.cvars[name] === true,
        SetCVar: (name, value) => {
            state.cvars[name] = value === "1";
            return true;
        },
    });
    installCooldownViewers(state);
    // No talents spent (a low level character): the role stays as picked
    defineNamespace<typeof C_SpecializationInfo>("C_SpecializationInfo", {
        GetSpecializationInfo: () => $multi(0, undefined, undefined, undefined, undefined, undefined, 0, undefined, 0, false),
    });
    // A hunter has a pet in stable slot 1 when the test gave one
    defineNamespace<typeof C_StableInfo>("C_StableInfo", {
        GetStablePetInfo: () => (state.pet !== undefined ? fake<PetInfo>({}) : undefined),
    });
}
