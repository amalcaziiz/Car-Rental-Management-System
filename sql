CREATE TABLE car_categories (
    category_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR2(50) UNIQUE NOT NULL,
    description VARCHAR2(200)
);

CREATE TABLE users (
    user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR2(50) UNIQUE NOT NULL,
    password VARCHAR2(100) NOT NULL,
    role VARCHAR2(20) CHECK (role IN ('ADMIN','STAFF')) NOT NULL,
    created_at DATE DEFAULT SYSDATE
);

CREATE TABLE customers (
    customer_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR2(100) NOT NULL,
    phone VARCHAR2(20) UNIQUE NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    national_id VARCHAR2(30) UNIQUE NOT NULL,
    created_at DATE DEFAULT SYSDATE
);


CREATE TABLE cars (
    car_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    category_id NUMBER NOT NULL,
    CONSTRAINT fk_car_category
        FOREIGN KEY (category_id)
        REFERENCES car_categories(category_id),

    brand VARCHAR2(50) NOT NULL,
    model VARCHAR2(50) NOT NULL,
    year NUMBER CHECK (year >= 2000),
    daily_rate NUMBER CHECK (daily_rate > 0),

    status VARCHAR2(20) DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE','RENTED','MAINTENANCE')),

    plate_number VARCHAR2(30) UNIQUE NOT NULL
);


CREATE TABLE rentals (
    rental_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    customer_id NUMBER NOT NULL,
    car_id NUMBER NOT NULL,
    user_id NUMBER NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    total_days NUMBER,
    total_cost NUMBER,

    status VARCHAR2(20) DEFAULT 'ONGOING'
        CHECK (status IN ('ONGOING','RETURNED','CANCELLED')),

    CONSTRAINT fk_r_customer FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    CONSTRAINT fk_r_car FOREIGN KEY (car_id)
        REFERENCES cars(car_id),

    CONSTRAINT fk_r_user FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_dates CHECK (end_date > start_date)
);

CREATE TABLE payments (
    payment_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    rental_id NUMBER NOT NULL,
    CONSTRAINT fk_payment_rental
        FOREIGN KEY (rental_id)
        REFERENCES rentals(rental_id),

    amount NUMBER NOT NULL,
    payment_date DATE DEFAULT SYSDATE,

    method VARCHAR2(20)
        CHECK (method IN ('CASH','CARD','MOBILE'))
);

CREATE TABLE maintenance (
    maintenance_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    car_id NUMBER NOT NULL,
    CONSTRAINT fk_maint_car
        FOREIGN KEY (car_id)
        REFERENCES cars(car_id),

    issue_description VARCHAR2(200),
    cost NUMBER DEFAULT 0,

    status VARCHAR2(20)
        CHECK (status IN ('PENDING','DONE')),

    maintenance_date DATE DEFAULT SYSDATE
);

CREATE TABLE insurance (
    insurance_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    car_id NUMBER NOT NULL,
    CONSTRAINT fk_ins_car
        FOREIGN KEY (car_id)
        REFERENCES cars(car_id),

    provider VARCHAR2(100),
    expiry_date DATE,
    cost NUMBER
);

CREATE TABLE rental_audit (
    audit_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rental_id NUMBER,
    action VARCHAR2(50) NOT NULL,
    action_date DATE DEFAULT SYSDATE,

    CONSTRAINT chk_action
        CHECK (action IN ('RENTAL CREATED', 'RENTAL RETURNED'))
);

-- ============================================================
-- Name: trg_no_double_booking
-- Purpose: Prevents overlapping active rentals for same car
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Notes: Strong business rule (date-based validation)
-- ============================================================

CREATE OR REPLACE TRIGGER trg_no_double_booking
BEFORE INSERT ON rentals
FOR EACH ROW
DECLARE
    v_count NUMBER;
BEGIN

    SELECT COUNT(*)
    INTO v_count
    FROM rentals
    WHERE car_id = :NEW.car_id
      AND status = 'ONGOING'
      AND NOT (
            :NEW.end_date < start_date
            OR :NEW.start_date > end_date
      );

    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Car already booked in this period');
    END IF;

END;
/
-- ============================================================
-- Name: trg_rental_audit
-- Purpose: Logs every rental into audit table
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Notes: AFTER INSERT trigger for auditing
-- ============================================================

