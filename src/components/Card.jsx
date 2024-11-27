import React from "react";
import PropTypes from "prop-types";
import "bootstrap/dist/css/bootstrap.min.css";

const Card = ({ children, className = "" }) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-body">{children}</div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Card;
