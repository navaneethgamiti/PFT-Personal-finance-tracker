import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "@/features/auth/AuthShell";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { registerAsync } from "@/store/slices/authSlice";

interface SignUpForm {
  email: string;
  password: string;
  displayName: string;
}

export const SignUpPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignUpForm>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authError = useAppSelector((state) => state.auth.error);

  const onSubmit = async (values: SignUpForm) => {
    await dispatch(registerAsync({ fullName: values.displayName, email: values.email, password: values.password })).unwrap();
    navigate("/dashboard");
  };

  return (
    <AuthShell title="Create account" subtitle="Start building healthier money habits today." footerText="Already registered?" footerLinkLabel="Sign in" footerLinkTo="/">
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <label className="form-field">
          Name
          <input className="input" {...register("displayName", { required: "Name is required." })} />
          {errors.displayName ? <small className="text-xs text-rose-500">{errors.displayName.message}</small> : null}
        </label>
        <label className="form-field">
          Email
          <input className="input" type="email" {...register("email", { required: "Email is required." })} />
          {errors.email ? <small className="text-xs text-rose-500">{errors.email.message}</small> : null}
        </label>
        <label className="form-field">
          Password
          <input
            className="input"
            type="password"
            {...register("password", {
              required: "Password is required.",
              minLength: { value: 8, message: "Password must be at least 8 characters." }
            })}
          />
          {errors.password ? <small className="text-xs text-rose-500">{errors.password.message}</small> : null}
        </label>
        <button className="btn primary w-full" type="submit">
          Create Account
        </button>
        {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}
      </form>
    </AuthShell>
  );
};
