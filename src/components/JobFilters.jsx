import React from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { useSearchFilter } from "../components/SearchFilterContext";

const JobFilters = () => {
  const { filters, updateFilters, clearFilters, regiones, comunas } =
    useSearchFilter();

  const handleFilterChange = (field, value) => {
    updateFilters({
      ...filters,
      [field]: value,
      ...(field === "region" ? { comuna: "" } : {}),
    });
  };

  return (
    <div className="bg-white p-3 rounded shadow-sm mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Filtros</h5>
        <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
          Limpiar filtros
        </Button>
      </div>
      <Row className="g-3">
        <Col md={6} lg={4}>
          <Form.Group>
            <Form.Label>Salario mínimo</Form.Label>
            <Form.Control
              type="number"
              value={filters.salarioMin}
              onChange={(e) => handleFilterChange("salarioMin", e.target.value)}
              placeholder="Salario mínimo"
            />
          </Form.Group>
        </Col>
        <Col md={6} lg={4}>
          <Form.Group>
            <Form.Label>Salario máximo</Form.Label>
            <Form.Control
              type="number"
              value={filters.salarioMax}
              onChange={(e) => handleFilterChange("salarioMax", e.target.value)}
              placeholder="Salario máximo"
            />
          </Form.Group>
        </Col>

        <Col md={6} lg={4}>
          <Form.Group>
            <Form.Label>Región</Form.Label>
            <Form.Select
              value={filters?.region || ""}
              onChange={(e) => handleFilterChange("region", e.target.value)}
            >
              <option value="">Todas las regiones</option>
              {Array.isArray(regiones) &&
                regiones.map((region, index) => (
                  <option key={index} value={region.region}>
                    {region.region}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={6} lg={4}>
          <Form.Group>
            <Form.Label>Comuna</Form.Label>
            <Form.Select
              value={filters?.comuna || ""}
              onChange={(e) => handleFilterChange("comuna", e.target.value)}
              disabled={
                !filters?.region ||
                !Array.isArray(comunas) ||
                comunas.length === 0
              }
            >
              <option value="">Todas las comunas</option>
              {Array.isArray(comunas) &&
                comunas.map((comuna, index) => (
                  <option key={index} value={comuna}>
                    {comuna}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={6} lg={4}>
          <Form.Group>
            <Form.Label>Tipo de jornada</Form.Label>
            <Form.Select
              value={filters.tipoJornada}
              onChange={(e) =>
                handleFilterChange("tipoJornada", e.target.value)
              }
            >
              <option value="">Todas</option>
              <option value="full_time">Tiempo completo</option>
              <option value="part_time">Medio tiempo</option>
              <option value="otros">Otros</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={6} lg={4}>
          <Form.Group>
            <Form.Label>Hora inicio desde</Form.Label>
            <Form.Control
              type="time"
              value={filters.horaInicio}
              onChange={(e) => handleFilterChange("horaInicio", e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={6} lg={4}>
          <Form.Group>
            <Form.Label>Hora fin hasta</Form.Label>
            <Form.Control
              type="time"
              value={filters.horaFin}
              onChange={(e) => handleFilterChange("horaFin", e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6} lg={4}>
          <Form.Group>
            <Form.Label>Fecha inicio desde</Form.Label>
            <Form.Control
              type="date"
              value={filters.fechaInicio}
              onChange={(e) =>
                handleFilterChange("fechaInicio", e.target.value)
              }
            />
          </Form.Group>
        </Col>
        <Col md={6} lg={4}>
          <Form.Group>
            <Form.Label>Fecha fin hasta</Form.Label>
            <Form.Control
              type="date"
              value={filters.fechaFin}
              onChange={(e) => handleFilterChange("fechaFin", e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default JobFilters;
