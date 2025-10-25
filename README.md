# Employee Attendance Dashboard

Real-time employee attendance monitoring system with MySQL integration, analytics, and reporting capabilities.

## Features

- 📊 **Real-time Dashboard** - Live attendance statistics with auto-refresh every 30 seconds
- 👥 **Live Attendance Monitoring** - Real-time log of employee check-ins
- 📈 **Category Analytics** - Attendance breakdown by units (Pembagian 1) and departments (Pembagian 2)
- 📋 **Report Generation** - Personal and unit/department attendance reports
- 📥 **CSV Export** - Export reports to CSV format
- 🎨 **Modern UI** - Beautiful, responsive design with charts and visualizations

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MySQL/MariaDB
- **Charts**: Recharts
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ 
- MySQL or MariaDB database
- npm (comes with Node.js)

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/tkj45/rspres.git
cd rspres
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure database connection**

Create a `.env` file in the root directory:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=ftm_v6
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **Set up database**

The application expects the following tables:
- `pegawai` - Employee master data
- `att_log` - Raw attendance logs
- `rkp_att_log` - Processed daily attendance (check-in/out times)
- `log_epres` - Electronic presence logs

Refer to your existing database schema or contact your database administrator.

## Running the Application

**Development mode:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## Database Schema

### pegawai (Employees)
- `pegawai_pin` - Employee PIN/ID
- `pegawai_nama` - Employee name
- `pegawai_nip` - Employee identification number
- `pembagian1_id` - Unit/division ID
- `pembagian2_id` - Department ID
- `pegawai_status` - Employee status (0 = active)

### rkp_att_log (Daily Attendance)
- `pin` - Employee PIN
- `scan_date` - Attendance date
- `scan_date_in` - Check-in time
- `scan_date_out` - Check-out time

### att_log (Raw Attendance Logs)
- `pin` - Employee PIN
- `scan_date` - Scan timestamp
- `verifymode` - Verification method
- `inoutmode` - Check-in/out mode

## API Endpoints

- `GET /api/test` - Database connection test
- `GET /api/attendance/today` - Today's attendance
- `GET /api/attendance/stats` - Attendance statistics
- `GET /api/attendance/live` - Live attendance logs
- `GET /api/employees` - All employees list
- `GET /api/reports/personal` - Personal attendance report
- `GET /api/reports/unit` - Unit/department report
- `GET /api/categories/pembagian1` - Unit categories
- `GET /api/categories/pembagian2` - Department categories

## Usage

### Dashboard Tab
- View real-time attendance statistics
- See pie chart of present vs absent employees
- View bar charts by unit and department
- Browse today's attendance list

### Live Attendance Tab
- Monitor real-time check-ins
- Auto-refreshes every 30 seconds
- Shows employee name, PIN, and timestamp

### Reports Tab
- Generate personal reports by employee and date range
- Generate unit/department reports
- Export data to CSV format

## Deployment

When deploying to production:

1. Update `.env` with your production database credentials
2. Set `NEXT_PUBLIC_BASE_URL` to your production URL
3. Build the application: `npm run build`
4. Start the server: `npm start`

## Troubleshooting

**Database connection issues:**
- Verify MySQL/MariaDB is running
- Check database credentials in `.env`
- Ensure database user has proper permissions

**Port already in use:**
- Change the port in package.json scripts
- Or stop the process using port 3000

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
