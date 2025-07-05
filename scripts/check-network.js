#!/usr/bin/env node

// Script para verificar la configuración de red y DNS
const dns = require('dns');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('🌐 VERIFICACIÓN DE RED Y CONECTIVIDAD');
console.log('=' .repeat(60));

async function checkDNS() {
  console.log('\n📡 Verificando resolución DNS:');
  
  const hosts = [
    'rkgwkkss048ck00skskc08gs',
    'postgresql-database-rkgwkkss048ck00skskc08gs',
    'localhost',
    '127.0.0.1'
  ];
  
  for (const host of hosts) {
    try {
      const addresses = await util.promisify(dns.resolve4)(host);
      console.log(`✅ ${host} → ${addresses.join(', ')}`);
    } catch (error) {
      console.log(`❌ ${host} → No se puede resolver`);
    }
  }
}

async function checkNetwork() {
  console.log('\n🔍 Información de red del contenedor:');
  
  try {
    // Verificar hostname
    const { stdout: hostname } = await execPromise('hostname');
    console.log('Hostname:', hostname.trim());
    
    // Verificar IPs
    const { stdout: ifconfig } = await execPromise('ip addr show 2>/dev/null || ifconfig 2>/dev/null || echo "No network tools available"');
    const ipMatch = ifconfig.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/g);
    if (ipMatch) {
      console.log('IPs encontradas:', ipMatch.join(', '));
    }
    
    // Verificar /etc/hosts
    const { stdout: hosts } = await execPromise('cat /etc/hosts 2>/dev/null || echo "Cannot read /etc/hosts"');
    console.log('\n📄 Contenido de /etc/hosts:');
    console.log(hosts);
    
  } catch (error) {
    console.log('Error obteniendo información de red:', error.message);
  }
}

async function pingTest() {
  console.log('\n🏓 Pruebas de conectividad:');
  
  const hosts = [
    { host: 'rkgwkkss048ck00skskc08gs', port: 5432 },
    { host: 'postgresql-database-rkgwkkss048ck00skskc08gs', port: 5432 },
    { host: 'localhost', port: 5432 },
  ];
  
  for (const { host, port } of hosts) {
    try {
      const net = require('net');
      const client = new net.Socket();
      
      await new Promise((resolve, reject) => {
        client.setTimeout(3000);
        
        client.connect(port, host, () => {
          console.log(`✅ ${host}:${port} → Puerto abierto`);
          client.destroy();
          resolve();
        });
        
        client.on('error', (err) => {
          console.log(`❌ ${host}:${port} → ${err.message}`);
          reject(err);
        });
        
        client.on('timeout', () => {
          console.log(`❌ ${host}:${port} → Timeout`);
          client.destroy();
          reject(new Error('Timeout'));
        });
      }).catch(() => {}); // Ignorar errores para continuar con las otras pruebas
      
    } catch (error) {
      // Error ya logueado arriba
    }
  }
}

async function runNetworkDiagnostics() {
  await checkDNS();
  await checkNetwork();
  await pingTest();
  
  console.log('\n💡 ANÁLISIS:');
  console.log('Si no se puede resolver "rkgwkkss048ck00skskc08gs":');
  console.log('1. Los contenedores pueden no estar en la misma red de Docker');
  console.log('2. El nombre del servicio PostgreSQL puede ser diferente');
  console.log('3. Coolify puede usar un esquema de nombres diferente');
  
  console.log('\n🔧 POSIBLES SOLUCIONES:');
  console.log('1. En Coolify, verificar el nombre real del servicio PostgreSQL');
  console.log('2. Usar la IP interna del contenedor PostgreSQL en lugar del hostname');
  console.log('3. Verificar que ambos servicios estén en la misma red (network) de Docker');
}

runNetworkDiagnostics()
  .then(() => {
    console.log('\n✅ Diagnóstico de red completado');
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
  });