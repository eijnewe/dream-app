import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { ApiError, apiRequest } from '@/lib/api'
import { useSession } from '@/lib/session'
import { Buffer } from 'buffer'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const fieldClassName =
  'min-h-12 rounded-md border px-3 text-foreground'

export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter()
  const { signIn } = useSession()
  const passwordInput = useRef<TextInput>(null)
  const submitting = useRef(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const title = register ? 'Skapa konto' : 'Logga in'

  async function submit() {
    if (submitting.current || registered) return
    const trimmedEmail = email.trim()
    setEmailError('')
    setPasswordError('')
    setError('')

    if (
      trimmedEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      setEmailError('Ange en giltig e-postadress.')
      return
    }
    if (!password || (register && password.length < 8)) {
      setPasswordError(
        register ?
          'Lösenordet måste ha minst 8 tecken.'
        : 'Ange ditt lösenord.',
      )
      return
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
      setPasswordError(
        'Lösenordet får vara högst 72 byte. Vissa tecken tar flera byte.',
      )
      return
    }

    submitting.current = true
    setLoading(true)
    try {
      if (register) {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: { email: trimmedEmail, password },
        })
        setPassword('')
        setRegistered(true)
      } else {
        await signIn(trimmedEmail, password)
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setError('Fel e-postadress eller lösenord.')
      } else if (cause instanceof ApiError && cause.status === 409) {
        setEmailError('E-postadressen finns redan registrerad.')
      } else {
        setError(
          register ?
            'Kontot kunde inte skapas. Försök igen.'
          : 'Inloggningen misslyckades. Försök igen.',
        )
      }
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <Box className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <VStack space="xl" className="mx-auto w-full max-w-md px-6 py-8">
              <Text className="font-semibold text-primary">dream-app</Text>
              <Heading size="2xl">{title}</Heading>
              {registered ?
                <Text accessibilityRole="alert">
                  Kontot är skapat. Du kan nu logga in.
                </Text>
              : <>
                  <FormControl isInvalid={!!emailError}>
                    <FormControlLabel>
                      <FormControlLabelText>E-postadress</FormControlLabelText>
                    </FormControlLabel>
                    <TextInput
                      className={`${fieldClassName} ${emailError ? 'border-destructive' : 'border-border'}`}
                      accessibilityLabel="E-postadress"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      editable={!loading}
                      keyboardType="email-address"
                      onChangeText={(value) => {
                        setEmail(value)
                        setEmailError('')
                      }}
                      onSubmitEditing={() => passwordInput.current?.focus()}
                      submitBehavior="submit"
                      returnKeyType="next"
                      value={email}
                    />
                    <FormControlError>
                      <FormControlErrorText accessibilityRole="alert">
                        {emailError}
                      </FormControlErrorText>
                    </FormControlError>
                  </FormControl>
                  <FormControl isInvalid={!!passwordError}>
                    <FormControlLabel>
                      <FormControlLabelText>Lösenord</FormControlLabelText>
                    </FormControlLabel>
                    <TextInput
                      className={`${fieldClassName} ${passwordError ? 'border-destructive' : 'border-border'}`}
                      ref={passwordInput}
                      accessibilityLabel="Lösenord"
                      autoCapitalize="none"
                      autoComplete={
                        register ? 'new-password' : 'current-password'
                      }
                      editable={!loading}
                      onChangeText={(value) => {
                        setPassword(value)
                        setPasswordError('')
                      }}
                      onSubmitEditing={() => void submit()}
                      returnKeyType="go"
                      secureTextEntry
                      value={password}
                    />
                    <FormControlError>
                      <FormControlErrorText accessibilityRole="alert">
                        {passwordError}
                      </FormControlErrorText>
                    </FormControlError>
                  </FormControl>
                  {!!error && (
                    <Text accessibilityRole="alert" className="text-destructive">
                      {error}
                    </Text>
                  )}
                  <Button
                    className="min-h-12"
                    variant="default"
                    isDisabled={loading}
                    onPress={() => void submit()}
                  >
                    {loading && <ActivityIndicator color="white" />}
                    <ButtonText>{loading ? 'Vänta …' : title}</ButtonText>
                  </Button>
                </>
              }
              <Button
                className="min-h-12"
                variant="secondary"
                isDisabled={loading}
                onPress={() =>
                  register ? router.dismissTo('/login') : router.push('/register')
                }
              >
                <ButtonText>
                  {register ? 'Till inloggning' : 'Skapa konto'}
                </ButtonText>
              </Button>
            </VStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Box>
  )
}
