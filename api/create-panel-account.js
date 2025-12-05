// api/create-panel-account.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, product_id, order_id, amount } = req.body || {};

    if (!username || !product_id || !order_id || !amount) {
      return res.status(400).json({
        error: "username, product_id, order_id, amount wajib diisi",
      });
    }

    // ==============================
    // KONFIGURASI PTERODACTYL
    // ==============================
    const PTERO_API_URL = process.env.PTERO_API_URL;   // contoh: https://panel.swiperfvck.my.id
    const PTERO_API_KEY = process.env.PTERO_API_KEY;   // Application API Key dari /admin/api
    const LOGIN_URL = process.env.PTERO_LOGIN_URL || PTERO_API_URL;

    if (!PTERO_API_URL || !PTERO_API_KEY) {
      return res.status(500).json({
        error: "PTERO_API_URL / PTERO_API_KEY belum diset di Environment Vercel",
      });
    }

    // username → email dummy
    const email = `${username}@example.com`;

    // generate password random
    function randomPass(len) {
      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let out = "";
      for (let i = 0; i < len; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
      }
      return out;
    }

    const password = randomPass(10);

    console.log("Create panel user:", { username, email, order_id, amount });

    // ==============================
    // CALL PTERODACTYL API (CREATE USER)
    // ==============================
    const createUserRes = await fetch(
      `${PTERO_API_URL.replace(/\/+$/, "")}/api/application/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${PTERO_API_KEY}`,
        },
        body: JSON.stringify({
          username,
          email,
          first_name: username,
          last_name: "User",
          password,
        }),
      }
    );

    const bodyText = await createUserRes.text();
    let bodyJson;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      bodyJson = bodyText;
    }

    if (!createUserRes.ok) {
      console.error("Ptero create user error:", createUserRes.status, bodyJson);
      return res.status(createUserRes.status).json({
        error: "Gagal membuat user panel",
        status: createUserRes.status,
        response: bodyJson,
      });
    }

    const user = bodyJson.attributes || bodyJson;

    console.log("Panel user created:", user.id || user.uuid || "?");

    return res.status(200).json({
      success: true,
      panel: {
        username,
        password,
        login_url: LOGIN_URL,
      },
    });
  } catch (err) {
    console.error("create-panel-account ERROR:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
}
