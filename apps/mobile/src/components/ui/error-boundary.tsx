/**
 * Error boundaries for Pichichi.
 *
 * Two variants:
 *  - SectionErrorBoundary: inline card fallback for dashboard sections
 *  - AppErrorBoundary: full-screen fallback for the root layout
 *
 * IMPORTANT — NativeWind v4:
 * All visual props use StyleSheet. No className on these components.
 */

import { Component } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

import { COLORS } from '@/theme/colors';

// ─── Shared State ────────────────────────────────────────────────────────────

interface State {
  hasError: boolean;
}

// ─── SectionErrorBoundary ────────────────────────────────────────────────────
//
// Usage:
//   <SectionErrorBoundary label="partidos de hoy">
//     <TodayMatchesSection ... />
//   </SectionErrorBoundary>

interface SectionProps {
  children: React.ReactNode;
  /** Human-readable section name shown in the fallback message. */
  label?: string;
}

export class SectionErrorBoundary extends Component<SectionProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: hook into a crash reporter (Sentry, etc.) here
    console.error('[SectionErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.label ?? 'esta sección';

    return (
      <View style={sectionStyles.container}>
        <AlertTriangle size={24} color={COLORS.warning} />
        <Text style={sectionStyles.title}>No se pudo cargar {label}</Text>
        <Pressable
          onPress={this.reset}
          style={({ pressed }) => [sectionStyles.button, pressed && sectionStyles.buttonPressed]}
        >
          <Text style={sectionStyles.buttonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }
}

const sectionStyles = StyleSheet.create({
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

// ─── AppErrorBoundary ────────────────────────────────────────────────────────
//
// Full-screen fallback. Wrap the root Stack in _layout.tsx.
//
// Usage:
//   <AppErrorBoundary>
//     <Stack ... />
//   </AppErrorBoundary>

interface AppProps {
  children: React.ReactNode;
}

export class AppErrorBoundary extends Component<AppProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: hook into a crash reporter (Sentry, etc.) here
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={appStyles.root}>
        <View style={appStyles.content}>
          <AlertTriangle size={48} color={COLORS.warning} />
          <Text style={appStyles.title}>Algo salió mal</Text>
          <Text style={appStyles.subtitle}>
            Ocurrió un error inesperado.{'\n'}Intentá de nuevo.
          </Text>
          <Pressable
            onPress={this.reset}
            style={({ pressed }) => [appStyles.button, pressed && appStyles.buttonPressed]}
          >
            <Text style={appStyles.buttonText}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const appStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary.DEFAULT,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