CREATE OR REPLACE TRIGGER trg_rental_audit
AFTER INSERT ON rentals
FOR EACH ROW
BEGIN

    INSERT INTO rental_audit (
        rental_id,
        action,
        action_date
    )
    VALUES (
        :NEW.rental_id,
        'RENTAL CREATED',
        SYSDATE
    );

END;
/


INSERT INTO car_categories (category_name, description) VALUES ('SUV', 'Sport Utility Vehicle');
INSERT INTO car_categories VALUES (DEFAULT, 'Sedan', 'Comfort family car');
INSERT INTO car_categories VALUES (DEFAULT, 'Hatchback', 'Small city car');
INSERT INTO car_categories VALUES (DEFAULT, 'Truck', 'Heavy load vehicle');
INSERT INTO car_categories VALUES (DEFAULT, 'Luxury', 'High-end premium cars');
INSERT INTO car_categories VALUES (DEFAULT, 'Sports', 'High performance cars');
INSERT INTO car_categories VALUES (DEFAULT, 'Van', 'Passenger transport');
INSERT INTO car_categories VALUES (DEFAULT, 'Electric', 'EV cars');
INSERT INTO car_categories VALUES (DEFAULT, 'Hybrid', 'Fuel-efficient cars');
INSERT INTO car_categories VALUES (DEFAULT, 'Offroad', 'Rough terrain cars');

INSERT INTO users (username, password, role) VALUES ('admin1', '1234', 'ADMIN');
INSERT INTO users VALUES (DEFAULT, 'staff1', '1234', 'STAFF', SYSDATE);
INSERT INTO users VALUES (DEFAULT, 'staff2', '1234', 'STAFF', SYSDATE);
INSERT INTO users VALUES (DEFAULT, 'staff3', '1234', 'STAFF', SYSDATE);
INSERT INTO users VALUES (DEFAULT, 'staff4', '1234', 'STAFF', SYSDATE);
INSERT INTO users VALUES (DEFAULT, 'staff5', '1234', 'STAFF', SYSDATE);
INSERT INTO users VALUES (DEFAULT, 'staff6', '1234', 'STAFF', SYSDATE);
INSERT INTO users VALUES (DEFAULT, 'staff7', '1234', 'STAFF', SYSDATE);
INSERT INTO users VALUES (DEFAULT, 'staff8', '1234', 'STAFF', SYSDATE);
INSERT INTO users VALUES (DEFAULT, 'staff9', '1234', 'STAFF', SYSDATE);


INSERT INTO customers VALUES (DEFAULT, 'Ali Hassan', '617000001', 'ali@gmail.com', 'ID001', SYSDATE);
INSERT INTO customers VALUES (DEFAULT, 'Asha Noor', '617000002', 'asha@gmail.com', 'ID002', SYSDATE);
INSERT INTO customers VALUES (DEFAULT, 'Omar Ali', '617000003', 'omar@gmail.com', 'ID003', SYSDATE);
INSERT INTO customers VALUES (DEFAULT, 'Fatima Yusuf', '617000004', 'fatima@gmail.com', 'ID004', SYSDATE);
INSERT INTO customers VALUES (DEFAULT, 'Hassan Jama', '617000005', 'hassan@gmail.com', 'ID005', SYSDATE);
INSERT INTO customers VALUES (DEFAULT, 'Maryan Abdi', '617000006', 'maryan@gmail.com', 'ID006', SYSDATE);
INSERT INTO customers VALUES (DEFAULT, 'Ahmed Farah', '617000007', 'ahmed@gmail.com', 'ID007', SYSDATE);
INSERT INTO customers VALUES (DEFAULT, 'Hodan Ali', '617000008', 'hodan@gmail.com', 'ID008', SYSDATE);
INSERT INTO customers VALUES (DEFAULT, 'Ismail Noor', '617000009', 'ismail@gmail.com', 'ID009', SYSDATE);
INSERT INTO customers VALUES (DEFAULT, 'Zahra Mohamed', '617000010', 'zahra@gmail.com', 'ID010', SYSDATE);

