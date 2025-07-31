import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsersStatus() {
  console.log('🔍 Verificando estado de usuarios en la base de datos...\n');
  
  try {
    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`📊 Total de usuarios encontrados: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios en la base de datos');
      console.log('💡 Es necesario crear al menos un usuario administrador\n');
      return { hasUsers: false, hasAdmin: false, users: [] };
    }

    // Verificar si existe un admin
    const adminUsers = users.filter(user => user.role === 'ADMIN');
    const activeAdmins = adminUsers.filter(user => user.isActive);

    console.log('👥 Usuarios encontrados:');
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      const roleIcon = user.role === 'ADMIN' ? '👑' : '👤';
      const statusIcon = user.isActive ? '✅' : '❌';
      
      console.log(`${index + 1}. ${roleIcon} ${user.username}`);
      console.log(`   Nombre: ${user.fullName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Estado: ${statusIcon} ${user.isActive ? 'Activo' : 'Inactivo'}`);
      console.log(`   Creado: ${user.createdAt.toLocaleDateString('es-CO')}`);
      console.log('');
    });

    console.log('📋 Resumen:');
    console.log(`   • Total usuarios: ${users.length}`);
    console.log(`   • Administradores: ${adminUsers.length}`);
    console.log(`   • Administradores activos: ${activeAdmins.length}`);
    console.log(`   • Usuarios regulares: ${users.filter(u => u.role === 'USER').length}\n`);

    if (activeAdmins.length === 0) {
      console.log('⚠️  NO HAY ADMINISTRADORES ACTIVOS');
      console.log('💡 Se recomienda crear un usuario administrador\n');
    } else {
      console.log('✅ Administradores activos encontrados');
    }

    return {
      hasUsers: users.length > 0,
      hasAdmin: activeAdmins.length > 0,
      users: users,
      adminUsers: activeAdmins
    };

  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
checkUsersStatus()
  .then((result) => {
    if (!result.hasAdmin) {
      console.log('🔧 Para crear un administrador, ejecuta:');
      console.log('   node --loader ts-node/esm create-admin.ts');
    }
  })
  .catch(console.error);
