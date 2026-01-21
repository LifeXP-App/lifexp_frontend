// app/(auth)/login/page.tsx
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Background GIF */}
      <Image
        src="/auth/login.gif"
        alt="Login background"
        fill
        priority
        className="object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Centered Card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-black/50 p-8 shadow-lg backdrop-blur-lg">
          <h2 className="mb-6 text-center text-3xl font-bold">Welcome Back</h2>

          <form method="post" className="space-y-4">
            <div>
              <label className="block text-gray-400">Username</label>
              <input
                type="text"
                name="username"
                required
                className="w-full rounded-lg border border-gray-700 bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-gray-400">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full rounded-lg border border-gray-700 bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-white py-3 font-bold text-black transition hover:bg-gray-300"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <a href="/users/register" className="underline text-white hover:text-gray-300">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
