import React from "react";
import { StyleSheet, Text, View } from "react-native";

type ParsedElement = {
  type: "text" | "bold" | "italic" | "header2" | "header3" | "listItem" | "numberedItem" | "lineBreak";
  content: string;
  children?: ParsedElement[];
};

/**
 * Simple markdown parser for workout content in React Native
 * Handles: headers (##, ###), bold (**), italic (*), bullet lists (-), numbered lists (1.)
 */
export function parseMarkdownContent(markdown: string | null): React.ReactNode {
  if (!markdown) return null;

  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Skip empty lines but add spacing
    if (!trimmedLine) {
      elements.push(<View key={`break-${lineIndex}`} style={styles.lineBreak} />);
      return;
    }

    // Headers
    if (trimmedLine.startsWith("### ")) {
      elements.push(
        <Text key={`h3-${lineIndex}`} style={styles.header3}>
          {parseInlineStyles(trimmedLine.slice(4))}
        </Text>
      );
      return;
    }

    if (trimmedLine.startsWith("## ")) {
      elements.push(
        <Text key={`h2-${lineIndex}`} style={styles.header2}>
          {parseInlineStyles(trimmedLine.slice(3))}
        </Text>
      );
      return;
    }

    // Bullet lists (- or *)
    if (/^[-*+]\s+/.test(trimmedLine)) {
      const content = trimmedLine.replace(/^[-*+]\s+/, "");
      elements.push(
        <View key={`bullet-${lineIndex}`} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listItemText}>{parseInlineStyles(content)}</Text>
        </View>
      );
      return;
    }

    // Numbered lists
    if (/^\d+\.\s+/.test(trimmedLine)) {
      const match = trimmedLine.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        elements.push(
          <View key={`num-${lineIndex}`} style={styles.listItem}>
            <Text style={styles.bullet}>{match[1]}.</Text>
            <Text style={styles.listItemText}>{parseInlineStyles(match[2])}</Text>
          </View>
        );
        return;
      }
    }

    // Regular paragraph
    elements.push(
      <Text key={`p-${lineIndex}`} style={styles.paragraph}>
        {parseInlineStyles(trimmedLine)}
      </Text>
    );
  });

  return <View style={styles.container}>{elements}</View>;
}

/**
 * Parse inline styles (bold, italic) within a line
 */
function parseInlineStyles(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(.*?)(\*\*|__)(.+?)\2(.*)$/);
    if (boldMatch) {
      if (boldMatch[1]) {
        elements.push(<Text key={`text-${keyIndex++}`}>{parseSpecialChars(boldMatch[1])}</Text>);
      }
      elements.push(
        <Text key={`bold-${keyIndex++}`} style={styles.bold}>
          {parseSpecialChars(boldMatch[3])}
        </Text>
      );
      remaining = boldMatch[4];
      continue;
    }

    // Italic: *text* or _text_ (single)
    const italicMatch = remaining.match(/^(.*?)([*_])([^*_]+)\2(.*)$/);
    if (italicMatch) {
      if (italicMatch[1]) {
        elements.push(<Text key={`text-${keyIndex++}`}>{parseSpecialChars(italicMatch[1])}</Text>);
      }
      elements.push(
        <Text key={`italic-${keyIndex++}`} style={styles.italic}>
          {parseSpecialChars(italicMatch[3])}
        </Text>
      );
      remaining = italicMatch[4];
      continue;
    }

    // No more patterns, add remaining text
    elements.push(<Text key={`text-${keyIndex++}`}>{parseSpecialChars(remaining)}</Text>);
    break;
  }

  return elements.length === 1 ? elements[0] : <>{elements}</>;
}

/**
 * Parse special characters like gender symbols
 */
function parseSpecialChars(text: string): React.ReactNode {
  const parts = text.split(/(♀|♂)/);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (part === "♀") {
      return (
        <Text key={i} style={styles.femaleSymbol}>
          ♀
        </Text>
      );
    }
    if (part === "♂") {
      return (
        <Text key={i} style={styles.maleSymbol}>
          ♂
        </Text>
      );
    }
    return part;
  });
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  lineBreak: {
    height: 8,
  },
  header2: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 4,
  },
  header3: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: 8,
    marginVertical: 2,
  },
  bullet: {
    fontSize: 14,
    color: "#666",
    width: 20,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  bold: {
    fontWeight: "600",
    color: "#1a1a1a",
  },
  italic: {
    fontStyle: "italic",
  },
  femaleSymbol: {
    backgroundColor: "#fce7f3",
    color: "#be185d",
    paddingHorizontal: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  maleSymbol: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    paddingHorizontal: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "600",
  },
});
