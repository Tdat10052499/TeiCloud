// File: login.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk'); // Dùng chalk để tô màu cho đẹp

const PORT = 3456; 
const TEICLOUD_WEB_URL = "http://localhost:5173"; 

async function handleLogin() {
  console.log(chalk.cyan("🚀 Khởi động luồng đăng nhập TeiCloud..."));

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

    console.log(chalk.green(`\n✅ Đăng nhập thành công với tài khoản: ${email}`));
    console.log(chalk.gray(`🔑 Token lưu tại: ${configDir}/auth.json`));
    
    server.close();
    process.exit(0);
  });

  server = app.listen(PORT, '127.0.0.1', async () => {
    console.log(chalk.yellow(`> Đang mở trình duyệt để xác thực...`));
    await openBrowser(`${TEICLOUD_WEB_URL}/cli-auth?port=${PORT}`);
  });
}

// KHÔNG gọi hàm ở đây nữa, mà Export nó ra
module.exports = handleLogin;