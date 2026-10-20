// Phase-1 keymap for the Toucan2 dongle (custom letters, plain US OS layout, no accent layer yet).
// Positions: row0 0-11, row1 12-23, row2 24-35, thumbs 36-38 (left) 39-41 (right).

const KB = 0x07 << 16, CONS = 0x0c << 16;
const K = {
  a:4,b:5,c:6,d:7,e:8,f:9,g:10,h:11,i:12,j:13,k:14,l:15,m:16,n:17,o:18,p:19,q:20,r:21,s:22,t:23,u:24,v:25,w:26,x:27,y:28,z:29,
  1:0x1e,2:0x1f,3:0x20,4:0x21,5:0x22,6:0x23,7:0x24,8:0x25,9:0x26,0:0x27,
  ENTER:0x28, ESC:0x29, BSPC:0x2a, TAB:0x2b, SPACE:0x2c, MINUS:0x2d, EQUAL:0x2e, LBKT:0x2f, RBKT:0x30, BSLH:0x31,
  SEMI:0x33, SQT:0x34, GRAVE:0x35, COMMA:0x36, DOT:0x37, FSLH:0x38, CAPS:0x39,
  F1:0x3a,F2:0x3b,F3:0x3c,F4:0x3d,F5:0x3e,F6:0x3f,F7:0x40,F8:0x41,F9:0x42,F10:0x43,F11:0x44,F12:0x45,
  INS:0x49, HOME:0x4a, PGUP:0x4b, DEL:0x4c, END:0x4d, PGDN:0x4e, RIGHT:0x4f, LEFT:0x50, DOWN:0x51, UP:0x52,
  LCTRL:0xe0, LSHIFT:0xe1, LALT:0xe2, LGUI:0xe3, RCTRL:0xe4, RSHIFT:0xe5, RALT:0xe6, RGUI:0xe7,
};
const C = { VOL_DN:0xea, MUTE:0xe2, VOL_UP:0xe9, PP:0xcd, NEXT:0xb5, PREV:0xb6, BRI_UP:0x6f, BRI_DN:0x70 };
const LS = 0x02 << 24; // left-shift modifier bit

// behaviour ids read from the device
const B = { KP:8, MO:12, TRANS:22, UNLOCK:23, BT:21, OUT:15, CAPSWORD:6, MKP:1 };

const kp = (code) => [B.KP, KB | code, 0];
const sh = (code) => [B.KP, LS | KB | code, 0];
const cs = (code) => [B.KP, CONS | code, 0];
const mo = (l) => [B.MO, l, 0];
const __ = [B.TRANS, 0, 0];
const unlock = [B.UNLOCK, 0, 0];
const btSel = (n) => [B.BT, 3, n];
const btClr = [B.BT, 0, 0];
const outTog = [B.OUT, 0, 0];
const capsWord = [B.CAPSWORD, 0, 0];
const mkp = (btn) => [B.MKP, btn, 0];

