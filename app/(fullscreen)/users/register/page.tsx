// app/(auth)/register/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useSearchParams } from "next/navigation";

type FieldName = "displayname" | "username" | "email" | "password1" | "password2";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [values, setValues] = useState({
    displayname: "",
    username: "",
    email: "",
    password1: "",
    password2: "",
    timezone: "",
  });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [fieldValid, setFieldValid] = useState<Record<FieldName, boolean>>({
    displayname: false,
    username: false,
    email: false,
    password1: false,
    password2: false,
  });

  const [errors, setErrors] = useState<Record<FieldName, string[]>>({
    displayname: [],
    username: [],
    email: [],
    password1: [],
    password2: [],
  });

  const requiredFieldsFilled = useMemo(() => {
    return (
      values.displayname.trim() !== "" &&
      values.username.trim() !== "" &&
      values.email.trim() !== "" &&
      values.password1.trim() !== "" &&
      values.password2.trim() !== ""
    );
  }, [values]);

  const allValid = useMemo(() => {
    return Object.values(fieldValid).every((v) => v === true);
  }, [fieldValid]);

  const canSubmit = allValid && requiredFieldsFilled;

  // Timezone (like your original)
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setValues((prev) => ({ ...prev, timezone: tz }));
  }, []);

  // --- Validation Helpers ---
  function setFieldError(field: FieldName, msgs: string[]) {
    setErrors((prev) => ({ ...prev, [field]: msgs }));
    setFieldValid((prev) => ({ ...prev, [field]: false }));
  }

  function setFieldSuccess(field: FieldName) {
    setErrors((prev) => ({ ...prev, [field]: [] }));
    setFieldValid((prev) => ({ ...prev, [field]: true }));
  }

  function basicLocalValidate(field: FieldName, value: string) {
    const v = value.trim();

    if (v === "") {
      setFieldError(field, []);
      return;
    }

    if (field === "displayname") {
      if (v.length > 15) return setFieldError(field, ["Max length is 15 characters."]);
      return setFieldSuccess(field);
    }

    if (field === "username") {
      if (v.length > 15) return setFieldError(field, ["Max length is 15 characters."]);
      if (!/^[a-z0-9_]+$/.test(v)) {
        return setFieldError(field, ["Only lowercase letters, numbers, and underscores allowed."]);
      }
      return setFieldSuccess(field);
    }

    if (field === "email") {
      if (!/^\S+@\S+\.\S+$/.test(v)) return setFieldError(field, ["Enter a valid email address."]);
      return setFieldSuccess(field);
    }

    if (field === "password1") {
      if (v.length < 8) return setFieldError(field, ["Password must be at least 8 characters."]);
      return setFieldSuccess(field);
    }

    if (field === "password2") {
      if (v !== values.password1) return setFieldError(field, ["Passwords do not match."]);
      return setFieldSuccess(field);
    }
  }

  // Debounced validation (like your original input + blur behavior)
  useEffect(() => {
    const t = setTimeout(() => basicLocalValidate("displayname", values.displayname), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.displayname]);

  useEffect(() => {
    const t = setTimeout(() => basicLocalValidate("username", values.username), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.username]);

  useEffect(() => {
    const t = setTimeout(() => basicLocalValidate("email", values.email), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.email]);

  useEffect(() => {
    const t = setTimeout(() => basicLocalValidate("password1", values.password1), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.password1]);

  useEffect(() => {
    const t = setTimeout(() => basicLocalValidate("password2", values.password2), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.password2, values.password1]);

  function inputBorder(field: FieldName) {
    if (errors[field]?.length) return "border-red-500";
    if (fieldValid[field]) return "border-green-500";
    return "border-gray-700";
  }


  



  // --- Submit ---
async function onSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!canSubmit) {
    alert("Please fill all fields correctly before submitting.");
    return;
  }

  try {
    const { error } = await signUp(
      values.email,
      values.password1,
      values.username,
      values.displayname
    );

    if (error) {
      console.error(error);

      // Backend validation support
      if (error.username) {
        setFieldError("username", Array.isArray(error.username) ? error.username : [error.username]);
      }

      if (error.email) {
        setFieldError("email", Array.isArray(error.email) ? error.email : [error.email]);
      }

      if (error.password) {
        setFieldError("password1", Array.isArray(error.password) ? error.password : [error.password]);
      }

      alert(error.message || error.detail || "Registration failed.");
      return;
    }

    // Registration successful - show confirmation message
    setRegistrationSuccess(true);

  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  }
}

const searchParams = useSearchParams();
  const { signIn, signInWithGoogle } = useAuth();


const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") || null
  );

 async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);

    try {
      const { error: googleError } = await signInWithGoogle();

      if (googleError) {
        setError(googleError.message || "Google sign-in failed");
        setLoading(false);
        return;
      }

      // Redirect handled by Supabase OAuth flow
    } catch (err) {
      console.error("GOOGLE SIGN-IN ERROR:", err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Background GIF */}
      <Image
        src="/auth/register.gif"
        alt="Register background"
        fill
        priority
        unoptimized
        className="object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Centered Card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-black/50 p-8 shadow-lg backdrop-blur-lg">
          <h2 className="mb-6 text-center text-3xl font-bold">Create an Account</h2>

          {registrationSuccess ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
                <p className="text-lg font-semibold text-green-200">Registration Successful!</p>
                <p className="mt-2 text-sm text-gray-300">
                  Please check your email <span className="font-semibold">{values.email}</span> to confirm your account.
                </p>
              </div>
              <Link
                href="/users/login"
                className="block w-full rounded-lg bg-white py-3 text-center font-bold text-black transition hover:bg-gray-300"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-gray-400">Display Name</label>
              <input
                type="text"
                maxLength={15}
                value={values.displayname}
                onChange={(e) =>
                  setValues((p) => ({ ...p, displayname: e.target.value }))
                }
                onBlur={() => basicLocalValidate("displayname", values.displayname)}
                className={`w-full rounded-lg border bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white ${inputBorder(
                  "displayname"
                )}`}
                required
              />
              {errors.displayname.map((msg, i) => (
                <div key={i} className="mt-1 text-sm text-red-400">
                  {msg}
                </div>
              ))}
            </div>

            {/* Username */}
            <div>
              <label className="block text-gray-400">Username</label>
              <input
                type="text"
                maxLength={15}
                value={values.username}
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    username: e.target.value.toLowerCase(),
                  }))
                }
                onBlur={() => basicLocalValidate("username", values.username)}
                className={`w-full rounded-lg border bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white ${inputBorder(
                  "username"
                )}`}
                required
              />
              {errors.username.map((msg, i) => (
                <div key={i} className="mt-1 text-sm text-red-400">
                  {msg}
                </div>
              ))}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-400">Email</label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
                onBlur={() => basicLocalValidate("email", values.email)}
                className={`w-full rounded-lg border bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white ${inputBorder(
                  "email"
                )}`}
                required
              />
              {errors.email.map((msg, i) => (
                <div key={i} className="mt-1 text-sm text-red-400">
                  {msg}
                </div>
              ))}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-400">Password</label>
              <input
                type="password"
                value={values.password1}
                onChange={(e) =>
                  setValues((p) => ({ ...p, password1: e.target.value }))
                }
                onBlur={() => basicLocalValidate("password1", values.password1)}
                className={`w-full rounded-lg border bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white ${inputBorder(
                  "password1"
                )}`}
                required
              />
              {errors.password1.map((msg, i) => (
                <div key={i} className="mt-1 text-sm text-red-400">
                  {msg}
                </div>
              ))}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-400">Confirm Password</label>
              <input
                type="password"
                value={values.password2}
                onChange={(e) =>
                  setValues((p) => ({ ...p, password2: e.target.value }))
                }
                onBlur={() => basicLocalValidate("password2", values.password2)}
                className={`w-full rounded-lg border bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white ${inputBorder(
                  "password2"
                )}`}
                required
              />
              {errors.password2.map((msg, i) => (
                <div key={i} className="mt-1 text-sm text-red-400">
                  {msg}
                </div>
              ))}
            </div>

            {/* Timezone hidden */}
            <input type="hidden" name="timezone" value={values.timezone} />


            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center cursor-pointer justify-center gap-3 rounded-lg border border-gray-700 bg-transparent py-3 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>



            <button
              type="submit"
              disabled={!canSubmit}
              className={
                canSubmit
                  ? "w-full cursor-pointer rounded-lg bg-white py-3 font-bold text-black transition hover:bg-gray-300"
                  : "w-full cursor-not-allowed rounded-lg bg-gray-600 py-3 font-bold text-gray-400 transition"
              }
            >
              Register
            </button>
          </form>
          )}

          {!registrationSuccess && (
            <p className="mt-4 text-center text-gray-500">
              Already have an account?{" "}
              <Link href="/users/login" className="text-white underline hover:text-gray-300">
                Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
