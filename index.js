#!/usr/bin/env node

const { Command } = require('commander');
const archiver = require('archiver');
const fs = require('fs');
const axios = require('axios');
const ora = require('ora');
const chalk = require('chalk');
const FormData = require('form-data');
const path = require('path');

const program = new Command();

program
  .name('teicloud')
  .description('Công cụ triển khai website siêu tốc của TeiCloud')
  .version('1.0.0');

program
  .command('deploy <projectName>')
  .description('Nén code và đẩy lên hệ thống TeiCloud theo tên dự án')
  .action(async (projectName) => { // Nhận biến projectName vào hàm
    
    // Kiểm tra tên project không được chứa khoảng trắng hoặc ký tự đặc biệt
    const validNameRegex = /^[a-z0-9-]+$/;
    if (!validNameRegex.test(projectName)) {
      console.log(chalk.red('❌ Lỗi: Tên dự án chỉ được chứa chữ cái thường, số và dấu gạch ngang (VD: my-web-123)'));
      process.exit(1);
    }

    const spinner = ora(`Đang đóng gói mã nguồn cho dự án [${projectName}]...`).start();
    
    try {
      const zipPath = path.join(process.cwd(), 'deploy.zip');
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        spinner.text = 'Đang chuyển giao lên Trạm trung chuyển...';
        
        const form = new FormData();
        form.append('file', fs.createReadStream(zipPath));
        
        // DÒNG QUAN TRỌNG: Đính kèm tên project vào gói hàng gửi đi
        form.append('projectName', projectName); 

        try {
          const response = await axios.post('https://teicloud-backend.onrender.com/upload', form, {
            headers: form.getHeaders(),
          });
          
          spinner.succeed(chalk.green(' ' + response.data.message));
          console.log(chalk.blue('🔗 Theo dõi tiến trình build tại: ' + response.data.github_url));
        } catch (err) {
          const errorMsg = err.response?.data?.error || err.message;
          spinner.fail(chalk.red(' Lỗi upload: ' + errorMsg));
        } finally {
          // Xóa file zip tạm sau khi gửi xong
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }
      });

      archive.pipe(output);
      // Nén tất cả, NHƯNG BỎ QUA thư mục node_modules, .git và chính file zip
      archive.glob('**/*', {
        ignore: ['node_modules/**', 'deploy.zip', '.git/**']
      });
      await archive.finalize();

    } catch (error) {
      spinner.fail(chalk.red('Có lỗi xảy ra: ' + error.message));
    }
  });

program.parse(process.argv);