INSERT INTO cars VALUES (DEFAULT, 1, 'Toyota', 'RAV4', 2022, 50, 'AVAILABLE', 'AA001');
INSERT INTO cars VALUES (DEFAULT, 2, 'Toyota', 'Corolla', 2021, 30, 'AVAILABLE', 'AA002');
INSERT INTO cars VALUES (DEFAULT, 3, 'Honda', 'Fit', 2020, 25, 'AVAILABLE', 'AA003');
INSERT INTO cars VALUES (DEFAULT, 4, 'Ford', 'Ranger', 2023, 70, 'AVAILABLE', 'AA004');
INSERT INTO cars VALUES (DEFAULT, 5, 'BMW', 'X5', 2023, 120, 'AVAILABLE', 'AA005');
INSERT INTO cars VALUES (DEFAULT, 6, 'Nissan', 'GTR', 2022, 150, 'AVAILABLE', 'AA006');
INSERT INTO cars VALUES (DEFAULT, 7, 'Mercedes', 'Vito', 2021, 80, 'AVAILABLE', 'AA007');
INSERT INTO cars VALUES (DEFAULT, 8, 'Tesla', 'Model 3', 2023, 100, 'AVAILABLE', 'AA008');
INSERT INTO cars VALUES (DEFAULT, 9, 'Toyota', 'Prius', 2020, 60, 'AVAILABLE', 'AA009');
INSERT INTO cars VALUES (DEFAULT, 10, 'Jeep', 'Wrangler', 2022, 90, 'AVAILABLE', 'AA010');

INSERT INTO rentals VALUES (DEFAULT, 1, 1, 1, SYSDATE, SYSDATE+3, 3, 150, 'RETURNED');
INSERT INTO rentals VALUES (DEFAULT, 2, 2, 1, SYSDATE, SYSDATE+2, 2, 60, 'RETURNED');
INSERT INTO rentals VALUES (DEFAULT, 3, 3, 1, SYSDATE, SYSDATE+5, 5, 125, 'RETURNED');
INSERT INTO rentals VALUES (DEFAULT, 4, 4, 1, SYSDATE, SYSDATE+1, 1, 70, 'RETURNED');
INSERT INTO rentals VALUES (DEFAULT, 5, 5, 1, SYSDATE, SYSDATE+4, 4, 480, 'ONGOING');
INSERT INTO rentals VALUES (DEFAULT, 6, 6, 1, SYSDATE, SYSDATE+2, 2, 300, 'RETURNED');
INSERT INTO rentals VALUES (DEFAULT, 7, 7, 1, SYSDATE, SYSDATE+3, 3, 240, 'RETURNED');
INSERT INTO rentals VALUES (DEFAULT, 8, 8, 1, SYSDATE, SYSDATE+6, 6, 600, 'ONGOING');
INSERT INTO rentals VALUES (DEFAULT, 9, 9, 1, SYSDATE, SYSDATE+2, 2, 120, 'RETURNED');
INSERT INTO rentals VALUES (DEFAULT, 10, 10, 1, SYSDATE, SYSDATE+7, 7, 630, 'ONGOING');

INSERT INTO payments VALUES (DEFAULT, 1, 150, SYSDATE, 'CASH');
INSERT INTO payments VALUES (DEFAULT, 2, 60, SYSDATE, 'CARD');
INSERT INTO payments VALUES (DEFAULT, 3, 125, SYSDATE, 'MOBILE');
INSERT INTO payments VALUES (DEFAULT, 4, 70, SYSDATE, 'CASH');
INSERT INTO payments VALUES (DEFAULT, 5, 480, SYSDATE, 'CARD');
INSERT INTO payments VALUES (DEFAULT, 6, 300, SYSDATE, 'CASH');
INSERT INTO payments VALUES (DEFAULT, 7, 240, SYSDATE, 'MOBILE');
INSERT INTO payments VALUES (DEFAULT, 8, 600, SYSDATE, 'CARD');
INSERT INTO payments VALUES (DEFAULT, 9, 120, SYSDATE, 'CASH');
INSERT INTO payments VALUES (DEFAULT, 10, 630, SYSDATE, 'CARD');

