def print_diamond(n):
    # 위쪽 삼각형
    for i in range(n):
        print(' ' * (n - i - 1) + '*' * (2 * i + 1))
    
    # 아래쪽 삼각형
    for i in range(n - 2, -1, -1):
        print(' ' * (n - i - 1) + '*' * (2 * i + 1))

# 예시: n=5인 경우
print_diamond(5)