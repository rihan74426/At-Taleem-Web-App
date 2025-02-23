import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center p-3">
      <SignUp appearance={{ baseTheme: dark }} />
    </div>
  );
}
