// A small hand-rolled, regex-based tokenizer — not a real language parser, just
// enough to make every generated framework's code (JS/TS/Dart/Swift/Kotlin/HTML)
// read like a real editor. Good enough for display; not meant to validate syntax.
type Token = { text: string; cls: string };

const KEYWORDS =
  /^\b(?:import|export|from|default|function|return|const|let|var|class|struct|extends|implements|interface|type|void|static|override|private|public|fun|val|if|else|for|while|new|this|super|true|false|null|undefined|StatelessWidget|StatefulWidget|BuildContext|Composable|require)\b/;

const RULES: { re: RegExp; cls: string }[] = [
  { re: /^\/\/.*/, cls: "cmt" },
  { re: /^<!--[\s\S]*?-->/, cls: "cmt" },
  { re: /^\/\*[\s\S]*?\*\//, cls: "cmt" },
  { re: /^"(?:[^"\\]|\\.)*"/, cls: "str" },
  { re: /^'(?:[^'\\]|\\.)*'/, cls: "str" },
  { re: /^`(?:[^`\\]|\\.)*`/, cls: "str" },
  { re: /^<\/?[A-Za-z][\w.:-]*/, cls: "tag" },
  { re: KEYWORDS, cls: "kw" },
  { re: /^\b\d+(?:\.\d+)?\b/, cls: "num" },
  { re: /^[{}()[\]<>]/, cls: "punc" },
];

export function tokenizeLine(text: string): Token[] {
  const raw: Token[] = [];
  let rest = text;
  while (rest.length > 0) {
    let matched = false;
    for (const rule of RULES) {
      const m = rule.re.exec(rest);
      if (m && m[0].length > 0) {
        raw.push({ text: m[0], cls: rule.cls });
        rest = rest.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      raw.push({ text: rest[0], cls: "" });
      rest = rest.slice(1);
    }
  }
  const merged: Token[] = [];
  for (const t of raw) {
    const last = merged[merged.length - 1];
    if (last && last.cls === "" && t.cls === "") last.text += t.text;
    else merged.push({ ...t });
  }
  return merged;
}

const TOKEN_COLOR: Record<string, string> = {
  kw: "#c586c0",
  str: "#ce9178",
  tag: "#4EC9B0",
  num: "#b5cea8",
  cmt: "#6a9955",
  punc: "#d4d4d4",
  "": "#d4d4d4",
};

export function HighlightedLine({ text }: { text: string }) {
  const tokens = tokenizeLine(text);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: TOKEN_COLOR[t.cls], fontStyle: t.cls === "cmt" ? "italic" : undefined }}>
          {t.text}
        </span>
      ))}
    </>
  );
}
