import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { analyze, formatPercent, parseCount, validateVariant } from "../../lib/abTest";

type Field = { visitors: string; conversions: string };

export default function CalculatorScreen() {
  const [a, setA] = useState<Field>({ visitors: "1000", conversions: "100" });
  const [b, setB] = useState<Field>({ visitors: "1000", conversions: "130" });

  const outcome = useMemo(() => {
    const va = { visitors: parseCount(a.visitors), conversions: parseCount(a.conversions) };
    const vb = { visitors: parseCount(b.visitors), conversions: parseCount(b.conversions) };
    const errors = [...validateVariant(va, "A"), ...validateVariant(vb, "B")];
    if (errors.length > 0) return { errors: errors.map((e) => e.message), result: null };
    return { errors: [], result: analyze(va, vb) };
  }, [a, b]);

  const result = outcome.result;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          A/B Test Significance
        </Text>
        <Text style={styles.subtitle}>
          Enter visitors and conversions for each variant to see conversion
          rates, lift and whether the difference is statistically significant
          (two-proportion z-test, 95% confidence).
        </Text>
      </View>

      <VariantCard label="A (control)" value={a} onChange={setA} />
      <VariantCard label="B (variant)" value={b} onChange={setB} />

      <View style={styles.card} accessibilityLiveRegion="polite">
        <Text style={styles.cardTitle}>Result</Text>
        {outcome.errors.map((msg) => (
          <Text key={msg} style={styles.error}>
            {msg}
          </Text>
        ))}
        {result && (
          <>
            <Row label="Rate A" value={formatPercent(result.rateA)} />
            <Row label="Rate B" value={formatPercent(result.rateB)} />
            <Row
              label="Lift (B vs A)"
              value={result.lift === null ? "n/a" : `${result.lift >= 0 ? "+" : ""}${formatPercent(result.lift, 1)}`}
            />
            <Row label="z-score" value={result.zScore.toFixed(3)} />
            <Row label="p-value" value={result.pValue < 0.0001 ? "< 0.0001" : result.pValue.toFixed(4)} />
            <Text style={[styles.verdict, result.significant ? styles.good : styles.neutral]}>
              {result.significant
                ? `Significant: variant ${result.winner} wins`
                : "Not significant yet — keep the test running"}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function VariantCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Field;
  onChange: (next: Field) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Variant {label}</Text>
      <Text style={styles.label}>Visitors</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={value.visitors}
        onChangeText={(visitors) => onChange({ ...value, visitors })}
        accessibilityLabel={`Variant ${label} visitors`}
      />
      <Text style={styles.label}>Conversions</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={value.conversions}
        onChangeText={(conversions) => onChange({ ...value, conversions })}
        accessibilityLabel={`Variant ${label} conversions`}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: { backgroundColor: "#4A90D9", padding: 24, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    gap: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#333", marginBottom: 4 },
  label: { fontSize: 13, color: "#555" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#222",
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  rowLabel: { fontSize: 15, color: "#555" },
  rowValue: { fontSize: 15, fontWeight: "600", color: "#222" },
  error: { color: "#B00020", fontSize: 14 },
  verdict: { marginTop: 8, fontSize: 16, fontWeight: "700" },
  good: { color: "#1B7F3B" },
  neutral: { color: "#8A5A00" },
});
