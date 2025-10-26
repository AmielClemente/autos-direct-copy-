const connectionConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "12345678",
  database: process.env.DB_NAME || "autos-direct",
  port: process.env.DB_PORT || 3306
}

const jwtKey = process.env.JWT_SECRET || "1eb7749d60f260c775cd45591b055d3886e829ee3b90a230c472a672f097c63a06bb2df1228f294fe5e6c574acac920c878e48f6c6388f7a79444e8772b7792e40fdca343db62d9060874db7133b3fdcb3eaa85cac7f3f5f12eb216240a7ccc7f8900fec55996673d6619108942f4ff673ad6262aeb2a5815d6b5a30241463acd9d4cda8a9274d35b1a9385827988791d8b93bafd87ee900247c51584e7e0ef404782c93f6216ee189ee24c9b3ddfac32c59cf65f2482e0499bdf6ccfad44799dbb8fc93f13a8287b2a14f47b04d6d4dce2eb73dce005a287d9d56eeb600a1f0c762464dda00257575ad0ad2edd9b376d8263eb6fabc2483c9fbe47707019339";

module.exports = {connectionConfig, jwtKey};