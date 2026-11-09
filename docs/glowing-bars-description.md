# Glowing Bars

**Your action bars light up for what you forgot.** No window, no bars of its own: the button you should press glows, right where you would press it anyway. Made for World of Warcraft: Forever.

[**Video**](https://www.youtube.com/watch?v=SRTQNBTOY_A)

## 🎮 Now with gamepad support (alpha)

Play with a controller? The glows also show on **Forever's own gamepad bars**, the class button included. Round buttons get a round glow of their own, with their own animation setting. It's new, so please tell me what you see.

## 🧩 Works with the following UI addons

**Bartender4**, **Dominos**, **EllesmereUI**, **ElvUI** and **DaylightUI**: the glows show on their buttons too, their stance bar included. Their bar 1 to 8 counts as Action Bar 1 to 8, so the bar switches and the faded bars work on them as well.

Using another bar addon? Its buttons are detected automatically. Not sure it sees yours? Type **/gb welcome**.

## 👋 Welcome window

Once on each character, a short welcome window scans your bars and lights up every button it finds. If nothing lights up, it gives you a report to send me. See it again any time with **/gb welcome**.

## What glows

*   **Missing buffs** – Fortitude, Mark of the Wild, Arcane Intellect, aspects, paladin auras, armors… Of a group (one aspect, one aura) any one counts. In combat, when the game hides your buffs, the ones you saw or cast are remembered.
*   **Party buffs** – out of combat, a group member in range who misses your buff makes its button glow.
    *   **Party and raid**: each has its own switch.
    *   **Group versions**: when enough miss the buff (you counted, but never you alone) and the reagent is in your bags, Prayer of Fortitude, Gift of the Wild or Arcane Brilliance glows instead. You set how many, 1 to 5: 2 by default in a party, 1 in a raid.
    *   **Paladins**: each class gets the blessing you last gave it; before that, Wisdom for casters and healers, Kings or Might for the rest. A Greater Blessing when enough of a class miss it, by the same setting. In a raid only the classes you buffed there.
*   **Weapon buffs** – shaman imbues, rogue poisons (per hand) and warlock stones, when missing or about to run out. Sharpening stones and the like can be added by the *Use spell ID* from their tooltip, on a bar or in a macro. A macro with `/use 16` or `/use 17` glows only for that weapon.
*   **Paladin seals** – in a fight (by default) with no seal up, the seal you used last glows gold, already a moment before it runs out. Before your first seal, the one of your talent tree.
*   **Gathering** – a miner or a herbalist with no tracking on sees Find Minerals or Find Herbs glow, and a dwarf Find Treasure. Any tracking counts, so a hunter tracking beasts is left alone.
*   **Low reagents** – the group buff on your bar glows quietly while its reagent runs low (below 10, or the limit you set in the table), and in a town or an inn a message names what to buy.
*   **Low stock, if you add it** – add any item by its *Item ID* (arrows, drinks, candles). When only a few are left, a message says how many. If the item is on your bars, its button glows too.
*   **Cooldowns that are back** – in a fight, an important cooldown of your class or your race (Recklessness, Rapid Fire, Adrenaline Rush, Innervate, Swift Judgement, Blood Fury, Stoneform, Desperate Prayer…) glows for a few seconds when it is ready again. If you like, the ready ones also glow as a fight starts.
*   **Procs** – Overpower, Revenge, Execute, Victory Rush, Riposte, Counterattack, Mongoose Bite and Hammer of Wrath glow while you can use them. Overpower and Revenge glow in any stance, so you know when to switch.
    *   **Alpha**: Execute in Defensive Stance on a low target, Arcane Missiles when it's free (Missile Barrage, Clearcasting) and Shadow Bolt when it's instant (Nightfall). These rows are marked in the table: if one doesn't work for you, switch it off in the Enabled column and let me know.
*   **Old ranks** – a spell on your bars at a lower rank than the one you know glows quietly, and a short message tells you. A spell in a macro doesn't count.
*   **Elixirs, food and drinks, if you add them** – turn on **Show spell and item IDs in tooltips** on the Settings page, put the item on your bars, and add the *Use spell ID* from its tooltip in the **/gb** table as a missing buff. Only that item glows, under its own name in the table, and not when you have none left. A food or drink stops glowing once you have its Well Fed buff.

It stays quiet while you are dead, mounted or on a taxi. If you like, it can also stay quiet in towns and inns, except for low reagents and low stock: tick **Stay quiet in towns and inns** on the Settings page.

## Make it yours

Type **/gb** to open the table. It opens in a **Basic** view with the columns most people need; the **Advanced** button at the top shows all of them. Every reminder type has the same settings, and every spell of your class can have its own:

*   **Color** of the glow and of the message
*   **Glow %**, 1 to 100
*   **Message** at the top of the screen, on or off. In the Advanced view, its gear sets what it says (the type, the spell or item, both, or your own words), its color and how long it stays
*   **Sound**, from a short list of game sounds, or your own
*   **Glow time**: how long the glow and the message show once it is due: 1 to 10 seconds, or until done (the default; 3 seconds for the ready cooldowns)
*   **Animation**: circling, breathing or none, each in two looks: ants (Blizzard's own glow) or clean (a clean line running around, or a soft frame standing still)
*   **Repeat**: every 5, 10, 30 or 60 seconds the glow, the message and the sound come again, for the glow time (off by default)
*   **When**: always, in combat, out of combat, or only with an enemy targeted; the low reagents and the low stock can also keep their message and sound to towns and inns
*   **Enabled**: turn a whole type, or one spell, on or off

In the same table you can **add your own spells and items by their ID**, or fix the ID of a listed spell if the game uses another one. A new spell of Forever the addon doesn't know yet is a few clicks away. To find a spell's ID, turn on **Show spell and item IDs in tooltips**.

**Your own sounds**: make a folder named `GlowingBars_Sounds` in `Interface\AddOns`, next to the addon's folder, and put your files in it, named `custom1`, `custom2` and so on, as `.ogg` or `.mp3`. Open the table with **/gb**, scroll to the bottom, and under **Custom sounds** enter how many there are. They then appear in the Sound list. With **Add folder** you can use more folders; type **/reload** after adding one.

Sound packs may come later, from me or from anyone else: a pack is just a folder of sounds named this way, so you can already make one and share it.

The defaults: buffs blue, weapon buffs orange, seals gold, gathering turquoise, cooldowns white, procs red, old ranks and low reagents a quieter yellow, low stock a quieter red. Only the old ranks, low stock and the low reagents (in a town) show a message by default, and nothing makes a sound until you pick one; the glow is the reminder.

On the Settings page (_Options > AddOns > Glowing Bars_):

*   **Messages**: text size, vertical position, zoom in and out, two kinds of pulse, and one line per type
*   **Rainbow when AFK** (off by default): your buttons light up in rainbow colors while you are away
*   **Show Blizzard's Cooldown Manager** (off by default): Glowing Bars runs it in the background to see your buffs in a fight, and keeps its icons out of sight. Tick this to see them
*   **Circling on round buttons**: breathing or none, where a glow cannot run around the button
*   **Action bars that glow**: turn any of the eight bars off (your UI addon's bars too)
*   **Faded until they glow**: any of the eight bars stays faint until one of its buttons glows, so a bar in the middle of your screen shows only what's due
*   **Spell and item IDs in tooltips** (off by default): spell tooltips show the Spell ID and item tooltips the Item ID; an elixir, potion, food or drink also shows the ID of the spell it casts
*   The weapon buff to keep up, the party and raid buffs with their group version counts, and whether the ready cooldowns also glow as a fight starts

All settings are kept per character.

## Good to know

*   Works with Blizzard's own action bars, Forever's gamepad bars and the UI addons above.
*   Making a UI addon? Your action buttons can glow too: register them as the [Glowing Bars API](https://vattiss.github.io/wowkit/glowing-bars-api) page shows.
*   In combat the game hides some things from addons (your auras, some cooldowns). Glowing Bars remembers what it saw and what you cast, so it keeps working, but if something does not glow when it should, please tell me.

## Feedback

Found a bug or want a spell on a list? Leave a comment here or open an issue on [GitHub](https://github.com/vattiss/wowkit/issues).