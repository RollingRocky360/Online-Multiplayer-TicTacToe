import asyncio
import json

from websockets import server
import websockets

GAMES = dict()

class Game:
    def __init__(self):
        self.p1 = self.p2 = None
        self.turn = -1
        self.moves = 0
        self.board = [[0]*3 for _ in range(3)]
    
    def make_move(self, x, y):
        self.board[x][y] = self.turn

    def check(self):
        for i, row in enumerate(self.board):
            if sum(row) in (3, -3):
                return i+1
        for i, col in enumerate(zip(*self.board)):
            if sum(col) in (3, -3):
                return i+4
        if sum(self.board[i][i] for i in range(3)) in (3, -3):
            return 7
        if sum(self.board[i][2-i] for i in range(3)) in (3, -3):
            return 8
        
        if self.moves == 9: return 0
        return -1
    
    def reset(self):
        self.p1 = self.p2 = None
        self.turn = -1
        self.moves = 0
        self.board = [[0]*3 for _ in range(3)]
        

async def handler(sock):
    async for msg in sock:
        event = json.loads(msg)
        print(event)
        if event['type'] == 'init':
            new_game_id = 1
            new_game = Game()
            new_game.p1 = sock
            GAMES[new_game_id] = new_game

            resp = {
                'type': 'init',
                'gameId': new_game_id,
            }
            await sock.send(json.dumps(resp))

        elif event['type'] == 'join':
            game_id = event['gameId']
            GAMES[game_id].p2 = sock

            resp = {
                'type': 'init',
                'gameId': game_id
            }
            await sock.send(json.dumps(resp))
        
        elif event['type'] == 'move':
            x, y = event['pos']
            game = GAMES[event['gameId']]
            game.make_move(x, y)
            turn = game.turn
            pattern = game.check()
            if pattern >= 1:
                resp = {'type': 'win', 'pos': [x, y], 'pattern': pattern, 'winner': ['X', -1] if turn < 0 else ['O', 1]}
            elif pattern == 0:
                resp = {'type': 'tie', 'pos': [x, y], 'player': ['X', -1] if turn < 0 else ['O', 1]}
            else:
                resp = {'type': 'move', 'pos': [x, y], 'player': ['X', -1] if turn < 0 else ['O', 1]}
            game.turn *= -1
            game.moves += 1

            websockets.broadcast((game.p1, game.p2), json.dumps(resp))


async def main():
    async with server.serve(handler, 'localhost', 8001):
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())

