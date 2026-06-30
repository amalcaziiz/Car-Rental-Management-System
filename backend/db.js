/**
 * Database Connector (db.js)
 * Manages connections and raw SQL execution on Oracle DB via node-oracledb.
 * Includes a simulated database fallback to ensure zero-setup testing.
 */

const fs = require('fs');
const path = require('path');
let oracledb;

try {
    oracledb = require('oracledb');
} catch (err) {
    console.warn("Oracle DB driver (oracledb) failed to load. Running in SIMULATED fallback mode.");
}

// Simulated data storage path
const SIMULATED_DB_FILE = path.join(__dirname, 'database.json');

const SEED_DATA = {
    car_categories: [
        { category_id: 1, category_name: 'SUV', description: 'Sport Utility Vehicle' },
        { category_id: 2, category_name: 'Sedan', description: 'Comfort family car' },
        { category_id: 3, category_name: 'Hatchback', description: 'Small city car' },
        { category_id: 4, category_name: 'Truck', description: 'Heavy load vehicle' },
        { category_id: 5, category_name: 'Luxury', description: 'High-end premium cars' },
        { category_id: 6, category_name: 'Sports', description: 'High performance cars' },
        { category_id: 7, category_name: 'Van', description: 'Passenger transport' },
        { category_id: 8, category_name: 'Electric', description: 'EV cars' },
        { category_id: 9, category_name: 'Hybrid', description: 'Fuel-efficient cars' },
        { category_id: 10, category_name: 'Offroad', description: 'Rough terrain cars' }
    ],
    users: [
        { user_id: 1, username: 'admin1', password: '1234', role: 'ADMIN', created_at: '2026-06-28' },
        { user_id: 2, username: 'staff1', password: '1234', role: 'STAFF', created_at: '2026-06-28' },
        { user_id: 3, username: 'staff2', password: '1234', role: 'STAFF', created_at: '2026-06-28' },
        { user_id: 4, username: 'staff3', password: '1234', role: 'STAFF', created_at: '2026-06-28' },
        { user_id: 5, username: 'staff4', password: '1234', role: 'STAFF', created_at: '2026-06-28' }
    ],
    customers: [
        { customer_id: 1, full_name: 'Ali Hassan', phone: '617000001', email: 'ali@gmail.com', national_id: 'ID001', created_at: '2026-06-28' },
        { customer_id: 2, full_name: 'Asha Noor', phone: '617000002', email: 'asha@gmail.com', national_id: 'ID002', created_at: '2026-06-28' },
        { customer_id: 3, full_name: 'Omar Ali', phone: '617000003', email: 'omar@gmail.com', national_id: 'ID003', created_at: '2026-06-28' },
        { customer_id: 4, full_name: 'Fatima Yusuf', phone: '617000004', email: 'fatima@gmail.com', national_id: 'ID004', created_at: '2026-06-28' },
        { customer_id: 5, full_name: 'Hassan Jama', phone: '617000005', email: 'hassan@gmail.com', national_id: 'ID005', created_at: '2026-06-28' },
        { customer_id: 6, full_name: 'Maryan Abdi', phone: '617000006', email: 'maryan@gmail.com', national_id: 'ID006', created_at: '2026-06-28' },
        { customer_id: 7, full_name: 'Ahmed Farah', phone: '617000007', email: 'ahmed@gmail.com', national_id: 'ID007', created_at: '2026-06-28' },
        { customer_id: 8, full_name: 'Hodan Ali', phone: '617000008', email: 'hodan@gmail.com', national_id: 'ID008', created_at: '2026-06-28' },
        { customer_id: 9, full_name: 'Ismail Noor', phone: '617000009', email: 'ismail@gmail.com', national_id: 'ID009', created_at: '2026-06-28' },
        { customer_id: 10, full_name: 'Zahra Mohamed', phone: '617000010', email: 'zahra@gmail.com', national_id: 'ID010', created_at: '2026-06-28' }
    ],
    cars: [
        { car_id: 1, category_id: 1, brand: 'Toyota', model: 'RAV4', year: 2022, daily_rate: 50, status: 'AVAILABLE', plate_number: 'AA001' },
        { car_id: 2, category_id: 2, brand: 'Toyota', model: 'Corolla', year: 2021, daily_rate: 30, status: 'AVAILABLE', plate_number: 'AA002' },
        { car_id: 3, category_id: 3, brand: 'Honda', model: 'Fit', year: 2020, daily_rate: 25, status: 'AVAILABLE', plate_number: 'AA003' },
        { car_id: 4, category_id: 4, brand: 'Ford', model: 'Ranger', year: 2023, daily_rate: 70, status: 'AVAILABLE', plate_number: 'AA004' },
        { car_id: 5, category_id: 5, brand: 'BMW', model: 'X5', year: 2023, daily_rate: 120, status: 'AVAILABLE', plate_number: 'AA005' },
        { car_id: 6, category_id: 6, brand: 'Nissan', model: 'GTR', year: 2022, daily_rate: 150, status: 'AVAILABLE', plate_number: 'AA006' },
        { car_id: 7, category_id: 7, brand: 'Mercedes', model: 'Vito', year: 2021, daily_rate: 80, status: 'AVAILABLE', plate_number: 'AA007' },
        { car_id: 8, category_id: 8, brand: 'Tesla', model: 'Model 3', year: 2023, daily_rate: 100, status: 'AVAILABLE', plate_number: 'AA008' },
        { car_id: 9, category_id: 9, brand: 'Toyota', model: 'Prius', year: 2020, daily_rate: 60, status: 'AVAILABLE', plate_number: 'AA009' },
        { car_id: 10, category_id: 10, brand: 'Jeep', model: 'Wrangler', year: 2022, daily_rate: 90, status: 'AVAILABLE', plate_number: 'AA010' }
    ],
    rentals: [
        { rental_id: 1, customer_id: 1, car_id: 1, user_id: 1, start_date: '2026-06-25', end_date: '2026-06-28', total_days: 3, total_cost: 150, status: 'RETURNED' },
        { rental_id: 2, customer_id: 2, car_id: 2, user_id: 1, start_date: '2026-06-26', end_date: '2026-06-28', total_days: 2, total_cost: 60, status: 'RETURNED' },
        { rental_id: 3, customer_id: 3, car_id: 3, user_id: 1, start_date: '2026-06-24', end_date: '2026-06-29', total_days: 5, total_cost: 125, status: 'RETURNED' },
        { rental_id: 4, customer_id: 4, car_id: 4, user_id: 1, start_date: '2026-06-27', end_date: '2026-06-28', total_days: 1, total_cost: 70, status: 'RETURNED' },
        { rental_id: 5, customer_id: 5, car_id: 5, user_id: 1, start_date: '2026-06-28', end_date: '2026-07-02', total_days: 4, total_cost: 480, status: 'ONGOING' },
        { rental_id: 6, customer_id: 6, car_id: 6, user_id: 1, start_date: '2026-06-26', end_date: '2026-06-28', total_days: 2, total_cost: 300, status: 'RETURNED' },
        { rental_id: 7, customer_id: 7, car_id: 7, user_id: 1, start_date: '2026-06-25', end_date: '2026-06-28', total_days: 3, total_cost: 240, status: 'RETURNED' },
        { rental_id: 8, customer_id: 8, car_id: 8, user_id: 1, start_date: '2026-06-28', end_date: '2026-07-04', total_days: 6, total_cost: 600, status: 'ONGOING' },
        { rental_id: 9, customer_id: 9, car_id: 9, user_id: 1, start_date: '2026-06-26', end_date: '2026-06-28', total_days: 2, total_cost: 120, status: 'RETURNED' },
        { rental_id: 10, customer_id: 10, car_id: 10, user_id: 1, start_date: '2026-06-28', end_date: '2026-07-05', total_days: 7, total_cost: 598.5, status: 'ONGOING' }
    ],
    payments: [
        { payment_id: 1, rental_id: 1, amount: 150, payment_date: '2026-06-28', method: 'CASH' },
        { payment_id: 2, rental_id: 2, amount: 60, payment_date: '2026-06-28', method: 'CARD' },
        { payment_id: 3, rental_id: 3, amount: 125, payment_date: '2026-06-28', method: 'MOBILE' },
        { payment_id: 4, rental_id: 4, amount: 70, payment_date: '2026-06-28', method: 'CASH' },
        { payment_id: 5, rental_id: 5, amount: 480, payment_date: '2026-06-28', method: 'CARD' },
        { payment_id: 6, rental_id: 6, amount: 300, payment_date: '2026-06-28', method: 'CASH' },
        { payment_id: 7, rental_id: 7, amount: 240, payment_date: '2026-06-28', method: 'MOBILE' },
        { payment_id: 8, rental_id: 8, amount: 600, payment_date: '2026-06-28', method: 'CARD' },
        { payment_id: 9, rental_id: 9, amount: 120, payment_date: '2026-06-28', method: 'CASH' },
        { payment_id: 10, rental_id: 10, amount: 598.5, payment_date: '2026-06-28', method: 'CARD' }
    ],
    maintenance: [
        { maintenance_id: 1, car_id: 1, issue_description: 'Oil change', cost: 20, status: 'DONE', maintenance_date: '2026-06-28' },
        { maintenance_id: 2, car_id: 2, issue_description: 'Brake check', cost: 40, status: 'DONE', maintenance_date: '2026-06-28' },
        { maintenance_id: 3, car_id: 3, issue_description: 'Engine tune', cost: 100, status: 'PENDING', maintenance_date: '2026-06-28' },
        { maintenance_id: 4, car_id: 4, issue_description: 'Tire replacement', cost: 200, status: 'DONE', maintenance_date: '2026-06-28' },
        { maintenance_id: 5, car_id: 5, issue_description: 'Battery check', cost: 50, status: 'PENDING', maintenance_date: '2026-06-28' },
        { maintenance_id: 6, car_id: 6, issue_description: 'AC repair', cost: 80, status: 'DONE', maintenance_date: '2026-06-28' },
        { maintenance_id: 7, car_id: 7, issue_description: 'Transmission fix', cost: 300, status: 'PENDING', maintenance_date: '2026-06-28' },
        { maintenance_id: 8, car_id: 8, issue_description: 'Wash & service', cost: 30, status: 'DONE', maintenance_date: '2026-06-28' },
        { maintenance_id: 9, car_id: 9, issue_description: 'General check', cost: 25, status: 'DONE', maintenance_date: '2026-06-28' },
        { maintenance_id: 10, car_id: 10, issue_description: 'Engine oil leak fix', cost: 150, status: 'PENDING', maintenance_date: '2026-06-28' }
    ],
    insurance: [
        { insurance_id: 1, car_id: 1, provider: 'AXA', expiry_date: '2027-06-28', cost: 200 },
        { insurance_id: 2, car_id: 2, provider: 'AXA', expiry_date: '2027-06-28', cost: 180 },
        { insurance_id: 3, car_id: 3, provider: 'Allianz', expiry_date: '2027-06-28', cost: 220 },
        { insurance_id: 4, car_id: 4, provider: 'AXA', expiry_date: '2027-06-28', cost: 250 },
        { insurance_id: 5, car_id: 5, provider: 'Allianz', expiry_date: '2027-06-28', cost: 300 },
        { insurance_id: 6, car_id: 6, provider: 'AXA', expiry_date: '2027-06-28', cost: 280 },
        { insurance_id: 7, car_id: 7, provider: 'AXA', expiry_date: '2027-06-28', cost: 150 },
        { insurance_id: 8, car_id: 8, provider: 'Tesla Insurance', expiry_date: '2027-06-28', cost: 400 },
        { insurance_id: 9, car_id: 9, provider: 'AXA', expiry_date: '2027-06-28', cost: 160 },
        { insurance_id: 10, car_id: 10, provider: 'Allianz', expiry_date: '2027-06-28', cost: 210 }
    ],
    rental_audit: [
        { audit_id: 1, rental_id: 1, action: 'RENTAL CREATED', action_date: '2026-06-25' },
        { audit_id: 2, rental_id: 2, action: 'RENTAL CREATED', action_date: '2026-06-26' },
        { audit_id: 3, rental_id: 3, action: 'RENTAL CREATED', action_date: '2026-06-24' },
        { audit_id: 4, rental_id: 4, action: 'RENTAL CREATED', action_date: '2026-06-27' },
        { audit_id: 5, rental_id: 5, action: 'RENTAL CREATED', action_date: '2026-06-28' },
        { audit_id: 6, rental_id: 6, action: 'RENTAL CREATED', action_date: '2026-06-26' },
        { audit_id: 7, rental_id: 7, action: 'RENTAL CREATED', action_date: '2026-06-25' },
        { audit_id: 8, rental_id: 8, action: 'RENTAL CREATED', action_date: '2026-06-28' },
        { audit_id: 9, rental_id: 9, action: 'RENTAL CREATED', action_date: '2026-06-26' },
        { audit_id: 10, rental_id: 10, action: 'RENTAL CREATED', action_date: '2026-06-28' }
    ]
};

