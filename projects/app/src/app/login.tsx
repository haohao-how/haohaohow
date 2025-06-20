import { useAuth } from "@/client/auth";
import { RectButton } from "@/client/ui/RectButton";
import { SignInWithAppleButton } from "@/client/ui/SignInWithAppleButton";
import { TextInputSingle } from "@/client/ui/TextInputSingle";
import { invariant } from "@haohaohow/lib/invariant";
import * as AppleAuthentication from "expo-apple-authentication";
import { Link } from "expo-router";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import z from "zod/v4";

export default function LoginPage() {
  const auth = useAuth();

  return (
    <View className="flex-1 items-center justify-center gap-[10px] bg-bg">
      <Text className="font-bold text-fg">Login</Text>
      <View className="gap-2">
        {auth.data?.allClientSessions.map((x, i) => (
          <View key={i} className="flex-row gap-2 border-y">
            <View className="flex-1">
              <Text className="text-fg">Session ID: {x.serverSessionId}</Text>
              <Text className="text-fg">DB name: {x.replicacheDbName}</Text>
            </View>
            <RectButton
              onPressIn={() => {
                auth.signInWithExistingClientSession(
                  (s) => s.replicacheDbName === x.replicacheDbName,
                );
              }}
            >
              Log in
            </RectButton>
          </View>
        ))}
      </View>
      <Text className="text-fg">
        Session ID: {auth.data?.clientSession.serverSessionId}
      </Text>
      <Text className="text-fg">
        DB name: {auth.data?.clientSession.replicacheDbName}
      </Text>

      <RectButton
        onPressIn={() => {
          auth.signOut();
        }}
      >
        Logout
      </RectButton>
      {__DEV__ ? <ServerSessionIdLoginForm /> : null}

      {Platform.OS === `web` ? (
        <SignInWithAppleButton
          clientId="how.haohao.app"
          onSuccess={(data) => {
            void auth.signInWithApple(data.authorization.id_token);
          }}
          redirectUri={`https://${location.hostname}/api/auth/login/apple/callback`}
        />
      ) : null}

      {Platform.OS === `ios` ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          className="h-[44px] w-[200px]"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onPress={async () => {
            let credential;
            try {
              credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
              });
            } catch (error) {
              const err = z.object({ code: z.string() }).safeParse(error);
              if (err.success) {
                switch (err.data.code) {
                  case `ERR_REQUEST_CANCELED`: {
                    // handle that the user canceled the sign-in flow
                    console.error(`request canceled`);
                    break;
                  }
                  default: {
                    console.error(
                      `unknown error code=${err.data.code}, error=`,
                      err.data,
                    );
                  }
                }
              } else {
                console.error(`unknown error (no code), error=`, error);
              }

              return;
            }

            invariant(credential.identityToken != null);

            void auth.signInWithApple(credential.identityToken);
          }}
        />
      ) : null}
      <Link href="/dev/ui" asChild>
        <RectButton variant="filled">UI</RectButton>
      </Link>

      <GoHomeButton />
    </View>
  );
}

function ServerSessionIdLoginForm() {
  const auth = useAuth();
  const [input, setInput] = useState(``);

  return (
    <TextInputSingle
      placeholder={`session ID`}
      onKeyPress={(e) => {
        if (e.nativeEvent.key === `Enter`) {
          auth.signInWithServerSessionId(input);
          e.preventDefault();
        }
      }}
      value={input}
      onChangeText={(text) => {
        setInput(text);
      }}
    />
  );
}

const GoHomeButton = () => (
  <View style={{ height: 44 }}>
    <Link dismissTo href="/learn" asChild>
      <RectButton textClassName="font-bold text-fg text-xl">Back</RectButton>
    </Link>
  </View>
);
