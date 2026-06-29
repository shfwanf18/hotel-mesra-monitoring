# 🌐 Mesra Network Monitoring

Mesra Network Monitoring adalah aplikasi monitoring jaringan yang dikembangkan untuk membantu tim IT Hotel Mesra Samarinda memantau kondisi perangkat jaringan secara real-time.

Aplikasi ini memonitor Router, Switch, Access Point, dan Server menggunakan ICMP Ping, kemudian menampilkan status perangkat melalui dashboard berbasis web. Selain itu, sistem juga mendukung notifikasi Telegram dan Email ketika perangkat mengalami gangguan maupun kembali normal.

Project ini dibangun menggunakan **NestJS**, **PostgreSQL**, **React**, **Socket.IO**, dan **Tailwind CSS**.

---

## ✨ Features

### 📊 Real-time Monitoring

* Monitoring status perangkat secara real-time (Online, Offline, Warning, Unknown).
* Menampilkan latency setiap perangkat.
* Grafik latency (sparkline) dari histori ping terbaru.
* Perhitungan availability dan downtime secara otomatis.

### 🖧 Device Management

* Menambah, mengubah, dan menghapus perangkat langsung dari dashboard.
* Mendukung berbagai jenis perangkat seperti Router, Switch, Access Point, dan Server.
* Perubahan perangkat langsung diterapkan ke monitoring tanpa perlu restart aplikasi.

### 🚨 Notifications

* Notifikasi Telegram ketika perangkat Offline maupun Recovery.
* Notifikasi Email dengan informasi insiden yang lebih lengkap.
* Fail Threshold untuk mengurangi false alarm.

### 📋 Incident & Event History

* Mencatat waktu mulai gangguan, durasi downtime, dan waktu recovery.
* Menyimpan aktivitas seperti:

  * DOWN
  * RECOVERY
  * ALERT SENT
  * MANUAL TEST

### ⚙️ Settings

* Mengatur interval ping dan fail threshold.
* Mengelola penerima notifikasi Telegram dan Email.
* Melihat status layanan internal seperti API, Database, WebSocket, Telegram Bot, dan Email Service.

### 💻 Manual Ping Test

Menjalankan ping langsung dari server melalui halaman Device Detail tanpa perlu membuka Command Prompt atau Terminal.

---

## 🛠️ Tech Stack

| Component     | Technology                            |
| ------------- | ------------------------------------- |
| Backend       | NestJS, TypeORM, PostgreSQL           |
| Frontend      | React, Vite, TypeScript, Tailwind CSS |
| Realtime      | Socket.IO                             |
| Monitoring    | ICMP Ping                             |
| Notifications | Telegram Bot API, Nodemailer          |

---

## 📁 Project Structure

```text
PROJECT-MESRA-Monitoring/
├── backend/
│   ├── src/
│   │   ├── alert/
│   │   ├── database/
│   │   ├── device/
│   │   ├── history/
│   │   ├── monitoring/
│   │   └── settings/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
│
├── .env.example
├── INSTALL.md
└── README.md
```

---

## 🚀 Installation

Petunjuk instalasi tersedia pada file **INSTALL.md**.

Silakan ikuti langkah-langkah di sana untuk menjalankan aplikasi pada lingkungan development maupun production.

---

## 📸 Screenshots

Tambahkan beberapa screenshot aplikasi agar pengguna dapat melihat tampilan dashboard tanpa perlu menjalankan project.

Contoh:

* Dashboard
* Device Detail
* Device Management
* Settings
