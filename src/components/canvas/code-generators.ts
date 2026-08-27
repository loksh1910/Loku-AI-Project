import type { CodeFramework, ScreenNode, ScreenSpec } from "@/components/canvas/code-types";
import type { VariationTheme } from "@/components/present/health-app/theme";

// A generated line is tagged with the spec node it came from (or null for
// boilerplate/wrapper lines) — this is the sole mechanism that lets clicking an
// element in the Code Mode preview scroll to and highlight its matching code.
export type CodeLine = { nodeId: string | null; text: string };

function line(nodeId: string | null, text: string): CodeLine {
  return { nodeId, text };
}

function indent(lines: CodeLine[], spaces: number): CodeLine[] {
  const pad = " ".repeat(spaces);
  return lines.map((l) => line(l.nodeId, l.text ? pad + l.text : l.text));
}

function radiusPx(px: string): number {
  return parseInt(px, 10) || 0;
}

// ---------- React Native ----------
function rnNode(node: ScreenNode): CodeLine[] {
  switch (node.type) {
    case "image":
      return [line(node.id, `<Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />`)];
    case "avatar":
      return [line(node.id, `<View style={styles.avatar}><Text style={styles.avatarText}>${node.label}</Text></View>`)];
    case "brand":
      return [line(node.id, `<Text style={styles.brand}>${node.label}</Text>`)];
    case "heading":
      return [line(node.id, `<Text style={styles.heading}>${node.label}</Text>`)];
    case "subtext":
      return [line(node.id, `<Text style={styles.subtitle}>${node.label}</Text>`)];
    case "muted":
      return [line(node.id, `<Text style={styles.muted}>${node.label}</Text>`)];
    case "label":
      return [line(node.id, `<Text style={styles.label}>${node.label}</Text>`)];
    case "field":
      return [line(node.id, `<TextInput placeholder="${node.label}" style={styles.field} />`)];
    case "button":
      return [
        line(node.id, `<TouchableOpacity style={styles.primaryBtn} onPress={() => {}}>`),
        line(node.id, `  <Text style={styles.primaryBtnText}>${node.label}</Text>`),
        line(node.id, `</TouchableOpacity>`),
      ];
    case "outlineButton":
      return [
        line(node.id, `<TouchableOpacity style={styles.outlineBtn} onPress={() => {}}>`),
        line(node.id, `  <Text style={styles.outlineBtnText}>${node.label}</Text>`),
        line(node.id, `</TouchableOpacity>`),
      ];
    case "card":
      return [
        line(node.id, `<View style={styles.card}>`),
        line(node.id, `  <Text style={styles.cardTitle}>${node.label}</Text>`),
        ...(node.sublabel ? [line(node.id, `  <Text style={styles.cardSubtitle}>${node.sublabel}</Text>`)] : []),
        line(node.id, `</View>`),
      ];
    case "row":
      return [
        line(node.id, `<View style={styles.row}>`),
        ...(node.children ?? []).flatMap((c) => indent(rnNode(c), 2)),
        line(node.id, `</View>`),
      ];
  }
}

