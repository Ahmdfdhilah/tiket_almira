# 🚀 Deployment Guide - Tiket Bus Almira

## Admin Account Setup untuk Production

### 1. Buat Akun Admin Default

Setelah deploy aplikasi ke production, jalankan seeder untuk membuat akun admin:

```bash
npm run seed:admin
```

**Kredensial Default:**
- **Username:** `admin`
- **Email:** `admin@tiketbusalmira.com`
- **Password:** `AdminAlmira2024!`
- **Role:** `admin`

### 2. Buat Akun Admin Custom (Opsional)

Jika ingin membuat akun admin dengan kredensial custom:

```bash
# Format: npm run seed:admin-custom <username> <email> <password> [phone]
npm run seed:admin-custom superadmin admin@domain.com MySecurePass123! 081234567890
```

### 3. Generate Password Aman

Untuk generate password yang aman:

```bash
# Generate password 16 karakter (default)
npm run generate-password

# Generate password dengan panjang custom
npm run generate-password 20
```

## 🔐 Keamanan Setelah Deployment

### Langkah Wajib Setelah Deploy:

1. **Login dengan kredensial default**
2. **Ganti password segera** di halaman profile admin
3. **Update email** ke email admin yang sebenarnya
4. **Tambah nomor telepon** untuk recovery
5. **Hapus kredensial default** dari file ini setelah setup

### Environment Variables untuk Production:

```env
# Database
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=tiket_bus_almira_prod
DB_USER=your-db-user
DB_PASS=your-db-password

# JWT
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Backend URL
BACKEND_URL=https://api.your-domain.com

# Midtrans
MIDTRANS_SERVER_KEY=your-production-server-key
MIDTRANS_CLIENT_KEY=your-production-client-key
MIDTRANS_ENVIRONMENT=production

# Email (untuk notifikasi)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## 📝 Deployment Checklist

- [ ] Setup database production
- [ ] Set environment variables
- [ ] Deploy backend aplikasi
- [ ] Deploy frontend aplikasi  
- [ ] Jalankan `npm run seed:admin`
- [ ] Test login admin
- [ ] Ganti password admin default
- [ ] Setup domain dan SSL
- [ ] Test payment flow
- [ ] Setup monitoring/logging
- [ ] Setup backup database

## 🧪 Testing Seeder

Untuk test seeder tanpa database:
```bash
node seeders/adminSeeder.js test
```

## 🛠️ Troubleshooting

### Jika seeder gagal (Database Connection Error):
1. **Pastikan PostgreSQL running**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   # atau 
   pg_ctl status
   ```

2. **Verify database credentials** di file `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=postgres  
   DB_PASS=your_password
   DB_NAME=your_database
   DB_PORT=5432
   ```

3. **Create database jika belum ada**:
   ```sql
   createdb your_database_name
   ```

4. **Test koneksi manual**:
   ```bash
   psql -h localhost -U postgres -d your_database
   ```

### Jika seeder berhasil tapi tidak bisa login:
1. Cek kredensial yang digunakan
2. Pastikan role = 'admin' 
3. Cek apakah is_verified = true
4. Clear browser cache/cookies

### Reset admin password jika lupa:
```bash
# Buat admin baru dengan kredensial berbeda
npm run seed:admin-custom newadmin admin2@domain.com NewPassword123!
```

### Error "Admin already exists":
```bash
# Cek admin yang sudah ada di database
SELECT username, email, role FROM "Users" WHERE role = 'admin';

# Atau hapus admin lama dan buat baru
DELETE FROM "Users" WHERE role = 'admin';
npm run seed:admin
```

## 📞 Support

Jika ada masalah saat deployment, periksa:
1. Log aplikasi untuk error details
2. Database connection
3. Environment variables
4. Network/firewall settings