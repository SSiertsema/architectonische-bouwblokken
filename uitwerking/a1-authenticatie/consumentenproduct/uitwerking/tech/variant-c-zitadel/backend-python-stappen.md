# FastAPI backend — Zitadel

Python 3.12 + FastAPI + Authlib + httpx. De FastAPI is een pure API: geen OIDC-flows, geen session-cookies, alleen Bearer-token-validatie van tokens uitgegeven door Zitadel. Beheer-operaties lopen via Zitadel's Management API met een service-account JWT-profile.

## Packages

```toml
# pyproject.toml
[project]
name = "pulso-api"
version = "1.0.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115",
  "uvicorn[standard]>=0.30",
  "gunicorn>=22.0",
  "authlib>=1.3",                # JWT-validatie + OIDC-clients
  "httpx>=0.27",                 # Management API
  "pydantic>=2.7",
  "pydantic-settings>=2.3",
  "structlog>=24.1",
  "redis>=5.0",                  # JWKS-cache + rate-limit
  "cryptography>=42",            # service-account JWT-profile ondertekening
  "python-jose[cryptography]>=3.3",  # alternatieve JWT-validator
  "asgi-correlation-id>=4.3",
]
```

Authlib is de route die Zitadel officieel aanbeveelt. `python-jose` houden we als optie voor handgerolde JWT-validatie als we fijnmazige controle willen.

## Project-layout

```
app/
├── main.py                        # FastAPI + middleware + routes
├── config.py                      # pydantic-settings
├── security/
│   ├── __init__.py
│   ├── jwks.py                    # JWKS-cache + key-lookup
│   ├── token.py                   # JWT-validatie + scope-enforcement
│   └── dependencies.py            # require_user, require_scope, require_acr
├── zitadel/
│   ├── __init__.py
│   ├── mgmt_client.py             # httpx-client naar Zitadel Management API
│   ├── service_account.py         # JWT-profile-assertion + token-exchange
│   └── events.py                  # event-consumer
├── routes/
│   ├── __init__.py
│   ├── workouts.py
│   ├── me.py                      # /me, /me/consents, /me/devices
│   ├── internal.py                # /internal/events, /internal/consent-log
│   └── webhooks.py                # /webhooks/zitadel-action
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── consent.py
└── observability/
    ├── __init__.py
    └── logging.py
```

## Config

```python
# app/config.py
from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Zitadel
    zitadel_issuer: HttpUrl                                   # https://pulso-eu.zitadel.cloud
    zitadel_project_id: str                                    # 123456789
    zitadel_api_aud: str = Field(alias="ZITADEL_API_AUD")      # project-ID voor audience-check
    zitadel_mgmt_key_file: str                                 # path naar service-account JSON-key
    zitadel_mgmt_org_id: str                                   # Pulso's primaire org-id

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # App
    environment: str = "production"
    internal_token: str                                        # voor /internal/* endpoints

settings = Settings()  # type: ignore
```

## JWKS-cache

```python
# app/security/jwks.py
import json
import time
import httpx
import redis.asyncio as redis
from authlib.jose import JsonWebKey, KeySet

from app.config import settings

JWKS_CACHE_KEY = "pulso:zitadel:jwks"
JWKS_TTL_SECONDS = 3600  # 1 uur

class JWKSCache:
    def __init__(self, redis_client: redis.Redis, http_client: httpx.AsyncClient):
        self._redis = redis_client
        self._http = http_client
        self._memory_cache: KeySet | None = None
        self._memory_cache_until: float = 0.0

    async def _fetch_remote(self) -> KeySet:
        # OIDC-discovery → jwks_uri
        disco = await self._http.get(f"{settings.zitadel_issuer}.well-known/openid-configuration")
        disco.raise_for_status()
        jwks_uri = disco.json()["jwks_uri"]
        resp = await self._http.get(jwks_uri)
        resp.raise_for_status()
        return JsonWebKey.import_key_set(resp.json())

    async def get(self, *, kid: str | None = None) -> KeySet:
        now = time.time()
        if self._memory_cache and now < self._memory_cache_until:
            if kid is None or self._memory_cache.find_by_kid(kid):
                return self._memory_cache

        raw = await self._redis.get(JWKS_CACHE_KEY)
        if raw:
            key_set = JsonWebKey.import_key_set(json.loads(raw))
            if kid is None or key_set.find_by_kid(kid):
                self._memory_cache = key_set
                self._memory_cache_until = now + 60  # korte memory-cache
                return key_set

        key_set = await self._fetch_remote()
        await self._redis.set(JWKS_CACHE_KEY, json.dumps(key_set.as_dict()), ex=JWKS_TTL_SECONDS)
        self._memory_cache = key_set
        self._memory_cache_until = now + 60
        return key_set
```

