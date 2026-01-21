// app/(auth)/register/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FieldName = "displayname" | "username" | "email" | "password1" | "password2";

export default function RegisterPage() {
  const [values, setValues] = useState({
    displayname: "",
    username: "",
    email: "",
    password1: "",
    password2: "",
    timezone: "",
  });

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

    // Replace with your real endpoint
    // Example: POST to /api/register or your backend
    console.log("Register payload:", values);

    // fetch("/api/register", { method: "POST", body: JSON.stringify(values) })
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Background GIF */}
      <Image
        src="/auth/register.gif"
        alt="Register background"
        fill
        priority
        className="object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Centered Card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-black/50 p-8 shadow-lg backdrop-blur-lg">
          <h2 className="mb-6 text-center text-3xl font-bold">Create an Account</h2>

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

          <p className="mt-4 text-center text-gray-500">
            Already have an account?{" "}
            <Link href="/users/login" className="text-white underline hover:text-gray-300">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
