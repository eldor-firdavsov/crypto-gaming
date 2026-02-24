import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import GameRoom from './GameRoom.js';

/* ── Server setup ─────────────────────────────────── */
const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

/* ── In-memory game rooms ─────────────────────────── */
const rooms = new Map(); // gameCode -> GameRoom

function genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
        code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (rooms.has(code));
    return code;
}

/* ── Health check ─────────────────────────────────── */
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        activeRooms: rooms.size,
        totalPlayers: [...rooms.values()].reduce((sum, r) => sum + r.players.length, 0),
    });
});

/* ── Socket.IO events ─────────────────────────────── */
io.on('connection', (socket) => {
    console.log(`[+] Connected: ${socket.id}`);

    let currentRoom = null;  // track which room this socket belongs to

    /* ── CREATE GAME ──────────────────────────────── */
    socket.on('create_game', ({ duration }, callback) => {
        const code = genCode();
        const room = new GameRoom(code, socket.id, duration || 3);
        rooms.set(code, room);
        currentRoom = code;

        socket.join(code);
        console.log(`[+] Room created: ${code} by ${socket.id}`);

        callback({
            success: true,
            gameCode: code,
            playerId: room.players[0].id,
            players: room.getPublicPlayers(),
        });
    });

    /* ── JOIN GAME ────────────────────────────────── */
    socket.on('join_game', ({ gameCode, nickname }, callback) => {
        const code = gameCode.toUpperCase();
        const room = rooms.get(code);

        if (!room) {
            callback({ success: false, error: 'Game not found' });
            return;
        }
        if (room.gameStarted) {
            callback({ success: false, error: 'Game already started' });
            return;
        }

        const player = room.addPlayer(socket.id, nickname);
        currentRoom = code;
        socket.join(code);

        console.log(`[+] ${nickname} joined room ${code}`);

        // Notify the joiner
        callback({
            success: true,
            playerId: player.id,
            password: player.password,
            players: room.getPublicPlayers(),
        });

        // Notify everyone else in the room
        socket.to(code).emit('player_joined', {
            players: room.getPublicPlayers(),
        });
    });

    /* ── START GAME ───────────────────────────────── */
    socket.on('start_game', (_, callback) => {
        const room = rooms.get(currentRoom);
        if (!room || room.hostSocketId !== socket.id) {
            callback?.({ success: false, error: 'Not authorized' });
            return;
        }

        room.start(io);

        // Send game_started to all players in the room
        io.to(currentRoom).emit('game_started', {
            timer: room.timer,
            players: room.getPublicPlayers(),
        });

        // Send first question to each non-host player
        room.players.forEach(p => {
            if (!p.isHost) {
                const q = room.getQuestionForPlayer(p.socketId);
                io.to(p.socketId).emit('next_question', q);
            }
        });

        callback?.({ success: true });
        console.log(`[▶] Game started in room ${currentRoom}`);
    });

    /* ── SUBMIT ANSWER ────────────────────────────── */
    socket.on('submit_answer', ({ answerIndex }, callback) => {
        const room = rooms.get(currentRoom);
        if (!room || room.gameOver) return;

        const result = room.submitAnswer(socket.id, answerIndex);
        callback(result);

        if (!result.correct) {
            // After wrong answer, advance question and send next one after client's 5s delay
            // Client will request next question after the lock period
        }
        // If correct, client will request reward box
    });

    /* ── ADVANCE QUESTION (after wrong answer lock or after reward) ── */
    socket.on('next_question_request', (_, callback) => {
        const room = rooms.get(currentRoom);
        if (!room || room.gameOver) return;

        room.advanceQuestion(socket.id);
        const q = room.getQuestionForPlayer(socket.id);
        callback?.(q);
        // Also emit so the client listener picks it up
        socket.emit('next_question', q);
    });

    /* ── PICK REWARD BOX ──────────────────────────── */
    socket.on('pick_box', (_, callback) => {
        const room = rooms.get(currentRoom);
        if (!room || room.gameOver) return;

        const reward = room.generateReward();

        if (reward === 'hack') {
            const hackData = room.setupHack(socket.id);
            if (hackData) {
                // Send hack setup to player (without the correct password)
                callback({
                    reward: 'hack',
                    hack: {
                        targetId: hackData.targetId,
                        targetNickname: hackData.targetNickname,
                        targetBitcoin: hackData.targetBitcoin,
                        options: hackData.options,
                    },
                });
                // Store the hack data temporarily on the socket for verification
                socket._currentHack = hackData;
            } else {
                // No valid targets — give nothing
                callback({ reward: 'nothing' });
            }
        } else {
            room.applyReward(socket.id, reward);
            const player = room.getPlayer(socket.id);
            callback({
                reward,
                bitcoin: player?.bitcoin || 0,
            });

            // Broadcast updated leaderboard
            io.to(currentRoom).emit('leaderboard_update', {
                leaderboard: room.getLeaderboard(),
            });
        }
    });

    /* ── HACK ATTEMPT ─────────────────────────────── */
    socket.on('hack_attempt', ({ targetId, guessedPassword }, callback) => {
        const room = rooms.get(currentRoom);
        if (!room || room.gameOver) return;

        const result = room.attemptHack(socket.id, targetId, guessedPassword);
        const player = room.getPlayer(socket.id);

        callback({
            success: result.success,
            stolen: result.stolen,
            bitcoin: player?.bitcoin || 0,
        });

        // Broadcast updated leaderboard
        io.to(currentRoom).emit('leaderboard_update', {
            leaderboard: room.getLeaderboard(),
        });

        // Notify the target they were hacked
        if (result.success) {
            const target = room.players.find(p => p.id === targetId);
            if (target) {
                io.to(target.socketId).emit('you_were_hacked', {
                    attackerNickname: player?.nickname,
                    stolen: result.stolen,
                    newBitcoin: target.bitcoin,
                });
            }
        }

        // Clean up hack data
        delete socket._currentHack;
    });

    /* ── REQUEST LEADERBOARD ──────────────────────── */
    socket.on('get_leaderboard', (_, callback) => {
        const room = rooms.get(currentRoom);
        if (!room) return;
        callback({ leaderboard: room.getLeaderboard() });
    });

    /* ── GET PLAYER BITCOIN ───────────────────────── */
    socket.on('get_my_bitcoin', (_, callback) => {
        const room = rooms.get(currentRoom);
        if (!room) return;
        const player = room.getPlayer(socket.id);
        callback?.({ bitcoin: player?.bitcoin || 0 });
    });

    /* ── DISCONNECT ───────────────────────────────── */
    socket.on('disconnect', () => {
        console.log(`[-] Disconnected: ${socket.id}`);

        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                const wasHost = room.hostSocketId === socket.id;
                room.removePlayer(socket.id);

                if (wasHost || room.players.length === 0) {
                    // Host left or room empty — destroy the room
                    room.destroy();
                    rooms.delete(currentRoom);
                    io.to(currentRoom).emit('room_closed', { reason: wasHost ? 'Host disconnected' : 'Room empty' });
                    console.log(`[x] Room destroyed: ${currentRoom}`);
                } else {
                    // Notify remaining players
                    io.to(currentRoom).emit('player_left', {
                        players: room.getPublicPlayers(),
                    });
                }
            }
        }
    });
});

/* ── Start ────────────────────────────────────────── */
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`\n  ⚡ CRYPTO HACK server running on port ${PORT}\n`);
});
