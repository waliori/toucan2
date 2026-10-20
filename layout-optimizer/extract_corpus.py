#!/usr/bin/env python3
"""Extract hand-typed user messages from local Claude Code data into a corpus + stats."""
import json, os, re, sys, glob, collections, unicodedata

HOME = os.path.expanduser("~")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "corpus")
os.makedirs(OUT, exist_ok=True)

BAD_MARKERS = ["<pasted_content", "<command-name", "<system-reminder", "<local-command",
               "HIVE MIND", "Swarm ID", "<task-notification", "<bash-input", "<bash-stdout",
               "[Request interrupted", "<user-prompt-submit-hook", "Caveat: The messages"]
MAX_LEN = 2500

def clean_text(t):
    if not isinstance(t, str): return None
    t = t.strip()
    if not t or len(t) > MAX_LEN: return None
    if any(m in t for m in BAD_MARKERS): return None
    if t.startswith("/") and "\n" not in t and len(t) < 80: return None  # slash commands
    if re.search(r"```", t): return None  # code pastes
    if sum(c.isascii() and not c.isalnum() and not c.isspace() for c in t) > 0.25 * max(len(t), 1): return None
    if re.search(r"https?://|/home/|/usr/|\\$ |^\\[|Traceback|Error:|^\\s*[{}<>]", t, re.M): return None  # logs, paths, urls, code
    # pasted prose: long, properly capitalised sentences (user writes lowercase)
    sents = re.split(r"(?<=[.!?])\\s+", t)
    if len(t) > 500 and len(sents) >= 4 and sum(x[:1].isupper() for x in sents) / len(sents) > 0.7: return None
    if re.search(r"\$ |\{\"|[\u2500-\u257f]|[A-Za-z0-9+/=_-]{32,}|\|\s*\|", t): return None  # shell prompts, json, tokens, box drawing, tables
    return t

seen = set()
msgs = []  # (source, text)

def add(src, t):
    t = clean_text(t)
    if not t: return
    key = re.sub(r"\s+", " ", t.lower())
    if key in seen: return
    seen.add(key); msgs.append((src, t))

# 1) global prompt history
hist = os.path.join(HOME, ".claude", "history.jsonl")
if os.path.exists(hist):
    for line in open(hist, encoding="utf-8", errors="ignore"):
        try: d = json.loads(line)
        except Exception: continue
        add("history", d.get("display"))

# 2) project transcripts + desktop sessions
roots = [os.path.join(HOME, ".claude", "projects"), os.path.join(HOME, ".config", "Claude", "claude-code-sessions")]
files = []
for r in roots:
    files += glob.glob(os.path.join(r, "**", "*.jsonl"), recursive=True)
for f in files:
    try:
        for line in open(f, encoding="utf-8", errors="ignore"):
            try: d = json.loads(line)
            except Exception: continue
            if d.get("type") != "user" or d.get("isMeta"): continue
            m = d.get("message") or {}
            c = m.get("content")
            if isinstance(c, str): add("transcript", c)
            elif isinstance(c, list):
                for b in c:
                    if isinstance(b, dict) and b.get("type") == "text": add("transcript", b.get("text"))
    except Exception as e:
        pass

# 3) claude.ai export
import glob as _g
for f in _g.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), "export", "conversations*.json")):
    for conv in json.load(open(f, encoding="utf-8")):
        for m in conv.get("chat_messages", []):
            if m.get("sender") != "human": continue
            blocks = [b.get("text") for b in (m.get("content") or []) if b.get("type") == "text"]
            txt = "\n".join(x for x in blocks if x) if blocks else m.get("text")
            if any(b.get("type") == "injected_prompt_block" for b in (m.get("content") or [])) and not blocks: continue
            add("claudeai", txt)