function genReactNative(spec: ScreenSpec, theme: VariationTheme): CodeLine[] {
  const body = spec.nodes.flatMap((n) => indent(rnNode(n), 6));
  const btnR = radiusPx(theme.buttonRadius);
  const cardR = radiusPx(theme.radius);
  return [
    line(null, `import React from 'react';`),
    line(null, `import {`),
    line(null, `  View,`),
    line(null, `  Text,`),
    line(null, `  Image,`),
    line(null, `  TextInput,`),
    line(null, `  TouchableOpacity,`),
    line(null, `  StyleSheet,`),
    line(null, `} from 'react-native';`),
    line(null, `import { useNavigation } from '@react-navigation/native';`),
    line(null, ``),
    line(null, `// Variation: ${theme.label}`),
    line(null, `export default function ${spec.fileBase}() {`),
    line(null, `  const navigation = useNavigation();`),
    line(null, ``),
    line(null, `  return (`),
    line(null, `    <View style={styles.container}>`),
    ...body,
    line(null, `    </View>`),
    line(null, `  );`),
    line(null, `}`),
    line(null, ``),
    line(null, `const styles = StyleSheet.create({`),
    line(null, `  container: { flex: 1, padding: 20, backgroundColor: '${theme.bg}' },`),
    line(null, `  logoContainer: { alignItems: 'center', marginBottom: 12 },`),
    line(null, `  logo: { width: 56, height: 56, borderRadius: ${cardR}, backgroundColor: '${theme.surface}' },`),
    line(null, `  avatar: { width: 24, height: 24, borderRadius: 999, backgroundColor: '${theme.surface}', alignItems: 'center', justifyContent: 'center' },`),
    line(null, `  avatarText: { fontSize: 9, fontWeight: '700', color: '${theme.primary}' },`),
    line(null, `  brand: { color: '${theme.primary}', fontWeight: '700', fontSize: 13, textAlign: 'center' },`),
    line(null, `  heading: { color: '${theme.text}', fontWeight: '${theme.headingWeight}', fontSize: 19, textAlign: 'center' },`),
    line(null, `  subtitle: { color: '${theme.muted}', fontSize: 10, textAlign: 'center' },`),
    line(null, `  muted: { color: '${theme.muted}', fontSize: 9 },`),
    line(null, `  label: { color: '${theme.text}', fontWeight: '600', fontSize: 11 },`),
    line(null, `  field: { backgroundColor: '${theme.surface}', borderWidth: 1, borderColor: '${theme.border}', borderRadius: ${cardR}, padding: 10, color: '${theme.muted}' },`),
    line(null, `  primaryBtn: { backgroundColor: '${theme.primary}', borderRadius: ${btnR}, paddingVertical: 12, alignItems: 'center' },`),
    line(null, `  primaryBtnText: { color: '${theme.primaryText}', fontWeight: '600', fontSize: 11 },`),
    line(null, `  outlineBtn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '${theme.primary}', borderRadius: ${btnR}, paddingVertical: 12, alignItems: 'center' },`),
    line(null, `  outlineBtnText: { color: '${theme.primary}', fontWeight: '600', fontSize: 11 },`),
    line(null, `  card: { backgroundColor: '${theme.surface}', borderRadius: ${cardR}, padding: 12 },`),
    line(null, `  cardTitle: { color: '${theme.text}', fontWeight: '700', fontSize: 10 },`),
    line(null, `  cardSubtitle: { color: '${theme.muted}', fontSize: 9, marginTop: 2 },`),
    line(null, `  row: { flexDirection: 'row', gap: 8 },`),
    line(null, `});`),
  ];
}

