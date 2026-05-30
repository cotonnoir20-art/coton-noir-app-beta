import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type State = { error: Error | null };

export class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={S.root}>
        <Text style={S.title}>Erreur au démarrage</Text>
        <Text style={S.subtitle}>{error.message}</Text>
        <ScrollView style={S.scroll}>
          <Text style={S.stack}>{error.stack ?? ''}</Text>
        </ScrollView>
      </View>
    );
  }
}

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 16,
  },
  scroll: { flex: 1 },
  stack: {
    fontSize: 11,
    color: '#aaaaaa',
    lineHeight: 18,
  },
});
