const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3456; 
const TEICLOUD_WEB_URL = "http://localhost:5173"; 

async function login() {
  console.log("🚀 Khởi động luồng đăng nhập TeiCloud...");

  // FIX LỖI: Import thư viện 'open' bằng phương pháp động (Dynamic Import)
  const { default: openBrowser } = await import('open');

  const app = express();
  let server;

  app.get('/callback', (req, res) => {
    const accessToken = req.query.token;
    const email = req.query.email;

    if (!accessToken) {
      res.send("<h1>❌ Đăng nhập thất bại. Không nhận được Token.</h1>");
      process.exit(1);
    }

    const configDir = path.join(os.homedir(), '.teicloud');
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir);
    
    fs.writeFileSync(
      path.join(configDir, 'auth.json'), 
      JSON.stringify({ token: accessToken, email: email })
    );

    res.send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h1 style="color: #06b6d4;">Đăng nhập thành công!</h1>
        <p>Xin chào <b>${email}</b>. Bạn có thể đóng tab này và quay lại Terminal.</p>
      </div>
    `);

    console.log(`\n✅ Đăng nhập thành công với tài khoản: ${email}`);
    console.log(`🔑 Token đã được lưu an toàn tại: ${configDir}/auth.json`);
    
    server.close();
    process.exit(0);
  });

// Ép Node.js mở server ở IPv4 (127.0.0.1) để khớp với trình duyệt
  server = app.listen(PORT, '127.0.0.1', async () => {
    console.log(`> Đang chờ xác thực trên trình duyệt...`);
    // Sử dụng hàm openBrowser vừa import động
    await openBrowser(`${TEICLOUD_WEB_URL}/cli-auth?port=${PORT}`);
  });
}

login();