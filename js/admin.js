(function () {
  const API_BASE = "/api";

  const elCorpo = document.getElementById("corpoTabela");
  if (!elCorpo) return;
  const elAlerta = document.getElementById("adminAlerta");
  const elMsgVazio = document.getElementById("msgVazio");
  const btnNovo = document.getElementById("btnNovo");
  const btnSalvar = document.getElementById("btnSalvar");
  const modalEl = document.getElementById("modalProduto");
  const modal = new bootstrap.Modal(modalEl);

  const campoId = document.getElementById("campoId");
  const campoTitulo = document.getElementById("campoTitulo");
  const campoPreco = document.getElementById("campoPreco");
  const campoCategoria = document.getElementById("campoCategoria");
  const campoThumbnail = document.getElementById("campoThumbnail");
  const modalTitulo = document.getElementById("modalProdutoTitulo");

  function mostrarAlerta(msg) {
    elAlerta.textContent = msg;
    elAlerta.classList.remove("d-none");
  }

  function limparAlerta() {
    elAlerta.textContent = "";
    elAlerta.classList.add("d-none");
  }

  async function request(path, options) {
    const res = await fetch(API_BASE + path, options);
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const err =
        data && typeof data === "object" && data.error
          ? data.error
          : res.statusText || "Erro na requisição";
      throw new Error(err);
    }
    return data;
  }

  function formatarPreco(price) {
    const n = Number(price);
    if (Number.isNaN(n)) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function abrirNovo() {
    limparAlerta();
    modalTitulo.textContent = "Novo produto";
    campoId.value = "";
    campoTitulo.value = "";
    campoPreco.value = "0";
    campoCategoria.value = "geral";
    campoThumbnail.value = "";
    modal.show();
  }

  function abrirEditar(p) {
    limparAlerta();
    modalTitulo.textContent = "Editar produto";
    campoId.value = String(p.id);
    campoTitulo.value = p.title || "";
    campoPreco.value = String(p.price ?? 0);
    campoCategoria.value = ApiProdutos.categoriaParaValor(p.category);
    campoThumbnail.value = p.thumbnail || "";
    modal.show();
  }

  async function salvar() {
    limparAlerta();
    const id = campoId.value.trim();
    const body = {
      title: campoTitulo.value.trim(),
      price: Number(campoPreco.value),
      category: campoCategoria.value || "geral",
      thumbnail: campoThumbnail.value.trim(),
    };
    try {
      if (id) {
        await request("/produtos/" + encodeURIComponent(id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await request("/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      modal.hide();
      await carregarLista();
      document.dispatchEvent(new CustomEvent("produtos-locais-alterados"));
    } catch (e) {
      mostrarAlerta(String(e.message || e));
    }
  }

  async function excluir(id) {
    if (!confirm("Excluir este produto?")) return;
    limparAlerta();
    try {
      await request("/produtos/" + encodeURIComponent(id), { method: "DELETE" });
      await carregarLista();
      document.dispatchEvent(new CustomEvent("produtos-locais-alterados"));
    } catch (e) {
      mostrarAlerta(String(e.message || e));
    }
  }

  function renderizarLinhas(lista) {
    elCorpo.replaceChildren();
    if (!lista.length) {
      elMsgVazio.classList.remove("d-none");
      return;
    }
    elMsgVazio.classList.add("d-none");
    lista.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(String(p.id))}</td>
        <td>${escapeHtml(p.title || "")}</td>
        <td>${escapeHtml(formatarPreco(p.price))}</td>
        <td>${escapeHtml(ApiProdutos.traduzirCategoria(p.category))}</td>
        <td class="text-end text-nowrap">
          <button type="button" class="btn btn-sm btn-outline-primary me-1 btn-editar">Editar</button>
          <button type="button" class="btn btn-sm btn-outline-danger btn-excluir">Excluir</button>
        </td>
      `;
      tr.querySelector(".btn-editar").addEventListener("click", () => abrirEditar(p));
      tr.querySelector(".btn-excluir").addEventListener("click", () => excluir(p.id));
      elCorpo.appendChild(tr);
    });
  }

  async function carregarLista() {
    limparAlerta();
    try {
      const lista = await request("/produtos");
      renderizarLinhas(Array.isArray(lista) ? lista : []);
    } catch (e) {
      mostrarAlerta("Erro ao conectar na API: " + (e.message || e));
      renderizarLinhas([]);
    }
  }

  btnNovo.addEventListener("click", abrirNovo);
  btnSalvar.addEventListener("click", salvar);

  window.AdminPainel = { carregarLista };
})();