Force-refresh bij `kid`-miss voorkomt dat een tokens die tijdens een key-rotation is uitgegeven geweigerd wordt.

## JWT-validatie

```python
# app/security/token.py
from dataclasses import dataclass
from typing import Any
from authlib.jose import jwt, JoseError

from app.config import settings
from app.security.jwks import JWKSCache

@dataclass(frozen=True)
class ValidatedToken:
    sub: str
    email: str | None
    name: str | None
    scopes: set[str]
    acr: str | None
    amr: list[str]
    claims: dict[str, Any]

class TokenValidator:
    def __init__(self, jwks_cache: JWKSCache):
        self._jwks = jwks_cache

    async def validate(self, token: str) -> ValidatedToken:
        # Parse header voor kid voordat we JWKS ophalen
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        key_set = await self._jwks.get(kid=kid)

        try:
            claims = jwt.decode(
                token,
                key_set,
                claims_options={
                    "iss": {"essential": True, "value": str(settings.zitadel_issuer).rstrip("/")},
                    "aud": {"essential": True, "value": settings.zitadel_api_aud},
                    "exp": {"essential": True},
                    "nbf": {"essential": False},
                },
            )
            claims.validate()
        except JoseError as e:
            raise InvalidTokenError(str(e)) from e

        scope_str = claims.get("scope", "")
        scopes = set(scope_str.split()) if scope_str else set()

        return ValidatedToken(
            sub=claims["sub"],
            email=claims.get("email"),
            name=claims.get("name"),
            scopes=scopes,
            acr=claims.get("acr"),
            amr=claims.get("amr", []),
            claims=dict(claims),
        )

class InvalidTokenError(Exception):
    pass
```

Zitadel levert tokens **met een specifieke aud-claim als de scope `urn:zitadel:iam:org:project:id:{PROJECT_ID}:aud` is aangevraagd** — zonder die scope zou de token een algemene audience hebben. Pulso vraagt die scope daarom expliciet aan in de Nuxt en mobile clients.

## Dependencies voor routes

```python
# app/security/dependencies.py
from typing import Annotated, Iterable
from fastapi import Depends, Header, HTTPException, Request, status

from app.security.token import TokenValidator, ValidatedToken

async def get_validator(request: Request) -> TokenValidator:
    return request.app.state.token_validator

async def require_user(
    authorization: Annotated[str | None, Header()] = None,
    validator: Annotated[TokenValidator, Depends(get_validator)] = ...,
) -> ValidatedToken:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing_bearer")
    token = authorization.removeprefix("Bearer ").removeprefix("bearer ").strip()
    try:
        return await validator.validate(token)
    except Exception as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e)) from e

def require_scope(*required: str):
    async def dep(user: Annotated[ValidatedToken, Depends(require_user)]) -> ValidatedToken:
        missing = set(required) - user.scopes
        if missing:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"missing_scope:{','.join(missing)}")
        return user
    return dep

def require_acr(required: str):
    async def dep(user: Annotated[ValidatedToken, Depends(require_user)]) -> ValidatedToken:
        if user.acr != required:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "stepup_required",
                headers={"X-Stepup-Required": required},
            )
        return user
    return dep
```

## Route-voorbeelden

```python
# app/routes/workouts.py
from typing import Annotated
from fastapi import APIRouter, Depends

from app.security.token import ValidatedToken
from app.security.dependencies import require_scope

router = APIRouter(prefix="/workouts", tags=["workouts"])

@router.get("/recent")
async def list_recent(
    user: Annotated[ValidatedToken, Depends(require_scope("workouts.read"))],
    days: int = 7,
) -> dict:
    # ... query DB op user.sub ...
    return {"user": user.sub, "days": days, "workouts": []}

@router.post("")
async def create_workout(
    user: Annotated[ValidatedToken, Depends(require_scope("workouts.write"))],
    # body...
) -> dict:
    return {"created": True}
```

