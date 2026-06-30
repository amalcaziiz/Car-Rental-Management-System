require('dotenv').config();
const db = require('./db');
const oracledb = require('oracledb');

const TABLES = [
    {
        name: 'CAR_CATEGORIES',
        sql: `CREATE TABLE car_categories (
            category_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            category_name VARCHAR2(50) UNIQUE NOT NULL,
            description VARCHAR2(200)
        )`
    },
    {
        name: 'USERS',
        sql: `CREATE TABLE users (
            user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            username VARCHAR2(50) UNIQUE NOT NULL,
            password VARCHAR2(100) NOT NULL,
            role VARCHAR2(20) CHECK (role IN ('ADMIN','STAFF')) NOT NULL,
            created_at DATE DEFAULT SYSDATE
        )`
    },
    {
        name: 'CUSTOMERS',
        sql: `CREATE TABLE customers (
            customer_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            full_name VARCHAR2(100) NOT NULL,
            phone VARCHAR2(20) UNIQUE NOT NULL,
            email VARCHAR2(100) UNIQUE NOT NULL,
            national_id VARCHAR2(30) UNIQUE NOT NULL,
            created_at DATE DEFAULT SYSDATE
        )`
    },
    {
        name: 'CARS',
        sql: `CREATE TABLE cars (
            car_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            category_id NUMBER NOT NULL,
            brand VARCHAR2(50) NOT NULL,
            model VARCHAR2(50) NOT NULL,
            year NUMBER CHECK (year >= 2000),
            daily_rate NUMBER CHECK (daily_rate > 0),
            status VARCHAR2(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','RENTED','MAINTENANCE')),
            plate_number VARCHAR2(30) UNIQUE NOT NULL,
            CONSTRAINT fk_car_category FOREIGN KEY (category_id) REFERENCES car_categories(category_id)
        )`
    },
    {
        name: 'RENTALS',
        sql: `CREATE TABLE rentals (
            rental_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            customer_id NUMBER NOT NULL,
            car_id NUMBER NOT NULL,
            user_id NUMBER NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            total_days NUMBER,
            total_cost NUMBER,
            status VARCHAR2(20) DEFAULT 'ONGOING' CHECK (status IN ('ONGOING','RETURNED','CANCELLED')),
            CONSTRAINT fk_rental_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
            CONSTRAINT fk_rental_car FOREIGN KEY (car_id) REFERENCES cars(car_id),
            CONSTRAINT fk_rental_user FOREIGN KEY (user_id) REFERENCES users(user_id),
            CONSTRAINT chk_dates CHECK (end_date > start_date)
        )`
    },
    {
        name: 'PAYMENTS',
        sql: `CREATE TABLE payments (
            payment_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            rental_id NUMBER NOT NULL,
            amount NUMBER NOT NULL,
            payment_date DATE DEFAULT SYSDATE,
            method VARCHAR2(20) CHECK (method IN ('CASH','CARD','MOBILE')) NOT NULL,
            CONSTRAINT fk_payment_rental FOREIGN KEY (rental_id) REFERENCES rentals(rental_id)
        )`
    },
    {
        name: 'MAINTENANCE',
        sql: `CREATE TABLE maintenance (
            maintenance_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            car_id NUMBER NOT NULL,
            issue_description VARCHAR2(200) NOT NULL,
            cost NUMBER CHECK (cost >= 0),
            maintenance_date DATE DEFAULT SYSDATE,
            status VARCHAR2(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','DONE')),
            CONSTRAINT fk_maint_car FOREIGN KEY (car_id) REFERENCES cars(car_id)
        )`
    },
    {
        name: 'INSURANCE',
        sql: `CREATE TABLE insurance (
            insurance_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            car_id NUMBER NOT NULL,
            provider VARCHAR2(100) NOT NULL,
            expiry_date DATE NOT NULL,
            cost NUMBER CHECK (cost >= 0),
            CONSTRAINT fk_insurance_car FOREIGN KEY (car_id) REFERENCES cars(car_id)
        )`
    },
    {
        name: 'RENTAL_AUDIT',
        sql: `CREATE TABLE rental_audit (
            audit_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            rental_id NUMBER NOT NULL,
            action VARCHAR2(50) NOT NULL,
            action_date DATE DEFAULT SYSDATE,
            CONSTRAINT fk_audit_rental FOREIGN KEY (rental_id) REFERENCES rentals(rental_id) ON DELETE CASCADE
        )`
    }
];

