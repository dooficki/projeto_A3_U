"use strict";

const http = require("http");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL não definido.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

function sendEmpty(res, status) {
  res.writeHead(status);
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("JSON inválido"));
      }
    });
    req.on("error", reject);
  });
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'geral',
      thumbnail TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function rowToAdmin(row) {
  return {
    id: row.id,
    title: row.title,
    price: Number(row.price),
    category: row.category,
    thumbnail: row.thumbnail || "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToPublicCatalog(row) {
  const r = rowToAdmin(row);
  return {
    ...r,
    id: -Math.abs(r.id),
  };
}

function parseBody(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : "geral";
  const thumbnail = typeof body.thumbnail === "string" ? body.thumbnail.trim() : "";
  const price = Number(body.price);
  return { title, category, thumbnail, price };
}

/** @param {http.IncomingMessage} req */
async function handle(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method || "GET";

  try {
    if (method === "GET" && path === "/api/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (method === "GET" && path === "/api/produtos/public") {
      const r = await pool.query(
        "SELECT id, title, price, category, thumbnail FROM produtos ORDER BY id ASC"
      );
      return sendJson(res, 200, r.rows.map(rowToPublicCatalog));
    }

    if (method === "GET" && path === "/api/produtos") {
      const r = await pool.query(
        "SELECT id, title, price, category, thumbnail, created_at, updated_at FROM produtos ORDER BY id ASC"
      );
      return sendJson(res, 200, r.rows.map(rowToAdmin));
    }

    const produtoMatch = path.match(/^\/api\/produtos\/([^/]+)$/);
    if (produtoMatch) {
      const segment = produtoMatch[1];
      if (segment === "public") {
        return sendJson(res, 404, { error: "Não encontrado." });
      }

      const id = Number(segment);
      if (!Number.isInteger(id) || id <= 0) {
        return sendJson(res, 400, { error: "ID inválido." });
      }

      if (method === "GET") {
        const r = await pool.query(
          "SELECT id, title, price, category, thumbnail, created_at, updated_at FROM produtos WHERE id = $1",
          [id]
        );
        if (r.rowCount === 0) return sendJson(res, 404, { error: "Não encontrado." });
        return sendJson(res, 200, rowToAdmin(r.rows[0]));
      }

      if (method === "PUT") {
        let body;
        try {
          body = await readBody(req);
        } catch {
          return sendJson(res, 400, { error: "Corpo inválido." });
        }
        const parsed = parseBody(body || {});
        if (!parsed.title) return sendJson(res, 400, { error: "Título obrigatório." });
        if (Number.isNaN(parsed.price) || parsed.price < 0) {
          return sendJson(res, 400, { error: "Preço inválido." });
        }
        const r = await pool.query(
          `UPDATE produtos
           SET title = $1, price = $2, category = $3, thumbnail = $4, updated_at = NOW()
           WHERE id = $5
           RETURNING id, title, price, category, thumbnail, created_at, updated_at`,
          [parsed.title, parsed.price, parsed.category, parsed.thumbnail, id]
        );
        if (r.rowCount === 0) return sendJson(res, 404, { error: "Não encontrado." });
        return sendJson(res, 200, rowToAdmin(r.rows[0]));
      }

      if (method === "DELETE") {
        const r = await pool.query("DELETE FROM produtos WHERE id = $1 RETURNING id", [id]);
        if (r.rowCount === 0) return sendJson(res, 404, { error: "Não encontrado." });
        return sendEmpty(res, 204);
      }

      res.setHeader("Allow", "GET, PUT, DELETE");
      return sendJson(res, 405, { error: "Método não permitido." });
    }

    if (method === "POST" && path === "/api/produtos") {
      let body;
      try {
        body = await readBody(req);
      } catch {
        return sendJson(res, 400, { error: "Corpo inválido." });
      }
      const { title, category, thumbnail, price } = parseBody(body || {});
      if (!title) return sendJson(res, 400, { error: "Título obrigatório." });
      if (Number.isNaN(price) || price < 0) {
        return sendJson(res, 400, { error: "Preço inválido." });
      }
      const r = await pool.query(
        `INSERT INTO produtos (title, price, category, thumbnail)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, price, category, thumbnail, created_at, updated_at`,
        [title, price, category, thumbnail]
      );
      return sendJson(res, 201, rowToAdmin(r.rows[0]));
    }

    return sendJson(res, 404, { error: "Não encontrado." });
  } catch (e) {
    console.error(e);
    return sendJson(res, 500, { error: "Erro interno no servidor." });
  }
}

ensureSchema()
  .then(() => {
    const server = http.createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error(err);
        sendJson(res, 500, { error: "Erro interno no servidor." });
      });
    });
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`API ouvindo na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
