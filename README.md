# 🕵️ Jogo do Espião - Backend

Backend do jogo presencial onde um jogador é o espião e deve descobrir o local secreto. Gerencia salas e distribui cartas para os jogadores.

## 🚀 Funcionalidades

- **Sistema de Salas**: Jogadores entram usando códigos únicos de sala
- **Distribuição Digital de Cartas**: Cada jogador visualiza sua carta no próprio dispositivo
- **Conexão em Tempo Real**: WebSocket para sincronização da distribuição das cartas
- **Locais Aleatórios**: Sistema de geração aleatória de locais para cada partida
- **Interface Responsiva**: Funciona em desktop e mobile


## 🛠️ Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** - Servidor web
- **Socket.IO** - Comunicação em tempo real

## 🔧 Instalação

1. **Instalar dependências**:
```bash
npm install
```

2. **Configurar ambiente**:
```bash
cp .env.example .env
```

3. **Configure o [FrontEnd](https://github.com/nahtanPNG/spy-game)**

4. **Rodar em desenvolvimento**:
```bash
npm run dev
```

O servidor vai rodar em `http://localhost:3001`

## 📁 Estrutura

```
src/
├── data/locations.ts     # Lista de locais do jogo
├── server/game-logic.ts  # Lógica principal
├── types/socket.ts       # Tipos TypeScript
└── index.ts             # Servidor principal
```

## 📡 Eventos WebSocket

### Cliente → Servidor
```javascript
// Entrar na sala
socket.emit("entrar-sala", { codigo, nome, isHost });

// Iniciar jogo (só host)
socket.emit("iniciar-jogo", codigo);

// Reiniciar jogo (só host)
socket.emit("reiniciar-jogo", codigo);

// Revelar carta
socket.emit("revelar-carta", codigo);
```

### Servidor → Cliente
```javascript
// Sala atualizada
socket.on("sala-atualizada", (sala) => { });

// Jogo iniciado
socket.on("jogo-iniciado", (sala) => { });

// Jogo reiniciado
socket.on("jogo-reiniciado", (sala) => { });

// Erro
socket.on("erro", (mensagem) => { });
```

## 🌐 API REST

- `GET /` - Status do servidor + estatísticas
- `GET /health` - Health check

## 🎲 Locais do Jogo

30 locais disponíveis: Avião, Banco, Praia, Hospital, Escola, Cinema, etc.

## ⚙️ Configuração

**.env**:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🐛 Reportar Bugs

Se você encontrar algum bug, por favor abra uma [issue](https://github.com/nahtanpng/spy-game-backend/issues) descrevendo:
- O que aconteceu
- O que você esperava que acontecesse
- Passos para reproduzir o bug
- Screenshots (se aplicável)

---

**Feito com ❤️ by [nahtanPNG](https://github.com/nahtanPNG)**

*Give this project a ⭐ if you found it helpful!*