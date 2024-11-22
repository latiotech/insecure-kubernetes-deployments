const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("sqlite::memory:");

// Define User model
const User = sequelize.define("User", {
  username: DataTypes.STRING,
  email: DataTypes.STRING,
  target: DataTypes.JSON
});

// Define Password model
const Password = sequelize.define("Password", {
  userId: DataTypes.INTEGER,
  hashedPassword: DataTypes.STRING
});

// Define Order model
const Order = sequelize.define("Order", {
  orderNumber: DataTypes.INTEGER,
  userId: DataTypes.INTEGER, // Foreign key to associate with User
  product: DataTypes.STRING,
  amount: DataTypes.FLOAT,
  status: DataTypes.STRING
});

async function init() {
  await sequelize.sync({ force: true });
  
  // Create users
  const users = await User.bulkCreate([
    { username: "admin", email: "admin@example.com", target: { admin: 1 } },
    { username: "user1", email: "user1@example.com", target: { user1: 1 } },
    { username: "user2", email: "user2@example.com", target: { user2: 1 } }
  ]);

  // Create passwords
  await Password.bulkCreate([
    { userId: users[0].id, hashedPassword: "hashed_admin_password" },
    { userId: users[1].id, hashedPassword: "hashed_user1_password" },
    { userId: users[2].id, hashedPassword: "hashed_user2_password" }
  ]);

  // Create orders
  await Order.bulkCreate([
    { orderNumber: 1001, userId: users[0].id, product: "Laptop", amount: 1500.00, status: "Shipped" },
    { orderNumber: 1002, userId: users[1].id, product: "Phone", amount: 800.00, status: "Pending" },
    { orderNumber: 1003, userId: users[2].id, product: "Tablet", amount: 400.00, status: "Delivered" }
  ]);

  console.log("Database initialized");
}

init();

module.exports = { sequelize, User, Password, Order };
