// Script de diagnóstico detalhado da conexão MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const net = require('net');
const { URL } = require('url');

async function diagnoseConnection() {
  console.log('🔍 DIAGNÓSTICO DE CONEXÃO MONGODB\n');
  console.log('=' .repeat(50));
  
  // 1. Verificar variável de ambiente
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI não está definida no .env');
    process.exit(1);
  }
  
  console.log('✅ MONGO_URI encontrada');
  
  // 2. Parse da URI (ocultando senha)
  try {
    const parsedUri = mongoUri.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://$1:****@');
    console.log('📋 URI (senha oculta):', parsedUri);
    
    // Extrair host e porta
    const match = mongoUri.match(/mongodb:\/\/[^@]+@([^:]+):(\d+)/);
    if (match) {
      const host = match[1];
      const port = parseInt(match[2]);
      
      console.log(`\n🌐 Testando conectividade TCP para ${host}:${port}...`);
      
      // 3. Testar conexão TCP básica
      await new Promise((resolve, reject) => {
        const socket = net.createConnection({ host, port, timeout: 5000 });
        
        socket.on('connect', () => {
          console.log('✅ Conexão TCP estabelecida com sucesso!');
          socket.end();
          resolve();
        });
        
        socket.on('timeout', () => {
          console.error('❌ Timeout na conexão TCP (5s)');
          console.error('   Possíveis causas:');
          console.error('   - Firewall bloqueando a porta');
          console.error('   - MongoDB offline');
          console.error('   - IP não autorizado no MongoDB');
          socket.destroy();
          reject(new Error('TCP timeout'));
        });
        
        socket.on('error', (err) => {
          console.error('❌ Erro na conexão TCP:', err.message);
          console.error('   Possíveis causas:');
          console.error('   - Host incorreto ou inacessível');
          console.error('   - Porta incorreta');
          console.error('   - Rede bloqueada');
          reject(err);
        });
      });
      
      // 4. Testar conexão MongoDB
      console.log('\n🔐 Testando autenticação MongoDB...');
      
      mongoose.connection.on('connecting', () => {
        console.log('⏳ Iniciando conexão...');
      });
      
      mongoose.connection.on('connected', () => {
        console.log('✅ Conectado ao MongoDB!');
      });
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ Erro de conexão:', err.message);
      });
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      });
      
      console.log('✅ Autenticação bem-sucedida!');
      console.log('📊 Database:', mongoose.connection.db.databaseName);
      
      // 5. Testar operação básica
      console.log('\n📝 Testando operação de leitura...');
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('✅ Operação bem-sucedida!');
      console.log(`📁 ${collections.length} coleções encontradas:`, collections.map(c => c.name).join(', '));
      
      await mongoose.connection.close();
      console.log('\n' + '='.repeat(50));
      console.log('✅ DIAGNÓSTICO CONCLUÍDO - TUDO OK!');
      process.exit(0);
      
    } else {
      console.error('❌ Formato de URI inválido');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ DIAGNÓSTICO FALHOU');
    console.error('Erro:', error.message);
    console.error('\n💡 SUGESTÕES:');
    console.error('1. Verifique se o MongoDB está rodando no servidor');
    console.error('2. Confirme se o IP da sua máquina está autorizado');
    console.error('3. Teste a conexão diretamente com MongoDB Compass');
    console.error('4. Verifique firewall/regras de segurança');
    console.error('5. Confirme usuário e senha no .env');
    process.exit(1);
  }
}

diagnoseConnection();
