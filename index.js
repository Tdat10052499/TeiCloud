#!/usr/bin/env node

const { Command } = require('commander');
const archiver = require('archiver');
const fs = require('fs');
const axios = require('axios');
const ora = require('ora');
const chalk = require('chalk');
const FormData = require('form-data');
const path = require('path');
const os = require('os');

// Import hàm login từ file login.js
const handleLogin = require('./login');

// CHÚ Ý: Biến môi trường Backend
// Khi nào đưa cho người dùng thật thì đổi thành: 'https://teicloud-backend.onrender.com'
const BACKEND_URL = 'https://teicloud-backend.onrender.com'
const program = new Command();

program
  .name('teicloud')
  .description('Công cụ triển khai website siêu tốc của TeiCloud')
  .version('1.0.0');

// ==========================================
// LỆNH 1: TEICLOUD LOGIN
// ==========================================
program
  .command('login')
  .description('Đăng nhập vào tài khoản TeiCloud của bạn qua trình duyệt')
  .action(() => {
    handleLogin();
  });

// ==========================================
// LỆNH 2: TEICLOUD DEPLOY
// ==========================================
program
  .command('deploy <projectName>')
  .description('Nén mã nguồn và đẩy lên hệ thống TeiCloud theo tên dự án')
  .action(async (projectName) => {
    
    // 1. KIỂM TRA ĐĂNG NHẬP
    const configPath = path.join(os.homedir(), '.teicloud', 'auth.json');
    if (!fs.existsSync(configPath)) {
      console.log(chalk.red('❌ Lỗi: Bạn chưa đăng nhập. Vui lòng chạy lệnh: ') + chalk.cyan('teicloud login'));
      process.exit(1);
    }
    
    const authData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const token = authData.token;

    // 2. KIỂM TRA TÊN DỰ ÁN
    const validNameRegex = /^[a-z0-9-]+$/;
    if (!validNameRegex.test(projectName)) {
      console.log(chalk.red('❌ Lỗi: Tên dự án chỉ được chứa chữ cái thường, số và dấu gạch ngang (VD: my-web-123)'));
      process.exit(1);
    }

    const spinner = ora(`Đang đóng gói mã nguồn cho dự án [${projectName}]...`).start();
    
    try {
      const zipPath = path.join(process.cwd(), 'deploy.zip');
      const output = fs.createWriteStream(zipPath);
      
      // ĐÃ SỬA: Giảm mức độ nén xuống 5 để tăng tốc độ đóng gói gấp đôi
      const archive = archiver('zip', { zlib: { level: 5 } });

      output.on('close', async () => {
        spinner.text = 'Đang chuyển giao lên Trạm trung chuyển TeiCloud...';
        
        const form = new FormData();
        form.append('file', fs.createReadStream(zipPath));
        form.append('projectName', projectName); 

        try {
          // ĐÃ SỬA: Gọi đến biến BACKEND_URL
          const response = await axios.post(`${BACKEND_URL}/upload`, form, {
            headers: {
              ...form.getHeaders(),
              'Authorization': `Bearer ${token}` 
            },
          });
          
          spinner.succeed(chalk.green(' Deploy thành công: ' + response.data.message));
          if (response.data.github_url) {
            console.log(chalk.blue('🔗 Theo dõi tiến trình build tại: ' + response.data.github_url));
          }
        } catch (err) {
          const errorMsg = err.response?.data?.error || err.message;
          spinner.fail(chalk.red(' Lỗi upload: ' + errorMsg));
        } finally {
          // Xóa file zip tạm sau khi gửi xong
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }
      });

      archive.pipe(output);
      // Nén tất cả, bỏ qua node_modules, git và chính file zip
      archive.glob('**/*', {
        ignore: ['node_modules/**', 'deploy.zip', '.git/**']
      });
      await archive.finalize();

    } catch (error) {
      spinner.fail(chalk.red('Có lỗi xảy ra: ' + error.message));
    }
  });

program.parse(process.argv);

// Nếu gõ 'teicloud' trống không, hiện menu hướng dẫn
if (!process.argv.slice(2).length) {
  program.outputHelp();
}