(function () {
  const STORAGE_KEY = "catalogo_a3_favoritos";

  function lerIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number).filter((n) => !Number.isNaN(n)) : [];
    } catch {
      return [];
    }
  }

  function salvarIds(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  window.StorageFavoritos = {
    obterIds() {
      return lerIds();
    },

    estaFavoritado(productId) {
      return lerIds().includes(Number(productId));
    },

    alternar(productId) {
      const id = Number(productId);
      let ids = lerIds();
      if (ids.includes(id)) {
        ids = ids.filter((x) => x !== id);
      } else {
        ids = [...ids, id];
      }
      salvarIds(ids);
      return ids.includes(id);
    },
  };
})();
