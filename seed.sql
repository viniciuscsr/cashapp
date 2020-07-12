CREATE TABLE users(
id SERIAL PRIMARY KEY,
name VARCHAR(50),
email VARCHAR(50),
password VARCHAR(200)
);

INSERT INTO users(name, email, password)
VALUES
('user1', 'user1@user.com', 123456);

CREATE TABLE transactions(
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    amount FLOAT(2) NOT NULL
);

CREATE TABLE balance(
    user_id INT PRIMARY KEY,
    balance INT NOT NULL
);

CREATE TABLE add_funds(
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id INT NOT NULL,
    bank_id INT NOT NULL,
    amount INT NOT NULL
);

CREATE TABLE cash_out(
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id INT NOT NULL,
    bank_id INT NOT NULL,
    amount INT NOT NULL
);

INSERT INTO transactions(sender_id, recipient_id, amount)
VALUES
( 3, 2, 300.00);