// --- Oracle Configuration variables
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION
};

let pool = null;
let isRealOracle = false;

// Convert column header keys back to lower-case for frontend compatibility
function keysToLowerCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(keysToLowerCase);
    
    const newObj = {};
    for (const key in obj) {
        newObj[key.toLowerCase()] = keysToLowerCase(obj[key]);
    }
    return newObj;
}

// --- Initialize Oracle DB Pool
async function initialize() {
    if (oracledb && process.env.DB_USER && process.env.DB_PASSWORD) {
        try {
            pool = await oracledb.createPool(dbConfig);
            isRealOracle = true;
            console.log("=============================================================");
            console.log("🟢 Successfully connected to your live ORACLE DATABASE pool!");
            console.log("=============================================================");
        } catch (err) {
            console.error("🔴 Failed to connect to Oracle DB. Falling back to local database.json file. Error:", err.message);
        }
    } else {
        console.log("ℹ️ Running in simulated DB mode. Define DB_USER in .env to connect to Oracle.");
    }
    
    if (!isRealOracle && !fs.existsSync(SIMULATED_DB_FILE)) {
        fs.writeFileSync(SIMULATED_DB_FILE, JSON.stringify(SEED_DATA, null, 2));
    }
}

// --- DB Query Executor
async function query(sql, binds = {}, options = {}) {
    if (isRealOracle) {
        let connection;
        try {
            connection = await pool.getConnection();
            const result = await connection.execute(sql, binds, {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                autoCommit: true,
                ...options
            });
            return keysToLowerCase(result.rows || result);
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    } else {
        throw new Error("Simulated query execution fallback not loaded. Use jsonDb driver.");
    }
}

// --- Read simulated DB
function readSimulatedDb() {
    try {
        return JSON.parse(fs.readFileSync(SIMULATED_DB_FILE, 'utf8'));
    } catch (e) {
        return JSON.parse(JSON.stringify(SEED_DATA));
    }
}

function saveSimulatedDb(data) {
    fs.writeFileSync(SIMULATED_DB_FILE, JSON.stringify(data, null, 2));
}

// --- Unified data operations wrapping both Oracle SQL and JSON fallback
const dataOps = {
    // === CARS OPERATIONS ===
    getCars: async () => {
        if (isRealOracle) {
            return await query(`
                SELECT c.car_id, c.category_id, c.brand, c.model, c.year, c.daily_rate, c.status, c.plate_number, cat.category_name 
                FROM cars c 
                LEFT JOIN car_categories cat ON c.category_id = cat.category_id 
                ORDER BY c.car_id
            `);
        } else {
            const db = readSimulatedDb();
            return db.cars.map(car => {
                const cat = db.car_categories.find(c => c.category_id === car.category_id);
                return { ...car, category_name: cat ? cat.category_name : 'N/A' };
            });
        }
    },

    getCarById: async (id) => {
        if (isRealOracle) {
            const rows = await query(`SELECT * FROM cars WHERE car_id = :id`, { id: Number(id) });
            return rows[0] || null;
        } else {
            const db = readSimulatedDb();
            return db.cars.find(c => c.car_id === Number(id)) || null;
        }
    },

    createCar: async (car) => {
        if (isRealOracle) {
            await query(`
                INSERT INTO cars (category_id, brand, model, year, daily_rate, status, plate_number) 
                VALUES (:category_id, :brand, :model, :year, :daily_rate, :status, :plate_number)
            `, {
                category_id: Number(car.category_id),
                brand: car.brand,
                model: car.model,
                year: Number(car.year),
                daily_rate: Number(car.daily_rate),
                status: car.status || 'AVAILABLE',
                plate_number: car.plate_number.toUpperCase()
            });
            return true;
        } else {
            const db = readSimulatedDb();
            const nextId = db.cars.length > 0 ? Math.max(...db.cars.map(c => c.car_id)) + 1 : 1;
            const newCar = { car_id: nextId, ...car, year: Number(car.year), daily_rate: Number(car.daily_rate), category_id: Number(car.category_id) };
            db.cars.push(newCar);
            saveSimulatedDb(db);
            return newCar;
        }
    },

    updateCar: async (id, car) => {
        if (isRealOracle) {
            await query(`
                UPDATE cars 
                SET category_id = :category_id, brand = :brand, model = :model, year = :year, 
                    daily_rate = :daily_rate, status = :status, plate_number = :plate_number 
                WHERE car_id = :car_id
            `, {
                car_id: Number(id),
                category_id: Number(car.category_id),
                brand: car.brand,
                model: car.model,
                year: Number(car.year),
                daily_rate: Number(car.daily_rate),
                status: car.status,
                plate_number: car.plate_number.toUpperCase()
            });
            return true;
        } else {
            const db = readSimulatedDb();
            const index = db.cars.findIndex(c => c.car_id === Number(id));
            if (index > -1) {
                db.cars[index] = { ...db.cars[index], ...car, year: Number(car.year), daily_rate: Number(car.daily_rate), category_id: Number(car.category_id) };
                saveSimulatedDb(db);
                return db.cars[index];
            }
            return null;
        }
    },

    deleteCar: async (id) => {
        if (isRealOracle) {
            await query(`DELETE FROM cars WHERE car_id = :id`, { id: Number(id) });
            return true;
        } else {
            const db = readSimulatedDb();
            db.cars = db.cars.filter(c => c.car_id !== Number(id));
            saveSimulatedDb(db);
            return true;
        }
    },

    // === CUSTOMERS OPERATIONS ===
    getCustomers: async () => {
        if (isRealOracle) {
            return await query(`SELECT customer_id, full_name, phone, email, national_id, TO_CHAR(created_at, 'YYYY-MM-DD') as created_at FROM customers ORDER BY customer_id`);
        } else {
            return readSimulatedDb().customers;
        }
    },

    getCustomerById: async (id) => {
        if (isRealOracle) {
            const rows = await query(`SELECT * FROM customers WHERE customer_id = :id`, { id: Number(id) });
            return rows[0] || null;
        } else {
            return readSimulatedDb().customers.find(c => c.customer_id === Number(id)) || null;
        }
    },

    createCustomer: async (cust) => {
        if (isRealOracle) {
            await query(`
                INSERT INTO customers (full_name, phone, email, national_id) 
                VALUES (:full_name, :phone, :email, :national_id)
            `, {
                full_name: cust.full_name,
                phone: cust.phone,
                email: cust.email,
                national_id: cust.national_id
            });
            return true;
        } else {
            const db = readSimulatedDb();
            const nextId = db.customers.length > 0 ? Math.max(...db.customers.map(c => c.customer_id)) + 1 : 1;
            const newCust = { customer_id: nextId, ...cust, created_at: new Date().toISOString().split('T')[0] };
            db.customers.push(newCust);
            saveSimulatedDb(db);
            return newCust;
        }
    },

    updateCustomer: async (id, cust) => {
        if (isRealOracle) {
            await query(`
                UPDATE customers 
                SET full_name = :full_name, phone = :phone, email = :email, national_id = :national_id 
                WHERE customer_id = :customer_id
            `, {
                customer_id: Number(id),
                full_name: cust.full_name,
                phone: cust.phone,
                email: cust.email,
                national_id: cust.national_id
            });
            return true;
        } else {
            const db = readSimulatedDb();
            const index = db.customers.findIndex(c => c.customer_id === Number(id));
            if (index > -1) {
                db.customers[index] = { ...db.customers[index], ...cust };
                saveSimulatedDb(db);
                return db.customers[index];
            }
            return null;
        }
    },

    deleteCustomer: async (id) => {
        if (isRealOracle) {
            await query(`DELETE FROM customers WHERE customer_id = :id`, { id: Number(id) });
            return true;
        } else {
            const db = readSimulatedDb();
            db.customers = db.customers.filter(c => c.customer_id !== Number(id));
            saveSimulatedDb(db);
            return true;
        }
    },

    // === CATEGORIES ===
    getCategories: async () => {
        if (isRealOracle) {
            return await query(`SELECT category_id, category_name, description FROM car_categories ORDER BY category_id`);
        } else {
            return readSimulatedDb().car_categories;
        }
    },

    // === RENTALS (stored procedures safe_rental & return_car wrapper) ===
    getRentals: async () => {
        if (isRealOracle) {
            return await query(`
                SELECT r.rental_id, r.customer_id, r.car_id, r.user_id, 
                       TO_CHAR(r.start_date, 'YYYY-MM-DD') as start_date, 
                       TO_CHAR(r.end_date, 'YYYY-MM-DD') as end_date, 
                       r.total_days, r.total_cost, r.status,
                       cust.full_name as customer_name,
                       c.brand as car_brand, c.model as car_model, c.plate_number as car_plate,
                       u.username as staff_name
                FROM rentals r
                JOIN customers cust ON r.customer_id = cust.customer_id
                JOIN cars c ON r.car_id = c.car_id
                JOIN users u ON r.user_id = u.user_id
                ORDER BY r.rental_id
            `);
        } else {
            const db = readSimulatedDb();
            return db.rentals.map(r => {
                const cust = db.customers.find(c => c.customer_id === r.customer_id);
                const car = db.cars.find(c => c.car_id === r.car_id);
                const user = db.users.find(u => u.user_id === r.user_id);
                return {
                    ...r,
                    customer_name: cust ? cust.full_name : 'Unknown',
                    car_brand: car ? car.brand : 'N/A',
                    car_model: car ? car.model : '',
                    car_plate: car ? car.plate_number : '',
                    staff_name: user ? user.username : 'Unknown'
                };
            });
        }
    },

    createRental: async (rental) => {
        const start = new Date(rental.start_date);
        const end = new Date(rental.end_date);
        const diffTime = Math.abs(end - start);
        const total_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (isRealOracle) {
            let connection;
            try {
                connection = await pool.getConnection();
                
                // Call safe_rental PL/SQL Stored Procedure
                const result = await connection.execute(
                    `BEGIN safe_rental(:customer_id, :car_id, :user_id, :days, :rental_id); END;`,
                    {
                        customer_id: Number(rental.customer_id),
                        car_id: Number(rental.car_id),
                        user_id: Number(rental.user_id),
                        days: Number(total_days),
                        rental_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
                    },
                    { autoCommit: true }
                );

                const newRentalId = result.outBinds.rental_id;
                
                // If there's custom dates, update the start/end date explicitly since procedure default is SYSDATE / SYSDATE+days
                await connection.execute(
                    `UPDATE rentals SET start_date = TO_DATE(:start_date, 'YYYY-MM-DD'), end_date = TO_DATE(:end_date, 'YYYY-MM-DD') WHERE rental_id = :rental_id`,
                    {
                        start_date: rental.start_date,
                        end_date: rental.end_date,
                        rental_id: newRentalId
                    },
                    { autoCommit: true }
                );

                return { rental_id: newRentalId };
            } finally {
                if (connection) await connection.close();
            }
        } else {
            // Emulate Trigger Checks & Calculations
            const db = readSimulatedDb();
            
            // Double booking checker trigger
            const overlaps = db.rentals.filter(r => {
                if (r.car_id !== Number(rental.car_id) || r.status !== 'ONGOING') return false;
                const rStart = new Date(r.start_date);
                const rEnd = new Date(r.end_date);
                return !(end < rStart || start > rEnd);
            });
            if (overlaps.length > 0) throw new Error("Car already booked in this period (trg_no_double_booking constraint violation)");

            // Cost function calculation
            const car = db.cars.find(c => c.car_id === Number(rental.car_id));
            let total_cost = total_days * car.daily_rate;
            if (total_days >= 7) total_cost = total_cost * 0.95; // 5% discount

            const nextId = db.rentals.length > 0 ? Math.max(...db.rentals.map(r => r.rental_id)) + 1 : 1;
            const newRental = {
                rental_id: nextId,
                customer_id: Number(rental.customer_id),
                car_id: Number(rental.car_id),
                user_id: Number(rental.user_id),
                start_date: rental.start_date,
                end_date: rental.end_date,
                total_days,
                total_cost,
                status: 'ONGOING'
            };
            db.rentals.push(newRental);

            // Update car status to RENTED
            car.status = 'RENTED';

            // Audit trigger
            const nextAuditId = db.rental_audit.length > 0 ? Math.max(...db.rental_audit.map(a => a.audit_id)) + 1 : 1;
            db.rental_audit.push({
                audit_id: nextAuditId,
                rental_id: nextId,
                action: 'RENTAL CREATED',
                action_date: new Date().toISOString().split('T')[0]
            });

            // Initial Payment Auto logs
            const nextPayId = db.payments.length > 0 ? Math.max(...db.payments.map(p => p.payment_id)) + 1 : 1;
            db.payments.push({
                payment_id: nextPayId,
                rental_id: nextId,
                amount: total_cost,
                payment_date: new Date().toISOString().split('T')[0],
                method: 'CARD'
            });

            saveSimulatedDb(db);
            return newRental;
        }
    },

    returnRental: async (id) => {
        if (isRealOracle) {
            let connection;
            try {
                connection = await pool.getConnection();
                await connection.execute(
                    `BEGIN return_car(:rental_id); END;`,
                    {
                        rental_id: { val: Number(id), dir: oracledb.BIND_INOUT, type: oracledb.NUMBER }
                    },
                    { autoCommit: true }
                );
                return true;
            } finally {
                if (connection) await connection.close();
            }
        } else {
            const db = readSimulatedDb();
            const rental = db.rentals.find(r => r.rental_id === Number(id));
            if (!rental) throw new Error("Rental not found.");
            
            rental.status = 'RETURNED';
            const car = db.cars.find(c => c.car_id === rental.car_id);
            if (car) car.status = 'AVAILABLE';
            
            saveSimulatedDb(db);
            return true;
        }
    },

    deleteRental: async (id) => {
        if (isRealOracle) {
            await query(`DELETE FROM rentals WHERE rental_id = :id`, { id: Number(id) });
            return true;
        } else {
            const db = readSimulatedDb();
            db.rentals = db.rentals.filter(r => r.rental_id !== Number(id));
            saveSimulatedDb(db);
            return true;
        }
    },

    updateRental: async (id, rental) => {
        const start = new Date(rental.start_date);
        const end = new Date(rental.end_date);
        const diffTime = Math.abs(end - start);
        const total_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (isRealOracle) {
            let connection;
            try {
                connection = await pool.getConnection();

                const carRes = await connection.execute(
                    `SELECT daily_rate, status FROM cars WHERE car_id = :car_id`,
                    { car_id: Number(rental.car_id) }
                );
                if (carRes.rows.length === 0) throw new Error("Car not found");
                const dailyRate = carRes.rows[0][0];

                let total_cost = total_days * dailyRate;
                if (total_days >= 7) total_cost = total_cost * 0.95;

                const oldRes = await connection.execute(
                    `SELECT car_id, status FROM rentals WHERE rental_id = :rental_id`,
                    { rental_id: Number(id) }
                );
                if (oldRes.rows.length > 0) {
                    const oldCarId = oldRes.rows[0][0];
                    const oldStatus = oldRes.rows[0][1];

                    if (oldCarId !== Number(rental.car_id)) {
                        await connection.execute(
                            `UPDATE cars SET status = 'AVAILABLE' WHERE car_id = :old_car_id`,
                            { old_car_id: oldCarId }
                        );
                        await connection.execute(
                            `UPDATE cars SET status = 'RENTED' WHERE car_id = :new_car_id`,
                            { new_car_id: Number(rental.car_id) }
                        );
                    }

                    if (rental.status !== 'ONGOING' && oldStatus === 'ONGOING') {
                        await connection.execute(
                            `UPDATE cars SET status = 'AVAILABLE' WHERE car_id = :car_id`,
                            { car_id: Number(rental.car_id) }
                        );
                    } else if (rental.status === 'ONGOING' && oldStatus !== 'ONGOING') {
                        await connection.execute(
                            `UPDATE cars SET status = 'RENTED' WHERE car_id = :car_id`,
                            { car_id: Number(rental.car_id) }
                        );
                    }
                }

                await connection.execute(
                    `UPDATE rentals 
                     SET customer_id = :customer_id, 
                         car_id = :car_id, 
                         start_date = TO_DATE(:start_date, 'YYYY-MM-DD'), 
                         end_date = TO_DATE(:end_date, 'YYYY-MM-DD'), 
                         total_days = :total_days, 
                         total_cost = :total_cost, 
                         status = :status 
                     WHERE rental_id = :rental_id`,
                    {
                        customer_id: Number(rental.customer_id),
                        car_id: Number(rental.car_id),
                        start_date: rental.start_date,
                        end_date: rental.end_date,
                        total_days: Number(total_days),
                        total_cost: Number(total_cost),
                        status: rental.status,
                        rental_id: Number(id)
                    },
                    { autoCommit: true }
                );

                return true;
            } finally {
                if (connection) await connection.close();
            }
        } else {
            const db = readSimulatedDb();
            const index = db.rentals.findIndex(r => r.rental_id === Number(id));
            if (index > -1) {
                const oldCarId = db.rentals[index].car_id;
                const oldStatus = db.rentals[index].status;

                const car = db.cars.find(c => c.car_id === Number(rental.car_id));
                if (!car) throw new Error("Car not found");

                let total_cost = total_days * car.daily_rate;
                if (total_days >= 7) total_cost = total_cost * 0.95;

                if (oldCarId !== Number(rental.car_id)) {
                    const oldCar = db.cars.find(c => c.car_id === oldCarId);
                    if (oldCar) oldCar.status = 'AVAILABLE';
                    car.status = 'RENTED';
                }

                if (rental.status !== 'ONGOING' && oldStatus === 'ONGOING') {
                    car.status = 'AVAILABLE';
                } else if (rental.status === 'ONGOING' && oldStatus !== 'ONGOING') {
                    car.status = 'RENTED';
                }

                db.rentals[index] = {
                    ...db.rentals[index],
                    customer_id: Number(rental.customer_id),
                    car_id: Number(rental.car_id),
                    start_date: rental.start_date,
                    end_date: rental.end_date,
                    total_days,
                    total_cost,
                    status: rental.status
                };

                saveSimulatedDb(db);
                return db.rentals[index];
            }
            return null;
        }
    },

    // === PAYMENTS & AUDITS ===
    getPayments: async () => {
        if (isRealOracle) {
            return await query(`SELECT payment_id, rental_id, amount, TO_CHAR(payment_date, 'YYYY-MM-DD') as payment_date, method FROM payments ORDER BY payment_id`);
        } else {
            return readSimulatedDb().payments;
        }
    },

    createPayment: async (pay) => {
        if (isRealOracle) {
            await query(`
                INSERT INTO payments (rental_id, amount, payment_date, method) 
                VALUES (:rental_id, :amount, SYSDATE, :method)
            `, {
                rental_id: Number(pay.rental_id),
                amount: Number(pay.amount),
                method: pay.method
            });
            return true;
        } else {
            const db = readSimulatedDb();
            const nextId = db.payments.length > 0 ? Math.max(...db.payments.map(p => p.payment_id)) + 1 : 1;
            const newPay = {
                payment_id: nextId,
                rental_id: Number(pay.rental_id),
                amount: Number(pay.amount),
                payment_date: new Date().toISOString().split('T')[0],
                method: pay.method
            };
            db.payments.push(newPay);
            saveSimulatedDb(db);
            return newPay;
        }
    },

    deletePayment: async (id) => {
        if (isRealOracle) {
            await query(`DELETE FROM payments WHERE payment_id = :id`, { id: Number(id) });
            return true;
        } else {
            const db = readSimulatedDb();
            db.payments = db.payments.filter(p => p.payment_id !== Number(id));
            saveSimulatedDb(db);
            return true;
        }
    },

    getAudits: async () => {
        if (isRealOracle) {
            return await query(`SELECT audit_id, rental_id, action, TO_CHAR(action_date, 'YYYY-MM-DD') as action_date FROM rental_audit ORDER BY audit_id`);
        } else {
            return readSimulatedDb().rental_audit;
        }
    },

    // === MAINTENANCE ===
    getMaintenance: async () => {
        if (isRealOracle) {
            return await query(`
                SELECT m.maintenance_id, m.car_id, m.issue_description, m.cost, 
                       TO_CHAR(m.maintenance_date, 'YYYY-MM-DD') as maintenance_date, 
                       m.status,
                       c.brand as car_brand, c.model as car_model, c.plate_number as car_plate
                FROM maintenance m
                JOIN cars c ON m.car_id = c.car_id
                ORDER BY m.maintenance_id
            `);
        } else {
            const db = readSimulatedDb();
            return db.maintenance.map(m => {
                const car = db.cars.find(c => c.car_id === m.car_id);
                return {
                    ...m,
                    car_brand: car ? car.brand : 'Unknown',
                    car_model: car ? car.model : '',
                    car_plate: car ? car.plate_number : ''
                };
            });
        }
    },

    createMaintenance: async (maint) => {
        if (isRealOracle) {
            await query(`
                INSERT INTO maintenance (car_id, issue_description, cost, status, maintenance_date) 
                VALUES (:car_id, :issue_description, :cost, :status, SYSDATE)
            `, {
                car_id: Number(maint.car_id),
                issue_description: maint.issue_description,
                cost: Number(maint.cost || 0),
                status: maint.status || 'PENDING'
            });

            if (maint.status === 'PENDING') {
                await query(`UPDATE cars SET status = 'MAINTENANCE' WHERE car_id = :id`, { id: Number(maint.car_id) });
            }
            return true;
        } else {
            const db = readSimulatedDb();
            const nextId = db.maintenance.length > 0 ? Math.max(...db.maintenance.map(m => m.maintenance_id)) + 1 : 1;
            const newMaint = {
                maintenance_id: nextId,
                car_id: Number(maint.car_id),
                issue_description: maint.issue_description,
                cost: Number(maint.cost || 0),
                status: maint.status || 'PENDING',
                maintenance_date: new Date().toISOString().split('T')[0]
            };
            db.maintenance.push(newMaint);

            if (newMaint.status === 'PENDING') {
                const car = db.cars.find(c => c.car_id === newMaint.car_id);
                if (car) car.status = 'MAINTENANCE';
            }

            saveSimulatedDb(db);
            return newMaint;
        }
    },

    updateMaintenance: async (id, maint) => {
        if (isRealOracle) {
            await query(`
                UPDATE maintenance 
                SET car_id = :car_id, issue_description = :issue_description, cost = :cost, status = :status 
                WHERE maintenance_id = :maintenance_id
            `, {
                maintenance_id: Number(id),
                car_id: Number(maint.car_id),
                issue_description: maint.issue_description,
                cost: Number(maint.cost),
                status: maint.status
            });

            if (maint.status === 'DONE') {
                await query(`UPDATE cars SET status = 'AVAILABLE' WHERE car_id = :id`, { id: Number(maint.car_id) });
            }
            return true;
        } else {
            const db = readSimulatedDb();
            const index = db.maintenance.findIndex(m => m.maintenance_id === Number(id));
            if (index > -1) {
                const prevStatus = db.maintenance[index].status;
                db.maintenance[index] = { ...db.maintenance[index], ...maint };

                if (maint.status === 'DONE' && prevStatus === 'PENDING') {
                    const car = db.cars.find(c => c.car_id === db.maintenance[index].car_id);
                    if (car) car.status = 'AVAILABLE';
                }
                saveSimulatedDb(db);
                return db.maintenance[index];
            }
            return null;
        }
    },

    deleteMaintenance: async (id) => {
        if (isRealOracle) {
            await query(`DELETE FROM maintenance WHERE maintenance_id = :id`, { id: Number(id) });
            return true;
        } else {
            const db = readSimulatedDb();
            db.maintenance = db.maintenance.filter(m => m.maintenance_id !== Number(id));
            saveSimulatedDb(db);
            return true;
        }
    },

    // === INSURANCE ===
    getInsurance: async () => {
        if (isRealOracle) {
            return await query(`
                SELECT ins.insurance_id, ins.car_id, ins.provider, ins.cost, 
                       TO_CHAR(ins.expiry_date, 'YYYY-MM-DD') as expiry_date,
                       c.brand as car_brand, c.model as car_model, c.plate_number as car_plate
                FROM insurance ins
                JOIN cars c ON ins.car_id = c.car_id
                ORDER BY ins.insurance_id
            `);
        } else {
            const db = readSimulatedDb();
            return db.insurance.map(ins => {
                const car = db.cars.find(c => c.car_id === ins.car_id);
                return {
                    ...ins,
                    car_brand: car ? car.brand : 'Unknown',
                    car_model: car ? car.model : '',
                    car_plate: car ? car.plate_number : ''
                };
            });
        }
    },

    createInsurance: async (ins) => {
        if (isRealOracle) {
            await query(`
                INSERT INTO insurance (car_id, provider, expiry_date, cost) 
                VALUES (:car_id, :provider, TO_DATE(:expiry_date, 'YYYY-MM-DD'), :cost)
            `, {
                car_id: Number(ins.car_id),
                provider: ins.provider,
                expiry_date: ins.expiry_date,
                cost: Number(ins.cost)
            });
            return true;
        } else {
            const db = readSimulatedDb();
            const nextId = db.insurance.length > 0 ? Math.max(...db.insurance.map(i => i.insurance_id)) + 1 : 1;
            const newIns = {
                insurance_id: nextId,
                car_id: Number(ins.car_id),
                provider: ins.provider,
                cost: Number(ins.cost),
                expiry_date: ins.expiry_date
            };
            db.insurance.push(newIns);
            saveSimulatedDb(db);
            return newIns;
        }
    },

    updateInsurance: async (id, ins) => {
        if (isRealOracle) {
            await query(`
                UPDATE insurance 
                SET car_id = :car_id, provider = :provider, expiry_date = TO_DATE(:expiry_date, 'YYYY-MM-DD'), cost = :cost 
                WHERE insurance_id = :insurance_id
            `, {
                insurance_id: Number(id),
                car_id: Number(ins.car_id),
                provider: ins.provider,
                expiry_date: ins.expiry_date,
                cost: Number(ins.cost)
            });
            return true;
        } else {
            const db = readSimulatedDb();
            const index = db.insurance.findIndex(i => i.insurance_id === Number(id));
            if (index > -1) {
                db.insurance[index] = { ...db.insurance[index], ...ins, cost: Number(ins.cost) };
                saveSimulatedDb(db);
                return db.insurance[index];
            }
            return null;
        }
    },

    deleteInsurance: async (id) => {
        if (isRealOracle) {
            await query(`DELETE FROM insurance WHERE insurance_id = :id`, { id: Number(id) });
            return true;
        } else {
            const db = readSimulatedDb();
            db.insurance = db.insurance.filter(i => i.insurance_id !== Number(id));
            saveSimulatedDb(db);
            return true;
        }
    },

    // === USERS ACCOUNT CONTROL ===
    getUsers: async () => {
        if (isRealOracle) {
            return await query(`SELECT user_id, username, role, TO_CHAR(created_at, 'YYYY-MM-DD') as created_at FROM users ORDER BY user_id`);
        } else {
            return readSimulatedDb().users;
        }
    },

    createUser: async (user) => {
        if (isRealOracle) {
            await query(`
                INSERT INTO users (username, password, role) 
                VALUES (:username, :password, :role)
            `, {
                username: user.username,
                password: user.password,
                role: user.role
            });
            return true;
        } else {
            const db = readSimulatedDb();
            const nextId = db.users.length > 0 ? Math.max(...db.users.map(u => u.user_id)) + 1 : 1;
            const newUser = {
                user_id: nextId,
                username: user.username,
                password: user.password,
                role: user.role,
                created_at: new Date().toISOString().split('T')[0]
            };
            db.users.push(newUser);
            saveSimulatedDb(db);
            return newUser;
        }
    },

    updateUser: async (id, user) => {
        if (isRealOracle) {
            await query(`
                UPDATE users 
                SET password = :password, role = :role 
                WHERE user_id = :user_id
            `, {
                user_id: Number(id),
                password: user.password,
                role: user.role
            });
            return true;
        } else {
            const db = readSimulatedDb();
            const index = db.users.findIndex(u => u.user_id === Number(id));
            if (index > -1) {
                db.users[index] = { ...db.users[index], ...user };
                saveSimulatedDb(db);
                return db.users[index];
            }
            return null;
        }
    },

    deleteUser: async (id) => {
        if (isRealOracle) {
            await query(`DELETE FROM users WHERE user_id = :id`, { id: Number(id) });
            return true;
        } else {
            const db = readSimulatedDb();
            db.users = db.users.filter(u => u.user_id !== Number(id));
            saveSimulatedDb(db);
            return true;
        }
    },

    resetSeeds: () => {
        if (!isRealOracle) {
            saveSimulatedDb(SEED_DATA);
        }
        return true;
    }
};

module.exports = {
    initialize,
    execute: query,
    jsonDb: dataOps,
    isOracle: () => isRealOracle,
    getSeedData: () => SEED_DATA
};
