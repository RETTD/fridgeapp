import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { trpc } from '../utils/trpc';
import '../i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState<string>('en');

  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      i18n.changeLanguage(language);
    },
    onError: (error) => {
      console.error('Settings update error:', error);
    },
  });

  useEffect(() => {
    if (settings?.language) {
      setLanguage(settings.language);
    }
  }, [settings]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    updateMutation.mutate({ language: newLanguage as 'en' | 'pl' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#0EA5E9" />
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>{t('settings.language')}</Text>
            <View style={styles.options}>
              <TouchableOpacity
                style={[styles.option, language === 'en' && styles.optionActive]}
                onPress={() => handleLanguageChange('en')}
                disabled={updateMutation.isLoading}
              >
                <Text style={[styles.optionText, language === 'en' && styles.optionTextActive]}>
                  {t('settings.english')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, language === 'pl' && styles.optionActive]}
                onPress={() => handleLanguageChange('pl')}
                disabled={updateMutation.isLoading}
              >
                <Text style={[styles.optionText, language === 'pl' && styles.optionTextActive]}>
                  {t('settings.polish')}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>{t('settings.selectLanguage')}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0C4A6E',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 12,
  },
  options: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    backgroundColor: '#FFFFFF',
  },
  optionActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  optionText: {
    fontSize: 16,
    color: '#0C4A6E',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
});