```python
# app/routes/me.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.security.token import ValidatedToken
from app.security.dependencies import require_user, require_acr
from app.zitadel.mgmt_client import ZitadelMgmtClient, get_mgmt_client

router = APIRouter(prefix="/me", tags=["me"])

class ConsentUpdate(BaseModel):
    functional: bool = True
    analytics: bool = False
    marketing: bool = False
    personalization: bool = False
    health_data: dict[str, bool] = {}
    third_party: dict[str, bool] = {}

@router.get("")
async def get_me(user: Annotated[ValidatedToken, Depends(require_user)]) -> dict:
    # Consents komen uit applicatie-DB (Aurora) o.b.v. user.sub
    consents = await consents_repo.find_by_sub(user.sub)
    return {
        "sub": user.sub,
        "email": user.email,
        "name": user.name,
        "consents": consents,
        "acr": user.acr,
    }

@router.patch("/consents")
async def update_consents(
    payload: ConsentUpdate,
    user: Annotated[ValidatedToken, Depends(require_user)],
    mgmt: Annotated[ZitadelMgmtClient, Depends(get_mgmt_client)],
) -> dict:
    # 1. Update in applicatie-DB (source of truth)
    await consents_repo.upsert(user.sub, payload.model_dump())

    # 2. Spiegel naar Zitadel user-metadata
    await mgmt.set_user_metadata(
        user_id=user.sub,
        key="consents",
        value=payload.model_dump(),
    )

    # 3. Audit-log
    await events_log.push({
        "event": "consent.updated",
        "user_id": user.sub,
        "consents": payload.model_dump(),
    })
    return {"ok": True}

@router.get("/devices", dependencies=[Depends(require_acr("urn:pulso:acr:stepped_up_recent"))])
async def list_devices(
    user: Annotated[ValidatedToken, Depends(require_user)],
    mgmt: Annotated[ZitadelMgmtClient, Depends(get_mgmt_client)],
) -> list[dict]:
    sessions = await mgmt.list_user_sessions(user.sub)
    return [device_view(s) for s in sessions]

@router.post("/devices/{session_id}/revoke",
             dependencies=[Depends(require_acr("urn:pulso:acr:stepped_up_recent"))])
async def revoke_device(
    session_id: str,
    user: Annotated[ValidatedToken, Depends(require_user)],
    mgmt: Annotated[ZitadelMgmtClient, Depends(get_mgmt_client)],
) -> dict:
    await mgmt.terminate_session(session_id)
    await events_log.push({
        "event": "device.revoked",
        "user_id": user.sub,
        "session_id": session_id,
    })
    return {"ok": True}

@router.post("/devices/revoke-all",
             dependencies=[Depends(require_acr("urn:pulso:acr:stepped_up_recent"))])
async def revoke_all_devices(
    user: Annotated[ValidatedToken, Depends(require_user)],
    mgmt: Annotated[ZitadelMgmtClient, Depends(get_mgmt_client)],
) -> dict:
    terminated = await mgmt.terminate_all_user_sessions(user.sub, except_current=True)
    return {"ok": True, "terminated": terminated}
```

## Zitadel Management API-client — service account met JWT-profile

Zitadel's Management API is per-organisatie. Authenticatie werkt met een **service-account** dat via **JWT-profile-assertion** (RFC 7523) een access-token haalt. De service-account krijgt in Zitadel één of meer **Management roles** (bijvoorbeeld `IAM_USER_WRITE`, `ORG_USER_WRITE`).