INSERT INTO maintenance VALUES (DEFAULT, 1, 'Oil change', 20, 'DONE', SYSDATE);
INSERT INTO maintenance VALUES (DEFAULT, 2, 'Brake check', 40, 'DONE', SYSDATE);
INSERT INTO maintenance VALUES (DEFAULT, 3, 'Engine tune', 100, 'PENDING', SYSDATE);
INSERT INTO maintenance VALUES (DEFAULT, 4, 'Tire replacement', 200, 'DONE', SYSDATE);
INSERT INTO maintenance VALUES (DEFAULT, 5, 'Battery check', 50, 'PENDING', SYSDATE);
INSERT INTO maintenance VALUES (DEFAULT, 6, 'AC repair', 80, 'DONE', SYSDATE);
INSERT INTO maintenance VALUES (DEFAULT, 7, 'Transmission fix', 300, 'PENDING', SYSDATE);
INSERT INTO maintenance VALUES (DEFAULT, 8, 'Wash & service', 30, 'DONE', SYSDATE);
INSERT INTO maintenance VALUES (DEFAULT, 9, 'General check', 25, 'DONE', SYSDATE);
INSERT INTO maintenance VALUES (DEFAULT, 10, 'Engine oil leak fix', 150, 'PENDING', SYSDATE);

INSERT INTO insurance VALUES (DEFAULT, 1, 'AXA', SYSDATE+365, 200);
INSERT INTO insurance VALUES (DEFAULT, 2, 'AXA', SYSDATE+365, 180);
INSERT INTO insurance VALUES (DEFAULT, 3, 'Allianz', SYSDATE+365, 220);
INSERT INTO insurance VALUES (DEFAULT, 4, 'AXA', SYSDATE+365, 250);
INSERT INTO insurance VALUES (DEFAULT, 5, 'Allianz', SYSDATE+365, 300);
INSERT INTO insurance VALUES (DEFAULT, 6, 'AXA', SYSDATE+365, 280);
INSERT INTO insurance VALUES (DEFAULT, 7, 'AXA', SYSDATE+365, 150);
INSERT INTO insurance VALUES (DEFAULT, 8, 'Tesla Insurance', SYSDATE+365, 400);
INSERT INTO insurance VALUES (DEFAULT, 9, 'AXA', SYSDATE+365, 160);
INSERT INTO insurance VALUES (DEFAULT, 10, 'Allianz', SYSDATE+365, 210);
COMMIT;











-- ============================================================
-- Name: create_rental
-- Purpose: Creates a new rental transaction and returns rental ID
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Params:
--   p_customer_id IN NUMBER - customer ID
--   p_car_id IN NUMBER - car ID
--   p_user_id IN NUMBER - staff ID
--   p_days IN NUMBER - rental duration
--   p_rental_id OUT NUMBER - generated rental ID
-- Notes: Calculates total cost using daily rate
-- ============================================================

CREATE OR REPLACE PROCEDURE create_rental (
    p_customer_id IN NUMBER,
    p_car_id IN NUMBER,
    p_user_id IN NUMBER,
    p_days IN NUMBER,
    p_rental_id OUT NUMBER
) IS
    v_rate NUMBER;
    v_cost NUMBER;
BEGIN

    -- get car rate
    SELECT daily_rate
    INTO v_rate
    FROM cars
    WHERE car_id = p_car_id;

    -- compute cost
    v_cost := p_days * v_rate;

    -- insert rental
    INSERT INTO rentals (
        customer_id,
        car_id,
        user_id,
        start_date,
        end_date,
        total_days,
        total_cost,
        status
    )
    VALUES (
        p_customer_id,
        p_car_id,
        p_user_id,
        SYSDATE,
        SYSDATE + p_days,
        p_days,
        v_cost,
        'ONGOING'
    )
    RETURNING rental_id INTO p_rental_id;
    UPDATE cars
SET status = 'RENTED'
WHERE car_id = p_car_id;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20001,'Car not found');

    WHEN TOO_MANY_ROWS THEN
        RAISE_APPLICATION_ERROR(-20011,'Too many cars found');

    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20002,SQLERRM);
END;
/

-- ============================================================
-- Name: return_car
-- Purpose: Updates rental status and returns updated rental ID
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Params:
--   p_rental_id IN OUT NUMBER - rental ID
-- Notes: Demonstrates IN OUT parameter usage
-- ============================================================

CREATE OR REPLACE PROCEDURE return_car (
    p_rental_id IN OUT NUMBER
) IS
    v_count NUMBER;
