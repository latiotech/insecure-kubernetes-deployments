const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("sqlite::memory:");

const User = sequelize.define("User", {
  username: DataTypes.STRING,
  email: DataTypes.STRING,
  target: DataTypes.JSON
});

const Password = sequelize.define("Password", {
  userId: DataTypes.INTEGER,
  hashedPassword: DataTypes.STRING
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

  console.log("Database initialized");
}

init();

module.exports = { sequelize, User, Password };