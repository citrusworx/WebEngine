import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { bluePalette } from "./tokens";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        <Text style={styles.kicker}>JUICE NATIVE</Text>
        <Text style={styles.title}>Expo Playground</Text>
        <Text style={styles.body}>
          This is the minimal environment for testing `src/native` work in a real React Native runtime.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current status</Text>
          <Text style={styles.cardBody}>
            The playground is ready. The current token loader in `src/native` still uses `node:fs`, so it will not run
            directly in Expo until we add a bundler-friendly token strategy.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next step</Text>
          <Text style={styles.cardBody}>
            Start here for component and layout testing, then we can wire Juice Native helpers in as we replace the
            filesystem token reads.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: bluePalette[100]
  },
  shell: {
    flex: 1,
    padding: 24,
    gap: 16
  },
  kicker: {
    color: "#7aa6ff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700"
  },
  body: {
    color: "#c4ccd7",
    fontSize: 16,
    lineHeight: 24
  },
  card: {
    backgroundColor: "#171b22",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#272d38"
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600"
  },
  cardBody: {
    color: "#aab4c3",
    fontSize: 15,
    lineHeight: 22
  }
});
