import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface URLInputProps {
  value: string;
  onChangeText: (text: string) => void;
  loading?: boolean;
  error?: string;
  autoFocus?: boolean;
}

export default function URLInput({
  value,
  onChangeText,
  loading,
  error,
  autoFocus = true,
}: URLInputProps) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!checked && !value) {
      Clipboard.getStringAsync()
        .then((text) => {
          if (text && /^https?:\/\//.test(text.trim())) {
            onChangeText(text.trim());
          }
        })
        .catch(() => {
          // Web browsers can deny clipboard reads unless the user explicitly grants access.
        })
        .finally(() => setChecked(true));
    }
  }, []);

  const isValid = !value || /^https?:\/\/.+/.test(value);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, !isValid && styles.inputError]}
        placeholder="粘贴链接，自动识别标题、作者和简介..."
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
      {loading && <ActivityIndicator style={styles.loader} color={colors.primary} size="small" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isValid && value.length > 0 ? <Text style={styles.error}>请输入有效链接</Text> : null}
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
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
