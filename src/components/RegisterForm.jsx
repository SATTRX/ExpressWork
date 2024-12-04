import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE_URL = "http://localhost:5000";

const RegistroMultiPaso = () => {
  // Estados para datos básicos
  const [datosBasicos, setDatosBasicos] = useState({
    usuario_nombre: "",
    usuario_email: "",
    usuario_password: "",
    confirmPassword: "",
    usuario_fecha_nacimiento: "",
  });

  // Estados para preferencias
  const [preferencias, setPreferencias] = useState({
    region: "",
    comuna: "",
    tipo_jornada: "",
    dias_semana: [], // Array para días múltiples
    horario_inicio: "",
    horario_fin: "",
    salario_deseado: "",
    categorias: [],
  });

  // Estado para habilidades
  const [habilidades, setHabilidades] = useState([
    { habilidad_nombre: "", nivel: "", fecha_adquisicion: "" },
  ]);

  // Estados de control
  const [paso, setPaso] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);

  // Estados para datos de catálogos
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // Estado para fortaleza de contraseña
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
  });

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
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
        setErrors((prev) => ({
          ...prev,
          carga: "Error al cargar datos. Por favor, recarga la página.",
        }));
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    if (preferencias.region && regiones.length > 0) {
      const regionSeleccionada = regiones.find(
        (r) => r.region === preferencias.region
      );
      if (regionSeleccionada?.comunas) {
        setComunas(regionSeleccionada.comunas);
      }
    }
  }, [preferencias.region, regiones]);

  const handlePreferenciasChange = (e) => {
    const { name, value } = e.target;
    setPreferencias((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "region" ? { comuna: "" } : {}),
    }));
  };

  const handleCategoriasChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) =>
      parseInt(option.value)
    );
    setPreferencias((prev) => ({
      ...prev,
      categorias: selectedOptions,
    }));
  };

  const evaluatePasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    if (password.length < 8) {
      feedback.push("Mínimo 8 caracteres");
    } else {
      score += 1;
    }

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Una mayúscula");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Una minúscula");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("Un número");

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push("Un carácter especial");

    return {
      score,
      feedback: feedback.length
        ? `Falta: ${feedback.join(", ")}`
        : "Contraseña segura",
    };
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setDatosBasicos((prev) => ({
      ...prev,
      usuario_password: value,
    }));
    setPasswordStrength(evaluatePasswordStrength(value));
  };

  const validarPaso = () => {
    const nuevosErrores = {};

    if (paso === 1) {
      if (!datosBasicos.usuario_nombre)
        nuevosErrores.nombre = "El nombre es requerido";
      if (!datosBasicos.usuario_email)
        nuevosErrores.email = "El email es requerido";
      if (!datosBasicos.usuario_password)
        nuevosErrores.password = "La contraseña es requerida";
      if (datosBasicos.usuario_password !== datosBasicos.confirmPassword) {
        nuevosErrores.confirmPassword = "Las contraseñas no coinciden";
      }
      if (!datosBasicos.usuario_fecha_nacimiento)
        nuevosErrores.fechaNacimiento = "La fecha es requerida";
    }

    if (paso === 2) {
      if (!preferencias.region) nuevosErrores.region = "La región es requerida";
      if (!preferencias.comuna) nuevosErrores.comuna = "La comuna es requerida";
      if (!preferencias.tipo_jornada)
        nuevosErrores.tipo_jornada = "El tipo de jornada es requerido";
      if (!preferencias.dias_semana?.length)
        nuevosErrores.dias_semana = "Seleccione al menos un día";
      if (!preferencias.horario_inicio)
        nuevosErrores.horario_inicio = "El horario de inicio es requerido";
      if (!preferencias.horario_fin)
        nuevosErrores.horario_fin = "El horario de fin es requerido";
      if (!preferencias.salario_deseado)
        nuevosErrores.salario_deseado = "El salario es requerido";
      if (!preferencias.categorias.length)
        nuevosErrores.categorias = "Seleccione al menos una categoría";
    }

    if (paso === 3) {
      habilidades.forEach((habilidad, index) => {
        if (!habilidad.habilidad_nombre.trim()) {
          nuevosErrores[`habilidad_${index}`] =
            "El nombre de la habilidad es requerido";
        }
        if (!habilidad.nivel) {
          nuevosErrores[`nivel_${index}`] = "El nivel es requerido";
        }
        if (!habilidad.fecha_adquisicion) {
          nuevosErrores[`fecha_${index}`] = "La fecha es requerida";
        }
      });
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const agregarHabilidad = () => {
    setHabilidades([
      ...habilidades,
      { habilidad_nombre: "", nivel: "", fecha_adquisicion: "" },
    ]);
  };

  const eliminarHabilidad = (index) => {
    setHabilidades(habilidades.filter((_, i) => i !== index));
  };

  const actualizarHabilidad = (index, campo, valor) => {
    const nuevasHabilidades = [...habilidades];
    nuevasHabilidades[index][campo] = valor;
    setHabilidades(nuevasHabilidades);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarPaso()) return;

    try {
      // Convertir el array de días a string
      const diasSemanaStr = preferencias.dias_semana.join(",");

      // Preparar datos para enviar
      const bodyData = {
        // Datos básicos
        usuario_nombre: datosBasicos.usuario_nombre,
        usuario_email: datosBasicos.usuario_email,
        usuario_password: datosBasicos.usuario_password,
        usuario_fecha_nacimiento: datosBasicos.usuario_fecha_nacimiento,

        // Preferencias
        region: preferencias.region,
        comuna: preferencias.comuna,
        tipo_jornada: preferencias.tipo_jornada,
        dia_de_la_semana: diasSemanaStr,
        horario_inicio: preferencias.horario_inicio,
        horario_fin: preferencias.horario_fin,
        salario_deseado: preferencias.salario_deseado,
        categorias: preferencias.categorias,

        // Habilidades
        habilidades: habilidades,
      };

      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error en el registro");
      }

      setSubmitSuccess(true);
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  const renderPaso1 = () => (
    <div className="card">
      <div className="card-body">
        <h4 className="card-title mb-4">Datos Básicos</h4>

        <div className="mb-3">
          <label className="form-label">Nombre completo</label>
          <input
            type="text"
            className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
            value={datosBasicos.usuario_nombre}
            onChange={(e) =>
              setDatosBasicos({
                ...datosBasicos,
                usuario_nombre: e.target.value,
              })
            }
            placeholder="Ingrese su nombre completo"
          />
          {errors.nombre && (
            <div className="invalid-feedback">{errors.nombre}</div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            value={datosBasicos.usuario_email}
            onChange={(e) =>
              setDatosBasicos({
                ...datosBasicos,
                usuario_email: e.target.value,
              })
            }
            placeholder="ejemplo@correo.com"
          />
          {errors.email && (
            <div className="invalid-feedback">{errors.email}</div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <div className="input-group">
            <input
              type={mostrarPassword ? "text" : "password"}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              value={datosBasicos.usuario_password}
              onChange={handlePasswordChange}
              placeholder="Ingrese su contraseña"
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
            >
              {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="progress mt-2" style={{ height: "5px" }}>
            <div
              className={`progress-bar bg-${
                ["danger", "warning", "info", "success"][passwordStrength.score]
              }`}
              style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
            />
          </div>
          <small className="text-muted">{passwordStrength.feedback}</small>
        </div>

        <div className="mb-3">
          <label className="form-label">Confirmar Contraseña</label>
          <div className="input-group">
            <input
              type={mostrarConfirmPassword ? "text" : "password"}
              className={`form-control ${
                errors.confirmPassword ? "is-invalid" : ""
              }`}
              value={datosBasicos.confirmPassword}
              onChange={(e) =>
                setDatosBasicos({
                  ...datosBasicos,
                  confirmPassword: e.target.value,
                })
              }
              placeholder="Confirme su contraseña"
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
            >
              {mostrarConfirmPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <div className="invalid-feedback d-block">
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Fecha de Nacimiento</label>
          <input
            type="date"
            className={`form-control ${
              errors.fechaNacimiento ? "is-invalid" : ""
            }`}
            value={datosBasicos.usuario_fecha_nacimiento}
            onChange={(e) =>
              setDatosBasicos({
                ...datosBasicos,
                usuario_fecha_nacimiento: e.target.value,
              })
            }
          />
          {errors.fechaNacimiento && (
            <div className="invalid-feedback">{errors.fechaNacimiento}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPaso2 = () => (
    <div className="card">
      <div className="card-body">
        <h4 className="card-title mb-4">Preferencias Laborales</h4>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Región</label>
            <select
              className={`form-select ${errors.region ? "is-invalid" : ""}`}
              name="region"
              value={preferencias.region}
              onChange={handlePreferenciasChange}
            >
              <option value="">Seleccione una región</option>
              {regiones.map((r, index) => (
                <option key={index} value={r.region}>
                  {r.region}
                </option>
              ))}
            </select>
            {errors.region && (
              <div className="invalid-feedback">{errors.region}</div>
            )}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Comuna</label>
            <select
              className={`form-select ${errors.comuna ? "is-invalid" : ""}`}
              name="comuna"
              value={preferencias.comuna}
              onChange={handlePreferenciasChange}
              disabled={!preferencias.region}
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
        </div>

        <div className="mb-3">
          <label className="form-label">Tipo de Jornada</label>
          <select
            className={`form-select ${errors.tipo_jornada ? "is-invalid" : ""}`}
            name="tipo_jornada"
            value={preferencias.tipo_jornada}
            onChange={handlePreferenciasChange}
          >
            <option value="">Seleccione tipo de jornada</option>
            <option value="full_time">Tiempo Completo</option>
            <option value="part_time">Medio Tiempo</option>
            <option value="otros">Otros</option>
          </select>
          {errors.tipo_jornada && (
            <div className="invalid-feedback">{errors.tipo_jornada}</div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Días Disponibles</label>
          <div className="d-flex flex-wrap gap-3">
            {[
              { id: 1, name: "Lunes" },
              { id: 2, name: "Martes" },
              { id: 3, name: "Miércoles" },
              { id: 4, name: "Jueves" },
              { id: 5, name: "Viernes" },
              { id: 6, name: "Sábado" },
              { id: 7, name: "Domingo" },
            ].map((dia) => (
              <div key={dia.id} className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`dia-${dia.id}`}
                  checked={preferencias.dias_semana?.includes(dia.id)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setPreferencias((prev) => ({
                      ...prev,
                      dias_semana: isChecked
                        ? [...(prev.dias_semana || []), dia.id]
                        : (prev.dias_semana || []).filter((d) => d !== dia.id),
                    }));
                  }}
                />
                <label className="form-check-label" htmlFor={`dia-${dia.id}`}>
                  {dia.name}
                </label>
              </div>
            ))}
          </div>
          {errors.dias_semana && (
            <div className="invalid-feedback d-block">{errors.dias_semana}</div>
          )}
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Horario Inicio</label>
            <input
              type="time"
              className={`form-control ${
                errors.horario_inicio ? "is-invalid" : ""
              }`}
              name="horario_inicio"
              value={preferencias.horario_inicio}
              onChange={handlePreferenciasChange}
            />
            {errors.horario_inicio && (
              <div className="invalid-feedback">{errors.horario_inicio}</div>
            )}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Horario Fin</label>
            <input
              type="time"
              className={`form-control ${
                errors.horario_fin ? "is-invalid" : ""
              }`}
              name="horario_fin"
              value={preferencias.horario_fin}
              onChange={handlePreferenciasChange}
            />
            {errors.horario_fin && (
              <div className="invalid-feedback">{errors.horario_fin}</div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Salario Deseado</label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              type="number"
              className={`form-control ${
                errors.salario_deseado ? "is-invalid" : ""
              }`}
              name="salario_deseado"
              value={preferencias.salario_deseado}
              onChange={handlePreferenciasChange}
              placeholder="Ingrese el salario deseado"
            />
            <span className="input-group-text">CLP</span>
          </div>
          {errors.salario_deseado && (
            <div className="invalid-feedback d-block">
              {errors.salario_deseado}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Categorías de Interés</label>
          <select
            multiple
            className={`form-select ${errors.categorias ? "is-invalid" : ""}`}
            value={preferencias.categorias}
            onChange={handleCategoriasChange}
            size="5"
          >
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
          <small className="text-muted d-block">
            Mantenga presionada la tecla Ctrl para seleccionar múltiples
            opciones
          </small>
          {errors.categorias && (
            <div className="invalid-feedback">{errors.categorias}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPaso3 = () => (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="card-title mb-0">Habilidades</h4>
          <button
            type="button"
            className="btn btn-primary"
            onClick={agregarHabilidad}
          >
            + Agregar Habilidad
          </button>
        </div>

        {habilidades.map((habilidad, index) => (
          <div key={index} className="border rounded p-3 mb-3">
            <div className="mb-3">
              <label className="form-label">Nombre de la Habilidad</label>
              <input
                type="text"
                className={`form-control ${
                  errors[`habilidad_${index}`] ? "is-invalid" : ""
                }`}
                value={habilidad.habilidad_nombre}
                onChange={(e) =>
                  actualizarHabilidad(index, "habilidad_nombre", e.target.value)
                }
                placeholder="Ej: Excel, Word, PowerPoint"
              />
              {errors[`habilidad_${index}`] && (
                <div className="invalid-feedback">
                  {errors[`habilidad_${index}`]}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Nivel</label>
              <select
                className={`form-select ${
                  errors[`nivel_${index}`] ? "is-invalid" : ""
                }`}
                value={habilidad.nivel}
                onChange={(e) =>
                  actualizarHabilidad(index, "nivel", e.target.value)
                }
              >
                <option value="">Seleccione nivel</option>
                <option value="Básico">Básico</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
                <option value="Experto">Experto</option>
              </select>
              {errors[`nivel_${index}`] && (
                <div className="invalid-feedback">
                  {errors[`nivel_${index}`]}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Fecha de Adquisición</label>
              <input
                type="date"
                className={`form-control ${
                  errors[`fecha_${index}`] ? "is-invalid" : ""
                }`}
                value={habilidad.fecha_adquisicion}
                onChange={(e) =>
                  actualizarHabilidad(
                    index,
                    "fecha_adquisicion",
                    e.target.value
                  )
                }
                max={new Date().toISOString().split("T")[0]}
              />
              {errors[`fecha_${index}`] && (
                <div className="invalid-feedback">
                  {errors[`fecha_${index}`]}
                </div>
              )}
            </div>

            {habilidades.length > 1 && (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => eliminarHabilidad(index)}
              >
                Eliminar Habilidad
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          {errors.submit && (
            <div className="alert alert-danger" role="alert">
              {errors.submit}
            </div>
          )}

          <div className="progress mb-4">
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${(paso * 100) / 3}%` }}
            >
              Paso {paso} de 3
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {isLoading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : (
              <>
                {paso === 1 && renderPaso1()}
                {paso === 2 && renderPaso2()}
                {paso === 3 && renderPaso3()}

                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => {
                      // Reiniciar todos los estados
                      setDatosBasicos({
                        usuario_nombre: "",
                        usuario_email: "",
                        usuario_password: "",
                        confirmPassword: "",
                        usuario_fecha_nacimiento: "",
                      });
                      setPreferencias({
                        region: "",
                        comuna: "",
                        tipo_jornada: "",
                        dia_de_la_semana: "",
                        horario_inicio: "",
                        horario_fin: "",
                        salario_deseado: "",
                        categorias: [],
                      });
                      setHabilidades([
                        {
                          habilidad_nombre: "",
                          nivel: "",
                          fecha_adquisicion: "",
                        },
                      ]);
                      setPaso(1);
                    }}
                  >
                    Limpiar todo
                  </button>

                  <div>
                    {paso > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary me-2"
                        onClick={() => setPaso(paso - 1)}
                      >
                        Anterior
                      </button>
                    )}

                    {paso < 3 ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (validarPaso()) setPaso(paso + 1);
                        }}
                      >
                        Siguiente
                      </button>
                    ) : (
                      <button type="submit" className="btn btn-success">
                        Completar Registro
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Modal de éxito */}
      <div
        className={`modal fade ${submitSuccess ? "show" : ""}`}
        tabIndex="-1"
        role="dialog"
        style={{ display: submitSuccess ? "block" : "none" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">¡Registro Exitoso!</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSubmitSuccess(false)}
              ></button>
            </div>
            <div className="modal-body">
              <p>Tu registro ha sido completado exitosamente.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSubmitSuccess(false);
                  navigate("/"); // Esto redirigirá al usuario a la página principal (JobList)
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroMultiPaso;
