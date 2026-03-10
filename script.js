// Giả lập dữ liệu từ ESP32 gửi lên
function updateSensors() {
    const temp = (Math.random() * (35 - 25) + 25).toFixed(1);
    const moisture = Math.floor(Math.random() * (80 - 40) + 40);
    const light = Math.floor(Math.random() * (1000 - 300) + 300);

    document.getElementById('temp').innerText = `${temp} °C`;
    document.getElementById('moisture').innerText = `${moisture} %`;
    document.getElementById('light').innerText = `${light} Lux`;

    const aiStatus = document.getElementById('ai-status');
    if (moisture < 50) {
        aiStatus.innerText = "Đất khô. Cần tưới!";
        aiStatus.style.color = "#ef4444"; // Đỏ
    } else {
        aiStatus.innerText = "Cây đang phát triển tốt";
        aiStatus.style.color = "#10b981"; // Xanh
    }
}

// Cập nhật dữ liệu mỗi 3 giây
setInterval(updateSensors, 3000);
updateSensors();

function triggerWatering() {
    const btn = document.querySelector('.action-btn');
    btn.innerText = "⏳ Đang gửi lệnh tới máy bơm...";
    btn.style.background = "#fbbf24";
    
    setTimeout(() => {
        btn.innerText = "✅ Đã tưới xong!";
        btn.style.background = "#10b981";
        
        // Reset nút sau 2 giây
        setTimeout(() => {
            btn.innerText = "💦 Kích hoạt tưới cây";
        }, 2000);
    }, 1500);
}