BEGIN

    UPDATE rentals
    SET status = 'RETURNED'
    WHERE rental_id = p_rental_id;
    v_count := SQL%ROWCOUNT;
    UPDATE cars
SET status = 'AVAILABLE'
WHERE car_id = (
    SELECT car_id
    FROM rentals
    WHERE rental_id = p_rental_id
);

   

    IF v_count = 0 THEN
        RAISE NO_DATA_FOUND;
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20003, 'Rental not found');
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20004, SQLERRM);
END;
/

-- ============================================================
-- Name: safe_rental
-- Purpose: Wrapper procedure that safely creates rental
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Params:
--   p_customer_id IN NUMBER
--   p_car_id IN NUMBER
--   p_user_id IN NUMBER
--   p_days IN NUMBER
--   p_rental_id OUT NUMBER
-- Notes: Calls create_rental procedure internally
-- ============================================================

CREATE OR REPLACE PROCEDURE safe_rental (
    p_customer_id IN NUMBER,
    p_car_id IN NUMBER,
    p_user_id IN NUMBER,
    p_days IN NUMBER,
    p_rental_id OUT NUMBER
) IS
BEGIN

    -- calling another procedure (REQUIRED RULE)
    create_rental(
        p_customer_id,
        p_car_id,
        p_user_id,
        p_days,
        p_rental_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20005, 'Safe rental failed: ' || SQLERRM);
END;
/
-- ============================================================
-- Name: validate_rental_days
-- Purpose: Validates rental days using user-defined exception
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Params: p_days IN NUMBER - rental days input
-- Notes: Demonstrates user-defined exception (REQUIRED)
-- ============================================================

CREATE OR REPLACE PROCEDURE validate_rental_days (
    p_days IN NUMBER
) IS

    e_invalid_days EXCEPTION;

BEGIN

    IF p_days <= 0 THEN
        RAISE e_invalid_days;
    END IF;

    DBMS_OUTPUT.PUT_LINE('Valid days: ' || p_days);

EXCEPTION
    WHEN e_invalid_days THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: Invalid rental days');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE(SQLERRM);
END;
/



-- ============================================================
-- Name: calc_cost
-- Purpose: Calculates rental cost with discount rule
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Params:
--   p_days IN NUMBER
--   p_rate IN NUMBER
-- Returns: NUMBER
-- Notes: Applies 5% discount for long rentals
-- ============================================================

CREATE OR REPLACE FUNCTION calc_cost (
    p_days NUMBER,
    p_rate NUMBER
) RETURN NUMBER IS

    v_total NUMBER;

BEGIN

    v_total := p_days * p_rate;

    -- business rule: discount
    IF p_days >= 7 THEN
        v_total := v_total * 0.95;
    END IF;

    RETURN v_total;

EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
/

-- ============================================================
-- Name: is_available
-- Purpose: Checks if a car is available for rental
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Params:
--   p_car_id IN NUMBER - car ID
-- Returns: NUMBER (1 = available, 0 = not available)
-- Notes: Uses rental table for business rule check
-- ============================================================

CREATE OR REPLACE FUNCTION is_available (
    p_car_id NUMBER
) RETURN NUMBER IS

    v_count NUMBER;

BEGIN

    SELECT COUNT(*)
    INTO v_count
    FROM rentals
    WHERE car_id = p_car_id
    AND status = 'ONGOING';

    IF v_count > 0 THEN
        RETURN 0;
    ELSE
        RETURN 1;
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 1;
    WHEN OTHERS THEN
        RETURN 0;
END;
/


-- ============================================================
-- Name: rental_pkg
-- Purpose: Groups all rental-related operations
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Notes: Contains procedures and functions for rental system
-- ============================================================

CREATE OR REPLACE PACKAGE rental_pkg AS

    PROCEDURE create_rental_pkg(
        p_customer_id IN NUMBER,
        p_car_id IN NUMBER,
        p_user_id IN NUMBER,
        p_days IN NUMBER,
        p_rental_id OUT NUMBER
    );

    PROCEDURE return_car_pkg(
        p_rental_id IN OUT NUMBER
    );

    FUNCTION calc_cost_pkg(
        p_days NUMBER,
        p_rate NUMBER
    ) RETURN NUMBER;

END rental_pkg;
/


CREATE OR REPLACE PACKAGE BODY rental_pkg AS

