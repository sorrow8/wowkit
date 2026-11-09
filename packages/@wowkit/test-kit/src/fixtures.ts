// The classes and spells the specs use. IDs and icons are the game's.
import type { CharacterClass, SpellDefinition } from "./world/client-state";

export const PRIEST: CharacterClass = { name: "Priest", token: "PRIEST", id: 5 };
export const WARRIOR: CharacterClass = { name: "Warrior", token: "WARRIOR", id: 1 };
export const MAGE: CharacterClass = { name: "Mage", token: "MAGE", id: 8 };
export const PALADIN: CharacterClass = { name: "Paladin", token: "PALADIN", id: 2 };
export const DRUID: CharacterClass = { name: "Druid", token: "DRUID", id: 11 };
export const HUNTER: CharacterClass = { name: "Hunter", token: "HUNTER", id: 3 };
export const SHAMAN: CharacterClass = { name: "Shaman", token: "SHAMAN", id: 7 };
export const ROGUE: CharacterClass = { name: "Rogue", token: "ROGUE", id: 4 };

const spell = (id: number, name: string, icon: number, rank = 1): SpellDefinition => ({ id, name, rank, icon });

export const FORTITUDE = spell(1243, "Power Word: Fortitude", 135987);
export const PRAYER_OF_FORTITUDE = spell(21562, "Prayer of Fortitude", 135941);
export const INNER_FIRE = spell(588, "Inner Fire", 135926);
export const SMITE_RANK_1 = spell(585, "Smite", 135924, 1);
export const SMITE_RANK_2 = spell(591, "Smite", 135924, 2);
export const BLESSING_OF_KINGS = spell(20217, "Blessing of Kings", 135995);
export const GREATER_BLESSING_OF_KINGS = spell(25898, "Greater Blessing of Kings", 135993);
export const ARCANE_INTELLECT = spell(1459, "Arcane Intellect", 135932);
export const BATTLE_SHOUT = spell(6673, "Battle Shout", 132333);
export const MARK_OF_THE_WILD = spell(1126, "Mark of the Wild", 136078);
export const THORNS = spell(467, "Thorns", 136104);
export const ASPECT_OF_THE_HAWK = spell(13165, "Aspect of the Hawk", 136076);
export const ASPECT_OF_THE_MONKEY = spell(13163, "Aspect of the Monkey", 132160);
export const ASPECT_OF_THE_WILD = spell(20043, "Aspect of the Wild", 136074);
export const ROCKBITER_WEAPON = spell(8017, "Rockbiter Weapon", 136086);
export const LIGHTNING_SHIELD = spell(324, "Lightning Shield", 136051);
export const WATER_SHIELD = spell(408510, "Water Shield", 132315);
export const INSTANT_POISON = spell(8679, "Instant Poison", 132273);
export const DEADLY_POISON = spell(2823, "Deadly Poison", 132290);

/** The reagents of the group versions, as items in the bags. */
export const HOLY_CANDLE = 17028;
export const SYMBOL_OF_KINGS = 21177;