// ---------- Flutter (Dart) ----------
function flutterNode(node: ScreenNode, theme: VariationTheme, cardR: number): CodeLine[] {
  switch (node.type) {
    case "image":
      return [line(node.id, `Image.asset('assets/logo.png', height: 56),`)];
    case "avatar":
      return [line(node.id, `CircleAvatar(backgroundColor: ${dartColor(theme.surface)}, child: Text('${node.label}')),`)];
    case "brand":
      return [line(node.id, `Text('${node.label}', style: TextStyle(fontWeight: FontWeight.bold, color: ${dartColor(theme.primary)})),`)];
    case "heading":
      return [line(node.id, `Text('${node.label}', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w${theme.headingWeight}, color: ${dartColor(theme.text)})),`)];
    case "subtext":
      return [line(node.id, `Text('${node.label}', style: TextStyle(fontSize: 13, color: ${dartColor(theme.muted)})),`)];
    case "muted":
      return [line(node.id, `Text('${node.label}', style: TextStyle(color: ${dartColor(theme.muted)})),`)];
    case "label":
      return [line(node.id, `Text('${node.label}', style: const TextStyle(fontWeight: FontWeight.w600)),`)];
    case "field":
      return [
        line(node.id, `TextField(decoration: InputDecoration(`),
        line(node.id, `  hintText: '${node.label}',`),
        line(node.id, `  filled: true,`),
        line(node.id, `  fillColor: ${dartColor(theme.surface)},`),
        line(node.id, `  border: OutlineInputBorder(borderRadius: BorderRadius.circular(${cardR})),`),
        line(node.id, `)),`),
      ];
    case "button":
      return [
        line(node.id, `ElevatedButton(`),
        line(node.id, `  style: ElevatedButton.styleFrom(`),
        line(node.id, `    backgroundColor: ${dartColor(theme.primary)},`),
        line(node.id, `    foregroundColor: ${dartColor(theme.primaryText)},`),
        line(node.id, `    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${radiusPx(theme.buttonRadius)})),`),
        line(node.id, `  ),`),
        line(node.id, `  onPressed: () {},`),
        line(node.id, `  child: const Text('${node.label}'),`),
        line(node.id, `),`),
      ];
    case "outlineButton":
      return [
        line(node.id, `OutlinedButton(`),
        line(node.id, `  style: OutlinedButton.styleFrom(`),
        line(node.id, `    foregroundColor: ${dartColor(theme.primary)},`),
        line(node.id, `    side: BorderSide(color: ${dartColor(theme.primary)}),`),
        line(node.id, `    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${radiusPx(theme.buttonRadius)})),`),
        line(node.id, `  ),`),
        line(node.id, `  onPressed: () {},`),
        line(node.id, `  child: const Text('${node.label}'),`),
        line(node.id, `),`),
      ];
    case "card":
      return [
        line(node.id, `Card(`),
        line(node.id, `  color: ${dartColor(theme.surface)},`),
        line(node.id, `  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${cardR})),`),
        line(node.id, `  child: ListTile(`),
        line(node.id, `    title: Text('${node.label}', style: TextStyle(color: ${dartColor(theme.text)})),`),
        ...(node.sublabel ? [line(node.id, `    subtitle: Text('${node.sublabel}', style: TextStyle(color: ${dartColor(theme.muted)})),`)] : []),
        line(node.id, `  ),`),
        line(node.id, `),`),
      ];
    case "row":
      return [
        line(node.id, `Row(`),
        line(node.id, `  children: [`),
        ...(node.children ?? []).flatMap((c) => indent(flutterNode(c, theme, cardR), 4)),
        line(node.id, `  ],`),
        line(node.id, `),`),
      ];
  }
}

function dartColor(hex: string): string {
  const clean = hex.replace("#", "").padStart(6, "0");
  return `const Color(0xFF${clean.toUpperCase()})`;
}

function genFlutter(spec: ScreenSpec, theme: VariationTheme): CodeLine[] {
  const className = spec.fileBase;
  const cardR = radiusPx(theme.radius);
  const body = spec.nodes.flatMap((n) => indent(flutterNode(n, theme, cardR), 14));
  return [
    line(null, `import 'package:flutter/material.dart';`),
    line(null, ``),
    line(null, `// Variation: ${theme.label}`),
    line(null, `class ${className} extends StatelessWidget {`),
    line(null, `  const ${className}({super.key});`),
    line(null, ``),
    line(null, `  @override`),
    line(null, `  Widget build(BuildContext context) {`),
    line(null, `    return Scaffold(`),
    line(null, `      backgroundColor: ${dartColor(theme.bg)},`),
    line(null, `      body: SafeArea(`),
    line(null, `        child: Padding(`),
    line(null, `          padding: const EdgeInsets.all(20),`),
    line(null, `          child: Column(`),
    line(null, `            crossAxisAlignment: CrossAxisAlignment.stretch,`),
    line(null, `            children: [`),
    ...body,
    line(null, `            ],`),
    line(null, `          ),`),
    line(null, `        ),`),
    line(null, `      ),`),
    line(null, `    );`),
    line(null, `  }`),
    line(null, `}`),
  ];
}

