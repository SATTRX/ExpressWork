import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Publicar from "./components/Publicar";
import NavigationBar from "./components/Navbar";
import JobList from "./components/JobList"; // Asegúrate de importar JobList desde el archivo correcto

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <div className="App">
        <NavigationBar />
        <Routes>
          <Route path="/login" element={<LoginForm setUser={setUser} />} />
          <Route path="/signup" element={<RegisterForm />} />
          <Route path="/publicar" element={<Publicar />} />
          <Route path="/joblist" element={<JobList user={user} />} />
          {/* Ruta por defecto */}
          <Route path="*" element={<LoginForm setUser={setUser} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
