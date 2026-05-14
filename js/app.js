(function () {
  let todosProdutos = [];
  let termoBusca = "";

  const elGridProdutos = document.getElementById("gridProdutos");
  const elGridFavoritos = document.getElementById("gridFavoritos");
  const elCampoBusca = document.getElementById("campoBusca");
  const elAreaStatus = document.getElementById("areaStatus");
  const elSecaoCatalogo = document.getElementById("secaoCatalogo");
  const elSecaoFavoritos = document.getElementById("secaoFavoritos");
  const elMsgFavoritosVazio = document.getElementById("msgFavoritosVazio");
  const elBadgeFavoritos = document.getElementById("badgeFavoritos");
  const btnVerTodos = document.getElementById("btnVerTodos");
  const btnVerFavoritos = document.getElementById("btnVerFavoritos");

  function produtoPorId(id) {
    return todosProdutos.find((p) => p.id === id);
  }

  function produtosFiltradosPorNome(lista) {
    const t = termoBusca.trim().toLowerCase();
    if (!t) return lista;
    return lista.filter((p) => String(p.title || "").toLowerCase().includes(t));
  }

  function atualizarBadge() {
    const n = StorageFavoritos.obterIds().length;
    elBadgeFavoritos.textContent = String(n);
  }

  function criarCardProduto(produto) {
    const favorito = StorageFavoritos.estaFavoritado(produto.id);
    const col = document.createElement("div");
    col.className = "col";
    const ehLocal = Number(produto.id) < 0;
    col.innerHTML = `
      <div class="card h-100 shadow-sm ${favorito ? "border-warning" : ""}" data-product-id="${produto.id}">
        <img src="${escapeHtml(produto.thumbnail || "")}" class="card-img-top" alt="${escapeHtml(produto.title || "Produto")}" loading="lazy" />
        <div class="card-body d-flex flex-column">
          <h3 class="card-title h6">${escapeHtml(produto.title || "")}${ehLocal ? ' <span class="badge bg-secondary">Local</span>' : ""}</h3>
          <p class="card-text small text-muted mb-2">${escapeHtml(produto.category || "—")}</p>
          <p class="fw-semibold text-success mb-3">${formatarPreco(produto.price)}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <button type="button" class="btn btn-outline-secondary btn-sm btn-favorito" data-action="favorito" data-id="${produto.id}"
              aria-label="${favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}"
              aria-pressed="${favorito}">★</button>
          </div>
        </div>
      </div>
    `;
    const btn = col.querySelector('[data-action="favorito"]');
    btn.addEventListener("click", () => {
      StorageFavoritos.alternar(produto.id);
      atualizarBadge();
      renderizarTudo();
    });
    return col;
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function formatarPreco(price) {
    const n = Number(price);
    if (Number.isNaN(n)) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }).format(n);
  }

  function renderProdutos() {
    elGridProdutos.replaceChildren();
    const base = produtosFiltradosPorNome(todosProdutos);
    const catalogoVisivel = !elSecaoCatalogo.classList.contains("d-none");
    if (catalogoVisivel) {
      if (base.length === 0) {
        elAreaStatus.textContent = termoBusca.trim()
          ? "Nenhum produto encontrado para esta busca."
          : "Nenhum produto para exibir.";
      } else {
        elAreaStatus.textContent = `${base.length} produto(s) exibido(s).`;
      }
    }
    base.forEach((p) => elGridProdutos.appendChild(criarCardProduto(p)));
  }

  function renderFavoritos() {
    elGridFavoritos.replaceChildren();
    const ids = StorageFavoritos.obterIds();
    const lista = ids.map(produtoPorId).filter(Boolean);
    const filtrados = produtosFiltradosPorNome(lista);

    if (lista.length === 0) {
      elMsgFavoritosVazio.classList.remove("d-none");
    } else {
      elMsgFavoritosVazio.classList.add("d-none");
    }

    const favVisivel = !elSecaoFavoritos.classList.contains("d-none");
    if (favVisivel) {
      if (lista.length === 0) {
        elAreaStatus.textContent = "";
      } else if (filtrados.length === 0 && termoBusca.trim()) {
        elAreaStatus.textContent = "Nenhum favorito corresponde à busca.";
      } else {
        elAreaStatus.textContent = `${filtrados.length} favorito(s) na lista.`;
      }
    }

    filtrados.forEach((p) => elGridFavoritos.appendChild(criarCardProduto(p)));
  }

  function mostrarCatalogo() {
    elSecaoCatalogo.classList.remove("d-none");
    elSecaoFavoritos.classList.add("d-none");
    btnVerTodos.setAttribute("aria-current", "page");
    btnVerFavoritos.removeAttribute("aria-current");
  }

  function mostrarFavoritos() {
    elSecaoCatalogo.classList.add("d-none");
    elSecaoFavoritos.classList.remove("d-none");
    btnVerFavoritos.setAttribute("aria-current", "page");
    btnVerTodos.removeAttribute("aria-current");
    renderFavoritos();
  }

  function renderizarTudo() {
    const favoritosVisivel = !elSecaoFavoritos.classList.contains("d-none");
    renderProdutos();
    if (favoritosVisivel) renderFavoritos();
    atualizarBadge();
  }

  async function carregarProdutos() {
    elAreaStatus.textContent = "Carregando…";
    try {
      const [dummy, locais] = await Promise.all([
        ApiProdutos.carregarTodos(),
        ApiProdutos.carregarLocaisPublicos(),
      ]);
      todosProdutos = [...dummy, ...locais];
      elAreaStatus.textContent = "";
      renderizarTudo();
    } catch (e) {
      elAreaStatus.textContent = "Erro ao carregar dados. Verifique sua conexão.";
      console.error(e);
    }
  }

  elCampoBusca.addEventListener("input", () => {
    termoBusca = elCampoBusca.value;
    renderizarTudo();
    if (!elSecaoFavoritos.classList.contains("d-none")) renderFavoritos();
  });

  btnVerTodos.addEventListener("click", () => {
    mostrarCatalogo();
    renderizarTudo();
  });

  btnVerFavoritos.addEventListener("click", () => {
    mostrarFavoritos();
    atualizarBadge();
  });

  atualizarBadge();
  carregarProdutos();
})();
