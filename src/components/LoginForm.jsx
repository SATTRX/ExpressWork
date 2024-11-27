import React, { useState } from "react";
import { Form, Button, Alert, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const LoginForm = ({ setUser }) => {
  const [formData, setFormData] = useState({
    usuario_email: "",
    usuario_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();
      setSuccess(`Login successful! Welcome, ${data.usuario_nombre}`);
      setUser(data);
      navigate("/JobList");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message || "An error occurred during login. Please try again."
      );
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
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
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
                  placeholder="Password"
                  name="usuario_password"
                  value={formData.usuario_password}
                  onChange={handleChange}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Login
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
