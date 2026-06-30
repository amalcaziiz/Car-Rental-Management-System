const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/console/cursors
router.post('/cursors', async (req, res) => {
    try {
        const logs = [];
        logs.push(`-- Opening CURSOR c_cars FOR SELECT * FROM cars`);
        const cars = db.jsonDb.get('cars');
        cars.forEach(car => {
            logs.push(`FETCH c_cars INTO v_car: ${car.brand} - ${car.model} (Daily Rate: $${car.daily_rate})`);
        });
        logs.push(`-- Closing CURSOR c_cars`);
        
        logs.push(`\n-- Running customer FOR loop cursor`);
        const customers = db.jsonDb.get('customers');
        customers.forEach(cust => {
            logs.push(`Customer: ${cust.full_name} | Phone: ${cust.phone}`);
        });
        
        return res.json({ logs });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/console/collections
router.post('/collections', async (req, res) => {
    try {
        const logs = [];
        logs.push(`-- Initializing Associative Array type car_array...`);
        const v_cars = {
            1: 'Toyota',
            2: 'BMW',
            3: 'Nissan'
        };
        logs.push(`v_cars(1) := 'Toyota';`);
        logs.push(`v_cars(2) := 'BMW';`);
        logs.push(`v_cars(3) := 'Nissan';`);
        
        logs.push(`DBMS_OUTPUT: FIRST -> ${Object.keys(v_cars)[0]}`);
        logs.push(`DBMS_OUTPUT: NEXT(1) -> 2`);
        logs.push(`DBMS_OUTPUT: COUNT -> ${Object.keys(v_cars).length}`);

        if (v_cars[2]) {
            logs.push(`DBMS_OUTPUT: EXISTS: BMW found`);
        }

        logs.push(`Deleting index 3...`);
        delete v_cars[3];
        logs.push(`DBMS_OUTPUT: COUNT after delete -> ${Object.keys(v_cars).length}`);

        logs.push(`\n-- Initializing Nested Table type num_table := num_table()...`);
        const v_nums = [100];
        logs.push(`v_nums.EXTEND;`);
        logs.push(`v_nums(1) := 100;`);
        logs.push(`Nested Table Count: ${v_nums.length}`);
        
        return res.json({ logs });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/console/validate-days
router.post('/validate-days', async (req, res) => {
    const { days } = req.body;
    try {
        if (Number(days) <= 0) {
            return res.status(400).json({ 
                error: `ERROR: Invalid rental days. DBMS_OUTPUT: RAISE e_invalid_days;`
            });
        }
        return res.json({ message: `Valid days: ${days}` });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/console/double-booking
router.post('/double-booking', async (req, res) => {
    const { car_id, start_date, end_date } = req.body;
    try {
        const start = new Date(start_date);
        const end = new Date(end_date);
        const rentals = db.jsonDb.get('rentals');
        
        const overlaps = rentals.filter(r => {
            if (r.car_id !== Number(car_id) || r.status !== 'ONGOING') return false;
            const rStart = new Date(r.start_date);
            const rEnd = new Date(r.end_date);
            return !(end < rStart || start > rEnd);
        });

        if (overlaps.length > 0) {
            return res.status(400).json({ 
                error: `RAISE_APPLICATION_ERROR(-20001, 'Car already booked in this period: ${overlaps[0].start_date} to ${overlaps[0].end_date}')`
            });
        }
        return res.json({ message: "Car is available. Overlap check successful." });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
