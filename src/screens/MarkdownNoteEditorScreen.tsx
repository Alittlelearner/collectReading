import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MarkdownNoteEditorScreenProps } from '../navigation/types';
import { useMarkdownNote } from '../hooks/useMarkdownNotes';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';

export default function MarkdownNoteEditorScreen() {
  const route = useRoute<MarkdownNoteEditorScreenProps['route']>();
  const noteState = useMarkdownNote(route.params.noteId);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (noteState.note && !dirty) {
      setContent(noteState.note.content);
    }
  }, [noteState.note, dirty]);

  const save = async () => {
    setSaving(true);
    try {
      await noteState.saveContent(content);
      setDirty(false);
    } catch (err: any) {
      Alert.alert('Save failed', err.message || 'Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  const insertImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        base64: Platform.OS === 'web',
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = await noteState.addAsset(result.assets[0]);
      const imageMarkdown = `\n\n![${asset.fileName}](./assets/${asset.fileName})\n`;
      setContent((current) => `${current.trimEnd()}${imageMarkdown}`);
      setDirty(true);
    } catch (err: any) {
      Alert.alert('Image insert failed', err.message || 'Please try again later.');
    }
  };

  const updateContent = (value: string) => {
    setContent(value);
    setDirty(true);
  };

  if (noteState.loading || !noteState.note) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.toolbar}>
          <View style={styles.toolbarText}>
            <Text style={styles.title} numberOfLines={1}>{noteState.note.title}</Text>
            <Text style={styles.path} numberOfLines={1}>{noteState.note.markdownPath}</Text>
          </View>
          <TouchableOpacity style={styles.iconAction} onPress={() => setShowPreview((value) => !value)}>
            <MaterialCommunityIcons
              name={showPreview ? 'pencil-outline' : 'eye-outline'}
              size={19}
              color={colors.primaryDark}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction} onPress={insertImage}>
            <MaterialCommunityIcons name="image-plus-outline" size={19} color={colors.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving || !dirty}>
            <Text style={[styles.saveText, (!dirty || saving) && styles.saveTextDisabled]}>
              {saving ? 'Saving' : dirty ? 'Save' : 'Saved'}
            </Text>
          </TouchableOpacity>
        </View>

        {showPreview ? (
          <ScrollView style={styles.preview} contentContainerStyle={styles.previewContent}>
            <Text style={styles.previewText}>{content}</Text>
          </ScrollView>
        ) : (
          <TextInput
            style={styles.editor}
            value={content}
            onChangeText={updateContent}
            multiline
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect
            placeholder="# Title&#10;&#10;Start writing..."
            placeholderTextColor={colors.textMuted}
          />
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{noteState.assets.length} images in assets</Text>
          <Text style={styles.footerText}>{noteState.note.wordCount} words</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  toolbarText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  path: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  iconAction: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMuted,
  },
  saveButton: {
    minWidth: 70,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  saveText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  saveTextDisabled: {
    opacity: 0.55,
  },
  editor: {
    flex: 1,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  preview: {
    flex: 1,
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  previewContent: {
    padding: spacing.lg,
  },
  previewText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
