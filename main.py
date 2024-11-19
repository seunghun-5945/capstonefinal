from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from github import Github
from github.GithubException import GithubException
import httpx
import os
from dotenv import load_dotenv
import openai  # 상단에 import 추가

load_dotenv()

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React 앱의 URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI")
class CodeExchange(BaseModel):
    code: str

class FileUpdate(BaseModel):
    token: str
    repo_name: str
    file_path: str
    content: str
    branch: str
    commit_message: str  # 새로 추가된 필드

class FileCreate(BaseModel):
    token: str
    repo_name: str
    file_name: str
    content: str
    branch: str
    commit_message: str  # 새로 추가된 필드

class CodeComparison(BaseModel):
    original_code: str
    new_code: str

class GPTRequest(BaseModel):
    code: str
    current_code: str = ""  # 현재 에디터의 코드
    question: str = ""
    type: str = "simple"
    chat_history: list = []

def get_github_client(token: str):
    return Github(token)

@app.post("/api/github-login")
async def github_login(code_exchange: CodeExchange):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            params={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code_exchange.code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )
    
    if response.status_code == 200:
        data = response.json()
        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error_description"])
        return data
    else:
        raise HTTPException(status_code=response.status_code, detail="Failed to retrieve token")

@app.get("/api/user-repos")
async def get_user_repos(token: str):
    g = get_github_client(token)
    try:
        return [repo.name for repo in g.get_user().get_repos()]
    except GithubException as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/repo-contents")
async def get_repo_contents(token: str, repo_name: str, path: str = ""):
    g = get_github_client(token)
    try:
        repo = g.get_user().get_repo(repo_name)
        contents = repo.get_contents(path)
        return [{"name": content.name, "path": content.path, "type": content.type} for content in contents]
    except GithubException as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/file-content")
async def get_file_content(token: str, repo_name: str, file_path: str):
    g = get_github_client(token)
    try:
        repo = g.get_user().get_repo(repo_name)
        file_content = repo.get_contents(file_path)
        return {"content": file_content.decoded_content.decode()}
    except GithubException as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/update-file")
async def update_file(file_update: FileUpdate):
    g = get_github_client(file_update.token)
    try:
        repo = g.get_user().get_repo(file_update.repo_name)
        contents = repo.get_contents(file_update.file_path, ref=file_update.branch)
        repo.update_file(contents.path, file_update.commit_message, file_update.content, contents.sha, branch=file_update.branch)
        return {"message": "File updated successfully"}
    except GithubException as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/create-file")
async def create_file(file_create: FileCreate):
    g = get_github_client(file_create.token)
    try:
        repo = g.get_user().get_repo(file_create.repo_name)
        repo.create_file(file_create.file_name, file_create.commit_message, file_create.content, branch=file_create.branch)
        return {"message": "File created successfully"}
    except GithubException as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze-code-changes")
async def analyze_code_changes(comparison: CodeComparison):
    try:
        # 원본 코드와 새 코드를 라인 단위로 분리
        original_lines = comparison.original_code.splitlines()
        new_lines = comparison.new_code.splitlines()
        
        # 변경사항 분석
        changes = {
            "additions": [],
            "deletions": [],
            "modifications": []
        }
        
        # 간단한 diff 알고리즘 구현
        from difflib import SequenceMatcher
        matcher = SequenceMatcher(None, original_lines, new_lines)
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'insert':
                changes["additions"].extend({
                    "line": j,
                    "content": new_lines[j]
                } for j in range(j1, j2))
            elif tag == 'delete':
                changes["deletions"].extend({
                    "line": i,
                    "content": original_lines[i]
                } for i in range(i1, i2))
            elif tag == 'replace':
                changes["modifications"].extend({
                    "original_line": i,
                    "new_line": j,
                    "original_content": original_lines[i],
                    "new_content": new_lines[j]
                } for i, j in zip(range(i1, i2), range(j1, j2)))
        
        return {
            "status": "success",
            "changes": changes
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# OpenAI API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")
print(f"OpenAI API 키 설정됨: {'Yes' if openai.api_key else 'No'}")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.")

@app.post("/api/gpt-4o-mini")
async def process_gpt4o_mini(request: GPTRequest):
    try:
        if not openai.api_key:
            return {"answer": "OpenAI API 키가 설정되지 않았습니다."}

        client = openai.OpenAI()
        messages = [
            {
                "role": "system",
                "content": "당신은 프로그래밍과 IT 기술 분야의 전문가입니다. 다른 분야의 질문에는 절대 답변하지 마세요."
            }
        ]

        # 이전 대화 내용을 messages에 추가
        for chat in request.chat_history:
            role = "assistant" if not chat.get("isUser") else "user"
            messages.append({"role": role, "content": chat.get("text", "")})

        # 현재 질문 추가
        if request.type == "simple":
            if request.code.strip():
                current_prompt = f"""
다음 코드에 대한 질문에 답변해주세요:

코드:
{request.code}

질문:
{request.question}
"""
            else:
                current_prompt = request.question

            messages.append({"role": "user", "content": current_prompt})

            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000
                )
                
                answer = response.choices[0].message.content
                return {"answer": answer}
                
            except Exception as e:
                return {"answer": f"OpenAI API 오류: {str(e)}"}

        # optimize와 detailed 타입은 코드가 필수
        if not request.code:
            return {"answer": "코드를 입력해주세요."}

        try:
            if request.type == "optimize":
                prompt = f"""
다음 코드를 분석하고 최적화된 버전을 제안해주세요.
현재 코드와의 호환성을 고려하여 변경사항을 제안해주세요.

현재 코드:
{request.current_code}

최적화할 코드:
{request.code}

다음 형식으로 응답해주세요:
1. 변경사항 요약
2. 최적화된 코드 (```로 감싸서)
3. 각 변경사항에 대한 설명
"""
            else:  # detailed
                prompt = f"""
다음 코드를 자세히 분석하고 설명해주세요:

{request.code}

다음 항목들을 포함해서 설명해주세요:
1. 코드의 전반적인 목적과 주요 기능
2. 최적화된 부분들의 상세 설명
3. 성능 개선 포인트
4. 코드 가독성 향상 부분
5. 잠재적인 버그 예방 요소
6. 사용된 최신 문법이나 패턴
7. 추가 개선 가능성
"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "당신은 코드를 분석하고 설명하는 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            answer = response.choices[0].message.content
            return {"answer": answer}
            
        except Exception as e:
            return {"answer": f"OpenAI API 오류: {str(e)}"}
            
    except Exception as e:
        return {"answer": f"서버 오류: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    print("서버가 시작되었습니다. http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)