```python
# app/zitadel/service_account.py
import json
import time
from pathlib import Path

from authlib.jose import jwt
import httpx

from app.config import settings

class ServiceAccountTokenProvider:
    def __init__(self, key_file: str | Path, issuer: str, http: httpx.AsyncClient):
        with open(key_file, "r", encoding="utf-8") as f:
            key_json = json.load(f)
        self._user_id = key_json["userId"]
        self._key_id = key_json["keyId"]
        self._private_key = key_json["key"]  # PEM
        self._issuer = issuer.rstrip("/")
        self._http = http
        self._cached_token: str | None = None
        self._cached_until: float = 0.0

    def _build_assertion(self) -> str:
        now = int(time.time())
        claims = {
            "iss": self._user_id,
            "sub": self._user_id,
            "aud": self._issuer,
            "iat": now,
            "exp": now + 60,  # max 1 minuut geldig
        }
        header = {"alg": "RS256", "kid": self._key_id}
        return jwt.encode(header, claims, self._private_key).decode()

    async def get_token(self) -> str:
        now = time.time()
        if self._cached_token and now < self._cached_until - 30:
            return self._cached_token

        assertion = self._build_assertion()
        resp = await self._http.post(
            f"{self._issuer}/oauth/v2/token",
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": assertion,
                "scope": "openid urn:zitadel:iam:org:project:id:zitadel:aud",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        self._cached_token = data["access_token"]
        self._cached_until = now + data.get("expires_in", 3600)
        return self._cached_token
```

## Management API-client — user/sessions/metadata

```python
# app/zitadel/mgmt_client.py
from typing import Any
import httpx

from app.config import settings
from app.zitadel.service_account import ServiceAccountTokenProvider

class ZitadelMgmtClient:
    def __init__(self, http: httpx.AsyncClient, token_provider: ServiceAccountTokenProvider):
        self._http = http
        self._token = token_provider
        self._base = str(settings.zitadel_issuer).rstrip("/")
        self._org_id = settings.zitadel_mgmt_org_id

    async def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {await self._token.get_token()}",
            "x-zitadel-orgid": self._org_id,
            "Content-Type": "application/json",
        }

    async def set_user_metadata(self, user_id: str, key: str, value: Any) -> None:
        # REST: POST /management/v1/users/{user_id}/metadata/{key}
        import base64, json as _json
        encoded = base64.b64encode(_json.dumps(value).encode()).decode()
        r = await self._http.post(
            f"{self._base}/management/v1/users/{user_id}/metadata/{key}",
            headers=await self._headers(),
            json={"value": encoded},
        )
        r.raise_for_status()

    async def list_user_sessions(self, user_id: str) -> list[dict]:
        # v2 sessions resource-API
        r = await self._http.post(
            f"{self._base}/v2/sessions/search",
            headers=await self._headers(),
            json={
                "queries": [{"userIdsQuery": {"userIds": [user_id]}}],
            },
        )
        r.raise_for_status()
        return r.json().get("sessions", [])

    async def terminate_session(self, session_id: str) -> None:
        r = await self._http.delete(
            f"{self._base}/v2/sessions/{session_id}",
            headers=await self._headers(),
        )
        r.raise_for_status()

    async def terminate_all_user_sessions(self, user_id: str, *, except_current: bool = False) -> int:
        sessions = await self.list_user_sessions(user_id)
        terminated = 0
        for s in sessions:
            if except_current and s.get("is_current"):
                continue
            await self.terminate_session(s["id"])
            terminated += 1
        return terminated

    async def revoke_grant(self, user_grant_id: str) -> None:
        r = await self._http.post(
            f"{self._base}/management/v1/users/grants/{user_grant_id}/_deactivate",
            headers=await self._headers(),
        )
        r.raise_for_status()

# FastAPI dependency
async def get_mgmt_client(request: Any) -> ZitadelMgmtClient:
    return request.app.state.mgmt_client
```

## Bootstrap

```python
# app/main.py
from contextlib import asynccontextmanager
import httpx
import redis.asyncio as redis_asyncio
import structlog
from asgi_correlation_id import CorrelationIdMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.security.jwks import JWKSCache
from app.security.token import TokenValidator
from app.zitadel.mgmt_client import ZitadelMgmtClient
from app.zitadel.service_account import ServiceAccountTokenProvider
from app.routes import workouts, me, internal, webhooks

@asynccontextmanager
async def lifespan(app: FastAPI):
    # HTTP & Redis
    http = httpx.AsyncClient(timeout=10.0, http2=True)
    redis_client = redis_asyncio.from_url(settings.redis_url, encoding="utf-8", decode_responses=False)

    jwks_cache = JWKSCache(redis_client=redis_client, http_client=http)
    app.state.token_validator = TokenValidator(jwks_cache)

    token_provider = ServiceAccountTokenProvider(
        key_file=settings.zitadel_mgmt_key_file,
        issuer=str(settings.zitadel_issuer),
        http=http,
    )
    app.state.mgmt_client = ZitadelMgmtClient(http, token_provider)

    try:
        yield
    finally:
        await http.aclose()
        await redis_client.aclose()

app = FastAPI(title="Pulso API", lifespan=lifespan)

app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.pulso.com"],
    allow_credentials=False,  # Bearer-tokens, geen cookies
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

app.include_router(workouts.router, prefix="/workouts")  # duplicaat-vrij — router declareert zelf prefix
app.include_router(me.router)
app.include_router(internal.router, prefix="/internal")
app.include_router(webhooks.router, prefix="/webhooks")

@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}
```

