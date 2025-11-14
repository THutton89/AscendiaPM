import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GitHubSignInButton from '../components/GitHubSignInButton';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Collaborator');
  const [error, setError] = useState('');
  const { login, googleSignIn, githubSignIn, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthProcessed = useRef(false);

  // Handle OAuth callback
  useEffect(() => {
    // Prevent multiple executions
    if (oauthProcessed.current) return;

    const success = searchParams.get('success');
    const userParam = searchParams.get('user');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      oauthProcessed.current = true;
      setError(decodeURIComponent(errorParam));
      // Clean up URL
      navigate('/login', { replace: true });
    } else if (success && userParam) {
      oauthProcessed.current = true;
      try {
        const authData = JSON.parse(decodeURIComponent(userParam));
        const { user, token } = authData;
        login(user, token);
        // Clean up URL and redirect
        navigate('/', { replace: true });
      } catch (err) {
        setError('Failed to process authentication');
        navigate('/login', { replace: true });
      }
    }
  }, [searchParams, navigate]); // Removed login from dependencies

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api('login', { email, password });
      const { user, token } = response;
      login(user, token);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api('signup', { name, email, password, role });
      const { user, token } = response;
      login(user, token);
      navigate('/');
    } catch (err) {
      setError('Could not create account');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await googleSignIn();
      navigate('/');
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      setError('');
      await githubSignIn();
      navigate('/');
    } catch (err) {
      setError('GitHub sign-in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* OAuth Sign-in Buttons */}
        <div className="mt-6 space-y-3">
          <GoogleSignInButton
            onSignIn={handleGoogleSignIn}
            onError={setError}
            loading={loading}
          />
          <GitHubSignInButton
            onSignIn={handleGitHubSignIn}
            onError={setError}
            loading={loading}
          />
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
        </div>

        {isLogin ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sign in
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="role"
                name="role"
                className="w-full px-3 py-2 border rounded-md"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Collaborator</option>
                <option>Manager</option>
                <option>Administrator</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Account
            </button>
          </form>
        )}
        <p className="text-center">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            className="text-blue-600 hover:underline ml-1"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}