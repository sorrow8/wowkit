// The saved layouts of Blizzard's Cooldown Manager, read and written as the client stores them. Only through the client's own
// functions, never Blizzard's Lua code: an addon that goes through that taints it, and it then fails on the auras it must not
// share. What is written here shows from the next login or /reload.

/** What the client stores: "<encoding>|<base64 of deflated CBOR>". */
const ENCODING_VERSION = "1";
const DELIMITER = "|";
/** Enum.CompressionMethod.Deflate */
const DEFLATE = 0;
/** The version of the saved table this code can change: another one is left alone. */
const FORMAT_VERSION = 5;
/** Blizzard's built-in layout: it is never stored, and cannot be changed. */
const DEFAULT_LAYOUT_ID = 0;
const OWN_LAYOUT_NAME = "Glowing Bars";

const VERSION_FIELD = 1;
const ACTIVE_LAYOUTS_FIELD = 2;
const LAYOUTS_FIELD = 3;
const LAYOUT_NAMES_FIELD = 4;
const CATEGORY_OVERRIDES_FIELD = 2;

interface CategoryOverrides {
    [category: number]: number[] | undefined;
}

export interface SavedLayout {
    [CATEGORY_OVERRIDES_FIELD]?: CategoryOverrides;
}

export interface SavedLayouts {
    [VERSION_FIELD]?: number;
    /** Spec tag -> the layout in use. */
    [ACTIVE_LAYOUTS_FIELD]?: { [specTag: number]: number | undefined };
    /** Spec tag -> layout ID -> layout. */
    [LAYOUTS_FIELD]?: { [specTag: number]: { [layoutId: number]: SavedLayout | undefined } | undefined };
    [LAYOUT_NAMES_FIELD]?: { [layoutId: number]: string | undefined };
}

/** The saved layouts; a new table for a character with none yet, undefined for a format this code does not know. */
export function readSavedLayouts(): SavedLayouts | undefined {
    const saved = C_CooldownViewer.GetLayoutData();
    if (saved === "") return { [VERSION_FIELD]: FORMAT_VERSION };
    const [encoding, payload] = string.match(saved, "^(%d+)|(.*)$");
    if (encoding !== ENCODING_VERSION || payload === undefined) return undefined;
    const decoded = C_EncodingUtil.DecodeBase64(payload);
    const inflated = decoded !== undefined ? C_EncodingUtil.DecompressString(decoded, DEFLATE) : undefined;
    const layouts = inflated !== undefined ? (C_EncodingUtil.DeserializeCBOR(inflated) as SavedLayouts | undefined) : undefined;
    return type(layouts) === "table" && layouts![VERSION_FIELD] === FORMAT_VERSION ? layouts : undefined;
}

export function writeSavedLayouts(layouts: SavedLayouts): boolean {
    const compressed = C_EncodingUtil.CompressString(C_EncodingUtil.SerializeCBOR(layouts), DEFLATE);
    const encoded = compressed !== undefined ? C_EncodingUtil.EncodeBase64(compressed) : undefined;
    if (encoded === undefined) return false;
    C_CooldownViewer.SetLayoutData(`${ENCODING_VERSION}${DELIMITER}${encoded}`);
    return true;
}

/** The layout the spec is on; undefined while it is on Blizzard's built-in one. */
export function findActiveLayout(layouts: SavedLayouts, specTag: number): SavedLayout | undefined {
    const id = layouts[ACTIVE_LAYOUTS_FIELD]?.[specTag];
    return id === undefined || id === DEFAULT_LAYOUT_ID ? undefined : layouts[LAYOUTS_FIELD]?.[specTag]?.[id];
}

/** The addon's own layout for the spec, made if need be, and put in use. */
export function useOwnLayout(layouts: SavedLayouts, specTag: number): SavedLayout {
    const names = (layouts[LAYOUT_NAMES_FIELD] ??= {});
    const specLayouts = ((layouts[LAYOUTS_FIELD] ??= {})[specTag] ??= {});
    let ownId: number | undefined;
    for (const [id] of pairs(specLayouts)) if (names[id as number] === OWN_LAYOUT_NAME) ownId = id as number;
    ownId ??= findFreeLayoutId(layouts);
    names[ownId] = OWN_LAYOUT_NAME;
    (layouts[ACTIVE_LAYOUTS_FIELD] ??= {})[specTag] = ownId;
    return (specLayouts[ownId] ??= {});
}

/** The cooldowns the layout has moved to another group, by cooldown ID. */
export function readCategoryOverrides(layout: SavedLayout | undefined): LuaMap<number, number> {
    const categories = new LuaMap<number, number>();
    const overrides = layout?.[CATEGORY_OVERRIDES_FIELD];
    if (overrides === undefined) return categories;
    for (const [category, ids] of pairs(overrides)) for (const id of ids as number[]) categories.set(id, category as number);
    return categories;
}

export function setCategoryOverride(layout: SavedLayout, cooldownId: number, category: number): void {
    const overrides = (layout[CATEGORY_OVERRIDES_FIELD] ??= {});
    for (const [other, ids] of pairs(overrides)) overrides[other as number] = (ids as number[]).filter((id) => id !== cooldownId);
    (overrides[category] ??= []).push(cooldownId);
}

/** The IDs are unique over all the specs. */
function findFreeLayoutId(layouts: SavedLayouts): number {
    let highest = DEFAULT_LAYOUT_ID;
    for (const [id] of pairs(layouts[LAYOUT_NAMES_FIELD] ?? {})) highest = math.max(highest, id as number);
    return highest + 1;
}
