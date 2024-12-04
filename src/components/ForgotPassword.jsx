import React, { useState } from "react";
import { Form, Button, Alert, Container, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la solicitud");
      }

      setSuccess(data.message);
      setEmail("");
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
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
              <h2 className="text-center mb-4">Recuperar Contraseña</h2>

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

              <p className="text-muted mb-4">
                Ingresa tu correo electrónico y te enviaremos instrucciones para
                recuperar tu contraseña.
              </p>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Correo Electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@ejemplo.com"
                    required
                    autoComplete="email"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Instrucciones"
                  )}
                </Button>

                <div className="text-center mt-3">
                  <Link to="/login" className="text-decoration-none">
                    ← Volver al inicio de sesión
                  </Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPassword;
