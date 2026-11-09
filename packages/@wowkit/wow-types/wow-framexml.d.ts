// Hand-written declarations for client functions missing from the generated API docs and for
// FrameXML (Blizzard's Lua UI code): the Settings panel API, action buttons, templates.

/** One aura (C_UnitAuras). Any field can be a secret value in combat: check with readable(). */
interface AuraData {
    auraInstanceID: number;
    name: string;
    spellId: number;
    icon: number;
    applications: number;
    duration: number;
    /** GetTime() based; 0 for auras without an end. */
    expirationTime: number;
    isHelpful: boolean;
    sourceUnit?: UnitToken;
    /** "Magic", "Curse", "Disease", "Poison"; undefined when it cannot be dispelled. */
    dispelName?: string;
    /** A mage can steal it (Spellsteal). */
    isStealable: boolean;
}

/** C_TooltipInfo result; also what the tooltip data processor hands to its calls (`id` is the spell or item ID). */
interface TooltipData {
    lines: { leftText?: string; rightText?: string }[];
    id?: number;
}

declare function GetActionInfo(
    slot: number,
): LuaMultiReturn<[actionType: string | undefined, id: number | undefined, subType: string | undefined, spellId: number | undefined]>;
declare function GetMacroSpell(macro: number | string): number | undefined;
declare function GetMacroBody(macro: number | string): string | undefined;
declare function GetActionText(slot: number): string | undefined;
/** The next frame of the game after this one; the first with none given. */
declare function EnumerateFrames(frame?: Frame): Frame | undefined;
declare function GetMacroIndexByName(name: string): number;
declare function GetNumShapeshiftForms(): number;
declare function GetShapeshiftFormInfo(
    index: number,
): LuaMultiReturn<[icon: number | undefined, active: boolean, castable: boolean, spellId: number | undefined]>;
declare function GetInventoryItemID(unit: UnitToken, slot: number): number | undefined;
declare function IsInGroup(groupType?: number): boolean;
/** The base cooldown and the global cooldown of a spell, in milliseconds (a legacy global). */
declare function GetSpellBaseCooldown(spellId: number): LuaMultiReturn<[cooldownMs: number | undefined, gcdMs: number | undefined]>;
/** "You must be behind your target." in the client's language. */
declare const SPELL_FAILED_NOT_BEHIND: string | undefined;
/** Ready-made curves for the *Percent functions. */
declare const CurveConstants: { ScaleTo100: LuaCurveObjectBase } | undefined;

interface Frame {
    // The docs type the units as an enum; the client takes unit tokens
    RegisterUnitEvent(eventName: string, ...units: UnitToken[]): boolean;
}

interface FontString {
    SetFontObject(fontName: string): void;
}

interface EditBox {
    SetFontObject(fontName: string): void;
}

/** A Blizzard action button (ActionBarButtonTemplate and friends). */
interface ActionButton extends Button {
    action?: number;
    icon?: Texture;
    Icon?: Texture;
    GetPagedID?(): number;
    CalculateAction?(): number;
}

/** A frame created from ActionButtonSpellAlertTemplate (the proc glow). */
interface SpellAlertFrame extends Frame {
    ProcStartAnim?: AnimationGroup;
    ProcLoop?: AnimationGroup;
    ProcAltGlow?: Texture;
    ProcStartFlipbook?: Texture;
    ProcLoopFlipbook?: Texture;
}

/** A frame created with BackdropTemplate. */
interface BackdropFrame {
    SetBackdrop(backdrop: {
        bgFile?: string;
        edgeFile?: string;
        tile?: boolean;
        tileSize?: number;
        edgeSize?: number;
        insets?: { left: number; right: number; top: number; bottom: number };
    }): void;
    SetBackdropColor(r: number, g: number, b: number, a?: number): void;
    SetBackdropBorderColor(r: number, g: number, b: number, a?: number): void;
}

interface ChatFrame {
    editBox?: EditBox;
}

/** Blizzard_ChatFrameBase/Shared/ChatFrameUtil.lua */
declare const ChatFrameUtil:
    | {
          OpenChat?: (this: void, text: string, chatFrame?: ChatFrame) => void;
          ChooseBoxForSend?: (this: void) => EditBox | undefined;
          ActivateChat?: (this: void, editBox: EditBox) => void;
      }
    | undefined;

declare function CreateColorFromHexString(hexColor: string): ColorMixin | undefined;

// ---------------------------------------------------------------------------------------------
// Settings panel (Blizzard_Settings_Shared)

interface SettingsCategory {
    GetID(): number;
}

interface SettingsLayout {
    AddInitializer(initializer: SettingsInitializer): void;
}

interface SettingsInitializer {
    /** Indents the control under `parent`; `isEnabled` greys it out while it says false (asked as the parent changes). */
    SetParentInitializer(parent: SettingsInitializer, isEnabled?: (this: void) => boolean): void;
}

interface SettingsSetting {
    GetValue(): unknown;
    SetValue(value: unknown): void;
}

