import pygame
import random

# 게임 설정
WIDTH, HEIGHT = 300, 600
BLOCK_SIZE = 30
ROWS, COLS = HEIGHT // BLOCK_SIZE, WIDTH // BLOCK_SIZE

# 색상 정의
SALMON = (250, 128, 114)  # 연어색
IVORY = (255, 255, 240)   # 상아색
PURPLE = (128, 0, 128)    # 보라색
COLORS = [SALMON, IVORY, PURPLE] + COLORS  # 기존 색상 목록에 추가어
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
COLORS = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 165, 0)]

# 테트로미노 클래스
class Tetromino:
    def __init__(self):
        self.shape = random.choice(self.shapes())
        self.color = random.choice(COLORS)
        self.x = COLS // 2 - len(self.shape[0]) // 2
        self.y = 0

    @staticmethod
    def shapes():
        return [
            [[1, 1, 1, 1]],  # I
            [[1, 1], [1, 1]],  # O
            [[0, 1, 0], [1, 1, 1]],  # T
            [[1, 1, 0], [0, 1, 1]],  # S
            [[0, 1, 1], [1, 1, 0]],  # Z
        ]

# 게임 클래스
class Tetris:
    def __init__(self):
        self.board = [[0 for _ in range(COLS)] for _ in range(ROWS)]
        self.tetromino = Tetromino()

    def draw_board(self, surface):
        for y in range(ROWS):
            for x in range(COLS):
                if self.board[y][x]:
                    pygame.draw.rect(surface, WHITE, (x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE))

    def draw_tetromino(self, surface):
        for y, row in enumerate(self.tetromino.shape):
            for x, value in enumerate(row):
                if value:
                    pygame.draw.rect(surface, self.tetromino.color, ((self.tetromino.x + x) * BLOCK_SIZE, (self.tetromino.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE))

    def run(self):
        pygame.init()
        screen = pygame.display.set_mode((WIDTH, HEIGHT))
        clock = pygame.time.Clock()
        running = True

        while running:
            screen.fill(BLACK)
            self.draw_board(screen)
            self.draw_tetromino(screen)
            pygame.display.flip()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False

            clock.tick(10)

        pygame.quit()

if __name__ == "__main__":
    Tetris().run()