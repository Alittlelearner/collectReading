import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface URLInputProps {
  value: string;
  onChangeText: (text: string) => void;
  loading?: boolean;
  error?: string;
  autoFocus?: boolean;
}

export default function URLInput({ value, onChangeText, loading, error, autoFocus = true }: URLInputProps) {
  const isValid = value === '' || /^https?:\/\/.+/.test(value);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, !isValid && styles.inputError]}
        placeholder="粘贴链接，自动识别标题和来源..."
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="done"
        editable={!loading}
      />
      {!!loading && (
        <ActivityIndicator
          style={styles.loader}
          color={colors.primary}
          size="small"
        />
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!isValid && value.length > 0 && (
        <Text style={styles.error}>请输入有效链接</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    paddingRight: 44,
  },
  inputError: {
    borderColor: colors.error,
  },
  loader: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