interface SettingsControlTextContainer {
    Add(value: string, label: string, tooltip?: string): void;
    GetData(): unknown;
}

/** The range and the label of a slider of the Settings panel. */
interface SettingsSliderOptions {
    SetLabelFormatter(labelType: number, formatter: (this: void, value: number) => string): void;
}

/** Where a slider of the Settings panel shows its value. */
declare const MinimalSliderWithSteppersMixin: { Label: { Right: number } };

declare namespace Settings {
    const VarType: { Boolean: "boolean"; Number: "number"; String: "string" };
    function RegisterVerticalLayoutCategory(name: string): LuaMultiReturn<[SettingsCategory, SettingsLayout]>;
    function RegisterCanvasLayoutCategory(frame: Frame, name: string): SettingsCategory;
    function RegisterCanvasLayoutSubcategory(parent: SettingsCategory, frame: Frame, name: string): SettingsCategory;
    function RegisterVerticalLayoutSubcategory(parent: SettingsCategory, name: string): LuaMultiReturn<[SettingsCategory, SettingsLayout]>;
    function RegisterAddOnCategory(category: SettingsCategory): void;
    function RegisterProxySetting<T>(
        category: SettingsCategory,
        variable: string,
        varType: string,
        name: string,
        defaultValue: T,
        getValue: (this: void) => T,
        setValue: (this: void, value: T) => void,
    ): SettingsSetting;
    function CreateCheckbox(category: SettingsCategory, setting: SettingsSetting, tooltip?: string): SettingsInitializer;
    function CreateDropdown(
        category: SettingsCategory,
        setting: SettingsSetting,
        options: (this: void) => unknown,
        tooltip?: string,
    ): SettingsInitializer;
    function CreateControlTextContainer(): SettingsControlTextContainer;
    function CreateSliderOptions(minValue: number, maxValue: number, step: number): SettingsSliderOptions;
    function CreateSlider(category: SettingsCategory, setting: SettingsSetting, options: SettingsSliderOptions, tooltip?: string): SettingsInitializer;
    /** Missing on some clients: check before use. */
    const CreateColorSwatch:
        | ((this: void, category: SettingsCategory, setting: SettingsSetting, tooltip?: string) => SettingsInitializer)
        | undefined;
    function OpenToCategory(categoryId: number): void;
}

/** What the game's color picker is set up with (the retail-style picker). */
interface ColorPickerInfo {
    r: number;
    g: number;
    b: number;
    hasOpacity?: boolean;
    swatchFunc: (this: void) => void;
    cancelFunc: (this: void) => void;
}

/** The game's color picker; `SetupColorPickerAndShow` is missing on clients with the older one. */
declare const ColorPickerFrame: Frame & {
    SetupColorPickerAndShow?(info: ColorPickerInfo): void;
    GetColorRGB(): LuaMultiReturn<[number, number, number]>;
};

interface GameTooltip {
    SetOwner(owner: Frame, anchor: string): void;
    AddLine(text: string, red?: number, green?: number, blue?: number, wrapText?: boolean): void;
}

/** The game's tooltip data processor: calls made after a tooltip of a kind (a spell, an item) is filled. */
declare namespace TooltipDataProcessor {
    function AddTooltipPostCall(dataType: Enum.TooltipDataType, call: (this: void, tooltip: GameTooltip, data: TooltipData) => void): void;
}

/** The game's own tooltip. */
declare const GameTooltip: GameTooltip;

/** The names of the frames that Escape closes. */
declare const UISpecialFrames: string[];

declare function CreateSettingsListSectionHeaderInitializer(name: string, tooltip?: string): SettingsInitializer;
/** A row with a label and a button; `addSearchTags` makes the row show up in the panel's search. */
declare function CreateSettingsButtonInitializer(
    name: string,
    buttonText: string,
    buttonClick: () => void,
    tooltip: string | undefined,
    addSearchTags: boolean,
): SettingsInitializer;

/** An icon or bar of Blizzard's Cooldown Manager. */
interface CooldownViewerItem extends Frame {
    cooldownID?: number;
    IsActive(): boolean;
}

/** A window of Blizzard's Cooldown Manager (BuffIconCooldownViewer...). */
interface CooldownViewer extends Frame {
    itemFramePool?: { EnumerateActive(): LuaIterable<CooldownViewerItem> };
}

/** What the settings window of Blizzard's Cooldown Manager works on. */
interface CooldownViewerSettingsDataProvider {
    /** False until the saved layouts have loaded. */
    GetLayoutManager(): object | false;
}

/** The settings window of Blizzard's Cooldown Manager. */
interface CooldownViewerSettingsFrame extends Frame {
    GetDataProvider(): CooldownViewerSettingsDataProvider;
}

/** Blizzard's helpers for the Cooldown Manager (_G.CooldownViewerUtil). */
interface CooldownViewerUtilFunctions {
    GetCurrentClassAndSpecTag(this: void): number | undefined;
}
