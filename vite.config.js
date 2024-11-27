export default {
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", // Cambia esto al puerto correcto
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
};
