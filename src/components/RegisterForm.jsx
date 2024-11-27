import React, { useState } from "react";
import { Form, Button, Alert, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    usuario_nombre: "",
    usuario_email: "",
    usuario_password: "",
    confirmar_password: "",
    usuario_fecha_nacimiento: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasNumber = /\d/;
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (password.length < minLength) {
      return `La contraseña debe tener al menos ${minLength} caracteres.`;
    } else if (!hasNumber.test(password)) {
      return "La contraseña debe contener al menos un número.";
    } else if (!hasUpperCase.test(password)) {
      return "La contraseña debe contener al menos una letra mayúscula.";
    } else if (!hasLowerCase.test(password)) {
      return "La contraseña debe contener al menos una letra minúscula.";
    } else if (!hasSpecialChar.test(password)) {
      return "La contraseña debe contener al menos un carácter especial.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPasswordError("");

    const passwordValidationError = validatePassword(formData.usuario_password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (formData.usuario_password !== formData.confirmar_password) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_nombre: formData.usuario_nombre,
          usuario_email: formData.usuario_email,
          usuario_password: formData.usuario_password,
          usuario_fecha_nacimiento: new Date(formData.usuario_fecha_nacimiento)
            .toISOString()
            .split("T")[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const data = await response.json();
      alert(`Registration successful! User ID: ${data.userId}`);
    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof SyntaxError && err.message.includes("JSON")) {
        setError(
          "Hubo un problema con el formato de los datos. Inténtalo nuevamente."
        );
      } else if (err.message === "Failed to fetch") {
        setError(
          "No se pudo conectar con el servidor. Verifica la URL y que el servidor esté en funcionamiento."
        );
      } else {
        setError(
          err.message ||
            "An error occurred during registration. Please try again."
        );
      }
    }
  };

  return (
    <div className="d-flex vh-100" style={{ backgroundColor: "#3786ff" }}>
      <div className="w-50 d-flex align-items-center justify-content-center">
        <img
          src="/images/SignUp.png"
          alt="Placeholder"
          className="img-fluid"
          style={{ height: "375px", width: "500px" }}
        />
      </div>
      <div className="w-50 d-flex flex-column align-items-center justify-content-center">
        <h1 className="text-white mb-4">Sign UP</h1>
        <div
          className="bg-white p-4 rounded"
          style={{ maxWidth: "400px", width: "100%" }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          {passwordError && <Alert variant="warning">{passwordError}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formName">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-user"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Name"
                  name="usuario_nombre"
                  value={formData.usuario_nombre}
                  onChange={handleChange}
                  required
                />
              </InputGroup>
            </Form.Group>

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
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="usuario_password"
                  value={formData.usuario_password}
                  onChange={handleChange}
                  required
                />
                <InputGroup.Text onClick={() => setShowPassword(!showPassword)}>
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-lock"></i>
                </InputGroup.Text>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  name="confirmar_password"
                  value={formData.confirmar_password}
                  onChange={handleChange}
                  required
                />
                <InputGroup.Text
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <FontAwesomeIcon
                    icon={showConfirmPassword ? faEyeSlash : faEye}
                  />
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBirthDate">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-calendar-alt"></i>
                </InputGroup.Text>
                <Form.Control
                  type="date"
                  placeholder="Nacimiento"
                  name="usuario_fecha_nacimiento"
                  value={formData.usuario_fecha_nacimiento}
                  onChange={handleChange}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Sign Up
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
