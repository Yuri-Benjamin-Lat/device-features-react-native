import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';

import { RootStackParamList, TravelEntry } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useEntries } from '../context/EntriesContext';
import { CameraService } from '../../services/CameraService';
import { LocationService } from '../../services/LocationService';
import { NotificationService } from '../../services/NotificationService';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEntry'>;

interface FormState {
  imageUri: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface FormErrors {
  image?: string;
  address?: string;
  location?: string;
}

const EMPTY_FORM: FormState = {
  imageUri: '',
  address: '',
  latitude: 0,
  longitude: 0,
};

export default function AddEntryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { addEntry } = useEntries();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track if form has been reset after navigation back
  const isFirstLoad = useRef(true);
  if (isFirstLoad.current) {
    isFirstLoad.current = false;
  }

  // ─── Validation ────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.imageUri) {
      newErrors.image = 'Please take or select a photo before saving.';
    }

    if (!form.address.trim()) {
      newErrors.address =
        'Address is required. Use "Get Location" or type it manually.';
    } else if (form.address.trim().length < 3) {
      newErrors.address = 'Address must be at least 3 characters.';
    }

    if (form.imageUri && form.latitude === 0 && form.longitude === 0) {
      // Allow manual address without GPS, but warn if address looks suspicious
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ─── Image Handlers ─────────────────────────────────────────────────
  const handleTakePhoto = useCallback(async () => {
    const result = await CameraService.takePhoto();
    if (!result) return;

    setForm((prev) => ({ ...prev, imageUri: result.uri }));
    clearFieldError('image');
    // Automatically get location after taking photo
    await handleGetLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePickGallery = useCallback(async () => {
    const result = await CameraService.pickFromGallery();
    if (!result) return;

    setForm((prev) => ({ ...prev, imageUri: result.uri }));
    clearFieldError('image');
    await handleGetLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Location Handler ────────────────────────────────────────────────
  const handleGetLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    clearFieldError('location');
    try {
      const location = await LocationService.getCurrentLocation();
      setForm((prev) => ({
        ...prev,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      clearFieldError('address');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get location.';
      setErrors((prev) => ({ ...prev, location: message }));
      Alert.alert('Location Error', message, [{ text: 'OK' }]);
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  // ─── Save Handler ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const entry: TravelEntry = {
        id: Crypto.randomUUID(),
        imageUri: form.imageUri,
        address: form.address.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        createdAt: new Date().toISOString(),
      };

      await addEntry(entry);

      // Send local notification
      await NotificationService.sendEntrySavedNotification(entry.address);

      // Reset form state
      setForm(EMPTY_FORM);
      setErrors({});

      // Navigate back to Home using goBack
      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save entry.';
      Alert.alert('Save Error', message, [{ text: 'OK' }]);
    } finally {
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, addEntry, navigation]);

  // ─── Discard / Go Back ───────────────────────────────────────────────
  const handleGoBack = useCallback(() => {
    const hasData = form.imageUri || form.address;
    if (hasData) {
      Alert.alert(
        'Discard Entry?',
        'You have unsaved changes. Going back will clear this entry.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setForm(EMPTY_FORM);
              setErrors({});
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [form, navigation]);

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Image Section ── */}
          <SectionLabel text="Photo" theme={theme} />

          {form.imageUri ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: form.imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
                accessibilityLabel="Selected travel photo"
              />
              <Pressable
                onPress={() => {
                  setForm((prev) => ({ ...prev, imageUri: '' }));
                }}
                style={({ pressed }) => [
                  styles.clearImageBtn,
                  { backgroundColor: theme.danger, opacity: pressed ? 0.7 : 1 },
                ]}
                accessibilityLabel="Remove photo"
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                  ✕ Remove
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.image ? theme.danger : theme.border,
                },
              ]}
            >
              <Text style={[styles.placeholderIcon, { color: theme.emptyIcon }]}>
                📷
              </Text>
              <Text style={[styles.placeholderText, { color: theme.textMuted }]}>
                No photo selected
              </Text>
            </View>
          )}

          {errors.image && (
            <ErrorText message={errors.image} theme={theme} />
          )}

          {/* ── Camera/Gallery Buttons ── */}
          <View style={styles.imageActions}>
            <Pressable
              onPress={handleTakePhoto}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: theme.primary,
                  flex: 1,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityLabel="Take a photo"
              accessibilityRole="button"
              disabled={isSaving}
            >
              <Text style={[styles.actionBtnText, { color: theme.primaryText }]}>
                📷 Camera
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePickGallery}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  flex: 1,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityLabel="Pick from gallery"
              accessibilityRole="button"
              disabled={isSaving}
            >
              <Text style={[styles.actionBtnText, { color: theme.text }]}>
                🖼 Gallery
              </Text>
            </Pressable>
          </View>

          {/* ── Location Section ── */}
          <SectionLabel text="Location" theme={theme} />

          <View style={styles.locationRow}>
            <TextInput
              value={form.address}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, address: text }));
                if (text.trim()) clearFieldError('address');
              }}
              placeholder="Address will appear here..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.addressInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.address ? theme.danger : theme.border,
                  color: theme.text,
                  flex: 1,
                },
              ]}
              multiline
              numberOfLines={2}
              accessibilityLabel="Address input"
              editable={!isSaving}
            />

            <Pressable
              onPress={handleGetLocation}
              style={({ pressed }) => [
                styles.locationBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed || isLoadingLocation ? 0.7 : 1,
                },
              ]}
              disabled={isLoadingLocation || isSaving}
              accessibilityLabel="Get current location"
              accessibilityRole="button"
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={theme.primaryText} />
              ) : (
                <Text style={[styles.locationBtnText, { color: theme.primaryText }]}>
                  📍
                </Text>
              )}
            </Pressable>
          </View>

          {errors.address && (
            <ErrorText message={errors.address} theme={theme} />
          )}
          {errors.location && (
            <ErrorText message={errors.location} theme={theme} />
          )}

          <Text style={[styles.locationHint, { color: theme.textMuted }]}>
            Tap 📍 to auto-fill from GPS, or type manually.
          </Text>

          {/* ── Action Buttons ── */}
          <View style={styles.formActions}>
            <Pressable
              onPress={handleGoBack}
              style={({ pressed }) => [
                styles.cancelBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityLabel="Go back without saving"
              accessibilityRole="button"
              disabled={isSaving}
            >
              <Text style={[styles.cancelBtnText, { color: theme.text }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed || isSaving ? 0.75 : 1,
                  flex: 1,
                },
              ]}
              disabled={isSaving}
              accessibilityLabel="Save travel entry"
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.primaryText} />
              ) : (
                <Text style={[styles.saveBtnText, { color: theme.primaryText }]}>
                  💾 Save Entry
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SectionLabel({
  text,
  theme,
}: {
  text: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <Text style={[sectionStyles.label, { color: theme.textSecondary }]}>
      {text.toUpperCase()}
    </Text>
  );
}

function ErrorText({
  message,
  theme,
}: {
  message: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <Text style={[sectionStyles.error, { color: theme.danger }]}>
      ⚠ {message}
    </Text>
  );
}

const sectionStyles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
  },
  clearImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imagePlaceholder: {
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderIcon: {
    fontSize: 40,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  addressInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  locationBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  locationBtnText: {
    fontSize: 22,
  },
  locationHint: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelBtn: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 27,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});