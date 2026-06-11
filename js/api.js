(function () {
  const API_URL = "https://dummyjson.com/products?limit=15";
  const LIMITE_PRODUTOS = 15;
  const TAXA_USD_BRL = 5.5;

  const TITULOS_PT = {
    1: "Máscara Essence Lash Princess",
    2: "Paleta de Sombras com Espelho",
    3: "Pó Compacto",
    4: "Batom Vermelho",
    5: "Esmalte Vermelho",
    6: "Calvin Klein CK One",
    7: "Chanel Coco Noir Eau de Parfum",
    8: "Dior J'adore",
    9: "Dolce Shine Eau de Parfum",
    10: "Gucci Bloom Eau de Parfum",
    11: "Cama Annibale Colombo",
    12: "Sofá Annibale Colombo",
    13: "Mesa de Cabeceira African Cherry",
    14: "Cadeira Knoll Saarinen Executive",
    15: "Pia de Banheiro de Madeira com Espelho",
  };

  const CATEGORIAS_PT = {
    beauty: "Beleza",
    fragrances: "Perfumes",
    furniture: "Móveis",
    geral: "Geral",
  };

  function traduzirCategoria(categoria) {
    const chave = String(categoria || "").toLowerCase();
    return CATEGORIAS_PT[chave] || categoria || "Geral";
  }

  function normalizarProduto(produto) {
    const id = produto.id;
    const precoUsd = Number(produto.price);
    const precoBrl = Number.isNaN(precoUsd)
      ? produto.price
      : Math.round(precoUsd * TAXA_USD_BRL * 100) / 100;
    return {
      ...produto,
      title: TITULOS_PT[id] || produto.title,
      category: traduzirCategoria(produto.category),
      price: precoBrl,
    };
  }

  window.ApiProdutos = {
    LIMITE_PRODUTOS,
    traduzirCategoria,

    async carregarTodos() {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Falha ao carregar produtos: " + res.status);
      const data = await res.json();
      const lista = Array.isArray(data.products) ? data.products : [];
      return lista.slice(0, LIMITE_PRODUTOS).map(normalizarProduto);
    },

  };
})();
