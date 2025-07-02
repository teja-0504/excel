import { useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { user } = useSelector((state) => state.auth);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <RegisterForm />
        </motion.div>
      </motion.main>
    </div>
  );
}
