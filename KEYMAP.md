# Toucan2 keymap v2 (firmware, `firmware/config/toucan.keymap`)

OS layout on both machines: **US International** (dead keys). The firmware sends `' " \` ^` as
"dead key + space" so they stay plain; accents come from the prefix below.

## WLD (the Walid layout)
```
 Tab    b  w  l  d  q      z  o  y  ,  k    Bksp
 Shift  c  s  n  t  v      .  a  e  i  h    Alt
 Esc    p  g  r  m  j      '  x  -  u  f    Shift
         Ctrl/ACC NAV Space   Enter SYM Super
```
Left Ctrl thumb: **hold** = Ctrl, **tap** = accent prefix (one-shot, stays armed up to 5 s).

## Accents (tap the prefix, then the letter; Shift held = capital)
| taps | e | a | u | i | o | c |
|---|---|---|---|---|---|---|
| 1 | é | à | ù | î | ô | ç |
| 2 | è | â | û | ï | | |
| 3 | ê | | ü | | | |
| 4 | ë | | | | | |
A prefix tap followed by any other key just types that key.

## NAV (hold left middle thumb)
```
 --     1  2  3  4  5           6     7     8     9    0    Bksp
 --  Super Alt Ctrl Shift --   Left  Down  Up   Right Del  --
 -- Unlock --  --  --  --      Home  PgDn  PgUp  End  CapsWord --
```
Studio unlock = NAV + bottom-left letter key (the "p" key).
## SYM (hold right middle thumb)
```
 --   !  @  #  $  %      ^  &  *  (  )    Bksp
 --   "  :  (  )  ?      -  =  [  ]  \    --
 --   ;  /  <  >  |      _  +  {  }  `    --
```
## ADJ (hold both thumb layer keys)
```
 BOOT  -- F7 F8 F9 F12    VolDn  Mute  VolUp  Play  Next
 RESET -- F4 F5 F6 F11    BT0    BT1   BT2    BT3   BT4
 --  GAME F1 F2 F3 F10    BTclr  USB/BLE BriDn BriUp --
```
BOOT = left half into its bootloader (for flashing). RESET = reboot the left half. BT0-BT4 pick the host profile, BTclr forgets the current one, USB/BLE picks the output. GAME (the bottom-left letter key, "p") toggles the game layer.

## GAME (locked QWERTY for games, toggle = ADJ + the "p" key)
```
 Tab    Q  W  E  R  1      Y  U  I  O  P    Bksp
 Shift  A  S  D  F  2      H  J  K  L  ;    Alt
 Ctrl   Z  X  C  V  3      N  M  ,  .  /    Esc
            4 Space 5     Enter ADJ Super   (ADJ here = a second tri-layer rule GAME+SYM)
```
Plain keys only: no hold-tap, no accent prefix, no NAV/SYM, so nothing can fire by accident mid-fight. Left hand is the
WASD cluster with 1-3 on the inner column and 4-5 on the outer thumbs (potions); right hand is QWERTY for menus and chat.
The layer stays on across sleep and unplugging; the screens show "GAME" while it is. To leave: hold the right middle
thumb (ADJ from this layer) and tap the same "p" key. ADJ also gives F1-F12, volume and the Bluetooth keys without leaving.
## MOU (auto while touching trackpad): thumbs = middle/left/right click.

History: v1 (same letters, no accents) was applied over Studio RPC on 2026-10-19 before the firmware existed; see `studio-rpc/keymap_v1.mjs`.
