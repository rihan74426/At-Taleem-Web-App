import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center p-3 min-h-screen">
      <SignUp />
    </div>
  );
}
