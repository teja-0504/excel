import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/authSlice';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 p-6">
      <header className="w-full flex justify-end p-6">
        <Link
          to="/"
          className="border border-gray-300 rounded-full px-6 py-2 hover:bg-gray-700 text-white transition"
        >
          Home
        </Link>
      </header>
      <motion.main
        className="flex flex-grow items-center justify-center text-white"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-10 rounded-3xl shadow-xl max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-4xl font-extrabold mb-8 text-center">Sign In</h2>
          {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
          <label className="block mb-4 text-white">
            Email
            <input
              type="email"
              autoComplete="email"
              className="w-full border border-gray-600 rounded px-3 py-3 mt-1 bg-gray-700 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block mb-6 text-white">
            Password
            <input
              type="password"
              autoComplete="current-password"
              className="w-full border border-gray-600 rounded px-3 py-3 mt-1 bg-gray-700 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="mt-6 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:underline font-semibold">
              Sign Up
            </Link>
          </p>
        </motion.form>
      </motion.main>
    </div>
  );
}
