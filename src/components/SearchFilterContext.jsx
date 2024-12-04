import React, { createContext, useContext, useState } from "react";

const SearchFilterContext = createContext();

export const SearchFilterProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    salarioMin: "",
    salarioMax: "",
    region: "",
    comuna: "",
    tipoJornada: "",
    horaInicio: "",
    horaFin: "",
    fechaInicio: "",
    fechaFin: "",
  });

  const updateSearchQuery = (query) => {
    setSearchQuery(query);
  };

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      salarioMin: "",
      salarioMax: "",
      region: "",
      comuna: "",
      tipoJornada: "",
      horaInicio: "",
      horaFin: "",
      fechaInicio: "",
      fechaFin: "",
    });
    setSearchQuery("");
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  return (
    <SearchFilterContext.Provider
      value={{
        searchQuery,
        filters,
        showFilters,
        updateSearchQuery,
        updateFilters,
        clearFilters,
        toggleFilters,
        setShowFilters,
      }}
    >
      {children}
    </SearchFilterContext.Provider>
  );
};

export const useSearchFilter = () => {
  const context = useContext(SearchFilterContext);
  if (!context) {
    throw new Error(
      "useSearchFilter must be used within a SearchFilterProvider"
    );
  }
  return context;
};
