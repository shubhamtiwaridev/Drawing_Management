import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  registerUser,
  clearError,
  clearMessage,
} from "../../store/authSlice";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error, message } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(clearMessage());

    if (!name || !email || !password) {
      return;
    }

    dispatch(registerUser({ name, email, password })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setName("");
        setEmail("");
        setPassword("");
        navigate("/");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      {/* <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">
          Register
        </h2>

        {message && (
          <p className="mb-4 text-green-600 text-center bg-green-50 
                        p-2 rounded-lg text-sm">
            {message}
          </p>
        )}

        {error && (
          <p className="mb-4 text-red-600 text-center bg-red-50 
                        p-2 rounded-lg text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 
                         rounded-lg focus:ring-2 focus:ring-indigo-400 
                         focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Email
            </label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 
                         rounded-lg focus:ring-2 focus:ring-indigo-400 
                         focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 
                         rounded-lg focus:ring-2 focus:ring-indigo-400 
                         focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 
                       rounded-lg hover:bg-indigo-700 transition"
          >
            Register
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <a href="/" className="text-indigo-600 hover:underline">
            Login
          </a>
        </p>
      </div> */}
    </div>
  );
};

export default Register;
