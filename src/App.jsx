import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SearchFilterProvider } from "./components/SearchFilterContext";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Publicar from "./components/Publicar";
import NavigationBar from "./components/Navbar";
import UserSettings from "./components/UserSettings";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import JobList from "./components/JobList";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <Router>
      <SearchFilterProvider>
        <div className="App">
          <NavigationBar
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
          <Routes>
            <Route
              path="/login"
              element={
                <LoginForm
                  setUser={setUser}
                  setIsAuthenticated={setIsAuthenticated}
                />
              }
            />
            <Route path="/signup" element={<RegisterForm />} />
            <Route path="/publicar" element={<Publicar />} />
            <Route path="/UserSettings" element={<UserSettings />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/" element={<JobList />} />
            <Route path="*" element={<JobList />} />
          </Routes>
        </div>
      </SearchFilterProvider>
    </Router>
  );
}

export default App;
