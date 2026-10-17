export type Language = 'en' | 'ms';

export const translations = {
  en: {
    appName: 'Employee Attendance System',
    workerForm: 'Worker Attendance Form',
    adminDashboard: 'Admin Dashboard',
    adminLogin: 'Admin Sign In',
    signOut: 'Sign Out',
    refresh: 'Refresh',
    month: 'Month',
    year: 'Year',
    employee: 'Employee',
    selectEmployee: '-- Select Your Name --',
    department: 'Department',
    status: 'Status',
    actions: 'Actions',
    
    // Statuses
    Present: 'Present',
    'Off Day': 'Off Day',
    'Sick Leave': 'Sick Leave',
    'Emergency Leave': 'Emergency Leave',
    'Public Holiday': 'Public Holiday',
    Others: 'Others',

    // Submission states
    Completed: 'Completed',
    Incomplete: 'Incomplete',
    Pending: 'Pending',
    Active: 'Active',
    Inactive: 'Inactive',

    // Form fields
    date: 'Date',
    day: 'Day',
    timeArrive: 'Time In',
    timeLeave: 'Time Out',
    remarks: 'Remarks',
    optionalRemarks: 'Remarks (optional)',
    submit: 'Submit Attendance',
    submitting: 'Submitting...',
    submissionSuccessful: 'Attendance Submitted Successfully!',
    submissionSuccessMsg: 'Your monthly attendance records have been safely recorded.',
    submitAnother: 'Submit Another',
    fillStandardHours: 'Set 09:00 - 18:00 for Present Days',
    markWeekdaysPresent: 'Set All Weekdays as Present',

    // Locking
    linkLockedAlert: 'Attendance submission is currently closed. Please contact your administrator.',
    linkLockedTitle: 'Submission Link Closed',
    lockLink: 'Lock Submission Link',
    unlockLink: 'Unlock Submission Link',
    linkIsUnlocked: 'Submission Link is OPEN',
    linkIsLocked: 'Submission Link is LOCKED',
    lockConfirmTitle: 'Lock Attendance Submission?',
    lockConfirmDesc: 'Employees will not be able to view or submit attendance while locked.',
    unlockConfirmTitle: 'Unlock Attendance Submission?',
    unlockConfirmDesc: 'Employees will be able to access the form and submit attendance.',
    confirm: 'Confirm',
    cancel: 'Cancel',

    // Admin dashboard
    overview: 'Overview',
    totalWorkers: 'Active Workers',
    completedCount: 'Completed',
    pendingCount: 'Pending',
    incompleteCount: 'Incomplete',
    completionRate: 'Completion Rate',
    addWorker: 'Add Employee',
    editWorker: 'Edit Employee',
    workerName: 'Employee Name',
    deactivate: 'Deactivate',
    activate: 'Activate',
    searchWorker: 'Search employee name or department...',
    filterDepartment: 'All Departments',
    filterStatus: 'All Statuses',
    viewDetails: 'View & Edit Records',
    reopenSubmission: 'Reopen Submission',
    exportExcel: 'Export Excel (.xlsx)',
    exportPdf: 'Print / Export PDF',

    // Modals
    confirmSubmitTitle: 'Confirm Monthly Submission',
    confirmSubmitMsg: 'Please review your monthly attendance summary before submitting:',
    totalDays: 'Total Days',
    daysPresent: 'Days Present',
    daysOff: 'Days Off',
    daysLeave: 'Days On Leave',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    deleteConfirm: 'Are you sure you want to reopen/delete this submission?',

    // Errors
    missingTimesError: 'Please enter both arrival and departure times for all Present days.',
    workerRequired: 'Please select your name.',
    serverError: 'A server error occurred. Please try again.',
    loginFailed: 'Invalid username or password.',
    unauthorized: 'Session expired. Please sign in again.',
  },
  ms: {
    appName: 'Sistem Kehadiran Pekerja',
    workerForm: 'Borang Kehadiran Pekerja',
    adminDashboard: 'Papan Pemuka Pentadbir',
    adminLogin: 'Log Masuk Pentadbir',
    signOut: 'Log Keluar',
    refresh: 'Muat Semula',
    month: 'Bulan',
    year: 'Tahun',
    employee: 'Pekerja',
    selectEmployee: '-- Pilih Nama Anda --',
    department: 'Jabatan',
    status: 'Status',
    actions: 'Tindakan',
    
    // Statuses
    Present: 'Hadir',
    'Off Day': 'Hari Cuti',
    'Sick Leave': 'Cuti Sakit',
    'Emergency Leave': 'Cuti Kecemasan',
    'Public Holiday': 'Cuti Umum',
    Others: 'Lain-lain',

    // Submission states
    Completed: 'Selesai',
    Incomplete: 'Tidak Lengkap',
    Pending: 'Belum Hantar',
    Active: 'Aktif',
    Inactive: 'Tidak Aktif',

    // Form fields
    date: 'Tarikh',
    day: 'Hari',
    timeArrive: 'Masa Masuk',
    timeLeave: 'Masa Keluar',
    remarks: 'Keterangan',
    optionalRemarks: 'Keterangan (pilihan)',
    submit: 'Hantar Kehadiran',
    submitting: 'Sedang Dihantar...',
    submissionSuccessful: 'Kehadiran Berjaya Dihantar!',
    submissionSuccessMsg: 'Rekod kehadiran bulanan anda telah disimpan dengan selamat.',
    submitAnother: 'Hantar Lagi',
    fillStandardHours: 'Isi 09:00 - 18:00 untuk Hari Hadir',
    markWeekdaysPresent: 'Tetapkan Semua Hari Bekerja sebagai Hadir',

    // Locking
    linkLockedAlert: 'Penyerahan kehadiran ditutup buat masa ini. Sila hubungi pentadbir anda.',
    linkLockedTitle: 'Pautan Penyerahan Ditutup',
    lockLink: 'Kunci Pautan Penyerahan',
    unlockLink: 'Buka Pautan Penyerahan',
    linkIsUnlocked: 'Pautan Penyerahan DIBUKA',
    linkIsLocked: 'Pautan Penyerahan DIKUNCI',
    lockConfirmTitle: 'Kunci Pautan Penyerahan Kehadiran?',
    lockConfirmDesc: 'Pekerja tidak akan dapat melihat atau menghantar kehadiran semasa dikunci.',
    unlockConfirmTitle: 'Buka Pautan Penyerahan Kehadiran?',
    unlockConfirmDesc: 'Pekerja akan dapat membuka borang dan menghantar kehadiran.',
    confirm: 'Sahkan',
    cancel: 'Batal',

    // Admin dashboard
    overview: 'Ringkasan',
    totalWorkers: 'Pekerja Aktif',
    completedCount: 'Selesai',
    pendingCount: 'Belum Hantar',
    incompleteCount: 'Tidak Lengkap',
    completionRate: 'Kadar Selesai',
    addWorker: 'Tambah Pekerja',
    editWorker: 'Kemaskini Pekerja',
    workerName: 'Nama Pekerja',
    deactivate: 'Nyahaktif',
    activate: 'Aktifkan',
    searchWorker: 'Cari nama pekerja atau jabatan...',
    filterDepartment: 'Semua Jabatan',
    filterStatus: 'Semua Status',
    viewDetails: 'Lihat & Edit Rekod',
    reopenSubmission: 'Buka Semula Penyerahan',
    exportExcel: 'Eksport Excel (.xlsx)',
    exportPdf: 'Cetak / Eksport PDF',

    // Modals
    confirmSubmitTitle: 'Sahkan Penyerahan Bulanan',
    confirmSubmitMsg: 'Sila semak ringkasan kehadiran bulanan anda sebelum menghantar:',
    totalDays: 'Jumlah Hari',
    daysPresent: 'Hari Hadir',
    daysOff: 'Hari Cuti',
    daysLeave: 'Hari Cuti Sakit / Lain',
    saveChanges: 'Simpan Perubahan',
    saving: 'Menyimpan...',
    deleteConfirm: 'Adakah anda pasti mahu memadam penyerahan ini dan kembalikan ke Belum Hantar?',

    // Errors
    missingTimesError: 'Sila masukkan masa masuk dan masa keluar untuk semua hari Hadir.',
    workerRequired: 'Sila pilih nama anda.',
    serverError: 'Ralat pelayan berlaku. Sila cuba sebentar lagi.',
    loginFailed: 'Nama pengguna atau kata laluan tidak sah.',
    unauthorized: 'Sesi tamat. Sila log masuk semula.',
  },
};

export const MONTH_NAMES = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  ms: [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
  ],
};

export const DAY_NAMES = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ms: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'],
};