## Zitadel Actions → webhook naar FastAPI

Zitadel's Actions kunnen bij belangrijke gebeurtenissen een webhook triggeren. Voor Pulso zijn interessant:

- `user.created` — Trust & Safety moet een welkomst-mail triggeren
- `session.created` / `session.terminated` — device-state updaten
- `password.changed` — deny-list-timestamp opnemen

```javascript
// Zitadel Action v2 (JS) — post-authentication
exports.postAuth = async (ctx, api) => {
  const userId = ctx.user.id;
  const event = {
    type: "post_auth",
    user_id: userId,
    session_id: ctx.session?.id,
    acr: ctx.amr.includes("mfa") ? "urn:pulso:acr:stepped_up_recent" : "urn:pulso:acr:password",
    timestamp: new Date().toISOString(),
  };
  await api.call("POST", "https://api.pulso.com/webhooks/zitadel-action", {
    headers: { Authorization: `Bearer ${ctx.secrets.PULSO_WEBHOOK_TOKEN}` },
    body: event,
  });
};
```

```python
# app/routes/webhooks.py
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from app.config import settings

router = APIRouter()

class ZitadelAction(BaseModel):
    type: str
    user_id: str
    session_id: str | None = None
    acr: str | None = None
    timestamp: str

@router.post("/zitadel-action")
async def zitadel_action(
    event: ZitadelAction,
    authorization: str = Header(default=""),
) -> dict:
    expected = f"Bearer {settings.internal_token}"
    if authorization != expected:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid_webhook_token")

    match event.type:
        case "post_auth":
            await events_log.push(event.model_dump())
        case "session.terminated":
            await events_log.push(event.model_dump())
            await cache.invalidate_user(event.user_id)
        # ... etc
    return {"ok": True}
```

## Deployment

- Base-image: `python:3.12-slim`
- ASGI-server: `gunicorn -k uvicorn.workers.UvicornWorker app.main:app -w 4 -b 0.0.0.0:8000`
- Private binnen de VPC; alleen bereikbaar vanuit de Nuxt-Nitro en mobile-clients (via ALB)
- Secrets via AWS Secrets Manager, geïnjecteerd bij pod-start
- `pulso-mgmt-key.json` (Zitadel service-account private key) in Secrets Manager, niet in container-image

## Testing

- **Unit-tests**: Authlib's `jwt.encode` om test-tokens te bakken die tegen een test-JWKS signen
- **Integration-tests**: `pytest` + `httpx.AsyncClient` tegen een Zitadel-test-instance of tegen `zitadel/zitadel:latest` container via `testcontainers-python`
- **Contract-tests**: vergelijk de Zitadel Management API-responses tegen opgeslagen fixtures

## Observability

- Structlog JSON-output met `asgi_correlation_id` voor request-tracing
- Custom middleware die duration + status-code + scope-checks logt
- Datadog APM via `ddtrace-run gunicorn ...` (of via OpenTelemetry)
- Belangrijke metrics: `token.validation.duration`, `token.validation.failure_rate`, `zitadel_mgmt.call.duration`, `jwks.cache.hit_rate`

## Waarom dit werkt

- **Pure API-rol** — geen sessies, geen cookies, alleen Bearer-token-validatie
- **JWKS-cache** — snelle validatie zonder rondje naar Zitadel per request
- **Service-account JWT-profile** — geen shared secret naar de Management API
- **Scope-enforcement per endpoint** — fijnmazig, gelinkt aan consent uit `06-consent-profielclaims.md`
- **ACR-check voor step-up** — gevoelige endpoints dwingen een verse MFA-authenticatie af
- **Webhook-ingestie** — real-time auth-events integreren in Pulso's logs zonder polling
