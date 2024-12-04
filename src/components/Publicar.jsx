import React, { useState, useEffect } from "react";

export default function PublicarOferta() {
  const [formData, setFormData] = useState({
    titulo: "",
    telefono: "",
    correo: "",
    region: "",
    comuna: "",
    ciudad: "",
    salario: "",
    descripcion: "",
    requisitos: "",
    tipoJornada: "",
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
  });

  const API_BASE_URL = "http://localhost:5000";

  const [regiones, setRegiones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const cargarRegiones = async () => {
      try {
        const [regionesResponse, categoriasResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/regionesYComunas`),
          fetch(`${API_BASE_URL}/api/categorias`),
        ]);

        if (!regionesResponse.ok || !categoriasResponse.ok) {
          throw new Error("Error al obtener datos");
        }

        const regionesData = await regionesResponse.json();
        const categoriasData = await categoriasResponse.json();

        setRegiones(regionesData);
        setCategorias(categoriasData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    cargarRegiones();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = {
      titulo: "Título de la oferta",
      telefono: "Teléfono",
      correo: "Correo electrónico",
      region: "Región",
      comuna: "Comuna",
      ciudad: "Ciudad",
      salario: "Salario",
      descripcion: "Descripción",
      requisitos: "Requisitos",
      tipoJornada: "Tipo de jornada",
      fechaInicio: "Fecha de inicio",
      horaInicio: "Hora de inicio",
      horaFin: "Hora de fin",
    };

    Object.keys(requiredFields).forEach((key) => {
      if (!formData[key]) {
        newErrors[key] = `El campo ${requiredFields[key]} es requerido.`;
      }
    });

    if (
      formData.salario &&
      !/^\$?\d+$/.test(formData.salario.replace(/,/g, ""))
    ) {
      newErrors.salario = "Ingrese un monto válido";
    }

    if (
      formData.correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)
    ) {
      newErrors.correo = "Ingrese un correo electrónico válido";
    }

    if (formData.telefono && !/^\+?[0-9]{8,}$/.test(formData.telefono)) {
      newErrors.telefono =
        "Ingrese un número de teléfono válido (+569XXXXXXXX)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (validateForm()) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trabajos`, {
          // Cambiado de jobs a trabajos
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            titulo: formData.titulo,
            telefono: formData.telefono,
            correo: formData.correo,
            ubicacion: {
              comuna: formData.comuna,
              ciudad: formData.ciudad,
              region: formData.region,
            },
            salario: formData.salario,
            descripcion: formData.descripcion,
            requisitos: formData.requisitos,
            tipoJornada: formData.tipoJornada,
            fechaInicio: formData.fechaInicio,
            finPostulacion: formData.fechaFin,
            horaInicio: formData.horaInicio,
            horaFin: formData.horaFin,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al crear la oferta de trabajo"
          );
        }

        setSubmitSuccess(true);
        // ... resto del código
      } catch (error) {
        console.error("Error al enviar la oferta:", error);
        setSubmitError(
          error.message || "Error de conexión al enviar la oferta de trabajo."
        );
      }
    }
  };

  const comunas = formData.region
    ? regiones.find((r) => r.region === formData.region)?.comunas || []
    : [];

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white py-3">
              <h2 className="text-center mb-0">Publicar Oferta de Trabajo</h2>
            </div>
            <div className="card-body p-4">
              {submitSuccess && (
                <div
                  className="alert alert-success alert-dismissible fade show"
                  role="alert"
                >
                  <strong>¡Éxito!</strong> La oferta de trabajo ha sido
                  publicada.
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                  ></button>
                </div>
              )}

              {submitError && (
                <div
                  className="alert alert-danger alert-dismissible fade show"
                  role="alert"
                >
                  <strong>Error:</strong> {submitError}
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                  ></button>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="needs-validation"
                noValidate
              >
                <div className="row mb-4">
                  <div className="col-md-12">
                    <h4 className="mb-3 text-primary">Información Básica</h4>
                    <div className="mb-3">
                      <label htmlFor="titulo" className="form-label">
                        Título de la Oferta *
                      </label>
                      <input
                        type="text"
                        className={`form-control ${
                          errors.titulo ? "is-invalid" : ""
                        }`}
                        id="titulo"
                        name="titulo"
                        value={formData.titulo}
                        onChange={(e) =>
                          setFormData({ ...formData, titulo: e.target.value })
                        }
                        placeholder="Ej: Desarrollador Web Frontend"
                      />
                      {errors.titulo && (
                        <div className="invalid-feedback">{errors.titulo}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="tipoJornada" className="form-label">
                        Tipo de Jornada *
                      </label>
                      <select
                        className={`form-select ${
                          errors.tipoJornada ? "is-invalid" : ""
                        }`}
                        id="tipoJornada"
                        name="tipoJornada"
                        value={formData.tipoJornada}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tipoJornada: e.target.value,
                          })
                        }
                      >
                        <option value="">Seleccione tipo de jornada</option>
                        <option value="full_time">Tiempo Completo</option>
                        <option value="part_time">Medio Tiempo</option>
                        <option value="otros">Otros</option>
                      </select>
                      {errors.tipoJornada && (
                        <div className="invalid-feedback">
                          {errors.tipoJornada}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="salario" className="form-label">
                        Salario (CLP) *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.salario ? "is-invalid" : ""
                          }`}
                          id="salario"
                          name="salario"
                          value={formData.salario}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salario: e.target.value,
                            })
                          }
                          placeholder="Ej: 800000"
                        />
                        {errors.salario && (
                          <div className="invalid-feedback">
                            {errors.salario}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="mb-3 text-primary">
                      Descripción y Requisitos
                    </h4>
                    <div className="mb-3">
                      <label htmlFor="descripcion" className="form-label">
                        Descripción del Trabajo *
                      </label>
                      <textarea
                        className={`form-control ${
                          errors.descripcion ? "is-invalid" : ""
                        }`}
                        id="descripcion"
                        name="descripcion"
                        rows={4}
                        value={formData.descripcion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descripcion: e.target.value,
                          })
                        }
                        placeholder="Detalle las responsabilidades y actividades del puesto"
                      ></textarea>
                      {errors.descripcion && (
                        <div className="invalid-feedback">
                          {errors.descripcion}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="requisitos" className="form-label">
                        Requisitos del Puesto *
                      </label>
                      <textarea
                        className={`form-control ${
                          errors.requisitos ? "is-invalid" : ""
                        }`}
                        id="requisitos"
                        name="requisitos"
                        rows={4}
                        value={formData.requisitos}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requisitos: e.target.value,
                          })
                        }
                        placeholder="Especifique los requisitos necesarios para el puesto"
                      ></textarea>
                      {errors.requisitos && (
                        <div className="invalid-feedback">
                          {errors.requisitos}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="mb-3 text-primary">Ubicación</h4>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label htmlFor="region" className="form-label">
                            Región *
                          </label>
                          <select
                            className={`form-select ${
                              errors.region ? "is-invalid" : ""
                            }`}
                            id="region"
                            name="region"
                            value={formData.region}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                region: e.target.value,
                                comuna: "",
                              })
                            }
                          >
                            <option value="">Seleccione una región</option>
                            {regiones.map((region, index) => (
                              <option key={index} value={region.region}>
                                {region.region}
                              </option>
                            ))}
                          </select>
                          {errors.region && (
                            <div className="invalid-feedback">
                              {errors.region}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label htmlFor="comuna" className="form-label">
                            Comuna *
                          </label>
                          <select
                            className={`form-select ${
                              errors.comuna ? "is-invalid" : ""
                            }`}
                            id="comuna"
                            name="comuna"
                            value={formData.comuna}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                comuna: e.target.value,
                              })
                            }
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
                            <div className="invalid-feedback">
                              {errors.comuna}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label htmlFor="ciudad" className="form-label">
                            Ciudad *
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.ciudad ? "is-invalid" : ""
                            }`}
                            id="ciudad"
                            name="ciudad"
                            value={formData.ciudad}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ciudad: e.target.value,
                              })
                            }
                            placeholder="Ej: Santiago"
                          />
                          {errors.ciudad && (
                            <div className="invalid-feedback">
                              {errors.ciudad}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="mb-3 text-primary">Contacto</h4>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="telefono" className="form-label">
                            Teléfono *
                          </label>
                          <input
                            type="tel"
                            className={`form-control ${
                              errors.telefono ? "is-invalid" : ""
                            }`}
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                telefono: e.target.value,
                              })
                            }
                            placeholder="+569XXXXXXXX"
                          />
                          {errors.telefono && (
                            <div className="invalid-feedback">
                              {errors.telefono}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="correo" className="form-label">
                            Correo Electrónico *
                          </label>
                          <input
                            type="email"
                            className={`form-control ${
                              errors.correo ? "is-invalid" : ""
                            }`}
                            id="correo"
                            name="correo"
                            value={formData.correo}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                correo: e.target.value,
                              })
                            }
                            placeholder="ejemplo@correo.com"
                          />
                          {errors.correo && (
                            <div className="invalid-feedback">
                              {errors.correo}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="mb-3 text-primary">Horarios</h4>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="fechaInicio" className="form-label">
                            Fecha de Inicio *
                          </label>
                          <input
                            type="date"
                            className={`form-control ${
                              errors.fechaInicio ? "is-invalid" : ""
                            }`}
                            id="fechaInicio"
                            name="fechaInicio"
                            value={formData.fechaInicio}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                fechaInicio: e.target.value,
                              })
                            }
                          />
                          {errors.fechaInicio && (
                            <div className="invalid-feedback">
                              {errors.fechaInicio}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="fechaFin" className="form-label">
                            Fecha Fin (Opcional)
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            id="fechaFin"
                            name="fechaFin"
                            value={formData.fechaFin}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                fechaFin: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="horaInicio" className="form-label">
                            Hora de Inicio *
                          </label>
                          <input
                            type="time"
                            className={`form-control ${
                              errors.horaInicio ? "is-invalid" : ""
                            }`}
                            id="horaInicio"
                            name="horaInicio"
                            value={formData.horaInicio}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                horaInicio: e.target.value,
                              })
                            }
                          />
                          {errors.horaInicio && (
                            <div className="invalid-feedback">
                              {errors.horaInicio}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="horaFin" className="form-label">
                            Hora Fin *
                          </label>
                          <input
                            type="time"
                            className={`form-control ${
                              errors.horaFin ? "is-invalid" : ""
                            }`}
                            id="horaFin"
                            name="horaFin"
                            value={formData.horaFin}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                horaFin: e.target.value,
                              })
                            }
                          />
                          {errors.horaFin && (
                            <div className="invalid-feedback">
                              {errors.horaFin}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row mt-4">
                  <div className="col-12">
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary btn-lg">
                        Publicar Oferta
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => window.history.back()}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
