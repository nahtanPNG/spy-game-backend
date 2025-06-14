export interface Jogador {
  id: string;
  nome: string;
  carta: "espiao" | string;
  cartaRevelada: boolean;
  isHost: boolean;
  socketId: string;
}

export interface Sala {
  codigo: string;
  jogadores: Jogador[];
  local: string;
  espiao: string;
  status: "aguardando" | "em-jogo" | "finalizada";
  maxJogadores: number;
  criadaEm: Date;
}

// Eventos que o cliente pode enviar
export interface ClientToServerEvents {
  "entrar-sala": (data: {
    codigo: string;
    nome: string;
    isHost: boolean;
  }) => void;
  "iniciar-jogo": (codigo: string) => void;
  "reiniciar-jogo": (codigo: string) => void;
  "revelar-carta": (codigo: string) => void;
  "sair-sala": (codigo: string) => void;
  pong: () => void;
}

// Eventos que o servidor pode enviar
export interface ServerToClientEvents {
  "sala-atualizada": (sala: Sala) => void;
  "jogador-entrou": (jogador: Jogador) => void;
  "jogador-saiu": (jogadorId: string) => void;
  "jogo-iniciado": (sala: Sala) => void;
  "jogo-reiniciado": (sala: Sala) => void;
  "carta-revelada": (jogadorId: string) => void;
  ping: () => void;
  erro: (mensagem: string) => void;
  "sala-nao-encontrada": () => void;
}

// Estado interno do servidor
export interface InterServerEvents {
  ping: () => void;
}

// Dados anexados ao socket
export interface SocketData {
  jogadorId: string;
  codigoSala: string;
}
