import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types/socket";
import { GameLogic } from "./server/game-logic";

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const server = createServer(app);

// Configurar CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Configurar Socket.IO
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  transports: ["websocket", "polling"],
});

// Rota de health check
app.get("/", (req, res) => {
  const stats = GameLogic.obterEstatisticas();
  res.json({
    message: "Spy Game Server está rodando! 🎮",
    status: "online",
    timestamp: new Date().toISOString(),
    stats,
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Configurar eventos do Socket.IO
io.on("connection", (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Enviar ping periodicamente para manter conexão ativa
  const pingInterval = setInterval(() => {
    socket.emit("ping");
  }, 30000);

  // Responder ao pong do cliente
  socket.on("pong", () => {
    console.log(`💓 Pong recebido de ${socket.id}`);
  });

  // Evento: Entrar na sala
  socket.on("entrar-sala", ({ codigo, nome, isHost }) => {
    console.log(
      `🚪 ${nome} tentando entrar na sala ${codigo} (host: ${isHost})`
    );

    const sala = GameLogic.entrarSala(codigo, nome, socket.id, isHost);

    if (!sala) {
      console.log(`❌ Falha ao entrar na sala ${codigo} para ${nome}`);
      socket.emit(
        "erro",
        "Não foi possível entrar na sala. Verifique o código ou tente outro nome."
      );
      return;
    }

    // Adiciona o socket à room da sala
    socket.join(codigo);

    // Armazena dados no socket
    socket.data.codigoSala = codigo;
    socket.data.jogadorId =
      sala.jogadores.find((j) => j.socketId === socket.id)?.id || "";

    // Notifica todos na sala sobre a atualização
    io.to(codigo).emit("sala-atualizada", sala);

    // Notifica sobre o novo jogador (exceto para ele mesmo)
    const novoJogador = sala.jogadores.find((j) => j.socketId === socket.id);
    if (novoJogador) {
      socket.to(codigo).emit("jogador-entrou", novoJogador);
    }

    console.log(
      `✅ ${nome} entrou na sala ${codigo}. Total: ${sala.jogadores.length} jogadores`
    );
  });

  // Evento: Iniciar jogo
  socket.on("iniciar-jogo", (codigo) => {
    console.log(
      `🎯 Tentativa de iniciar jogo na sala ${codigo} por ${socket.id}`
    );

    const sala = GameLogic.iniciarJogo(codigo, socket.id);

    if (!sala) {
      socket.emit(
        "erro",
        "Não foi possível iniciar o jogo. Verifique se você é o host e se há jogadores suficientes."
      );
      return;
    }

    // Notifica todos na sala que o jogo começou
    io.to(codigo).emit("jogo-iniciado", sala);
    io.to(codigo).emit("sala-atualizada", sala);

    console.log(`🎮 Jogo iniciado na sala ${codigo}. Local: ${sala.local}`);
  });

  // Evento: Reiniciar jogo
  socket.on("reiniciar-jogo", (codigo) => {
    console.log(
      `🔄 Tentativa de reiniciar jogo na sala ${codigo} por ${socket.id}`
    );

    const sala = GameLogic.reiniciarJogo(codigo, socket.id);

    if (!sala) {
      socket.emit(
        "erro",
        "Não foi possível reiniciar o jogo. Verifique se você é o host e se há jogadores suficientes."
      );
      return;
    }

    io.to(codigo).emit("jogo-reiniciado", sala);
    io.to(codigo).emit("sala-atualizada", sala);

    console.log(
      `🔄 Jogo reiniciado na sala ${codigo}. Novo local: ${sala.local}`
    );
  });

  // Evento: Revelar carta
  socket.on("revelar-carta", (codigo) => {
    const { sala, jogador } = GameLogic.revelarCarta(codigo, socket.id);

    if (!sala || !jogador) {
      socket.emit("erro", "Não foi possível revelar a carta.");
      return;
    }

    // Notifica todos na sala sobre a carta revelada
    io.to(codigo).emit("carta-revelada", jogador.id);
    io.to(codigo).emit("sala-atualizada", sala);

    console.log(`🃏 ${jogador.nome} revelou sua carta na sala ${codigo}`);
  });

  // Evento: Sair da sala
  socket.on("sair-sala", (codigo) => {
    handleLeaveRoom(socket, codigo);
  });

  // Evento: Desconexão
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Cliente desconectado: ${socket.id} - Motivo: ${reason}`);

    clearInterval(pingInterval);

    if (socket.data.codigoSala) {
      handleLeaveRoom(socket, socket.data.codigoSala);
    }
  });

  // Função auxiliar para lidar com saída da sala
  function handleLeaveRoom(socket: any, codigo: string) {
    const { sala, jogadorRemovido } = GameLogic.sairSala(codigo, socket.id);

    socket.leave(codigo);

    if (jogadorRemovido) {
      if (sala) {
        // Notifica os outros jogadores
        io.to(codigo).emit("jogador-saiu", jogadorRemovido.id);
        io.to(codigo).emit("sala-atualizada", sala);
      }

      console.log(`👋 ${jogadorRemovido.nome} saiu da sala ${codigo}`);
    }
  }
});

// Limpeza periódica de salas antigas (executa a cada hora)
setInterval(() => {
  console.log("🧹 Executando limpeza de salas antigas...");
  GameLogic.limparSalasAntigas();

  const stats = GameLogic.obterEstatisticas();
  console.log(
    `📊 Stats - Salas: ${stats.totalSalas}, Jogadores: ${stats.totalJogadores}`
  );
}, 60 * 60 * 1000);

// Log de stats a cada 10 minutos
setInterval(() => {
  const stats = GameLogic.obterEstatisticas();
  if (stats.totalSalas > 0 || stats.totalJogadores > 0) {
    console.log(
      `📊 [${new Date().toLocaleTimeString()}] Salas ativas: ${
        stats.totalSalas
      }, Jogadores online: ${stats.totalJogadores}`
    );
  }
}, 10 * 60 * 1000);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 CORS configurado para: ${corsOptions.origin}`);
  console.log(`📡 Socket.IO configurado e pronto para conexões`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM recebido, encerrando servidor graciosamente...");
  server.close(() => {
    console.log("✅ Servidor encerrado");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT recebido, encerrando servidor graciosamente...");
  server.close(() => {
    console.log("✅ Servidor encerrado");
    process.exit(0);
  });
});
