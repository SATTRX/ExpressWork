import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const UserSettings = () => {
  const API_BASE_URL = "http://localhost:5000";

  const [userData, setUserData] = useState({
    usuario_nombre: "",
    usuario_email: "",
    usuario_fecha_nacimiento: "",
    preferencias: {
      tipo_jornada: "",
      horario_inicio: "",
      horario_fin: "",
      salario_deseado: "",
      region: "",
      comuna: "",
      dias_semana: [],
      categorias: [],
    },
    habilidades: [],
  });

  const [nuevasHabilidades, setNuevasHabilidades] = useState([
    {
      id: 1,
      habilidad_nombre: "",
      nivel: "",
      fecha_adquisicion: new Date().toISOString().split("T")[0],
    },
  ]);

  const [regiones, setRegiones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchConfig = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/profile`, fetchConfig),
        fetch(`${API_BASE_URL}/api/regionesYComunas`, fetchConfig),
        fetch(`${API_BASE_URL}/api/categorias`, fetchConfig),
      ]);

      const [userResponse, regionesResponse, categoriasResponse] = responses;

      if (!userResponse.ok) {
        throw new Error("Error al cargar datos del usuario");
      }

      const userData = await userResponse.json();
      const regionesData = await regionesResponse.json();
      const categoriasData = await categoriasResponse.json();

      setUserData({
        ...userData,
        preferencias: userData.preferencias || {
          tipo_jornada: "",
          horario_inicio: "",
          horario_fin: "",
          salario_deseado: "",
          region: "",
          comuna: "",
          dias_semana: [],
          categorias: [],
        },
        habilidades: userData.habilidades || [],
      });

      setRegiones(regionesData);
      setCategorias(categoriasData);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePreferenciasChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      preferencias: {
        ...prev.preferencias,
        [name]: value,
      },
    }));
  };

  const handleDiasChange = (diaId) => {
    setUserData((prev) => ({
      ...prev,
      preferencias: {
        ...prev.preferencias,
        dias_semana: prev.preferencias.dias_semana.includes(diaId)
          ? prev.preferencias.dias_semana.filter((d) => d !== diaId)
          : [...prev.preferencias.dias_semana, diaId],
      },
    }));
  };

  const handleHabilidadInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedHabilidades = [...nuevasHabilidades];
    updatedHabilidades[index] = {
      ...updatedHabilidades[index],
      [name]: value,
    };
    setNuevasHabilidades(updatedHabilidades);

    // Solo agregar a userData si todos los campos están llenos
    if (
      updatedHabilidades[index].habilidad_nombre &&
      updatedHabilidades[index].nivel
    ) {
      const currentHabilidades = [...userData.habilidades];
      currentHabilidades[index] = updatedHabilidades[index];
      setUserData((prev) => ({
        ...prev,
        habilidades: currentHabilidades,
      }));
    }
  };

  const agregarCampoHabilidad = () => {
    setNuevasHabilidades((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        habilidad_nombre: "",
        nivel: "",
        fecha_adquisicion: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const eliminarCampoHabilidad = (index) => {
    const updatedHabilidades = nuevasHabilidades.filter((_, i) => i !== index);
    setNuevasHabilidades(updatedHabilidades);

    // Actualizar también userData
    setUserData((prev) => ({
      ...prev,
      habilidades: prev.habilidades.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Filtrar solo las habilidades completas
    const habilidadesCompletas = nuevasHabilidades.filter(
      (h) => h.habilidad_nombre && h.nivel
    );

    try {
      const dataToSend = {
        ...userData,
        habilidades: habilidadesCompletas,
      };

      const response = await fetch(`${API_BASE_URL}/api/user/update`, {
        ...fetchConfig,
        method: "PUT",
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el perfil");
      }

      setSuccess(true);
      await loadUserData();
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !userData.usuario_nombre) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-secondary text-white">
              <h4 className="mb-0">Actualizar Perfil</h4>
            </div>
            <div className="card-body">
              {success && (
                <div className="alert alert-success" role="alert">
                  Perfil actualizado exitosamente
                </div>
              )}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <h5 className="mb-4">Datos Básicos</h5>
                <div className="mb-3">
                  <label className="form-label">Nombre completo</label>
                  <input
                    type="text"
                    className="form-control"
                    name="usuario_nombre"
                    value={userData.usuario_nombre}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="usuario_email"
                    value={userData.usuario_email}
                    onChange={handleInputChange}
                  />
                </div>

                <h5 className="mb-4 mt-5">Preferencias Laborales</h5>
                <div className="mb-3">
                  <label className="form-label">Tipo de Jornada</label>
                  <select
                    className="form-select"
                    name="tipo_jornada"
                    value={userData.preferencias?.tipo_jornada || ""}
                    onChange={handlePreferenciasChange}
                  >
                    <option value="">Seleccione tipo de jornada</option>
                    <option value="full_time">Tiempo Completo</option>
                    <option value="part_time">Medio Tiempo</option>
                    <option value="otros">Otros</option>
                  </select>
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
                          checked={
                            userData.preferencias?.dias_semana?.includes(
                              dia.id
                            ) || false
                          }
                          onChange={() => handleDiasChange(dia.id)}
                          id={`dia-${dia.id}`}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`dia-${dia.id}`}
                        >
                          {dia.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Horario Inicio</label>
                    <input
                      type="time"
                      className="form-control"
                      name="horario_inicio"
                      value={userData.preferencias?.horario_inicio || ""}
                      onChange={handlePreferenciasChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Horario Fin</label>
                    <input
                      type="time"
                      className="form-control"
                      name="horario_fin"
                      value={userData.preferencias?.horario_fin || ""}
                      onChange={handlePreferenciasChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Salario Deseado</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      name="salario_deseado"
                      value={userData.preferencias?.salario_deseado || ""}
                      onChange={handlePreferenciasChange}
                    />
                    <span className="input-group-text">CLP</span>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Región</label>
                    <select
                      className="form-select"
                      name="region"
                      value={userData.preferencias?.region || ""}
                      onChange={handlePreferenciasChange}
                    >
                      <option value="">Seleccione una región</option>
                      {regiones.map((region, index) => (
                        <option key={index} value={region.region}>
                          {region.region}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Comuna</label>
                    <select
                      className="form-select"
                      name="comuna"
                      value={userData.preferencias?.comuna || ""}
                      onChange={handlePreferenciasChange}
                      disabled={!userData.preferencias?.region}
                    >
                      <option value="">Seleccione una comuna</option>
                      {regiones
                        .find((r) => r.region === userData.preferencias?.region)
                        ?.comunas.map((comuna, index) => (
                          <option key={index} value={comuna}>
                            {comuna}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Habilidades */}
                <h5 className="mb-4 mt-5">Habilidades</h5>
                {nuevasHabilidades.map((habilidad, index) => (
                  <div
                    key={habilidad.id}
                    className="row g-3 mb-2 align-items-end"
                  >
                    <div className="col-md-4">
                      <label className="form-label">Habilidad</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre de la habilidad"
                        name="habilidad_nombre"
                        value={habilidad.habilidad_nombre}
                        onChange={(e) => handleHabilidadInputChange(index, e)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Nivel</label>
                      <select
                        className="form-select"
                        name="nivel"
                        value={habilidad.nivel}
                        onChange={(e) => handleHabilidadInputChange(index, e)}
                      >
                        <option value="">Seleccione nivel</option>
                        <option value="Básico">Básico</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                        <option value="Experto">Experto</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_adquisicion"
                        value={habilidad.fecha_adquisicion}
                        onChange={(e) => handleHabilidadInputChange(index, e)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button
                        type="button"
                        className="btn btn-danger w-100"
                        onClick={() => eliminarCampoHabilidad(index)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mb-3">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={agregarCampoHabilidad}
                  >
                    Agregar Nueva Habilidad
                  </button>
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Actualizando...
                      </>
                    ) : (
                      "Actualizar Perfil"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
