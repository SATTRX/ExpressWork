import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Badge,
  Spinner,
  Alert,
  Form,
} from "react-bootstrap";
import { useSearchFilter } from "../components/SearchFilterContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const JobList = () => {
  const [jobOffers, setJobOffers] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationsData, setEvaluationsData] = useState({
    evaluaciones: [],
    promedio: 0,
    total: 0,
  });
  const [evaluation, setEvaluation] = useState({
    puntuacion: 5,
    comentario: "",
  });
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000";

  const { searchQuery, filters } = useSearchFilter();

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append("q", searchQuery);
      }

      // Agregar filtros
      if (filters.salarioMin) params.append("salarioMin", filters.salarioMin);
      if (filters.salarioMax) params.append("salarioMax", filters.salarioMax);
      if (filters.region) params.append("region", filters.region);
      if (filters.comuna) params.append("comuna", filters.comuna);
      if (filters.tipoJornada)
        params.append("tipoJornada", filters.tipoJornada);
      if (filters.horaInicio) params.append("horaInicio", filters.horaInicio);
      if (filters.horaFin) params.append("horaFin", filters.horaFin);
      if (filters.fechaInicio)
        params.append("fechaInicio", filters.fechaInicio);
      if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);

      console.log("Enviando filtros:", Object.fromEntries(params));

      const response = await fetch(
        `${API_BASE_URL}/api/trabajos/buscar?${params}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      console.log("Trabajos recibidos:", data);
      setJobOffers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error("Error al obtener trabajos:", error);
      setError({
        type: "error",
        message: error.message || "Error al cargar los trabajos disponibles",
      });
      setJobOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchJobs();
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, filters]);

  const fetchEvaluaciones = async (trabajoId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/trabajos/${trabajoId}/evaluaciones`
      );
      if (response.ok) {
        const data = await response.json();
        return {
          evaluaciones: data.evaluaciones || [],
          promedio: Number(data.promedio) || 0,
          total: data.total || 0,
        };
      }
      return { evaluaciones: [], promedio: 0, total: 0 };
    } catch (error) {
      console.error("Error al obtener evaluaciones:", error);
      return { evaluaciones: [], promedio: 0, total: 0 };
    }
  };

  const updateJobEvaluations = async (jobId) => {
    const evaluaciones = await fetchEvaluaciones(jobId);
    setEvaluationsData(evaluaciones);
  };

  const handleJobSelect = async (jobId) => {
    try {
      const [jobResponse, evaluationsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/trabajos/${jobId}`),
        fetchEvaluaciones(jobId),
      ]);

      if (!jobResponse.ok) {
        throw new Error(`Error al obtener detalles del trabajo`);
      }

      const jobData = await jobResponse.json();

      const userId = localStorage.getItem("userId");
      if (userId) {
        const postulacionResponse = await fetch(
          `${API_BASE_URL}/api/trabajos/${jobId}/postulacion/${userId}`
        );
        if (postulacionResponse.ok) {
          const postulacionData = await postulacionResponse.json();
          jobData.isPostulated = postulacionData.exists;
          jobData.hasEvaluation = postulacionData.hasEvaluation;
        }
      }

      setSelectedJob(jobData);
      setEvaluationsData(evaluationsResponse);
    } catch (error) {
      console.error("Error al obtener detalles:", error);
      setError("Error al cargar los detalles del trabajo");
    }
  };

  const handlePostulation = async (jobId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/trabajos/${jobId}/postular`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        setSelectedJob((prev) => ({
          ...prev,
          isPostulated: true,
        }));
        setError({
          type: "success",
          message: "¡Postulación exitosa!",
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || "Error al postular");
      }
    } catch (error) {
      console.error("Error al postular:", error);
      setError({
        type: "error",
        message: error.message,
      });
    }
  };

  const handleEvaluationSubmit = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/trabajos/${selectedJob.trabajo_id}/evaluar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            puntuacion: evaluation.puntuacion,
            comentario: evaluation.comentario,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar evaluación");
      }

      setShowEvaluationModal(false);
      setError({
        type: "success",
        message: data.trabajoInactivado
          ? "¡Gracias por tu evaluación! La oferta ha sido desactivada debido a múltiples evaluaciones negativas."
          : "¡Gracias por tu evaluación!",
      });

      setEvaluation({
        puntuacion: 5,
        comentario: "",
      });

      if (data.trabajoInactivado) {
        setSelectedJob((prev) => ({
          ...prev,
          trabajo_estado: "inactivo",
          hasEvaluation: true,
        }));
        fetchJobs();
      } else {
        setSelectedJob((prev) => ({
          ...prev,
          hasEvaluation: true,
        }));
      }

      await updateJobEvaluations(selectedJob.trabajo_id);
    } catch (error) {
      console.error("Error al enviar evaluación:", error);
      setError({
        type: "error",
        message: error.message || "Error al enviar la evaluación",
      });
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "No especificado";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const formatTime = (time) => {
    if (!time) return "No especificado";
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return time;
    }
  };

  const EvaluacionesDisplay = ({ evaluaciones = [], promedio = 0 }) => (
    <div className="mt-4 border-top pt-4">
      <h5 className="mb-3">Evaluaciones y Opiniones</h5>
      <div className="mb-3">
        <div className="d-flex align-items-center mb-2">
          <h6 className="mb-0 me-2">Puntuación General:</h6>
          <div className="d-flex align-items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <i
                key={star}
                className={`bi bi-star${
                  star <= Math.round(Number(promedio)) ? "-fill" : ""
                } text-warning me-1`}
              />
            ))}
            <span className="ms-2">({Number(promedio).toFixed(1)})</span>
          </div>
        </div>
        <small className="text-muted">
          {evaluaciones.length} evaluaciones en total
        </small>
      </div>

      {evaluaciones.length === 0 ? (
        <p className="text-muted">Aún no hay evaluaciones para este trabajo.</p>
      ) : (
        <div className="evaluation-list">
          {evaluaciones.map((evaluacion) => (
            <div
              key={evaluacion.evaluacion_id}
              className="border-bottom mb-3 pb-3"
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="mb-1">{evaluacion.usuario_nombre}</h6>
                  <div className="d-flex mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bi bi-star${
                          star <= evaluacion.puntuacion ? "-fill" : ""
                        } text-warning me-1`}
                      />
                    ))}
                  </div>
                </div>
                <small className="text-muted">
                  {evaluacion.fecha_formateada}
                </small>
              </div>
              <p className="mb-0">{evaluacion.comentario}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderJobCard = (job) => (
    <Col xs={12} md={6} lg={4} key={job.trabajo_id} className="mb-4">
      <Card className="h-100 shadow-sm hover-card">
        <Card.Header className="bg-light border-0 pt-3">
          <div className="d-flex justify-content-between align-items-start">
            <Badge bg="primary" className="mb-2">
              {job.tipo_jornada || "Tiempo completo"}
            </Badge>
            <Badge bg={job.trabajo_estado === "activo" ? "success" : "danger"}>
              {job.trabajo_estado === "activo" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <Card.Title className="text-primary">{job.trabajo_titulo}</Card.Title>
          <Card.Subtitle className="text-muted mb-2">
            {job.comuna}, {job.region}
          </Card.Subtitle>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-clock me-2 text-primary"></i>
              <small>
                {formatTime(job.horario_inicio)} - {formatTime(job.horario_fin)}
              </small>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-cash-stack me-2 text-success"></i>
              <small>{formatCurrency(job.trabajo_salario)}/CLP</small>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-person-circle me-2 text-info"></i>
              <small>Por: {job.publicador_nombre || "Anónimo"}</small>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-calendar-check me-2 text-info"></i>
              <small>
                Publicación:{" "}
                {job.trabajo_fecha_publicacion
                  ? new Date(job.trabajo_fecha_publicacion).toLocaleDateString(
                      "es-CL"
                    )
                  : "No especificado"}
              </small>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-calendar-date me-2 text-warning"></i>
              <small>
                Inicio:{" "}
                {job.fecha_inicio
                  ? new Date(job.fecha_inicio).toLocaleDateString("es-CL")
                  : "No especificado"}
              </small>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-calendar-x me-2 text-danger"></i>
              <small>
                Fin :{" "}
                {job.fin_postulacion
                  ? new Date(job.fin_postulacion).toLocaleDateString("es-CL")
                  : "No especificado"}
              </small>
            </div>
            {job.puntuacion_promedio && (
              <div className="d-flex align-items-center">
                <i className="bi bi-star-fill me-2 text-warning"></i>
                <small>{Number(job.puntuacion_promedio).toFixed(1)}</small>
              </div>
            )}
          </div>
          <div className="d-grid gap-2">
            <Button
              variant="outline-primary"
              onClick={() => handleJobSelect(job.trabajo_id)}
              className="text-decoration-none"
              disabled={job.trabajo_estado !== "activo"}
            >
              Ver detalles
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
  const formatDate = (date) => {
    if (!date) return "No especificado";
    try {
      return new Date(date).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        <header className="text-center mb-5">
          <h1 className="display-4 text-primary mb-3">Ofertas de Trabajo</h1>
          <p className="lead text-muted">
            Encuentra las mejores oportunidades laborales para estudiantes
          </p>
        </header>

        {error && (
          <Alert
            variant={error.type === "success" ? "success" : "danger"}
            className="mb-4"
            onClose={() => setError(null)}
            dismissible
          >
            <i
              className={`bi ${
                error.type === "success"
                  ? "bi-check-circle"
                  : "bi-exclamation-triangle"
              } me-2`}
            ></i>
            {error.message}
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
          </div>
        ) : (
          <Row className="g-4">
            {jobOffers.length > 0 ? (
              jobOffers.map(renderJobCard)
            ) : (
              <Col xs={12}>
                <Alert variant="info">
                  No hay ofertas de trabajo disponibles en este momento.
                </Alert>
              </Col>
            )}
          </Row>
        )}

        <Button
          variant="primary"
          className="position-fixed floating-button"
          onClick={() => navigate("/publicar")}
          style={{
            bottom: "2rem",
            right: "2rem",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          <i className="bi bi-plus"></i>
        </Button>

        {/* Modal de Detalles del Trabajo */}
        <Modal
          show={!!selectedJob}
          onHide={() => setSelectedJob(null)}
          size="lg"
          centered
        >
          {selectedJob && (
            <>
              <Modal.Header closeButton className="border-0 pb-0">
                <div>
                  <div className="d-flex align-items-center mb-2">
                    <h4 className="text-primary mb-0 me-2">
                      {selectedJob.trabajo_titulo}
                    </h4>
                    <Badge
                      bg={
                        selectedJob.trabajo_estado === "activo"
                          ? "success"
                          : "danger"
                      }
                    >
                      {selectedJob.trabajo_estado === "activo"
                        ? "Activo"
                        : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-muted mb-0">
                    <i className="bi bi-geo-alt me-2"></i>
                    {selectedJob.comuna || "Sin ubicación"},{" "}
                    {selectedJob.region || "No especificada"}
                  </p>
                </div>
              </Modal.Header>
              <Modal.Body>
                <Row className="mb-4">
                  <Col sm={6}>
                    <div className="border-start border-4 border-primary ps-3 mb-3">
                      <small className="text-muted">Horario</small>
                      <p className="mb-0">
                        {formatTime(selectedJob.horario_inicio)} -{" "}
                        {formatTime(selectedJob.horario_fin)}
                      </p>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="border-start border-4 border-success ps-3 mb-3">
                      <small className="text-muted">Salario Mensual</small>
                      <p className="mb-0">
                        {formatCurrency(selectedJob.trabajo_salario)}
                      </p>
                    </div>
                  </Col>
                </Row>

                <div className="mb-4">
                  <h5 className="border-bottom pb-2">
                    Descripción del Trabajo
                  </h5>
                  <p className="text-muted">
                    {selectedJob.trabajo_descripcion ||
                      "No se ha proporcionado una descripción."}
                  </p>
                </div>

                <div className="mb-4">
                  <h5 className="border-bottom pb-2">Requisitos</h5>
                  <p className="text-muted">
                    {selectedJob.requisitos ||
                      "No se han especificado requisitos."}
                  </p>
                </div>

                {selectedJob.trabajo_estado === "activo" && (
                  <EvaluacionesDisplay
                    evaluaciones={evaluationsData.evaluaciones}
                    promedio={evaluationsData.promedio}
                  />
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedJob(null)}
                >
                  Cerrar
                </Button>
                {selectedJob.trabajo_estado === "activo" &&
                  (!selectedJob.isPostulated ? (
                    <Button
                      variant="primary"
                      onClick={() => handlePostulation(selectedJob.trabajo_id)}
                    >
                      Postular
                    </Button>
                  ) : (
                    !selectedJob.hasEvaluation && (
                      <Button
                        variant="success"
                        onClick={() => setShowEvaluationModal(true)}
                      >
                        Evaluar Oferta
                      </Button>
                    )
                  ))}
              </Modal.Footer>
            </>
          )}
        </Modal>

        {/* Modal de Evaluación */}
        <Modal
          show={showEvaluationModal}
          onHide={() => setShowEvaluationModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Evaluar Oferta de Trabajo</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-4">
                <Form.Label>Puntuación</Form.Label>
                <div className="d-flex gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant={
                        evaluation.puntuacion >= star
                          ? "warning"
                          : "outline-warning"
                      }
                      onClick={() =>
                        setEvaluation((prev) => ({ ...prev, puntuacion: star }))
                      }
                      className="px-3"
                    >
                      <i className="bi bi-star-fill"></i>
                    </Button>
                  ))}
                </div>
                <small className="text-muted">
                  {evaluation.puntuacion === 1 && "Muy insatisfecho"}
                  {evaluation.puntuacion === 2 && "Insatisfecho"}
                  {evaluation.puntuacion === 3 && "Regular"}
                  {evaluation.puntuacion === 4 && "Satisfecho"}
                  {evaluation.puntuacion === 5 && "Muy satisfecho"}
                </small>
              </Form.Group>
              <Form.Group>
                <Form.Label>Comentario</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={evaluation.comentario}
                  onChange={(e) =>
                    setEvaluation((prev) => ({
                      ...prev,
                      comentario: e.target.value,
                    }))
                  }
                  placeholder="Comparte tu experiencia con esta oferta..."
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowEvaluationModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleEvaluationSubmit}
              disabled={
                !evaluation.comentario.trim() ||
                evaluation.comentario.length < 10
              }
            >
              Enviar Evaluación
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default JobList;
