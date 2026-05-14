(function () {
  const API_URL = "https://dummyjson.com/products?limit=100";

  window.ApiProdutos = {
    async carregarTodos() {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Falha ao carregar produtos: " + res.status);
      const data = await res.json();
      return Array.isArray(data.products) ? data.products : [];
    },

    /** Produtos locais (PostgreSQL); IDs negativos para não colidir com DummyJSON. Retorna [] se a API não estiver no ar. */
    async carregarLocaisPublicos() {
      try {
        const res = await fetch("/api/produtos/public");
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  };
})();
