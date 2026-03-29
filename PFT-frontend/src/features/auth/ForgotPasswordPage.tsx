import { useForm } from "react-hook-form";
import { AuthShell } from "@/features/auth/AuthShell";
import { backendApi } from "@/services/backendApi";

interface ForgotPasswordForm {
  email: string;
}

export const ForgotPasswordPage = () => {
  const { register, handleSubmit, reset } = useForm<ForgotPasswordForm>();
  const onSubmit = async (values: ForgotPasswordForm) => {
    await backendApi.forgotPassword({ email: values.email });
    reset();
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will send reset instructions to your email address."
      footerText="Remember your password?"
      footerLinkLabel="Back to login"
      footerLinkTo="/"
    >
      <form
        className="space-y-3"
        onSubmit={handleSubmit(onSubmit)}
      >
        <label className="form-field">
          Email
          <input className="input" type="email" {...register("email", { required: true })} placeholder="you@example.com" />
        </label>
        <button className="btn primary w-full" type="submit">
          Send Reset Link
        </button>
      </form>
    </AuthShell>
  );
};
