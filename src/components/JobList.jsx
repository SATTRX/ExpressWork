import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function JobList() {
  const [jobOffers, setJobOffers] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/jobs");
        if (!response.ok) {
          throw new Error("Error al obtener las ofertas de trabajo");
        }
        const data = await response.json();
        setJobOffers(data);
      } catch (error) {
        setError("No se pudieron cargar las ofertas de trabajo.");
        console.error("Error fetching job offers:", error);
      }
    };

    fetchJobs();
  }, []);

  const handlePostJob = () => {
    navigate("/publicar");
  };

  const handleApply = (job) => {
    navigate("/apply", { state: { jobId: job.trabajo_id } });
  };

  const handleShowDetails = (job) => {
    setSelectedJob(job);
  };

  const handleClose = () => {
    setSelectedJob(null);
  };

  return (
    <Container
      className="py-5"
      style={{
        backgroundColor: "#f0f0f0",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <h1 className="text-center mb-4" style={{ color: "#333" }}>
        Ofertas de Trabajo Disponibles
      </h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {jobOffers.map((job) => (
          <Col md={6} lg={4} className="mb-4" key={job.trabajo_id}>
            <Card onClick={() => handleShowDetails(job)}>
              <Card.Body>
                <Card.Title>{job.trabajo_titulo || "Sin título"}</Card.Title>
                <Card.Text>
                  <strong>Ubicación:</strong>{" "}
                  {job.comuna && job.region
                    ? `${job.comuna}, ${job.region}`
                    : "No especificada"}
                </Card.Text>
                <Card.Text>
                  <strong>Horario:</strong>{" "}
                  {job.horario_inicio && job.horario_fin
                    ? `${job.horario_inicio} - ${job.horario_fin}`
                    : "No especificado"}
                </Card.Text>
                <Card.Text>
                  <strong>Salario:</strong>{" "}
                  {job.trabajo_salario
                    ? `${job.trabajo_salario} / mes`
                    : "No especificado"}
                </Card.Text>
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(job);
                  }}
                >
                  Postular
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Button
        onClick={handlePostJob}
        className="position-fixed shadow"
        style={{
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: "#3786ff",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
        }}
      >
        +
      </Button>

      {selectedJob && (
        <Modal show={true} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedJob.trabajo_titulo || "Detalles del trabajo"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Ubicación:</strong> {selectedJob.comuna},{" "}
              {selectedJob.region}
            </p>
            <p>
              <strong>Horario:</strong> {selectedJob.horario_inicio} -{" "}
              {selectedJob.horario_fin}
            </p>
            <p>
              <strong>Salario:</strong>{" "}
              {selectedJob.trabajo_salario
                ? `${selectedJob.trabajo_salario} / mes`
                : "No especificado"}
            </p>
            <p>
              <strong>Descripción:</strong> {selectedJob.trabajo_descripcion}
            </p>
            <p>
              <strong>Requisitos:</strong>{" "}
              {selectedJob.requisitos || "No especificados"}
            </p>
            <p>
              <strong>Correo:</strong> {selectedJob.correo || "No disponible"}
            </p>
            <p>
              <strong>Teléfono:</strong>{" "}
              {selectedJob.telefono || "No disponible"}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleApply(selectedJob);
              }}
            >
              Postular
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
}
