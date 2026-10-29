import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import { useSettings } from "@getpaseo/plugin/client";
import { Pressable, Text, View } from "react-native";
import {
  DEFAULT_STREAM_STATS,
  statsGeometry,
  streamStatsSettings,
  type StreamStatsSettings,
} from "../shared/settings";

/**
 * Settings → Plugins → 回答统计行.
 *
 * The host renders plugin settings only as screens a plugin registers, so the
 * two ratios the stats row reads are edited here: how far the row sits under
 * the completed-turn footer (in em, so it follows the text size), and how large
 * its text is relative to Paseo's own footer. The defaults reproduce that
 * footer's geometry, so leaving this page alone keeps the row looking like part
 * of it — on every screen size.
 */
interface Field {
  key: keyof StreamStatsSettings;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  /** What the number means to a reader, given the ratios currently in force. */
  describe: (values: StreamStatsSettings) => string;
}

const FIELDS: Field[] = [
  {
    key: "gapEm",
    label: "与页脚的间距",
    hint: "按字号的比例计算，不随屏幕或机型变化",
    min: 0,
    max: 2,
    step: 0.05,
    describe: (values) =>
      `${values.gapEm.toFixed(2)} em（约 ${Math.round(statsGeometry(values).gap)}px）`,
  },
  {
    key: "fontScale",
    label: "字号",
    hint: "相对 Paseo 回合页脚的 13px",
    min: 0.75,
    max: 1.5,
    step: 0.05,
    describe: (values) =>
      `${Math.round(values.fontScale * 100)}%（${statsGeometry(values).fontSize}px）`,
  },
];

export function StreamStatsSettingsScreen({ theme }: PluginSurfaceProps) {
  const settings = useSettings(streamStatsSettings);
  const values = settings.status === "ready" ? settings.values : DEFAULT_STREAM_STATS;
  const editable = settings.status === "ready" && !settings.saving;

  const set = (key: keyof StreamStatsSettings, next: number) => {
    if (settings.status !== "ready" || settings.saving) return;
    if (settings.values[key] === next) return;
    void settings.save({ ...settings.values, [key]: next }, settings.revision);
  };

  const muted = theme.colors.foregroundMuted;

  return (
    <View style={{ padding: 20, gap: 18 }}>
      {FIELDS.map((field) => {
        const value = values[field.key];
        return (
          <View key={field.key} style={{ gap: 6 }}>
            <Text style={{ color: theme.colors.foreground, fontSize: 14 }}>{field.label}</Text>
            <Text style={{ color: muted, fontSize: 12 }}>{field.hint}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <StepButton
                label="−"
                disabled={!editable || value <= field.min}
                border={theme.colors.border}
                color={theme.colors.foreground}
                onPress={() => set(field.key, Math.max(field.min, round(value - field.step)))}
              />
              <Text
                style={{
                  color: theme.colors.foreground,
                  fontSize: 14,
                  minWidth: 128,
                  textAlign: "center",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {field.describe(values)}
              </Text>
              <StepButton
                label="+"
                disabled={!editable || value >= field.max}
                border={theme.colors.border}
                color={theme.colors.foreground}
                onPress={() => set(field.key, Math.min(field.max, round(value + field.step)))}
              />
            </View>
          </View>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="恢复默认"
        disabled={!editable}
        onPress={() => {
          if (settings.status !== "ready" || settings.saving) return;
          void settings.save({ ...DEFAULT_STREAM_STATS }, settings.revision);
        }}
        style={{ alignSelf: "flex-start", paddingVertical: 6 }}
      >
        <Text style={{ color: muted, fontSize: 12 }}>恢复默认（间距 0.46 em，字号 100%）</Text>
      </Pressable>
      {settings.status === "ready" ? null : (
        <Text style={{ color: theme.colors.statusWarning, fontSize: 12 }}>
          {settings.status === "loading" ? "正在读取设置…" : `设置不可用：${settings.error}`}
        </Text>
      )}
      {settings.saveError === null ? null : (
        <Text style={{ color: theme.colors.statusDanger, fontSize: 12 }}>{settings.saveError}</Text>
      )}
    </View>
  );
}

/** Stepping by 0.05 must not drift into 0.45000000000000007 and fail the schema. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function StepButton(props: {
  label: string;
  disabled: boolean;
  border: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      disabled={props.disabled}
      onPress={props.onPress}
      style={{
        width: 30,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: props.border,
        borderRadius: 6,
        opacity: props.disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ color: props.color, fontSize: 15 }}>{props.label}</Text>
    </Pressable>
  );
}
