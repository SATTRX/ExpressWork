import React, { useState, useEffect } from "react";
import {
  Button,
  Badge,
  Offcanvas,
  ListGroup,
  Card,
  Modal,
} from "react-bootstrap";
import { Bell } from "react-bootstrap-icons";

const NotificationsComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Obtener notificaciones al cargar y cuando cambie el usuario
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchNotifications(userId);
    }
  }, []);

  const fetchNotifications = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.leida).length);
      }
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
    }
  };

  const handlePostulate = async (jobId) => {
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(
        `http://localhost:5000/api/trabajos/${jobId}/postular`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        // Actualizar la notificación localmente
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) =>
            notif.datos?.trabajo_id === jobId
              ? { ...notif, datos: { ...notif.datos, postulado: true } }
              : notif
          )
        );
        setShowJobModal(false);
        // Mostrar mensaje de éxito (puedes usar un Toast aquí)
      }
    } catch (error) {
      console.error("Error al postular:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const handleNotificationClick = async (notification) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/trabajos/${notification.datos.trabajo_id}`
      );
      if (response.ok) {
        const jobData = await response.json();
        setSelectedJob(jobData);
        setShowJobModal(true);

        // Marcar como leída
        if (!notification.leida) {
          await fetch(
            `http://localhost:5000/api/notifications/${notification.notificacion_id}/read`,
            {
              method: "PUT",
            }
          );
          // Actualizar estado local
          setNotifications((prev) =>
            prev.map((n) =>
              n.notificacion_id === notification.notificacion_id
                ? { ...n, leida: true }
                : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error al obtener detalles del trabajo:", error);
    }
  };

  return (
    <>
      {/* Botón de notificaciones */}
      <Button
        variant="link"
        className="position-relative nav-link"
        onClick={() => setShowOffcanvas(true)}
      >
        <Bell size={20} className="text-light" />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel lateral de notificaciones */}
      <Offcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Notificaciones</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ListGroup variant="flush">
            {notifications.length === 0 ? (
              <p className="text-center text-muted">No hay notificaciones</p>
            ) : (
              notifications.map((notification) => (
                <ListGroup.Item
                  key={notification.notificacion_id}
                  action
                  onClick={() => handleNotificationClick(notification)}
                  className={!notification.leida ? "bg-light" : ""}
                >
                  <Card className="border-0">
                    <Card.Body>
                      <Card.Title>{notification.mensaje}</Card.Title>
                      <Card.Text className="text-muted small">
                        {new Date(notification.fecha_creacion).toLocaleString()}
                      </Card.Text>
                      {!notification.leida && <Badge bg="primary">Nueva</Badge>}
                    </Card.Body>
                  </Card>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Modal de detalles del trabajo */}
      <Modal
        show={showJobModal}
        onHide={() => setShowJobModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedJob?.trabajo_titulo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJob && (
            <>
              <div className="mb-3">
                <h6>Ubicación</h6>
                <p>
                  {selectedJob.comuna}, {selectedJob.region}
                </p>
              </div>
              <div className="mb-3">
                <h6>Salario</h6>
                <p>{formatCurrency(selectedJob.trabajo_salario)}</p>
              </div>
              <div className="mb-3">
                <h6>Horario</h6>
                <p>
                  {selectedJob.horario_inicio} - {selectedJob.horario_fin}
                </p>
              </div>
              <div className="mb-3">
                <h6>Descripción</h6>
                <p>{selectedJob.trabajo_descripcion}</p>
              </div>
              <div className="mb-3">
                <h6>Requisitos</h6>
                <p>{selectedJob.requisitos}</p>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowJobModal(false)}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={() => handlePostulate(selectedJob.trabajo_id)}
            disabled={selectedJob?.postulado}
          >
            {selectedJob?.postulado ? "Ya has postulado" : "Postular"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NotificationsComponent;
