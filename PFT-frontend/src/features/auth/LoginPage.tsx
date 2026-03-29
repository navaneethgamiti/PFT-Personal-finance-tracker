import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { loginAsync } from "@/store/slices/authSlice";
import { AuthShell } from "@/features/auth/AuthShell";

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const { register, handleSubmit } = useForm<LoginForm>();
  const dispatch = useAppDispatch();
  const authError = useAppSelector((state) => state.auth.error);
  const navigate = useNavigate();

  const onSubmit = async (values: LoginForm) => {
    await dispatch(loginAsync(values)).unwrap();
    navigate("/dashboard");
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue tracking your money with clarity." footerText="No account yet?" footerLinkLabel="Create one" footerLinkTo="/signup">
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <label className="form-field">
          Email
          <input className="input" type="email" {...register("email", { required: true })} />
        </label>
        <label className="form-field">
          Password
          <input className="input" type="password" {...register("password", { required: true })} />
        </label>
        <div className="pt-1">
          <button className="btn primary w-full" type="submit">
            Log In
          </button>
        </div>
        {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}
      </form>
      <Link to="/forgot-password" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
        Forgot password?
      </Link>
    </AuthShell>
  );
};