-- ============================================================
-- Name: create_rental_pkg
-- Purpose: Wrapper for create_rental procedure
-- ============================================================
PROCEDURE create_rental_pkg(
    p_customer_id IN NUMBER,
    p_car_id IN NUMBER,
    p_user_id IN NUMBER,
    p_days IN NUMBER,
    p_rental_id OUT NUMBER
) IS
BEGIN
    create_rental(
        p_customer_id,
        p_car_id,
        p_user_id,
        p_days,
        p_rental_id
    );
END;

-- ============================================================
-- Name: return_car_pkg
-- Purpose: Wrapper for return_car procedure
-- ============================================================
PROCEDURE return_car_pkg(
    p_rental_id IN OUT NUMBER
) IS
BEGIN
    return_car(p_rental_id);
END;

-- ============================================================
-- Name: calc_cost_pkg
-- Purpose: Wrapper for calc_cost function
-- ============================================================
FUNCTION calc_cost_pkg(
    p_days NUMBER,
    p_rate NUMBER
) RETURN NUMBER IS
BEGIN
    RETURN calc_cost(p_days, p_rate);
END;

END;
/



-- ============================================================
-- Name: car_cursor_report
-- Purpose: Displays all cars using explicit cursor
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- Notes: Demonstrates OPEN, FETCH, CLOSE cursor
-- ============================================================

DECLARE
    CURSOR c_cars IS SELECT * FROM cars;
    v_car cars%ROWTYPE;
BEGIN

    OPEN c_cars;

    LOOP
        FETCH c_cars INTO v_car;
        EXIT WHEN c_cars%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(v_car.brand || ' - ' || v_car.model);
    END LOOP;

    CLOSE c_cars;

END;
/

-- ============================================================
-- Name: customer_cursor_loop
-- Purpose: Displays customers using cursor FOR loop
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- ============================================================

BEGIN

    FOR c IN (SELECT * FROM customers) LOOP
        DBMS_OUTPUT.PUT_LINE(c.full_name || ' - ' || c.phone);
    END LOOP;

END;
/

-- ============================================================
-- Name: record_demo
-- Purpose: Demonstrates %ROWTYPE and user-defined record
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- ============================================================

DECLARE

    -- %ROWTYPE record
    v_car cars%ROWTYPE;

    -- user-defined record
    TYPE rental_rec IS RECORD (
        rental_id NUMBER,
        total_cost NUMBER
    );

    v_rental rental_rec;

BEGIN

    SELECT * INTO v_car FROM cars WHERE car_id = 1;
    DBMS_OUTPUT.PUT_LINE('Car: ' || v_car.brand);

    SELECT rental_id, total_cost
    INTO v_rental
    FROM rentals
    WHERE rental_id = 1;

    DBMS_OUTPUT.PUT_LINE('Cost: ' || v_rental.total_cost);

END;
/


-- ============================================================
-- Name: collection_demo
-- Purpose: Demonstrates associative array + nested table
--         and required collection methods
-- Author: Amal Bashir Abdi
-- Date: 28-JUN-2026
-- ============================================================

DECLARE

    -- ASSOCIATIVE ARRAY
    TYPE car_array IS TABLE OF VARCHAR2(50) INDEX BY PLS_INTEGER;
    v_cars car_array;

    -- NESTED TABLE
    TYPE num_table IS TABLE OF NUMBER;
    v_nums num_table := num_table();

BEGIN

    -- fill associative array
    v_cars(1) := 'Toyota';
    v_cars(2) := 'BMW';
    v_cars(3) := 'Nissan';

    -- collection methods
    DBMS_OUTPUT.PUT_LINE('FIRST: ' || v_cars.FIRST);
    DBMS_OUTPUT.PUT_LINE('NEXT: ' || v_cars.NEXT(1));
    DBMS_OUTPUT.PUT_LINE('COUNT: ' || v_cars.COUNT);

    IF v_cars.EXISTS(2) THEN
        DBMS_OUTPUT.PUT_LINE('EXISTS: BMW found');
    END IF;

    v_cars.DELETE(3);

    -- nested table usage
    v_nums.EXTEND;
    v_nums(1) := 100;

    DBMS_OUTPUT.PUT_LINE('Nested Table Count: ' || v_nums.COUNT);

END;
/