// ---------- HTML & CSS ----------
function htmlNode(node: ScreenNode): CodeLine[] {
  switch (node.type) {
    case "image":
      return [line(node.id, `<img class="logo" src="../assets/logo.svg" alt="logo" />`)];
    case "avatar":
      return [line(node.id, `<div class="avatar">${node.label}</div>`)];
    case "brand":
      return [line(node.id, `<h2 class="brand">${node.label}</h2>`)];
    case "heading":
      return [line(node.id, `<h1 class="heading">${node.label}</h1>`)];
    case "subtext":
      return [line(node.id, `<p class="subtitle">${node.label}</p>`)];
    case "muted":
      return [line(node.id, `<p class="muted">${node.label}</p>`)];
    case "label":
      return [line(node.id, `<span class="label">${node.label}</span>`)];
    case "field":
      return [line(node.id, `<input class="field" placeholder="${node.label}" />`)];
    case "button":
      return [line(node.id, `<button class="btn-primary">${node.label}</button>`)];
    case "outlineButton":
      return [line(node.id, `<button class="btn-outline">${node.label}</button>`)];
    case "card":
      return [
        line(node.id, `<div class="card">`),
        line(node.id, `  <p class="card-title">${node.label}</p>`),
        ...(node.sublabel ? [line(node.id, `  <p class="card-subtitle">${node.sublabel}</p>`)] : []),
        line(node.id, `</div>`),
      ];
    case "row":
      return [
        line(node.id, `<div class="row">`),
        ...(node.children ?? []).flatMap((c) => indent(htmlNode(c), 2)),
        line(node.id, `</div>`),
      ];
  }
}

function genHtmlCss(spec: ScreenSpec, theme: VariationTheme): CodeLine[] {
  const body = spec.nodes.flatMap((n) => indent(htmlNode(n), 2));
  const btnR = theme.buttonRadius;
  const cardR = theme.radius;
  return [
    line(null, `<!-- Variation: ${theme.label} -->`),
    line(null, `<!doctype html>`),
    line(null, `<html>`),
    line(null, `<head>`),
    line(null, `  <link rel="stylesheet" href="../styles/global.css" />`),
    line(null, `</head>`),
    line(null, `<body>`),
    line(null, `<div class="screen ${spec.id}">`),
    ...body,
    line(null, `</div>`),
    line(null, `</body>`),
    line(null, `</html>`),
    line(null, ``),
    line(null, `<style>`),
    line(null, `  .screen { display: flex; flex-direction: column; gap: 12px; padding: 20px; background: ${theme.bg}; font-family: ${theme.fontFamily}; }`),
    line(null, `  .brand { color: ${theme.primary}; font-weight: 700; text-align: center; }`),
    line(null, `  .heading { color: ${theme.text}; font-weight: ${theme.headingWeight}; text-align: center; }`),
    line(null, `  .subtitle, .muted { color: ${theme.muted}; }`),
    line(null, `  .field { background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: ${cardR}; padding: 10px 14px; }`),
    line(null, `  .btn-primary { background: ${theme.primary}; color: ${theme.primaryText}; border-radius: ${btnR}; border: none; padding: 12px; font-weight: 600; }`),
    line(null, `  .btn-outline { background: transparent; color: ${theme.primary}; border: 1.5px solid ${theme.primary}; border-radius: ${btnR}; padding: 12px; font-weight: 600; }`),
    line(null, `  .card { background: ${theme.surface}; border-radius: ${cardR}; padding: 12px; }`),
    line(null, `  .card-title { color: ${theme.text}; font-weight: 700; }`),
    line(null, `  .card-subtitle { color: ${theme.muted}; }`),
    line(null, `  .avatar { border-radius: 999px; background: ${theme.surface}; }`),
    line(null, `  .row { display: flex; gap: 8px; }`),
    line(null, `</style>`),
  ];
}