# ---- stats
FR = set("le la les des une est pas que qui dans pour sur avec mais ou donc car ce cette ces je tu il elle nous vous ils sont ete etre fait faire aussi plus tres bien comme tout".split())
EN = set("the and that this with for are you have not but can what from they will would there their about which when just like need want also should could into some then than".split())
DAR = set("wach wash kayn kaynin bzaf bzzaf chno chnou dyal dial wla walakin hadchi hada hadi daba safi labas lhamdulillah wakha wkha ghadi ghir machi mashi khoya kifach kifash fin fine 3la 3lach 3lash 3andi 3ndi 7it 7ta 9bel ndir dert drt kolchi bghit bghit bgha kan ana nta nti hna".split())

def lang(t):
    ar = len(re.findall(r"[\u0600-\u06ff]", t)); la = len(re.findall(r"[a-zA-Z]", t))
    if ar > la: return "ar"
    w = re.findall(r"[a-zA-Z0-9]+", t.lower())
    if not w: return "none"
    f = sum(x in FR for x in w); e = sum(x in EN for x in w); d = sum(x in DAR for x in w)
    d += sum(1 for x in w if re.search(r"[a-z][379][a-z]|^[379][a-z]|[a-z][379]$", x))
    best = max(("fr", f), ("en", e), ("dar", d), key=lambda p: p[1])
    return best[0] if best[1] > 0 else "unk"

per_lang = collections.Counter(); chars_lang = collections.Counter()
letters = collections.Counter(); digits_in_words = collections.Counter(); punct = collections.Counter()
accented = collections.Counter(); upper = 0; total_alpha = 0
bigrams = collections.Counter()
out_all = open(os.path.join(OUT, "local_user_text.txt"), "w", encoding="utf-8")
out_by = {k: open(os.path.join(OUT, f"local_{k}.txt"), "w", encoding="utf-8") for k in ["fr", "en", "dar", "unk", "none", "ar"]}
for src, t in msgs:
    L = lang(t); per_lang[L] += 1; chars_lang[L] += len(t)
    out_all.write(t.replace("\n", " ") + "\n"); out_by[L].write(t.replace("\n", " ") + "\n")
    for ch in t:
        if ch.isalpha():
            total_alpha += 1
            if ch.isupper(): upper += 1
            base = unicodedata.normalize("NFD", ch)[0].lower()
            if ch.lower() != base: accented[ch.lower()] += 1
            letters[base] += 1
        elif not ch.isspace(): punct[ch] += 1
    for w in re.findall(r"[a-zA-Z]+[0-9]+[a-zA-Z]+|[a-zA-Z]+[0-9]+|[0-9]+[a-zA-Z]+", t):
        for d_ in re.findall(r"[0-9]", w): digits_in_words[d_] += 1
    low = re.sub(r"[^a-z]", " ", t.lower())
    for w in low.split():
        for i in range(len(w) - 1): bigrams[w[i:i+2]] += 1
out_all.close(); [f.close() for f in out_by.values()]

tot = sum(letters.values()) or 1
for L in ["fr","en"]:
    txt = open(os.path.join(OUT, f"local_{L}.txt"), encoding="utf-8").read().lower()
    c = collections.Counter(unicodedata.normalize("NFD", ch)[0] for ch in txt if ch.isalpha() and ch.isascii() or unicodedata.normalize("NFD", ch)[0].isascii() and ch.isalpha())
    t2 = sum(c.values()) or 1
    print(f"{L} letter freq %:", " ".join(f"{k}:{100*v/t2:.1f}" for k, v in c.most_common(26)))
print("messages:", len(msgs), "| chars:", sum(len(t) for _, t in msgs), "| files scanned:", len(files))
print("by language (messages):", dict(per_lang))
print("by language (chars):", dict(chars_lang))
print("uppercase share of letters: %.1f%%" % (100 * upper / max(total_alpha, 1)))
print("accented chars typed:", sum(accented.values()), dict(accented.most_common(10)))
print("digits inside words (darija markers):", dict(digits_in_words.most_common()))
print("letter freq %:", " ".join(f"{k}:{100*v/tot:.1f}" for k, v in letters.most_common(30)))
print("top punct:", " ".join(f"{k!r}:{v}" for k, v in punct.most_common(15)))
print("top bigrams:", " ".join(f"{k}:{v}" for k, v in bigrams.most_common(25)))
