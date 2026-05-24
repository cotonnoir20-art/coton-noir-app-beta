import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../../src/components/BackButton';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/theme/colors';
import { canAttemptAuth, recordAuthAttempt } from '../../src/lib/authThrottle';
import {
  getDevDemoLoginCredentials,
  getDevDemoLoginHint,
  isDemoModeAvailable,
} from '../../src/lib/demoMode';
import {
  mapSupabaseAuthError,
  PASSWORD_POLICY_HINT,
  validatePassword,
} from '../../src/lib/passwordPolicy';
import { AuthBrandLogo } from '../../src/components/auth/AuthBrandLogo';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const router  = useRouter();
  const [mode, setMode]         = useState<Mode>('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email et mot de passe obligatoires.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Ton prénom est requis.');
        return;
      }
      const pwdCheck = validatePassword(password);
      if (!pwdCheck.ok) {
        setError(pwdCheck.message);
        return;
      }
    }

    const throttle = canAttemptAuth();
    if (!throttle.allowed) {
      setError(throttle.message);
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      recordAuthAttempt(!err);
      if (err) {
        setError(mapSupabaseAuthError(err.message));
        setLoading(false);
        return;
      }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });
      recordAuthAttempt(!err);
      if (err) {
        setError(mapSupabaseAuthError(err.message));
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.replace('/(tabs)');
  }

  async function handleDevDemoLogin() {
    const creds = getDevDemoLoginCredentials();
    if (!creds) {
      setError(getDevDemoLoginHint() ?? 'Connexion démo indisponible.');
      return;
    }
    const throttle = canAttemptAuth();
    if (!throttle.allowed) {
      setError(throttle.message);
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword(creds);
    recordAuthAttempt(!err);
    setLoading(false);
    if (err) {
      setError(mapSupabaseAuthError(err.message));
      return;
    }
    router.replace('/(tabs)');
  }

  async function handleForgotPassword() {
    if (!email.trim()) { setError('Entre ton email d\'abord.'); return; }
    const throttle = canAttemptAuth();
    if (!throttle.allowed) {
      setError(throttle.message);
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    recordAuthAttempt(!err);
    if (err) setError(mapSupabaseAuthError(err.message));
    else setError('Email de réinitialisation envoyé !');
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.content}
          keyboardShouldPersistTaps="handled"
        >

          {/* Back */}
          <BackButton style={S.backBtn} onPress={() => router.back()} />

          {/* Logo */}
          <View style={S.logoZone}>
            <AuthBrandLogo width={168} variant="circle" />
          </View>

          {/* Toggle */}
          <View style={S.toggle}>
            <TouchableOpacity
              style={[S.toggleBtn, mode === 'login' && S.toggleBtnActive]}
              onPress={() => { setMode('login'); setError(''); }}
            >
              <Text style={[S.toggleText, mode === 'login' && S.toggleTextActive]}>
                Se connecter
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.toggleBtn, mode === 'signup' && S.toggleBtnActive]}
              onPress={() => { setMode('signup'); setError(''); }}
            >
              <Text style={[S.toggleText, mode === 'signup' && S.toggleTextActive]}>
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={[S.errorText, error.includes('envoyé') && { color: Colors.sage }]}>
              {error}
            </Text>
          ) : null}

          {/* Prénom (signup seulement) */}
          {mode === 'signup' && (
            <View style={S.inputGroup}>
              <Text style={S.inputLabel}>Prénom</Text>
              <TextInput
                style={S.input}
                placeholder="Aïssatou"
                placeholderTextColor={Colors.warmGray}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email */}
          <View style={S.inputGroup}>
            <Text style={S.inputLabel}>Email</Text>
            <TextInput
              style={S.input}
              placeholder="toi@email.com"
              placeholderTextColor={Colors.warmGray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Mot de passe */}
          <View style={S.inputGroup}>
            <Text style={S.inputLabel}>Mot de passe</Text>
            <View style={S.pwdRow}>
              <TextInput
                style={[S.input, { flex: 1, borderWidth: 0 }]}
                placeholder={mode === 'signup' ? '8+ caractères, complexe' : 'Ton mot de passe'}
                placeholderTextColor={Colors.warmGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={S.pwdToggle}
                onPress={() => setShowPwd(v => !v)}
              >
                <Ionicons
                  name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.warmGray}
                />
              </TouchableOpacity>
            </View>
            {mode === 'signup' && (
              <Text style={S.policyHint}>{PASSWORD_POLICY_HINT}</Text>
            )}
          </View>

          {/* Mot de passe oublié */}
          {mode === 'login' && (
            <TouchableOpacity style={S.forgotLink} onPress={handleForgotPassword}>
              <Text style={S.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[S.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : (
                <Text style={S.submitBtnText}>
                  {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}{' '}
                  <Text style={S.submitBtnAccent}>→</Text>
                </Text>
                )}
          </TouchableOpacity>

          {/* Lien onboarding */}
          {mode === 'login' && (
            <TouchableOpacity
              style={S.onboardingLink}
              onPress={() => router.push('/(auth)/onboarding')}
            >
              <Text style={S.onboardingLinkText}>
                Nouvelle ? Découvrir mon type de cheveux →
              </Text>
            </TouchableOpacity>
          )}

          {isDemoModeAvailable() && mode === 'login' && (
            <View style={S.devDemoZone}>
              <Text style={S.devDemoHint}>{getDevDemoLoginHint()}</Text>
              <TouchableOpacity
                style={S.devDemoBtn}
                onPress={handleDevDemoLogin}
                disabled={loading || !getDevDemoLoginCredentials()}
              >
                <Text style={S.devDemoBtnText}>Connexion démo (dev)</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 24, paddingBottom: 40 },

  backBtn: {
    marginTop: 8,
    marginBottom: 8,
  },

  logoZone: { alignItems: 'center', paddingVertical: 16, marginBottom: 4 },

  // Toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 4, marginBottom: 24,
  },
  toggleBtn:        { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  toggleBtnActive:  { backgroundColor: Colors.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  toggleText:       { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  toggleTextActive: { fontFamily: 'DMSans_700Bold', color: Colors.ink },

  errorText: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.rose, marginBottom: 16, textAlign: 'center',
  },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
  },
  pwdRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingRight: 12,
  },
  pwdToggle: { padding: 4 },
  policyHint: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 6,
    lineHeight: 15,
  },

  forgotLink:  { alignItems: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText:  { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.amber },

  submitBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  submitBtnAccent: {
    color: Colors.amber,
    fontFamily: 'DMSans_700Bold',
  },

  onboardingLink:     { alignItems: 'center', marginTop: 4 },
  onboardingLinkText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  devDemoZone: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  devDemoHint: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 16,
  },
  devDemoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  devDemoBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
});
