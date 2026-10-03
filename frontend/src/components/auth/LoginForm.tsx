import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onExploreDemo: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignup,
  onExploreDemo,
}) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your email address and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        'Unable to sign in. Please check your email and password.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">

      {/* Heading */}
      <div className="mb-10">

        <p className="text-sm font-semibold tracking-[0.16em] uppercase text-[#18704F] mb-4">
          Welcome back
        </p>

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#123D2D]">
          Sign in
        </h1>

        <p className="mt-4 text-lg text-[#718078] leading-7">
          Continue to your SAR analysis workspace.
        </p>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-[#214236] mb-2.5"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="
              w-full
              h-14
              px-4
              rounded-xl
              border border-[#CFD8D2]
              bg-white
              text-[#17372B]
              text-base
              placeholder:text-[#A0AAA5]
              outline-none
              transition
              focus:border-[#18704F]
              focus:ring-4
              focus:ring-[#18704F]/10
            "
            required
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2.5">

            <label
              htmlFor="password"
              className="text-sm font-semibold text-[#214236]"
            >
              Password
            </label>

            <button
              type="button"
              className="text-sm font-medium text-[#18704F] hover:text-[#0F5239] transition-colors"
              onClick={() => setError('Password reset is not configured yet.')}
            >
              Forgot password?
            </button>

          </div>

          <div className="relative">

            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="
                w-full
                h-14
                px-4
                pr-20
                rounded-xl
                border border-[#CFD8D2]
                bg-white
                text-[#17372B]
                text-base
                placeholder:text-[#A0AAA5]
                outline-none
                transition
                focus:border-[#18704F]
                focus:ring-4
                focus:ring-[#18704F]/10
              "
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-sm
                font-medium
                text-[#6C7C74]
                hover:text-[#18704F]
                transition-colors
              "
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>

          </div>
        </div>

        {/* Sign in */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            h-14
            rounded-xl
            bg-[#176B4B]
            hover:bg-[#12583E]
            disabled:bg-[#9BB7AA]
            text-white
            text-base
            font-semibold
            transition-colors
            flex
            items-center
            justify-center
            gap-3
          "
        >
          {loading ? 'Signing in...' : 'Sign in'}
          {!loading && <span className="text-xl leading-none">→</span>}
        </button>

      </form>

      {/* Bottom actions */}
      <div className="mt-10 pt-8 border-t border-[#DCE2DD] text-center">

        <p className="text-base text-[#718078]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-[#176B4B] hover:text-[#0F5239]"
          >
            Create one
          </button>
        </p>

        <button
          type="button"
          onClick={onExploreDemo}
          className="
            mt-6
            text-sm
            font-semibold
            text-[#176B4B]
            hover:text-[#0F5239]
            transition-colors
          "
        >
          Explore demo workspace →
        </button>

      </div>
    </div>
  );
};

export default LoginForm;