#!/usr/bin/env python3
"""
서버/로컬에서 DB 마이그레이션 적용.
backend 폴더에서: PYTHONPATH=. python scripts/run_migrate.py
DATABASE_URL은 backend/.env 또는 프로젝트 루트 .env 에서 읽습니다.
셸에 DATABASE_URL=postgresql://... (placeholder) 가 있으면 .env 값으로 덮어씁니다.
"""
import os
import sys

_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
os.chdir(_backend_dir)


def _load_env_file(path: str) -> dict:
    """Parse .env style file; return key=value for keys we care about."""
    out = {}
    if not os.path.isfile(path):
        return out
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, _, v = line.partition("=")
                    key = k.strip()
                    val = v.strip().strip('"').strip("'")
                    if key:
                        out[key] = val
    except Exception:
        pass
    return out


def _apply_env_before_import():
    """셸의 placeholder DATABASE_URL 이 있으면 .env 값으로 덮어써서, 이후 get_settings()가 올바른 값을 쓰게 함."""
    placeholder = "postgresql://..."
    current = os.environ.get("DATABASE_URL", "")
    if current != placeholder and current != "":
        return
    for rel in (".env", "../.env"):
        path = os.path.join(_backend_dir, rel)
        env = _load_env_file(path)
        url = env.get("DATABASE_URL", "").strip()
        if url and url != placeholder:
            os.environ["DATABASE_URL"] = url
            return


_apply_env_before_import()


def main():
    from alembic.config import Config
    from alembic import command

    alembic_cfg = Config(os.path.join(_backend_dir, "alembic.ini"))
    try:
        command.upgrade(alembic_cfg, "head")
        print("Migration completed: upgrade head")
    except Exception as e:
        print("Migration failed:", e, file=sys.stderr)
        print("Check DATABASE_URL in .env and that PostgreSQL is running.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
