import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const transactionTypes = [
    { name: 'DEPOSITO', nature: 'credito' },
    { name: 'RETIRO', nature: 'debito' },
    { name: 'RENDIMIENTO', nature: 'credito' },
    { name: 'PAGO', nature: 'debito' },
    { name: 'INTERES', nature: 'debito' },
    { name: 'MULTA', nature: 'debito' },
    { name: 'CUOTA PERIODICA', nature: 'debito' },
  ];

  for (const type of transactionTypes) {
    await prisma.transactionTypeDetail.create({
      data: type,
    });
  }

  console.log('Transaction types seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
