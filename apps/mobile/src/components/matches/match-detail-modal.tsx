/**
 * Match detail modal — renders the API-Football game widget via WebView.
 *
 * Shows the live/post-match widget for a given fixture when tapped from
 * locked/live match cards where prediction entry is not available.
 *
 * IMPORTANT — NativeWind v4:
 * ALL visual properties use StyleSheet. Never mix style + className on
 * the same element. No emoji icons — Lucide only.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import Constants from 'expo-constants';

import { COLORS } from '@/theme/colors';

// ─── API URL Resolution ─────────────────────────────────────────────────────

/**
 * Build the widget proxy base URL.
 *
 * In development the WebView can't resolve `localhost` — it runs in its own
 * process with no access to the host loopback.  We grab the machine's LAN IP
 * from the Expo dev-server host so the URL works on simulators, emulators AND
 * physical devices without platform-specific hacks.
 */
function getWidgetProxyBaseUrl(): string {
  const baseUrl =
    process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

  if (__DEV__) {
    const debuggerHost =
      Constants.expoConfig?.hostUri ??
      Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const hostname = debuggerHost.split(':')[0];
      return baseUrl.replace('localhost', hostname);
    }
  }

  return baseUrl;
}

/** Widget proxy endpoint — proxies API-Football requests through our backend */
const WIDGET_PROXY_URL = `${getWidgetProxyBaseUrl()}/widgets/football/`;

// ─── Props ──────────────────────────────────────────────────────────────────

interface MatchDetailModalProps {
  /** The API-Football fixture ID. `null` means the modal is closed. */
  externalId: number | null;
  /** Called when the user closes the modal. */
  onClose: () => void;
}

// ─── Widget HTML ────────────────────────────────────────────────────────────

function buildWidgetHtml(externalId: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
  <style>
    api-sports-widget[data-theme="pichichi"] {
      --primary-color: #0B6E4F;
      --success-color: #10B981;
      --warning-color: #F59E0B;
      --danger-color: #E63946;
      --light-color: #6B7280;

      --home-color: #0B6E4F;
      --away-color: #FFD166;

      --text-color: #1A1A2E;
      --text-color-info: #6B7280;

      --background-color: #F0FAF4;

      --primary-font-size: 0.72rem;
      --secondary-font-size: 0.75rem;
      --button-font-size: 0.8rem;
      --title-font-size: 0.9rem;

      --border: 1px solid #E5E7EB;
      --game-height: 2.3rem;
      --league-height: 2.35rem;

      --score-size: 2.25rem;
      --flag-size: 22px;
      --teams-logo-size: 18px;
      --teams-logo-size-xl: 5rem;
      --hover: rgba(11, 110, 79, 0.08);
    }
  </style>
</head>
<body style="margin:0;padding:12px;background:#F0FAF4;">
  <api-sports-widget
    data-type="game"
    data-game-id="${externalId}"
    data-theme="pichichi"
  ></api-sports-widget>

  <api-sports-widget
    data-type="config"
    data-key="835764c09b77b127b7fe28572d755683"
    data-sport="football"
    data-lang="es"
    data-theme="pichichi"
    data-url-football="${WIDGET_PROXY_URL}"
  ></api-sports-widget>
</body>
</html>`;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MatchDetailModal({ externalId, onClose }: MatchDetailModalProps) {
  return (
    <Modal
      visible={externalId !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Header bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detalle del Partido</Text>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <X size={20} color={COLORS.text.secondary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* WebView with API-Football widget */}
        {externalId !== null ? (
          <WebView
            source={{ html: buildWidgetHtml(externalId) }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            scrollEnabled
          />
        ) : null}
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── WebView ─────────────────────────────────────────────────────────────
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
