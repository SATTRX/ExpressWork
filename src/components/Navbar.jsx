import React, { useEffect, useState, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Navbar,
  Nav,
  Container,
  Button,
  Form,
  FormControl,
  Dropdown,
  Offcanvas,
  Badge,
  ListGroup,
  Modal,
  InputGroup,
} from "react-bootstrap";
import { Bell, Person, Search } from "react-bootstrap-icons";
import { useSearchFilter } from "../components/SearchFilterContext";
import JobFilters from "./JobFilters";

const NavigationBar = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const wsRef = useRef(null);

  const { searchQuery, updateSearchQuery, showFilters, setShowFilters } =
    useSearchFilter();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId && isAuthenticated) {
      fetchNotifications(userId);
      connectWebSocket();

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [isAuthenticated]);

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

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket("ws://localhost:5000/ws/notifications");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Conexión WebSocket establecida");
      const userId = localStorage.getItem("userId");
      if (userId) {
        ws.send(JSON.stringify({ type: "auth", userId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "nuevo_trabajo") {
          handleNewNotification(data);
          fetchNotifications(localStorage.getItem("userId"));
        }
      } catch (error) {
        console.error("Error al procesar mensaje:", error);
      }
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 5000);
    };
  };

  const handleNotificationClick = async (notification) => {
    try {
      const datos =
        typeof notification.datos === "string"
          ? JSON.parse(notification.datos)
          : notification.datos;

      if (!datos || !datos.trabajo_id) {
        console.error(
          "No se encontró trabajo_id en la notificación:",
          notification
        );
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/trabajos/${datos.trabajo_id}`
      );
      if (response.ok) {
        const jobData = await response.json();
        setSelectedJob(jobData);
        setShowModal(true);

        if (!notification.leida) {
          await fetch(
            `http://localhost:5000/api/notifications/${notification.notificacion_id}/read`,
            { method: "PUT" }
          );
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
      console.error("Error al procesar notificación:", error);
    }
  };

  const handleNewNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${searchQuery}`);
  };

  const handleLogout = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    localStorage.removeItem("userId");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">
            Express Work
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Form className="d-flex mx-auto" onSubmit={handleSearch}>
              <InputGroup>
                <FormControl
                  type="search"
                  placeholder="Buscar trabajo..."
                  className="me-2"
                  value={searchQuery}
                  onChange={(e) => updateSearchQuery(e.target.value)}
                  style={{ minWidth: "300px" }}
                />
                <Button variant="outline-success" type="submit">
                  <Search /> Buscar
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={() => setShowFilters(!showFilters)}
                  className="ms-2"
                >
                  {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </Button>
              </InputGroup>
            </Form>

            <Nav className="ms-auto">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="dark"
                    className="position-relative me-2"
                    onClick={() => setShowOffcanvas(true)}
                  >
                    <Bell
                      className="text-light"
                      style={{ fontSize: "1.5rem" }}
                    />
                    {unreadCount > 0 && (
                      <Badge
                        bg="danger"
                        className="position-absolute top-0 start-100 translate-middle"
                        pill
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="dark" id="user-dropdown">
                      <Person style={{ fontSize: "1.5rem" }} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => navigate("/UserSettings")}>
                        Perfil
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate("/UserSettings")}>
                        Actualizar Información
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => navigate("/forgot-password")}
                      >
                        Actualizar Contraseña
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout}>
                        Cerrar Sesión
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              ) : (
                <>
                  <Nav.Link as={NavLink} to="/login">
                    Iniciar Sesión
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/signup">
                    Registrarse
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {showFilters && (
        <Container>
          <JobFilters />
        </Container>
      )}

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
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">{notification.mensaje}</h6>
                      <small className="text-muted">
                        {new Date(notification.fecha_creacion).toLocaleString()}
                      </small>
                    </div>
                    {!notification.leida && <Badge bg="primary">Nueva</Badge>}
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
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
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/trabajo/${selectedJob?.trabajo_id}`)}
          >
            Ver Detalles
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NavigationBar;
