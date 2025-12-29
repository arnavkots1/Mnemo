/**
 * Tunnel Setup for Backend
 * 
 * Creates a public tunnel URL for the backend server using localtunnel.
 * This allows the backend to be accessible from anywhere without needing
 * to configure IP addresses or firewall rules.
 */

import localtunnel from 'localtunnel';

const PORT = parseInt(process.env.PORT || '3000', 10);

export async function startTunnel(): Promise<string | null> {
  // Only start tunnel if USE_TUNNEL env var is set
  if (process.env.USE_TUNNEL !== 'true') {
    return null;
  }

  try {
    console.log('🌐 [Tunnel] Starting localtunnel...');
    
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: process.env.TUNNEL_SUBDOMAIN, // Optional: set TUNNEL_SUBDOMAIN for consistent URL
    });

    const tunnelUrl = tunnel.url;
    console.log('✅ [Tunnel] Tunnel created successfully!');
    console.log(`🌐 [Tunnel] Public URL: ${tunnelUrl}`);
    console.log(`📡 [Tunnel] API URL: ${tunnelUrl}/api`);
    console.log(`   💡 Set EXPO_PUBLIC_API_URL=${tunnelUrl}/api in your Expo app`);
    console.log(`   💡 Or update apiConfig.ts to use this URL`);

    // Handle tunnel close
    tunnel.on('close', () => {
      console.log('⚠️ [Tunnel] Tunnel closed');
    });

    // Handle errors
    tunnel.on('error', (err) => {
      console.error('❌ [Tunnel] Tunnel error:', err);
    });

    return tunnelUrl;
  } catch (error) {
    console.error('❌ [Tunnel] Failed to create tunnel:', error);
    console.log('   💡 Falling back to local IP address');
    return null;
  }
}

