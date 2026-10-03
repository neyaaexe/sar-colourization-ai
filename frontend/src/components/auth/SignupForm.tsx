import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSwitchToLogin,
}) => {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(email, password);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        'Registration failed. Email may already be in use.';

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">

      {/* Heading */}
      <div className="mb-10">

        <p className="text-sm font-semibold tracking-[0.16em] uppercase text-[#18704F] mb-4">
          Get started
        </p>

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#123D2D]">
          Create account
        </h1>

        <p className="mt-4 text-lg text-[#718078] leading-7">
          Create your workspace and start analysing SAR imagery.
        </p>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Email */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-semibold text-[#214236] mb-2.5"
          >
            Email address
          </label>

          <input
            id="signup-email"
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
          <label
            htmlFor="signup-password"
            className="block text-sm font-semibold text-[#214236] mb-2.5"
          >
            Password
          </label>

          <div className="relative">

            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
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
              "
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>

          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-semibold text-[#214236] mb-2.5"
          >
            Confirm password
          </label>

          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
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

        {/* Create account */}
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
          {loading ? 'Creating account...' : 'Create account'}
          {!loading && (
            <span className="text-xl leading-none">→</span>
          )}
        </button>

      </form>

      {/* Login */}
      <div className="mt-10 pt-8 border-t border-[#DCE2DD] text-center">

        <p className="text-base text-[#718078]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-[#176B4B] hover:text-[#0F5239]"
          >
            Sign in
          </button>
        </p>

      </div>

    </div>
  );
};

export default SignupForm;