import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import { CC_ONBOARDING_GIFT } from '../../lib/cotonCoins';
import { PASSWORD_POLICY_HINT } from '../../lib/passwordPolicy';

type Props = {
  name: string;
  email: string;
  password: string;
  error: string;
  loading: boolean;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void;
};

export function OnboardingSignUpStep({
  name,
  email,
  password,
  error,
  loading,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: Props) {
  const router = useRouter();

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Sauvegarde tes recommandations</Text>
      <Text style={s.sub}>
        Crée ton compte pour débloquer ta routine complète et tes {CC_ONBOARDING_GIFT} CotonCoins offerts.
      </Text>

      {error ? <Text style={s.errorText}>{error}</Text> : null}

      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>Prénom</Text>
        <TextInput
          style={s.input}
          placeholder="Aïssatou"
          placeholderTextColor={Colors.warmGray}
          value={name}
          onChangeText={onNameChange}
          autoCapitalize="words"
        />
      </View>
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>Email</Text>
        <TextInput
          style={s.input}
          placeholder="toi@email.com"
          placeholderTextColor={Colors.warmGray}
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>Mot de passe</Text>
        <TextInput
          style={s.input}
          placeholder="8+ caractères, complexe"
          placeholderTextColor={Colors.warmGray}
          value={password}
          onChangeText={onPasswordChange}
          secureTextEntry
          autoCapitalize="none"
        />
        <Text style={s.policyHint}>{PASSWORD_POLICY_HINT}</Text>
      </View>

      <TouchableOpacity
        style={[s.primaryBtn, loading && { opacity: 0.7 }]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={s.primaryBtnText}>
            Sauvegarder mon plan <Text style={s.primaryBtnAccent}>→</Text>
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={s.loginLink} onPress={() => router.push('/(auth)/login')}>
        <Text style={s.loginLinkText}>J'ai déjà un compte · Se connecter</Text>
      </TouchableOpacity>
      <Text style={s.trustLine}>Pas de spam · Tes données restent privées</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 32 },
  title: {
    fontSize: 24,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 8,
    lineHeight: 32,
  },
  sub: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
  },
  policyHint: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 6,
    lineHeight: 15,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.rose,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.white },
  primaryBtnAccent: { color: Colors.amber },
  loginLink: { alignItems: 'center', marginTop: 14 },
  loginLinkText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  trustLine: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginTop: 12,
  },
});
