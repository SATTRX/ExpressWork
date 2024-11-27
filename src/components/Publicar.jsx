import React, { useState } from "react";
import { regionesYComunas } from "../pages/api/regionesYComunas";

export default function PublicarOferta() {
  const [formData, setFormData] = useState({
    titulo: "",
    telefono: "",
    correo: "",
    region: "",
    comuna: "",
    direccion: "",
    salario: "",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (!formData[key]) {
        newErrors[key] = "Este campo es requerido.";
      }
    });

    // Validate salary
    const salarioNumerico = parseFloat(
      formData.salario.replace(/[^0-9.-]+/g, "")
    );
    if (isNaN(salarioNumerico)) {
      newErrors.salario = "El salario debe ser un número válido";
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.correo && !emailRegex.test(formData.correo)) {
      newErrors.correo = "Ingrese un correo electrónico válido";
    }

    // Validate phone (simple format)
    const phoneRegex = /^\+?[0-9]{8,}$/;
    if (formData.telefono && !phoneRegex.test(formData.telefono)) {
      newErrors.telefono = "Ingrese un número de teléfono válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "salario") {
      const formattedValue = value.replace(/[^0-9$]/g, "").replace(/^\$?/, "$");
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (validateForm()) {
      try {
        const response = await fetch("http://localhost:5000/api/jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            ubicacion: {
              comuna: formData.comuna,
              ciudad: "",
              region: formData.region,
              direccion: formData.direccion,
            },
          }),
        });

        if (response.ok) {
          setSubmitSuccess(true);
          setFormData({
            titulo: "",
            telefono: "",
            correo: "",
            region: "",
            comuna: "",
            direccion: "",
            salario: "",
            descripcion: "",
            fechaInicio: "",
            fechaFin: "",
            horaInicio: "",
            horaFin: "",
          });
        } else {
          const errorData = await response.json();
          setSubmitError(
            errorData.error || "Error al enviar la oferta de trabajo."
          );
        }
      } catch (error) {
        console.error("Error al enviar la oferta de trabajo:", error);
        setSubmitError("Error de conexión al enviar la oferta de trabajo.");
      }
    }
  };

  const comunas = formData.region
    ? regionesYComunas.find((r) => r.region === formData.region)?.comunas || []
    : [];

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2 className="text-center">Publicar Oferta de Trabajo</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="titulo" className="form-label">
                    Título de la Oferta
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      errors.titulo ? "is-invalid" : ""
                    }`}
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                  />
                  {errors.titulo && (
                    <div className="invalid-feedback">{errors.titulo}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="telefono" className="form-label">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className={`form-control ${
                      errors.telefono ? "is-invalid" : ""
                    }`}
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                  {errors.telefono && (
                    <div className="invalid-feedback">{errors.telefono}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="correo" className="form-label">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className={`form-control ${
                      errors.correo ? "is-invalid" : ""
                    }`}
                    id="correo"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                  />
                  {errors.correo && (
                    <div className="invalid-feedback">{errors.correo}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="region" className="form-label">
                    Región
                  </label>
                  <select
                    className={`form-select ${
                      errors.region ? "is-invalid" : ""
                    }`}
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                  >
                    <option value="">Seleccione una región</option>
                    {regionesYComunas.map((region, index) => (
                      <option key={index} value={region.region}>
                        {region.region}
                      </option>
                    ))}
                  </select>
                  {errors.region && (
                    <div className="invalid-feedback">{errors.region}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="comuna" className="form-label">
                    Comuna
                  </label>
                  <select
                    className={`form-select ${
                      errors.comuna ? "is-invalid" : ""
                    }`}
                    id="comuna"
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleChange}
                    disabled={!formData.region}
                  >
                    <option value="">Seleccione una comuna</option>
                    {comunas.map((comuna, index) => (
                      <option key={index} value={comuna}>
                        {comuna}
                      </option>
                    ))}
                  </select>
                  {errors.comuna && (
                    <div className="invalid-feedback">{errors.comuna}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="direccion" className="form-label">
                    Dirección
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      errors.direccion ? "is-invalid" : ""
                    }`}
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                  />
                  {errors.direccion && (
                    <div className="invalid-feedback">{errors.direccion}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="salario" className="form-label">
                    Salario
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      errors.salario ? "is-invalid" : ""
                    }`}
                    id="salario"
                    name="salario"
                    value={formData.salario}
                    onChange={handleChange}
                    placeholder="$"
                  />
                  {errors.salario && (
                    <div className="invalid-feedback">{errors.salario}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">
                    Descripción
                  </label>
                  <textarea
                    className={`form-control ${
                      errors.descripcion ? "is-invalid" : ""
                    }`}
                    id="descripcion"
                    name="descripcion"
                    rows={4}
                    value={formData.descripcion}
                    onChange={handleChange}
                  ></textarea>
                  {errors.descripcion && (
                    <div className="invalid-feedback">{errors.descripcion}</div>
                  )}
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="fechaInicio" className="form-label">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      className={`form-control ${
                        errors.fechaInicio ? "is-invalid" : ""
                      }`}
                      id="fechaInicio"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleChange}
                    />
                    {errors.fechaInicio && (
                      <div className="invalid-feedback">
                        {errors.fechaInicio}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="fechaFin" className="form-label">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      className={`form-control ${
                        errors.fechaFin ? "is-invalid" : ""
                      }`}
                      id="fechaFin"
                      name="fechaFin"
                      value={formData.fechaFin}
                      onChange={handleChange}
                    />
                    {errors.fechaFin && (
                      <div className="invalid-feedback">{errors.fechaFin}</div>
                    )}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="horaInicio" className="form-label">
                      Hora de Inicio
                    </label>
                    <input
                      type="time"
                      className={`form-control ${
                        errors.horaInicio ? "is-invalid" : ""
                      }`}
                      id="horaInicio"
                      name="horaInicio"
                      value={formData.horaInicio}
                      onChange={handleChange}
                    />
                    {errors.horaInicio && (
                      <div className="invalid-feedback">
                        {errors.horaInicio}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="horaFin" className="form-label">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      className={`form-control ${
                        errors.horaFin ? "is-invalid" : ""
                      }`}
                      id="horaFin"
                      name="horaFin"
                      value={formData.horaFin}
                      onChange={handleChange}
                    />
                    {errors.horaFin && (
                      <div className="invalid-feedback">{errors.horaFin}</div>
                    )}
                  </div>
                </div>

                {submitError && (
                  <div className="alert alert-danger" role="alert">
                    {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div className="alert alert-success" role="alert">
                    La oferta de trabajo ha sido publicada exitosamente.
                  </div>
                )}

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary">
                    Publicar Oferta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