// ---------- SwiftUI ----------
function swiftNode(node: ScreenNode, theme: VariationTheme, cardR: number): CodeLine[] {
  switch (node.type) {
    case "image":
      return [line(node.id, `Image("logo").resizable().frame(width: 56, height: 56)`)];
    case "avatar":
      return [line(node.id, `Circle().fill(${swiftColor(theme.surface)}).overlay(Text("${node.label}"))`)];
    case "brand":
      return [line(node.id, `Text("${node.label}").font(.headline).bold().foregroundColor(${swiftColor(theme.primary)})`)];
    case "heading":
      return [line(node.id, `Text("${node.label}").font(.title).bold().foregroundColor(${swiftColor(theme.text)})`)];
    case "subtext":
      return [line(node.id, `Text("${node.label}").font(.footnote).foregroundColor(${swiftColor(theme.muted)})`)];
    case "muted":
      return [line(node.id, `Text("${node.label}").font(.caption).foregroundColor(${swiftColor(theme.muted)})`)];
    case "label":
      return [line(node.id, `Text("${node.label}").font(.subheadline.bold())`)];
    case "field":
      return [
        line(node.id, `TextField("${node.label}", text: .constant(""))`),
        line(node.id, `    .padding()`),
        line(node.id, `    .background(${swiftColor(theme.surface)})`),
        line(node.id, `    .cornerRadius(${cardR})`),
      ];
    case "button":
      return [
        line(node.id, `Button(action: {}) {`),
        line(node.id, `    Text("${node.label}").frame(maxWidth: .infinity)`),
        line(node.id, `}`),
        line(node.id, `.padding()`),
        line(node.id, `.background(${swiftColor(theme.primary)})`),
        line(node.id, `.foregroundColor(${swiftColor(theme.primaryText)})`),
        line(node.id, `.cornerRadius(${radiusPx(theme.buttonRadius)})`),
      ];
    case "outlineButton":
      return [
        line(node.id, `Button(action: {}) {`),
        line(node.id, `    Text("${node.label}").frame(maxWidth: .infinity)`),
        line(node.id, `}`),
        line(node.id, `.padding()`),
        line(node.id, `.foregroundColor(${swiftColor(theme.primary)})`),
        line(node.id, `.overlay(RoundedRectangle(cornerRadius: ${radiusPx(theme.buttonRadius)}).stroke(${swiftColor(theme.primary)}, lineWidth: 1.5))`),
      ];
    case "card":
      return [
        line(node.id, `VStack(alignment: .leading) {`),
        line(node.id, `    Text("${node.label}").bold().foregroundColor(${swiftColor(theme.text)})`),
        ...(node.sublabel ? [line(node.id, `    Text("${node.sublabel}").foregroundColor(${swiftColor(theme.muted)})`)] : []),
        line(node.id, `}.padding().background(${swiftColor(theme.surface)}).cornerRadius(${cardR})`),
      ];
    case "row":
      return [
        line(node.id, `HStack {`),
        ...(node.children ?? []).flatMap((c) => indent(swiftNode(c, theme, cardR), 4)),
        line(node.id, `}`),
      ];
  }
}

function swiftColor(hex: string): string {
  const clean = hex.replace("#", "").padStart(6, "0");
  const r = (parseInt(clean.slice(0, 2), 16) / 255).toFixed(2);
  const g = (parseInt(clean.slice(2, 4), 16) / 255).toFixed(2);
  const b = (parseInt(clean.slice(4, 6), 16) / 255).toFixed(2);
  return `Color(red: ${r}, green: ${g}, blue: ${b})`;
}

function genSwiftUI(spec: ScreenSpec, theme: VariationTheme): CodeLine[] {
  const structName = spec.fileBase.replace(/Screen$/, "View");
  const cardR = radiusPx(theme.radius);
  const body = spec.nodes.flatMap((n) => indent(swiftNode(n, theme, cardR), 12));
  return [
    line(null, `import SwiftUI`),
    line(null, ``),
    line(null, `// Variation: ${theme.label}`),
    line(null, `struct ${structName}: View {`),
    line(null, `    var body: some View {`),
    line(null, `        VStack(spacing: 16) {`),
    ...body,
    line(null, `        }`),
    line(null, `        .padding()`),
    line(null, `        .background(${swiftColor(theme.bg)})`),
    line(null, `    }`),
    line(null, `}`),
  ];
}

