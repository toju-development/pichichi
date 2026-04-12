/**
 * SectionErrorBoundary — catches render errors in a subtree and shows
 * a styled fallback instead of crashing the whole screen.
 *
 * Usage:
 *   <SectionErrorBoundary label="partidos de hoy">
 *     <TodayMatchesSection ... />
 *   </SectionErrorBoundary>
 *
 * IMPORTANT — NativeWind v4:
 * All visual props use StyleSheet. No className on this component.
 */

import { Component } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

import { COLORS } from '@/theme/colors';

// ─── Props & State ───────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  /** Human-readable section name shown in the fallback message. */
  label?: string;
}

interface State {
  hasError: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: hook into a crash reporter (Sentry, etc.) here
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.label ?? 'esta sección';

    return (
      <View style={styles.container}>
        <AlertTriangle size={24} color={COLORS.warning} />
        <Text style={styles.title}>No se pudo cargar {label}</Text>
        <Pressable onPress={this.reset} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary.DEFAULT,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
  },
});
