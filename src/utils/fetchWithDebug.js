const fetchWithDebug = async (url) => {
  console.log(`Fetching ${url}...`);
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      console.log(`Response:`, data);
      return data;
    } catch (e) {
      console.error("Response is not valid JSON:", text);
      throw new Error("Invalid JSON response");
    }
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

// Usar esta función en el useEffect
const [regionesData, categoriasData] = await Promise.all([
  fetchWithDebug(`${API_BASE_URL}/api/regionesYComunas`),
  fetchWithDebug(`${API_BASE_URL}/api/categorias`),
]);
