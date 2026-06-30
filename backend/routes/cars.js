const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/cars
router.get('/', async (req, res) => {
    try {
        const cars = await db.jsonDb.getCars();
        return res.json(cars);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/cars/categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await db.jsonDb.getCategories();
        return res.json(categories);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/cars/:id
router.get('/:id', async (req, res) => {
    try {
        const car = await db.jsonDb.getCarById(req.params.id);
        if (!car) return res.status(404).json({ error: 'Car not found' });
        return res.json(car);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/cars
router.post('/', async (req, res) => {
    const { brand, model, year, category_id, plate_number, daily_rate, status } = req.body;
    if (!brand || !model || !year || !category_id || !plate_number || !daily_rate) {
        return res.status(400).json({ error: 'Missing required vehicle properties' });
    }

    try {
        const cars = await db.jsonDb.getCars();
        const dup = cars.find(c => c.plate_number.toUpperCase() === plate_number.toUpperCase());
        if (dup) return res.status(400).json({ error: 'Plate number unique constraint violation!' });

        if (Number(year) < 2000) return res.status(400).json({ error: 'Year check violation: must be >= 2000' });
        if (Number(daily_rate) <= 0) return res.status(400).json({ error: 'Daily rate check violation: must be > 0' });

        const newCar = {
            category_id: Number(category_id),
            brand,
            model,
            year: Number(year),
            daily_rate: Number(daily_rate),
            status: status || 'AVAILABLE',
            plate_number: plate_number.toUpperCase()
        };

        const result = await db.jsonDb.createCar(newCar);
        return res.json({ success: true, car: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PUT /api/cars/:id
router.put('/:id', async (req, res) => {
    const { brand, model, year, category_id, plate_number, daily_rate, status } = req.body;
    
    try {
        const car = await db.jsonDb.getCarById(req.params.id);
        if (!car) return res.status(404).json({ error: 'Car not found' });

        const cars = await db.jsonDb.getCars();
        const dup = cars.find(c => c.plate_number.toUpperCase() === plate_number.toUpperCase() && c.car_id !== Number(req.params.id));
        if (dup) return res.status(400).json({ error: 'Plate number unique constraint violation!' });

        if (year && Number(year) < 2000) return res.status(400).json({ error: 'Year check violation: must be >= 2000' });
        if (daily_rate && Number(daily_rate) <= 0) return res.status(400).json({ error: 'Daily rate check violation: must be > 0' });

        const updated = {
            brand: brand || car.brand,
            model: model || car.model,
            year: year ? Number(year) : car.year,
            category_id: category_id ? Number(category_id) : car.category_id,
            plate_number: plate_number ? plate_number.toUpperCase() : car.plate_number,
            daily_rate: daily_rate ? Number(daily_rate) : car.daily_rate,
            status: status || car.status
        };

        const result = await db.jsonDb.updateCar(req.params.id, updated);
        return res.json({ success: true, car: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cars/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.jsonDb.deleteCar(req.params.id);
        return res.json({ success: true, message: 'Vehicle deleted from fleet.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