const PROCEDURES = [
    {
        name: 'TRG_NO_DOUBLE_BOOKING',
        sql: `CREATE OR REPLACE TRIGGER trg_no_double_booking
        BEFORE INSERT ON rentals
        FOR EACH ROW
        DECLARE
            v_count NUMBER;
        BEGIN
            SELECT COUNT(*) INTO v_count
            FROM rentals
            WHERE car_id = :NEW.car_id
              AND status = 'ONGOING'
              AND NOT (:NEW.end_date < start_date OR :NEW.start_date > end_date);
            
            IF v_count > 0 THEN
                RAISE_APPLICATION_ERROR(-20001, 'Car already booked in this period');
            END IF;
        END;`
    },
    {
        name: 'TRG_RENTAL_AUDIT',
        sql: `CREATE OR REPLACE TRIGGER trg_rental_audit
        AFTER INSERT OR UPDATE ON rentals
        FOR EACH ROW
        BEGIN
            IF INSERTING THEN
                INSERT INTO rental_audit (rental_id, action) VALUES (:NEW.rental_id, 'RENTAL CREATED');
            ELSIF UPDATING AND :NEW.status = 'RETURNED' AND :OLD.status = 'ONGOING' THEN
                INSERT INTO rental_audit (rental_id, action) VALUES (:NEW.rental_id, 'RENTAL RETURNED');
            END IF;
        END;`
    },
    {
        name: 'CALC_COST',
        sql: `CREATE OR REPLACE FUNCTION calc_cost(p_days NUMBER, p_rate NUMBER) RETURN NUMBER IS
        BEGIN
            IF p_days >= 7 THEN
                RETURN p_days * p_rate * 0.95;
            ELSE
                RETURN p_days * p_rate;
            END IF;
        END;`
    },
    {
        name: 'SAFE_RENTAL',
        sql: `CREATE OR REPLACE PROCEDURE safe_rental(
            p_customer_id IN NUMBER,
            p_car_id IN NUMBER,
            p_user_id IN NUMBER,
            p_days IN NUMBER,
            p_rental_id OUT NUMBER
        ) IS
            v_rate NUMBER;
            v_cost NUMBER;
        BEGIN
            SELECT daily_rate INTO v_rate FROM cars WHERE car_id = p_car_id;
            v_cost := calc_cost(p_days, v_rate);
            
            INSERT INTO rentals (customer_id, car_id, user_id, start_date, end_date, total_days, total_cost, status)
            VALUES (p_customer_id, p_car_id, p_user_id, SYSDATE, SYSDATE + p_days, p_days, v_cost, 'ONGOING')
            RETURNING rental_id INTO p_rental_id;
            
            UPDATE cars SET status = 'RENTED' WHERE car_id = p_car_id;
            
            INSERT INTO payments (rental_id, amount, method)
            VALUES (p_rental_id, v_cost, 'CARD');
        END;`
    },
    {
        name: 'RETURN_CAR',
        sql: `CREATE OR REPLACE PROCEDURE return_car(p_rental_id IN OUT NUMBER) IS
            v_car_id NUMBER;
        BEGIN
            SELECT car_id INTO v_car_id FROM rentals WHERE rental_id = p_rental_id;
            UPDATE rentals SET status = 'RETURNED' WHERE rental_id = p_rental_id;
            UPDATE cars SET status = 'AVAILABLE' WHERE car_id = v_car_id;
        END;`
    }
];

