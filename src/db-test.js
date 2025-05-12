
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  try {
    // Test the connection
    await prisma.$connect();
    console.log('Successfully connected to the database!');
    
    // Create a test entry
    const entry = await prisma.formEntry.create({
      data: {
        answers: { test: "Hello Database!" }
      }
    });
    console.log('Created test entry:', entry);
    
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
