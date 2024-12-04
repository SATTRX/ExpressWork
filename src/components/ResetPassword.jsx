import React, { useState } from "react";
import { Form, Button, Alert, Container, Card } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.password !== passwords.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (passwords.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: passwords.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al restablecer la contraseña");
      }

      setSuccess("Contraseña actualizada exitosamente");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <div style={{ width: "100%", maxWidth: "450px" }}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Restablecer Contraseña</h2>

              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              {success && (
                <Alert
                  variant="success"
                  dismissible
                  onClose={() => setSuccess("")}
                >
                  {success}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nueva Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={passwords.password}
                    onChange={handleChange}
                    placeholder="Ingresa tu nueva contraseña"
                    required
                    minLength={6}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirmar Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirma tu nueva contraseña"
                    required
                    minLength={6}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Actualizando...
                    </>
                  ) : (
                    "Restablecer Contraseña"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default ResetPassword;
