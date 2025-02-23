import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center p-3">
      <SignIn appearance={{ baseTheme: dark }} />
    </div>
  );
}