// ---------- Jetpack Compose (Kotlin) ----------
function composeNode(node: ScreenNode, theme: VariationTheme, cardR: number): CodeLine[] {
  switch (node.type) {
    case "image":
      return [line(node.id, `Image(painter = painterResource(R.drawable.logo), contentDescription = null)`)];
    case "avatar":
      return [line(node.id, `Box(Modifier.background(${composeColor(theme.surface)}, CircleShape), contentAlignment = Alignment.Center) { Text("${node.label}") }`)];
    case "brand":
      return [line(node.id, `Text("${node.label}", fontWeight = FontWeight.Bold, color = ${composeColor(theme.primary)})`)];
    case "heading":
      return [line(node.id, `Text("${node.label}", style = MaterialTheme.typography.headlineMedium, color = ${composeColor(theme.text)})`)];
    case "subtext":
      return [line(node.id, `Text("${node.label}", style = MaterialTheme.typography.bodySmall, color = ${composeColor(theme.muted)})`)];
    case "muted":
      return [line(node.id, `Text("${node.label}", color = ${composeColor(theme.muted)})`)];
    case "label":
      return [line(node.id, `Text("${node.label}", fontWeight = FontWeight.SemiBold)`)];
    case "field":
      return [
        line(node.id, `OutlinedTextField(`),
        line(node.id, `    value = "", onValueChange = {},`),
        line(node.id, `    label = { Text("${node.label}") },`),
        line(node.id, `    shape = RoundedCornerShape(${cardR}.dp),`),
        line(node.id, `)`),
      ];
    case "button":
      return [
        line(node.id, `Button(`),
        line(node.id, `    onClick = {},`),
        line(node.id, `    colors = ButtonDefaults.buttonColors(containerColor = ${composeColor(theme.primary)}, contentColor = ${composeColor(theme.primaryText)}),`),
        line(node.id, `    shape = RoundedCornerShape(${radiusPx(theme.buttonRadius)}.dp),`),
        line(node.id, `) {`),
        line(node.id, `    Text("${node.label}")`),
        line(node.id, `}`),
      ];
    case "outlineButton":
      return [
        line(node.id, `OutlinedButton(`),
        line(node.id, `    onClick = {},`),
        line(node.id, `    colors = ButtonDefaults.outlinedButtonColors(contentColor = ${composeColor(theme.primary)}),`),
        line(node.id, `    shape = RoundedCornerShape(${radiusPx(theme.buttonRadius)}.dp),`),
        line(node.id, `) {`),
        line(node.id, `    Text("${node.label}")`),
        line(node.id, `}`),
      ];
    case "card":
      return [
        line(node.id, `Card(`),
        line(node.id, `    modifier = Modifier.fillMaxWidth(),`),
        line(node.id, `    colors = CardDefaults.cardColors(containerColor = ${composeColor(theme.surface)}),`),
        line(node.id, `    shape = RoundedCornerShape(${cardR}.dp),`),
        line(node.id, `) {`),
        line(node.id, `    Column(Modifier.padding(12.dp)) {`),
        line(node.id, `        Text("${node.label}", fontWeight = FontWeight.Bold, color = ${composeColor(theme.text)})`),
        ...(node.sublabel ? [line(node.id, `        Text("${node.sublabel}", color = ${composeColor(theme.muted)})`)] : []),
        line(node.id, `    }`),
        line(node.id, `}`),
      ];
    case "row":
      return [
        line(node.id, `Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {`),
        ...(node.children ?? []).flatMap((c) => indent(composeNode(c, theme, cardR), 4)),
        line(node.id, `}`),
      ];
  }
}

function composeColor(hex: string): string {
  const clean = hex.replace("#", "").padStart(6, "0");
  return `Color(0xFF${clean.toUpperCase()})`;
}