async function setup() {
    try {
        await db.initialize();
        if (!db.isOracle()) {
            console.log("Not in Oracle mode. Skipping schema setup.");
            return;
        }

        // Get currently existing tables
        const existingRes = await db.execute("SELECT table_name FROM user_tables");
        const existingTables = existingRes.map(t => t.table_name.toUpperCase());

        console.log("Current existing tables:", existingTables);

        // 1. Create Tables
        for (const tbl of TABLES) {
            if (!existingTables.includes(tbl.name)) {
                console.log(`Creating table ${tbl.name}...`);
                await db.execute(tbl.sql);
                console.log(`Table ${tbl.name} created successfully.`);
            } else {
                console.log(`Table ${tbl.name} already exists. Skipping.`);
            }
        }

        // 2. Create PL/SQL Triggers/Functions/Procedures
        for (const proc of PROCEDURES) {
            console.log(`Creating/Replacing PL/SQL component: ${proc.name}...`);
            await db.execute(proc.sql);
            console.log(`Component ${proc.name} successfully deployed.`);
        }

        // 3. Seed Initial Seed Data if CAR_CATEGORIES is empty
        const countCategories = await db.execute("SELECT COUNT(*) as c FROM car_categories");
        if (countCategories[0].c === 0) {
            console.log("Seeding initial categories data...");
            const seeds = db.getSeedData();
            
            for (const cat of seeds.car_categories) {
                await db.execute(`INSERT INTO car_categories (category_name, description) VALUES (:c_name, :c_desc)`, {
                    c_name: cat.category_name,
                    c_desc: cat.description
                });
            }

            console.log("Seeding initial users...");
            for (const u of seeds.users) {
                await db.execute(`INSERT INTO users (username, password, role) VALUES (:u_name, :u_pass, :u_role)`, {
                    u_name: u.username,
                    u_pass: u.password,
                    u_role: u.role
                });
            }

            console.log("Seeding initial customers...");
            for (const cust of seeds.customers) {
                await db.execute(`INSERT INTO customers (full_name, phone, email, national_id) VALUES (:cust_name, :cust_phone, :cust_email, :cust_nid)`, {
                    cust_name: cust.full_name,
                    cust_phone: cust.phone,
                    cust_email: cust.email,
                    cust_nid: cust.national_id
                });
            }

            console.log("Seeding initial cars...");
            for (const car of seeds.cars) {
                await db.execute(`INSERT INTO cars (category_id, brand, model, year, daily_rate, status, plate_number) VALUES (:car_cat, :car_brand, :car_model, :car_year, :car_rate, :car_status, :car_plate)`, {
                    car_cat: car.category_id,
                    car_brand: car.brand,
                    car_model: car.model,
                    car_year: car.year,
                    car_rate: car.daily_rate,
                    car_status: car.status,
                    car_plate: car.plate_number
                });
            }

            console.log("Seeding initial rentals...");
            for (const rent of seeds.rentals) {
                await db.execute(`
                    INSERT INTO rentals (customer_id, car_id, user_id, start_date, end_date, total_days, total_cost, status)
                    VALUES (:r_cust, :r_car, :r_usr, TO_DATE(:r_start, 'YYYY-MM-DD'), TO_DATE(:r_end, 'YYYY-MM-DD'), :r_days, :r_cost, :r_status)
                `, {
                    r_cust: rent.customer_id,
                    r_car: rent.car_id,
                    r_usr: rent.user_id,
                    r_start: rent.start_date,
                    r_end: rent.end_date,
                    r_days: rent.total_days,
                    r_cost: rent.total_cost,
                    r_status: rent.status
                });
            }

            console.log("Seeding initial payments...");
            for (const p of seeds.payments) {
                await db.execute(`
                    INSERT INTO payments (rental_id, amount, payment_date, method)
                    VALUES (:p_rent, :p_amt, TO_DATE(:p_date, 'YYYY-MM-DD'), :p_meth)
                `, {
                    p_rent: p.rental_id,
                    p_amt: p.amount,
                    p_date: p.payment_date,
                    p_meth: p.method
                });
            }

            console.log("Seeding initial maintenance...");
            for (const m of seeds.maintenance) {
                await db.execute(`
                    INSERT INTO maintenance (car_id, issue_description, cost, maintenance_date, status)
                    VALUES (:m_car, :m_desc, :m_cost, TO_DATE(:m_date, 'YYYY-MM-DD'), :m_status)
                `, {
                    m_car: m.car_id,
                    m_desc: m.issue_description,
                    m_cost: m.cost,
                    m_date: m.maintenance_date,
                    m_status: m.status
                });
            }

            console.log("Syncing seeded cars status with pending maintenance logs...");
            await db.execute(`
                UPDATE cars 
                SET status = 'MAINTENANCE' 
                WHERE car_id IN (SELECT car_id FROM maintenance WHERE status = 'PENDING')
            `);

            console.log("Seeding initial insurance...");
            for (const ins of seeds.insurance) {
                await db.execute(`
                    INSERT INTO insurance (car_id, provider, expiry_date, cost)
                    VALUES (:i_car, :i_prov, TO_DATE(:i_edate, 'YYYY-MM-DD'), :i_cost)
                `, {
                    i_car: ins.car_id,
                    i_prov: ins.provider,
                    i_edate: ins.expiry_date,
                    i_cost: ins.cost
                });
            }

            console.log("Seeding initial audits...");
            for (const a of seeds.rental_audit) {
                await db.execute(`
                    INSERT INTO rental_audit (rental_id, action, action_date)
                    VALUES (:a_rent, :a_act, TO_DATE(:a_date, 'YYYY-MM-DD'))
                `, {
                    a_rent: a.rental_id,
                    a_act: a.action,
                    a_date: a.action_date
                });
            }

            console.log("🟢 All seeds successfully loaded into Oracle Database tables!");
        } else {
            console.log("ℹ️ Tables already contain data. Skipping seeds loader.");
        }

        console.log("🎉 Oracle Database schema initialization complete!");
    } catch (e) {
        console.error("🔴 Schema initialization failed:", e.message);
    } finally {
        process.exit();
    }
}

setup();