const L = (s) => s.trim().split(/\s+/).map((tok) => {
  if (tok === "__") return __;
  if (tok in SYMS) return SYMS[tok];
  if (/^[a-z0-9]$/.test(tok)) return kp(K[tok]);
  throw new Error("unknown token " + tok);
});
const SYMS = {
  TAB: kp(K.TAB), BSPC: kp(K.BSPC), ESC: kp(K.ESC), ENTER: kp(K.ENTER), SPACE: kp(K.SPACE), DEL: kp(K.DEL),
  LSHIFT: kp(K.LSHIFT), RSHIFT: kp(K.RSHIFT), LCTRL: kp(K.LCTRL), LALT: kp(K.LALT), LGUI: kp(K.LGUI), RALT: kp(K.RALT),
  ",": kp(K.COMMA), ".": kp(K.DOT), "'": kp(K.SQT), "-": kp(K.MINUS), "=": kp(K.EQUAL), "[": kp(K.LBKT), "]": kp(K.RBKT),
  "\\": kp(K.BSLH), ";": kp(K.SEMI), "`": kp(K.GRAVE), "/": kp(K.FSLH),
  "!": sh(K[1]), "@": sh(K[2]), "#": sh(K[3]), "$": sh(K[4]), "%": sh(K[5]), "^": sh(K[6]), "&": sh(K[7]), "*": sh(K[8]),
  "(": sh(K[9]), ")": sh(K[0]), "_": sh(K.MINUS), "+": sh(K.EQUAL), "{": sh(K.LBKT), "}": sh(K.RBKT), "|": sh(K.BSLH),
  ":": sh(K.SEMI), '"': sh(K.SQT), "~": sh(K.GRAVE), "<": sh(K.COMMA), ">": sh(K.DOT), "?": sh(K.FSLH),
  LEFT: kp(K.LEFT), DOWN: kp(K.DOWN), UP: kp(K.UP), RIGHT: kp(K.RIGHT), HOME: kp(K.HOME), END: kp(K.END), PGUP: kp(K.PGUP), PGDN: kp(K.PGDN),
  F1:kp(K.F1),F2:kp(K.F2),F3:kp(K.F3),F4:kp(K.F4),F5:kp(K.F5),F6:kp(K.F6),F7:kp(K.F7),F8:kp(K.F8),F9:kp(K.F9),F10:kp(K.F10),F11:kp(K.F11),F12:kp(K.F12),
  VOL_DN: cs(C.VOL_DN), MUTE: cs(C.MUTE), VOL_UP: cs(C.VOL_UP), PP: cs(C.PP), NEXT: cs(C.NEXT), PREV: cs(C.PREV), BRI_UP: cs(C.BRI_UP), BRI_DN: cs(C.BRI_DN),
  NAV: mo(1), SYM: mo(2), UNLOCK: unlock, BT0: btSel(0), BT1: btSel(1), BT2: btSel(2), BT3: btSel(3), BT4: btSel(4), BTCLR: btClr,
  OUTTOG: outTog, CAPSW: capsWord, LCLK: mkp(1), RCLK: mkp(2), MCLK: mkp(4),
};

export const LAYERS = {
  0: L(`
    TAB     b  w  l  d  q      z  o  y  ,  k     BSPC
    LSHIFT  c  s  n  t  v      .  a  e  i  h     LALT
    ESC     p  g  r  m  j      '  x  -  u  f     RSHIFT
                LCTRL NAV SPACE   ENTER SYM LGUI
  `),
  1: L(`
    __      1  2  3  4  5          6     7    8   9     0     BSPC
    __   LGUI LALT LCTRL LSHIFT __  LEFT  DOWN UP  RIGHT DEL   __
    __   UNLOCK __  __  __  __     HOME  PGDN PGUP END  CAPSW  __
                 __  __  __        __  __  __
  `),
  2: L(`
    __      !  @  #  $  %      ^  &  *  (  )     BSPC
    __      "  :  (  )  ?      -  =  [  ]  \\    __
    __      ;  /  <  >  |      _  +  {  }  \`    __
                 __  __  __        __  __  __
  `),
  3: L(`
    __      __ F7 F8 F9 F12    VOL_DN MUTE VOL_UP PP   NEXT   __
    __      __ F4 F5 F6 F11    BT0    BT1  BT2    BT3  BT4    __
    __      __ F1 F2 F3 F10    BTCLR  OUTTOG BRI_DN BRI_UP __  __
                 __  __  __        __  __  __
  `),
  4: L(`
    __  __ __ __ __ __      __ __ __ __ __  __
    __  __ __ __ __ __      __ __ __ __ __  __
    __  __ __ __ __ __      __ __ __ __ __  __
              MCLK LCLK RCLK   LCLK RCLK MCLK
  `),
};
for (const [id, l] of Object.entries(LAYERS)) if (l.length !== 42) throw new Error(`layer ${id} has ${l.length} keys`);