function genJetpackCompose(spec: ScreenSpec, theme: VariationTheme): CodeLine[] {
  const cardR = radiusPx(theme.radius);
  const body = spec.nodes.flatMap((n) => indent(composeNode(n, theme, cardR), 8));
  return [
    line(null, `// Variation: ${theme.label}`),
    line(null, `@Composable`),
    line(null, `fun ${spec.fileBase}(navController: NavController) {`),
    line(null, `    Column(`),
    line(null, `        modifier = Modifier.fillMaxSize().background(${composeColor(theme.bg)}).padding(20.dp),`),
    line(null, `        verticalArrangement = Arrangement.spacedBy(12.dp),`),
    line(null, `    ) {`),
    ...body,
    line(null, `    }`),
    line(null, `}`),
  ];
}

export function generateScreenCode(spec: ScreenSpec, framework: CodeFramework, theme: VariationTheme): CodeLine[] {
  switch (framework) {
    case "react-native":
      return genReactNative(spec, theme);
    case "flutter":
      return genFlutter(spec, theme);
    case "html-css":
      return genHtmlCss(spec, theme);
    case "swiftui":
      return genSwiftUI(spec, theme);
    case "jetpack-compose":
      return genJetpackCompose(spec, theme);
  }
}

// Small representative stubs for the shared/root files in the tree (App entry,
// navigation, shared Button/Field components) — not per-screen, so no node
// mapping is needed. Theme-bearing ones are functions of the current variation
// so switching it updates these too, same as the screen files.
export const SHARED_FILES: Record<string, Partial<Record<CodeFramework, (theme: VariationTheme) => string>>> = {
  app: {
    "react-native": () =>
      `import React from 'react';\nimport { NavigationContainer } from '@react-navigation/native';\nimport { RootNavigator } from './navigation';\n\nexport default function App() {\n  return (\n    <NavigationContainer>\n      <RootNavigator />\n    </NavigationContainer>\n  );\n}\n`,
  },
  nav: {
    "react-native": () =>
      `import { createNativeStackNavigator } from '@react-navigation/native-stack';\nimport SplashScreen from './screens/SplashScreen';\nimport SignUpScreen from './screens/SignUpScreen';\nimport SignInScreen from './screens/SignInScreen';\nimport DashboardScreen from './screens/DashboardScreen';\n\nconst Stack = createNativeStackNavigator();\n\nexport function RootNavigator() {\n  return (\n    <Stack.Navigator screenOptions={{ headerShown: false }}>\n      <Stack.Screen name="Splash" component={SplashScreen} />\n      <Stack.Screen name="SignUp" component={SignUpScreen} />\n      <Stack.Screen name="SignIn" component={SignInScreen} />\n      <Stack.Screen name="Dashboard" component={DashboardScreen} />\n    </Stack.Navigator>\n  );\n}\n`,
  },
  "cmp-button": {
    "react-native": (theme) =>
      `import React from 'react';\nimport { TouchableOpacity, Text, StyleSheet } from 'react-native';\n\n// Variation: ${theme.label}\nexport function Button({ label, variant = 'solid', onPress }) {\n  return (\n    <TouchableOpacity style={styles[variant]} onPress={onPress}>\n      <Text style={styles[\`\${variant}Text\`]}>{label}</Text>\n    </TouchableOpacity>\n  );\n}\n\nconst styles = StyleSheet.create({\n  solid: { backgroundColor: '${theme.primary}', borderRadius: ${radiusPx(theme.buttonRadius)}, padding: 12 },\n  outline: { borderWidth: 1.5, borderColor: '${theme.primary}', borderRadius: ${radiusPx(theme.buttonRadius)}, padding: 12 },\n  solidText: { color: '${theme.primaryText}', fontWeight: '600', textAlign: 'center' },\n  outlineText: { color: '${theme.primary}', fontWeight: '600', textAlign: 'center' },\n});\n`,
    flutter: (theme) =>
      `import 'package:flutter/material.dart';\n\n// Variation: ${theme.label}\nclass AppButton extends StatelessWidget {\n  final String label;\n  final VoidCallback onPressed;\n  const AppButton({super.key, required this.label, required this.onPressed});\n\n  @override\n  Widget build(BuildContext context) {\n    return ElevatedButton(\n      style: ElevatedButton.styleFrom(backgroundColor: ${dartColor(theme.primary)}, foregroundColor: ${dartColor(theme.primaryText)}),\n      onPressed: onPressed,\n      child: Text(label),\n    );\n  }\n}\n`,
    swiftui: (theme) =>
      `import SwiftUI\n\n// Variation: ${theme.label}\nstruct AppButton: View {\n    let label: String\n    let action: () -> Void\n\n    var body: some View {\n        Button(action: action) { Text(label) }\n            .padding()\n            .background(${swiftColor(theme.primary)})\n            .foregroundColor(${swiftColor(theme.primaryText)})\n            .cornerRadius(${radiusPx(theme.buttonRadius)})\n    }\n}\n`,
    "jetpack-compose": (theme) =>
      `// Variation: ${theme.label}\n@Composable\nfun AppButton(label: String, onClick: () -> Unit) {\n    Button(\n        onClick = onClick,\n        colors = ButtonDefaults.buttonColors(containerColor = ${composeColor(theme.primary)}),\n        shape = RoundedCornerShape(${radiusPx(theme.buttonRadius)}.dp),\n    ) { Text(label) }\n}\n`,
  },
  "cmp-field": {
    "react-native": (theme) =>
      `import React from 'react';\nimport { TextInput, StyleSheet } from 'react-native';\n\nexport function Field({ placeholder }) {\n  return <TextInput placeholder={placeholder} style={styles.field} />;\n}\n\nconst styles = StyleSheet.create({\n  field: { borderWidth: 1, borderColor: '${theme.border}', borderRadius: ${radiusPx(theme.radius)}, padding: 10, backgroundColor: '${theme.surface}' },\n});\n`,
  },
  main: {
    flutter: (theme) =>
      `import 'package:flutter/material.dart';\nimport 'screens/splash_screen.dart';\n\nvoid main() => runApp(const HealthVisorApp());\n\n// Variation: ${theme.label}\nclass HealthVisorApp extends StatelessWidget {\n  const HealthVisorApp({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(\n      title: 'HealthVisor',\n      theme: ThemeData(primaryColor: ${dartColor(theme.primary)}, scaffoldBackgroundColor: ${dartColor(theme.bg)}),\n      home: const SplashScreen(),\n    );\n  }\n}\n`,
  },
  pubspec: {
    flutter: () =>
      `name: healthvisor\ndescription: A HealthVisor mobile app.\n\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'\n\ndependencies:\n  flutter:\n    sdk: flutter\n\nflutter:\n  uses-material-design: true\n  assets:\n    - assets/logo.png\n`,
  },
  "global-css": {
    "html-css": (theme) =>
      `/* Variation: ${theme.label} */\n:root {\n  --primary: ${theme.primary};\n  --text: ${theme.text};\n  --muted: ${theme.muted};\n  --surface: ${theme.surface};\n  --border: ${theme.border};\n  --bg: ${theme.bg};\n  --button-radius: ${theme.buttonRadius};\n  --radius: ${theme.radius};\n}\n\nbody { font-family: ${theme.fontFamily}; margin: 0; background: var(--bg); }\n.btn-primary { background: var(--primary); color: #fff; border-radius: var(--button-radius); border: none; padding: 12px; }\n.btn-outline { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); border-radius: var(--button-radius); padding: 12px; }\n.field { border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius); padding: 10px; }\n`,
  },
  app_swift: {
    swiftui: (theme) =>
      `import SwiftUI\n\n// Variation: ${theme.label}\n@main\nstruct HealthVisorApp: App {\n    var body: some Scene {\n        WindowGroup {\n            SplashView()\n        }\n    }\n}\n`,
  },
};
