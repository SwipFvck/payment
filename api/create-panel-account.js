// File: api/create-panel-account.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, product_id, order_id, amount } = req.body || {};

    if (!username || !product_id || !order_id || !amount) {
      return res.status(400).json({
        error: "Missing required fields: username, product_id, order_id, amount",
      });
    }

    // Konfigurasi
    const PTERO_API_URL = "https://relxzpribb.izumicool.my.id"; // TODO: ganti sesuai panel
    const PTERO_API_KEY = "ptla_uAA87nb5vLssoQbIPsYDela230JyXuPdCQop7wb4CzM"; // TODO: ganti API key Pterodactyl
    const LOGIN_URL = "https://relxzpribb.izumicool.my.id"; // TODO: URL login user

    // RAM mapping berdasarkan produk
    const ramMapping = {
      "panel-1gb": 1024,
      "panel-2gb": 2048,
      "panel-3gb": 3072,
      "panel-4gb": 4096,
      "panel-5gb": 5120,
      "panel-6gb": 6144,
      "panel-7gb": 7168,
      "panel-8gb": 8192,
      "panel-9gb": 9216,
      "panel-10gb": 10240,
      "panel-unli": 999999, // bebas
    };

    const ram = ramMapping[product_id];
    if (!ram) {
      return res.status(400).json({ error: "Invalid product_id / not a panel product" });
    }

    // Generate password random
    function randomPass(len) {
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let pass = "";
      for (let i = 0; i < len; i++) {
        pass += charset[Math.floor(Math.random() * charset.length)];
      }
      return pass;
    }

    const password = randomPass(10);

    console.log("Membuat user panel:", username);

    // Buat user di Pterodactyl
    const createUser = await fetch(`${PTERO_API_URL}/api/application/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PTERO_API_KEY}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`, // auto email
        first_name: username,
        last_name: "User",
        password,
      }),
    });

    const createdUser = await createUser.json();
    if (!createUser.ok) {
      console.error("Error create user:", createdUser);
      return res.status(createUser.status).json({
        error: "Gagal membuat user panel",
        details: createdUser,
      });
    }

    const userId = createdUser.attributes.id;

    console.log("User berhasil dibuat:", userId);

    // Buat 1 server default auto
    const createServer = await fetch(`${PTERO_API_URL}/api/application/servers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PTERO_API_KEY}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: `srv-${username}`,
        user: userId,
        egg: 1, // TODO: sesuaikan egg ID
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18", // contoh image NodeJS
        startup: "npm start",
        limits: {
          memory: ram,
          swap: 0,
          disk: ram * 2,
          io: 500,
          cpu: 100,
        },
        environment: {
          STARTUP_CMD: "npm",
        },
        feature_limits: {
          databases: 1,
          backups: 1,
        },
        allocation: {
          default: 1, // TODO: sesuaikan allocation ID node kamu
        },
      }),
    });

    const serverResponse = await createServer.json();
    if (!createServer.ok) {
      console.error("Error create server:", serverResponse);
      return res.status(createServer.status).json({
        error: "User dibuat, tetapi gagal membuat server",
        user: createdUser,
        details: serverResponse,
      });
    }

    console.log("Server berhasil dibuat untuk user:", username);

    return res.json({
      success: true,
      message: "Panel user and server created",
      panel: {
        username,
        password,
        login_url: LOGIN_URL,
        ram,
      },
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
}
