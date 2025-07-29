# Test Server-Side Pong

## Instructions de débogage

### 1. Démarrer le serveur avec logs détaillés
```bash
npm run dev
```

### 2. Vérifier les endpoints API
```bash
# Test création de partie
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"mode": "solo"}'

# Lister les parties actives
curl http://localhost:3000/api/games
```

### 3. Tester WebSocket manuellement
Dans la console du navigateur sur http://localhost:3000/server-pong :

```javascript
// Test WebSocket
const ws = new WebSocket('ws://localhost:3000/ws/game/test-game?playerId=debug-player');

ws.onopen = () => {
    console.log('🟢 WebSocket connected');
    ws.send(JSON.stringify({
        type: 'playerInput',
        keys: { 'w': true }
    }));
};

ws.onmessage = (e) => {
    console.log('📨 Received:', JSON.parse(e.data));
};

ws.onclose = (e) => {
    console.log('❌ WebSocket closed:', e.code, e.reason);
};

ws.onerror = (e) => {
    console.log('❌ WebSocket error:', e);
};
```

### 4. Logs à surveiller côté serveur
- `🎮 Initializing Game Manager for Server-Side Pong...`
- `🔌 WebSocket connection attempt...`
- `🆕 Creating new game room...`
- `🎮 Server Pong game starting...`

### 5. Problèmes courants
- **SSL/TLS mismatch** : Force ws:// au lieu de wss://
- **GameManager non initialisé** : Vérifier que le serveur démarre complètement
- **Route WebSocket non enregistrée** : Vérifier les logs de démarrage
- **Connexion immédiate fermeture** : Problème de configuration Fastify WebSocket

### 6. Debug frontend
Dans la console sur /server-pong :
```javascript
// Voir l'état du jeu
window.debugGame = true;
```