# Toucan2 keymap v2 (firmware, `firmware/config/toucan_dongle.keymap`)

OS layout on both machines: **US International** (dead keys). The firmware sends `' " \` ^` as
"dead key + space" so they stay plain; accents come from the prefix below.

## BASE
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
 --    -- F1 F2 F3 F10    BTclr  USB/BLE BriDn BriUp --
```
BOOT = dongle into bootloader (for flashing). RESET = reboot the dongle.
## MOU (auto while touching trackpad): thumbs = middle/left/right click.

History: v1 (same letters, no accents) was applied over Studio RPC on 2026-10-19 before the firmware existed; see `studio-rpc/keymap_v1.mjs`.
