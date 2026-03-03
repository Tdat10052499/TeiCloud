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
  .command('deploy')
  .description('Nén code và đẩy lên hệ thống TeiCloud')
  .action(async () => {
    const spinner = ora('Đang gói code của bạn lại...').start();
    
    try {
      const zipPath = path.join(process.cwd(), 'deploy.zip');
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        spinner.text = 'Đang bắn code lên Trạm trung chuyển (Backend)...';
        
        const form = new FormData();
        form.append('file', fs.createReadStream(zipPath));

        try {
          // Gửi tới Backend đang chạy trên localhost:3000 của bạn
          const response = await axios.post('http://localhost:3000/upload', form, {
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