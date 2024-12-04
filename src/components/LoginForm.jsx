import React, { useState } from "react";
import { Form, Button, Alert, InputGroup } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";

const LoginForm = ({ setUser, setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    usuario_email: "",
    usuario_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        credentials: "include", // Importante para las cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      // Guardar datos relevantes
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userName", data.usuario_nombre);

      // Actualizar estado global
      setUser({
        id: data.userId,
        nombre: data.usuario_nombre,
        email: formData.usuario_email,
      });

      setIsAuthenticated(true);

      // Mostrar mensaje de éxito
      setSuccess(`¡Bienvenido/a, ${data.usuario_nombre}!`);

      // Esperar un momento para mostrar el mensaje de éxito
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error("Error en login:", err);
      setError(
        err.message || "Error al iniciar sesión. Por favor, intente nuevamente."
      );
      setIsAuthenticated(false);
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex vh-100" style={{ backgroundColor: "#3786ff" }}>
      <div className="w-50 d-flex align-items-center justify-content-center">
        <img
          src="/images/Login.png"
          alt="Placeholder"
          className="img-fluid"
          style={{ height: "400px", width: "450px" }}
        />
      </div>
      <div className="w-50 d-flex flex-column align-items-center justify-content-center">
        <h1 className="text-white mb-4">Login</h1>
        <div
          className="bg-white p-4 rounded"
          style={{ maxWidth: "400px", width: "100%" }}
        >
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formEmail">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-envelope"></i>
                </InputGroup.Text>
                <Form.Control
                  type="email"
                  placeholder="Email"
                  name="usuario_email"
                  value={formData.usuario_email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-lock"></i>
                </InputGroup.Text>
                <Form.Control
                  type="password"
                  placeholder="Contraseña"
                  name="usuario_password"
                  value={formData.usuario_password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </InputGroup>
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 mb-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </Form>
          <div className="text-center mb-2">
            <Link
              to="/forgot-password"
              className="text-primary text-decoration-none"
            >
              ¿Olvidó su contraseña?
            </Link>
          </div>
          <div className="text-center">
            <span className="me-2">¿No tiene una cuenta?</span>
            <Link to="/signup" className="text-primary text-decoration-none">
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
