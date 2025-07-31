import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Lista de usuarios a crear
const usersData = [
  { fullName: 'YESSICA PAOLA GAONA', email: 'ygaonab@gmail.com', username: 'ygaona' },
  { fullName: 'GUSTAVO TABORDA', email: 'solinfo.gustavo@gmail.com', username: 'gtaborda' },
  { fullName: 'FRANCISCO SEPULVEDA', email: 'fj.sepulvedalopez@gmail.com', username: 'fsepulveda' },
  { fullName: 'NATHALIA PENAGOS', email: 'Nattymjpb@gmail.com', username: 'npenagos' },
  { fullName: 'WILLIAM ISAZA', email: 'wilisaza@gmail.com', username: 'wisaza' },
  { fullName: 'DIANA ARBOLEDA', email: 'dianitap177@gmail.com', username: 'darboleda' },
  { fullName: 'NICOLAY RIVERA', email: 'nicolayrivera@gmail.com', username: 'nrivera' },
  { fullName: 'ANDRES TRIVIÑO', email: 'a.trivino1992@gmail.com', username: 'atrivino' },
  { fullName: 'DANIELA AMARILES', email: 'damarilessiif@gmail.com', username: 'damariles' },
  { fullName: 'ANGEL ENCINALES', email: 'angel10arec@gmail.com', username: 'aencinales' },
  { fullName: 'FERNANDO MOLINA', email: 'visualiza@hotmail.com', username: 'fmolina' },
  { fullName: 'EDWIN VELASQUEZ', email: 'edwinveca@gmail.com', username: 'evelasquez' },
  { fullName: 'ANA MARIA VALENCIA', email: 'Anitavalencia75@gmail.com', username: 'avalencia' },
  { fullName: 'DANIEL BERNAL', email: 'daniel.bernal.c@gmail.com', username: 'dbernal' },
  { fullName: 'EDISON ORDOÑEZ', email: 'edisongiraldo@gmail.com', username: 'egiraldo' },
  { fullName: 'JAIRO CARRILLO', email: 'jamcarrillo@gmail.com', username: 'jcarrillo' },
  { fullName: 'JUAN FELIPE JARAMILLO', email: 'jufejaramillo@gmail.com', username: 'jjaramillo' },
  { fullName: 'ALIX GARZON', email: 'alixgarzon@gmail.com', username: 'agarzon' },
  { fullName: 'DANIELA VALENCIA', email: 'Danivalenciaballesteros5@gmail.com', username: 'dvalencia' },
  { fullName: 'DIEGO MESA', email: 'diegoa.mesav@gmail.com', username: 'dmesa' },
  { fullName: 'LUIS EDUARDO ESCANDON', email: 'escanduss732@gmail.com', username: 'lescandon' },
  { fullName: 'JUAN VALENTIN VALENCIA', email: 'juanv.solinfo@gmail.com', username: 'jvalencia' },
  { fullName: 'ELIAN GARCIA', email: 'emgarcia114@gmail.com', username: 'egarcia' },
  { fullName: 'FELIPE MARULANDA', email: 'felipemaru96@gmail.com', username: 'fmarulanda' },
  { fullName: 'JUAN DAVID PAVA', email: 'juan.solinfo@gmail.com', username: 'jpava' },
  { fullName: 'SANTIAGO MOLINA', email: 'santiago.solinfo@gmail.com', username: 'smolina' },
  { fullName: 'JOSE MIGUEL CABRERA', email: 'josemurcia9914@gmail.com', username: 'jcabrera' },
  { fullName: 'LUIS MAZUERA', email: 'luismazuera18@hotmail.com', username: 'lmazuera' },
  { fullName: 'WILLY DUSSAN', email: 'wdussan786@gmail.com', username: 'wdussan' },
  { fullName: 'ALEX DUSSAN', email: 'leyes1978@gmail.com', username: 'adussan' },
  { fullName: 'JORGE PELAEZ', email: 'joralpem@outlook.com', username: 'jpelaez' }
];

async function createUsers() {
  console.log('🚀 Iniciando creación masiva de usuarios...');
  
  let createdCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const userData of usersData) {
    try {
      // Verificar si el usuario ya existe por username o email
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        console.log(`⚠️  Usuario ${userData.username} ya existe (${existingUser.username}), omitiendo...`);
        skippedCount++;
        continue;
      }

      // Hashear la contraseña (username como contraseña inicial)
      const hashedPassword = await bcrypt.hash(userData.username, 10);

      // Crear el usuario
      const newUser = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          fullName: userData.fullName,
          email: userData.email,
          role: Role.USER, // Todos son usuarios regulares inicialmente
          isActive: true,
        },
      });

      console.log(`✅ Usuario creado: ${newUser.username} (${newUser.fullName})`);
      createdCount++;

    } catch (error) {
      const errorMsg = `❌ Error creando usuario ${userData.username}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  // Resumen final
  console.log('\n📊 RESUMEN DE CREACIÓN DE USUARIOS:');
  console.log(`✅ Usuarios creados exitosamente: ${createdCount}`);
  console.log(`⚠️  Usuarios omitidos (ya existían): ${skippedCount}`);
  console.log(`❌ Errores: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n🔍 DETALLES DE ERRORES:');
    errors.forEach(error => console.log(error));
  }

  console.log('\n🔑 NOTA IMPORTANTE:');
  console.log('Todos los usuarios creados tienen como contraseña inicial su username.');
  console.log('Los usuarios pueden cambiar su contraseña después del primer login.');
  
  console.log('\n📋 CREDENCIALES DE ACCESO:');
  usersData.forEach(user => {
    console.log(`Usuario: ${user.username} | Contraseña: ${user.username} | Email: ${user.email}`);
  });
}

async function main() {
  try {
    await createUsers();
  } catch (error) {
    console.error('💥 Error general:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔚 Proceso completado.');
  }
}

// Ejecutar directamente
main();

export { createUsers };
